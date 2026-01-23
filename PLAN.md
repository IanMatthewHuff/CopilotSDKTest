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

## Deep Dive: Top Two Candidates

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

## Final Concept

### Decision: Guitar Pedal Advisor 🎸

**Chosen over**: Vibe-Based Book Recommender

**Reasoning**:
- **More immediately useful** - Solves real problems guitarists face daily
- **Less data required** - Pedal database is finite and manageable; book recommender would need extensive reading history to shine
- **Better for demos** - Concrete inputs/outputs are easier to showcase quickly
- **Still exercises SDK well** - Custom tools, sessions, multi-step, streaming all covered

**Note**: The Vibe-Based Book Recommender remains an interesting concept worth revisiting in the future.

---

## Implementation Plan

<!-- Detailed steps for building the chosen concept -->
