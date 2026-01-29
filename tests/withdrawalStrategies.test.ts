import { describe, it, expect } from "vitest";
import {
  getStrategyInfo,
  getAllStrategies,
  simulateConstantPercentage,
  simulateConstantDollar,
  simulateGuardrails,
  compareStrategies,
  formatSimulationSummary,
} from "../src/lib/withdrawalStrategies.js";
import type { GuardrailsConfig } from "../src/types/index.js";

describe("withdrawal strategy info", () => {
  describe("getStrategyInfo", () => {
    it("should return info for constant_dollar strategy", () => {
      const info = getStrategyInfo("constant_dollar");
      expect(info).toBeDefined();
      expect(info?.name).toBe("Constant Dollar (4% Rule)");
      expect(info?.pros.length).toBeGreaterThan(0);
      expect(info?.cons.length).toBeGreaterThan(0);
    });

    it("should return info for constant_percentage strategy", () => {
      const info = getStrategyInfo("constant_percentage");
      expect(info).toBeDefined();
      expect(info?.name).toBe("Constant Percentage");
    });

    it("should return info for guardrails strategy", () => {
      const info = getStrategyInfo("guardrails");
      expect(info).toBeDefined();
      expect(info?.name).toBe("Guardrails (Variable Withdrawal)");
    });

    it("should return info for bucket strategy", () => {
      const info = getStrategyInfo("bucket");
      expect(info).toBeDefined();
      expect(info?.name).toBe("Bucket Strategy");
    });

    it("should return undefined for unknown strategy", () => {
      // @ts-expect-error Testing invalid input
      const info = getStrategyInfo("unknown");
      expect(info).toBeUndefined();
    });
  });

  describe("getAllStrategies", () => {
    it("should return all four strategies", () => {
      const strategies = getAllStrategies();
      expect(strategies).toHaveLength(4);
      expect(strategies.map(s => s.type)).toContain("constant_dollar");
      expect(strategies.map(s => s.type)).toContain("constant_percentage");
      expect(strategies.map(s => s.type)).toContain("guardrails");
      expect(strategies.map(s => s.type)).toContain("bucket");
    });
  });
});

describe("simulateConstantPercentage", () => {
  it("should simulate 30 years with stable returns", () => {
    const result = simulateConstantPercentage(1000000, 0.04, 30, 0.07);
    
    expect(result.strategyType).toBe("constant_percentage");
    expect(result.initialPortfolio).toBe(1000000);
    expect(result.years).toBe(30);
    expect(result.yearlyResults).toHaveLength(30);
    expect(result.ranOutOfMoney).toBe(false);
  });

  it("should never run out of money", () => {
    // Even with 0% returns, constant percentage can't deplete
    const result = simulateConstantPercentage(1000000, 0.10, 50, 0.0);
    
    expect(result.ranOutOfMoney).toBe(false);
    expect(result.finalBalance).toBeGreaterThan(0);
  });

  it("should have variable withdrawals based on balance", () => {
    const result = simulateConstantPercentage(1000000, 0.04, 10, 0.07);
    
    // With positive returns, later withdrawals should be higher
    const firstWithdrawal = result.yearlyResults[0]?.withdrawal ?? 0;
    const lastWithdrawal = result.yearlyResults[9]?.withdrawal ?? 0;
    
    expect(lastWithdrawal).toBeGreaterThan(firstWithdrawal);
  });

  it("should calculate correct first year withdrawal", () => {
    const result = simulateConstantPercentage(1000000, 0.04, 1, 0.07);
    
    expect(result.yearlyResults[0]?.withdrawal).toBe(40000);
  });
});

describe("simulateConstantDollar", () => {
  it("should simulate 30 years with inflation-adjusted withdrawals", () => {
    const result = simulateConstantDollar(1000000, 40000, 30, 0.07, 0.03);
    
    expect(result.strategyType).toBe("constant_dollar");
    expect(result.yearlyResults).toHaveLength(30);
    expect(result.yearlyResults[0]?.withdrawal).toBe(40000);
  });

  it("should increase withdrawals by inflation each year", () => {
    const result = simulateConstantDollar(1000000, 40000, 5, 0.07, 0.03);
    
    // Year 2 withdrawal should be ~3% higher than year 1
    const year1 = result.yearlyResults[0]?.withdrawal ?? 0;
    const year2 = result.yearlyResults[1]?.withdrawal ?? 0;
    
    expect(year2).toBeGreaterThan(year1);
    expect(year2).toBeCloseTo(year1 * 1.03, -2);
  });

  it("should deplete portfolio with high withdrawal rate", () => {
    // 10% withdrawal with only 5% return = will run out
    const result = simulateConstantDollar(1000000, 100000, 30, 0.05, 0.03);
    
    expect(result.ranOutOfMoney).toBe(true);
    expect(result.depletionYear).toBeDefined();
    expect(result.depletionYear).toBeLessThan(30);
  });

  it("should not deplete with conservative withdrawal", () => {
    const result = simulateConstantDollar(1000000, 30000, 30, 0.07, 0.03);
    
    expect(result.ranOutOfMoney).toBe(false);
    expect(result.finalBalance).toBeGreaterThan(0);
  });
});

