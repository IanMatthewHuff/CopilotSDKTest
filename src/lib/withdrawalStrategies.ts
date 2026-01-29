import type { 
  WithdrawalStrategyType, 
  WithdrawalStrategy, 
  StrategySimulationResult, 
  YearlyWithdrawal,
  GuardrailsConfig 
} from "../types/index.js";
import { WITHDRAWAL_STRATEGIES, DEFAULT_GUARDRAILS_CONFIG } from "../types/index.js";

/**
 * Get detailed information about a specific withdrawal strategy.
 *
 * @param strategyType - The type of strategy to get info for
 * @returns The strategy details, or undefined if not found
 */
export function getStrategyInfo(strategyType: WithdrawalStrategyType): WithdrawalStrategy | undefined {
  return WITHDRAWAL_STRATEGIES.find(s => s.type === strategyType);
}

/**
 * Get all available withdrawal strategies.
 *
 * @returns Array of all strategy details
 */
export function getAllStrategies(): WithdrawalStrategy[] {
  return WITHDRAWAL_STRATEGIES;
}

/**
 * Simulate constant percentage withdrawal strategy.
 * Withdraws a fixed percentage of the portfolio each year.
 *
 * @param initialPortfolio - Starting portfolio value
 * @param withdrawalRate - Annual withdrawal rate as decimal (e.g., 0.04 for 4%)
 * @param years - Number of years to simulate
 * @param annualReturn - Expected annual return rate as decimal (e.g., 0.07 for 7%)
 * @returns Simulation results
 */
export function simulateConstantPercentage(
  initialPortfolio: number,
  withdrawalRate: number,
  years: number,
  annualReturn: number
): StrategySimulationResult {
  const yearlyResults: YearlyWithdrawal[] = [];
  let balance = initialPortfolio;
  let totalWithdrawn = 0;
  let minWithdrawal = Infinity;
  let maxWithdrawal = 0;

  for (let year = 1; year <= years; year++) {
    const startingBalance = balance;
    const withdrawal = Math.round(balance * withdrawalRate);
    
    // Withdraw at start of year, then apply growth
    balance = balance - withdrawal;
    balance = balance * (1 + annualReturn);
    balance = Math.round(balance);

    totalWithdrawn += withdrawal;
    minWithdrawal = Math.min(minWithdrawal, withdrawal);
    maxWithdrawal = Math.max(maxWithdrawal, withdrawal);

    yearlyResults.push({
      year,
      startingBalance,
      withdrawal,
      endingBalance: balance,
      withdrawalRate,
    });
  }

  return {
    strategyType: "constant_percentage",
    initialPortfolio,
    years,
    annualReturn,
    yearlyResults,
    totalWithdrawn,
    finalBalance: balance,
    averageWithdrawal: Math.round(totalWithdrawn / years),
    minWithdrawal,
    maxWithdrawal,
    ranOutOfMoney: false, // Constant percentage can never run out
  };
}

/**
 * Simulate constant dollar withdrawal strategy.
 * Withdraws a fixed dollar amount each year, adjusted for inflation.
 *
 * @param initialPortfolio - Starting portfolio value
 * @param initialWithdrawal - First year withdrawal amount
 * @param years - Number of years to simulate
 * @param annualReturn - Expected annual return rate as decimal
 * @param inflationRate - Annual inflation rate as decimal (default 0.03)
 * @returns Simulation results
 */
export function simulateConstantDollar(
  initialPortfolio: number,
  initialWithdrawal: number,
  years: number,
  annualReturn: number,
  inflationRate: number = 0.03
): StrategySimulationResult {
  const yearlyResults: YearlyWithdrawal[] = [];
  let balance = initialPortfolio;
  let withdrawal = initialWithdrawal;
  let totalWithdrawn = 0;
  let minWithdrawal = Infinity;
  let maxWithdrawal = 0;
  let ranOutOfMoney = false;
  let depletionYear: number | undefined;

  for (let year = 1; year <= years; year++) {
    const startingBalance = balance;
    
    // Check if we can afford the withdrawal
    if (balance < withdrawal) {
      withdrawal = balance;
      ranOutOfMoney = true;
      if (!depletionYear) depletionYear = year;
    }

    const effectiveRate = startingBalance > 0 ? withdrawal / startingBalance : 0;
    
    // Withdraw at start of year, then apply growth
    balance = balance - withdrawal;
    balance = Math.max(0, balance * (1 + annualReturn));
    balance = Math.round(balance);

    totalWithdrawn += withdrawal;
    minWithdrawal = Math.min(minWithdrawal, withdrawal);
    maxWithdrawal = Math.max(maxWithdrawal, withdrawal);

    yearlyResults.push({
      year,
      startingBalance,
      withdrawal,
      endingBalance: balance,
      withdrawalRate: effectiveRate,
    });

    // Adjust withdrawal for inflation for next year
    withdrawal = Math.round(withdrawal * (1 + inflationRate));
    
    // If depleted, set future withdrawals to 0
    if (balance === 0) {
      withdrawal = 0;
    }
  }

  const result: StrategySimulationResult = {
    strategyType: "constant_dollar",
    initialPortfolio,
    years,
    annualReturn,
    yearlyResults,
    totalWithdrawn,
    finalBalance: balance,
    averageWithdrawal: Math.round(totalWithdrawn / years),
    minWithdrawal,
    maxWithdrawal,
    ranOutOfMoney,
  };
  
  if (depletionYear !== undefined) {
    result.depletionYear = depletionYear;
  }
  
  return result;
}

