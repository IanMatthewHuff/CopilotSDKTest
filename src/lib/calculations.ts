import type { CompoundGrowthResult } from "../types/index.js";

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
