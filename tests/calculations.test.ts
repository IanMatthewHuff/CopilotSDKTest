import { describe, it, expect } from "vitest";
import {
  calculateCompoundGrowth,
  adjustForInflation,
  calculateRetirementTarget,
  projectRetirementAge,
  generateIncomeFlowId,
  calculateMonthlyIncomeAtAge,
  calculateIncomeFlowLifetimeValue,
  calculateIncomeFlowSummary,
  validateAssetAllocation,
  calculateExpectedReturn,
  describeAllocationStyle,
  suggestAllocationByTimeHorizon,
} from "../src/lib/calculations.js";
import type { IncomeFlow, AssetAllocation } from "../src/types/index.js";

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

describe("income flow calculations", () => {
  const sampleSocialSecurity: IncomeFlow = {
    id: "ss1",
    name: "Social Security",
    type: "social_security",
    monthlyAmount: 2400,
    startAge: 67,
    inflationAdjusted: true,
  };

  const samplePension: IncomeFlow = {
    id: "pen1",
    name: "Company Pension",
    type: "pension",
    monthlyAmount: 1500,
    startAge: 65,
    endAge: 85,
    inflationAdjusted: false,
  };

  describe("generateIncomeFlowId", () => {
    it("should generate unique IDs", () => {
      const id1 = generateIncomeFlowId();
      const id2 = generateIncomeFlowId();

      expect(id1).toMatch(/^inc_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^inc_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe("calculateMonthlyIncomeAtAge", () => {
    it("should return 0 before income starts", () => {
      const income = calculateMonthlyIncomeAtAge([sampleSocialSecurity], 60);
      expect(income).toBe(0);
    });

    it("should return monthly amount when income is active", () => {
      const income = calculateMonthlyIncomeAtAge([sampleSocialSecurity], 70);
      expect(income).toBe(2400);
    });

    it("should sum multiple income flows", () => {
      const income = calculateMonthlyIncomeAtAge(
        [sampleSocialSecurity, samplePension],
        70
      );
      expect(income).toBe(2400 + 1500);
    });

    it("should respect end age for limited income flows", () => {
      const income = calculateMonthlyIncomeAtAge([samplePension], 86);
      expect(income).toBe(0);
    });

    it("should include income up to but not including end age", () => {
      const income = calculateMonthlyIncomeAtAge([samplePension], 84);
      expect(income).toBe(1500);
    });
  });

  describe("calculateIncomeFlowLifetimeValue", () => {
    it("should calculate lifetime value for inflation-adjusted income", () => {
      // Social Security at $2400/mo from age 67 to 95 = 28 years
      // Inflation-adjusted: $2400 * 12 * 28 = $806,400
      const value = calculateIncomeFlowLifetimeValue(sampleSocialSecurity, 65, 95);
      expect(value).toBe(2400 * 12 * 28);
    });

    it("should calculate reduced value for non-inflation-adjusted income", () => {
      // Pension at $1500/mo from age 65 to 85 = 20 years
      // Not inflation-adjusted, so real value decreases over time
      const value = calculateIncomeFlowLifetimeValue(samplePension, 65, 95);
      
      // Should be less than simple sum due to inflation
      const simpleSum = 1500 * 12 * 20;
      expect(value).toBeLessThan(simpleSum);
      expect(value).toBeGreaterThan(0);
    });

    it("should return 0 if retirement is after income ends", () => {
      const value = calculateIncomeFlowLifetimeValue(samplePension, 90, 95);
      expect(value).toBe(0);
    });

    it("should use retirement age as start if later than income start", () => {
      // Retiring at 70, SS starts at 67, so only count from 70
      const value = calculateIncomeFlowLifetimeValue(sampleSocialSecurity, 70, 95);
      expect(value).toBe(2400 * 12 * 25); // 25 years from 70 to 95
    });
  });

  describe("calculateIncomeFlowSummary", () => {
    it("should calculate summary for multiple income flows", () => {
      const summary = calculateIncomeFlowSummary(
        [sampleSocialSecurity, samplePension],
        65,
        95
      );

      expect(summary.totalMonthlyIncome).toBe(1500); // Only pension at 65
      expect(summary.breakdown).toHaveLength(2);
      expect(summary.savingsReduction).toBeGreaterThan(0);
      expect(summary.totalLifetimeValue).toBeGreaterThan(0);
    });

    it("should calculate savings reduction based on 4% rule", () => {
      // $1500/mo at retirement = $18,000/year
      // Savings reduction = $18,000 * 25 = $450,000
      const summary = calculateIncomeFlowSummary([samplePension], 65, 95);
      expect(summary.savingsReduction).toBe(1500 * 12 * 25);
    });

    it("should handle empty income flows", () => {
      const summary = calculateIncomeFlowSummary([], 65, 95);

      expect(summary.totalMonthlyIncome).toBe(0);
      expect(summary.totalLifetimeValue).toBe(0);
      expect(summary.savingsReduction).toBe(0);
      expect(summary.breakdown).toHaveLength(0);
    });
  });
});

describe("asset allocation calculations", () => {
  const balancedAllocation: AssetAllocation = {
    usStocks: 40,
    internationalStocks: 20,
    bonds: 35,
    cash: 5,
  };

  const aggressiveAllocation: AssetAllocation = {
    usStocks: 60,
    internationalStocks: 30,
    bonds: 8,
    cash: 2,
  };

  const conservativeAllocation: AssetAllocation = {
    usStocks: 15,
    internationalStocks: 10,
    bonds: 65,
    cash: 10,
  };

  describe("validateAssetAllocation", () => {
    it("should validate allocation that sums to 100", () => {
      const result = validateAssetAllocation(balancedAllocation);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject allocation that sums to less than 100", () => {
      const invalid: AssetAllocation = {
        usStocks: 40,
        internationalStocks: 20,
        bonds: 30,
        cash: 5,
      };
      const result = validateAssetAllocation(invalid);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("must sum to 100%");
    });

    it("should reject allocation that sums to more than 100", () => {
      const invalid: AssetAllocation = {
        usStocks: 50,
        internationalStocks: 30,
        bonds: 30,
        cash: 10,
      };
      const result = validateAssetAllocation(invalid);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("must sum to 100%");
    });

    it("should reject negative percentages", () => {
      const invalid: AssetAllocation = {
        usStocks: 60,
        internationalStocks: 30,
        bonds: 20,
        cash: -10,
      };
      const result = validateAssetAllocation(invalid);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("cannot be negative");
    });
  });

  describe("calculateExpectedReturn", () => {
    it("should calculate weighted average return", () => {
      // 40% US (10%) + 20% Intl (8%) + 35% Bonds (4%) + 5% Cash (2%)
      // = 4% + 1.6% + 1.4% + 0.1% = 7.1%
      const result = calculateExpectedReturn(balancedAllocation);
      expect(result).toBeCloseTo(0.071, 3);
    });

    it("should return higher for aggressive allocation", () => {
      const aggressiveReturn = calculateExpectedReturn(aggressiveAllocation);
      const conservativeReturn = calculateExpectedReturn(conservativeAllocation);
      expect(aggressiveReturn).toBeGreaterThan(conservativeReturn);
    });

    it("should throw for invalid allocation", () => {
      const invalid: AssetAllocation = {
        usStocks: 50,
        internationalStocks: 50,
        bonds: 50,
        cash: 0,
      };
      expect(() => calculateExpectedReturn(invalid)).toThrow("must sum to 100%");
    });

    it("should return 10% for 100% US stocks", () => {
      const allStocks: AssetAllocation = {
        usStocks: 100,
        internationalStocks: 0,
        bonds: 0,
        cash: 0,
      };
      expect(calculateExpectedReturn(allStocks)).toBeCloseTo(0.10, 3);
    });

    it("should return 2% for 100% cash", () => {
      const allCash: AssetAllocation = {
        usStocks: 0,
        internationalStocks: 0,
        bonds: 0,
        cash: 100,
      };
      expect(calculateExpectedReturn(allCash)).toBeCloseTo(0.02, 3);
    });
  });

  describe("describeAllocationStyle", () => {
    it("should describe aggressive allocation", () => {
      const style = describeAllocationStyle(aggressiveAllocation);
      expect(style).toContain("aggressive");
    });

    it("should describe conservative allocation", () => {
      const style = describeAllocationStyle(conservativeAllocation);
      expect(style).toContain("conservative");
    });

    it("should describe balanced allocation", () => {
      const style = describeAllocationStyle(balancedAllocation);
      expect(style).toContain("balanced");
    });

    it("should describe very aggressive allocation", () => {
      const veryAggressive: AssetAllocation = {
        usStocks: 70,
        internationalStocks: 25,
        bonds: 5,
        cash: 0,
      };
      const style = describeAllocationStyle(veryAggressive);
      expect(style).toContain("very aggressive");
    });
  });

  describe("suggestAllocationByTimeHorizon", () => {
    it("should suggest more stocks for longer time horizon", () => {
      const longHorizon = suggestAllocationByTimeHorizon(30);
      const shortHorizon = suggestAllocationByTimeHorizon(5);
      
      const longStocks = longHorizon.usStocks + longHorizon.internationalStocks;
      const shortStocks = shortHorizon.usStocks + shortHorizon.internationalStocks;
      
      expect(longStocks).toBeGreaterThan(shortStocks);
    });

    it("should always sum to 100%", () => {
      for (const years of [5, 10, 15, 20, 25, 30]) {
        const allocation = suggestAllocationByTimeHorizon(years);
        const sum = allocation.usStocks + allocation.internationalStocks + 
                    allocation.bonds + allocation.cash;
        expect(sum).toBe(100);
      }
    });

    it("should maintain US/international ratio around 70/30", () => {
      const allocation = suggestAllocationByTimeHorizon(20);
      const totalStocks = allocation.usStocks + allocation.internationalStocks;
      
      if (totalStocks > 0) {
        const usRatio = allocation.usStocks / totalStocks;
        expect(usRatio).toBeGreaterThan(0.6);
        expect(usRatio).toBeLessThan(0.8);
      }
    });

    it("should not exceed 90% stocks even for very long horizons", () => {
      const allocation = suggestAllocationByTimeHorizon(50);
      const totalStocks = allocation.usStocks + allocation.internationalStocks;
      expect(totalStocks).toBeLessThanOrEqual(90);
    });

    it("should not go below 20% stocks even for very short horizons", () => {
      const allocation = suggestAllocationByTimeHorizon(1);
      const totalStocks = allocation.usStocks + allocation.internationalStocks;
      expect(totalStocks).toBeGreaterThanOrEqual(20);
    });
  });
});
