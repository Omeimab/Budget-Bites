// ------------------------------
// SMART SHOPPING SUGGESTIONS
// ------------------------------

export function getSmartSuggestions(lang, shoppingNames = []) {
  const T = (en, de, it) => (lang === "de" ? de : lang === "it" ? it : en);

  const items = (shoppingNames || [])
    .map(x => (x || "").toLowerCase())
    .join(" ");

  const suggestions = [];

  if (items.includes("pasta") || items.includes("rice") || items.includes("reis")) {
    suggestions.push(
      T(
        "Add: eggs, frozen veggies, and canned tomatoes for quick meals.",
        "Tipp: Eier, TK-Gemüse und Dosentomaten dazu — super für schnelle Gerichte.",
        "Aggiungi: uova, verdure surgelate e pomodori in scatola per pasti veloci."
      )
    );
  }

  if (items.includes("chicken") || items.includes("pollo")) {
    suggestions.push(
      T(
        "Consider adding rice or pasta to complete your meals.",
        "Vielleicht Reis oder Pasta ergänzen für vollständige Mahlzeiten.",
        "Aggiungi riso o pasta per un pasto completo."
      )
    );
  }

  if (suggestions.length === 0) {
    suggestions.push(
      T(
        "Budget staples: eggs, rice, pasta, canned tomatoes, onions, frozen vegetables.",
        "Budget-Basics: Eier, Reis, Pasta, Dosentomaten, Zwiebeln, TK-Gemüse.",
        "Basi economiche: uova, riso, pasta, pomodori in scatola, cipolle, verdure surgelate."
      )
    );
  }

  return suggestions
    .slice(0, 3)
    .map((s, i) => ${i + 1}) ${s})
    .join("\n");
}

// ------------------------------
// SMART RECIPE ENGINE
// ------------------------------

