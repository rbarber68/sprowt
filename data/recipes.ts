/**
 * SproutPal — Recipe Database
 * 3-5 recipes per sprout type, practical and nutritious
 */

export interface Recipe {
  id: string
  sproutTypeId: string
  title: string
  description: string
  prepMinutes: number
  ingredients: string[]
  steps: string[]
  tags: ('quick' | 'raw' | 'cooked' | 'smoothie' | 'salad' | 'snack' | 'meal')[]
  nutritionHighlight: string
}

export const RECIPES: Recipe[] = [
  // ─── Broccoli ──────────────────────────────────────────────
  {
    id: 'broccoli-sulforaphane-bowl',
    sproutTypeId: 'broccoli',
    title: 'Sulforaphane Power Bowl',
    description: 'Maximize sulforaphane with the mustard seed powder hack. Raw sprouts on warm rice.',
    prepMinutes: 10,
    ingredients: ['1 cup broccoli sprouts', '1 cup cooked brown rice', '1 avocado, sliced', '1 tsp mustard seed powder', '2 tbsp tahini', '1 tbsp lemon juice', 'Pinch of sea salt'],
    steps: ['Build bowl with warm rice as base', 'Top with raw broccoli sprouts', 'Add sliced avocado', 'Drizzle tahini and lemon juice', 'Sprinkle mustard seed powder on sprouts right before eating (boosts sulforaphane 3x)'],
    tags: ['quick', 'raw', 'meal'],
    nutritionHighlight: 'Mustard seed powder provides exogenous myrosinase, boosting sulforaphane absorption up to 3x',
  },
  {
    id: 'broccoli-smoothie',
    sproutTypeId: 'broccoli',
    title: 'Green Sulforaphane Smoothie',
    description: 'Hide sprouts in a sweet smoothie. You wont taste them but youll get all the benefits.',
    prepMinutes: 5,
    ingredients: ['1/2 cup broccoli sprouts', '1 banana', '1 cup frozen mango', '1 cup almond milk', '1 tbsp honey', '1/2 tsp mustard seed powder'],
    steps: ['Add all ingredients to blender', 'Blend until smooth (30 seconds)', 'Add mustard seed powder last and pulse briefly', 'Drink immediately for maximum potency'],
    tags: ['quick', 'raw', 'smoothie'],
    nutritionHighlight: 'Blending releases glucoraphanin from cell walls. Add mustard powder for the myrosinase enzyme.',
  },
  {
    id: 'broccoli-avocado-toast',
    sproutTypeId: 'broccoli',
    title: 'Sprout & Avocado Toast',
    description: 'The classic, elevated. Piled high with raw sprouts for maximum crunch.',
    prepMinutes: 5,
    ingredients: ['2 slices sourdough bread', '1 avocado', '1 cup broccoli sprouts', 'Red pepper flakes', 'Flaky sea salt', 'Squeeze of lemon'],
    steps: ['Toast sourdough until golden', 'Mash avocado onto toast', 'Pile broccoli sprouts generously on top', 'Finish with pepper flakes, salt, and lemon', 'Eat immediately — raw sprouts are best fresh'],
    tags: ['quick', 'raw', 'snack'],
    nutritionHighlight: 'Raw broccoli sprouts retain 100% of their glucoraphanin — heat destroys the enzyme.',
  },

  // ─── Mung bean ─────────────────────────────────────────────
  {
    id: 'mung-pad-thai',
    sproutTypeId: 'mung',
    title: 'Classic Pad Thai Topping',
    description: 'Crunchy mung sprouts are THE authentic pad thai garnish. Add at the very end.',
    prepMinutes: 20,
    ingredients: ['2 cups mung bean sprouts', '8 oz rice noodles', '2 eggs', '3 tbsp fish sauce', '2 tbsp tamarind paste', '1 tbsp sugar', 'Crushed peanuts', 'Lime wedges'],
    steps: ['Cook rice noodles according to package', 'Scramble eggs in hot wok', 'Add noodles, fish sauce, tamarind, sugar', 'Toss until well combined', 'Top with RAW mung sprouts, crushed peanuts, lime'],
    tags: ['cooked', 'meal'],
    nutritionHighlight: 'Rich in folate and magnesium. Raw topping preserves all nutrients and adds crunch.',
  },
  {
    id: 'mung-stir-fry',
    sproutTypeId: 'mung',
    title: 'Quick Garlic Sprout Stir-Fry',
    description: 'Flash-fried in 2 minutes. The key is HIGH heat and dont overcook.',
    prepMinutes: 8,
    ingredients: ['3 cups mung bean sprouts', '3 cloves garlic, minced', '1 tbsp soy sauce', '1 tsp sesame oil', '1 tbsp vegetable oil', 'Pinch of white pepper'],
    steps: ['Heat wok until smoking hot', 'Add vegetable oil, then garlic (10 seconds)', 'Add sprouts all at once — toss for 60 seconds max', 'Add soy sauce and sesame oil', 'Serve immediately — they should still be crunchy'],
    tags: ['quick', 'cooked', 'snack'],
    nutritionHighlight: 'Flash-cooking preserves most nutrients while adding smoky wok flavor.',
  },
  {
    id: 'mung-spring-rolls',
    sproutTypeId: 'mung',
    title: 'Fresh Spring Rolls',
    description: 'Light rice paper rolls packed with raw sprouts, herbs, and shrimp.',
    prepMinutes: 15,
    ingredients: ['2 cups mung sprouts', '8 rice paper wrappers', '8 cooked shrimp, halved', 'Fresh mint leaves', 'Fresh basil leaves', '1 carrot, julienned', 'Hoisin-peanut dipping sauce'],
    steps: ['Dip rice paper in warm water until pliable', 'Layer shrimp, sprouts, herbs, carrot in center', 'Fold bottom up, sides in, then roll tight', 'Serve with hoisin-peanut sauce', 'Best eaten within 2 hours of rolling'],
    tags: ['raw', 'snack', 'meal'],
    nutritionHighlight: 'Raw sprouts in spring rolls deliver full protein and enzyme content.',
  },

  // ─── Lentil ────────────────────────────────────────────────
  {
    id: 'lentil-mediterranean-bowl',
    sproutTypeId: 'lentil',
    title: 'Mediterranean Sprout Bowl',
    description: 'Hearty sprouted lentils with feta, olives, and sun-dried tomatoes.',
    prepMinutes: 10,
    ingredients: ['2 cups lentil sprouts', '1/4 cup crumbled feta', '1/4 cup kalamata olives', '1/4 cup sun-dried tomatoes', '2 tbsp olive oil', '1 tbsp red wine vinegar', 'Fresh parsley'],
    steps: ['Toss lentil sprouts with olive oil and vinegar', 'Add olives and sun-dried tomatoes', 'Top with crumbled feta and parsley', 'Season with salt and pepper'],
    tags: ['quick', 'raw', 'salad', 'meal'],
    nutritionHighlight: 'Sprouted lentils have 25% more bioavailable protein than cooked dried lentils.',
  },
  {
    id: 'lentil-warm-salad',
    sproutTypeId: 'lentil',
    title: 'Warm Spiced Lentil Salad',
    description: 'Lightly sauteed sprouts with cumin and lemon. Earthy and satisfying.',
    prepMinutes: 10,
    ingredients: ['2 cups lentil sprouts', '1 tsp cumin', '1/2 tsp turmeric', '2 tbsp olive oil', 'Juice of 1 lemon', '1/4 cup chopped cilantro', 'Salt to taste'],
    steps: ['Heat olive oil in pan over medium heat', 'Add cumin and turmeric, toast 30 seconds', 'Add lentil sprouts, toss for 2 minutes (just warm, not cooked)', 'Remove from heat, add lemon juice and cilantro', 'Serve warm as a side or over rice'],
    tags: ['quick', 'cooked', 'salad'],
    nutritionHighlight: 'Turmeric + lentil sprouts = iron absorption boost. High in folate.',
  },
  {
    id: 'lentil-hummus',
    sproutTypeId: 'lentil',
    title: 'Sprouted Lentil Hummus',
    description: 'Blend raw sprouted lentils into a protein-packed dip. No cooking needed.',
    prepMinutes: 10,
    ingredients: ['2 cups lentil sprouts', '2 tbsp tahini', '2 cloves garlic', 'Juice of 1 lemon', '2 tbsp olive oil', '1/2 tsp cumin', 'Salt to taste', 'Water as needed'],
    steps: ['Add all ingredients to food processor', 'Blend until smooth, adding water for consistency', 'Taste and adjust lemon, salt, cumin', 'Drizzle with olive oil and paprika to serve', 'Keeps 3 days refrigerated'],
    tags: ['raw', 'snack'],
    nutritionHighlight: 'Raw sprouted lentils in hummus = maximum enzyme activity and protein digestibility.',
  },

  // ─── Adzuki ────────────────────────────────────────────────
  {
    id: 'adzuki-stir-fry',
    sproutTypeId: 'adzuki',
    title: 'Nutty Adzuki Stir-Fry',
    description: 'Similar to mung but nuttier. Great with ginger and soy.',
    prepMinutes: 10,
    ingredients: ['2 cups adzuki sprouts', '1 tbsp fresh ginger, minced', '2 cloves garlic, minced', '2 tbsp soy sauce', '1 tsp sesame oil', '1 tbsp vegetable oil'],
    steps: ['Heat wok, add oil', 'Add ginger and garlic, stir 30 seconds', 'Add adzuki sprouts, toss 2 minutes', 'Add soy sauce and sesame oil', 'Serve over rice or noodles'],
    tags: ['quick', 'cooked', 'meal'],
    nutritionHighlight: 'Sprouting reduces phytic acid by 60%, making potassium and B vitamins more absorbable.',
  },
  {
    id: 'adzuki-salad',
    sproutTypeId: 'adzuki',
    title: 'Asian Sprout Slaw',
    description: 'Crunchy raw adzuki sprouts with sesame dressing and cabbage.',
    prepMinutes: 10,
    ingredients: ['2 cups adzuki sprouts', '2 cups shredded cabbage', '1 carrot, julienned', '2 tbsp rice vinegar', '1 tbsp sesame oil', '1 tsp honey', 'Sesame seeds'],
    steps: ['Toss cabbage, carrots, and sprouts together', 'Whisk vinegar, sesame oil, and honey', 'Drizzle dressing over slaw', 'Top with sesame seeds'],
    tags: ['quick', 'raw', 'salad'],
    nutritionHighlight: 'High in potassium and B vitamins. The nutty flavor pairs perfectly with sesame.',
  },

  // ─── Radish ────────────────────────────────────────────────
  {
    id: 'radish-taco-topper',
    sproutTypeId: 'radish',
    title: 'Spicy Taco Sprout Topper',
    description: 'The peppery kick of radish sprouts is perfect on tacos.',
    prepMinutes: 5,
    ingredients: ['1 cup radish sprouts', 'Tacos of your choice', 'Lime wedges', 'Hot sauce'],
    steps: ['Prepare your favorite tacos', 'Pile radish sprouts generously on top', 'Squeeze lime over everything', 'Add hot sauce if you dare — the sprouts are already spicy'],
    tags: ['quick', 'raw', 'meal'],
    nutritionHighlight: 'Radish sprout isothiocyanates (the spicy compounds) are the same family as sulforaphane.',
  },
  {
    id: 'radish-broccoli-power-mix',
    sproutTypeId: 'radish',
    title: 'Glucosinolate Power Mix',
    description: 'Combine radish + broccoli sprouts for maximum glucosinolate synergy.',
    prepMinutes: 5,
    ingredients: ['1 cup radish sprouts', '1 cup broccoli sprouts', '1 avocado', '1 tbsp olive oil', 'Lemon juice', 'Salt and pepper'],
    steps: ['Toss both sprout types together', 'Slice avocado on top', 'Drizzle olive oil and lemon', 'Eat raw for maximum benefit'],
    tags: ['quick', 'raw', 'salad'],
    nutritionHighlight: 'Radish + broccoli = two different glucosinolate pathways for broader protection.',
  },

  // ─── Alfalfa ───────────────────────────────────────────────
  {
    id: 'alfalfa-club-sandwich',
    sproutTypeId: 'alfalfa',
    title: 'Classic Sprout Club Sandwich',
    description: 'The deli classic. Alfalfa sprouts were born for sandwiches.',
    prepMinutes: 8,
    ingredients: ['3 slices bread, toasted', 'Turkey or chicken slices', '2 strips bacon', 'Tomato slices', '1 cup alfalfa sprouts', 'Mayo', 'Lettuce'],
    steps: ['Spread mayo on toast', 'Layer turkey, bacon, tomato, lettuce', 'Pile alfalfa sprouts thick', 'Add second layer and top with third toast', 'Cut diagonally and secure with picks'],
    tags: ['meal', 'raw'],
    nutritionHighlight: 'High in vitamins C and K. One of the most nutrient-dense sprouts per gram.',
  },
  {
    id: 'alfalfa-smoothie-bowl',
    sproutTypeId: 'alfalfa',
    title: 'Green Goddess Smoothie Bowl',
    description: 'Mild alfalfa sprouts blend invisibly into a sweet smoothie bowl.',
    prepMinutes: 5,
    ingredients: ['1/2 cup alfalfa sprouts', '1 frozen banana', '1/2 cup frozen berries', '1/2 cup yogurt', 'Granola for topping', 'Honey drizzle'],
    steps: ['Blend sprouts, banana, berries, and yogurt', 'Pour into bowl (should be thick)', 'Top with granola and honey', 'Eat with a spoon'],
    tags: ['quick', 'raw', 'smoothie'],
    nutritionHighlight: 'Alfalfa adds vitamins C, K, and minerals without changing the flavor.',
  },

  // ─── Chickpea ──────────────────────────────────────────────
  {
    id: 'chickpea-sprouted-hummus',
    sproutTypeId: 'chickpea',
    title: 'Sprouted Chickpea Hummus',
    description: 'No cooking needed. Raw sprouted chickpeas blend into the creamiest hummus.',
    prepMinutes: 10,
    ingredients: ['2 cups sprouted chickpeas', '3 tbsp tahini', '2 cloves garlic', 'Juice of 1 lemon', '3 tbsp olive oil', '1/2 tsp cumin', 'Salt', 'Water as needed'],
    steps: ['Add chickpea sprouts, tahini, garlic, lemon to food processor', 'Blend, adding olive oil and water until smooth', 'Season with cumin and salt', 'Serve with olive oil drizzle and paprika'],
    tags: ['raw', 'snack'],
    nutritionHighlight: 'Sprouting increases protein digestibility by 25% and eliminates the need to cook.',
  },
  {
    id: 'chickpea-roasted-snack',
    sproutTypeId: 'chickpea',
    title: 'Roasted Sprouted Chickpeas',
    description: 'Crunchy, savory, addictive. Better than store-bought because sprouting makes them lighter.',
    prepMinutes: 25,
    ingredients: ['2 cups sprouted chickpeas', '1 tbsp olive oil', '1 tsp smoked paprika', '1/2 tsp garlic powder', '1/2 tsp cumin', 'Salt'],
    steps: ['Preheat oven to 400F', 'Pat sprouts dry thoroughly', 'Toss with oil and spices', 'Spread on baking sheet in single layer', 'Roast 20 min, shaking halfway, until crispy'],
    tags: ['cooked', 'snack'],
    nutritionHighlight: 'Sprouting converts starch to simpler sugars — easier to digest than regular roasted chickpeas.',
  },

  // ─── Fenugreek ─────────────────────────────────────────────
  {
    id: 'fenugreek-curry-mix',
    sproutTypeId: 'fenugreek',
    title: 'Sprout Curry Stir-In',
    description: 'Fenugreek sprouts are MADE for curry. Stir in at the end for authentic flavor.',
    prepMinutes: 5,
    ingredients: ['1 cup fenugreek sprouts', 'Your favorite curry', '1/2 cup mung sprouts (optional)'],
    steps: ['Prepare your curry as usual', 'In the last 2 minutes, stir in fenugreek sprouts', 'The sprouts will soften slightly but keep their flavor', 'Mix with mung sprouts for a milder blend'],
    tags: ['quick', 'cooked', 'meal'],
    nutritionHighlight: 'Diosgenin in fenugreek has documented blood glucose lowering effects.',
  },
  {
    id: 'fenugreek-indian-salad',
    sproutTypeId: 'fenugreek',
    title: 'Methi Sprout Chaat',
    description: 'Indian-style sprout salad with chaat masala, onion, and lemon.',
    prepMinutes: 8,
    ingredients: ['1 cup fenugreek sprouts', '1 cup mung sprouts', '1 small onion, diced', '1 tomato, diced', '1 tsp chaat masala', 'Juice of 1 lemon', 'Fresh cilantro'],
    steps: ['Toss sprouts with onion and tomato', 'Add chaat masala and lemon juice', 'Garnish with cilantro', 'Serve as a snack or side dish'],
    tags: ['quick', 'raw', 'salad', 'snack'],
    nutritionHighlight: 'High in iron and magnesium. The curry-like aroma comes from sotolone.',
  },

  // ─── Clover ────────────────────────────────────────────────
  {
    id: 'clover-garden-salad',
    sproutTypeId: 'clover',
    title: 'Spring Garden Salad',
    description: 'Delicate clover sprouts are the perfect salad base. Mild and fresh.',
    prepMinutes: 8,
    ingredients: ['2 cups red clover sprouts', '1 cup mixed greens', '1/4 cup walnuts', '1/4 cup dried cranberries', '2 tbsp goat cheese', 'Balsamic vinaigrette'],
    steps: ['Toss clover sprouts with mixed greens', 'Add walnuts and cranberries', 'Crumble goat cheese on top', 'Drizzle with balsamic vinaigrette'],
    tags: ['quick', 'raw', 'salad'],
    nutritionHighlight: 'High in isoflavones with cardiovascular and hormonal health benefits.',
  },

  // ─── Sunflower ─────────────────────────────────────────────
  {
    id: 'sunflower-power-salad',
    sproutTypeId: 'sunflower',
    title: 'Sunflower Microgreen Power Salad',
    description: 'Thick, nutty sunflower shoots as the main event. Not a garnish — the star.',
    prepMinutes: 8,
    ingredients: ['3 cups sunflower microgreens', '1 avocado', '1/4 cup sunflower seeds', '2 tbsp lemon juice', '2 tbsp olive oil', 'Salt and pepper'],
    steps: ['Use sunflower microgreens as the salad base', 'Slice avocado on top', 'Sprinkle raw sunflower seeds', 'Dress with lemon and olive oil'],
    tags: ['quick', 'raw', 'salad'],
    nutritionHighlight: 'One of the highest protein sprouts. Rich in vitamin E, selenium, and zinc.',
  },
  {
    id: 'sunflower-sandwich',
    sproutTypeId: 'sunflower',
    title: 'Sunflower Shoot Sandwich',
    description: 'Thick sunflower shoots replace lettuce entirely. Way more flavor and nutrition.',
    prepMinutes: 5,
    ingredients: ['2 slices bread', 'Cream cheese or hummus', '2 cups sunflower shoots', 'Cucumber slices', 'Tomato slices', 'Salt and pepper'],
    steps: ['Spread cream cheese or hummus on bread', 'Layer thick sunflower shoots', 'Add cucumber and tomato', 'Season and close sandwich'],
    tags: ['quick', 'raw', 'meal'],
    nutritionHighlight: 'Great for post-workout recovery — high protein content per gram.',
  },

  // ─── Pea shoots ────────────────────────────────────────────
  {
    id: 'pea-shoot-saute',
    sproutTypeId: 'pea',
    title: 'Garlic Pea Shoot Saut\u00e9',
    description: 'Restaurant-quality side dish. Sweet pea shoots with garlic in 3 minutes.',
    prepMinutes: 5,
    ingredients: ['3 cups pea shoots', '3 cloves garlic, sliced', '1 tbsp olive oil', 'Pinch of salt', 'Squeeze of lemon'],
    steps: ['Heat olive oil in large pan', 'Add garlic, cook 30 seconds', 'Add pea shoots, toss for 2 minutes until just wilted', 'Season with salt and lemon', 'Serve immediately — they overcook fast'],
    tags: ['quick', 'cooked', 'snack'],
    nutritionHighlight: 'High in vitamins A and C. The sweet flavor comes from natural sugars.',
  },
  {
    id: 'pea-shoot-salad',
    sproutTypeId: 'pea',
    title: 'Pea Shoot & Feta Salad',
    description: 'Tendrils and leaves with salty feta and a bright lemon dressing.',
    prepMinutes: 5,
    ingredients: ['2 cups pea shoots with tendrils', '1/4 cup crumbled feta', '2 tbsp olive oil', '1 tbsp lemon juice', 'Fresh mint leaves', 'Black pepper'],
    steps: ['Arrange pea shoots on plate', 'Scatter feta and mint', 'Drizzle olive oil and lemon', 'Crack black pepper on top'],
    tags: ['quick', 'raw', 'salad'],
    nutritionHighlight: 'Restaurants charge premium for these tendrils — yours are fresher and free.',
  },

  // ─── Wheatgrass ────────────────────────────────────────────
  {
    id: 'wheatgrass-shot',
    sproutTypeId: 'wheatgrass',
    title: 'Classic Wheatgrass Shot',
    description: 'The OG health shot. 1oz of pure green energy. Requires a juicer.',
    prepMinutes: 5,
    ingredients: ['1 large handful wheatgrass (about 1oz juice yield)', 'Small piece of ginger (optional)', 'Lemon wedge chaser'],
    steps: ['Feed wheatgrass through masticating juicer', 'Add ginger piece if desired', 'Pour into shot glass', 'Drink in one go, chase with lemon wedge'],
    tags: ['quick', 'raw'],
    nutritionHighlight: '1oz = equivalent chlorophyll of 2.5 lbs of green vegetables. Gluten-free despite the name.',
  },
  {
    id: 'wheatgrass-smoothie',
    sproutTypeId: 'wheatgrass',
    title: 'Wheatgrass Green Smoothie',
    description: 'Juice the wheatgrass first, then blend into a sweet smoothie.',
    prepMinutes: 8,
    ingredients: ['1oz wheatgrass juice', '1 banana', '1 cup frozen pineapple', '1/2 cup coconut water', '1 tbsp honey'],
    steps: ['Juice wheatgrass first (masticating juicer)', 'Add juice to blender with remaining ingredients', 'Blend until smooth', 'Drink immediately — nutrients degrade fast'],
    tags: ['smoothie', 'raw'],
    nutritionHighlight: 'High in chlorophyll, vitamins A, C, E, and K. Must be juiced — cant digest raw blades.',
  },
]

export function getRecipesForSprout(sproutTypeId: string): Recipe[] {
  return RECIPES.filter(r => r.sproutTypeId === sproutTypeId)
}
