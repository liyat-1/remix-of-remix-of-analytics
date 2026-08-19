/**
 * OTA Analytics — the reporting model behind the OTA Buster analytics page.
 *
 * Two distinct concepts, never conflated:
 *   CAPTURED  — guest contact data obtained from OTA guests (unmasked email,
 *               phone, address). Masked OTA emails are NOT captured emails.
 *   CONVERTED — OTA guests that became direct guests, and the revenue impact.
 *
 * Every number is derived from one authoritative base set, scaled by period,
 * so the page can never contradict itself.
 */

export type AnalyticsPeriod = "7d" | "15d" | "30d" | "90d" | "custom";

export const ANALYTICS_PERIODS: { value: AnalyticsPeriod; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "15d", label: "Last 15 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "custom", label: "Custom range" },
];

const FACTOR: Record<AnalyticsPeriod, number> = {
  "7d": 0.24,
  "15d": 0.5,
  "30d": 1,
  "90d": 2.65,
  custom: 1.62,
};

const scale = (n: number, p: AnalyticsPeriod) => Math.round(n * FACTOR[p]);
export const fmt = (n: number) => n.toLocaleString("en-US");
export const money = (n: number) => `$${n.toLocaleString("en-US")}`;

/* ------------------------------ base values ----------------------------- */

const BASE = {
  otaGuests: 12483,
  reached: 8240,
  engaged: 3131,
  /** OTA guests with at least one usable (unmasked) contact detail. */
  capturedGuests: 7615,
  conversions: 642,
  revenue: 84200,
  commission: 14310,
  repeat: 214,
  emails: 6420,
  phones: 5180,
  addresses: 3940,
  /** Masked relay addresses supplied by the OTA — not usable, not captured. */
  maskedEmails: 4310,
  /** OTA guests with no usable email and none captured yet. */
  missingEmail: 1753,
  /** Guests with the required contact set (email + phone). */
  completeProfiles: 4860,
};

/** OTA → Direct lift attributable to the journey. */
const LIFT = 24.6;

export type Kpi = {
  key: string;
  label: string;
  value: string;
  delta: number;
  meta?: string;
  /** Optional series metric this card drives when clicked. */
  metric?: SeriesMetric;
};

const captureRate = () => (BASE.capturedGuests / BASE.otaGuests) * 100;
const completenessRate = () => (BASE.completeProfiles / BASE.capturedGuests) * 100;
const conversionRate = () => (BASE.conversions / BASE.reached) * 100;

/* ------------------------- section 1 — captured ------------------------- */

export function captureKpis(period: AnalyticsPeriod): Kpi[] {
  const otaGuests = scale(BASE.otaGuests, period);
  const reached = scale(BASE.reached, period);

  return [
    {
      key: "ota",
      label: "OTA guests",
      value: fmt(otaGuests),
      delta: 4.1,
      meta: "Total OTA guests entering the journey.",
      metric: "ota",
    },
    {
      key: "reached",
      label: "Guests reached",
      value: fmt(reached),
      delta: 6.2,
      meta: "OTA guests reached through the OTA Buster journey.",
      metric: "reached",
    },
    {
      key: "email",
      label: "Email captured",
      value: fmt(scale(BASE.emails, period)),
      delta: 8.4,
      meta: "Unmasked email addresses captured from OTA guests.",
      metric: "email",
    },
    {
      key: "phone",
      label: "Phone numbers captured",
      value: fmt(scale(BASE.phones, period)),
      delta: 6.1,
      meta: "Unmasked phone numbers captured from OTA guests.",
      metric: "phone",
    },
    {
      key: "address",
      label: "Addresses captured",
      value: fmt(scale(BASE.addresses, period)),
      delta: 4.2,
      meta: "Guest addresses captured during the journey.",
      metric: "address",
    },
    {
      key: "masked",
      label: "Masked OTA emails",
      value: fmt(scale(BASE.maskedEmails, period)),
      delta: -3.4,
      meta: "Masked email addresses received from OTA booking engines.",
      metric: "masked",
    },
    {
      key: "missing",
      label: "Missing email",
      value: fmt(scale(BASE.missingEmail, period)),
      delta: -7.9,
      meta: "OTA guests without an available email address.",
      metric: "missing",
    },
    {
      key: "captureRate",
      label: "Capture rate",
      value: `${captureRate().toFixed(1)}%`,
      delta: 5.3,
      meta: "Share of OTA guests with usable guest data captured.",
      metric: "captureRate",
    },
    {
      key: "profiles",
      label: "Complete profiles",
      value: fmt(scale(BASE.completeProfiles, period)),
      delta: 9.1,
      meta: `Required contact information available · ${completenessRate().toFixed(0)}% completeness`,
    },
  ];
}

