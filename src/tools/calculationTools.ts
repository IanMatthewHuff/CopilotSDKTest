import { defineTool } from "@github/copilot-sdk";
import {
  calculateCompoundGrowth,
  adjustForInflation,
  calculateRetirementTarget,
  projectRetirementAge,
} from "../lib/calculations.js";

/**
 * Parameters for compound growth calculation.
 */
export interface CompoundGrowthParams {
  principal: number;
  monthlyContribution: number;
  annualRate: number;
  years: number;
}

/**
 * Parameters for inflation adjustment.
 */
export interface InflationParams {
  futureAmount: number;
  years: number;
  inflationRate?: number;
}

/**
 * Parameters for retirement target calculation.
 */
export interface RetirementTargetParams {
  monthlyExpenses: number;
}

/**
 * Parameters for retirement age projection.
 */
export interface RetirementAgeParams {
  currentAge: number;
  currentSavings: number;
  monthlyContribution: number;
  targetAmount: number;
  annualRate: number;
  maxAge?: number;
}

/**
 * Tool for calculating compound growth of investments.
 */
export const compoundGrowthTool = defineTool<CompoundGrowthParams>(
  "calculateCompoundGrowth",
  {
    description:
      "Calculate the future value of investments with compound growth over time. " +
      "Use this to project how much savings will grow given current balance, " +
      "monthly contributions, expected return rate, and time horizon.",
    parameters: {
      type: "object",
      properties: {
        principal: {
          type: "number",
          description: "Current savings amount in dollars",
        },
        monthlyContribution: {
          type: "number",
          description: "Monthly contribution amount in dollars",
        },
        annualRate: {
          type: "number",
          description:
            "Expected annual return rate as a decimal (e.g., 0.07 for 7%)",
        },
        years: {
          type: "number",
          description: "Number of years to project",
        },
      },
      required: ["principal", "monthlyContribution", "annualRate", "years"],
    },
    handler: async (args) => {
      const result = calculateCompoundGrowth(
        args.principal,
        args.monthlyContribution,
        args.annualRate,
        args.years
      );
      return {
        futureValue: result.futureValue,
        totalContributions: result.totalContributions,
        totalGrowth: result.totalGrowth,
        summary:
          `After ${args.years} years: $${result.futureValue.toLocaleString()} ` +
          `(contributed $${result.totalContributions.toLocaleString()}, ` +
          `earned $${result.totalGrowth.toLocaleString()} in growth)`,
      };
    },
  }
);

/**
 * Tool for adjusting future amounts for inflation.
 */
export const inflationTool = defineTool<InflationParams>("adjustForInflation", {
  description:
    "Convert a future dollar amount to today's purchasing power by adjusting for inflation. " +
    "Use this to help users understand what their future savings will actually be worth.",
  parameters: {
    type: "object",
    properties: {
      futureAmount: {
        type: "number",
        description: "The future dollar amount to adjust",
      },
      years: {
        type: "number",
        description: "Number of years in the future",
      },
      inflationRate: {
        type: "number",
        description:
          "Annual inflation rate as a decimal (e.g., 0.03 for 3%). Defaults to 0.03 if not provided.",
      },
    },
    required: ["futureAmount", "years"],
  },
  handler: async (args) => {
    const rate = args.inflationRate ?? 0.03;
    const adjustedValue = adjustForInflation(args.futureAmount, args.years, rate);
    return {
      originalAmount: args.futureAmount,
      adjustedAmount: adjustedValue,
      yearsAhead: args.years,
      inflationRate: rate,
      summary:
        `$${args.futureAmount.toLocaleString()} in ${args.years} years ` +
        `is worth about $${adjustedValue.toLocaleString()} in today's dollars ` +
        `(assuming ${(rate * 100).toFixed(1)}% annual inflation)`,
    };
  },
});

/**
 * Tool for calculating retirement savings target.
 */
export const retirementTargetTool = defineTool<RetirementTargetParams>(
  "calculateRetirementTarget",
  {
    description:
      "Calculate how much total savings is needed for retirement based on expected monthly expenses. " +
      "Uses the 4% safe withdrawal rule (25x annual expenses).",
    parameters: {
      type: "object",
      properties: {
        monthlyExpenses: {
          type: "number",
          description: "Expected monthly expenses in retirement in dollars",
        },
      },
      required: ["monthlyExpenses"],
    },
    handler: async (args) => {
      const target = calculateRetirementTarget(args.monthlyExpenses);
      const annualExpenses = args.monthlyExpenses * 12;
      return {
        monthlyExpenses: args.monthlyExpenses,
        annualExpenses,
        targetSavings: target,
        withdrawalRate: 0.04,
        summary:
          `To support $${args.monthlyExpenses.toLocaleString()}/month ` +
          `($${annualExpenses.toLocaleString()}/year) in retirement, ` +
          `you need approximately $${target.toLocaleString()} saved (using 4% withdrawal rule)`,
      };
    },
  }
);

/**
 * Tool for projecting retirement age.
 */
export const retirementAgeTool = defineTool<RetirementAgeParams>(
  "projectRetirementAge",
  {
    description:
      "Calculate when someone can retire based on their current savings, contributions, " +
      "target amount, and expected returns. Returns the age at which they'll reach their goal.",
    parameters: {
      type: "object",
      properties: {
        currentAge: {
          type: "number",
          description: "User's current age",
        },
        currentSavings: {
          type: "number",
          description: "Current retirement savings in dollars",
        },
        monthlyContribution: {
          type: "number",
          description: "Monthly contribution to retirement in dollars",
        },
        targetAmount: {
          type: "number",
          description: "Target retirement savings amount in dollars",
        },
        annualRate: {
          type: "number",
          description:
            "Expected annual return rate as a decimal (e.g., 0.07 for 7%)",
        },
        maxAge: {
          type: "number",
          description: "Maximum age to project to (defaults to 80)",
        },
      },
      required: [
        "currentAge",
        "currentSavings",
        "monthlyContribution",
        "targetAmount",
        "annualRate",
      ],
    },
    handler: async (args) => {
      const maxAge = args.maxAge ?? 80;
      const retirementAge = projectRetirementAge(
        args.currentAge,
        args.currentSavings,
        args.monthlyContribution,
        args.targetAmount,
        args.annualRate,
        maxAge
      );

      if (retirementAge === null) {
        return {
          reachable: false,
          currentAge: args.currentAge,
          targetAmount: args.targetAmount,
          summary:
            `Based on current trajectory, the target of $${args.targetAmount.toLocaleString()} ` +
            `may not be reached by age ${maxAge}. Consider increasing contributions or adjusting the target.`,
        };
      }

      const yearsUntilRetirement = retirementAge - args.currentAge;
      return {
        reachable: true,
        retirementAge,
        currentAge: args.currentAge,
        yearsUntilRetirement,
        targetAmount: args.targetAmount,
        summary:
          `At the current pace, the target of $${args.targetAmount.toLocaleString()} ` +
          `can be reached at age ${retirementAge} (${yearsUntilRetirement} years from now)`,
      };
    },
  }
);
