# Copilot SDK App Planning Document

## Overview

This document captures our planning process for building an application using the Copilot SDK. Goal: Create a hobby-related app that exercises advanced SDK features (multi-step, streaming, custom tools, sessions) rather than just a single LLM call.

---

## Ideas Considered

### Initial Brainstorm (Hobbies: Books, Guitars/Gear, Retro Gaming)

| Idea | SDK Features | Verdict |
|------|--------------|---------|
| Pedal chain advisor | Custom tools, multi-step, sessions, streaming | ⭐ Top pick |
| ROM collection organizer | File tools, multi-step, streaming | Good but infrastructure-heavy |
| Retro game recommender | Sessions, streaming | Too simple |
| Tone recipe builder | Sessions, streaming | Too simple |
| Reading list curator | Multi-step | ⭐ Exploring further |

---

## Deep Dive: Top Three Candidates

---

### 1. Guitar Pedal Advisor 🎸

**Core Concept**: An intelligent assistant for building and optimizing guitar pedalboards. Goes beyond simple recommendations to understand your gear, goals, and budget.

#### Features

| Feature | Description |
|---------|-------------|
| **Fix My Signal Order** | Input your current pedals, get optimal order with explanations of why (e.g., "compression before dirt for sustain, after for squash") |
| **Make My Board Cheaper** | Find budget-friendly alternatives that achieve similar tones (e.g., "swap the Klon for a Mosky Golden Horse") |
| **Suggest Next Pedal** | Based on current setup + genre goals, recommend the most impactful addition |
| **Build From Scratch** | "I play [genre] with $[budget]" → complete board recommendation |
| **Tone Matching** | "I want to sound like [artist/song]" → suggest pedal combinations |

#### Custom Tools

| Tool | Purpose |
|------|---------|
| `getPedalInfo(name)` | Returns pedal details: type, price, characteristics, similar pedals |
| `searchPedals(type, priceRange, genre)` | Query pedal database with filters |
| `comparePedals(pedalA, pedalB)` | Side-by-side comparison |
| `validateSignalChain(pedals[])` | Check order, flag issues, suggest fixes |
| `findBudgetAlternative(pedal)` | Find cheaper clones/alternatives |
| `getUserBoard()` | Retrieve user's saved pedalboard |
| `saveUserBoard(pedals[])` | Persist user's current setup |

#### SDK Features Exercised

- **Custom Tools**: 6-7 tools for querying, comparing, validating
- **Sessions**: Remember user's board, preferences, budget, genres
- **Multi-step**: Gather gear → analyze → recommend → explain reasoning
- **Streaming**: Stream detailed explanations of signal chain theory and tone advice

#### Data Requirements

- JSON database of ~50-100 popular pedals
- Fields: name, type (overdrive, delay, etc.), price, budget alternatives, genre tags, signal chain position

#### Sample Interaction

```
User: "I have a Tube Screamer, Big Muff, and Boss DD-7. I play shoegaze. What order and what should I add?"

Bot: [Streams response]
"For shoegaze, here's my recommendation...
- Signal chain: Tube Screamer → Big Muff → DD-7
- Why: TS pushes the Muff harder, delay after dirt keeps repeats cleaner
- Missing piece: You need reverb! Consider the EHX Holy Grail ($150) or budget option Mosky Spring ($30)"
```

#### Pros & Cons

| Pros | Cons |
|------|------|
| Concrete, useful tool | Requires building pedal database |
| Natural fit for custom tools | Niche audience (guitarists) |
| Clear multi-step logic | Less "magical" feeling |
| Easily testable | Domain knowledge needed |

---

### 2. Vibe-Based Book Recommender 📚

**Core Concept**: A book recommendation system that goes beyond "you liked A, try B" to understand your *current moment*—mood, weather, energy level, and abstract preferences—building a personal profile over time.

#### The Philosophy

Traditional recommenders ask: "What books have you read?"
This asks: "What color are you feeling today?"

#### Features

| Feature | Description |
|---------|-------------|
| **Weather-Aware** | Check local conditions → snowy evening? cozy mystery. Beach day? light adventure |
| **Mood Mapping** | "What color are you feeling?" / "Pick an animal" → translate to book vibes |
| **Energy Calibration** | "How much brain power today?" → dense literary fiction vs. easy page-turner |
| **Time Context** | Sunday morning vs. late Tuesday night = different recommendations |
| **Memory & Patterns** | "Last time it rained and you felt blue, you loved [book]. Similar vibe?" |
| **Feedback Loop** | "How was it?" → refines understanding of what works for you |

