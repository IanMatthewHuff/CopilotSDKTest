import type { CompoundGrowthResult, IncomeFlow, IncomeFlowSummary } from "../types/index.js";

/**
 * Calculate the future value of investments with compound growth.
 *
 * @param principal - Current savings amount in dollars
 * @param monthlyContribution - Monthly contribution in dollars
 * @param annualRate - Expected annual return rate (e.g., 0.07 for 7%)
 * @param years - Number of years to project
 * @returns Object containing future value, total contributions, and total growth
 */
export function calculateCompoundGrowth(
  principal: number,
  monthlyContribution: number,
  annualRate: number,
  years: number
): CompoundGrowthResult {
  if (years <= 0) {
    return {
      futureValue: Math.round(principal),
      totalContributions: Math.round(principal),
      totalGrowth: 0,
    };
  }

  const monthlyRate = annualRate / 12;
  const months = years * 12;

  // Future value of principal (compound interest)
  const principalFV = principal * Math.pow(1 + monthlyRate, months);

  // Future value of monthly contributions (future value of annuity)
  let contributionsFV = 0;
  if (monthlyRate > 0) {
    contributionsFV =
      monthlyContribution *
      ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  } else {
    // If rate is 0, just sum the contributions
    contributionsFV = monthlyContribution * months;
  }

  const futureValue = principalFV + contributionsFV;
  const totalContributions = principal + monthlyContribution * months;
  const totalGrowth = futureValue - totalContributions;

  return {
    futureValue: Math.round(futureValue),
    totalContributions: Math.round(totalContributions),
    totalGrowth: Math.round(totalGrowth),
  };
}

/**
 * Adjust an amount for inflation over a number of years.
 * Returns the equivalent purchasing power in today's dollars.
 *
 * @param futureAmount - The future dollar amount
 * @param years - Number of years in the future
 * @param inflationRate - Annual inflation rate (e.g., 0.03 for 3%)
 * @returns The equivalent value in today's purchasing power
 */
export function adjustForInflation(
  futureAmount: number,
  years: number,
  inflationRate: number = 0.03
): number {
  if (years <= 0) {
    return Math.round(futureAmount);
  }

  const adjustedValue = futureAmount / Math.pow(1 + inflationRate, years);
  return Math.round(adjustedValue);
}

/**
 * Calculate the target retirement savings needed based on expected expenses.
 * Uses the 4% safe withdrawal rule (25x annual expenses).
 *
 * @param monthlyExpenses - Expected monthly expenses in retirement
 * @returns Target savings amount needed
 */
export function calculateRetirementTarget(monthlyExpenses: number): number {
  const annualExpenses = monthlyExpenses * 12;
  // 25x annual expenses = 4% safe withdrawal rate
  return Math.round(annualExpenses * 25);
}

/**
 * Project when a user can retire based on their financial situation.
 *
 * @param currentAge - User's current age
 * @param currentSavings - Current retirement savings
 * @param monthlyContribution - Monthly contribution to retirement
 * @param targetAmount - Target retirement savings amount
 * @param annualRate - Expected annual return rate
 * @param maxAge - Maximum age to project to (default 80)
 * @returns The projected retirement age, or null if target not reachable by maxAge
 */
export function projectRetirementAge(
  currentAge: number,
  currentSavings: number,
  monthlyContribution: number,
  targetAmount: number,
  annualRate: number,
  maxAge: number = 80
): number | null {
  // Check year by year until we hit the target or max age
  for (let age = currentAge; age <= maxAge; age++) {
    const years = age - currentAge;
    const projection = calculateCompoundGrowth(
      currentSavings,
      monthlyContribution,
      annualRate,
      years
    );

    if (projection.futureValue >= targetAmount) {
      return age;
    }
  }

  return null;
}

/**
 * Generate a unique ID for an income flow.
 */
export function generateIncomeFlowId(): string {
  return `inc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Calculate the total monthly income from all flows at a given age.
 *
 * @param incomeFlows - Array of income flows
 * @param age - Age to calculate income for
 * @returns Total monthly income at that age
 */
export function calculateMonthlyIncomeAtAge(
  incomeFlows: IncomeFlow[],
  age: number
): number {
  return incomeFlows.reduce((total, flow) => {
    const isActive = age >= flow.startAge && (flow.endAge === undefined || age < flow.endAge);
    return total + (isActive ? flow.monthlyAmount : 0);
  }, 0);
}

/**
 * Calculate the lifetime value of an income flow.
 *
 * @param flow - The income flow
 * @param retirementAge - Age at retirement
 * @param lifeExpectancy - Expected age at death (default 95)
 * @param inflationRate - Annual inflation rate for non-adjusted flows
 * @returns Total lifetime value in today's dollars
 */
export function calculateIncomeFlowLifetimeValue(
  flow: IncomeFlow,
  retirementAge: number,
  lifeExpectancy: number = 95,
  inflationRate: number = 0.03
): number {
  const effectiveStartAge = Math.max(flow.startAge, retirementAge);
  const effectiveEndAge = flow.endAge ?? lifeExpectancy;
  
  if (effectiveStartAge >= effectiveEndAge) {
    return 0;
  }

  const years = effectiveEndAge - effectiveStartAge;
  const annualAmount = flow.monthlyAmount * 12;
  
  if (flow.inflationAdjusted) {
    // Inflation-adjusted income maintains purchasing power
    // Simple calculation: annual amount * years
    return Math.round(annualAmount * years);
  } else {
    // Non-inflation-adjusted income loses purchasing power over time
    // Calculate present value of declining real income
    let totalValue = 0;
    for (let year = 0; year < years; year++) {
      const realValue = annualAmount / Math.pow(1 + inflationRate, year);
      totalValue += realValue;
    }
    return Math.round(totalValue);
  }
}

/**
 * Calculate summary of all income flows for retirement planning.
 *
 * @param incomeFlows - Array of income flows
 * @param retirementAge - Age at retirement
 * @param lifeExpectancy - Expected age at death (default 95)
 * @param inflationRate - Annual inflation rate (default 0.03)
 * @returns Summary of income flows including savings reduction
 */
export function calculateIncomeFlowSummary(
  incomeFlows: IncomeFlow[],
  retirementAge: number,
  lifeExpectancy: number = 95,
  inflationRate: number = 0.03
): IncomeFlowSummary {
  const breakdown = incomeFlows.map((flow) => ({
    name: flow.name,
    monthlyAmount: flow.monthlyAmount,
    lifetimeValue: calculateIncomeFlowLifetimeValue(
      flow,
      retirementAge,
      lifeExpectancy,
      inflationRate
    ),
  }));

  const totalMonthlyIncome = calculateMonthlyIncomeAtAge(incomeFlows, retirementAge);
  const totalLifetimeValue = breakdown.reduce((sum, item) => sum + item.lifetimeValue, 0);
  
  // Savings reduction: how much less you need saved because of income flows
  // Using 4% rule: each dollar of annual income reduces needed savings by $25
  const annualIncome = totalMonthlyIncome * 12;
  const savingsReduction = Math.round(annualIncome * 25);

  return {
    totalMonthlyIncome,
    totalLifetimeValue,
    savingsReduction,
    breakdown,
  };
}
