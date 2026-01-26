# Retirement Planning Advisor

A conversational retirement planner built with the [GitHub Copilot SDK](https://github.com/github/copilot-sdk). This CLI tool helps you understand when you can retire based on your financial situation through natural conversation.

## Features

- **Conversational Interface** - Answer questions naturally, one at a time
- **Retirement Projections** - Calculate when you can retire based on savings, contributions, and expected returns
- **Risk Tolerance Profiling** - Choose conservative (5%), moderate (7%), or aggressive (9%) return assumptions
- **Inflation Adjustment** - See what your future savings will be worth in today's dollars
- **Profile Persistence** - Optionally save your information for future sessions
- **Streaming Responses** - See the advisor's response as it's generated

## Prerequisites

- Node.js 18.0 or later
- [GitHub Copilot CLI](https://docs.github.com/en/copilot/github-copilot-in-the-cli) installed and authenticated

## Installation

```bash
# Clone the repository
git clone https://github.com/IanMatthewHuff/CopilotSDKTest.git
cd CopilotSDKTest

# Install dependencies
npm install
```

## Usage

```bash
npm start
```

The advisor will greet you and begin asking questions about your financial situation. Type your responses naturally. When you're done, type `quit`, `exit`, or `bye` to end the conversation.

### Example Conversation

```
═══════════════════════════════════════════════════════════
           Retirement Planning Advisor
═══════════════════════════════════════════════════════════
Type 'quit' or 'exit' to end the conversation.

Advisor: Hello. Before we begin, a few notes: This is not professional 
         financial advice - for major decisions, please consult a financial 
         advisor. No telemetry is logged and any profile you save stays on 
         your local machine. However, the information you share is sent to 
         an LLM for processing, so only share what you're comfortable with.
         
         Let's get started. How old are you?

You: 42

Advisor: And what age are you hoping to retire?

You: 60

Advisor: That gives us an 18-year window. How much do you currently have 
         saved for retirement?

You: About $280,000

Advisor: And roughly how much are you contributing each month?

You: $1,500

Advisor: Based on your current trajectory with a moderate 7% return assumption:
         
         - Current savings: $280,000
         - Monthly contribution: $1,500
         - Projected value at age 60: ~$1,630,000
         
         If you plan to spend around $4,000/month in retirement, you'd need 
         about $1,200,000 (using the 4% withdrawal rule). You're on track 
         to reach that around age 57.
         
         Would you like me to save your profile for future sessions?

You: quit

Advisor: Take care, and good luck with your retirement planning.
```

## Privacy

- **No telemetry** - The application does not log or transmit usage data
- **Local storage only** - Saved profiles are stored in `~/.retirement-planner/profile.json`
- **LLM processing** - Your conversation is sent to an LLM (via GitHub Copilot) for processing. Only share information you're comfortable with

## Development

```bash
# Run type checking
npm run typecheck

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build
npm run build
```

## Project Structure

```
src/
├── index.ts              # CLI entry point
├── conversation.ts       # Conversation loop and streaming
├── tools/                # Copilot SDK tool definitions
│   ├── index.ts          # Tool exports
│   ├── calculationTools.ts
│   └── profileTools.ts
├── lib/                  # Core logic
│   ├── calculations.ts   # Financial math functions
│   └── profile.ts        # Profile storage
└── types/                # TypeScript types
    └── index.ts
```

## How It Works

This application uses the GitHub Copilot SDK to create a conversational AI assistant with custom tools:

1. **Custom Tools** - Financial calculations (compound growth, inflation adjustment, retirement projections) are implemented as SDK tools that the LLM calls when needed
2. **Streaming** - Responses stream to the terminal as they're generated
3. **Session Management** - The SDK manages conversation context and tool orchestration
4. **Profile Storage** - User profiles are saved locally and can be loaded in future sessions

## License

ISC
