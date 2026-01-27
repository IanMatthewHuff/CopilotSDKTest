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

// Income flow tools
export {
  addIncomeFlowTool,
  listIncomeFlowsTool,
  removeIncomeFlowTool,
  calculateIncomeFlowImpactTool,
} from "./incomeFlowTools.js";

// Asset allocation tools
export {
  setAssetAllocationTool,
  calculateAllocationReturnTool,
  suggestAllocationTool,
  showPresetAllocationsTool,
  getCurrentAllocationTool,
  clearCustomAllocationTool,
} from "./assetAllocationTools.js";

// Combined tool list for session creation
import { compoundGrowthTool, inflationTool, retirementTargetTool, retirementAgeTool } from "./calculationTools.js";
import { loadProfileTool, saveProfileTool, checkProfileTool, deleteProfileTool } from "./profileTools.js";
import { addIncomeFlowTool, listIncomeFlowsTool, removeIncomeFlowTool, calculateIncomeFlowImpactTool } from "./incomeFlowTools.js";
import { setAssetAllocationTool, calculateAllocationReturnTool, suggestAllocationTool, showPresetAllocationsTool, getCurrentAllocationTool, clearCustomAllocationTool } from "./assetAllocationTools.js";

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
  // Income flow tools
  addIncomeFlowTool,
  listIncomeFlowsTool,
  removeIncomeFlowTool,
  calculateIncomeFlowImpactTool,
  // Asset allocation tools
  setAssetAllocationTool,
  calculateAllocationReturnTool,
  suggestAllocationTool,
  showPresetAllocationsTool,
  getCurrentAllocationTool,
  clearCustomAllocationTool,
];
