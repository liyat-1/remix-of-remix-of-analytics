import { AtSign, Clock, Home, Lock, MousePointerClick, Phone, Send, Sparkles } from "lucide-react";

import { fmt, money, type ConvertedModel, type OutcomeRow } from "@/lib/otaAnalytics";

const FIELD_ICON = { email: AtSign, phone: Phone, address: Home } as const;

const FIELD_TONE = {
  email: { chip: "bg-violet-50 text-violet-700 ring-violet-100", bar: "bg-violet-500" },
  phone: { chip: "bg-sky-50 text-sky-700 ring-sky-100", bar: "bg-sky-500" },
  address: { chip: "bg-teal-50 text-teal-700 ring-teal-100", bar: "bg-teal-500" },
} as const;

const OUTCOME_ICON: Record<string, typeof Clock> = {
  noEngage: Send,
  noInfo: MousePointerClick,
  expired: Clock,
  revoked: Lock,
};

/**
 * Converted insight — the one story this section has to tell:
 * reached → converted → booked direct, then masked → usable per field,
 * then a plain account of where the rest went.
 */
export function ConvertedInsightSection({ data }: { data: ConvertedModel }) {
  const {
    reached,
    convertedGuests,
    convertRate,
    notConverted,
    fields,
    conversions,
    bookingRate,
    revenue,
    outcomes,
  } = data;

  const campaign = outcomes.filter((o) => o.group === "campaign");
  const dataLost = outcomes.filter((o) => o.group === "data");
  const campaignTotal = campaign.reduce((a, b) => a + b.count, 0);
  const dataTotal = dataLost.reduce((a, b) => a + b.count, 0);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <header className="border-b border-slate-100 px-5 py-4">
        <h3 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-slate-900">
          <Sparkles size={16} className="shrink-0 text-slate-400" aria-hidden />
          From reached to booked
        </h3>
        <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-slate-500">
          Converting means turning a masked OTA value into a real, usable contact detail the hotel
          owns. Direct bookings follow from there.
        </p>
      </header>

      {/* Reached → converted → booked */}
      <div className="px-5 py-6">
        <div className="grid items-stretch gap-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)]">
          <FlowCard
            label="Guests reached"
            value={fmt(reached)}
            hint="Messaged at least once through the journey."
            tone="neutral"
          />
          <Connector caption={`${convertRate}%`} sub="converted" />
          <FlowCard
            label="Guests converted"
            value={fmt(convertedGuests)}
            hint="At least one masked value became usable."
            tone="accent"
          />
          <Connector caption={`${bookingRate}%`} sub="booked direct" />
          <FlowCard
            label="Direct bookings"
            value={fmt(conversions)}
            hint={`${money(revenue)} in direct revenue.`}
            tone="success"
          />
        </div>
      </div>

      {/* Masked → usable */}
      <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-6">
        <h4 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          Masked → usable, by contact detail
        </h4>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {fields.map((f) => {
            const Icon = FIELD_ICON[f.key];
            const tone = FIELD_TONE[f.key];
            return (
              <li
                key={f.key}
                className="rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-xl ring-4 ${tone.chip}`}
                  >
                    <Icon size={14} aria-hidden />
                  </span>
                  <p className="min-w-0 truncate text-[13px] font-semibold text-slate-900">
                    {f.label}
                  </p>
                </div>

                <div className="mt-4 flex items-end justify-between gap-3">
                  <span>
                    <span className="block text-[10.5px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                      Masked
                    </span>
                    <span className="mt-0.5 block text-[15px] font-medium tabular-nums text-slate-500">
                      {fmt(f.masked)}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block text-[10.5px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                      Usable
                    </span>
                    <span className="mt-0.5 block text-[24px] font-semibold leading-none tabular-nums tracking-tight text-slate-900">
                      {fmt(f.usable)}
                    </span>
                  </span>
                </div>

                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${tone.bar}`}
                    style={{ width: `${Math.min(100, f.rate)}%` }}
                  />
                </div>
                <p className="mt-2 text-[11.5px] tabular-nums text-slate-500">
                  <span className="font-semibold text-slate-700">{f.rate}%</span> of masked values
                  unmasked
                </p>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Where the rest went */}
      <div className="border-t border-slate-100 px-5 py-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h4 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Where the rest went
          </h4>
          <p className="text-[11.5px] tabular-nums text-slate-500">
            <span className="font-semibold text-slate-800">{fmt(notConverted)}</span> reached guests
            never converted
          </p>
        </div>

        <div
          className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
          role="img"
          aria-label="Split of guests that did not convert"
        >
          <div
            className="h-full bg-slate-400"
            style={{ width: `${(campaignTotal / Math.max(1, notConverted)) * 100}%` }}
          />
          <div
            className="h-full bg-amber-400"
            style={{ width: `${(dataTotal / Math.max(1, notConverted)) * 100}%` }}
          />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <OutcomeGroup
            swatch="bg-slate-400"
            title="Campaign outcome"
            note="Data was still usable — the guest simply didn't come through."
            rows={campaign}
            total={campaignTotal}
          />
          <OutcomeGroup
            swatch="bg-amber-400"
            title="OTA data availability"
            note="A lost opportunity rather than a campaign failure."
            rows={dataLost}
            total={dataTotal}
            tone="amber"
          />
        </div>
      </div>
    </section>
  );
}

function FlowCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone: "neutral" | "accent" | "success";
}) {
  const shell =
    tone === "accent"
      ? "border-indigo-200 bg-indigo-50/70"
      : tone === "success"
        ? "border-emerald-200 bg-emerald-50/70"
        : "border-slate-200 bg-slate-50/70";
  const number =
    tone === "accent" ? "text-indigo-900" : tone === "success" ? "text-emerald-900" : "text-slate-900";
  return (
    <div className={`rounded-xl border px-4 py-4 ${shell}`}>
      <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-slate-500">
        {label}
      </p>
      <p
        className={`mt-2 text-[30px] font-semibold leading-none tabular-nums tracking-tight ${number}`}
      >
        {value}
      </p>
      <p className="mt-2 text-[11.5px] leading-relaxed text-slate-500">{hint}</p>
    </div>
  );
}

function Connector({ caption, sub }: { caption: string; sub: string }) {
  return (
    <div className="flex items-center justify-center gap-2 lg:flex-col lg:gap-1 lg:px-1">
      <span className="text-[13px] font-semibold tabular-nums text-slate-700">{caption}</span>
      <span className="hidden h-8 w-px bg-slate-200 lg:block" aria-hidden />
      <span className="h-px w-8 bg-slate-200 lg:hidden" aria-hidden />
      <span className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-slate-400">
        {sub}
      </span>
    </div>
  );
}

function OutcomeGroup({
  swatch,
  title,
  note,
  rows,
  total,
  tone,
}: {
  swatch: string;
  title: string;
  note: string;
  rows: OutcomeRow[];
  total: number;
  tone?: "amber";
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-4 ${
        tone === "amber" ? "border-amber-200 bg-amber-50/50" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="flex items-center gap-2 text-[12.5px] font-semibold text-slate-800">
          <span className={`size-2.5 shrink-0 rounded-full ${swatch}`} aria-hidden />
          {title}
        </p>
        <p className="shrink-0 text-[13px] font-semibold tabular-nums text-slate-900">
          {fmt(total)}
        </p>
      </div>
      <p className="mt-1 text-[11.5px] leading-relaxed text-slate-500">{note}</p>

      <ul className="mt-3 divide-y divide-slate-100 border-t border-slate-100">
        {rows.map((r) => {
          const Icon = OUTCOME_ICON[r.key] ?? Send;
          return (
            <li key={r.key} className="flex items-start justify-between gap-3 py-2.5">
              <span className="flex min-w-0 items-start gap-2">
                <Icon size={13} className="mt-0.5 shrink-0 text-slate-400" aria-hidden />
                <span className="min-w-0">
                  <span className="block text-[12.5px] font-medium text-slate-800">{r.label}</span>
                  <span className="mt-0.5 block text-[11.5px] leading-relaxed text-slate-500">
                    {r.hint}
                  </span>
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-[13px] font-semibold tabular-nums text-slate-900">
                  {fmt(r.count)}
                </span>
                <span className="block text-[11px] tabular-nums text-slate-400">{r.pct}%</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
