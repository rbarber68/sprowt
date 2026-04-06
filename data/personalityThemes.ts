/**
 * SproutPal — Personality Themes
 * Each personality type gets unique colors, emojis, and style config
 */

import type { PersonalityKey } from './characters'

export interface PersonalityTheme {
  key: PersonalityKey
  bgPrimary: string
  bgSecondary: string
  bgCard: string
  accent: string
  accentLight: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  borderColor: string
  headerEmojis: string[]
  vibe: string
  homeGreeting: string
  sectionStyle: 'dramatic' | 'minimal' | 'data' | 'warm' | 'zen' | 'edgy' | 'alert' | 'bold' | 'cozy' | 'deep'
}

export const PERSONALITY_THEMES: Record<PersonalityKey, PersonalityTheme> = {
  dramatist: {
    key: 'dramatist',
    bgPrimary: '#2D0A0A',
    bgSecondary: '#4A1515',
    bgCard: '#3D1111',
    accent: '#E63946',
    accentLight: '#FFCDD2',
    textPrimary: '#FFF5F5',
    textSecondary: '#FFAB91',
    textMuted: '#CF6679',
    borderColor: '#E63946',
    headerEmojis: ['\ud83c\udfad', '\ud83c\udf39', '\u2728', '\ud83d\udd25'],
    vibe: 'Every day is an EPIC SAGA',
    homeGreeting: 'Welcome to the STAGE of GREATNESS!',
    sectionStyle: 'dramatic',
  },
  philosopher: {
    key: 'philosopher',
    bgPrimary: '#1A1040',
    bgSecondary: '#2D1B69',
    bgCard: '#251560',
    accent: '#B388FF',
    accentLight: '#E8DAFF',
    textPrimary: '#F3E5F5',
    textSecondary: '#CE93D8',
    textMuted: '#9575CD',
    borderColor: '#7C4DFF',
    headerEmojis: ['\ud83e\uddd8', '\ud83c\udf0c', '\ud83d\udcda', '\u2728'],
    vibe: 'To grow is to question all things',
    homeGreeting: 'Sit. Breathe. Contemplate the sprout.',
    sectionStyle: 'deep',
  },
  cheerleader: {
    key: 'cheerleader',
    bgPrimary: '#4A0E2E',
    bgSecondary: '#6D1445',
    bgCard: '#5C1139',
    accent: '#FF4081',
    accentLight: '#FFD1E1',
    textPrimary: '#FFF0F5',
    textSecondary: '#FF80AB',
    textMuted: '#F48FB1',
    borderColor: '#FF4081',
    headerEmojis: ['\ud83c\udf89', '\ud83c\udf1f', '\ud83d\udcaa', '\ud83d\udd25'],
    vibe: 'EVERYTHING IS AMAZING!!!',
    homeGreeting: 'OMG HI!! Welcome to the BEST page EVER!!',
    sectionStyle: 'bold',
  },
  grump: {
    key: 'grump',
    bgPrimary: '#1C1C1C',
    bgSecondary: '#2A2A2A',
    bgCard: '#242424',
    accent: '#78909C',
    accentLight: '#CFD8DC',
    textPrimary: '#E0E0E0',
    textSecondary: '#9E9E9E',
    textMuted: '#757575',
    borderColor: '#616161',
    headerEmojis: ['\ud83d\ude12'],
    vibe: "Fine. Here's my page. Whatever.",
    homeGreeting: "You're here. Great. Don't touch anything.",
    sectionStyle: 'minimal',
  },
  scientist: {
    key: 'scientist',
    bgPrimary: '#0A1929',
    bgSecondary: '#0D2137',
    bgCard: '#0C1E33',
    accent: '#00B0FF',
    accentLight: '#B3E5FC',
    textPrimary: '#E3F2FD',
    textSecondary: '#81D4FA',
    textMuted: '#4FC3F7',
    borderColor: '#0288D1',
    headerEmojis: ['\ud83e\uddea', '\ud83d\udcca', '\ud83d\udd2c', '\ud83e\udde0'],
    vibe: 'Data-driven. Peer-reviewed. Optimal.',
    homeGreeting: 'System initialized. All metrics nominal.',
    sectionStyle: 'data',
  },
  zen: {
    key: 'zen',
    bgPrimary: '#0D2818',
    bgSecondary: '#1A3A2A',
    bgCard: '#153322',
    accent: '#66BB6A',
    accentLight: '#C8E6C9',
    textPrimary: '#E8F5E9',
    textSecondary: '#A5D6A7',
    textMuted: '#81C784',
    borderColor: '#4CAF50',
    headerEmojis: ['\ud83c\udf3f', '\u2618\ufe0f', '\ud83e\uddd8'],
    vibe: 'Be still. The sprout knows the way.',
    homeGreeting: 'Welcome. You arrived exactly when you needed to.',
    sectionStyle: 'zen',
  },
  rebel: {
    key: 'rebel',
    bgPrimary: '#1A1A2E',
    bgSecondary: '#16213E',
    bgCard: '#1A1A30',
    accent: '#FF6B35',
    accentLight: '#FFCCBC',
    textPrimary: '#FAFAFA',
    textSecondary: '#FF8A65',
    textMuted: '#FF7043',
    borderColor: '#FF5722',
    headerEmojis: ['\ud83e\udd18', '\ud83d\udd25', '\u26a1', '\ud83d\udca5'],
    vibe: 'Rules are suggestions I ignore',
    homeGreeting: "Didn't ask for a homepage. Built one anyway.",
    sectionStyle: 'edgy',
  },
  hypochondriac: {
    key: 'hypochondriac',
    bgPrimary: '#2E2400',
    bgSecondary: '#3D3200',
    bgCard: '#352B00',
    accent: '#FFD600',
    accentLight: '#FFF9C4',
    textPrimary: '#FFFDE7',
    textSecondary: '#FFE082',
    textMuted: '#FFCA28',
    borderColor: '#FFC107',
    headerEmojis: ['\u26a0\ufe0f', '\ud83e\ude7a', '\ud83d\udc40', '\ud83c\udf21\ufe0f'],
    vibe: 'Is that... normal? Should I worry?',
    homeGreeting: 'Welcome. I checked for mold 17 times today.',
    sectionStyle: 'alert',
  },
  coach: {
    key: 'coach',
    bgPrimary: '#3E1500',
    bgSecondary: '#5C2000',
    bgCard: '#4D1B00',
    accent: '#FF6D00',
    accentLight: '#FFE0B2',
    textPrimary: '#FFF3E0',
    textSecondary: '#FFAB40',
    textMuted: '#FF9100',
    borderColor: '#FF6D00',
    headerEmojis: ['\ud83c\udfc6', '\ud83d\udcaa', '\ud83d\udd25', '\u26a1'],
    vibe: 'CHAMPIONS ARE GROWN, NOT BORN!',
    homeGreeting: 'Ready to CRUSH IT today?! LET\'S GO!!',
    sectionStyle: 'bold',
  },
  foodie: {
    key: 'foodie',
    bgPrimary: '#2E1503',
    bgSecondary: '#452008',
    bgCard: '#3A1A05',
    accent: '#FF8F00',
    accentLight: '#FFE0B2',
    textPrimary: '#FFF8E1',
    textSecondary: '#FFB74D',
    textMuted: '#FFA726',
    borderColor: '#FF8F00',
    headerEmojis: ['\ud83c\udf73', '\ud83e\udd51', '\ud83c\udf7d\ufe0f', '\ud83e\uddc1'],
    vibe: 'I have been planning my flavor profile since day one',
    homeGreeting: 'Welcome to the kitchen of dreams. Pull up a chair.',
    sectionStyle: 'cozy',
  },
}

export function getTheme(personality: PersonalityKey): PersonalityTheme {
  return PERSONALITY_THEMES[personality]
}