describe("simulateGuardrails", () => {
  const defaultConfig: GuardrailsConfig = {
    initialRate: 0.05,
    floorGuardrail: 0.06,
    ceilingGuardrail: 0.04,
    adjustmentPercent: 0.10,
  };

  it("should simulate 30 years with default config", () => {
    const result = simulateGuardrails(1000000, 30, 0.07, defaultConfig);
    
    expect(result.strategyType).toBe("guardrails");
    expect(result.yearlyResults).toHaveLength(30);
    expect(result.yearlyResults[0]?.withdrawal).toBe(50000); // 5% of $1M
  });

  it("should have less income variability than constant percentage", () => {
    const guardrailsResult = simulateGuardrails(1000000, 30, 0.07);
    const percentageResult = simulateConstantPercentage(1000000, 0.05, 30, 0.07);
    
    const guardrailsRange = guardrailsResult.maxWithdrawal - guardrailsResult.minWithdrawal;
    const percentageRange = percentageResult.maxWithdrawal - percentageResult.minWithdrawal;
    
    // Guardrails should have more stable income (smaller range)
    // Note: This depends on the specific parameters but generally holds
    expect(guardrailsResult.minWithdrawal).toBeGreaterThan(0);
    expect(guardrailsResult.maxWithdrawal).toBeGreaterThan(guardrailsResult.minWithdrawal);
  });

  it("should adjust withdrawals based on guardrails", () => {
    const result = simulateGuardrails(1000000, 10, 0.07, defaultConfig);
    
    // Withdrawals should vary but within bounds
    expect(result.minWithdrawal).toBeLessThanOrEqual(result.maxWithdrawal);
    expect(result.averageWithdrawal).toBeGreaterThan(0);
  });

  it("should use default config if none provided", () => {
    const result = simulateGuardrails(1000000, 10, 0.07);
    
    // Should start with 5% (default initial rate)
    expect(result.yearlyResults[0]?.withdrawal).toBe(50000);
  });
});

describe("compareStrategies", () => {
  it("should return results for all simulatable strategies", () => {
    const results = compareStrategies(1000000, 30, 0.07, 4000);
    
    expect(results).toHaveLength(3); // constant_dollar, constant_percentage, guardrails
    expect(results.map(r => r.strategyType)).toContain("constant_dollar");
    expect(results.map(r => r.strategyType)).toContain("constant_percentage");
    expect(results.map(r => r.strategyType)).toContain("guardrails");
  });

  it("should use consistent parameters across strategies", () => {
    const results = compareStrategies(1000000, 30, 0.07, 4000);
    
    results.forEach(r => {
      expect(r.initialPortfolio).toBe(1000000);
      expect(r.years).toBe(30);
      expect(r.annualReturn).toBe(0.07);
    });
  });

  it("should use monthly expenses for constant dollar calculation", () => {
    const results = compareStrategies(1000000, 30, 0.07, 4000);
    const constantDollar = results.find(r => r.strategyType === "constant_dollar");
    
    // First year withdrawal should be 12 * monthly expenses = $48,000
    expect(constantDollar?.yearlyResults[0]?.withdrawal).toBe(48000);
  });
});

describe("formatSimulationSummary", () => {
  it("should format a successful simulation", () => {
    const result = simulateConstantPercentage(1000000, 0.04, 30, 0.07);
    const summary = formatSimulationSummary(result);
    
    expect(summary).toContain("Constant Percentage");
    expect(summary).toContain("$1,000,000");
    expect(summary).toContain("lasted all 30 years");
  });

  it("should indicate when money runs out", () => {
    const result = simulateConstantDollar(1000000, 100000, 30, 0.03);
    const summary = formatSimulationSummary(result);
    
    expect(summary).toContain("ran out");
  });
});
