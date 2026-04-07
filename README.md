# 🌱 SproutPal

**Grow better sprouts. Track your yields. Meet your sprout crew.**

SproutPal is an Android app for growing bean sprouts at home. It manages multiple concurrent batches, delivers watering reminders, tracks harvest yields, and features AI-powered character companions that guide you through The Great Sprout-Off!

## Screenshots

| Farm View | Character Reveal | Soak Timer | Daily Briefing |
|-----------|-----------------|------------|----------------|
| Batch cards with circular progress | "Born from the Soak!" | Live countdown with drain button | Full farm dashboard |

## Features

### Core
- **12 sprout types** — broccoli, mung, lentil, radish, alfalfa, chickpea, and more
- **Batch management** — track multiple concurrent batches from soak to harvest
- **Soak timer** — live countdown with notification when soak is done
- **Rinse reminders** — 3x daily notifications (configurable times)
- **Yield tracking** — seed weight in, harvest weight out, yield ratio over time
- **Container inventory** — track which jars/trays perform best per sprout type
- **Photo journal** — capture growth at 4 stages with camera

### Character System
- **10 personality types** — Dramatist, Scientist, Cheerleader, Grump, Zen Master, Rebel, Hypochondriac, Coach, Foodie, Philosopher
- **Weighted rarity** — Common (50%), Uncommon (35%), Rare (12%), Legendary (3%)
- **"Born from the Soak"** — character is a mystery during soaking, revealed dramatically when you drain to jar
- **Personality-themed profiles** — each character gets a uniquely styled homepage
- **Animated avatars** — idle bounce, distress wobble, celebrate spin, reveal dice-roll, periodic blink

### Sprout Genie AI
- **Game show host** — "The Great Sprout-Off!" personality in fun mode
- **Data-aware chat** — knows your batches, yields, containers, and history
- **Smart offline mode** — gives useful sprouting advice without API key
- **Full AI mode** — personalized character-voiced tips via Google AI Studio (Gemini 2.0 Flash)
- **Recipe suggestions** — 30+ recipes with nutritional highlights
- **Coach intensity** — Minimal / Moderate / Full notification levels

### Daily Briefing
- Farm status cards (active, ready, harvested counts)
- Active batch list with mini avatars and progress
- Today's rinse schedule
- Recipe of the day (rotates daily)
- Rinse streak counter
- Character quote of the day

### Performance Analytics
- Yield ratio tracking per sprout type × container combination
- Best combo identification
- Trend analysis over time
- Gemma-powered optimization recommendations

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 54 (managed workflow) |
| Language | TypeScript |
| Navigation | Expo Router (file-based) |
| Database | expo-sqlite + Drizzle ORM |
| Notifications | expo-notifications |
| AI | Google AI Studio (Gemini 2.0 Flash) |
| Animations | react-native-reanimated |
| TTS | expo-speech |
| Audio | expo-audio |
| Camera | expo-camera |

## Getting Started

### Prerequisites
- Node.js 18+
- Android Studio (for local builds) or EAS CLI (for cloud builds)
- Android device or emulator

### Install

```bash
git clone https://github.com/rbarber68/sprowt.git
cd sprowt
npm install
```

### Run on Android (dev)

```bash
# Set up environment
export ANDROID_HOME=~/Android/Sdk
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64

# First time: build native code
npx expo run:android

# Subsequent runs: just start Metro
npx expo start
```

### Build APK (local)

```bash
npx expo run:android --variant release
# APK at: android/app/build/outputs/apk/release/
```

### Build APK (cloud)

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

### Optional: Enable AI

1. Get a free API key from [Google AI Studio](https://aistudio.google.com/apikey)
2. In the app: Settings → Gemma API Key → paste → Save
3. The Sprout Genie will now give personalized AI-powered advice

## Project Structure

```
sprowt/
├── app/                    # Expo Router screens
│   ├── (tabs)/             # Tab screens (Farm, Planner, Library, History)
│   ├── batch/              # Batch wizard + detail
│   ├── character/          # Character profile pages
│   └── onboarding/         # First-run flow
├── components/             # Reusable UI components
├── data/                   # Static data (sprout types, characters, recipes, themes)
├── db/                     # Drizzle ORM schema + migrations
├── lib/                    # Business logic (genie, sounds, speech, notifications)
├── assets/sounds/          # Bundled audio files
└── docs/                   # Design specs and plans
```

## License

MIT

## Credits

Built with Claude Code (Anthropic) + Expo + React Native.
