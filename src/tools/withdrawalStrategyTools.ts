import { defineTool } from "@github/copilot-sdk";
import type { WithdrawalStrategyType, GuardrailsConfig } from "../types/index.js";
import { DEFAULT_GUARDRAILS_CONFIG } from "../types/index.js";
import {
  getStrategyInfo,
  getAllStrategies,
  simulateConstantDollar,
  simulateConstantPercentage,
  simulateGuardrails,
  compareStrategies,
} from "../lib/withdrawalStrategies.js";

/**
 * Parameters for explaining a withdrawal strategy.
 */
export interface ExplainStrategyParams {
  strategy: WithdrawalStrategyType;
}

/**
 * Parameters for comparing withdrawal strategies.
 */
export interface CompareStrategiesParams {
  initialPortfolio: number;
  years: number;
  annualReturn: number;
  monthlyExpenses: number;
}

/**
 * Parameters for simulating a withdrawal strategy.
 */
export interface SimulateStrategyParams {
  strategy: WithdrawalStrategyType;
  initialPortfolio: number;
  years: number;
  annualReturn: number;
  /** For constant_dollar: annual withdrawal amount */
  annualWithdrawal?: number;
  /** For constant_percentage: withdrawal rate (e.g., 0.04) */
  withdrawalRate?: number;
  /** For guardrails: custom configuration */
  guardrailsConfig?: GuardrailsConfig;
}

/**
 * Tool for explaining a specific withdrawal strategy.
 */
export const explainWithdrawalStrategyTool = defineTool<ExplainStrategyParams>(
  "explainWithdrawalStrategy",
  {
    description:
      "Get a detailed explanation of a specific retirement withdrawal strategy, " +
      "including how it works, its pros and cons, and an example. " +
      "Use this when users want to understand a particular strategy in depth.",
    parameters: {
      type: "object",
      properties: {
        strategy: {
          type: "string",
          enum: ["constant_dollar", "constant_percentage", "guardrails", "bucket"],
          description: "The withdrawal strategy to explain",
        },
      },
      required: ["strategy"],
    },
    handler: async (args) => {
      const info = getStrategyInfo(args.strategy);
      
      if (!info) {
        return {
          error: true,
          message: `Unknown strategy: ${args.strategy}`,
        };
      }

      return {
        type: info.type,
        name: info.name,
        description: info.description,
        pros: info.pros,
        cons: info.cons,
        example: info.example,
        summary: `${info.name}: ${info.description}`,
      };
    },
  }
);

/**
 * Tool for listing all available withdrawal strategies.
 */
export const listWithdrawalStrategiesTool = defineTool(
  "listWithdrawalStrategies",
  {
    description:
      "List all available retirement withdrawal strategies with brief descriptions. " +
      "Use this when users want to see their options or ask 'what withdrawal strategies are available?'",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
    handler: async () => {
      const strategies = getAllStrategies();
      
      return {
        strategies: strategies.map(s => ({
          type: s.type,
          name: s.name,
          description: s.description,
        })),
        summary: strategies.map(s => `• ${s.name}: ${s.description.split('.')[0]}.`).join('\n'),
      };
    },
  }
);

/**
 * Tool for comparing withdrawal strategies side by side.
 */
export const compareWithdrawalStrategiesTool = defineTool<CompareStrategiesParams>(
  "compareWithdrawalStrategies",
  {
    description:
      "Compare different withdrawal strategies by simulating them with the same " +
      "starting conditions. Shows how each strategy would perform over time. " +
      "Use this when users want to see how strategies compare for their situation.",
    parameters: {
      type: "object",
      properties: {
        initialPortfolio: {
          type: "number",
          description: "Starting portfolio value in dollars",
        },
        years: {
          type: "number",
          description: "Number of years to simulate (e.g., 30 for a 30-year retirement)",
        },
        annualReturn: {
          type: "number",
          description: "Expected annual return rate as decimal (e.g., 0.07 for 7%)",
        },
        monthlyExpenses: {
          type: "number",
          description: "Expected monthly expenses in retirement",
        },
      },
      required: ["initialPortfolio", "years", "annualReturn", "monthlyExpenses"],
    },
    handler: async (args) => {
      const results = compareStrategies(
        args.initialPortfolio,
        args.years,
        args.annualReturn,
        args.monthlyExpenses
      );

      const comparison = results.map(r => {
        const strategy = getStrategyInfo(r.strategyType);
        return {
          strategy: strategy?.name ?? r.strategyType,
          finalBalance: r.finalBalance,
          totalWithdrawn: r.totalWithdrawn,
          averageAnnualWithdrawal: r.averageWithdrawal,
          minWithdrawal: r.minWithdrawal,
          maxWithdrawal: r.maxWithdrawal,
          incomeVariability: r.maxWithdrawal - r.minWithdrawal,
          ranOutOfMoney: r.ranOutOfMoney,
          depletionYear: r.depletionYear,
        };
      });

      return {
        initialPortfolio: args.initialPortfolio,
        years: args.years,
        annualReturn: args.annualReturn,
        monthlyExpenses: args.monthlyExpenses,
        comparison,
        summary: comparison.map(c => 
          `${c.strategy}: Avg withdrawal $${c.averageAnnualWithdrawal.toLocaleString()}/yr, ` +
          `final balance $${c.finalBalance.toLocaleString()}` +
          (c.ranOutOfMoney ? ` (depleted year ${c.depletionYear})` : '')
        ).join('\n'),
      };
    },
  }
);