/* ------------------------ section 2 — converted ------------------------- */

export function conversionKpis(period: AnalyticsPeriod): Kpi[] {
  const conversions = scale(BASE.conversions, period);
  const revenue = scale(BASE.revenue, period);
  const avg = conversions ? Math.round(revenue / conversions) : 0;

  return [
    {
      key: "conversions",
      label: "Direct conversions",
      value: fmt(conversions),
      delta: 18.2,
      meta: "OTA guests converted to direct guests.",
      metric: "conversions",
    },
    {
      key: "revenue",
      label: "Direct revenue",
      value: money(revenue),
      delta: 18.2,
      meta: `Revenue attributed to converted OTA guests · ${money(avg)} per conversion`,
      metric: "revenue",
    },
    {
      key: "commission",
      label: "Commission avoided",
      value: money(scale(BASE.commission, period)),
      delta: 16.8,
      meta: "Estimated OTA commission avoided through direct conversion.",
      metric: "commission",
    },
    {
      key: "conversionRate",
      label: "Conversion rate",
      value: `${conversionRate().toFixed(1)}%`,
      delta: 11.4,
      meta: "Reached OTA guests converted to direct.",
      metric: "conversionRate",
    },
    {
      key: "repeat",
      label: "Repeat direct guests",
      value: fmt(scale(BASE.repeat, period)),
      delta: 15.7,
      meta: "Converted guests who later returned as direct guests.",
      metric: "repeat",
    },
    {
      key: "lift",
      label: "OTA → Direct lift",
      value: `${LIFT.toFixed(1)}%`,
      delta: 6.9,
      meta: "Change in direct booking behaviour attributable to the journey.",
    },
  ];
}

/* --------------------------- data completeness -------------------------- */

export type CompletenessRow = { key: string; label: string; value: string; percent: number };

export function completeness(period: AnalyticsPeriod): CompletenessRow[] {
  const base = BASE.capturedGuests;
  const rows = [
    { key: "email", label: "Email", n: BASE.emails },
    { key: "phone", label: "Phone", n: BASE.phones },
    { key: "address", label: "Address", n: BASE.addresses },
    { key: "profile", label: "Complete profile", n: BASE.completeProfiles },
  ];
  return rows.map((r) => ({
    key: r.key,
    label: r.label,
    value: fmt(scale(r.n, period)),
    percent: Math.round((r.n / base) * 100),
  }));
}

/* ------------------------ capture by journey stage ---------------------- */

export type CaptureStageRow = {
  stage: string;
  reached: string;
  emails: string;
  phones: string;
  addresses: string;
  masked: string;
  missing: string;
  rate: string;
};

const STAGES = [
  {
    stage: "Just Booked",
    reached: 8240,
    emails: 2420,
    phones: 1920,
    addresses: 1140,
    masked: 1640,
    missing: 740,
    rate: 41,
    momentum: 8.4,
    engagement: "14.5%",
    conversions: 0,
    revenue: 0,
  },
  {
    stage: "Pre-Check-In",
    reached: 6480,
    emails: 1920,
    phones: 1420,
    addresses: 840,
    masked: 1080,
    missing: 460,
    rate: 44,
    momentum: 6.1,
    engagement: "15.8%",
    conversions: 0,
    revenue: 0,
  },
  {
    stage: "During Stay",
    reached: 6120,
    emails: 2840,
    phones: 2160,
    addresses: 1280,
    masked: 820,
    missing: 310,
    rate: 58,
    momentum: 9.3,
    engagement: "14.2%",
    conversions: 0,
    revenue: 0,
  },
  {
    stage: "Post-Checkout",
    reached: 5940,
    emails: 1740,
    phones: 1420,
    addresses: 980,
    masked: 540,
    missing: 180,
    rate: 47,
    momentum: 7.6,
    engagement: "13.9%",
    conversions: 380,
    revenue: 49800,
  },
  {
    stage: "Winback / Retain",
    reached: 4210,
    emails: 1220,
    phones: 940,
    addresses: 640,
    masked: 230,
    missing: 63,
    rate: 39,
    momentum: 5.2,
    engagement: "12.8%",
    conversions: 262,
    revenue: 34400,
  },
];

