import { defineTool } from "@github/copilot-sdk";
import {
  suggestWithdrawalRate,
  calculateRetirementTargetWithSWR,
} from "../lib/calculations.js";

/**
 * Parameters for suggesting a withdrawal rate.
 */
export interface SuggestWithdrawalRateParams {
  retirementYears: number;
}

/**
 * Parameters for calculating retirement target with custom SWR.
 */
export interface CalculateTargetWithSWRParams {
  monthlyExpenses: number;
  withdrawalRate: number;
}

/**
 * Tool for suggesting a safe withdrawal rate based on retirement length.
 */
export const suggestWithdrawalRateTool = defineTool<SuggestWithdrawalRateParams>(
  "suggestWithdrawalRate",
  {
    description:
      "Suggest an appropriate safe withdrawal rate (SWR) based on expected retirement length. " +
      "The traditional 4% rule assumes a 30-year retirement. Longer retirements need lower rates " +
      "to reduce the risk of running out of money, while shorter retirements can use higher rates. " +
      "Use this when the user's retirement length differs significantly from 30 years.",
    parameters: {
      type: "object",
      properties: {
        retirementYears: {
          type: "number",
          description:
            "Expected number of years in retirement (e.g., age 95 minus retirement age)",
        },
      },
      required: ["retirementYears"],
    },
    handler: async (args) => {
      const guidance = suggestWithdrawalRate(args.retirementYears);
      return {
        retirementYears: args.retirementYears,
        standardRate: guidance.standardRate,
        conservativeRate: guidance.conservativeRate,
        standardRatePercent: `${(guidance.standardRate * 100).toFixed(2)}%`,
        conservativeRatePercent: `${(guidance.conservativeRate * 100).toFixed(2)}%`,
        description: guidance.description,
        summary:
          `For a ${args.retirementYears}-year retirement: ` +
          `standard rate is ${(guidance.standardRate * 100).toFixed(1)}%, ` +
          `conservative rate is ${(guidance.conservativeRate * 100).toFixed(2)}%. ` +
          guidance.description,
      };
    },
  }
);

/**
 * Tool for calculating retirement target with a specific withdrawal rate.
 */
export const calculateTargetWithSWRTool = defineTool<CalculateTargetWithSWRParams>(
  "calculateRetirementTargetWithSWR",
  {
    description:
      "Calculate how much total savings is needed for retirement based on expected monthly expenses " +
      "and a specific safe withdrawal rate. Use this when the user wants a different rate than the " +
      "default 4% rule (e.g., for longer or shorter retirements).",
    parameters: {
      type: "object",
      properties: {
        monthlyExpenses: {
          type: "number",
          description: "Expected monthly expenses in retirement in dollars",
        },
        withdrawalRate: {
          type: "number",
          description:
            "Safe withdrawal rate as a decimal (e.g., 0.035 for 3.5%)",
        },
      },
      required: ["monthlyExpenses", "withdrawalRate"],
    },
    handler: async (args) => {
      const target = calculateRetirementTargetWithSWR(
        args.monthlyExpenses,
        args.withdrawalRate
      );
      const annualExpenses = args.monthlyExpenses * 12;
      const multiplier = Math.round(1 / args.withdrawalRate);
      
      return {
        monthlyExpenses: args.monthlyExpenses,
        annualExpenses,
        withdrawalRate: args.withdrawalRate,
        withdrawalRatePercent: `${(args.withdrawalRate * 100).toFixed(2)}%`,
        targetSavings: target,
        multiplier,
        summary:
          `To support $${args.monthlyExpenses.toLocaleString()}/month ` +
          `($${annualExpenses.toLocaleString()}/year) in retirement with a ` +
          `${(args.withdrawalRate * 100).toFixed(1)}% withdrawal rate, ` +
          `you need approximately $${target.toLocaleString()} saved ` +
          `(${multiplier}x annual expenses)`,
      };
    },
  }
);