#### Custom Tools

| Tool | Purpose |
|------|---------|
| `getWeather(location)` | Current weather conditions |
| `getTimeContext()` | Time of day, day of week, season |
| `getUserProfile(userId)` | Retrieve stored preferences and history |
| `saveUserProfile(userId, data)` | Persist learned preferences |
| `recordRecommendation(book, context, mood)` | Log what was suggested and why |
| `recordFeedback(book, rating, notes)` | Track how recommendations landed |
| `searchBooks(vibes, energy, themes)` | Query books by abstract qualities |

#### SDK Features Exercised

- **Custom Tools**: 7 tools for context gathering, profile management, book matching
- **Sessions**: Build and maintain user profile across conversations
- **Streaming**: Stream the "vibe reading" and reasoning process
- **Multi-step**: Gather context → check weather → consult memory → match mood → explain why this book fits this moment

#### Quirky Input Ideas

- "What color are you feeling?" → map to tone palette
- "Pick an animal that matches your energy" → playful profiling  
- "Coffee or tea today?" → energy/pace indicator
- "Are you escaping or exploring?" → comfort vs. challenge
- "What's the soundtrack in your head?" → mood via music
- "How many spoons do you have?" → capacity awareness

#### Sample Interaction

```
[First time user]
Bot: "Welcome! Before I recommend anything, let me get a feel for you. 
      What color best describes your mood right now?"
User: "Gray, kind of foggy"
Bot: "And if you were an animal today, which would it be?"
User: "A cat, curled up"
Bot: "Got it. One more: coffee or tea?"
User: "Tea, definitely tea"
Bot: [Streams] "Okay, I'm sensing a contemplative, cozy energy. You want 
      something that wraps around you like a blanket but has some quiet 
      depth to it. Let me check what's happening outside... [calls weather tool]
      
      It's 42°F and overcast. Perfect reading weather.
      
      I'd suggest 'Piranesi' by Susanna Clarke—it's dreamy, mysterious, 
      and has that cat-curled-up-by-the-window quality. Not demanding, 
      but it'll stick with you. How does that feel?"
```

```
[Returning user, 2 weeks later]
Bot: "Hey! It's a rainy Thursday evening. Last time you had cozy-gray 
      energy, you really connected with Piranesi. Feeling similar, or 
      has something shifted?"
```

#### Pros & Cons

| Pros | Cons |
|------|------|
| Unique, delightful experience | More abstract/harder to validate "correctness" |
| Strong SDK feature exercise | Book database could be simpler (LLM knows books) |
| Broad appeal (everyone reads) | Weather API adds external dependency |
| "Magical" feeling | Profile building takes multiple sessions to shine |
| Personality-driven | Quirky inputs might not land for all users |

---

### 3. Retirement Planning Advisor 💰

**Core Concept**: A conversational retirement planner that learns about your financial situation, personality, and goals to build a comprehensive, personalized retirement plan.

#### Why It's Interesting for SDK

Financial calculations are **perfect for tools** - they're deterministic logic the LLM shouldn't guess at. Compound interest, inflation adjustments, and tax calculations need precision.

#### Features

| Feature | Description |
|---------|-------------|
| **Profile Building** | Gather income, expenses, savings, debts, risk tolerance through conversation |
| **Retirement Projection** | "When can I retire?" with current trajectory |
| **Gap Analysis** | "You need $X more/month to retire at 60" |
| **Scenario Comparison** | "What if I saved $200 more?" / "What if I retire at 62 instead?" |
| **Risk Assessment** | Match investment suggestions to personality/risk tolerance |
| **Social Security Optimization** | When to claim for maximum benefit |

#### Custom Tools

| Tool | Purpose |
|------|---------|
| `calculateCompoundGrowth(principal, rate, years)` | Project investment growth |
| `projectRetirementDate(savings, income, expenses, target)` | When can they retire? |
| `estimateSocialSecurity(birthYear, earnings)` | Estimate SS benefits |
| `calculateRequiredSavingsRate(age, retireAge, goal)` | How much to save monthly |
| `getTaxBracket(income, filingStatus)` | Current/projected tax situation |
| `adjustForInflation(amount, years)` | Future value calculations |
| `getUserFinancialProfile()` | Retrieve saved profile |
| `saveUserFinancialProfile(data)` | Persist profile |
| `compareScenarios(scenarioA, scenarioB)` | Side-by-side projection comparison |

