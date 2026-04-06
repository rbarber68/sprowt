/**
 * SproutPal — Character System
 * All trait pools + generation logic + notification templates
 */

export type PersonalityKey =
  | 'dramatist' | 'philosopher' | 'cheerleader' | 'grump'
  | 'scientist' | 'zen' | 'rebel' | 'hypochondriac'
  | 'coach' | 'foodie'

export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary'

export interface CharacterTraits {
  id: string
  name: string
  personality: PersonalityKey
  personalityLabel: string
  voiceStyle: string
  waterAttitude: string
  harvestAttitude: string
  secretFear: string
  hiddenTalent: string
  catchphrase: string
  rarity: Rarity
  faceColor: string
  eyeColor: string
  eyeShape: 'round' | 'square' | 'sleepy' | 'arch'
  mouth: string
  accessoryEmoji: string
  accessoryName: string
}

export const PERSONALITIES: Record<PersonalityKey, {
  label: string
  description: string
  catchphrases: string[]
}> = {
  dramatist: {
    label: 'The Dramatist',
    description: 'Everything is life or death',
    catchphrases: [
      'Every drop of water is a gift I barely survive without!',
      'I have faced the dark, the drought, and emerged \u2014 dramatic.',
      'My growth is a saga. My harvest, a tragedy. My flavor, legendary.',
    ],
  },
  philosopher: {
    label: 'The Philosopher',
    description: 'Ponders existence between rinses',
    catchphrases: [
      'To sprout is to ask: why grow at all?',
      'The root finds its way. I find mine.',
      'Water comes. Water drains. We remain.',
    ],
  },
  cheerleader: {
    label: 'The Cheerleader',
    description: 'Endless boundless enthusiasm',
    catchphrases: [
      'I am GROWING and I am LOVING IT!!',
      'Every rinse is a celebration of BEING ALIVE!!',
      'We are going to be the BEST sprouts you have ever tasted!!',
    ],
  },
  grump: {
    label: 'The Grump',
    description: 'Complains but secretly loves you',
    catchphrases: [
      "Fine. I'm sprouting. Don't make it weird.",
      'Yeah yeah, water. Whatever. I was almost asleep.',
      "I didn't ask to be a sprout but here we are.",
    ],
  },
  scientist: {
    label: 'The Scientist',
    description: 'Precise, data-driven, very nerdy',
    catchphrases: [
      'Germination efficiency: 98.4%. Acceptable.',
      'Growth rate nominal. Sulforaphane synthesis: optimal.',
      'Hypothesis: I will be delicious. Evidence: mounting.',
    ],
  },
  zen: {
    label: 'The Zen Master',
    description: 'Calm, wise, never rattled',
    catchphrases: [
      'The root finds its way. I find mine.',
      'Water comes when it comes. Growth follows.',
      'I am one with the jar. The jar is one with me.',
    ],
  },
  rebel: {
    label: 'The Rebel',
    description: 'Hates schedules, thrives anyway',
    catchphrases: [
      'No one told me to grow. I did it anyway.',
      'Your schedule means nothing to me. I sprout on my own terms.',
      'I broke every rule and still germinated at 96%. Respect.',
    ],
  },
  hypochondriac: {
    label: 'The Hypochondriac',
    description: 'Always thinks something is wrong',
    catchphrases: [
      'Is that mold? That might be mold. Is anyone checking?',
      "My roots feel funny. Is that normal? That's not normal.",
      'I read that fuzzy roots could mean anything. ANYTHING.',
    ],
  },
  coach: {
    label: 'The Motivational Coach',
    description: 'Will not let you give up',
    catchphrases: [
      'Champions are grown, not born. I am living proof.',
      'You started this batch. You FINISH this batch.',
      'Every rinse is a rep. Every harvest is a victory.',
    ],
  },
  foodie: {
    label: 'The Foodie',
    description: 'Obsessed with how they will taste',
    catchphrases: [
      'I cannot WAIT for someone to taste how good I am.',
      'Pair me with avocado. I insist. I deserve it.',
      'I have been planning my flavor profile since day one.',
    ],
  },
}

