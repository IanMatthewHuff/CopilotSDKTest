/**
 * User's financial profile for retirement planning.
 */
export interface UserProfile {
  age: number;
  targetRetirementAge: number;
  maritalStatus: "single" | "married";
  currentSavings: number;
  monthlyContribution: number;
  riskTolerance: "conservative" | "moderate" | "aggressive";
  expectedMonthlyExpenses?: number;
  savedAt: string;
}

/**
 * Result of a retirement projection calculation.
 */
export interface ProjectionResult {
  targetAge: number;
  projectedSavings: number;
  targetAmount: number;
  gap: number;
  onTrack: boolean;
}

/**
 * Result of compound growth calculation.
 */
export interface CompoundGrowthResult {
  futureValue: number;
  totalContributions: number;
  totalGrowth: number;
}

/**
 * Maps risk tolerance to expected annual return rate.
 */
export const RISK_TOLERANCE_RATES: Record<
  UserProfile["riskTolerance"],
  number
> = {
  conservative: 0.05,
  moderate: 0.07,
  aggressive: 0.09,
};

/**
 * Default inflation rate for calculations.
 */
export const DEFAULT_INFLATION_RATE = 0.03;
