import { fmt, type ProfileCompleteness as Data } from "@/lib/otaAnalytics";

/**
 * Guest Profile Completeness — how complete the guest profiles received from
 * OTA bookings are. A profile is complete when masked email, masked phone and
 * masked address are all present. Deliberately does NOT repeat the masked
 * email / phone / address totals shown by the primary Captured KPIs.
 */
export function ProfileCompletenessSection({ data }: { data: Data }) {
  const { total, complete, incomplete, completePct, missing } = data;
  const maxMissing = Math.max(1, ...missing.map((m) => m.count));

  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <header className="border-b border-slate-100 px-4 py-4 sm:px-5">
        <h3 className="text-[15px] font-semibold tracking-tight text-slate-900">
          Guest profile completeness
        </h3>
        <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-slate-500">
          See how complete the guest profiles received from OTA bookings are. A profile is complete
          when masked email, masked phone and masked address are all present.
        </p>
      </header>

      <div className="px-4 py-8 sm:px-5 sm:py-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Complete profiles
          </p>
          <p className="mt-3 text-[56px] font-semibold leading-none tabular-nums tracking-tight text-slate-900 sm:text-[72px]">
            {completePct}%
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-slate-500">
            {fmt(complete)} of {fmt(total)} OTA guests have all three core profile fields.
          </p>

          <div
            className="mt-8 flex h-3 w-full overflow-hidden rounded-full bg-slate-100"
            role="img"
            aria-label={`${completePct}% of OTA guest profiles are complete`}
          >
            <div className="h-full bg-slate-900" style={{ width: `${completePct}%` }} />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 text-left sm:grid-cols-2">
            <Legend swatch="bg-slate-900" value={fmt(complete)} label="Complete" />
            <Legend
              swatch="bg-slate-200"
              value={fmt(incomplete)}
              label="Incomplete"
              align="right"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 px-4 py-6 sm:px-5">
        <h4 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          Why are profiles incomplete?
        </h4>
        <ul className="mt-4 space-y-3.5">
          {missing.map((m) => (
            <li key={m.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-slate-800">{m.label}</p>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-slate-400"
                    style={{ width: `${(m.count / maxMissing) * 100}%` }}
                  />
                </div>
              </div>
              <span className="shrink-0 text-right text-[13px] tabular-nums text-slate-600">
                <span className="font-semibold text-slate-900">{fmt(m.count)}</span> guests
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[11.5px] leading-relaxed text-slate-400">
          A guest may be missing more than one profile field, so these figures overlap and do not
          add up to the total number of incomplete profiles.
        </p>
      </div>
    </section>
  );
}

function Legend({
  swatch,
  value,
  label,
  align,
}: {
  swatch: string;
  value: string;
  label: string;
  align?: "right";
}) {
  return (
    <div className={`flex items-center gap-2 ${align === "right" ? "sm:justify-end" : ""}`}>
      <span className={`size-2.5 shrink-0 rounded-sm ${swatch}`} aria-hidden />
      <span className="text-[13px] tabular-nums text-slate-600">
        <span className="font-semibold text-slate-900">{value}</span> {label}
      </span>
    </div>
  );
}
