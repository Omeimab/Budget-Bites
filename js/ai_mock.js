const STAPLES = ["eggs", "rice", "pasta", "tomato", "onion", "garlic", "frozen vegetables", "tuna", "beans"];

export function getSmartRecipe(lang, inventoryNames = []) {
  const inv = (inventoryNames || []).map(x => (x || "").toLowerCase()).join(" ");

  const T = (en, de, it) => (lang === "de" ? de : lang === "it" ? it : en);
  const has = (...words) => words.some(w => inv.includes(w));

  const pool = [];

  // Helper to push a recipe card
  const add = (title, why, steps, tip) => {
    pool.push({ title, why, steps, tip });
  };

  // Protein-ish
  const hasEgg = has("egg", "eier", "uova");
  const hasChicken = has("chicken", "hähn", "pollo");
  const hasTuna = has("tuna", "thun", "tonno");
  const hasBeans = has("beans", "bohnen", "ceci", "fagioli", "lentil", "linsen", "lenticchie");

  // Carbs-ish
  const hasPasta = has("pasta", "spaghetti", "penne");
  const hasRice = has("rice", "reis", "riso");
  const hasBread = has("bread", "brot", "pane", "toast", "wrap", "tortilla");

  // Veggies-ish
  const hasTomato = has("tomato", "pomodoro", "tomate");
  const hasOnion = has("onion", "zwiebel", "cipolla");
  const hasVeg = has("broccoli", "spinach", "spinat", "zucchini", "paprika", "carrot", "mushroom", "salad", "gurke");

  // Recipe suggestions (only add if it makes sense)
  if (hasPasta && (hasTomato || hasOnion)) {
    add(
      T("1) Tomato Pasta (10 min)", "1) Tomatenpasta (10 Min)", "1) Pasta al pomodoro (10 min)"),
      T("Fast, cheap, and always works with pantry ingredients.",
        "Schnell, günstig und funktioniert mit Vorräten.",
        "Veloce, economica e funziona con ingredienti base."),
      T(
        "• Cook pasta\n• Heat sauce (tomato/onion/garlic)\n• Mix + season\n• Optional: add tuna/cheese",
        "• Pasta kochen\n• Sauce erhitzen (Tomate/Zwiebel/Knoblauch)\n• Mischen + würzen\n• Optional: Thunfisch/Käse",
        "• Cuoci la pasta\n• Scalda il sugo (pomodoro/cipolla/aglio)\n• Mescola + condisci\n• Opzionale: tonno/formaggio"
      ),
      T("Budget tip: use store-brand tomato sauce + spices.",
        "Budget-Tipp: Eigenmarke-Tomatensauce + Gewürze.",
        "Consiglio budget: salsa di pomodoro economica + spezie.")
    );
  }

  if (hasEgg) {
    add(
      T("2) Leftover Omelette / Frittata", "2) Rest-Omelette / Frittata", "2) Frittata svuota-frigo"),
      T("Great for using small leftovers without waste.",
        "Perfekt, um kleine Reste ohne Verschwendung zu nutzen.",
        "Perfetta per usare piccoli avanzi senza sprechi."),
      T(
        "• Beat eggs\n• Add chopped leftovers\n• Cook on low heat 5–7 min\n• Serve with salad/bread",
        "• Eier verquirlen\n• Reste klein schneiden und dazu\n• 5–7 Min bei niedriger Hitze garen\n• Mit Salat/Brot servieren",
        "• Sbatti le uova\n• Aggiungi avanzi tritati\n• Cuoci 5–7 min a fuoco basso\n• Servi con insalata/pane"
      ),
      T("Zero-waste tip: use the items that expire first.",
        "Zero-Waste Tipp: Erst verbrauchen, was bald abläuft.",
        "Consiglio anti-spreco: usa prima ciò che scade.")
    );
  }

  if (hasRice && (hasEgg || hasChicken || hasVeg)) {
    add(
      T("3) Fried Rice Style Bowl", "3) Bratreis Bowl", "3) Riso saltato"),
      T("Perfect when you need a complete meal quickly.",
        "Perfekt für eine schnelle komplette Mahlzeit.",
        "Perfetto per un pasto completo veloce."),
      T(
        "• Warm rice in a pan\n• Add veggies + protein\n• Season + stir-fry 3–5 min",
        "• Reis in der Pfanne erwärmen\n• Gemüse + Protein dazu\n• Würzen + 3–5 Min anbraten",
        "• Scalda il riso in padella\n• Aggiungi verdure + proteine\n• Condisci + salta 3–5 min"
      ),
      T("Budget tip: frozen veggies are cheap + no waste.",
        "Budget-Tipp: TK-Gemüse ist günstig + kein Verderb.",
        "Consiglio budget: verdure surgelate = economiche + niente sprechi.")
    );
  }

  if (hasBeans || hasLentils(inv)) {
    add(
      T("4) Quick Bean/Lentil Salad", "4) Bohnen/Linsen-Salat", "4) Insalata di legumi"),
      T("High protein, cheap, and meal-prep friendly.",
        "Proteinreich, günstig und perfekt zum Vorbereiten.",
        "Ricca di proteine, economica e ottima per meal prep."),
      T(
        "• Rinse beans/lentils\n• Mix with onion/tomato/veg\n• Add oil + vinegar/lemon\n• Salt/pepper",
        "• Bohnen/Linsen abspülen\n• Mit Zwiebel/Tomate/Gemüse mischen\n• Öl + Essig/Zitrone\n• Salz/Pfeffer",
        "• Sciacqua legumi\n• Mescola con cipolla/pomodoro/verdure\n• Olio + aceto/limone\n• Sale/pepe"
      ),
      T("Tip: keeps 2–3 days in the fridge.",
        "Tipp: hält 2–3 Tage im Kühlschrank.",
        "Consiglio: dura 2–3 giorni in frigo.")
    );
  }

  if (pool.length < 3 && hasBread) {
    add(
      T("5) Toast/Wrap Combo", "5) Toast/Wrap Kombi", "5) Toast/Wrap"),
      T("Use whatever you have: protein + veggies + sauce.",
        "Nutze was du hast: Protein + Gemüse + Sauce.",
        "Usa ciò che hai: proteine + verdure + salsa."),
      T(
        "• Add protein (egg/tuna/chicken)\n• Add veggies\n• Add sauce/spices\n• Toast or wrap",
        "• Protein dazu (Ei/Thunfisch/Hähnchen)\n• Gemüse dazu\n• Sauce/Gewürze\n• Toasten oder wrappen",
        "• Aggiungi proteine (uovo/tonno/pollo)\n• Aggiungi verdure\n• Salsa/spezie\n• Tosta o wrap"
      ),
      T("Budget tip: wraps are great for leftovers.",
        "Budget-Tipp: Wraps sind super für Reste.",
        "Consiglio budget: i wrap sono perfetti per gli avanzi.")
    );
  }

  // If inventory is empty
  if (!inventoryNames || inventoryNames.length === 0) {
    return T(
      "Add some items to your Inventory first, then I’ll suggest recipes.",
      "Füge zuerst ein paar Produkte zum Vorrat hinzu, dann schlage ich Rezepte vor.",
      "Aggiungi prima prodotti nella dispensa, poi ti suggerisco ricette."
    );
  }

  // If nothing matched, give generic but still “recipe-style” options
  if (pool.length === 0) {
    return T(
      "I couldn’t match a specific recipe yet. Try adding staple items (rice/pasta/eggs/tomato) to get better suggestions.",
      "Ich konnte noch kein konkretes Rezept matchen. Füge Basics hinzu (Reis/Pasta/Eier/Tomate) für bessere Vorschläge.",
      "Non riesco ancora a trovare una ricetta specifica. Aggiungi basi (riso/pasta/uova/pomodoro) per suggerimenti migliori."
    );
  }

  // Build “AI-like” output: 3 options max
  const out = pool.slice(0, 3).map(r =>
    `${r.title}\nWhy: ${r.why}\nSteps:\n${r.steps}\n${r.tip ? `Tip: ${r.tip}` : ""}`
  ).join("\n\n---\n\n");

  return out;
}

function hasLentils(invString) {
  return invString.includes("lentil") || invString.includes("linsen") || invString.includes("lenticchie");
}
