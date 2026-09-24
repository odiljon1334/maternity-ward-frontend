import Anthropic from "@anthropic-ai/sdk";
import { tools } from "@/app/lib/agent/tools";
import { toolHandlers } from "@/app/lib/agent/tool-handlers";
import { SYSTEM_PROMPT } from "@/app/lib/agent/system-prompt";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";
const MAX_MESSAGES = 12;
const MAX_MESSAGE_CHARS = 4_000;
const MAX_REQUESTS_PER_MINUTE = 12;
// Bitta so'rovda model <-> tool aylanishlari chegarasi (cheksiz loop va
// xarajatning oldini olish)
const MAX_TOOL_ROUNDS = 6;
// Modelga qaytariladigan bitta tool natijasi hajmi (token xarajati)
const MAX_TOOL_RESULT_CHARS = 60_000;
// AI agent — faqat rahbar rollari uchun
const AGENT_ROLES = new Set(["SUPER_ADMIN", "ASSISTANT_ADMIN", "DIRECTOR", "ADMIN"]);
const requestWindows = new Map<string, number[]>();

// Agent hozircha faqat o'qish/preview amallarini bajaradi. Jadval yoki shift
// kabi o'zgartirishlar UI'dagi tasdiqlangan oqim orqali qilinadi; modelga
// bunday huquq berish prompt-injection uchun keraksiz xavf tug'diradi.
const READ_ONLY_TOOLS = new Set([
  "get_employees",
  "get_employee",
  "get_attendance_daily",
  "get_attendance_employee",
  "get_schedule_monthly",
  "get_schedule_employee",
  "get_shifts",
  "get_payroll_list",
  "get_payroll_employee",
  "preview_payroll",
  "get_dashboard_overview",
  "get_dashboard_analytics",
  "get_leave_requests",
  "get_employees_on_leave",
  "get_departments",
]);
const agentTools = tools.filter((tool) => READ_ONLY_TOOLS.has(tool.name));

