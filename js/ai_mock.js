export function getSmartSuggestions(lang, shoppingNames = []) {
  const T = (en, de, it) => (lang === "de" ? de : lang === "it" ? it : en);
  const items = (shoppingNames || []).map((x) => (x || "").toLowerCase()).join(" ");

  const suggestions = [];

  if (items.includes("pasta") || items.includes("spaghetti") || items.includes("penne")) {
    suggestions.push(
      T(
        "If you're buying pasta: add canned tomatoes + onions + garlic for 3 fast dinners.",
        "Wenn du Pasta kaufst: Dosentomaten + Zwiebeln + Knoblauch = 3 schnelle Abendessen.",
        "Se compri pasta: pomodori in scatola + cipolla + aglio = 3 cene veloci."
      )
    );
  }

  if (items.includes("rice") || items.includes("reis") || items.includes("riso")) {
    suggestions.push(
      T(
        "Rice tip: add frozen veggies + eggs for quick fried-rice meals.",
        "Reis-Tipp: TK-Gemüse + Eier für schnellen Bratreis.",
        "Consiglio riso: verdure surgelate + uova per riso saltato veloce."
      )
    );
  }

  if (items.includes("milk") || items.includes("milch") || items.includes("latte")) {
    suggestions.push(
      T(
        "Milk/dairy: consider adding oats or cereal to avoid waste (easy breakfasts).",
        "Milchprodukte: Haferflocken oder Müsli dazu – reduziert Verschwendung (Frühstück).",
        "Latticini: aggiungi avena o cereali per non sprecare (colazioni)."
      )
    );
  }

  if (suggestions.length === 0) {
    suggestions.push(
      T(
        "Budget basics: eggs, rice, pasta, canned tomatoes, onions, frozen vegetables.",
        "Budget-Basics: Eier, Reis, Pasta, Dosentomaten, Zwiebeln, TK-Gemüse.",
        "Basi economiche: uova, riso, pasta, pomodori in scatola, cipolle, verdure surgelate."
      )
    );
    suggestions.push(
      T(
        "Zero-waste tip: buy only what matches your inventory for the next 3 days.",
        "Zero-Waste Tipp: Kaufe nur, was zu deinem Vorrat für die nächsten 3 Tage passt.",
        "Consiglio anti-spreco: compra solo ciò che serve per i prossimi 3 giorni."
      )
    );
  }

  return suggestions.slice(0, 3).map((s, i) => `${i + 1}) ${s}`).join("\n");
}

