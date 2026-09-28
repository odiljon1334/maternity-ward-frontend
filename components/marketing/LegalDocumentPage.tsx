import Link from "next/link";
import { Activity, ArrowLeft, Mail, Send } from "lucide-react";
import { SUPPORT_BOT_URL, SUPPORT_BOT_USERNAME, SUPPORT_OPERATOR_URL, SUPPORT_OPERATOR_USERNAME } from "@/lib/contacts";

export type LegalSection = {
  title: string;
  paragraphs?: string[];
  items?: string[];
};

export function LegalDocumentPage({
  title,
  summary,
  updatedAt,
  sections,
}: {
  title: string;
  summary: string;
  updatedAt: string;
  sections: LegalSection[];
}) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5 font-extrabold tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Activity className="h-5 w-5" />
            </span>
            StaffPlusPRO
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-700">
            <ArrowLeft className="h-4 w-4" /> Bosh sahifa
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">StaffPlusPRO hujjati</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-[15px] leading-7 text-slate-600">{summary}</p>
          <p className="mt-4 text-xs font-semibold text-slate-400">Oxirgi yangilanish: {updatedAt}</p>

          <div className="mt-10 space-y-9">
            {sections.map((section, index) => (
              <section key={section.title} aria-labelledby={`legal-${index}`}>
                <h2 id={`legal-${index}`} className="text-xl font-extrabold tracking-tight">
                  {index + 1}. {section.title}
                </h2>
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph} className="mt-3 text-sm leading-7 text-slate-600">
                    {paragraph}
                  </p>
                ))}
                {section.items?.length ? (
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">
                    {section.items.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>

          <aside className="mt-10 rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
            <h2 className="font-extrabold text-indigo-950">Savol yoki murojaat</h2>
            <p className="mt-2 text-sm leading-6 text-indigo-900/75">
              Muassasa administratori orqali yoki StaffPlusPRO yordam xizmatiga murojaat qiling.
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
              <a href={SUPPORT_OPERATOR_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-white">
                <Send className="h-4 w-4" /> @{SUPPORT_OPERATOR_USERNAME}
              </a>
              <a href={SUPPORT_BOT_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-indigo-700">
                <Mail className="h-4 w-4" /> @{SUPPORT_BOT_USERNAME}
              </a>
            </div>
          </aside>
        </div>
      </article>
    </main>
  );
}