/**
 * Simulate guardrails withdrawal strategy.
 * Starts with a base rate and adjusts based on portfolio performance.
 *
 * @param initialPortfolio - Starting portfolio value
 * @param years - Number of years to simulate
 * @param annualReturn - Expected annual return rate as decimal
 * @param config - Guardrails configuration (uses defaults if not provided)
 * @returns Simulation results
 */
export function simulateGuardrails(
  initialPortfolio: number,
  years: number,
  annualReturn: number,
  config: GuardrailsConfig = DEFAULT_GUARDRAILS_CONFIG
): StrategySimulationResult {
  const yearlyResults: YearlyWithdrawal[] = [];
  let balance = initialPortfolio;
  let totalWithdrawn = 0;
  let minWithdrawal = Infinity;
  let maxWithdrawal = 0;
  let ranOutOfMoney = false;
  let depletionYear: number | undefined;

  // Start with initial withdrawal based on initial rate
  let currentWithdrawal = Math.round(initialPortfolio * config.initialRate);

  for (let year = 1; year <= years; year++) {
    const startingBalance = balance;
    
    // Check if we can afford the withdrawal
    if (balance < currentWithdrawal) {
      currentWithdrawal = balance;
      ranOutOfMoney = true;
      if (!depletionYear) depletionYear = year;
    }

    // Calculate current withdrawal rate
    const currentRate = startingBalance > 0 ? currentWithdrawal / startingBalance : 0;

    // Apply guardrails for next year
    if (currentRate > config.floorGuardrail) {
      // Rate too high - cut spending
      currentWithdrawal = Math.round(currentWithdrawal * (1 - config.adjustmentPercent));
    } else if (currentRate < config.ceilingGuardrail) {
      // Rate too low - increase spending
      currentWithdrawal = Math.round(currentWithdrawal * (1 + config.adjustmentPercent));
    }

    const withdrawal = startingBalance > 0 ? Math.min(currentWithdrawal, startingBalance) : 0;

    // Withdraw at start of year, then apply growth
    balance = balance - withdrawal;
    balance = Math.max(0, balance * (1 + annualReturn));
    balance = Math.round(balance);

    totalWithdrawn += withdrawal;
    minWithdrawal = Math.min(minWithdrawal, withdrawal);
    maxWithdrawal = Math.max(maxWithdrawal, withdrawal);

    yearlyResults.push({
      year,
      startingBalance,
      withdrawal,
      endingBalance: balance,
      withdrawalRate: currentRate,
    });

    // If depleted, stop
    if (balance === 0) {
      currentWithdrawal = 0;
    }
  }

  const result: StrategySimulationResult = {
    strategyType: "guardrails",
    initialPortfolio,
    years,
    annualReturn,
    yearlyResults,
    totalWithdrawn,
    finalBalance: balance,
    averageWithdrawal: Math.round(totalWithdrawn / years),
    minWithdrawal,
    maxWithdrawal,
    ranOutOfMoney,
  };
  
  if (depletionYear !== undefined) {
    result.depletionYear = depletionYear;
  }
  
  return result;
}

/**
 * Compare multiple withdrawal strategies side by side.
 *
 * @param initialPortfolio - Starting portfolio value
 * @param years - Number of years to simulate
 * @param annualReturn - Expected annual return rate as decimal
 * @param monthlyExpenses - Expected monthly expenses (for constant dollar baseline)
 * @returns Array of simulation results for each strategy
 */
export function compareStrategies(
  initialPortfolio: number,
  years: number,
  annualReturn: number,
  monthlyExpenses: number
): StrategySimulationResult[] {
  const initialWithdrawal = monthlyExpenses * 12; // Annual expenses
  
  return [
    simulateConstantDollar(initialPortfolio, initialWithdrawal, years, annualReturn),
    simulateConstantPercentage(initialPortfolio, 0.04, years, annualReturn),
    simulateGuardrails(initialPortfolio, years, annualReturn),
  ];
}

/**
 * Format a simulation result as a human-readable summary.
 *
 * @param result - The simulation result to format
 * @returns Formatted summary string
 */
export function formatSimulationSummary(result: StrategySimulationResult): string {
  const strategy = getStrategyInfo(result.strategyType);
  const strategyName = strategy?.name ?? result.strategyType;
  
  let summary = `${strategyName}:\n`;
  summary += `  Initial portfolio: $${result.initialPortfolio.toLocaleString()}\n`;
  summary += `  Final balance: $${result.finalBalance.toLocaleString()}\n`;
  summary += `  Total withdrawn: $${result.totalWithdrawn.toLocaleString()}\n`;
  summary += `  Average annual withdrawal: $${result.averageWithdrawal.toLocaleString()}\n`;
  summary += `  Withdrawal range: $${result.minWithdrawal.toLocaleString()} - $${result.maxWithdrawal.toLocaleString()}\n`;
  
  if (result.ranOutOfMoney) {
    summary += `  ⚠️ Money ran out in year ${result.depletionYear}\n`;
  } else {
    summary += `  ✓ Portfolio lasted all ${result.years} years\n`;
  }
  
  return summary;
}
