import { defineTool } from "@github/copilot-sdk";
import {
  loadProfile,
  saveProfile,
  profileExists,
  deleteProfile,
} from "../lib/profile.js";
import type { UserProfile } from "../types/index.js";

/**
 * Parameters for saving a user profile.
 */
export interface SaveProfileParams {
  age: number;
  targetRetirementAge: number;
  maritalStatus: string;
  currentSavings: number;
  monthlyContribution: number;
  riskTolerance: string;
  expectedMonthlyExpenses?: number;
}

/**
 * Tool for loading a saved user profile.
 */
export const loadProfileTool = defineTool("loadUserProfile", {
  description:
    "Load a previously saved user profile from disk. " +
    "Use this at the start of a conversation to check if the user has existing data.",
  parameters: {
    type: "object",
    properties: {},
  },
  handler: async () => {
    const exists = await profileExists();
    if (!exists) {
      return {
        found: false,
        profile: null,
        summary: "No saved profile found. This appears to be a new user.",
      };
    }

    const result = await loadProfile();
    if (!result.found || !result.profile) {
      return {
        found: false,
        profile: null,
        error: result.error,
        summary: result.error
          ? `Error loading profile: ${result.error}`
          : "No saved profile found.",
      };
    }

    return {
      found: true,
      profile: result.profile,
      summary:
        `Found saved profile for ${result.profile.age}-year-old ` +
        `(${result.profile.maritalStatus}) with $${result.profile.currentSavings.toLocaleString()} saved. ` +
        `Last updated: ${result.profile.savedAt}`,
    };
  },
});

/**
 * Tool for saving a user profile.
 */
export const saveProfileTool = defineTool<SaveProfileParams>("saveUserProfile", {
  description:
    "Save the user's financial profile to disk for future sessions. " +
    "Use this when the user agrees to save their information.",
  parameters: {
    type: "object",
    properties: {
      age: {
        type: "number",
        description: "User's current age",
      },
      targetRetirementAge: {
        type: "number",
        description: "User's target retirement age",
      },
      maritalStatus: {
        type: "string",
        enum: ["single", "married"],
        description: "User's marital status",
      },
      currentSavings: {
        type: "number",
        description: "Current retirement savings in dollars",
      },
      monthlyContribution: {
        type: "number",
        description: "Monthly contribution to retirement in dollars",
      },
      riskTolerance: {
        type: "string",
        enum: ["conservative", "moderate", "aggressive"],
        description: "User's investment risk tolerance",
      },
      expectedMonthlyExpenses: {
        type: "number",
        description: "Expected monthly expenses in retirement (optional)",
      },
    },
    required: [
      "age",
      "targetRetirementAge",
      "maritalStatus",
      "currentSavings",
      "monthlyContribution",
      "riskTolerance",
    ],
  },
  handler: async (args) => {
    const profile: UserProfile = {
      age: args.age,
      targetRetirementAge: args.targetRetirementAge,
      maritalStatus: args.maritalStatus as "single" | "married",
      currentSavings: args.currentSavings,
      monthlyContribution: args.monthlyContribution,
      riskTolerance: args.riskTolerance as
        | "conservative"
        | "moderate"
        | "aggressive",
      savedAt: "", // Will be set by saveProfile
      ...(args.expectedMonthlyExpenses !== undefined && {
        expectedMonthlyExpenses: args.expectedMonthlyExpenses,
      }),
    };

    const result = await saveProfile(profile);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        summary: `Failed to save profile: ${result.error}`,
      };
    }

    return {
      success: true,
      path: result.path,
      summary:
        "Profile saved successfully. It will be available in future sessions.",
    };
  },
});

/**
 * Tool for checking if a profile exists.
 */
export const checkProfileTool = defineTool("checkProfileExists", {
  description:
    "Check if a saved user profile exists without loading it. " +
    "Use this to quickly determine if this is a new or returning user.",
  parameters: {
    type: "object",
    properties: {},
  },
  handler: async () => {
    const exists = await profileExists();
    return {
      exists,
      summary: exists
        ? "A saved profile exists for this user."
        : "No saved profile found. This is a new user.",
    };
  },
});

/**
 * Tool for deleting a saved profile.
 */
export const deleteProfileTool = defineTool("deleteUserProfile", {
  description:
    "Delete the user's saved profile. Use this if the user wants to start fresh " +
    "or remove their saved data.",
  parameters: {
    type: "object",
    properties: {},
  },
  handler: async () => {
    const existed = await profileExists();
    if (!existed) {
      return {
        deleted: false,
        summary: "No profile to delete.",
      };
    }

    const deleted = await deleteProfile();
    return {
      deleted,
      summary: deleted
        ? "Profile deleted successfully."
        : "Failed to delete profile.",
    };
  },
});
