/**
 * Copilot SDK tools for detailed asset allocation management.
 */

import { defineTool } from "@github/copilot-sdk";
import {
  validateAssetAllocation,
  calculateExpectedReturn,
  describeAllocationStyle,
  suggestAllocationByTimeHorizon,
} from "../lib/calculations.js";
import { loadProfile, saveProfile } from "../lib/profile.js";
import { PRESET_ALLOCATIONS, ASSET_CLASS_RETURNS } from "../types/index.js";
import type { AssetAllocation } from "../types/index.js";

/**
 * Parameters for setting a custom asset allocation.
 */
export interface SetAssetAllocationParams {
  usStocks: number;
  internationalStocks: number;
  bonds: number;
  cash: number;
}

/**
 * Tool to set a custom asset allocation on the user's profile.
 */
export const setAssetAllocationTool = defineTool<SetAssetAllocationParams>(
  "setAssetAllocation",
  {
    description:
      "Set a custom asset allocation for the user's portfolio. " +
      "Percentages must sum to 100. This overrides the simple risk tolerance " +
      "for return calculations.",
    parameters: {
      type: "object",
      properties: {
        usStocks: {
          type: "number",
          description: "Percentage in US stocks (0-100)",
        },
        internationalStocks: {
          type: "number",
          description: "Percentage in international stocks (0-100)",
        },
        bonds: {
          type: "number",
          description: "Percentage in bonds/fixed income (0-100)",
        },
        cash: {
          type: "number",
          description: "Percentage in cash/money market (0-100)",
        },
      },
      required: ["usStocks", "internationalStocks", "bonds", "cash"],
    },
    handler: async (params) => {
      const allocation: AssetAllocation = {
        usStocks: params.usStocks,
        internationalStocks: params.internationalStocks,
        bonds: params.bonds,
        cash: params.cash,
      };

      // Validate the allocation
      const validation = validateAssetAllocation(allocation);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Load existing profile
      const result = await loadProfile();
      if (!result.found || !result.profile) {
        return {
          success: false,
          error: "No profile found. Please create a profile first.",
        };
      }

      // Update profile with new allocation
      const profile = result.profile;
      profile.assetAllocation = allocation;
      profile.savedAt = new Date().toISOString();
      await saveProfile(profile);

      const expectedReturn = calculateExpectedReturn(allocation);
      const style = describeAllocationStyle(allocation);

      return {
        success: true,
        allocation,
        expectedReturn: (expectedReturn * 100).toFixed(1) + "%",
        style,
        message: `Asset allocation set: ${allocation.usStocks}% US stocks, ` +
          `${allocation.internationalStocks}% international stocks, ` +
          `${allocation.bonds}% bonds, ${allocation.cash}% cash. ` +
          `Expected return: ${(expectedReturn * 100).toFixed(1)}% (${style}).`,
      };
    },
  }
);

/**
 * Parameters for calculating expected return from an allocation.
 */
export interface CalculateAllocationReturnParams {
  usStocks: number;
  internationalStocks: number;
  bonds: number;
  cash: number;
}

/**
 * Tool to calculate expected return for a given asset allocation without saving it.
 */
export const calculateAllocationReturnTool = defineTool<CalculateAllocationReturnParams>(
  "calculateAllocationReturn",
  {
    description:
      "Calculate the expected annual return for a given asset allocation " +
      "without saving it to the profile. Useful for comparing different allocations.",
    parameters: {
      type: "object",
      properties: {
        usStocks: {
          type: "number",
          description: "Percentage in US stocks (0-100)",
        },
        internationalStocks: {
          type: "number",
          description: "Percentage in international stocks (0-100)",
        },
        bonds: {
          type: "number",
          description: "Percentage in bonds/fixed income (0-100)",
        },
        cash: {
          type: "number",
          description: "Percentage in cash/money market (0-100)",
        },
      },
      required: ["usStocks", "internationalStocks", "bonds", "cash"],
    },
    handler: async (params) => {
      const allocation: AssetAllocation = {
        usStocks: params.usStocks,
        internationalStocks: params.internationalStocks,
        bonds: params.bonds,
        cash: params.cash,
      };

      // Validate the allocation
      const validation = validateAssetAllocation(allocation);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      const expectedReturn = calculateExpectedReturn(allocation);
      const style = describeAllocationStyle(allocation);

      return {
        success: true,
        allocation,
        expectedReturn: (expectedReturn * 100).toFixed(1) + "%",
        expectedReturnDecimal: expectedReturn,
        style,
        breakdown: {
          usStocks: `${allocation.usStocks}% × ${(ASSET_CLASS_RETURNS.usStocks * 100).toFixed(0)}% = ${(allocation.usStocks / 100 * ASSET_CLASS_RETURNS.usStocks * 100).toFixed(2)}%`,
          internationalStocks: `${allocation.internationalStocks}% × ${(ASSET_CLASS_RETURNS.internationalStocks * 100).toFixed(0)}% = ${(allocation.internationalStocks / 100 * ASSET_CLASS_RETURNS.internationalStocks * 100).toFixed(2)}%`,
          bonds: `${allocation.bonds}% × ${(ASSET_CLASS_RETURNS.bonds * 100).toFixed(0)}% = ${(allocation.bonds / 100 * ASSET_CLASS_RETURNS.bonds * 100).toFixed(2)}%`,
          cash: `${allocation.cash}% × ${(ASSET_CLASS_RETURNS.cash * 100).toFixed(0)}% = ${(allocation.cash / 100 * ASSET_CLASS_RETURNS.cash * 100).toFixed(2)}%`,
        },
      };
    },
  }
);

/**
 * Parameters for getting allocation suggestion.
 */
export interface SuggestAllocationParams {
  yearsToRetirement: number;
}