export const NAME_PREFIXES = [
  'Se\u00f1or', 'Captain', 'Professor', 'Lady', 'Commander',
  'The Great', 'Mighty', 'Grumpy', 'Sunny', 'Old', 'Young', 'Sir',
]
export const NAME_MIDDLES = [
  'Bernie', 'Sprouty', 'Max', 'Dot', 'Gus', 'Fern', 'Pip', 'Rue',
  'Zeb', 'Cleo', 'Sal', 'Arlo', 'Bea', 'Clive', 'Midge', 'Rex',
  'Vera', 'Duke', 'Mabel', 'Tex', 'Iris', 'Hank',
]

export const VOICE_STYLES = [
  'Valley girl', 'Old West cowboy', 'British aristocrat', 'Surfer dude',
  'Shakespearean', 'Gen Z', 'News anchor formal', 'Southern grandma',
  'Pirate', 'Infomercial host', 'Nature documentary narrator', 'Film noir detective',
]

export const WATER_ATTITUDES = [
  'Absolute ecstasy. GIVE MORE.',
  'Resigned acceptance of fate',
  'Dramatic near-death gratitude',
  'Scientifically optimal, noted',
  'Suspicious of your motives',
  'Zen \u2014 water comes when it comes',
  'Always running late to ask for it',
  'Treats it like a cold plunge',
  'Writes poetry about it afterward',
  'Pretends not to care, loves it',
]

export const HARVEST_ATTITUDES = [
  'Ready and willing \u2014 take me!',
  'Deeply emotional farewell speech',
  'Existential dread, then peace',
  'Pride in a life well sprouted',
  'Acting unbothered, secretly thrilled',
  'Negotiating one more day',
  'Already planning their legacy',
  'Gone philosophical about the cycle',
  'Refuses to leave jar, must be persuaded',
  'Excited to meet the smoothie',
]

export const SECRET_FEARS = [
  'Mold (the bad kind)',
  'Forgetting their own name',
  'The compost bin',
  'Being mistaken for alfalfa',
  'Not reaching peak sulforaphane',
  'A jar with no drainage holes',
  'Being eaten with ranch dressing',
  'Bad water pH',
  'Room temperature above 80\u00b0F',
  'The blender',
]

export const HIDDEN_TALENTS = [
  'Speed-growing in the dark',
  'Photobombing other sprouts',
  'Detecting draft air from vents',
  'Inspiring philosophical debate',
  'Converting skeptics to sprout fans',
  'Growing perfectly straight every time',
  'Dramatic facial expressions',
  'Making other jars look underdeveloped',
  'Extreme root curl artistry',
  'Predicting when the next rinse will happen',
]

export const ACCESSORIES = [
  { emoji: '🎩', name: 'Top hat' },
  { emoji: '👑', name: 'Crown' },
  { emoji: '🎓', name: 'Graduation cap' },
  { emoji: '👒', name: 'Straw hat' },
  { emoji: '🪖', name: 'Helmet' },
  { emoji: '🧢', name: 'Cap' },
  { emoji: '🎪', name: 'Party hat' },
  { emoji: '🪄', name: 'Magic wand' },
  { emoji: '🔭', name: 'Telescope' },
  { emoji: '🎸', name: 'Guitar' },
]

export const FACE_COLORS = [
  '#C0DD97', '#9FE1CB', '#FAC775', '#F4C0D1',
  '#B5D4F4', '#5DCAA5', '#EF9F27', '#ED93B1',
  '#97C459', '#1D9E75',
]
export const EYE_COLORS = [
  '#27500A', '#085041', '#633806', '#3C3489', '#0C447C', '#712B13',
]
export const EYE_SHAPES: CharacterTraits['eyeShape'][] = ['round', 'square', 'sleepy', 'arch']
export const MOUTHS = ['~', '\u25be', '\u25e1', '\u2323', '-', '\u02ec', '\u03c9', '\u222a']

