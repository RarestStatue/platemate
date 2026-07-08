import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Platemate...");

  await prisma.recipeDuplicateFlag.deleteMany();
  await prisma.shoppingListItem.deleteMany();
  await prisma.userRecipeSave.deleteMany();
  await prisma.userFollow.deleteMany();
  await prisma.recipeComment.deleteMany();
  await prisma.recipeReview.deleteMany();
  await prisma.recipeRating.deleteMany();
  await prisma.userPantry.deleteMany();
  await prisma.ingredientSubstitution.deleteMany();
  await prisma.recipeStep.deleteMany();
  await prisma.recipeIngredient.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.userDietaryRestriction.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.ingredient.deleteMany();

  const passwordHash = await bcrypt.hash("Password123!", 12);

  const users = await Promise.all(
    [
      ["chefdrew", "drew@platemate.com", "Database architect who loves quick student meals."],
      ["chefmaxs", "maxs@platemate.com", "Comfort food and easy dinners."],
      ["chefmaxp", "maxp@platemate.com", "High-protein meals and healthy prep."],
      ["chefphilip", "philip@platemate.com", "Plant-based recipes for busy students."],
      ["chefjack", "jack@platemate.com", "Cheap meal prep for the week."],
      ["chefjosh", "josh@platemate.com", "Simple food that still feels special."],
      ["chefjayvyn", "jayvyn@platemate.com", "Fast recipes between classes."],
      ["homechef", "home@platemate.com", "Homestyle cooking made easy."],
    ].map(([username, email, bio]) =>
      prisma.user.create({
        data: {
          username,
          email,
          passwordHash,
          profile: { create: { bio, avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${username}` } },
          dietaryRestrictions: { create: {} },
        },
      })
    )
  );

  const ingredientData = [
    ["chicken breast", "Chicken Breast", 165, 31, 0, 3.6, "g", false],
    ["white rice", "White Rice", 130, 2.7, 28, 0.3, "g", true],
    ["egg", "Egg", 155, 13, 1.1, 11, "egg", true],
    ["soy sauce", "Soy Sauce", 53, 8, 4.9, 0.6, "tbsp", true],
    ["garlic", "Garlic", 149, 6.4, 33, 0.5, "clove", true],
    ["onion", "Onion", 40, 1.1, 9.3, 0.1, "g", true],
    ["olive oil", "Olive Oil", 884, 0, 0, 100, "tbsp", true],
    ["pasta", "Pasta", 158, 5.8, 31, 0.9, "g", true],
    ["ground beef", "Ground Beef", 250, 26, 0, 15, "g", false],
    ["tomato sauce", "Tomato Sauce", 29, 1.3, 6, 0.2, "cup", true],
    ["cheddar cheese", "Cheddar Cheese", 403, 25, 1.3, 33, "g", false],
    ["milk", "Milk", 42, 3.4, 5, 1, "ml", false],
    ["oats", "Oats", 389, 17, 66, 7, "g", true],
    ["banana", "Banana", 89, 1.1, 23, 0.3, "banana", true],
    ["blueberries", "Blueberries", 57, 0.7, 14, 0.3, "g", true],
    ["greek yogurt", "Greek Yogurt", 59, 10, 3.6, 0.4, "g", false],
    ["spinach", "Spinach", 23, 2.9, 3.6, 0.4, "g", true],
    ["broccoli", "Broccoli", 35, 2.4, 7.2, 0.4, "g", true],
    ["tortilla", "Tortilla", 237, 7, 49, 4, "piece", false],
    ["black beans", "Black Beans", 132, 8.9, 24, 0.5, "g", true],
    ["salmon", "Salmon", 208, 20, 0, 13, "g", false],
    ["quinoa", "Quinoa", 120, 4.4, 21, 1.9, "g", true],
    ["mushrooms", "Mushrooms", 22, 3.1, 3.3, 0.3, "g", true],
    ["bell pepper", "Bell Pepper", 31, 1, 6, 0.3, "g", true],
    ["lettuce", "Lettuce", 15, 1.4, 2.9, 0.2, "g", true],
  ] as const;

  const ingredients = new Map<string, number>();

  for (const [name, displayName, calories, protein, carbs, fat, unit, staple] of ingredientData) {
    const item = await prisma.ingredient.create({
      data: {
        name,
        displayName,
        caloriesPer100g: calories,
        proteinPer100g: protein,
        carbsPer100g: carbs,
        fatPer100g: fat,
        defaultUnit: unit,
        isPantryStaple: staple,
      },
    });
    ingredients.set(name, item.id);
  }

  const recipeData = [
    {
      title: "Chicken Fried Rice",
      creator: 0,
      description: "A fast student-friendly fried rice using pantry staples.",
      prepTimeMin: 25,
      servings: 2,
      photoUrl: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=1200",
      flags: { hasEggs: true, hasGluten: true },
      tags: ["quick", "dinner", "asian"],
      items: [["white rice", 250, "g"], ["chicken breast", 200, "g"], ["egg", 2, "eggs"], ["soy sauce", 2, "tbsp"], ["garlic", 2, "cloves"]],
      steps: ["Cook rice or use leftover rice.", "Cook chicken in a pan.", "Scramble eggs.", "Add rice, soy sauce, and garlic.", "Stir fry until hot."],
    },
    {
      title: "Protein Pancakes",
      creator: 2,
      description: "Simple pancakes with oats, banana, eggs, and Greek yogurt.",
      prepTimeMin: 15,
      servings: 2,
      photoUrl: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=1200",
      flags: { hasEggs: true, hasDairy: true, isVegetarian: true },
      tags: ["breakfast", "high-protein", "quick"],
      items: [["oats", 80, "g"], ["banana", 1, "banana"], ["egg", 2, "eggs"], ["greek yogurt", 100, "g"]],
      steps: ["Blend oats, banana, eggs, and yogurt.", "Heat a lightly oiled pan.", "Pour small pancakes.", "Cook until golden on both sides."],
    },
    {
      title: "Spaghetti Bolognese",
      creator: 1,
      description: "Classic pasta with beef and tomato sauce.",
      prepTimeMin: 35,
      servings: 4,
      photoUrl: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=1200",
      flags: { hasGluten: true },
      tags: ["dinner", "italian", "comfort-food"],
      items: [["pasta", 400, "g"], ["ground beef", 300, "g"], ["tomato sauce", 2, "cups"], ["onion", 1, "onion"], ["garlic", 2, "cloves"]],
      steps: ["Boil pasta.", "Brown beef with onion and garlic.", "Add tomato sauce.", "Simmer for 15 minutes.", "Serve sauce over pasta."],
    },
    {
      title: "Veggie Omelette",
      creator: 6,
      description: "Quick breakfast omelette packed with vegetables.",
      prepTimeMin: 12,
      servings: 1,
      photoUrl: "https://images.unsplash.com/photo-1510693206972-df098062cb71?w=1200",
      flags: { hasEggs: true, hasDairy: true, isVegetarian: true },
      tags: ["breakfast", "quick", "vegetarian"],
      items: [["egg", 3, "eggs"], ["spinach", 50, "g"], ["mushrooms", 50, "g"], ["cheddar cheese", 30, "g"]],
      steps: ["Beat eggs.", "Cook vegetables.", "Add eggs to pan.", "Sprinkle cheese.", "Fold and serve."],
    },
    {
      title: "Greek Chicken Bowl",
      creator: 4,
      description: "Meal prep bowl with chicken, rice, vegetables, and yogurt sauce.",
      prepTimeMin: 30,
      servings: 3,
      photoUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200",
      flags: { hasDairy: true },
      tags: ["meal-prep", "high-protein", "healthy"],
      items: [["chicken breast", 300, "g"], ["white rice", 300, "g"], ["greek yogurt", 120, "g"], ["lettuce", 80, "g"], ["bell pepper", 100, "g"]],
      steps: ["Cook rice.", "Season and cook chicken.", "Slice vegetables.", "Mix yogurt sauce.", "Assemble bowls."],
    },
    {
      title: "Berry Protein Smoothie",
      creator: 2,
      description: "A quick smoothie for breakfast or after the gym.",
      prepTimeMin: 5,
      servings: 1,
      photoUrl: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=1200",
      flags: { hasDairy: true, isVegetarian: true },
      tags: ["breakfast", "quick", "high-protein"],
      items: [["blueberries", 100, "g"], ["banana", 1, "banana"], ["greek yogurt", 150, "g"], ["milk", 200, "ml"]],
      steps: ["Add all ingredients to blender.", "Blend until smooth.", "Pour into a cup and serve cold."],
    },
    {
      title: "Overnight Oats",
      creator: 5,
      description: "Cheap, healthy breakfast prepared the night before.",
      prepTimeMin: 10,
      servings: 2,
      photoUrl: "https://images.unsplash.com/photo-1614961233913-a5113a4a34ed?w=1200",
      flags: { hasDairy: true, isVegetarian: true },
      tags: ["breakfast", "meal-prep", "cheap"],
      items: [["oats", 120, "g"], ["milk", 250, "ml"], ["greek yogurt", 100, "g"], ["blueberries", 80, "g"], ["banana", 1, "banana"]],
      steps: ["Mix oats, milk, and yogurt.", "Top with fruit.", "Refrigerate overnight.", "Eat cold or warm up."],
    },
    {
      title: "Mac and Cheese",
      creator: 1,
      description: "Creamy comfort food with simple ingredients.",
      prepTimeMin: 25,
      servings: 3,
      photoUrl: "https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?w=1200",
      flags: { hasDairy: true, hasGluten: true, isVegetarian: true },
      tags: ["comfort-food", "dinner", "vegetarian"],
      items: [["pasta", 300, "g"], ["cheddar cheese", 150, "g"], ["milk", 250, "ml"], ["garlic", 1, "clove"]],
      steps: ["Boil pasta.", "Warm milk and cheese together.", "Add garlic.", "Mix pasta with sauce.", "Serve warm."],
    },
    {
      title: "Beef Tacos",
      creator: 7,
      description: "Easy tacos for a quick dinner with friends.",
      prepTimeMin: 20,
      servings: 4,
      photoUrl: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1200",
      flags: { hasGluten: true },
      tags: ["dinner", "mexican", "quick"],
      items: [["ground beef", 300, "g"], ["tortilla", 8, "pieces"], ["lettuce", 80, "g"], ["cheddar cheese", 80, "g"], ["tomato sauce", 0.5, "cup"]],
      steps: ["Cook beef.", "Warm tortillas.", "Prepare toppings.", "Fill tortillas.", "Serve immediately."],
    },
    {
      title: "Veggie Stir Fry",
      creator: 3,
      description: "A flexible vegetable stir fry for using what you have.",
      prepTimeMin: 18,
      servings: 2,
      photoUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=1200",
      flags: { hasGluten: true, isVegetarian: true, isVegan: true },
      tags: ["vegan", "quick", "healthy"],
      items: [["broccoli", 150, "g"], ["bell pepper", 100, "g"], ["mushrooms", 100, "g"], ["soy sauce", 2, "tbsp"], ["garlic", 2, "cloves"]],
      steps: ["Chop vegetables.", "Heat oil in pan.", "Add vegetables.", "Add soy sauce and garlic.", "Cook until tender."],
    },
  ];

  const recipes = [];
  const tagIds = new Map<string, number>();

  for (const r of recipeData) {
    const recipeTagIds: number[] = [];
    for (const tagName of r.tags) {
      let tagId = tagIds.get(tagName);
      if (!tagId) {
        const tag = await prisma.tag.create({
          data: { name: tagName, displayName: tagName },
        });
        tagId = tag.id;
        tagIds.set(tagName, tagId);
      }
      recipeTagIds.push(tagId);
    }

    const recipe = await prisma.recipe.create({
      data: {
        creatorId: users[r.creator].id,
        title: r.title,
        description: r.description,
        prepTimeMin: r.prepTimeMin,
        servings: r.servings,
        photoUrl: r.photoUrl,
        ...r.flags,
        tags: {
          create: recipeTagIds.map((tagId) => ({ tagId })),
        },
        ingredients: {
          create: r.items.map(([ingredientName, quantity, unit], index) => ({
            ingredientId: ingredients.get(String(ingredientName))!,
            quantity: Number(quantity),
            unit: String(unit),
            sortOrder: index + 1,
          })),
        },
        steps: {
          create: r.steps.map((instruction, index) => ({
            stepNumber: index + 1,
            instruction,
            durationMin: index === 0 ? 3 : null,
          })),
        },
      },
    });
    recipes.push(recipe);
  }

  for (let i = 0; i < users.length; i++) {
    await prisma.userPantry.createMany({
      data: ["white rice", "egg", "garlic", "onion", "olive oil", "oats"]
        .slice(0, 3 + (i % 4))
        .map((name) => ({
          userId: users[i].id,
          ingredientId: ingredients.get(name)!,
  
          quantity:
            name === "egg"
              ? 12
              : name === "olive oil"
              ? 250
              : 500,
  
          unit:
            name === "egg"
              ? "eggs"
              : name === "olive oil"
              ? "ml"
              : "g",
        })),
      skipDuplicates: true,
    });
  }

  for (let i = 0; i < recipes.length; i++) {
    for (let j = 0; j < users.length; j++) {
      if ((i + j) % 3 === 0) {
        await prisma.recipeRating.create({
          data: {
            recipeId: recipes[i].id,
            userId: users[j].id,
            rating: 4 + ((i + j) % 2),
          },
        });
      }
    }
  }

  for (let i = 0; i < recipes.length; i++) {
    await prisma.recipeReview.create({
      data: {
        recipeId: recipes[i].id,
        userId: users[(i + 2) % users.length].id,
        text: ["Super easy and tasted great.", "Perfect after class.", "Cheap, quick, and filling.", "Would definitely make again."][i % 4],
      },
    });

    await prisma.recipeComment.create({
      data: {
        recipeId: recipes[i].id,
        userId: users[(i + 3) % users.length].id,
        text: ["Can I meal prep this?", "This looks amazing.", "Tried this last night and loved it.", "Great student recipe."][i % 4],
      },
    });
  }

  for (let i = 0; i < users.length; i++) {
    await prisma.userRecipeSave.createMany({
      data: [
        { userId: users[i].id, recipeId: recipes[i % recipes.length].id },
        { userId: users[i].id, recipeId: recipes[(i + 2) % recipes.length].id },
      ],
      skipDuplicates: true,
    });

    await prisma.userFollow.createMany({
      data: [
        { followerId: users[i].id, followingId: users[(i + 1) % users.length].id },
        { followerId: users[i].id, followingId: users[(i + 2) % users.length].id },
      ],
      skipDuplicates: true,
    });
  }

  await prisma.ingredientSubstitution.createMany({
    data: [
      {
        originalIngredientId: ingredients.get("milk")!,
        substituteIngredientId: ingredients.get("greek yogurt")!,
        flavorImpact: "Thicker and tangier result.",
        vegetarian: true,
        glutenFree: true,
        notes: "Works for smoothies and pancakes.",
      },
      {
        originalIngredientId: ingredients.get("white rice")!,
        substituteIngredientId: ingredients.get("quinoa")!,
        flavorImpact: "Adds nuttier flavor and more protein.",
        vegetarian: true,
        vegan: true,
        glutenFree: true,
      },
      {
        originalIngredientId: ingredients.get("ground beef")!,
        substituteIngredientId: ingredients.get("black beans")!,
        flavorImpact: "Makes the dish plant-based and lighter.",
        vegetarian: true,
        vegan: true,
        glutenFree: true,
      },
    ],
  });

  for (let i = 0; i < users.length; i++) {
    await prisma.shoppingListItem.createMany({
      data: [
        {
          userId: users[i].id,
          ingredientId: ingredients.get("chicken breast")!,
          fromRecipeId: recipes[0].id,
          quantity: 300,
          unit: "g",
        },
        {
          userId: users[i].id,
          ingredientId: ingredients.get("blueberries")!,
          fromRecipeId: recipes[5].id,
          quantity: 100,
          unit: "g",
        },
      ],
    });
  }

  for (const recipe of recipes) {
    const ratings = await prisma.recipeRating.findMany({ where: { recipeId: recipe.id } });
    const reviewCount = await prisma.recipeReview.count({ where: { recipeId: recipe.id } });
    const commentCount = await prisma.recipeComment.count({ where: { recipeId: recipe.id } });
    const saveCount = await prisma.userRecipeSave.count({ where: { recipeId: recipe.id } });

    const avgRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

    await prisma.recipe.update({
      where: { id: recipe.id },
      data: {
        avgRating: Number(avgRating.toFixed(2)),
        ratingCount: ratings.length,
        reviewCount,
        commentCount,
        saveCount,
        lastEngagementAt: new Date(),
      },
    });
  }

  for (const user of users) {
    const recipeCount = await prisma.recipe.count({ where: { creatorId: user.id } });
    const reviewCount = await prisma.recipeReview.count({ where: { userId: user.id } });

    await prisma.userProfile.update({
      where: { userId: user.id },
      data: { recipeCount, reviewCount },
    });
  }

  console.log("Seed complete.");
  console.log("Login with any seeded account using password: Password123!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
