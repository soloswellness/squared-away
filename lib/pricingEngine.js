// The pricing engine — the one place that decides what a job costs.
//
// Every price is built from four honest pieces: materials, labor, business
// costs (overhead), and profit. Nothing is folded in or hidden. See the
// project outline doc ("Solidified numbers") for where every figure below
// came from and the sources behind them.
//
// Materials barely move by state (close to a national commodity price).
// Labor moves a lot — it's priced off real, state-specific trade wages.

export const OVERHEAD_RATE = 0.12; // industry-typical cost of running the business
export const PROFIT_RATE = 0.15;   // industry-typical, fair contractor profit
export const BURDEN = 1.3;         // payroll tax + workers' comp + benefits, on top of raw wage

// Hourly wage by trade and state (BLS/OEWS-derived, 2025), plus a materials
// price index and a blended "remodel crew" index for multi-trade jobs.
// Roofer wages marked in ROOFER_ESTIMATED are derived from how the other three
// trades move in that state, since no direct published state figure exists yet —
// replace with a real number once you have one (e.g. from your brother).
export const STATE_WAGES = {
  national: { roofer: 26.85, hvac: 28.75, plumber: 30.67, laborer: 31.42, remodelBlend: 1.00, materials: 1.00 },
  SC: { roofer: 22.63, hvac: 25.58, plumber: 24.71, laborer: 26.18, remodelBlend: 0.82, materials: 0.95 },
  NC: { roofer: 23.52, hvac: 26.77, plumber: 25.58, laborer: 27.13, remodelBlend: 0.85, materials: 0.96 },
  GA: { roofer: 23.58, hvac: 26.88, plumber: 26.30, laborer: 26.46, remodelBlend: 0.85, materials: 0.96 },
  FL: { roofer: 22.61, hvac: 27.14, plumber: 25.19, laborer: 27.31, remodelBlend: 0.85, materials: 0.96 },
  TN: { roofer: 23.23, hvac: 26.36, plumber: 25.38, laborer: 26.78, remodelBlend: 0.84, materials: 0.96 },
  VA: { roofer: 25.75, hvac: 28.20, plumber: 30.14, laborer: 28.67, remodelBlend: 0.95, materials: 0.99 },
  TX: { roofer: 21.39, hvac: 27.39, plumber: 26.73, laborer: 27.82, remodelBlend: 0.88, materials: 0.96 },
  CA: { roofer: 33.17, hvac: 33.44, plumber: 41.20, laborer: 37.64, remodelBlend: 1.27, materials: 1.07 },
  NY: { roofer: 34.18, hvac: 33.13, plumber: 42.60, laborer: 36.85, remodelBlend: 1.28, materials: 1.07 },
};

export const ROOFER_ESTIMATED = { SC: true, NC: true, GA: true, TN: true, VA: true };

export const STATE_NAMES = {
  SC: "South Carolina", NC: "North Carolina", GA: "Georgia", FL: "Florida",
  TN: "Tennessee", VA: "Virginia", TX: "Texas", CA: "California", NY: "New York",
  national: "National average (reference)",
};

export const STATE_ORDER = ["SC", "NC", "GA", "FL", "TN", "VA", "TX", "CA", "NY", "national"];

