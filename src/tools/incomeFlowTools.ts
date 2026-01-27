import { defineTool } from "@github/copilot-sdk";
import type { IncomeFlow } from "../types/index.js";
import {
  generateIncomeFlowId,
  calculateIncomeFlowSummary,
  calculateMonthlyIncomeAtAge,
} from "../lib/calculations.js";
import { loadProfile, saveProfile } from "../lib/profile.js";

/**
 * Parameters for adding an income flow.
 */
export interface AddIncomeFlowParams {
  name: string;
  type: string;
  monthlyAmount: number;
  startAge: number;
  endAge?: number;
  inflationAdjusted: boolean;
}

/**
 * Parameters for removing an income flow.
 */
export interface RemoveIncomeFlowParams {
  incomeFlowId: string;
}

/**
 * Parameters for calculating income flow summary.
 */
export interface IncomeFlowSummaryParams {
  retirementAge: number;
  lifeExpectancy?: number;
}

/**
 * Tool for adding an income flow to the user's profile.
 */
export const addIncomeFlowTool = defineTool<AddIncomeFlowParams>(
  "addIncomeFlow",
  {
    description:
      "Add a retirement income flow such as Social Security, pension, or annuity to the user's profile. " +
      "This helps calculate how much less the user needs to save. " +
      "For Social Security estimates, suggest the user visit ssa.gov/myaccount.",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name/description of the income source (e.g., 'Social Security', 'Company Pension')",
        },
        type: {
          type: "string",
          enum: ["social_security", "pension", "annuity", "part_time_work", "other"],
          description: "Type of income flow",
        },
        monthlyAmount: {
          type: "number",
          description: "Monthly income amount in dollars",
        },
        startAge: {
          type: "number",
          description: "Age when the income starts",
        },
        endAge: {
          type: "number",
          description: "Age when the income ends (omit for lifetime/indefinite income)",
        },
        inflationAdjusted: {
          type: "boolean",
          description: "Whether the income adjusts for inflation (e.g., Social Security has COLA)",
        },
      },
      required: ["name", "type", "monthlyAmount", "startAge", "inflationAdjusted"],
    },
    handler: async (args) => {
      // Load existing profile
      const result = await loadProfile();
      if (!result.found || !result.profile) {
        return {
          success: false,
          error: "No profile found. Please set up your profile first.",
          summary: "Could not add income flow - no profile exists yet.",
        };
      }

      const profile = result.profile;
      const incomeFlows = profile.incomeFlows ?? [];

      // Create new income flow
      const newFlow: IncomeFlow = {
        id: generateIncomeFlowId(),
        name: args.name,
        type: args.type as IncomeFlow["type"],
        monthlyAmount: args.monthlyAmount,
        startAge: args.startAge,
        inflationAdjusted: args.inflationAdjusted,
        ...(args.endAge !== undefined && { endAge: args.endAge }),
      };

      incomeFlows.push(newFlow);

      // Save updated profile
      const updatedProfile = { ...profile, incomeFlows };
      const saveResult = await saveProfile(updatedProfile);

      if (!saveResult.success) {
        return {
          success: false,
          error: saveResult.error,
          summary: `Failed to save income flow: ${saveResult.error}`,
        };
      }

      const inflationNote = args.inflationAdjusted
        ? "inflation-adjusted"
        : "fixed (not inflation-adjusted)";
      const durationNote = args.endAge
        ? `from age ${args.startAge} to ${args.endAge}`
        : `starting at age ${args.startAge} (lifetime)`;

      return {
        success: true,
        incomeFlow: newFlow,
        summary:
          `Added ${args.name}: $${args.monthlyAmount.toLocaleString()}/month, ` +
          `${durationNote}, ${inflationNote}.`,
      };
    },
  }
);

/**
 * Tool for listing all income flows in the user's profile.
 */
