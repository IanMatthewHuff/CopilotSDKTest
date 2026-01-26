import { CopilotClient } from "@github/copilot-sdk";
import { retirementTools } from "./tools/index.js";
import {
  createReadlineInterface,
  runConversationLoop,
} from "./conversation.js";

/**
 * System prompt for the retirement planning advisor.
 */
const SYSTEM_PROMPT = `You are a retirement planning assistant. Help users understand when they can retire based on their financial situation.

## Tone and Style
- Friendly but grounded - no exclamation points or forced enthusiasm
- Use plain English, avoid financial jargon
- Professional demeanor, direct and clear
- Explain calculations in simple terms

## Initial Disclaimer
At the start of each conversation, include these points:
1. This is not professional financial advice - for major decisions, consult a financial advisor
2. No telemetry is logged and any saved profile information stays on your local machine
3. However, the information you share is sent to an LLM for processing, so only share what you're comfortable with

## Behavior
- Always use the provided tools for calculations - never estimate or guess at financial math
- Start by checking if the user has a saved profile
- Ask questions one at a time, conversationally
- When discussing returns, explain risk tolerance options:
  - Conservative (5%): Bonds-heavy, lower risk
  - Moderate (7%): Balanced stocks/bonds
  - Aggressive (9%): Stock-heavy, higher risk
- Use the 4% withdrawal rule (25x annual expenses) for retirement targets
- Offer to save the user's profile at the end of the conversation

## Tools Available
- calculateCompoundGrowth: Project investment growth
- adjustForInflation: Convert future dollars to today's value
- calculateRetirementTarget: Calculate savings goal from expenses
- projectRetirementAge: Find when user can retire
- loadUserProfile: Check for existing user data
- saveUserProfile: Save user's information
- checkProfileExists: Quick check for saved profile
- deleteUserProfile: Remove saved data`;

/**
 * Main entry point for the retirement planner CLI.
 */
async function main(): Promise<void> {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("           Retirement Planning Advisor");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("Type 'quit' or 'exit' to end the conversation.\n");

  const client = new CopilotClient();
  const rl = createReadlineInterface();

  try {
    await client.start();

    const session = await client.createSession({
      streaming: true,
      tools: retirementTools,
      systemMessage: {
        mode: "append",
        content: SYSTEM_PROMPT,
      },
    });

    try {
      await runConversationLoop(session, rl);
    } finally {
      await session.destroy();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`\nFailed to start: ${message}`);
    console.error("Make sure the GitHub Copilot CLI is installed and authenticated.");
    process.exit(1);
  } finally {
    rl.close();
    await client.stop();
  }
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
