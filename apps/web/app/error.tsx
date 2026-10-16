'use client';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-16">
      <h1 className="text-3xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-slate-600">The page could not be loaded. Is the API running?</p>
      <button type="button" onClick={reset} className="mt-6 rounded bg-brand px-4 py-2 text-white hover:bg-brand-hover">
        Try again
      </button>
    </div>
  );
}
