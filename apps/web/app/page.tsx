import { CaseGrid } from "@/components/CaseGrid";
import { apiGet } from "@/lib/api";
import type { Case, Source } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [{ cases }, { sources }] = await Promise.all([
    apiGet<{ cases: Case[] }>("/cases?limit=100"),
    apiGet<{ sources: Source[] }>("/cases/sources"),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16">
      {cases.length === 0 ? (
        <p className="mt-8 text-slate-500">No cases yet.</p>
      ) : (
        <CaseGrid cases={cases} sources={sources} />
      )}
    </div>
  );
}
