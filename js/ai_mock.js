const STAPLES = ["eggs", "rice", "pasta", "tomato", "onion", "garlic", "frozen vegetables", "tuna", "beans"];

export function getSmartSuggestions(lang, shoppingListNames = []) {
  const lower = shoppingListNames.map(x => (x || "").toLowerCase());
  const missing = STAPLES.filter(s => !lower.some(x => x.includes(s)));

  // pick 3
  const picks = missing.slice(0, 3);

  if (lang === "de") return `Vorschläge: ${picks.join(", ") || "Du hast schon viele Basics!"}.`;
  if (lang === "it") return `Suggerimenti: ${picks.join(", ") || "Hai già molte cose base!"}.`;
  return `Suggestions: ${picks.join(", ") || "You already have many staples!"}.`;
}

export function getSmartRecipe(lang, inventoryNames = []) {
  const inv = inventoryNames.map(x => (x || "").toLowerCase()).join(" ");

  let recipe = "";
  if (inv.includes("pasta") && (inv.includes("tomato") || inv.includes("pomodoro"))) {
    recipe = "Pasta al pomodoro: boil pasta, heat tomato + garlic, mix, add salt/olive oil.";
  } else if (inv.includes("rice") && inv.includes("egg")) {
    recipe = "Fried rice: cook rice, scramble eggs, add veggies, soy sauce, stir-fry.";
  } else if (inv.includes("chicken") && (inv.includes("vegetable") || inv.includes("broccoli"))) {
    recipe = "Chicken stir-fry: sauté chicken, add veggies, season, serve.";
  } else {
    recipe = "Zero-waste bowl: combine your leftovers, add a simple dressing, and balance carbs + protein + veggies.";
  }

  if (lang === "de") return `Rezept: ${recipe}`;
  if (lang === "it") return `Ricetta: ${recipe}`;
  return `Recipe: ${recipe}`;
}