export function captureStageRows(period: AnalyticsPeriod): CaptureStageRow[] {
  return STAGES.map((r) => ({
    stage: r.stage,
    reached: fmt(scale(r.reached, period)),
    emails: fmt(scale(r.emails, period)),
    phones: fmt(scale(r.phones, period)),
    addresses: fmt(scale(r.addresses, period)),
    masked: fmt(scale(r.masked, period)),
    missing: fmt(scale(r.missing, period)),
    rate: `${r.rate}%`,
  }));
}

/* --------------------- conversion by journey stage ---------------------- */

export type StageRow = {
  stage: string;
  reached: string;
  momentum: number;
  engagement: string;
  conversions: string;
  conversionRate: string;
  revenue: string;
};

export function stageRows(period: AnalyticsPeriod): StageRow[] {
  return STAGES.map((r) => ({
    stage: r.stage,
    reached: fmt(scale(r.reached, period)),
    momentum: r.momentum,
    engagement: r.engagement,
    conversions: r.conversions ? fmt(scale(r.conversions, period)) : "—",
    conversionRate: r.conversions ? `${((r.conversions / r.reached) * 100).toFixed(1)}%` : "—",
    revenue: r.revenue ? money(scale(r.revenue, period)) : "—",
  }));
}

/* --------------------------- channel performance ------------------------ */

export type ChannelRow = {
  key: string;
  channel: string;
  hint: string;
  sent: string;
  delivered: string;
  deliveryRate: string;
  ctr: string;
  response: string;
  conversions: string;
  conversionRate: string;
  revenue: string;
};

const CHANNELS = [
  {
    key: "email",
    channel: "Email",
    hint: "Email only",
    reached: 3860,
    sent: 824,
    delivered: 792,
    ctr: "36%",
    response: "12%",
    conversions: 412,
    revenue: 53400,
  },
  {
    key: "text",
    channel: "Text",
    hint: "SMS only",
    reached: 1640,
    sent: 460,
    delivered: 449,
    ctr: "29%",
    response: "18%",
    conversions: 142,
    revenue: 18200,
  },
  {
    key: "text_fallback",
    channel: "Text with Email fallback",
    hint: "Text first, email when the text can't be sent",
    reached: 1490,
    sent: 388,
    delivered: 381,
    ctr: "33%",
    response: "19%",
    conversions: 96,
    revenue: 8100,
  },
  {
    key: "both",
    channel: "Email + Text",
    hint: "Both channels, separate content",
    reached: 1250,
    sent: null as number | null,
    delivered: null as number | null,
    ctr: "41%",
    response: "22%",
    conversions: 88,
    revenue: 4500,
  },
];

export function channelRows(period: AnalyticsPeriod): ChannelRow[] {
  return CHANNELS.map((c) => ({
    key: c.key,
    channel: c.channel,
    hint: c.hint,
    sent: c.sent === null ? "—" : fmt(scale(c.sent, period)),
    delivered: c.delivered === null ? "—" : fmt(scale(c.delivered, period)),
    deliveryRate:
      c.sent === null || c.delivered === null
        ? "—"
        : `${Math.round((c.delivered / c.sent) * 100)}%`,
    ctr: c.ctr,
    response: c.response,
    conversions: fmt(scale(c.conversions, period)),
    conversionRate: `${((c.conversions / c.reached) * 100).toFixed(1)}%`,
    revenue: money(scale(c.revenue, period)),
  }));
}

/* --------------------------- strategy performance ----------------------- */

export type StrategyRow = {
  key: string;
  strategy: string;
  reached: string;
  conversions: string;
  conversionRate: string;
  revenue: string;
  revenuePer: string;
};

export function strategyRows(period: AnalyticsPeriod): StrategyRow[] {
  return CHANNELS.map((c) => ({
    key: c.key,
    strategy: c.channel,
    reached: fmt(scale(c.reached, period)),
    conversions: fmt(scale(c.conversions, period)),
    conversionRate: `${((c.conversions / c.reached) * 100).toFixed(1)}%`,
    revenue: money(scale(c.revenue, period)),
    revenuePer: money(Math.round(c.revenue / c.conversions)),
  }));
}

