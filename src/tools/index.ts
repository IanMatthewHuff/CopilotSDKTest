/**
 * Copilot SDK tool definitions for the Retirement Planning Advisor.
 */

// Calculation tools
export {
  compoundGrowthTool,
  inflationTool,
  retirementTargetTool,
  retirementAgeTool,
} from "./calculationTools.js";

// Profile tools
export {
  loadProfileTool,
  saveProfileTool,
  checkProfileTool,
  deleteProfileTool,
} from "./profileTools.js";

// Combined tool list for session creation
import { compoundGrowthTool, inflationTool, retirementTargetTool, retirementAgeTool } from "./calculationTools.js";
import { loadProfileTool, saveProfileTool, checkProfileTool, deleteProfileTool } from "./profileTools.js";

/**
 * All tools available to the retirement planning advisor.
 */
export const retirementTools = [
  // Calculation tools
  compoundGrowthTool,
  inflationTool,
  retirementTargetTool,
  retirementAgeTool,
  // Profile tools
  loadProfileTool,
  saveProfileTool,
  checkProfileTool,
  deleteProfileTool,
];
