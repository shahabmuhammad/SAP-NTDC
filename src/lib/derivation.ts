// Every measuring point is shown as its own editable field, but fields that are
// duplicates of (or formulas on) another field are pre-filled automatically.
// A pre-filled field stays editable — once the user types their own value into
// it, it stops being overwritten by the source it was copied/derived from,
// until the field is cleared again.

export type ValuesMap = Record<string, string>;

interface DerivationRule {
  target: string;
  compute: (values: ValuesMap, powerFactor: string) => string;
  hint: string;
}

function get(values: ValuesMap, mp: number): string {
  return values[String(mp)] ?? "";
}

function toNum(v: string): number {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

function fmt(n: number): string {
  if (!Number.isFinite(n)) return "";
  return String(Math.round(n * 100) / 100);
}

export function div(value: string, divisor: number): string {
  if (value.trim() === "") return "";
  return fmt(toNum(value) / divisor);
}

export function mul(value: string, factor: number): string {
  if (value.trim() === "") return "";
  return fmt(toNum(value) * factor);
}

const BB_220_1 = 23724;
const BB_132_1 = 23806;

const FEEDER_220_VOLTAGE_TARGETS = [23708, 23703, 23713, 23718]; // TRB1, TRB2, NOW, CKD
const FEEDER_132_BASES = [23775, 23770, 23765, 23755, 23760, 23785, 23780, 23795, 23790, 23800]; // REZ1..DRG

const T250_BASES = { t1: 23745, t2: 23735, t3: 23725 };
const T40_BASES = [23817, 23807]; // T-4, T-5
const TRB_BASES = { trb1: 23708, trb2: 23703 };
const NOW_BASE = 23713;

// Offsets within a 250MVA transformer's 10-row block: 0 HV, 1 LV, 2 MW, 3 MVAR, 4 PF, 5 OilHV, 6 OilLV, 7 WdgHV, 8 WdgLV, 9 Tap.
const T250_MIRROR_OFFSETS = [0, 1, 2, 3, 5, 6, 7, 8, 9];
// Offsets within a feeder's 5-row block: 0 Voltage, 1 MW, 2 MVAR, 3 PF, 4 Load.
const TRB_MIRROR_OFFSETS = [1, 2, 4];

// All POWER FACTOR row measuring points across every equipment group.
const PF_TARGETS = [
  23749, 23739, 23729, // T-1, T-2, T-3
  23711, 23706, 23716, 23721, // TRB1, TRB2, NOW, CKD
  23821, 23811, // T-4, T-5
  23778, 23773, 23768, 23758, 23763, 23788, 23783, 23798, 23793, 23803, // REZ1, REZ2, RIB, ZRK, SHB, MRD2, MRD3, JLA, JNG, DRG
];

function buildRules(): DerivationRule[] {
  const rules: DerivationRule[] = [];

  for (const t of PF_TARGETS) {
    rules.push({ target: String(t), compute: (_v, pf) => pf, hint: "= Power Factor" });
  }

  for (const t of FEEDER_220_VOLTAGE_TARGETS) {
    rules.push({ target: String(t), compute: (v) => get(v, BB_220_1), hint: "= 220kV Bus Bar 1 Voltage" });
  }

  for (const base of FEEDER_132_BASES) {
    rules.push({ target: String(base), compute: (v) => get(v, BB_132_1), hint: "= 132kV Bus Bar 1 Voltage" });
  }

  for (const offset of T250_MIRROR_OFFSETS) {
    rules.push({
      target: String(T250_BASES.t2 + offset),
      compute: (v) => get(v, T250_BASES.t1 + offset),
      hint: "Copied from T-1",
    });
    rules.push({
      target: String(T250_BASES.t3 + offset),
      compute: (v) => get(v, T250_BASES.t1 + offset),
      hint: "Copied from T-1",
    });
  }

  for (const offset of TRB_MIRROR_OFFSETS) {
    rules.push({
      target: String(TRB_BASES.trb2 + offset),
      compute: (v) => get(v, TRB_BASES.trb1 + offset),
      hint: "Copied from TRB1",
    });
  }

  rules.push({ target: String(NOW_BASE + 1), compute: (v) => div(get(v, NOW_BASE + 4), 3), hint: "= Load ÷ 3" });
  rules.push({ target: String(NOW_BASE + 2), compute: (v) => div(get(v, NOW_BASE + 4), 6), hint: "= Load ÷ 6" });

  for (const base of T40_BASES) {
    rules.push({ target: String(base + 1), compute: (v) => mul(get(v, base + 0), 12), hint: "= HV Load × 12" });
    rules.push({ target: String(base + 2), compute: (v) => div(get(v, base + 0), 5), hint: "= HV Load ÷ 5" });
    rules.push({ target: String(base + 3), compute: (v) => div(get(v, base + 0), 10), hint: "= HV Load ÷ 10" });
  }

  for (const base of FEEDER_132_BASES) {
    rules.push({ target: String(base + 1), compute: (v) => div(get(v, base + 4), 5), hint: "= Load ÷ 5" });
    rules.push({ target: String(base + 2), compute: (v) => div(get(v, base + 4), 10), hint: "= Load ÷ 10" });
  }

  return rules;
}

export const DERIVATION_RULES = buildRules();

/** Human-readable hint per derived measuring point, shown under its input. */
export const DERIVED_HINTS: Record<string, string> = Object.fromEntries(
  DERIVATION_RULES.map((r) => [r.target, r.hint])
);

export interface FieldState {
  values: ValuesMap;
  /** The last value a rule auto-filled into each target — lets us tell a prefill apart from a manual edit. */
  lastAuto: ValuesMap;
}

export function emptyFieldState(): FieldState {
  return { values: {}, lastAuto: {} };
}

/** Re-runs every derivation rule, filling any target that is still blank or still equal to its last auto-filled value. */
export function recompute(values: ValuesMap, lastAuto: ValuesMap, powerFactor: string): FieldState {
  const newValues = { ...values };
  const newLastAuto = { ...lastAuto };
  for (const rule of DERIVATION_RULES) {
    const computed = rule.compute(values, powerFactor);
    const current = values[rule.target] ?? "";
    const wasAuto = current === "" || current === (lastAuto[rule.target] ?? "");
    if (wasAuto && computed !== current) {
      newValues[rule.target] = computed;
      newLastAuto[rule.target] = computed;
    } else if (wasAuto) {
      newLastAuto[rule.target] = computed;
    }
  }
  return { values: newValues, lastAuto: newLastAuto };
}