/* ------------------------------ time series ----------------------------- */

export type SeriesMetric =
  | "ota"
  | "reached"
  | "email"
  | "phone"
  | "address"
  | "masked"
  | "missing"
  | "captureRate"
  | "profiles"
  | "conversions"
  | "revenue"
  | "commission"
  | "conversionRate"
  | "repeat";

export const SERIES_METRICS: { value: SeriesMetric; label: string }[] = [
  { value: "ota", label: "OTA guests" },
  { value: "reached", label: "Guests reached" },
  { value: "email", label: "Emails captured" },
  { value: "phone", label: "Phone numbers captured" },
  { value: "address", label: "Postal addresses captured" },
  { value: "masked", label: "Masked OTA emails" },
  { value: "missing", label: "No email at all" },
  { value: "captureRate", label: "Capture rate" },
  { value: "profiles", label: "Complete profiles" },
  { value: "conversions", label: "Direct conversions" },
  { value: "revenue", label: "Direct revenue" },
  { value: "commission", label: "Commission avoided" },
  { value: "conversionRate", label: "Conversion rate" },
  { value: "repeat", label: "Repeat direct guests" },
];

export const seriesLabel = (m: SeriesMetric) =>
  SERIES_METRICS.find((s) => s.value === m)?.label ?? "";

export type SeriesFormat = "number" | "money" | "percent";

const SERIES_FORMAT: Record<SeriesMetric, SeriesFormat> = {
  ota: "number",
  reached: "number",
  email: "number",
  phone: "number",
  address: "number",
  masked: "number",
  missing: "number",
  captureRate: "percent",
  profiles: "number",
  conversions: "number",
  revenue: "money",
  commission: "money",
  conversionRate: "percent",
  repeat: "number",
};

export const seriesFormat = (m: SeriesMetric): SeriesFormat => SERIES_FORMAT[m];

const DAILY: Record<SeriesMetric, number> = {
  ota: BASE.otaGuests / 30,
  reached: BASE.reached / 30,
  email: BASE.emails / 30,
  phone: BASE.phones / 30,
  address: BASE.addresses / 30,
  masked: BASE.maskedEmails / 30,
  missing: BASE.missingEmail / 30,
  captureRate: captureRate(),
  profiles: BASE.completeProfiles / 30,
  conversions: BASE.conversions / 30,
  revenue: BASE.revenue / 30,
  commission: BASE.commission / 30,
  conversionRate: conversionRate(),
  repeat: BASE.repeat / 30,
};

const DAYS: Record<AnalyticsPeriod, number> = {
  "7d": 7,
  "15d": 15,
  "30d": 30,
  "90d": 90,
  custom: 45,
};

/** Stable pseudo-random wobble so the chart reads like real traffic. */
function wobble(i: number, seed: number) {
  const x = Math.sin((i + 1) * (12.9898 + seed)) * 43758.5453;
  return (x - Math.floor(x) - 0.5) * 0.34;
}

export type SeriesPoint = { date: string; current: number };

export function series(metric: SeriesMetric, period: AnalyticsPeriod): SeriesPoint[] {
  const days = DAYS[period];
  const step = days > 45 ? 3 : 1;
  const rate = SERIES_FORMAT[metric] === "percent";
  const base = rate ? DAILY[metric] : DAILY[metric] * step;
  const seed = metric.length;
  const points: SeriesPoint[] = [];
  const end = new Date(Date.UTC(2026, 7, 17));

  for (let i = days - 1; i >= 0; i -= step) {
    const d = new Date(end);
    d.setUTCDate(end.getUTCDate() - i);
    const trend = 1 + ((days - i) / days) * (rate ? 0.08 : 0.22);
    const value = base * trend * (1 + wobble(i, seed) * (rate ? 0.25 : 1));
    points.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
      current: rate ? Math.max(0, Number(value.toFixed(1))) : Math.max(0, Math.round(value)),
    });
  }
  return points;
}

/* ------------------------------ OTA engines ----------------------------- */

/**
 * Booking engines the OTA guests arrived from. Captured guest data differs a
 * lot by engine (Booking.com relays a masked address, Airbnb almost always
 * does, Expedia often passes a real one), so the Captured tab can be filtered
 * to a single engine and every number recalculates from these profiles.
 */