/**
 * Tool for simulating a specific withdrawal strategy.
 */
export const simulateWithdrawalStrategyTool = defineTool<SimulateStrategyParams>(
  "simulateWithdrawalStrategy",
  {
    description:
      "Simulate a specific withdrawal strategy to see projected outcomes over time. " +
      "Shows year-by-year withdrawals, portfolio balance, and whether money lasts. " +
      "Use this for detailed projections of a chosen strategy.",
    parameters: {
      type: "object",
      properties: {
        strategy: {
          type: "string",
          enum: ["constant_dollar", "constant_percentage", "guardrails"],
          description: "The withdrawal strategy to simulate",
        },
        initialPortfolio: {
          type: "number",
          description: "Starting portfolio value in dollars",
        },
        years: {
          type: "number",
          description: "Number of years to simulate",
        },
        annualReturn: {
          type: "number",
          description: "Expected annual return rate as decimal (e.g., 0.07 for 7%)",
        },
        annualWithdrawal: {
          type: "number",
          description: "For constant_dollar: initial annual withdrawal amount in dollars",
        },
        withdrawalRate: {
          type: "number",
          description: "For constant_percentage: withdrawal rate as decimal (e.g., 0.04 for 4%)",
        },
      },
      required: ["strategy", "initialPortfolio", "years", "annualReturn"],
    },
    handler: async (args) => {
      let result;

      switch (args.strategy) {
        case "constant_dollar": {
          const withdrawal = args.annualWithdrawal ?? args.initialPortfolio * 0.04;
          result = simulateConstantDollar(
            args.initialPortfolio,
            withdrawal,
            args.years,
            args.annualReturn
          );
          break;
        }
        case "constant_percentage": {
          const rate = args.withdrawalRate ?? 0.04;
          result = simulateConstantPercentage(
            args.initialPortfolio,
            rate,
            args.years,
            args.annualReturn
          );
          break;
        }
        case "guardrails": {
          const config = args.guardrailsConfig ?? DEFAULT_GUARDRAILS_CONFIG;
          result = simulateGuardrails(
            args.initialPortfolio,
            args.years,
            args.annualReturn,
            config
          );
          break;
        }
        default:
          return {
            error: true,
            message: `Strategy '${args.strategy}' cannot be simulated. Use explainWithdrawalStrategy for details.`,
          };
      }

      const strategy = getStrategyInfo(result.strategyType);

      // Return summary plus first and last 5 years for context
      const firstYears = result.yearlyResults.slice(0, 5);
      const lastYears = result.yearlyResults.slice(-5);

      return {
        strategy: strategy?.name ?? result.strategyType,
        initialPortfolio: result.initialPortfolio,
        years: result.years,
        annualReturn: result.annualReturn,
        finalBalance: result.finalBalance,
        totalWithdrawn: result.totalWithdrawn,
        averageAnnualWithdrawal: result.averageWithdrawal,
        minWithdrawal: result.minWithdrawal,
        maxWithdrawal: result.maxWithdrawal,
        ranOutOfMoney: result.ranOutOfMoney,
        depletionYear: result.depletionYear,
        firstFiveYears: firstYears.map(y => ({
          year: y.year,
          withdrawal: y.withdrawal,
          endingBalance: y.endingBalance,
        })),
        lastFiveYears: lastYears.map(y => ({
          year: y.year,
          withdrawal: y.withdrawal,
          endingBalance: y.endingBalance,
        })),
        summary:
          `${strategy?.name}: Starting with $${result.initialPortfolio.toLocaleString()}, ` +
          `avg withdrawal $${result.averageWithdrawal.toLocaleString()}/yr ` +
          `(range: $${result.minWithdrawal.toLocaleString()}-$${result.maxWithdrawal.toLocaleString()}). ` +
          (result.ranOutOfMoney
            ? `⚠️ Portfolio depleted in year ${result.depletionYear}.`
            : `Final balance: $${result.finalBalance.toLocaleString()} after ${result.years} years.`),
      };
    },
  }
);