export function getSmartRecipe(lang, inventoryNames = []) {
  const T = (en, de, it) => (lang === "de" ? de : lang === "it" ? it : en);

  if (!inventoryNames || inventoryNames.length === 0) {
    return T(
      "Add some items to your Inventory first, then I’ll suggest recipes.",
      "Füge zuerst ein paar Produkte zum Vorrat hinzu, dann schlage ich Rezepte vor.",
      "Aggiungi prima prodotti nel tuo inventario e poi ti suggerisco ricette."
    );
  }

  const inv = inventoryNames.map((x) => (x || "").toLowerCase()).join(" ");
  const has = (...words) => words.some((w) => inv.includes(w));

  const recipes = [];

  const add = (title, why, steps, tip) => {
    recipes.push({ title, why, steps, tip });
  };

  const hasEgg = has("egg", "eier", "uova");
  const hasTuna = has("tuna", "thun", "tonno");
  const hasChicken = has("chicken", "pollo", "hähn");
  const hasRice = has("rice", "reis", "riso");
  const hasPasta = has("pasta", "spaghetti", "penne");
  const hasTomato = has("tomato", "tomate", "pomodoro");
  const hasOnion = has("onion", "zwiebel", "cipolla");
  const hasVeg = has("broccoli", "spinach", "spinat", "zucchini", "paprika", "carrot", "mushroom", "salad", "gurke");

  if (hasPasta && (hasTomato || hasOnion)) {
    add(
      T("1) Tomato Pasta (10 min)", "1) Tomatenpasta (10 Min)", "1) Pasta al pomodoro (10 min)"),
      T("Fast, cheap, and perfect for pantry items.", "Schnell, günstig, ideal für Vorräte.", "Veloce, economica, ideale per dispensa."),
      T(
        "• Cook pasta\n• Heat tomato/onion sauce\n• Mix + season\n• Optional: add tuna/cheese",
        "• Pasta kochen\n• Tomaten-/Zwiebel-Sauce erhitzen\n• Mischen + würzen\n• Optional: Thunfisch/Käse",
        "• Cuoci la pasta\n• Scalda sugo pomodoro/cipolla\n• Mescola + condisci\n• Opzionale: tonno/formaggio"
      ),
      T("Tip: use store-brand sauce + spices.", "Tipp: Eigenmarke + Gewürze.", "Consiglio: salsa economica + spezie.")
    );
  }

  if (hasEgg) {
    add(
      T("2) Leftover Omelette / Frittata", "2) Rest-Omelette / Frittata", "2) Frittata svuota-frigo"),
      T("Great for using small leftovers (zero waste).", "Perfekt für kleine Reste (zero waste).", "Perfetta per piccoli avanzi (zero waste)."),
      T(
        "• Beat eggs\n• Add chopped leftovers\n• Cook 5–7 min\n• Serve with salad/bread",
        "• Eier verquirlen\n• Reste klein schneiden und dazu\n• 5–7 Min garen\n• Mit Salat/Brot servieren",
        "• Sbatti uova\n• Aggiungi avanzi tritati\n• Cuoci 5–7 min\n• Servi con insalata/pane"
      ),
      T("Use items that expire first.", "Erst verbrauchen, was bald abläuft.", "Usa prima ciò che scade.")
    );
  }

  if (hasRice && (hasEgg || hasChicken || hasVeg)) {
    add(
      T("3) Fried Rice Bowl", "3) Bratreis Bowl", "3) Riso saltato"),
      T("One-pan meal: fast and filling.", "One-pan: schnell und sättigend.", "Piatto unico: veloce e saziante."),
      T(
        "• Warm rice\n• Add veggies + protein\n• Season + stir-fry 3–5 min",
        "• Reis erwärmen\n• Gemüse + Protein dazu\n• Würzen + 3–5 Min braten",
        "• Scalda riso\n• Aggiungi verdure + proteine\n• Condisci + salta 3–5 min"
      ),
      T("Frozen veggies = cheap + no waste.", "TK-Gemüse = günstig + kein Verderb.", "Verdure surgelate = economiche + niente sprechi.")
    );
  }

  if (hasTuna && (hasOnion || hasTomato)) {
    add(
      T("4) Tuna Salad Bowl", "4) Thunfisch-Salat Bowl", "4) Insalata di tonno"),
      T("High-protein and super quick.", "Proteinreich und super schnell.", "Ricca di proteine e super veloce."),
      T(
        "• Mix tuna + chopped veggies\n• Add oil/lemon\n• Salt/pepper\n• Serve with bread or alone",
        "• Thunfisch + Gemüse mischen\n• Öl/Zitrone\n• Salz/Pfeffer\n• Mit Brot oder pur",
        "• Mescola tonno + verdure\n• Olio/limone\n• Sale/pepe\n• Con pane o da sola"
      ),
      T("Add beans if you have them.", "Mit Bohnen noch sättigender.", "Aggiungi legumi se li hai.")
    );
  }

  if (recipes.length === 0) {
    return T(
      "I couldn’t match a specific recipe yet. Add basics (eggs/rice/pasta/tomato) for better suggestions.",
      "Noch kein klares Rezept-Match. Füge Basics hinzu (Eier/Reis/Pasta/Tomate).",
      "Non trovo una ricetta precisa. Aggiungi basi (uova/riso/pasta/pomodoro)."
    );
  }

  return recipes.slice(0, 3).map(r =>
    `${r.title}\nWhy: ${r.why}\nSteps:\n${r.steps}\nTip: ${r.tip}`
  ).join("\n\n---\n\n");
}