export type EngineId = "all" | "booking" | "expedia" | "airbnb" | "agoda" | "hotels" | "other";

type EngineProfile = {
  value: EngineId;
  label: string;
  /** Share of total OTA guests. Shares of the real engines sum to 1. */
  share: number;
  /** Multiplier applied to captured (usable) contact data for this engine. */
  captureBias: number;
  /** Multiplier applied to masked relay addresses. */
  maskedBias: number;
  /** Multiplier applied to guests with no reachable email at all. */
  missingBias: number;
};

const ENGINE_PROFILES: EngineProfile[] = [
  {
    value: "booking",
    label: "Booking.com",
    share: 0.38,
    captureBias: 0.94,
    maskedBias: 1.28,
    missingBias: 0.86,
  },
  {
    value: "expedia",
    label: "Expedia",
    share: 0.22,
    captureBias: 1.12,
    maskedBias: 0.72,
    missingBias: 0.74,
  },
  {
    value: "airbnb",
    label: "Airbnb",
    share: 0.14,
    captureBias: 0.71,
    maskedBias: 1.64,
    missingBias: 1.42,
  },
  {
    value: "agoda",
    label: "Agoda",
    share: 0.11,
    captureBias: 0.88,
    maskedBias: 1.06,
    missingBias: 1.18,
  },
  {
    value: "hotels",
    label: "Hotels.com",
    share: 0.09,
    captureBias: 1.05,
    maskedBias: 0.81,
    missingBias: 0.9,
  },
  {
    value: "other",
    label: "Other engines",
    share: 0.06,
    captureBias: 0.97,
    maskedBias: 0.95,
    missingBias: 1.1,
  },
];

export const OTA_ENGINES: { value: EngineId; label: string }[] = [
  { value: "all", label: "All OTA engines" },
  ...ENGINE_PROFILES.map((e) => ({ value: e.value, label: e.label })),
];

export const engineLabel = (id: EngineId) =>
  OTA_ENGINES.find((e) => e.value === id)?.label ?? "All OTA engines";

const ALL_ENGINES: EngineProfile = {
  value: "all",
  label: "All OTA engines",
  share: 1,
  captureBias: 1,
  maskedBias: 1,
  missingBias: 1,
};

const engineProfile = (id: EngineId) =>
  id === "all" ? ALL_ENGINES : (ENGINE_PROFILES.find((e) => e.value === id) ?? ALL_ENGINES);

/** Scale a base number by period AND the selected engine's mix + quality bias. */
function byEngine(
  n: number,
  period: AnalyticsPeriod,
  engine: EngineId,
  bias: keyof EngineProfile = "captureBias",
) {
  const e = engineProfile(engine);
  const factor = e.share * (typeof e[bias] === "number" ? (e[bias] as number) : 1);
  return Math.round(scale(n, period) * factor);
}

/* ------------------- captured KPIs, engine-aware variant ----------------- */

