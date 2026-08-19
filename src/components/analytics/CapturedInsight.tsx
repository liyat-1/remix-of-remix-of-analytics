import { AtSign, Home, Phone, ShieldCheck } from "lucide-react";

import { fmt, type CapturedModel } from "@/lib/otaAnalytics";

const FIELD_ICON = {
  email: AtSign,
  phone: Phone,
  address: Home,
} as const;

/** One accent per masked field — soft fills, saturated bars. */
const FIELD_TONE = {
  email: { chip: "bg-violet-50 text-violet-700", bar: "bg-violet-500", ring: "ring-violet-100" },
  phone: { chip: "bg-sky-50 text-sky-700", bar: "bg-sky-500", ring: "ring-sky-100" },
  address: { chip: "bg-teal-50 text-teal-700", bar: "bg-teal-500", ring: "ring-teal-100" },
} as const;

/**
 * Captured insight — profile completeness and masked-field coverage.
 * Every figure comes from `capturedModel`, so the ring, the counts and the
 * KPI cards above always agree.
 */
export function CapturedInsightSection({ data }: { data: CapturedModel }) {
  const { otaGuestsCaptured, masked, completeProfiles, incompleteProfiles, completenessPct, gaps } =
    data;
  const maxGap = Math.max(1, ...gaps.map((g) => g.count));

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <header className="flex flex-col gap-1 border-b border-slate-100 px-5 py-4">
        <h3 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-slate-900">
          <ShieldCheck size={16} className="shrink-0 text-slate-400" aria-hidden />
          Guest profile completeness
        </h3>
        <p className="max-w-2xl text-[12.5px] leading-relaxed text-slate-500">
          A captured profile is complete when the masked email, masked phone number and masked
          address are all present. Complete profiles are the ones worth converting.
        </p>
      </header>

      <div className="grid gap-0 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* Completeness ring */}
        <div className="flex flex-col items-center justify-center gap-5 border-b border-slate-100 bg-slate-50/60 px-5 py-8 lg:border-b-0 lg:border-r">
          <Ring percent={completenessPct} />
          <div className="w-full space-y-2">
            <Legend
              swatch="bg-indigo-500"
              label="Complete"
              value={fmt(completeProfiles)}
              percent={completenessPct}
            />
            <Legend
              swatch="bg-slate-200"
              label="Incomplete"
              value={fmt(incompleteProfiles)}
              percent={Math.round((100 - completenessPct) * 10) / 10}
            />
          </div>
          <p className="text-center text-[11.5px] leading-relaxed text-slate-500">
            of <span className="font-semibold text-slate-700">{fmt(otaGuestsCaptured)}</span> OTA
            guests captured
          </p>
        </div>

        {/* Masked coverage */}
        <div className="px-5 py-6">
          <h4 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Masked data we hold
          </h4>
          <ul className="mt-4 space-y-4">
            {masked.map((m) => {
              const Icon = FIELD_ICON[m.key];
              const tone = FIELD_TONE[m.key];
              return (
                <li key={m.key}>
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid size-8 shrink-0 place-items-center rounded-xl ring-4 ${tone.chip} ${tone.ring}`}
                    >
                      <Icon size={14} aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="truncate text-[13px] font-semibold text-slate-900">
                          {m.label}
                        </p>
                        <p className="shrink-0 text-[13px] font-semibold tabular-nums text-slate-900">
                          {fmt(m.count)}
                          <span className="ml-1.5 text-[11.5px] font-medium text-slate-400">
                            {m.pct}%
                          </span>
                        </p>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${tone.bar}`}
                          style={{ width: `${m.pct}%` }}
                        />
                      </div>
                      <p className="mt-1.5 text-[11.5px] text-slate-500">{m.hint}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Gaps */}
      <div className="border-t border-slate-100 px-5 py-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h4 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Why profiles are incomplete
          </h4>
          <p className="text-[11.5px] tabular-nums text-slate-500">
            <span className="font-semibold text-slate-800">{fmt(incompleteProfiles)}</span>{" "}
            incomplete profiles
          </p>
        </div>

        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {gaps.map((g) => {
            const tone = FIELD_TONE[g.key as keyof typeof FIELD_TONE] ?? FIELD_TONE.email;
            return (
              <li
                key={g.key}
                className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3.5 transition-colors hover:border-slate-300 hover:bg-white"
              >
                <p className="text-[12px] font-medium text-slate-600">{g.label}</p>
                <p className="mt-1.5 flex items-baseline gap-2">
                  <span className="text-[22px] font-semibold leading-none tabular-nums tracking-tight text-slate-900">
                    {fmt(g.count)}
                  </span>
                  <span className="text-[11.5px] font-medium tabular-nums text-slate-500">
                    {g.pct}% of incomplete
                  </span>
                </p>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80">
                  <div
                    className={`h-full rounded-full ${tone.bar}`}
                    style={{ width: `${(g.count / maxGap) * 100}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-[11.5px] leading-relaxed text-slate-400">
          A profile can be missing more than one field, so these figures overlap and do not add up
          to the total.
        </p>
      </div>
    </section>
  );
}

function Ring({ percent }: { percent: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid size-[148px] place-items-center">
      <svg viewBox="0 0 128 128" className="size-full -rotate-90" role="img" aria-label={`${percent}% complete profiles`}>
        <circle cx="64" cy="64" r={r} fill="none" stroke="#e2e8f0" strokeWidth="12" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke="#6366f1"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - percent / 100)}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-[34px] font-semibold leading-none tabular-nums tracking-tight text-slate-900">
          {percent}%
        </p>
        <p className="mt-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          complete
        </p>
      </div>
    </div>
  );
}

function Legend({
  swatch,
  label,
  value,
  percent,
}: {
  swatch: string;
  label: string;
  value: string;
  percent: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">
      <span className="flex min-w-0 items-center gap-2">
        <span className={`size-2.5 shrink-0 rounded-full ${swatch}`} aria-hidden />
        <span className="truncate text-[12.5px] font-medium text-slate-600">{label}</span>
      </span>
      <span className="shrink-0 text-[12.5px] font-semibold tabular-nums text-slate-900">
        {value}
        <span className="ml-1.5 text-[11px] font-medium text-slate-400">{percent}%</span>
      </span>
    </div>
  );
}