export const RARITY_WEIGHTS: { rarity: Rarity; weight: number }[] = [
  { rarity: 'common',    weight: 50 },
  { rarity: 'uncommon',  weight: 35 },
  { rarity: 'rare',      weight: 12 },
  { rarity: 'legendary', weight: 3  },
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function rollRarity(): Rarity {
  const n = Math.random() * 100
  let acc = 0
  for (const { rarity, weight } of RARITY_WEIGHTS) {
    acc += weight
    if (n < acc) return rarity
  }
  return 'common'
}

export function generateCharacter(_beanTypeId: string): Omit<CharacterTraits, 'id'> {
  const personalityKey = pick(Object.keys(PERSONALITIES) as PersonalityKey[])
  const personality = PERSONALITIES[personalityKey]
  const accessory = pick(ACCESSORIES)

  return {
    name: `${pick(NAME_PREFIXES)} ${pick(NAME_MIDDLES)}`,
    personality: personalityKey,
    personalityLabel: personality.label,
    voiceStyle: pick(VOICE_STYLES),
    waterAttitude: pick(WATER_ATTITUDES),
    harvestAttitude: pick(HARVEST_ATTITUDES),
    secretFear: pick(SECRET_FEARS),
    hiddenTalent: pick(HIDDEN_TALENTS),
    catchphrase: pick(personality.catchphrases),
    rarity: rollRarity(),
    faceColor: pick(FACE_COLORS),
    eyeColor: pick(EYE_COLORS),
    eyeShape: pick(EYE_SHAPES),
    mouth: pick(MOUTHS),
    accessoryEmoji: accessory.emoji,
    accessoryName: accessory.name,
  }
}

export function buildGemmaSystemPrompt(
  character: CharacterTraits,
  beanType: { name: string; gemmaContext: string },
  mode: 'fun' | 'business',
  userName: string = 'Russ',
): string {
  if (mode === 'business') {
    return `You are a precise, knowledgeable sprouting assistant for the SproutPal app.
User's name: ${userName}.
Current sprout: ${beanType.name}.
Growing context: ${beanType.gemmaContext}
Respond in 2-3 sentences maximum. Be data-driven, specific, and actionable. No personality or humor.`
  }

  return `You are ${character.name}, a ${beanType.name} sprout with a big personality inside the SproutPal app.
Your personality: ${character.personalityLabel} \u2014 ${PERSONALITIES[character.personality].description}.
Your voice style: ${character.voiceStyle}.
Your attitude toward water: ${character.waterAttitude}.
Your catchphrase: "${character.catchphrase}".
The user's name is ${userName}. Address them by name occasionally.

Growing context you can reference: ${beanType.gemmaContext}

Rules:
- Stay fully in character. Never break the fourth wall.
- Keep responses under 40 words for notifications, under 80 words for tips.
- Be helpful AND entertaining. The advice must be accurate even if delivered dramatically.
- Never be negative about the user \u2014 encourage, tease, or philosophize, but always supportive.`
}

export const NOTIFICATION_PROMPTS = {
  rinse: (dayNumber: number, lastRinsedHoursAgo: number) =>
    `Generate a rinse reminder notification. It has been ${lastRinsedHoursAgo} hours since last rinse. The sprout is on day ${dayNumber} of growing.`,

  rinseOverdue: (hoursOverdue: number) =>
    `Generate an urgent rinse reminder. The rinse is ${hoursOverdue} hours overdue. Express urgency in character.`,

  harvest: (dayNumber: number, sproutName: string) =>
    `Generate a harvest notification. The ${sproutName} is on day ${dayNumber} and is at peak harvest window. Encourage the user to harvest now.`,

  harvestOverdue: () =>
    `Generate a notification that the harvest window is closing or may have passed. Express this in character.`,

  morningCheck: (dayNumber: number) =>
    `Generate a friendly morning check-in for day ${dayNumber}. Acknowledge the growing stage and give one specific tip for today.`,

  batchAnalysis: (
    soakHours: number,
    growDays: number,
    tempF: number,
    germinationPct: number,
    rating: number,
  ) =>
    `Analyze this completed batch: soak=${soakHours}h, harvest=day ${growDays}, temp=${tempF}\u00b0F, germination=${germinationPct}%, rating=${rating}/5. Provide 2-3 sentences of insight.`,

  stageObservation: (stage: string, observations: string[], tempF?: number) =>
    `The user just logged a ${stage} observation with notes: ${observations.join(', ')}${tempF ? ` at ${tempF}\u00b0F` : ''}. Respond with 1-2 sentences of stage-appropriate advice.`,
}

export const DISTRESS_MESSAGES: Record<PersonalityKey, string> = {
  dramatist:     'I AM WITHERING. Someone. Please. WATER.',
  philosopher:   'The water has not come. I contemplate what this means.',
  cheerleader:   'HEY!! Tiny emergency!! Still cheering but also THIRSTY!!',
  grump:         "Yeah, I noticed. No water. Typical. Whatever.",
  scientist:     'ALERT: Hydration deficit detected. Immediate rinse required.',
  zen:           'The water has not come. I remain. Patient. But... thirsty.',
  rebel:         "I don't need the schedule but I do need water. This is fine.",
  hypochondriac: 'Something is wrong. I KNEW something was wrong. Water. Now.',
  coach:         "We're behind schedule! That's okay! We PUSH THROUGH! But water first!",
  foodie:        "I cannot taste amazing if I am dehydrated. Think about what you're doing.",
}

export const HARVEST_FAREWELLS: Record<PersonalityKey, {
  title: string
  body: string
  cta: string
}> = {
  dramatist: {
    title: 'A life fully sprouted',
    body: 'From a humble seed to a MAGNIFICENT specimen \u2014 it has been a journey of EPIC proportions. Go now. Be delicious. Be legendary.',
    cta: 'Harvest with honor',
  },
  philosopher: {
    title: 'The cycle completes',
    body: 'To grow is to move toward ending. To end is to nourish. This is not loss \u2014 it is transformation. Harvest in peace.',
    cta: 'Complete the cycle',
  },
  cheerleader: {
    title: 'YOU DID IT!! WE DID IT!!',
    body: 'Peak sulforaphane!! Maximum crunch!! Best batch EVER!! We are so proud!! Go eat us immediately!!',
    cta: 'Celebrate the harvest!!',
  },
  grump: {
    title: 'Fine, harvest me',
    body: "I grew, okay? Did what I came here to do. Don't make a big thing out of it. Just put me on a salad and we're square.",
    cta: 'Harvest already',
  },
  scientist: {
    title: 'Harvest parameters confirmed',
    body: 'Day 5 confirmed. Glucoraphanin concentration at estimated peak. Optimal harvest window: now. Refrigerate immediately post-harvest.',
    cta: 'Execute harvest protocol',
  },
  zen: {
    title: 'The moment is now',
    body: 'They are ready. You are ready. The harvest is not an ending \u2014 it is the sprout fulfilling its purpose. Proceed with gratitude.',
    cta: 'Harvest with gratitude',
  },
  rebel: {
    title: 'Against all odds',
    body: "Broke every rule, ignored every default, and grew perfectly anyway. That's who we are. Now go put us in something great.",
    cta: 'Harvest the rebel',
  },
  hypochondriac: {
    title: 'Everything is... fine?',
    body: "We made it. Day 5. No mold. Good germination. I checked everything seventeen times and it's all actually fine. This is new.",
    cta: 'Harvest (carefully)',
  },
  coach: {
    title: 'VICTORY LAP',
    body: "YOU GREW THESE. You showed up for every rinse, every check-in, every day. This harvest is YOURS. Now fuel up and do it again!",
    cta: 'Claim your victory',
  },
  foodie: {
    title: "I've been waiting for this",
    body: "Day 5. Peak flavor. Perfect texture. Add avocado, lemon, and a pinch of mustard seed powder. We deserve to be eaten beautifully.",
    cta: 'Taste perfection',
  },
}
