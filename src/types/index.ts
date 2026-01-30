/**
 * Detailed asset allocation across asset classes.
 * All values are percentages (0-100) and must sum to 100.
 */
export interface AssetAllocation {
  /** Percentage in US stocks/equities */
  usStocks: number;
  /** Percentage in international stocks/equities */
  internationalStocks: number;
  /** Percentage in bonds/fixed income */
  bonds: number;
  /** Percentage in cash/money market */
  cash: number;
}

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
  /** Detailed asset allocation (optional - overrides riskTolerance for return calculation) */
  assetAllocation?: AssetAllocation;
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

/**
 * Safe withdrawal rate guidance based on retirement length.
 */
export interface SWRGuidance {
  /** Number of years in retirement */
  retirementYears: number;
  /** Standard withdrawal rate (decimal, e.g., 0.04 for 4%) */
  standardRate: number;
  /** More conservative withdrawal rate for added safety */
  conservativeRate: number;
  /** Description of when this guidance applies */
  description: string;
}

/**
 * SWR guidance table based on retirement length.
 * Longer retirements need lower withdrawal rates to reduce failure risk.
 */
export const SWR_GUIDANCE_TABLE: SWRGuidance[] = [
  { retirementYears: 20, standardRate: 0.050, conservativeRate: 0.045, description: "Short retirement (~20 years)" },
  { retirementYears: 25, standardRate: 0.045, conservativeRate: 0.040, description: "Moderate retirement (~25 years)" },
  { retirementYears: 30, standardRate: 0.040, conservativeRate: 0.035, description: "Standard retirement (~30 years)" },
  { retirementYears: 35, standardRate: 0.035, conservativeRate: 0.0325, description: "Long retirement (~35 years)" },
  { retirementYears: 40, standardRate: 0.0325, conservativeRate: 0.030, description: "Very long retirement (40+ years)" },
];

/**
 * Historical average annual returns by asset class.
 * These are nominal returns before inflation adjustment.
 */
export const ASSET_CLASS_RETURNS: Record<keyof AssetAllocation, number> = {
  usStocks: 0.10,           // ~10% historical US stock returns
  internationalStocks: 0.08, // ~8% historical international stock returns
  bonds: 0.04,              // ~4% historical bond returns
  cash: 0.02,               // ~2% cash/money market returns
};

/**
 * Preset asset allocations for each risk tolerance level.
 */
export const PRESET_ALLOCATIONS: Record<UserProfile["riskTolerance"], AssetAllocation> = {
  conservative: {
    usStocks: 20,
    internationalStocks: 10,
    bonds: 60,
    cash: 10,
  },
  moderate: {
    usStocks: 40,
    internationalStocks: 20,
    bonds: 35,
    cash: 5,
  },
  aggressive: {
    usStocks: 55,
    internationalStocks: 30,
    bonds: 12,
    cash: 3,
  },
};

// ============================================================================
// Withdrawal Strategy Types
// ============================================================================

/**
 * Types of withdrawal strategies available.
 */
export type WithdrawalStrategyType = 
  | "constant_dollar"
  | "constant_percentage"
  | "guardrails"
  | "bucket";

/**
 * Detailed information about a withdrawal strategy.
 */
export interface WithdrawalStrategy {
  /** Strategy identifier */
  type: WithdrawalStrategyType;
  /** Human-readable name */
  name: string;
  /** Brief description of how it works */
  description: string;
  /** Advantages of this strategy */
  pros: string[];
  /** Disadvantages of this strategy */
  cons: string[];
  /** Example scenario to help users understand */
  example: string;
}

/**
 * Result of a single year's withdrawal in a simulation.
 */
export interface YearlyWithdrawal {
  /** Year number (1, 2, 3, etc.) */
  year: number;
  /** Portfolio value at start of year */
  startingBalance: number;
  /** Amount withdrawn this year */
  withdrawal: number;
  /** Portfolio value at end of year (after withdrawal and growth) */
  endingBalance: number;
  /** Effective withdrawal rate for this year */
  withdrawalRate: number;
}

/**
 * Result of simulating a withdrawal strategy over time.
 */
