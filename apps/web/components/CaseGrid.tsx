"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Case, Source } from "@/lib/types";

function outcomeClass(outcome: string) {
  return outcome === "pending"
    ? "bg-amber-100 text-amber-800"
    : "bg-slate-100 text-slate-700";
}

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function groupByCase(sources: Source[]) {
  const byCase = new Map<number, Source[]>();
  for (const source of sources) {
    const list = byCase.get(source.case_id);
    if (list) list.unshift(source);
    else byCase.set(source.case_id, [source]);
  }
  return byCase;
}

function groupByYear(cases: Case[]) {
  const years = new Map<number, Case[]>();
  for (const item of cases) {
    const group = years.get(item.year);
    if (group) group.push(item);
    else years.set(item.year, [item]);
  }
  return [...years];
}

export function CaseGrid({
  cases,
  sources,
}: {
  cases: Case[];
  sources: Source[];
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<Case | null>(null);
  const sourcesByCase = useMemo(() => groupByCase(sources), [sources]);
  const selectedSources = selected
    ? (sourcesByCase.get(selected.id) ?? [])
    : [];

  useEffect(() => {
    if (selected) dialogRef.current?.showModal();
  }, [selected]);

  return (
    <>
      <div className="mt-8">
        {groupByYear(cases).map(([year, items]) => (
          <section
            key={year}
            aria-labelledby={`year-${year}`}
            className="md:grid md:grid-cols-[7rem_1fr]"
          >
            <h2
              id={`year-${year}`}
              className="sticky top-0 z-10 bg-white/90 py-3 text-2xl font-semibold backdrop-blur md:top-8 md:self-start md:bg-transparent md:py-0 md:text-3xl md:backdrop-blur-none"
            >
              {year}
            </h2>
            <div className="relative border-l-2 border-slate-200 pb-10 pl-4 md:pl-6">
              <span
                aria-hidden
                className="absolute top-2.5 -left-[7px] size-3  bg-brand ring-4 ring-white"
              />
              <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3">
                {items.map((item) => (
                  <li key={item.id} className="mb-4 break-inside-avoid">
                    <button
                      type="button"
                      onClick={() => setSelected(item)}
                      className="w-full cursor-pointer border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-brand hover:shadow-md focus-visible:outline-2 focus-visible:outline-brand"
                    >
                      <span className="block text-sm font-medium text-slate-700">
                        {item.company}
                      </span>
                      <span className="mt-2 block font-semibold">
                        {item.title}
                      </span>
                      <span className="mt-2 block text-lg font-semibold text-brand">
                        {item.amount_label}
                      </span>
                      <span className="mt-2 line-clamp-4 block text-sm text-slate-600">
                        {item.summary}
                      </span>
                      <span className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span
                          className={`rounded-full px-2 py-0.5 ${outcomeClass(item.outcome)}`}
                        >
                          {item.outcome}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
                          {item.category}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
                          {item.jurisdiction}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        onClose={() => setSelected(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        aria-labelledby="case-dialog-title"
        className="m-auto w-[calc(100%-2rem)] max-w-2xl bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-900/50"
      >
        {selected && (
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">
                  {selected.company} · {selected.year}
                </p>
                <h2
                  id="case-dialog-title"
                  className="mt-1 text-xl font-semibold"
                >
                  {selected.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                aria-label="Close"
                className="cursor-pointer rounded px-2 py-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                ✕
              </button>
            </div>

            <p className="mt-4 text-2xl font-semibold text-brand">
              {selected.amount_label}
            </p>

            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-slate-500">Country</dt>
              <dd>{selected.jurisdiction}</dd>
              <dt className="text-slate-500">Category</dt>
              <dd>{selected.category}</dd>
              <dt className="text-slate-500">Outcome</dt>
              <dd>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${outcomeClass(selected.outcome)}`}
                >
                  {selected.outcome}
                </span>
              </dd>
              {selected.status && (
                <>
                  <dt className="text-slate-500">Status</dt>
                  <dd>{selected.status}</dd>
                </>
              )}
            </dl>

            <p className="mt-4 text-slate-700">{selected.summary}</p>

            <h3 className="mt-6 text-sm font-semibold text-slate-500">
              Sources
            </h3>
            {selectedSources.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                No sources recorded for this case.
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-slate-200 border-y border-slate-200 text-sm">
                {selectedSources.map((source) => (
                  <li key={source.url}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-baseline justify-between gap-4 py-2 hover:text-brand"
                    >
                      <span className="font-medium">{source.label}</span>
                      <span className="shrink-0 text-xs text-slate-500">
                        {hostname(source.url)} ↗
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}
