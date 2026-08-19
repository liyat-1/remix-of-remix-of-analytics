import { ArrowDown, Clock, Lock } from "lucide-react";

import { fmt, type ConversionOpportunity as Data, type OutcomeRow } from "@/lib/otaAnalytics";

/**
 * Conversion Opportunity — what happened to the OTA guest data that was
 * available for conversion. Campaign / guest outcomes are kept strictly
 * separate from OTA data availability.
 */
export function ConversionOpportunitySection({ data }: { data: Data }) {
  const {
    flow,
    converted,
    notConverted,
    campaignOutcomes,
    campaignTotal,
    dataUnavailable,
    dataReasons,
  } = data;

  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <header className="border-b border-slate-100 px-4 py-4 sm:px-5">
        <h3 className="text-[15px] font-semibold tracking-tight text-slate-900">
          Conversion opportunity
        </h3>
        <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-slate-500">
          See what happened to the OTA guest data available for conversion — from masked OTA data
          through to a direct booking.
        </p>
      </header>

      {/* Flow */}
      <div className="px-4 py-8 sm:px-5">
        <ol className="mx-auto max-w-xl space-y-0">
          {flow.map((s, i) => (
            <li key={s.key}>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4">
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold text-slate-900">{s.label}</p>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-500">{s.hint}</p>
                </div>
                <span className="shrink-0 text-right">
                  <span className="block text-[16px] font-semibold tabular-nums text-slate-900">
                    {fmt(s.count)}
                  </span>
                  <span className="block text-[11px] tabular-nums text-slate-400">{s.pct}%</span>
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-slate-800" style={{ width: `${s.pct}%` }} />
              </div>
              {i < flow.length - 1 ? (
                <div className="flex justify-center py-3 text-slate-300" aria-hidden>
                  <ArrowDown size={14} />
                </div>
              ) : null}
            </li>
          ))}
        </ol>
        <p className="mx-auto mt-6 max-w-xl text-[11.5px] leading-relaxed text-slate-400">
          Not every piece of masked OTA information reaches the conversion stage.
        </p>
      </div>

      {/* Outcome */}
      <div className="border-t border-slate-100 px-4 py-6 sm:px-5">
        <h4 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          Conversion outcome
        </h4>

        <div className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          <Headline row={converted} tone="strong" />
          <Headline row={notConverted} />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Campaign / guest outcome
            </p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-slate-500">
              Guests whose data was still available, but who did not convert.
            </p>
            <ul className="mt-4 space-y-3">
              {campaignOutcomes.map((o) => (
                <OutcomeLine key={o.key} row={o} />
              ))}
            </ul>
            <p className="mt-3 border-t border-slate-100 pt-3 text-[12px] tabular-nums text-slate-500">
              Subtotal <span className="font-semibold text-slate-900">{fmt(campaignTotal)}</span>{" "}
              guests
            </p>
          </div>

          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              OTA data availability
            </p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-slate-500">
              Guest information that could no longer be used for conversion.
            </p>
            <ul className="mt-4 space-y-3">
              {dataReasons.map((o) => (
                <OutcomeLine key={o.key} row={o} icon={o.key === "expired" ? Clock : Lock} />
              ))}
            </ul>
            <p className="mt-3 border-t border-slate-100 pt-3 text-[12px] tabular-nums text-slate-500">
              Subtotal{" "}
              <span className="font-semibold text-slate-900">{fmt(dataUnavailable.count)}</span>{" "}
              guests
            </p>
          </div>
        </div>
      </div>

      {/* Data unavailable highlight */}
      <div className="border-t border-slate-100 bg-amber-50/60 px-4 py-7 sm:px-5">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="min-w-0">
            <h4 className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-amber-700">
              <Clock size={13} className="shrink-0" aria-hidden />
              Data unavailable for conversion
            </h4>
            <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-amber-900/80">
              Guest data that could not be converted because the OTA access window had expired or
              access was no longer available. This is a lost opportunity, not a campaign failure.
            </p>
          </div>
          <div className="shrink-0 sm:text-right">
            <p className="text-[34px] font-semibold leading-none tabular-nums tracking-tight text-amber-900">
              {fmt(dataUnavailable.count)}
            </p>
            <p className="mt-1 text-[12px] tabular-nums text-amber-800/80">
              guests · {dataUnavailable.pct}% of masked OTA data
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Headline({ row, tone }: { row: OutcomeRow; tone?: "strong" }) {
  return (
    <div className="min-w-0">
      <p className="text-[12.5px] font-medium text-slate-500">{row.label}</p>
      <p
        className={`mt-1 text-[28px] font-semibold leading-none tabular-nums tracking-tight ${
          tone === "strong" ? "text-slate-900" : "text-slate-500"
        }`}
      >
        {fmt(row.count)}
        <span className="ml-2 align-middle text-[12px] font-medium text-slate-400">{row.pct}%</span>
      </p>
      <p className="mt-2 text-[11.5px] leading-relaxed text-slate-500">{row.hint}</p>
    </div>
  );
}

function OutcomeLine({ row, icon: Icon }: { row: OutcomeRow; icon?: typeof Clock }) {
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-[13px] font-medium text-slate-800">
          {Icon ? <Icon size={13} className="shrink-0 text-slate-400" aria-hidden /> : null}
          <span className="min-w-0">{row.label}</span>
        </p>
        <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-500">{row.hint}</p>
      </div>
      <span className="shrink-0 text-right">
        <span className="block text-[13.5px] font-semibold tabular-nums text-slate-900">
          {fmt(row.count)}
        </span>
        <span className="block text-[11px] tabular-nums text-slate-400">{row.pct}%</span>
      </span>
    </li>
  );
}