export function captureKpisFor(period: AnalyticsPeriod, engine: EngineId): Kpi[] {
  const e = engineProfile(engine);
  const otaGuests = Math.round(scale(BASE.otaGuests, period) * e.share);
  const reached = Math.round(scale(BASE.reached, period) * e.share);
  const emails = byEngine(BASE.emails, period, engine);
  const phones = byEngine(BASE.phones, period, engine);
  const addresses = byEngine(BASE.addresses, period, engine);
  const masked = byEngine(BASE.maskedEmails, period, engine, "maskedBias");
  const missing = byEngine(BASE.missingEmail, period, engine, "missingBias");
  const captured = byEngine(BASE.capturedGuests, period, engine);
  const profiles = byEngine(BASE.completeProfiles, period, engine);
  const rate = otaGuests ? (captured / otaGuests) * 100 : 0;
  const complete = captured ? (profiles / captured) * 100 : 0;

  return [
    {
      key: "ota",
      label: "OTA guests",
      value: fmt(otaGuests),
      delta: 4.1,
      meta: "Bookings that entered the journey from an OTA.",
      metric: "ota",
    },
    {
      key: "reached",
      label: "Guests reached",
      value: fmt(reached),
      delta: 6.2,
      meta: "OTA guests we were able to message at least once.",
      metric: "reached",
    },
    {
      key: "email",
      label: "Emails captured",
      value: fmt(emails),
      delta: 8.4,
      meta: "Real, unmasked email addresses now owned by the hotel.",
      metric: "email",
    },
    {
      key: "phone",
      label: "Phone numbers captured",
      value: fmt(phones),
      delta: 6.1,
      meta: "Mobile numbers usable for SMS.",
      metric: "phone",
    },
    {
      key: "address",
      label: "Postal addresses captured",
      value: fmt(addresses),
      delta: 4.2,
      meta: "Home addresses collected during the stay.",
      metric: "address",
    },
    {
      key: "masked",
      label: "Masked OTA emails",
      value: fmt(masked),
      delta: -3.4,
      meta: "Relay addresses from the OTA — never counted as captured.",
      metric: "masked",
    },
    {
      key: "missing",
      label: "No email at all",
      value: fmt(missing),
      delta: -7.9,
      meta: "Guests with neither a real nor a masked address.",
      metric: "missing",
    },
    {
      key: "captureRate",
      label: "Capture rate",
      value: `${rate.toFixed(1)}%`,
      delta: 5.3,
      meta: "Share of OTA guests with at least one usable contact detail.",
      metric: "captureRate",
    },
    {
      key: "profiles",
      label: "Complete profiles",
      value: fmt(profiles),
      delta: 9.1,
      meta: `Email + phone both captured · ${complete.toFixed(0)}% of captured guests.`,
      metric: "profiles",
    },
  ];
}

/* ------------------- data completeness, as a real table ------------------ */

export type CompletenessTableRow = {
  key: string;
  field: string;
  hint: string;
  /** Usable, hotel-owned value. */
  complete: number;
  /** Present but unusable (masked relay) — email only. */
  masked: number | null;
  /** Not held in any form. */
  missing: number;
  total: number;
  completePct: number;
  maskedPct: number | null;
  missingPct: number;
};

export function completenessTable(
  period: AnalyticsPeriod,
  engine: EngineId,
): CompletenessTableRow[] {
  const e = engineProfile(engine);
  const total = Math.round(scale(BASE.otaGuests, period) * e.share);

  const defs = [
    {
      key: "email",
      field: "Email address",
      hint: "Required to send any email campaign",
      complete: byEngine(BASE.emails, period, engine),
      masked: byEngine(BASE.maskedEmails, period, engine, "maskedBias"),
    },
    {
      key: "phone",
      field: "Phone number",
      hint: "Required to send SMS",
      complete: byEngine(BASE.phones, period, engine),
      masked: null,
    },
    {
      key: "address",
      field: "Postal address",
      hint: "Used for direct mail and guest profiling",
      complete: byEngine(BASE.addresses, period, engine),
      masked: null,
    },
    {
      key: "profile",
      field: "Complete profile",
      hint: "Email and phone both captured",
      complete: byEngine(BASE.completeProfiles, period, engine),
      masked: null,
    },
  ];

  return defs.map((d) => {
    const masked = d.masked === null ? null : Math.min(d.masked, Math.max(0, total - d.complete));
    const missing = Math.max(0, total - d.complete - (masked ?? 0));
    const pct = (n: number) => (total ? Math.round((n / total) * 1000) / 10 : 0);
    return {
      key: d.key,
      field: d.field,
      hint: d.hint,
      complete: d.complete,
      masked,
      missing,
      total,
      completePct: pct(d.complete),
      maskedPct: masked === null ? null : pct(masked),
      missingPct: pct(missing),
    };
  });
}

/* ------------------------- capture by OTA engine ------------------------- */

export type EngineRow = {
  key: EngineId;
  engine: string;
  share: string;
  otaGuests: string;
  emails: string;
  masked: string;
  missing: string;
  captureRate: string;
  captureRateValue: number;
  profiles: string;
};

export function engineRows(period: AnalyticsPeriod): EngineRow[] {
  return ENGINE_PROFILES.map((e) => {
    const otaGuests = Math.round(scale(BASE.otaGuests, period) * e.share);
    const captured = byEngine(BASE.capturedGuests, period, e.value);
    const rate = otaGuests ? (captured / otaGuests) * 100 : 0;
    return {
      key: e.value,
      engine: e.label,
      share: `${Math.round(e.share * 100)}%`,
      otaGuests: fmt(otaGuests),
      emails: fmt(byEngine(BASE.emails, period, e.value)),
      masked: fmt(byEngine(BASE.maskedEmails, period, e.value, "maskedBias")),
      missing: fmt(byEngine(BASE.missingEmail, period, e.value, "missingBias")),
      captureRate: `${rate.toFixed(1)}%`,
      captureRateValue: rate,
      profiles: fmt(byEngine(BASE.completeProfiles, period, e.value)),
    };
  }).sort((a, b) => b.captureRateValue - a.captureRateValue);
}

