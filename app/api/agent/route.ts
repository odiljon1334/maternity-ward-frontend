import Anthropic from "@anthropic-ai/sdk";
import { tools } from "@/app/lib/agent/tools";
import { toolHandlers } from "@/app/lib/agent/tool-handlers";
import { SYSTEM_PROMPT } from "@/app/lib/agent/system-prompt";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type AnyBlock = any;

export async function POST(req: Request) {
  const { messages, token } = await req.json();

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        if (!closed)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        console.log("▶ Agent boshlandi");
        let history = [...messages];
          console.log("Agent so'rov keldi, messages:", history.length);
          console.log("Token bor:", !!token);

        // Agentic loop
        while (true) {
          console.log("▶ Anthropic ga so'rov yuborilmoqda...");
          const response = await client.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 4096,
            system: SYSTEM_PROMPT,
            tools,
            messages: history,
            stream: true,
          });

          let assistantContent: Anthropic.ContentBlock[] = [];
          let currentTool: { id: string; name: string } | null = null;
          let inputBuffer = "";
          let stopReason = "";

          console.log("▶ Stream boshlandi");
          for await (const event of response) {
            console.log("EVENT:", event.type);
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
              const toolBlock: AnyBlock = {
                type: "tool_use",
                id: currentTool.id,
                name: currentTool.name,
                input: JSON.parse(inputBuffer || "{}"),
              };
              assistantContent.push(toolBlock);
              currentTool = null;
            }

            if (event.type === "message_delta") {
              stopReason = event.delta.stop_reason ?? "";
            }
          }

          history.push({ role: "assistant", content: assistantContent });

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
              let result: any;
              try {
                const handler = toolHandlers[tu.name];
                result = handler ? await handler(tu.input, token) : { error: "Handler topilmadi" };
              } catch (e: any) {
                result = { error: e.message };
              }
              send({ type: "tool_result", toolName: tu.name, result });
              return {
                type: "tool_result" as const,
                tool_use_id: tu.id,
                content: JSON.stringify(result),
              };
            })
          );

          history.push({ role: "user", content: toolResults });
        }
      } catch (e: any) {
        send({ type: "error", message: e.message });
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