export function getSmartRecipe(lang, inventoryNames = []) {
  const T = (en, de, it) => (lang === "de" ? de : lang === "it" ? it : en);

  const inv = (inventoryNames || [])
    .map(x => (x || "").toLowerCase())
    .join(" ");

  const has = (...words) => words.some(w => inv.includes(w));

  const pool = [];

  const add = (title, why, steps, tip) => {
    pool.push({ title, why, steps, tip });
  };

  // Ingredients detection
  const hasEgg = has("egg", "eier", "uova");
  const hasChicken = has("chicken", "hähn", "pollo");
  const hasTuna = has("tuna", "thun", "tonno");
  const hasBeans = has("beans", "bohnen", "ceci", "fagioli", "lentil", "linsen", "lenticchie");
  const hasPasta = has("pasta", "spaghetti", "penne");
  const hasRice = has("rice", "reis", "riso");
  const hasBread = has("bread", "brot", "pane", "toast", "wrap", "tortilla");
  const hasTomato = has("tomato", "pomodoro", "tomate");
  const hasOnion = has("onion", "zwiebel", "cipolla");
  const hasVeg = has("broccoli", "spinach", "spinat", "zucchini", "paprika", "carrot", "mushroom", "salad", "gurke");
  const hasCheese = has("cheese", "käse", "formaggio", "mozzarella", "feta", "parmesan");
  const hasQuark = has("quark", "skyr");

  // ------------------------------
  // RECIPES
  // ------------------------------

  if (hasPasta && hasTomato) {
    add(
      T("Tomato Pasta (10 min)", "Tomatenpasta (10 Min)", "Pasta al pomodoro (10 min)"),
      T(
        "Fast, cheap, and always works with pantry ingredients.",
        "Schnell, günstig und funktioniert mit Vorräten.",
        "Veloce ed economica con ingredienti base."
      ),
      T(
        "• Cook pasta\n• Heat tomato sauce\n• Mix + season\n• Optional: add tuna or cheese",
        "• Pasta kochen\n• Tomatensauce erhitzen\n• Mischen + würzen\n• Optional: Thunfisch/Käse",
        "• Cuoci la pasta\n• Scalda il sugo\n• Mescola + condisci\n• Opzionale: tonno/formaggio"
      ),
      T(
        "Budget tip: store-brand tomato sauce works perfectly.",
        "Budget-Tipp: Eigenmarken-Sauce reicht völlig.",
        "Consiglio budget: va benissimo la salsa economica."
      )
    );
  }

  if (hasEgg) {
    add(
      T("Leftover Omelette", "Rest-Omelette", "Frittata svuota-frigo"),
      T(
        "Perfect to use vegetables before they expire.",
        "Perfekt um Gemüse rechtzeitig zu verbrauchen.",
        "Perfetta per usare le verdure prima che scadano."
      ),
      T(
        "• Beat eggs\n• Add chopped leftovers\n• Cook 5–7 min\n• Serve with bread",
        "• Eier verquirlen\n• Reste dazu\n• 5–7 Min braten\n• Mit Brot servieren",
        "• Sbatti le uova\n• Aggiungi avanzi\n• Cuoci 5–7 min\n• Con pane"
      ),
      T(
        "Zero-waste: use what expires first.",
        "Zero-Waste: Erst verbrauchen, was bald abläuft.",
        "Anti-spreco: usa prima ciò che scade."
      )
    );
  }

  if (hasRice && (hasChicken || hasEgg || hasVeg)) {
    add(
      T("Fried Rice Bowl", "Bratreis Bowl", "Riso saltato"),
      T(
        "Complete meal in under 15 minutes.",
        "Komplettes Gericht in unter 15 Minuten.",
        "Pasto completo in meno di 15 minuti."
      ),
      T(
        "• Warm rice\n• Add protein + veggies\n• Stir-fry 5 min\n• Season",
        "• Reis erwärmen\n• Protein + Gemüse dazu\n• 5 Min anbraten\n• Würzen",
        "• Scalda il riso\n• Aggiungi proteine + verdure\n• Salta 5 min\n• Condisci"
      ),
      T(
        "Frozen veggies save money and time.",
        "TK-Gemüse spart Zeit und Geld.",
        "Verdure surgelate = economiche e veloci."
      )
    );
  }

  if (hasChicken && hasVeg) {
    add(
      T("Chicken Veggie Pan", "Hähnchen-Gemüse-Pfanne", "Padellata pollo e verdure"),
      T(
        "One-pan, high-protein dinner.",
        "Ein-Pfannen-Protein-Gericht.",
        "Cena proteica in una sola padella."
      ),
      T(
        "• Cut chicken + veggies\n• Fry chicken 5–6 min\n• Add veggies 5 min\n• Season",
        "• Hähnchen + Gemüse schneiden\n• Hähnchen 5–6 Min braten\n• Gemüse 5 Min dazu\n• Würzen",
        "• Taglia pollo + verdure\n• Rosola 5–6 min\n• Aggiungi verdure 5 min\n• Condisci"
      ),
      T(
        "Add yogurt or quark for creaminess.",
        "Mit Quark wird es cremiger.",
        "Con quark diventa più cremoso."
      )
    );
  }

  if (hasBeans && hasRice) {
    add(
      T("Beans & Rice Bowl", "Bohnen-Reis-Bowl", "Bowl riso e legumi"),
      T(
        "Cheap, filling and meal-prep friendly.",
        "Günstig, sättigend und ideal zum Vorbereiten.",
        "Economico, saziante e perfetto per meal prep."
      ),
      T(
        "• Warm rice\n• Warm beans\n• Add onion/tomato\n• Season + lemon",
        "• Reis erwärmen\n• Bohnen erwärmen\n• Zwiebel/Tomate dazu\n• Würzen + Zitrone",
        "• Scalda il riso\n• Scalda i legumi\n• Aggiungi cipolla/pomodoro\n• Condisci + limone"
      ),
      T(
        "High protein without meat.",
        "Viel Protein ohne Fleisch.",
        "Proteico anche senza carne."
      )
    );
  }

  if (hasBread && hasTuna) {
    add(
      T("Tuna Toast", "Thunfisch-Toast", "Toast al tonno"),
      T(
        "Fast protein snack.",
        "Schneller Protein-Snack.",
        "Snack proteico veloce."
      ),
      T(
        "• Mix tuna + lemon\n• Add onion/tomato\n• Put on toast\n• Optional cheese",
        "• Thunfisch + Zitrone mischen\n• Zwiebel/Tomate dazu\n• Auf Toast\n• Optional Käse",
        "• Mescola tonno + limone\n• Aggiungi cipolla/pomodoro\n• Su toast\n• Formaggio opzionale"
      ),
      T(
        "Better than takeout.",
        "Besser als Lieferdienst.",
        "Meglio del takeout."
      )
    );
  }

  if (hasQuark && hasVeg) {
    add(
      T("Quark Veggie Bowl", "Quark-Gemüse-Bowl", "Bowl di quark e verdure"),
      T(
        "High-protein, low-calorie option.",
        "Proteinreich und leicht.",
        "Proteica e leggera."
      ),
      T(
        "• Put quark in bowl\n• Add chopped veggies\n• Salt + pepper\n• Optional herbs",
        "• Quark in Schüssel\n• Gemüse klein schneiden\n• Salz + Pfeffer\n• Optional Kräuter",
        "• Metti quark in una ciotola\n• Aggiungi verdure\n• Sale + pepe\n• Erbe opzionali"
      ),
      T(
        "Great as dip too.",
        "Auch gut als Dip.",
        "Ottimo anche come salsa."
      )
    );
  }

  if (!inventoryNames || inventoryNames.length === 0) {
    return T(
      "Add items to your Inventory first.",
      "Füge zuerst Produkte zum Vorrat hinzu.",
      "Aggiungi prima prodotti alla dispensa."
    );
  }

  if (pool.length === 0) {
    return T(
      "No matching recipe found yet. Try adding rice, pasta, eggs or tomatoes.",
      "Kein passendes Rezept gefunden. Füge Reis, Pasta, Eier oder Tomaten hinzu.",
      "Nessuna ricetta trovata. Aggiungi riso, pasta, uova o pomodori."
    );
  }

  const labels = {
    why: T("Why", "Warum", "Perché"),
    steps: T("Steps", "Schritte", "Passi"),
    tip: T("Tip", "Tipp", "Consiglio")
  };

  return pool.slice(0, 3).map(r =>
    ${r.title}\n${labels.why}: ${r.why}\n${labels.steps}:\n${r.steps}\n${labels.tip}: ${r.tip}
  ).join("\n\n---\n\n");
}