#### SDK Features Exercised

- **Custom Tools**: 9 tools - heavy on calculations (strongest tool usage of all candidates)
- **Sessions**: Build and maintain financial profile over conversations
- **Streaming**: Stream explanations of complex projections and scenarios
- **Multi-step**: Gather profile → project trajectory → identify gaps → suggest adjustments → compare scenarios

#### Sample Interaction

```
Bot: "Let's start building your retirement picture. What's your current age?"
User: "42"
Bot: "And when would you ideally like to retire?"
User: "60 if possible"
Bot: "Got it - that's an 18-year runway. Do you have a sense of your current 
     retirement savings across all accounts?"
User: "About $280,000 total"
Bot: "Great start! And roughly how much are you saving per month right now?"
User: "$1,500"
Bot: [Calls calculateCompoundGrowth, projectRetirementDate tools]
     "Based on 7% average growth and your current savings rate, you're 
      projected to have about $1.2M by age 60. 
      
      For a comfortable retirement lasting 30 years, most planners recommend 
      $1.5-2M depending on lifestyle. You're on a solid track but have a 
      gap of roughly $300-800K.
      
      Want me to show you what happens if we bump savings to $2,000/month?"
```

#### Pros & Cons

| Pros | Cons |
|------|------|
| **Strongest tool usage** - calculations must be precise | Sensitive topic - needs disclaimers |
| Broad appeal (everyone retires) | Less fun/visual than pedals |
| Serious/professional demo | Not hobby-related |
| Clear value proposition | More complex state to manage |
| Multi-scenario comparisons showcase sessions | Could feel "corporate" |

---

## Comparison Summary

| Criteria | Pedal Advisor 🎸 | Book Recommender 📚 | Retirement Planner 💰 |
|----------|------------------|---------------------|----------------------|
| **Custom Tools** | ⭐⭐ (5-7 tools, some optional) | ⭐⭐ (7 tools, context-heavy) | ⭐⭐⭐ (9 tools, calculation-heavy) |
| **Tool Necessity** | Medium - LLM knows pedals | Medium - LLM knows books | **High** - must use tools for math |
| **Sessions** | ⭐⭐ (save board) | ⭐⭐⭐ (profile over time) | ⭐⭐⭐ (financial profile) |
| **Streaming** | ⭐⭐ (explanations) | ⭐⭐ (vibe analysis) | ⭐⭐ (projections) |
| **Multi-step** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Visual Appeal** | ⭐⭐⭐ (pedal images) | ⭐⭐ (book covers) | ⭐ (charts?) |
| **Demo Friendliness** | ⭐⭐⭐ (quick, visual) | ⭐⭐ (needs profile buildup) | ⭐⭐ (needs data entry) |
| **Broad Appeal** | ⭐ (guitarists only) | ⭐⭐⭐ (everyone reads) | ⭐⭐⭐ (everyone retires) |
| **Personal/Fun** | ⭐⭐⭐ (hobby!) | ⭐⭐⭐ (whimsical) | ⭐ (serious) |
| **Build Effort** | Medium | Medium | Medium-High |

**Bottom Line**:
- **Best for SDK exercise**: Retirement Planner (tools are essential, not optional)
- **Best for demos**: Pedal Advisor (visual, quick, fun)
- **Best for delight**: Book Recommender (whimsical, unique)

---

## Final Concept

### Decision: Retirement Planning Advisor 💰

**Chosen over**: Guitar Pedal Advisor, Vibe-Based Book Recommender

**Reasoning**:
- **Strongest SDK exercise** - Financial calculations *require* tools; LLM can't guess at compound interest or tax brackets
- **Broad appeal** - Everyone thinks about retirement; more relatable demo
- **Clear multi-step flow** - Profile building → projection → gap analysis → scenario comparison
- **Session-heavy** - Financial profile naturally persists and evolves across conversations

**Trade-offs accepted**:
- Less visual/fun than pedal advisor
- Not hobby-related (but more practical)
- Needs financial disclaimers

**Notes**: 
- Pedal Advisor remains a fun option for hobby-focused demos
- Book Recommender is the most whimsical/delightful if revisiting later

---

## Implementation Plan

<!-- Detailed steps for building the chosen concept -->