export interface StrategySimulationResult {
  /** Strategy that was simulated */
  strategyType: WithdrawalStrategyType;
  /** Starting portfolio value */
  initialPortfolio: number;
  /** Number of years simulated */
  years: number;
  /** Annual return rate used */
  annualReturn: number;
  /** Year-by-year withdrawal details */
  yearlyResults: YearlyWithdrawal[];
  /** Total amount withdrawn over the period */
  totalWithdrawn: number;
  /** Final portfolio balance */
  finalBalance: number;
  /** Average annual withdrawal */
  averageWithdrawal: number;
  /** Minimum annual withdrawal */
  minWithdrawal: number;
  /** Maximum annual withdrawal */
  maxWithdrawal: number;
  /** Whether portfolio was depleted before end of simulation */
  ranOutOfMoney: boolean;
  /** Year when money ran out (if applicable) */
  depletionYear?: number;
}

/**
 * Guardrails strategy configuration.
 */
export interface GuardrailsConfig {
  /** Initial withdrawal rate (e.g., 0.05 for 5%) */
  initialRate: number;
  /** Floor guardrail - cut spending if rate exceeds this (e.g., 0.06 for 6%) */
  floorGuardrail: number;
  /** Ceiling guardrail - increase spending if rate drops below this (e.g., 0.04 for 4%) */
  ceilingGuardrail: number;
  /** Percentage to adjust spending when guardrail is hit (e.g., 0.10 for 10%) */
  adjustmentPercent: number;
}

/**
 * Default guardrails configuration based on Guyton-Klinger research.
 */
export const DEFAULT_GUARDRAILS_CONFIG: GuardrailsConfig = {
  initialRate: 0.05,
  floorGuardrail: 0.06,
  ceilingGuardrail: 0.04,
  adjustmentPercent: 0.10,
};

/**
 * All available withdrawal strategies with their details.
 */
export const WITHDRAWAL_STRATEGIES: WithdrawalStrategy[] = [
  {
    type: "constant_dollar",
    name: "Constant Dollar (4% Rule)",
    description: 
      "Withdraw a fixed dollar amount each year, adjusted for inflation. " +
      "This is the traditional approach based on the 4% rule.",
    pros: [
      "Predictable, stable income each year",
      "Simple to understand and plan around",
      "Well-researched with historical success rates",
    ],
    cons: [
      "Doesn't adapt to market conditions",
      "Risk of running out of money in prolonged downturns",
      "May leave significant wealth if markets perform well",
    ],
    example: 
      "With $1,000,000 saved, you'd withdraw $40,000 in year one, then adjust " +
      "that amount for inflation each year (e.g., $41,200 in year two with 3% inflation).",
  },
  {
    type: "constant_percentage",
    name: "Constant Percentage",
    description:
      "Withdraw a fixed percentage of your portfolio value each year. " +
      "Your income varies with market performance.",
    pros: [
      "Never runs out of money (mathematically impossible)",
      "Automatically adjusts to market conditions",
      "Captures more upside in good years",
    ],
    cons: [
      "Income varies year to year - hard to budget",
      "Bad market years mean spending cuts",
      "Can feel like a pay cut during downturns",
    ],
    example:
      "With 4% constant percentage on a $1,000,000 portfolio, you'd withdraw $40,000. " +
      "If the portfolio drops to $800,000 next year, you'd only withdraw $32,000.",
  },
  {
    type: "guardrails",
    name: "Guardrails (Variable Withdrawal)",
    description:
      "Start with a base withdrawal rate, but adjust up or down based on portfolio " +
      "performance. If your withdrawal rate gets too high, cut spending; if it gets " +
      "too low, give yourself a raise.",
    pros: [
      "Balances income stability with market adaptability",
      "Can start with higher initial withdrawal rate",
      "Responds to market reality while limiting volatility",
    ],
    cons: [
      "More complex to manage and track",
      "Requires flexibility in spending",
      "Need to monitor and adjust periodically",
    ],
    example:
      "Start withdrawing 5% ($50,000 from $1M). If your withdrawal rate exceeds 6% " +
      "(portfolio dropped), cut spending by 10%. If it drops below 4% (portfolio grew), " +
      "increase spending by 10%.",
  },
  {
    type: "bucket",
    name: "Bucket Strategy",
    description:
      "Divide your portfolio into time-based buckets with different risk levels. " +
      "Short-term needs in cash, medium-term in bonds, long-term in stocks.",
    pros: [
      "Psychological comfort - near-term spending is protected",
      "Don't have to sell stocks in down markets",
      "Clear mental model for organizing retirement funds",
    ],
    cons: [
      "More complex to set up and manage",
      "Requires periodic rebalancing between buckets",
      "May underperform a traditional balanced portfolio",
    ],
    example:
      "Keep 2-3 years of expenses in cash (Bucket 1), 7 years in bonds (Bucket 2), " +
      "and the rest in stocks (Bucket 3). Spend from cash, refill from bonds in good years.",
  },
];