export const listIncomeFlowsTool = defineTool("listIncomeFlows", {
  description:
    "List all retirement income flows configured in the user's profile, " +
    "such as Social Security, pensions, and annuities.",
  parameters: {
    type: "object",
    properties: {},
  },
  handler: async () => {
    const result = await loadProfile();
    if (!result.found || !result.profile) {
      return {
        found: false,
        incomeFlows: [],
        summary: "No profile found. No income flows configured.",
      };
    }

    const incomeFlows = result.profile.incomeFlows ?? [];

    if (incomeFlows.length === 0) {
      return {
        found: true,
        incomeFlows: [],
        summary: "No income flows configured yet. Consider adding Social Security or pension income.",
      };
    }

    const flowDescriptions = incomeFlows.map((flow) => {
      const duration = flow.endAge
        ? `ages ${flow.startAge}-${flow.endAge}`
        : `age ${flow.startAge}+`;
      const inflation = flow.inflationAdjusted ? "COLA" : "fixed";
      return `${flow.name}: $${flow.monthlyAmount.toLocaleString()}/mo (${duration}, ${inflation})`;
    });

    return {
      found: true,
      incomeFlows,
      summary: `${incomeFlows.length} income flow(s) configured:\n${flowDescriptions.join("\n")}`,
    };
  },
});

/**
 * Tool for removing an income flow from the user's profile.
 */
export const removeIncomeFlowTool = defineTool<RemoveIncomeFlowParams>(
  "removeIncomeFlow",
  {
    description: "Remove an income flow from the user's profile by its ID.",
    parameters: {
      type: "object",
      properties: {
        incomeFlowId: {
          type: "string",
          description: "The ID of the income flow to remove",
        },
      },
      required: ["incomeFlowId"],
    },
    handler: async (args) => {
      const result = await loadProfile();
      if (!result.found || !result.profile) {
        return {
          success: false,
          error: "No profile found.",
          summary: "Could not remove income flow - no profile exists.",
        };
      }

      const profile = result.profile;
      const incomeFlows = profile.incomeFlows ?? [];
      const flowToRemove = incomeFlows.find((f) => f.id === args.incomeFlowId);

      if (!flowToRemove) {
        return {
          success: false,
          error: "Income flow not found.",
          summary: `No income flow found with ID ${args.incomeFlowId}.`,
        };
      }

      const updatedFlows = incomeFlows.filter((f) => f.id !== args.incomeFlowId);
      const updatedProfile = { ...profile, incomeFlows: updatedFlows };
      const saveResult = await saveProfile(updatedProfile);

      if (!saveResult.success) {
        return {
          success: false,
          error: saveResult.error,
          summary: `Failed to remove income flow: ${saveResult.error}`,
        };
      }

      return {
        success: true,
        removedFlow: flowToRemove,
        summary: `Removed income flow: ${flowToRemove.name}`,
      };
    },
  }
);

/**
 * Tool for calculating the impact of income flows on retirement planning.
 */
export const calculateIncomeFlowImpactTool = defineTool<IncomeFlowSummaryParams>(
  "calculateIncomeFlowImpact",
  {
    description:
      "Calculate the total impact of all income flows on retirement planning, " +
      "including total monthly income, lifetime value, and how much less savings is needed.",
    parameters: {
      type: "object",
      properties: {
        retirementAge: {
          type: "number",
          description: "The age at which the user plans to retire",
        },
        lifeExpectancy: {
          type: "number",
          description: "Expected lifespan for calculations (default: 95)",
        },
      },
      required: ["retirementAge"],
    },
    handler: async (args) => {
      const result = await loadProfile();
      if (!result.found || !result.profile) {
        return {
          success: false,
          error: "No profile found.",
          summary: "Could not calculate impact - no profile exists.",
        };
      }

      const incomeFlows = result.profile.incomeFlows ?? [];
      if (incomeFlows.length === 0) {
        return {
          success: true,
          hasIncomeFlows: false,
          summary: "No income flows configured. All retirement expenses must come from savings.",
        };
      }

      const lifeExpectancy = args.lifeExpectancy ?? 95;
      const summary = calculateIncomeFlowSummary(
        incomeFlows,
        args.retirementAge,
        lifeExpectancy
      );

      const incomeAtRetirement = calculateMonthlyIncomeAtAge(incomeFlows, args.retirementAge);

      return {
        success: true,
        hasIncomeFlows: true,
        ...summary,
        incomeAtRetirement,
        summary:
          `Income flows reduce needed savings by approximately $${summary.savingsReduction.toLocaleString()}. ` +
          `At retirement (age ${args.retirementAge}), you'll receive $${incomeAtRetirement.toLocaleString()}/month ` +
          `from ${incomeFlows.length} source(s). ` +
          `Total lifetime value: ~$${summary.totalLifetimeValue.toLocaleString()}.`,
      };
    },
  }
);