/**
 * Tool to suggest an asset allocation based on time horizon.
 */
export const suggestAllocationTool = defineTool<SuggestAllocationParams>(
  "suggestAllocation",
  {
    description:
      "Suggest an asset allocation based on years until retirement. " +
      "Longer time horizons suggest more stocks, shorter horizons suggest more bonds.",
    parameters: {
      type: "object",
      properties: {
        yearsToRetirement: {
          type: "number",
          description: "Number of years until planned retirement",
        },
      },
      required: ["yearsToRetirement"],
    },
    handler: async (params) => {
      const allocation = suggestAllocationByTimeHorizon(params.yearsToRetirement);
      const expectedReturn = calculateExpectedReturn(allocation);
      const style = describeAllocationStyle(allocation);

      return {
        success: true,
        yearsToRetirement: params.yearsToRetirement,
        suggestedAllocation: allocation,
        expectedReturn: (expectedReturn * 100).toFixed(1) + "%",
        style,
        rationale: params.yearsToRetirement >= 20
          ? "With 20+ years until retirement, you have time to ride out market volatility and can afford a stock-heavy allocation."
          : params.yearsToRetirement >= 10
          ? "With 10-20 years until retirement, a balanced approach provides growth potential while reducing volatility risk."
          : "With less than 10 years until retirement, a more conservative allocation helps protect your savings from market downturns.",
      };
    },
  }
);

/**
 * Tool to show preset allocations for each risk tolerance level.
 */
export const showPresetAllocationsTool = defineTool<Record<string, never>>(
  "showPresetAllocations",
  {
    description:
      "Show the preset asset allocations for conservative, moderate, and aggressive risk tolerances.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
    handler: async () => {
      const presets = {
        conservative: {
          allocation: PRESET_ALLOCATIONS.conservative,
          expectedReturn: (calculateExpectedReturn(PRESET_ALLOCATIONS.conservative) * 100).toFixed(1) + "%",
          style: describeAllocationStyle(PRESET_ALLOCATIONS.conservative),
        },
        moderate: {
          allocation: PRESET_ALLOCATIONS.moderate,
          expectedReturn: (calculateExpectedReturn(PRESET_ALLOCATIONS.moderate) * 100).toFixed(1) + "%",
          style: describeAllocationStyle(PRESET_ALLOCATIONS.moderate),
        },
        aggressive: {
          allocation: PRESET_ALLOCATIONS.aggressive,
          expectedReturn: (calculateExpectedReturn(PRESET_ALLOCATIONS.aggressive) * 100).toFixed(1) + "%",
          style: describeAllocationStyle(PRESET_ALLOCATIONS.aggressive),
        },
      };

      return {
        success: true,
        presets,
        assetClassReturns: {
          usStocks: (ASSET_CLASS_RETURNS.usStocks * 100).toFixed(0) + "% (historical average)",
          internationalStocks: (ASSET_CLASS_RETURNS.internationalStocks * 100).toFixed(0) + "% (historical average)",
          bonds: (ASSET_CLASS_RETURNS.bonds * 100).toFixed(0) + "% (historical average)",
          cash: (ASSET_CLASS_RETURNS.cash * 100).toFixed(0) + "% (historical average)",
        },
      };
    },
  }
);

/**
 * Tool to get the current asset allocation from the user's profile.
 */
export const getCurrentAllocationTool = defineTool<Record<string, never>>(
  "getCurrentAllocation",
  {
    description:
      "Get the user's current asset allocation from their profile. " +
      "Returns the custom allocation if set, or the preset for their risk tolerance.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
    handler: async () => {
      const result = await loadProfile();
      if (!result.found || !result.profile) {
        return {
          success: false,
          error: "No profile found.",
        };
      }

      const profile = result.profile;

      if (profile.assetAllocation) {
        const expectedReturn = calculateExpectedReturn(profile.assetAllocation);
        const style = describeAllocationStyle(profile.assetAllocation);
        return {
          success: true,
          source: "custom",
          allocation: profile.assetAllocation,
          expectedReturn: (expectedReturn * 100).toFixed(1) + "%",
          style,
        };
      }

      // Fall back to preset based on risk tolerance
      const presetAllocation = PRESET_ALLOCATIONS[profile.riskTolerance];
      const expectedReturn = calculateExpectedReturn(presetAllocation);
      const style = describeAllocationStyle(presetAllocation);
      return {
        success: true,
        source: "preset",
        riskTolerance: profile.riskTolerance,
        allocation: presetAllocation,
        expectedReturn: (expectedReturn * 100).toFixed(1) + "%",
        style,
      };
    },
  }
);

/**
 * Tool to clear custom asset allocation and revert to risk tolerance preset.
 */
export const clearCustomAllocationTool = defineTool<Record<string, never>>(
  "clearCustomAllocation",
  {
    description:
      "Remove the custom asset allocation from the user's profile, " +
      "reverting to the preset allocation based on their risk tolerance.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
    handler: async () => {
      const result = await loadProfile();
      if (!result.found || !result.profile) {
        return {
          success: false,
          error: "No profile found.",
        };
      }

      const profile = result.profile;

      if (!profile.assetAllocation) {
        return {
          success: true,
          message: "No custom allocation was set. Using preset for " + profile.riskTolerance + " risk tolerance.",
        };
      }

      delete profile.assetAllocation;
      profile.savedAt = new Date().toISOString();
      await saveProfile(profile);

      const presetAllocation = PRESET_ALLOCATIONS[profile.riskTolerance];
      const expectedReturn = calculateExpectedReturn(presetAllocation);

      return {
        success: true,
        message: `Custom allocation cleared. Now using ${profile.riskTolerance} preset with ${(expectedReturn * 100).toFixed(1)}% expected return.`,
        allocation: presetAllocation,
      };
    },
  }
);
