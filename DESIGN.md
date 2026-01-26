# Retirement Planning Advisor - Design Document

## Overview

A conversational retirement planner built with the Copilot SDK. Learns about your financial situation through natural conversation to answer the core question: "When can I retire?"

---

## MVP Scope

### Core Feature: Retirement Projection
- Conversational Q&A to gather financial info (age, savings, income, etc.)
- Calculate and project when user can retire based on current trajectory
- Explain the math in plain English

### Interface: CLI
- Simple command-line interface
- Focus on SDK features, not web infrastructure
- Conversational flow (bot asks questions one at a time)

### Profile Persistence: Optional
- Ask user if they want to save their profile
- If yes, save to local JSON file for future sessions
- If no, session-only (re-enter next time)

### Tone
- Simple and friendly, but grounded
- Professional demeanor without jargon
- Direct, plain English
- No exclamation points or forced enthusiasm

---

## Features

| Feature | Priority | Status |
|---------|----------|--------|
| **Retirement Projection** | MVP | ✅ In scope |
| **Profile Save/Load** | MVP | ✅ In scope |
| **Gap Analysis** | Future | 📋 Backlog |
| **Scenario Comparison** | Future | 📋 Backlog |
| **Social Security Estimates** | Future | 📋 Backlog |
| **Tax Bracket Analysis** | Future | 📋 Backlog |

---

## Custom Tools

### MVP Tools (3-4)

| Tool | Purpose |
|------|---------|
| `calculateCompoundGrowth(principal, monthlyContribution, annualRate, years)` | Project investment growth over time |
| `projectRetirementDate(currentAge, savings, monthlyContribution, targetAmount, annualRate)` | Calculate when user can retire |
| `adjustForInflation(amount, years, inflationRate)` | Convert future dollars to today's purchasing power |
| `saveUserProfile(profile)` | Persist user's financial profile to JSON (optional) |
| `loadUserProfile()` | Load previously saved profile |

### Future Tools

| Tool | Purpose |
|------|---------|
| `estimateSocialSecurity(birthYear, earnings)` | Estimate SS benefits |
| `calculateRequiredSavingsRate(age, retireAge, goal)` | How much to save monthly |
| `getTaxBracket(income, filingStatus)` | Tax situation analysis |
| `compareScenarios(scenarioA, scenarioB)` | Side-by-side projections |

---

## User Experience

### Conversation Flow (MVP)

```
Advisor: "I can help you figure out when you might be able to retire. 
          To do that, I'll need to learn a bit about your current situation.
          
          Let's start with the basics. How old are you?"

User: "42"

Advisor: "Got it. And what age are you hoping to retire?"

User: "60 if possible"

Advisor: "That gives us an 18-year window to work with.
          
          How much do you currently have saved for retirement? 
          This includes 401k, IRA, and any other retirement accounts."

User: "About $280,000"

Advisor: "Solid foundation. And roughly how much are you contributing 
          each month to retirement savings?"

User: "$1,500"

Advisor: [Calls calculateCompoundGrowth, projectRetirementDate]
         "Based on your current trajectory:
          
          - Current savings: $280,000
          - Monthly contribution: $1,500
          - Assuming 7% average annual return
          - Projected value at age 60: ~$1,630,000
          
          For a 30-year retirement, a common guideline is to have 
          25x your annual expenses saved. If you plan to spend $50,000/year 
          in retirement, you'd want around $1,250,000.
          
          Good news - you're on track. At your current pace, you'd hit 
          that target around age 57.
          
          Would you like to explore what happens if you adjust your 
          monthly contribution?"
```

### Information Gathered

| Data Point | Why It's Needed |
|------------|-----------------|
| Current age | Calculate time horizon |
| Target retirement age | Set the goal |
| Current retirement savings | Starting principal |
| Monthly contribution | Growth rate input |
| (Optional) Expected expenses | Determine target amount |

---

## Technical Architecture

### Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Node.js 18+ |
| **Language** | TypeScript (strict mode) |
| **CLI Input** | readline (Node.js built-in) |
| **AI/SDK** | Copilot SDK |
| **Testing** | Vitest |
| **Data Storage** | JSON files in `~/.retirement-planner/` |

### Project Structure

```
/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── conversation.ts       # Conversation loop logic
│   ├── tools/                # Copilot SDK custom tools
│   │   ├── index.ts          # Tool exports
│   │   ├── compoundGrowth.ts
│   │   ├── retirementProjection.ts
│   │   ├── inflation.ts
│   │   └── profileStorage.ts
│   ├── lib/                  # Pure calculation functions
│   │   ├── calculations.ts   # Financial math
│   │   └── profile.ts        # Profile type helpers
│   └── types/                # TypeScript types
│       └── index.ts
├── tests/                    # Vitest tests
│   ├── calculations.test.ts
│   └── tools.test.ts
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### Copilot SDK Integration

#### How It Works

```
┌──────────────┐     ┌─────────────────┐     ┌─────────────────────┐
│   CLI        │────▶│  Copilot SDK    │────▶│  Custom Tools       │
│   (readline) │◀────│  Session        │◀────│  (calculations,     │
└──────────────┘     └─────────────────┘     │   profile storage)  │
     User              Streaming              └─────────────────────┘
