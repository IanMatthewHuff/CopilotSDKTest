import * as readline from "readline";
import type { CopilotSession } from "@github/copilot-sdk";

/**
 * Create a readline interface for CLI input/output.
 */
export function createReadlineInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

/**
 * Prompt the user for input.
 */
export function prompt(
  rl: readline.Interface,
  query: string
): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

/**
 * Run the main conversation loop.
 *
 * @param session - The Copilot SDK session
 * @param rl - The readline interface
 */
export async function runConversationLoop(
  session: CopilotSession,
  rl: readline.Interface
): Promise<void> {
  // Send initial greeting
  console.log("\n");
  await sendAndStreamResponse(
    session,
    "A new user has started the retirement planner. " +
      "First, check if they have a saved profile using loadUserProfile. " +
      "Then greet them appropriately (welcome back if returning, fresh greeting if new). " +
      "Give a brief disclaimer that this isn't professional financial advice. " +
      "Then begin gathering their information conversationally."
  );

  // Main conversation loop
  while (true) {
    const userInput = await prompt(rl, "\nYou: ");

    // Check for exit commands
    const trimmedInput = userInput.trim().toLowerCase();
    if (
      trimmedInput === "quit" ||
      trimmedInput === "exit" ||
      trimmedInput === "bye"
    ) {
      console.log("\nAdvisor: Take care, and good luck with your retirement planning.\n");
      break;
    }

    // Skip empty input
    if (trimmedInput === "") {
      continue;
    }

    // Send to advisor and stream response
    console.log("\nAdvisor: ");
    await sendAndStreamResponse(session, userInput);
  }
}

/**
 * Send a message to the session and stream the response to stdout.
 */
async function sendAndStreamResponse(
  session: CopilotSession,
  message: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    let resolved = false;

    const unsubscribe = session.on((event) => {
      switch (event.type) {
        case "assistant.message_delta":
          // Stream incremental text
          process.stdout.write(event.data.deltaContent);
          break;

        case "assistant.message":
          // Final message received - add newline
          if (!resolved) {
            console.log("");
          }
          break;

        case "session.idle":
          // Processing complete
          if (!resolved) {
            resolved = true;
            unsubscribe();
            resolve();
          }
          break;

        case "session.error":
          // Handle errors
          if (!resolved) {
            resolved = true;
            unsubscribe();
            console.error(`\nError: ${event.data.message}`);
            reject(new Error(event.data.message));
          }
          break;

        case "tool.execution_start":
          // Optionally show tool usage (commented out for cleaner output)
          // console.log(`\n[Using tool: ${event.data.toolName}]`);
          break;

        case "tool.execution_complete":
          // Tool finished
          break;
      }
    });

    // Send the message
    session.send({ prompt: message });
  });
}
