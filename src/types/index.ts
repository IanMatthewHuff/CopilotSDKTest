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
  incomeFlows?: IncomeFlow[];
  savedAt: string;
}

/**
 * An income flow during retirement (e.g., Social Security, pension).
 */
export interface IncomeFlow {
  /** Unique identifier for this income flow */
  id: string;
  /** Name/description of the income source */
  name: string;
  /** Type of income flow */
  type: "social_security" | "pension" | "annuity" | "part_time_work" | "other";
  /** Monthly amount in dollars */
  monthlyAmount: number;
  /** Age when the income starts */
  startAge: number;
  /** Age when the income ends (undefined = lifetime/indefinite) */
  endAge?: number;
  /** Whether the income is adjusted for inflation (e.g., Social Security COLA) */
  inflationAdjusted: boolean;
}

/**
 * Result of income flow calculations.
 */
export interface IncomeFlowSummary {
  /** Total monthly income at a given age */
  totalMonthlyIncome: number;
  /** Total lifetime value of all income flows */
  totalLifetimeValue: number;
  /** Reduction in required savings due to income flows */
  savingsReduction: number;
  /** Breakdown by income source */
  breakdown: {
    name: string;
    monthlyAmount: number;
    lifetimeValue: number;
  }[];
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