```

#### SDK Client Setup

```typescript
// src/index.ts
import { CopilotClient } from "@github/copilot-sdk";
import { retirementTools } from "./tools";

const client = new CopilotClient();
await client.start();

const session = await client.createSession({
  streaming: true,
  tools: retirementTools,
  systemMessage: {
    content: `You are a retirement planning assistant. Help users understand 
              when they can retire based on their financial situation.
              
              Tone: Friendly but grounded. Use plain English, no jargon.
              No exclamation points. Professional demeanor.
              
              Always use the provided tools for calculations - never estimate
              or guess at financial math.
              
              Start with a brief disclaimer that this isn't professional 
              financial advice.`
  }
});
```

#### Custom Tools Implementation

```typescript
// src/tools/compoundGrowth.ts
import { Tool } from "@github/copilot-sdk";
import { calculateCompoundGrowth } from "../lib/calculations";

export const compoundGrowthTool: Tool = {
  name: "calculateCompoundGrowth",
  description: "Calculate future value of investments with compound growth",
  parameters: {
    type: "object",
    properties: {
      principal: { 
        type: "number", 
        description: "Current savings amount in dollars" 
      },
      monthlyContribution: { 
        type: "number", 
        description: "Monthly contribution in dollars" 
      },
      annualRate: { 
        type: "number", 
        description: "Expected annual return rate (e.g., 0.07 for 7%)" 
      },
      years: { 
        type: "number", 
        description: "Number of years to project" 
      }
    },
    required: ["principal", "monthlyContribution", "annualRate", "years"]
  },
  handler: async ({ principal, monthlyContribution, annualRate, years }) => {
    const result = calculateCompoundGrowth(
      principal, 
      monthlyContribution, 
      annualRate, 
      years
    );
    return {
      futureValue: result.futureValue,
      totalContributions: result.totalContributions,
      totalGrowth: result.totalGrowth
    };
  }
};
```

```typescript
// src/lib/calculations.ts
export function calculateCompoundGrowth(
  principal: number,
  monthlyContribution: number,
  annualRate: number,
  years: number
): { futureValue: number; totalContributions: number; totalGrowth: number } {
  const monthlyRate = annualRate / 12;
  const months = years * 12;
  
  // Future value of principal
  const principalFV = principal * Math.pow(1 + monthlyRate, months);
  
  // Future value of monthly contributions (annuity)
  const contributionsFV = monthlyContribution * 
    ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  
  const futureValue = principalFV + contributionsFV;
  const totalContributions = principal + (monthlyContribution * months);
  const totalGrowth = futureValue - totalContributions;
  
  return {
    futureValue: Math.round(futureValue),
    totalContributions: Math.round(totalContributions),
    totalGrowth: Math.round(totalGrowth)
  };
}
```

#### Profile Storage Tool

```typescript
// src/tools/profileStorage.ts
import { Tool } from "@github/copilot-sdk";
import { homedir } from "os";
import { join } from "path";
import { readFile, writeFile, mkdir } from "fs/promises";

const PROFILE_DIR = join(homedir(), ".retirement-planner");
const PROFILE_PATH = join(PROFILE_DIR, "profile.json");

export const saveProfileTool: Tool = {
  name: "saveUserProfile",
  description: "Save the user's financial profile for future sessions",
  parameters: {
    type: "object",
    properties: {
      profile: {
        type: "object",
        description: "User's financial profile data"
      }
    },
    required: ["profile"]
  },
  handler: async ({ profile }) => {
    await mkdir(PROFILE_DIR, { recursive: true });
    await writeFile(PROFILE_PATH, JSON.stringify(profile, null, 2));
    return { success: true, path: PROFILE_PATH };
  }
};

export const loadProfileTool: Tool = {
  name: "loadUserProfile",
  description: "Load a previously saved user profile",
  parameters: {
    type: "object",
    properties: {}
  },
  handler: async () => {
    try {
      const data = await readFile(PROFILE_PATH, "utf-8");
      return { found: true, profile: JSON.parse(data) };
    } catch {
      return { found: false, profile: null };
    }
  }
};
```

#### CLI Conversation Loop

```typescript
// src/conversation.ts
import * as readline from "readline";
import { Session } from "@github/copilot-sdk";