export async function POST(req: Request) {
  const authorization = req.headers.get("authorization");
  const cookie = req.headers.get("cookie");
  const authHeaders: Record<string, string> | null = authorization?.startsWith("Bearer ")
    ? { Authorization: authorization }
    : cookie
      ? { Cookie: cookie }
      : null;
  if (!authHeaders) return Response.json({ error: "Autentifikatsiya talab qilinadi" }, { status: 401 });

  const clientId = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",").pop()?.trim() || "unknown";
  const now = Date.now();
  const recent = (requestWindows.get(clientId) || []).filter((at) => now - at < 60_000);
  if (recent.length >= MAX_REQUESTS_PER_MINUTE) {
    return Response.json({ error: "AI agent uchun so'rov limiti tugadi. Bir daqiqadan keyin urinib ko'ring." }, { status: 429 });
  }
  recent.push(now);
  if (requestWindows.size > 10_000) requestWindows.clear();
  requestWindows.set(clientId, recent);

  // Tokenni backend orqali tekshiramiz; client body'dan keladigan token yoki
  // role ma'lumotlariga hech qachon ishonilmaydi.
  const profile = await fetch(`${API_BASE}/auth/profile`, {
    headers: authHeaders,
    cache: "no-store",
  });
  if (!profile.ok) return Response.json({ error: "Session yaroqsiz yoki muddati tugagan" }, { status: 401 });
  let role: string | undefined;
  let userKey: string | undefined;
  try {
    const pj = (await profile.json()) as { data?: { role?: string; id?: string }; role?: string; id?: string };
    role = pj.data?.role ?? pj.role;
    userKey = pj.data?.id ?? pj.id;
  } catch {
    role = undefined;
  }
  if (!role || !AGENT_ROLES.has(role)) {
    return Response.json({ error: "AI agent faqat rahbarlar uchun" }, { status: 403 });
  }
  // Limit foydalanuvchi bo'yicha ham (bitta IP ortida bir nechta xodim bo'lishi mumkin)
  if (userKey) {
    const key = `u:${userKey}`;
    const userRecent = (requestWindows.get(key) || []).filter((at) => now - at < 60_000);
    if (userRecent.length >= MAX_REQUESTS_PER_MINUTE) {
      return Response.json({ error: "AI agent uchun so'rov limiti tugadi. Bir daqiqadan keyin urinib ko'ring." }, { status: 429 });
    }
    userRecent.push(now);
    requestWindows.set(key, userRecent);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Noto'g'ri so'rov formati" }, { status: 400 });
  }
  const rawMessages = (body as { messages?: unknown }).messages;
  if (!Array.isArray(rawMessages) || rawMessages.length === 0 || rawMessages.length > MAX_MESSAGES) {
    return Response.json({ error: "Xabarlar soni ruxsat etilgan chegaradan tashqarida" }, { status: 400 });
  }
  const messages: { role: "user" | "assistant"; content: string }[] = [];
  for (const message of rawMessages) {
    if (
      !message ||
      typeof message !== "object" ||
      !["user", "assistant"].includes((message as { role?: unknown }).role as string) ||
      typeof (message as { content?: unknown }).content !== "string" ||
      (message as { content: string }).content.length > MAX_MESSAGE_CHARS
    ) {
      return Response.json({ error: "Xabar formati yoki hajmi noto'g'ri" }, { status: 400 });
    }
    messages.push({
      role: (message as { role: "user" | "assistant" }).role,
      content: (message as { content: string }).content,
    });
  }

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        if (!closed)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const history: Anthropic.MessageParam[] = [...messages];

        // Agentic loop — ko'pi bilan MAX_TOOL_ROUNDS marta tool chaqiriladi
        for (let round = 0; ; round++) {
          if (round > MAX_TOOL_ROUNDS) {
            send({
              type: "error",
              message: "So'rov juda murakkab — savolni aniqroq yoki qismlarga bo'lib bering.",
            });
            break;
          }
          const response = await client.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 4096,
            system: SYSTEM_PROMPT,
            tools: agentTools,
            messages: history,
            stream: true,
          });

          const assistantContent: Anthropic.ContentBlock[] = [];
          let currentTool: { id: string; name: string } | null = null;
          let inputBuffer = "";
          let stopReason = "";

          for await (const event of response) {
            if (event.type === "content_block_start") {
              if (event.content_block.type === "tool_use") {
                currentTool = { id: event.content_block.id, name: event.content_block.name };
                inputBuffer = "";
                send({ type: "tool_start", toolName: event.content_block.name });
              }
              if (event.content_block.type === "text") {
                assistantContent.push({ type: "text", text: "", citations: [] });
              }
            }

            if (event.type === "content_block_delta") {
              if (event.delta.type === "text_delta") {
                const last = assistantContent[assistantContent.length - 1];
                if (last?.type === "text") last.text += event.delta.text;
                send({ type: "text", delta: event.delta.text });
              }
              if (event.delta.type === "input_json_delta") {
                inputBuffer += event.delta.partial_json;
              }
            }

            if (event.type === "content_block_stop" && currentTool) {
              const toolBlock = {
                type: "tool_use",
                id: currentTool.id,
                name: currentTool.name,
                input: JSON.parse(inputBuffer || "{}"),
              } as Anthropic.ToolUseBlock;
              assistantContent.push(toolBlock);
              currentTool = null;
            }

            if (event.type === "message_delta") {
              stopReason = event.delta.stop_reason ?? "";
            }
          }

          history.push({ role: "assistant", content: assistantContent } as Anthropic.MessageParam);

          // Tool use yo'q — tugadik
          if (stopReason !== "tool_use") {
            send({ type: "done" });
            break;
          }

          // Tool'larni parallel bajaramiz
          const toolUseBlocks = assistantContent.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
          );

          const toolResults = await Promise.all(
            toolUseBlocks.map(async (tu) => {
              let result: unknown;
              try {
                const handler = READ_ONLY_TOOLS.has(tu.name) ? toolHandlers[tu.name] : undefined;
                result = handler ? await handler(tu.input, authHeaders) : { error: "Handler topilmadi" };
              } catch (error: unknown) {
                result = {
                  error: error instanceof Error ? error.message : "Noma'lum xatolik",
                };
              }
              send({ type: "tool_result", toolName: tu.name, result });
              let content = JSON.stringify(result) ?? "null";
              if (content.length > MAX_TOOL_RESULT_CHARS) {
                content =
                  content.slice(0, MAX_TOOL_RESULT_CHARS) +
                  '..."[natija qisqartirildi — filtr yoki sahifalashdan foydalaning]"';
              }
              return {
                type: "tool_result" as const,
                tool_use_id: tu.id,
                content,
              };
            })
          );

          history.push({ role: "user", content: toolResults } as Anthropic.MessageParam);
        }
      } catch (error: unknown) {
        send({
          type: "error",
          message: error instanceof Error ? error.message : "AI xizmati xatosi",
        });
      } finally {
        closed = true;
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