export const JOBS = {
  roof: {
    name: "Roof Replacement",
    hint: "Asphalt shingle, full tear-off and replace. A 4-roofer crew, ~1.25 squares per person per day.",
    fields: [{ id: "sqft", label: "Roof size (square feet)", type: "number", default: 1800, min: 400, max: 6000, step: 50 }],
    compute(values, w) {
      const squares = values.sqft / 100;
      const materials = squares * 150 * w.materials;
      const crewHours = squares * 6.4;
      const labor = crewHours * w.roofer * BURDEN;
      return { materials, labor };
    },
    range(values, w) {
      const squares = values.sqft / 100;
      const mult = 0.3 * w.materials + 0.7 * (w.roofer / STATE_WAGES.national.roofer);
      return { low: squares * 400 * mult, high: squares * 700 * mult };
    },
  },
  hvac: {
    name: "Central AC / Furnace Replacement",
    hint: "Full system swap, ductwork already in place. A 2-tech crew, about a day on-site.",
    fields: [{
      id: "tonnage", label: "System size", type: "select", default: "2.5",
      options: [
        { value: "1.5", label: "1.5 ton — 600–1,000 sq ft home" },
        { value: "2.5", label: "2.5 ton — 1,000–1,600 sq ft home" },
        { value: "3", label: "3 ton — 1,600–2,000 sq ft home" },
        { value: "3.5", label: "3.5 ton — 2,000–2,500 sq ft home" },
      ],
    }],
    compute(values, w) {
      const equipment = { "1.5": 2000, "2.5": 2900, "3": 3000, "3.5": 3500 }[values.tonnage];
      const materials = equipment * w.materials;
      const labor = 20 * w.hvac * BURDEN;
      return { materials, labor };
    },
    range(values, w) {
      const mult = 0.3 * w.materials + 0.7 * (w.hvac / STATE_WAGES.national.hvac);
      return { low: 5000 * mult, high: 22000 * mult };
    },
  },
  waterheater: {
    name: "Water Heater Replacement",
    hint: "Straight swap, same fuel type and location. One plumber; tankless takes longer to vent.",
    fields: [{
      id: "type", label: "Type", type: "select", default: "tank",
      options: [
        { value: "tank", label: "Standard tank" },
        { value: "tankless", label: "Tankless" },
      ],
    }],
    compute(values, w) {
      const isTank = values.type === "tank";
      const materials = (isTank ? 673 : 1458) * w.materials;
      const hours = isTank ? 3 : 8;
      const labor = hours * w.plumber * BURDEN;
      return { materials, labor };
    },
    range(values, w) {
      const mult = 0.3 * w.materials + 0.7 * (w.plumber / STATE_WAGES.national.plumber);
      const isTank = values.type === "tank";
      return isTank ? { low: 881 * mult, high: 1825 * mult } : { low: 1400 * mult, high: 3900 * mult };
    },
  },
  bathroom: {
    name: "Bathroom Remodel",
    hint: "A full remodel: fixtures, tile, vanity, finishes. Mixed crew — priced by size and finish level rather than by hours.",
    fields: [
      { id: "sqft", label: "Bathroom size (square feet)", type: "number", default: 60, min: 20, max: 200, step: 5 },
      {
        id: "tier", label: "Finish level", type: "select", default: "mid",
        options: [
          { value: "basic", label: "Basic ($70/sq ft)" },
          { value: "mid", label: "Mid-range ($160/sq ft)" },
          { value: "luxury", label: "Luxury ($250/sq ft)" },
        ],
      },
    ],
    compute(values, w) {
      const tierMap = { basic: 70, mid: 160, luxury: 250 };
      const base = values.sqft * tierMap[values.tier];
      const materials = base * 0.42 * w.materials;
      const labor = base * 0.58 * w.remodelBlend;
      return { materials, labor };
    },
    range(values, w) {
      const tierRanges = {
        basic: { low: 3000, high: 10000 },
        mid: { low: 10000, high: 25000 },
        luxury: { low: 25000, high: 80000 },
      };
      const r = tierRanges[values.tier || "mid"];
      const mult = 0.3 * w.materials + 0.7 * w.remodelBlend;
      return { low: r.low * mult, high: r.high * mult };
    },
  },
};

// The one function the rest of the app calls. Returns the full breakdown
// plus the typical market range, for a given job type, state, and inputs.
export function estimate(jobId, region, values) {
  const job = JOBS[jobId];
  if (!job) throw new Error(`Unknown job type: ${jobId}`);
  const w = STATE_WAGES[region] || STATE_WAGES.national;

  const { materials, labor } = job.compute(values, w);
  const overhead = (materials + labor) * OVERHEAD_RATE;
  const profit = (materials + labor + overhead) * PROFIT_RATE;
  const total = materials + labor + overhead + profit;
  const marketRange = job.range(values, w);

  let comparison = "within";
  if (total > marketRange.high * 1.1) comparison = "above";
  else if (total < marketRange.low * 0.9) comparison = "below";

  return {
    jobName: job.name,
    stateName: STATE_NAMES[region] || region,
    materials, labor, overhead, profit, total,
    marketRange, comparison,
  };
}
