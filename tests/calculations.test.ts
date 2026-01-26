import { describe, it, expect } from "vitest";
import {
  calculateCompoundGrowth,
  adjustForInflation,
  calculateRetirementTarget,
  projectRetirementAge,
} from "../src/lib/calculations.js";

describe("calculateCompoundGrowth", () => {
  it("should calculate future value with no contributions", () => {
    const result = calculateCompoundGrowth(100000, 0, 0.07, 10);

    // $100k at 7% for 10 years with monthly compounding ≈ $200,966
    expect(result.futureValue).toBeGreaterThan(199000);
    expect(result.futureValue).toBeLessThan(202000);
    expect(result.totalContributions).toBe(100000);
    expect(result.totalGrowth).toBe(result.futureValue - result.totalContributions);
  });

  it("should calculate future value with monthly contributions", () => {
    const result = calculateCompoundGrowth(100000, 1000, 0.07, 10);

    // $100k principal + $1k/month at 7% for 10 years
    // Principal grows to ~$197k, contributions grow to ~$173k
    expect(result.futureValue).toBeGreaterThan(360000);
    expect(result.futureValue).toBeLessThan(380000);
    expect(result.totalContributions).toBe(100000 + 1000 * 12 * 10);
  });

  it("should handle zero years", () => {
    const result = calculateCompoundGrowth(50000, 500, 0.07, 0);

    expect(result.futureValue).toBe(50000);
    expect(result.totalContributions).toBe(50000);
    expect(result.totalGrowth).toBe(0);
  });

  it("should handle zero interest rate", () => {
    const result = calculateCompoundGrowth(10000, 100, 0, 5);

    // No growth, just principal + contributions
    expect(result.futureValue).toBe(10000 + 100 * 12 * 5);
    expect(result.totalGrowth).toBe(0);
  });

  it("should handle the example from DESIGN.md", () => {
    // 42 year old with $280k, contributing $1500/month, 7% return, retiring at 60
    const result = calculateCompoundGrowth(280000, 1500, 0.07, 18);

    // With monthly compounding, this grows to about $1.63M
    expect(result.futureValue).toBeGreaterThan(1600000);
    expect(result.futureValue).toBeLessThan(1700000);
  });
});

describe("adjustForInflation", () => {
  it("should reduce future value by inflation", () => {
    // $1M in 20 years at 3% inflation
    const adjusted = adjustForInflation(1000000, 20, 0.03);

    // Should be worth about $554k in today's dollars
    expect(adjusted).toBeGreaterThan(540000);
    expect(adjusted).toBeLessThan(560000);
  });

  it("should handle zero years", () => {
    const adjusted = adjustForInflation(100000, 0, 0.03);
    expect(adjusted).toBe(100000);
  });

  it("should use default 3% inflation rate", () => {
    const withDefault = adjustForInflation(100000, 10);
    const withExplicit = adjustForInflation(100000, 10, 0.03);
    expect(withDefault).toBe(withExplicit);
  });

  it("should handle zero inflation", () => {
    const adjusted = adjustForInflation(100000, 10, 0);
    expect(adjusted).toBe(100000);
  });
});

describe("calculateRetirementTarget", () => {
  it("should calculate target using 25x rule", () => {
    // $4000/month = $48k/year = $1.2M target
    const target = calculateRetirementTarget(4000);
    expect(target).toBe(1200000);
  });

  it("should calculate target for $5000/month expenses", () => {
    // $5000/month = $60k/year = $1.5M target
    const target = calculateRetirementTarget(5000);
    expect(target).toBe(1500000);
  });

  it("should handle small expenses", () => {
    // $2000/month = $24k/year = $600k target
    const target = calculateRetirementTarget(2000);
    expect(target).toBe(600000);
  });
});

describe("projectRetirementAge", () => {
  it("should find retirement age when target is reachable", () => {
    // 42 year old, $280k saved, $1500/month, needs $1.25M, 7% return
    const age = projectRetirementAge(42, 280000, 1500, 1250000, 0.07);

    // With monthly compounding, reaches target around age 57
    expect(age).toBeGreaterThanOrEqual(55);
    expect(age).toBeLessThanOrEqual(58);
  });

  it("should return null when target is not reachable", () => {
    // 60 year old with very little saved, needs too much
    const age = projectRetirementAge(60, 10000, 100, 2000000, 0.07, 80);

    expect(age).toBeNull();
  });

  it("should return current age if already at target", () => {
    const age = projectRetirementAge(50, 1500000, 1000, 1000000, 0.07);

    expect(age).toBe(50);
  });

  it("should respect maxAge parameter", () => {
    const age = projectRetirementAge(40, 10000, 100, 10000000, 0.07, 65);

    // Can't reach $10M by 65 with these numbers
    expect(age).toBeNull();
  });
});