/* --------------------- tab-scoped metric collections --------------------- */

export const CAPTURE_METRICS: SeriesMetric[] = [
  "ota",
  "reached",
  "email",
  "phone",
  "address",
  "masked",
  "missing",
  "captureRate",
  "profiles",
];

export const CONVERSION_METRICS: SeriesMetric[] = [
  "conversions",
  "revenue",
  "commission",
  "conversionRate",
  "repeat",
];

/** Engine-aware series: capture metrics respond to the OTA engine filter. */
export function seriesFor(
  metric: SeriesMetric,
  period: AnalyticsPeriod,
  engine: EngineId,
): SeriesPoint[] {
  const base = series(metric, period);
  if (engine === "all" || SERIES_FORMAT[metric] === "percent") return base;
  const e = engineProfile(engine);
  const bias =
    metric === "masked" ? e.maskedBias : metric === "missing" ? e.missingBias : e.captureBias;
  const f = e.share * (metric === "ota" || metric === "reached" ? 1 : bias);
  return base.map((p) => ({ ...p, current: Math.max(0, Math.round(p.current * f)) }));
}

/* ------------------- guest profile completeness (captured) --------------- */

/**
 * Completeness of the guest profiles received from OTA bookings.
 * A profile counts as COMPLETE when all three core fields are present —
 * masked email, masked phone, masked address — even if still masked.
 * Missing-field counts overlap: a guest can be missing more than one field.
 */
const PROFILE = {
  complete: 8420,
  missingEmail: 2140,
  missingPhone: 1680,
  missingAddress: 2610,
};

export type ProfileCompleteness = {
  total: number;
  complete: number;
  incomplete: number;
  completePct: number;
  missing: { key: string; label: string; count: number; pct: number }[];
};

export function profileCompleteness(
  period: AnalyticsPeriod,
  engine: EngineId,
): ProfileCompleteness {
  const e = engineProfile(engine);
  const total = Math.round(scale(BASE.otaGuests, period) * e.share);
  const complete = Math.min(
    total,
    Math.round(scale(PROFILE.complete, period) * e.share * e.captureBias),
  );
  const incomplete = Math.max(0, total - complete);
  const cap = (n: number) =>
    Math.min(incomplete, Math.round(scale(n, period) * e.share * e.missingBias));

  return {
    total,
    complete,
    incomplete,
    completePct: total ? Math.round((complete / total) * 100) : 0,
    missing: [
      { key: "email", label: "Missing email", count: cap(PROFILE.missingEmail), pct: 0 },
      { key: "phone", label: "Missing phone", count: cap(PROFILE.missingPhone), pct: 0 },
      { key: "address", label: "Missing address", count: cap(PROFILE.missingAddress), pct: 0 },
    ].map((m) => ({ ...m, pct: incomplete ? Math.round((m.count / incomplete) * 100) : 0 })),
  };
}

/* -------------------- conversion opportunity (converted) ----------------- */

/**
 * What happened to the OTA guest data that was available for conversion.
 * Campaign/guest outcomes are kept strictly separate from OTA data
 * availability: failing to convert a reachable guest is not the same as
 * losing the opportunity when the OTA data-access window expired.
 */
const OPPORTUNITY = {
  maskedData: 12483,
  opportunity: 9640,
  converted: 3820,
  directBooking: 642,
  /** Campaign / guest outcome — data was still usable. */
  noUsableInfo: 2140,
  noEngagement: 2380,
  engagedNoBooking: 1300,
  /** OTA data availability — opportunity was lost, not failed. */
  windowExpired: 1980,
  accessUnavailable: 863,
};

export type OpportunityStage = {
  key: string;
  label: string;
  hint: string;
  count: number;
  pct: number;
};
export type OutcomeRow = { key: string; label: string; hint: string; count: number; pct: number };

