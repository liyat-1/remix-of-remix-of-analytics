/**
 * OTA Analytics — the reporting model behind the OTA Buster analytics page.
 *
 * Two distinct concepts, never conflated:
 *
 *   CAPTURED  — guest records captured FROM the OTA. Everything here is still
 *               masked: masked OTA emails, masked OTA phone numbers, masked
 *               OTA addresses. Masked data is data we hold but cannot use.
 *   CONVERTED — the masked data we turned into usable, hotel-owned contact
 *               details, and the direct bookings and revenue that followed.
 *
 * Every number on the page is derived from ONE base set (`BASE`) scaled by
 * period and — for the captured side — by the selected OTA engine, so the
 * headline, the KPI cards and the detail cards can never disagree.
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
const pct1 = (n: number, of: number) => (of ? Math.round((n / of) * 1000) / 10 : 0);

/* ------------------------------ base values ----------------------------- */

const BASE = {
  /** Guest records captured from OTA booking engines (all masked). */
  otaGuestsCaptured: 12483,

  /** Masked values received from the OTA — held, but not usable. */
  maskedEmails: 11240,
  maskedPhones: 10380,
  maskedAddresses: 9120,

  /** Captured records that carry all three masked fields. */
  completeProfiles: 8420,

  /** Guests we were able to message at least once. */
  reached: 8240,
  /** Guests where at least one masked value became a usable, owned value. */
  convertedGuests: 3820,

  /** Masked → usable conversions, by field. */
  usableEmails: 3410,
  usablePhones: 2760,
  usableAddresses: 1980,

  /** Direct business that followed. */
  conversions: 642,
  revenue: 84200,
  commission: 14310,
  repeat: 214,

  /** Not-converted breakdown. Sums to reached − convertedGuests. */
  noEngagement: 2380,
  engagedNoInfo: 1177,
  windowExpired: 610,
  accessUnavailable: 253,
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

/* ------------------------------ OTA engines ----------------------------- */

export type EngineId = "all" | "booking" | "expedia" | "airbnb" | "agoda" | "hotels" | "other";

type EngineProfile = {
  value: EngineId;
  label: string;
  /** Share of total captured OTA records. Real engines sum to 1. */
  share: number;
  /** Multiplier on masked values relayed by this engine. */
  maskedBias: number;
  /** Multiplier on complete (all-three-fields) profiles. */
  completeBias: number;
};

const ENGINE_PROFILES: EngineProfile[] = [
  { value: "booking", label: "Booking.com", share: 0.38, maskedBias: 1.04, completeBias: 1.06 },
  { value: "expedia", label: "Expedia", share: 0.22, maskedBias: 1.02, completeBias: 1.12 },
  { value: "airbnb", label: "Airbnb", share: 0.14, maskedBias: 1.06, completeBias: 0.71 },
  { value: "agoda", label: "Agoda", share: 0.11, maskedBias: 0.98, completeBias: 0.88 },
  { value: "hotels", label: "Hotels.com", share: 0.09, maskedBias: 1.0, completeBias: 1.02 },
  { value: "other", label: "Other engines", share: 0.06, maskedBias: 0.94, completeBias: 0.9 },
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
  maskedBias: 1,
  completeBias: 1,
};

const engineProfile = (id: EngineId) =>
  id === "all" ? ALL_ENGINES : (ENGINE_PROFILES.find((e) => e.value === id) ?? ALL_ENGINES);

/* ------------------------ THE captured model (one source) ---------------- */

export type MaskedField = {
  key: "email" | "phone" | "address";
  /** "Masked OTA emails" etc. */
  label: string;
  hint: string;
  count: number;
  /** Share of captured OTA records that carry this masked field. */
  pct: number;
  /** Records with no value at all for this field. */
  absent: number;
};

export type CapturedModel = {
  /** OTA guests captured — the denominator for everything in Captured. */
  otaGuestsCaptured: number;
  masked: MaskedField[];
  completeProfiles: number;
  incompleteProfiles: number;
  /** Single completeness percentage used by the headline AND the KPI card. */
  completenessPct: number;
  /** Why profiles are incomplete — overlapping absent-field counts. */
  gaps: { key: string; label: string; count: number; pct: number }[];
};

export function capturedModel(period: AnalyticsPeriod, engine: EngineId): CapturedModel {
  const e = engineProfile(engine);
  const total = Math.round(scale(BASE.otaGuestsCaptured, period) * e.share);

  const maskedCount = (n: number) =>
    Math.min(total, Math.round(scale(n, period) * e.share * e.maskedBias));

  const defs: { key: MaskedField["key"]; label: string; hint: string; n: number }[] = [
    {
      key: "email",
      label: "Masked OTA emails",
      hint: "Relay addresses supplied by the booking engine.",
      n: BASE.maskedEmails,
    },
    {
      key: "phone",
      label: "Masked OTA phone numbers",
      hint: "Proxy numbers that stop routing after the stay.",
      n: BASE.maskedPhones,
    },
    {
      key: "address",
      label: "Masked OTA addresses",
      hint: "Partial or redacted postal addresses.",
      n: BASE.maskedAddresses,
    },
  ];

  const masked: MaskedField[] = defs.map((d) => {
    const count = maskedCount(d.n);
    return {
      key: d.key,
      label: d.label,
      hint: d.hint,
      count,
      pct: pct1(count, total),
      absent: Math.max(0, total - count),
    };
  });

  const minMasked = Math.min(...masked.map((m) => m.count));
  const completeProfiles = Math.min(
    minMasked,
    Math.round(scale(BASE.completeProfiles, period) * e.share * e.completeBias),
  );
  const incompleteProfiles = Math.max(0, total - completeProfiles);

  return {
    otaGuestsCaptured: total,
    masked,
    completeProfiles,
    incompleteProfiles,
    completenessPct: pct1(completeProfiles, total),
    gaps: masked.map((m) => ({
      key: m.key,
      label:
        m.key === "email"
          ? "No email of any kind"
          : m.key === "phone"
            ? "No phone number of any kind"
            : "No address of any kind",
      count: m.absent,
      pct: pct1(m.absent, incompleteProfiles),
    })),
  };
}

/* ------------------------- section 1 — captured KPIs --------------------- */

export function captureKpisFor(period: AnalyticsPeriod, engine: EngineId): Kpi[] {
  const m = capturedModel(period, engine);
  const [email, phone, address] = m.masked;

  return [
    {
      key: "ota",
      label: "OTA guests captured",
      value: fmt(m.otaGuestsCaptured),
      delta: 4.1,
      meta: "Guest records captured from OTA booking engines.",
      metric: "otaCaptured",
    },
    {
      key: "maskedEmail",
      label: "Masked OTA emails",
      value: fmt(email?.count ?? 0),
      delta: 5.6,
      meta: `${email?.pct ?? 0}% of captured records carry a relay address.`,
      metric: "maskedEmail",
    },
    {
      key: "maskedPhone",
      label: "Masked OTA phone numbers",
      value: fmt(phone?.count ?? 0),
      delta: 4.3,
      meta: `${phone?.pct ?? 0}% carry a proxy phone number.`,
      metric: "maskedPhone",
    },
    {
      key: "maskedAddress",
      label: "Masked OTA addresses",
      value: fmt(address?.count ?? 0),
      delta: 3.1,
      meta: `${address?.pct ?? 0}% carry a partial postal address.`,
      metric: "maskedAddress",
    },
    {
      key: "profiles",
      label: "Complete profiles",
      value: fmt(m.completeProfiles),
      delta: 9.1,
      meta: `All three masked fields present · ${m.completenessPct}% of captured records.`,
      metric: "completeProfiles",
    },
    {
      key: "completeness",
      label: "Profile completeness",
      value: `${m.completenessPct}%`,
      delta: 3.8,
      meta: `${fmt(m.completeProfiles)} of ${fmt(m.otaGuestsCaptured)} captured records.`,
      metric: "completenessRate",
    },
  ];
}

/* ------------------------ section 2 — converted KPIs -------------------- */

export type ConvertedModel = {
  reached: number;
  convertedGuests: number;
  /** convertedGuests / reached */
  convertRate: number;
  notConverted: number;
  fields: {
    key: "email" | "phone" | "address";
    masked: number;
    usable: number;
    rate: number;
    label: string;
    hint: string;
  }[];
  conversions: number;
  conversionRate: number;
  revenue: number;
  revenuePer: number;
  commission: number;
  repeat: number;
  lift: number;
  /** Direct bookings / converted guests */
  bookingRate: number;
  outcomes: OutcomeRow[];
};

export function convertedModel(period: AnalyticsPeriod): ConvertedModel {
  const s = (n: number) => scale(n, period);
  const captured = capturedModel(period, "all");
  const reached = s(BASE.reached);
  const convertedGuests = s(BASE.convertedGuests);
  const conversions = s(BASE.conversions);
  const revenue = s(BASE.revenue);
  const notConverted = Math.max(0, reached - convertedGuests);

  const fieldDefs = [
    {
      key: "email" as const,
      label: "Email",
      hint: "Masked relay address → real inbox we own.",
      usable: s(BASE.usableEmails),
    },
    {
      key: "phone" as const,
      label: "Phone number",
      hint: "Proxy number → real mobile we can text.",
      usable: s(BASE.usablePhones),
    },
    {
      key: "address" as const,
      label: "Address",
      hint: "Partial address → full postal address.",
      usable: s(BASE.usableAddresses),
    },
  ];

  const fields = fieldDefs.map((f) => {
    const masked = captured.masked.find((m) => m.key === f.key)?.count ?? 0;
    return {
      key: f.key,
      label: f.label,
      hint: f.hint,
      masked,
      usable: f.usable,
      rate: pct1(f.usable, masked),
    };
  });

  const outcomes: OutcomeRow[] = [
    {
      key: "noEngage",
      group: "campaign",
      label: "Never engaged",
      hint: "Messages delivered, no interaction at all.",
      count: s(BASE.noEngagement),
      pct: pct1(s(BASE.noEngagement), notConverted),
    },
    {
      key: "noInfo",
      group: "campaign",
      label: "Engaged, gave no details",
      hint: "Opened or clicked, but never handed over a usable value.",
      count: s(BASE.engagedNoInfo),
      pct: pct1(s(BASE.engagedNoInfo), notConverted),
    },
    {
      key: "expired",
      group: "data",
      label: "OTA data window expired",
      hint: "The permitted access period ran out before we could reach them.",
      count: s(BASE.windowExpired),
      pct: pct1(s(BASE.windowExpired), notConverted),
    },
    {
      key: "revoked",
      group: "data",
      label: "OTA access unavailable",
      hint: "The booking engine withdrew or restricted access.",
      count: s(BASE.accessUnavailable),
      pct: pct1(s(BASE.accessUnavailable), notConverted),
    },
  ];

  return {
    reached,
    convertedGuests,
    convertRate: pct1(convertedGuests, reached),
    notConverted,
    fields,
    conversions,
    conversionRate: pct1(conversions, reached),
    revenue,
    revenuePer: conversions ? Math.round(revenue / conversions) : 0,
    commission: s(BASE.commission),
    repeat: s(BASE.repeat),
    lift: LIFT,
    bookingRate: pct1(conversions, convertedGuests),
    outcomes,
  };
}

export function conversionKpis(period: AnalyticsPeriod): Kpi[] {
  const c = convertedModel(period);

  return [
    {
      key: "reached",
      label: "Guests reached",
      value: fmt(c.reached),
      delta: 6.2,
      meta: "Captured OTA guests we messaged at least once.",
      metric: "reached",
    },
    {
      key: "convertedGuests",
      label: "Guests converted",
      value: fmt(c.convertedGuests),
      delta: 14.3,
      meta: `Masked → usable contact details · ${c.convertRate}% of reached.`,
      metric: "convertedGuests",
    },
    {
      key: "conversions",
      label: "Direct bookings",
      value: fmt(c.conversions),
      delta: 18.2,
      meta: `${c.bookingRate}% of converted guests booked direct.`,
      metric: "conversions",
    },
    {
      key: "revenue",
      label: "Direct revenue",
      value: money(c.revenue),
      delta: 18.2,
      meta: `${money(c.revenuePer)} per direct booking.`,
      metric: "revenue",
    },
    {
      key: "commission",
      label: "Commission avoided",
      value: money(c.commission),
      delta: 16.8,
      meta: "Estimated OTA commission avoided by going direct.",
      metric: "commission",
    },
    {
      key: "conversionRate",
      label: "Booking conversion rate",
      value: `${c.conversionRate}%`,
      delta: 11.4,
      meta: "Reached OTA guests that produced a direct booking.",
      metric: "conversionRate",
    },
    {
      key: "repeat",
      label: "Repeat direct guests",
      value: fmt(c.repeat),
      delta: 15.7,
      meta: "Converted guests who came back direct again.",
      metric: "repeat",
    },
    {
      key: "lift",
      label: "OTA → Direct lift",
      value: `${c.lift.toFixed(1)}%`,
      delta: 6.9,
      meta: "Change in direct booking behaviour attributable to the journey.",
    },
  ];
}

/* --------------------- merged channel + strategy table ------------------ */

export type ChannelRow = {
  key: string;
  channel: string;
  hint: string;
  reached: string;
  delivered: string;
  deliveryRate: string;
  ctr: string;
  response: string;
  conversions: string;
  conversionRate: string;
  conversionRateValue: number;
  revenue: string;
  revenuePer: string;
  /** Share of total direct revenue, for the in-table bar. */
  revenueShare: number;
};

const CHANNELS = [
  {
    key: "email",
    channel: "Email only",
    hint: "One email track, no SMS",
    reached: 3860,
    sent: 4120,
    delivered: 3960,
    ctr: "36%",
    response: "12%",
    conversions: 412,
    revenue: 53400,
  },
  {
    key: "text",
    channel: "Text only",
    hint: "SMS track, no email",
    reached: 1640,
    sent: 1720,
    delivered: 1682,
    ctr: "29%",
    response: "18%",
    conversions: 142,
    revenue: 18200,
  },
  {
    key: "text_fallback",
    channel: "Text with email fallback",
    hint: "Text first, email when the text can't be sent",
    reached: 1490,
    sent: 1554,
    delivered: 1521,
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
    sent: 2380,
    delivered: 2298,
    ctr: "41%",
    response: "22%",
    conversions: 88,
    revenue: 4500,
  },
];

export function channelRows(period: AnalyticsPeriod): ChannelRow[] {
  const totalRevenue = CHANNELS.reduce((a, c) => a + c.revenue, 0);
  return CHANNELS.map((c) => {
    const rate = pct1(c.conversions, c.reached);
    return {
      key: c.key,
      channel: c.channel,
      hint: c.hint,
      reached: fmt(scale(c.reached, period)),
      delivered: fmt(scale(c.delivered, period)),
      deliveryRate: `${Math.round((c.delivered / c.sent) * 100)}%`,
      ctr: c.ctr,
      response: c.response,
      conversions: fmt(scale(c.conversions, period)),
      conversionRate: `${rate}%`,
      conversionRateValue: rate,
      revenue: money(scale(c.revenue, period)),
      revenuePer: money(Math.round(c.revenue / c.conversions)),
      revenueShare: Math.round((c.revenue / totalRevenue) * 100),
    };
  }).sort((a, b) => b.revenueShare - a.revenueShare);
}

/* ------------------------- capture by OTA engine ------------------------ */

export type EngineRow = {
  key: EngineId;
  engine: string;
  share: string;
  otaGuests: string;
  maskedEmail: string;
  maskedPhone: string;
  maskedAddress: string;
  profiles: string;
  completeness: string;
  completenessValue: number;
};

export function engineRows(period: AnalyticsPeriod): EngineRow[] {
  return ENGINE_PROFILES.map((e) => {
    const m = capturedModel(period, e.value);
    const find = (k: MaskedField["key"]) => m.masked.find((x) => x.key === k)?.count ?? 0;
    return {
      key: e.value,
      engine: e.label,
      share: `${Math.round(e.share * 100)}%`,
      otaGuests: fmt(m.otaGuestsCaptured),
      maskedEmail: fmt(find("email")),
      maskedPhone: fmt(find("phone")),
      maskedAddress: fmt(find("address")),
      profiles: fmt(m.completeProfiles),
      completeness: `${m.completenessPct}%`,
      completenessValue: m.completenessPct,
    };
  }).sort((a, b) => b.completenessValue - a.completenessValue);
}

/* ------------------------------ time series ----------------------------- */

export type SeriesMetric =
  | "otaCaptured"
  | "maskedEmail"
  | "maskedPhone"
  | "maskedAddress"
  | "completeProfiles"
  | "completenessRate"
  | "reached"
  | "convertedGuests"
  | "usableEmail"
  | "usablePhone"
  | "usableAddress"
  | "conversions"
  | "revenue"
  | "commission"
  | "conversionRate"
  | "repeat";

export const SERIES_METRICS: { value: SeriesMetric; label: string }[] = [
  { value: "otaCaptured", label: "OTA guests captured" },
  { value: "maskedEmail", label: "Masked OTA emails" },
  { value: "maskedPhone", label: "Masked OTA phone numbers" },
  { value: "maskedAddress", label: "Masked OTA addresses" },
  { value: "completeProfiles", label: "Complete profiles" },
  { value: "completenessRate", label: "Profile completeness" },
  { value: "reached", label: "Guests reached" },
  { value: "convertedGuests", label: "Guests converted" },
  { value: "usableEmail", label: "Emails converted to usable" },
  { value: "usablePhone", label: "Phone numbers converted to usable" },
  { value: "usableAddress", label: "Addresses converted to usable" },
  { value: "conversions", label: "Direct bookings" },
  { value: "revenue", label: "Direct revenue" },
  { value: "commission", label: "Commission avoided" },
  { value: "conversionRate", label: "Booking conversion rate" },
  { value: "repeat", label: "Repeat direct guests" },
];

export const seriesLabel = (m: SeriesMetric) =>
  SERIES_METRICS.find((s) => s.value === m)?.label ?? "";

export type SeriesFormat = "number" | "money" | "percent";

const SERIES_FORMAT: Record<SeriesMetric, SeriesFormat> = {
  otaCaptured: "number",
  maskedEmail: "number",
  maskedPhone: "number",
  maskedAddress: "number",
  completeProfiles: "number",
  completenessRate: "percent",
  reached: "number",
  convertedGuests: "number",
  usableEmail: "number",
  usablePhone: "number",
  usableAddress: "number",
  conversions: "number",
  revenue: "money",
  commission: "money",
  conversionRate: "percent",
  repeat: "number",
};

export const seriesFormat = (m: SeriesMetric): SeriesFormat => SERIES_FORMAT[m];

const completenessRate = pct1(BASE.completeProfiles, BASE.otaGuestsCaptured);
const bookingRate = pct1(BASE.conversions, BASE.reached);

const DAILY: Record<SeriesMetric, number> = {
  otaCaptured: BASE.otaGuestsCaptured / 30,
  maskedEmail: BASE.maskedEmails / 30,
  maskedPhone: BASE.maskedPhones / 30,
  maskedAddress: BASE.maskedAddresses / 30,
  completeProfiles: BASE.completeProfiles / 30,
  completenessRate,
  reached: BASE.reached / 30,
  convertedGuests: BASE.convertedGuests / 30,
  usableEmail: BASE.usableEmails / 30,
  usablePhone: BASE.usablePhones / 30,
  usableAddress: BASE.usableAddresses / 30,
  conversions: BASE.conversions / 30,
  revenue: BASE.revenue / 30,
  commission: BASE.commission / 30,
  conversionRate: bookingRate,
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

/* --------------------- tab-scoped metric collections -------------------- */

/** Captured trend dropdown — masked metrics only. */
export const CAPTURE_METRICS: SeriesMetric[] = [
  "otaCaptured",
  "maskedEmail",
  "maskedPhone",
  "maskedAddress",
  "completeProfiles",
  "completenessRate",
];

/** Converted trend dropdown — reach, masked → usable, and direct business. */
export const CONVERSION_METRICS: SeriesMetric[] = [
  "reached",
  "convertedGuests",
  "usableEmail",
  "usablePhone",
  "usableAddress",
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
    metric === "completeProfiles"
      ? e.completeBias
      : metric === "otaCaptured"
        ? 1
        : e.maskedBias;
  return base.map((p) => ({
    ...p,
    current: Math.max(0, Math.round(p.current * e.share * bias)),
  }));
}

/* ---------------------------- shared row types -------------------------- */

export type OutcomeRow = {
  key: string;
  group: "campaign" | "data";
  label: string;
  hint: string;
  count: number;
  pct: number;
};