export async function startConversation(session: Session): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const prompt = (query: string): Promise<string> =>
    new Promise((resolve) => rl.question(query, resolve));

  // Initial message to kick off the conversation
  const initialResponse = await session.send({
    prompt: "A new user has started the retirement planner. Greet them, give the disclaimer, and begin gathering their information."
  });

  // Stream and print the response
  for await (const chunk of initialResponse) {
    process.stdout.write(chunk.content || "");
  }
  console.log("\n");

  // Conversation loop
  while (true) {
    const userInput = await prompt("You: ");
    
    if (userInput.toLowerCase() === "quit" || userInput.toLowerCase() === "exit") {
      console.log("Goodbye.");
      break;
    }

    const response = await session.send({ prompt: userInput });
    
    process.stdout.write("Advisor: ");
    for await (const chunk of response) {
      process.stdout.write(chunk.content || "");
    }
    console.log("\n");
  }

  rl.close();
}
```

### Data Flow

1. **Startup**: CLI loads, Copilot SDK client starts
2. **Session creation**: Session created with retirement tools + system prompt
3. **Check for profile**: SDK calls `loadUserProfile` tool to check for existing data
4. **Conversation**: User and advisor exchange messages
5. **Calculations**: When needed, SDK calls calculation tools (compound growth, projection)
6. **Save profile**: If user agrees, SDK calls `saveUserProfile` tool
7. **Exit**: User types "quit" or "exit"

### Types

```typescript
// src/types/index.ts
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

export interface ProjectionResult {
  targetAge: number;
  projectedSavings: number;
  targetAmount: number;
  gap: number;
  onTrack: boolean;
}
```

---

## Open Questions - Resolved

### 1. Default Financial Assumptions
**Decision**: Prompt user about their risk personality

Rather than silently using defaults, explain the options in plain terms:
- **Conservative**: 5% return assumption (bonds-heavy portfolio)
- **Moderate**: 7% return assumption (balanced stocks/bonds)  
- **Aggressive**: 9% return assumption (stock-heavy portfolio)

Ask the user which feels right for them, with a brief explanation of what each means. This teaches them about risk tolerance and makes projections more personal.

Default inflation: 3% (can mention but not ask about for MVP)

### 2. Financial Disclaimer
**Decision**: Brief disclaimer at conversation start

Example: "Before we start, a quick note: I can help you think through retirement planning, but this isn't professional financial advice. For major decisions, consider consulting a financial advisor."

### 3. Savings Breakdown Detail
**Decision**: Adaptive to user engagement

- Start with simple question: "How much do you have saved for retirement?"
- If user provides detailed breakdown (401k, IRA, etc.), acknowledge and use it
- If user gives just a total, that's fine too
- Don't force complexity on users who want basics

### 4. Marital Status
**Decision**: Ask and adjust advice

- Ask if single or married early in conversation
- If married, adjust language ("you" vs "you and your spouse")
- Can note that spouse's savings/income matter but keep MVP simple
- Future enhancement: gather spouse details for joint projection

### 5. Retirement Target Amount
**Decision**: User-driven with guidance available

- Ask: "What do you think you'd spend in a typical month during retirement?"
- If user is unsure, offer to help estimate:
  - Current monthly expenses as baseline
  - Factors that might change (no commute, more travel, healthcare costs)
  - Common ranges for reference
- Calculate target using 25x annual expenses (4% withdrawal rule)
- Explain the math in plain terms

---

## Implementation Checklist

### Phase 1: Project Setup
- [x] Initialize TypeScript project with strict mode
- [x] Set up Vitest for testing
- [x] Create folder structure (`src/`, `src/tools/`, `src/lib/`, `src/types/`, `tests/`)
- [x] Add npm scripts (build, test, start)

### Phase 2: Core Types & Calculations
- [x] Define `UserProfile` and `ProjectionResult` types
- [x] Implement `calculateCompoundGrowth()` function
- [x] Implement `adjustForInflation()` function
- [x] Write unit tests for calculation functions

### Phase 3: Profile Storage
- [x] Implement `saveProfile()` function (write to `~/.retirement-planner/`)
- [x] Implement `loadProfile()` function
- [x] Write tests for profile storage
- [x] Handle edge cases (missing directory, invalid JSON)

### Phase 4: SDK Tools
- [x] Create `compoundGrowthTool` wrapper
- [x] Create `inflationTool` wrapper
- [x] Create `saveProfileTool` wrapper
- [x] Create `loadProfileTool` wrapper
- [x] Create tool index that exports all tools

### Phase 5: CLI & Conversation
- [x] Set up Copilot SDK client
- [x] Create session with system prompt and tools
- [x] Implement readline-based conversation loop
- [x] Handle streaming responses
- [x] Add quit/exit handling

### Phase 6: Polish & Testing
- [x] End-to-end manual testing
- [x] Refine system prompt based on testing
- [x] Add README with usage instructions
- [x] Final cleanup and documentation