export type ConversionOpportunity = {
  flow: OpportunityStage[];
  converted: OutcomeRow;
  notConverted: OutcomeRow;
  campaignOutcomes: OutcomeRow[];
  campaignTotal: number;
  dataUnavailable: OutcomeRow;
  dataReasons: OutcomeRow[];
  unavailablePct: number;
};

export function conversionOpportunity(period: AnalyticsPeriod): ConversionOpportunity {
  const s = (n: number) => scale(n, period);
  const maskedData = s(OPPORTUNITY.maskedData);
  const opportunity = s(OPPORTUNITY.opportunity);
  const converted = s(OPPORTUNITY.converted);
  const directBooking = s(OPPORTUNITY.directBooking);
  const windowExpired = s(OPPORTUNITY.windowExpired);
  const accessUnavailable = s(OPPORTUNITY.accessUnavailable);
  const dataUnavailable = windowExpired + accessUnavailable;
  const notConverted = Math.max(0, opportunity - converted);
  const pctOfOpp = (n: number) => (opportunity ? Math.round((n / opportunity) * 1000) / 10 : 0);

  const campaignOutcomes: OutcomeRow[] = [
    {
      key: "noUsable",
      label: "Guest did not provide usable information",
      hint: "Reached, but no usable email, phone or address was obtained.",
      count: s(OPPORTUNITY.noUsableInfo),
      pct: pctOfOpp(s(OPPORTUNITY.noUsableInfo)),
    },
    {
      key: "noEngage",
      label: "Guest did not engage",
      hint: "Messages delivered, no interaction.",
      count: s(OPPORTUNITY.noEngagement),
      pct: pctOfOpp(s(OPPORTUNITY.noEngagement)),
    },
    {
      key: "noBooking",
      label: "Guest engaged but did not book direct",
      hint: "Engaged with the campaign, no direct booking followed.",
      count: s(OPPORTUNITY.engagedNoBooking),
      pct: pctOfOpp(s(OPPORTUNITY.engagedNoBooking)),
    },
  ];

  return {
    flow: [
      {
        key: "masked",
        label: "Masked OTA data",
        hint: "Guest records received from OTA booking engines.",
        count: maskedData,
        pct: 100,
      },
      {
        key: "opportunity",
        label: "Conversion opportunity",
        hint: "Records still usable inside the permitted OTA data window.",
        count: opportunity,
        pct: maskedData ? Math.round((opportunity / maskedData) * 1000) / 10 : 0,
      },
      {
        key: "converted",
        label: "Converted",
        hint: "Usable guest information obtained through Directful campaigns.",
        count: converted,
        pct: maskedData ? Math.round((converted / maskedData) * 1000) / 10 : 0,
      },
      {
        key: "direct",
        label: "Direct booking",
        hint: "Converted guests who went on to book direct.",
        count: directBooking,
        pct: maskedData ? Math.round((directBooking / maskedData) * 1000) / 10 : 0,
      },
    ],
    converted: {
      key: "converted",
      label: "Converted",
      hint: "Usable guest information successfully obtained.",
      count: converted,
      pct: pctOfOpp(converted),
    },
    notConverted: {
      key: "notConverted",
      label: "Not converted",
      hint: "Opportunity that did not produce usable guest information.",
      count: notConverted,
      pct: pctOfOpp(notConverted),
    },
    campaignOutcomes,
    campaignTotal: campaignOutcomes.reduce((a, b) => a + b.count, 0),
    dataUnavailable: {
      key: "unavailable",
      label: "Data unavailable for conversion",
      hint: "OTA access window expired or access was no longer available.",
      count: dataUnavailable,
      pct: maskedData ? Math.round((dataUnavailable / maskedData) * 1000) / 10 : 0,
    },
    dataReasons: [
      {
        key: "expired",
        label: "Data window expired",
        hint: "The permitted OTA data-access period had passed.",
        count: windowExpired,
        pct: dataUnavailable ? Math.round((windowExpired / dataUnavailable) * 100) : 0,
      },
      {
        key: "revoked",
        label: "OTA access became unavailable",
        hint: "Access was withdrawn or restricted by the booking engine.",
        count: accessUnavailable,
        pct: dataUnavailable ? Math.round((accessUnavailable / dataUnavailable) * 100) : 0,
      },
    ],
    unavailablePct: maskedData ? Math.round((dataUnavailable / maskedData) * 1000) / 10 : 0,
  };
}
