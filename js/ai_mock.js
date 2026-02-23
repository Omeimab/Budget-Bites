export function getSmartSuggestions(lang, shoppingNames = []) {
  const T = (en, de, it) => (lang === "de" ? de : lang === "it" ? it : en);

  const items = (shoppingNames || []).map(x => (x || "").toLowerCase()).join(" ");
  const suggestions = [];

  if (items.includes("pasta") || items.includes("spaghetti") || items.includes("penne")) {
    suggestions.push(
      T(
        "If you're buying pasta, add canned tomatoes + garlic + onions for 3 quick meals.",
        "Wenn du Pasta kaufst: Dosentomaten + Knoblauch + Zwiebeln = 3 schnelle Gerichte.",
        "Se compri pasta: pomodori in scatola + aglio + cipolla = 3 pasti veloci."
      )
    );
  }

  if (items.includes("rice") || items.includes("reis") || items.includes("riso")) {
    suggestions.push(
      T(
        "Rice tip: add frozen veggies + eggs for fast bowls.",
        "Reis-Tipp: TK-Gemüse + Eier für schnelle Bowls.",
        "Consiglio riso: verdure surgelate + uova per bowl veloci."
      )
    );
  }

  if (items.includes("milk") || items.includes("milch") || items.includes("latte")) {
    suggestions.push(
      T(
        "Dairy reminder: check fridge first to avoid double buying.",
        "Milchprodukte: erst Kühlschrank checken, um Doppelkäufe zu vermeiden.",
        "Latticini: controlla prima il frigo per evitare doppioni."
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

  return suggestions.slice(0, 3).map((s, i) => `${i + 1}) ${s}`).join("\n");
}

export function getSmartRecipe(lang, inventoryNames = []) {
  const inv = (inventoryNames || []).map(x => (x || "").toLowerCase());
  const T = (en, de, it) => (lang === "de" ? de : lang === "it" ? it : en);

  if (!inventoryNames || inventoryNames.length === 0) {
    return T(
      "Add some items to your Inventory first, then I’ll suggest recipes.",
      "Füge zuerst ein paar Produkte zum Vorrat hinzu, dann schlage ich Rezepte vor.",
      "Aggiungi prima prodotti nella dispensa, poi ti suggerisco ricette."
    );
  }

  const has = (...words) => words.some(w => inv.some(x => x.includes(w)));

  const pool = [];

  const add = (title, why, steps, tip) => {
    pool.push({ title, why, steps, tip });
  };

  const hasEgg = has("egg", "eier", "uova");
  const hasChicken = has("chicken", "pollo", "Hähnchen");
  const hasTuna = has("tuna", "tonno", "thun");
  const hasPasta = has("pasta", "spaghetti", "penne");
  const hasRice = has("rice", "reis", "riso");
  const hasTomato = has("tomato", "tomate", "pomodoro");
  const hasOnion = has("onion", "zwiebel", "cipolla");
  const hasBread = has("bread", "brot", "pane", "toast", "wrap", "tortilla");
  const hasVeg = has("broccoli", "spinach", "spinat", "zucchini", "paprika", "carrot", "mushroom", "salad", "gurke");

  // 1) Tomato pasta
  if (hasPasta && (hasTomato || hasOnion)) {
    add(
      T("1) Tomato Pasta (10 min)", "1) Tomatenpasta (10 Min)", "1) Pasta al pomodoro (10 min)"),
      T(
        "Fast, cheap, and perfect for pantry ingredients.",
        "Schnell, günstig und perfekt für Vorräte.",
        "Veloce, economica e perfetta con ingredienti base."
      ),
      T(
        "• Cook pasta\n• Heat tomato/onion/garlic\n• Mix + season\n• Optional: tuna/cheese",
        "• Pasta kochen\n• Tomate/Zwiebel/Knoblauch erhitzen\n• Mischen + würzen\n• Optional: Thunfisch/Käse",
        "• Cuoci la pasta\n• Scalda pomodoro/cipolla/aglio\n• Mescola + condisci\n• Opzionale: tonno/formaggio"
      ),
      T(
        "Tip: use store-brand tomato sauce + dried herbs.",
        "Tipp: Eigenmarke-Tomatensauce + getrocknete Kräuter.",
        "Consiglio: salsa economica + erbe secche."
      )
    );
  }

  // 2) Omelette / frittata
  if (hasEgg) {
    add(
      T("2) Leftover Omelette / Frittata", "2) Rest-Omelette / Frittata", "2) Frittata svuota-frigo"),
      T(
        "Great to use small leftovers and avoid waste.",
        "Perfekt, um kleine Reste zu verwerten.",
        "Perfetta per usare piccoli avanzi."
      ),
      T(
        "• Beat eggs\n• Add leftovers\n• Cook 5–7 min\n• Serve with salad/bread",
        "• Eier verquirlen\n• Reste dazu\n• 5–7 Min garen\n• Mit Salat/Brot servieren",
        "• Sbatti le uova\n• Aggiungi avanzi\n• Cuoci 5–7 min\n• Servi con insalata/pane"
      ),
      T(
        "Tip: use items that expire first.",
        "Tipp: zuerst verbrauchen, was bald abläuft.",
        "Consiglio: usa prima ciò che scade."
      )
    );
  }

  // 3) Fried rice style
  if (hasRice && (hasEgg || hasChicken || hasVeg)) {
    add(
      T("3) Fried Rice Bowl", "3) Bratreis-Bowl", "3) Riso saltato"),
      T(
        "Complete meal in one pan.",
        "Komplettes Gericht aus einer Pfanne.",
        "Pasto completo in una padella."
      ),
      T(
        "• Warm rice in pan\n• Add veg + protein\n• Stir-fry 3–5 min\n• Season",
        "• Reis in Pfanne erwärmen\n• Gemüse + Protein dazu\n• 3–5 Min anbraten\n• Würzen",
        "• Scalda riso\n• Aggiungi verdure + proteine\n• Salta 3–5 min\n• Condisci"
      ),
      T(
        "Tip: frozen veggies = cheap + no waste.",
        "Tipp: TK-Gemüse = günstig + kein Verderb.",
        "Consiglio: surgelati = economici + zero sprechi."
      )
    );
  }

  // 4) Tuna toast/wrap
  if (hasTuna && hasBread) {
    add(
      T("4) Tuna Toast / Wrap", "4) Thunfisch-Toast / Wrap", "4) Toast/Wrap al tonno"),
      T(
        "Quick protein snack or lunch.",
        "Schneller Protein-Snack oder Lunch.",
        "Snack o pranzo proteico veloce."
      ),
      T(
        "• Mix tuna + spices\n• Add veggies if you have\n• Toast or wrap",
        "• Thunfisch + Gewürze mischen\n• Gemüse dazu (wenn da)\n• Toasten oder wrappen",
        "• Mescola tonno + spezie\n• Aggiungi verdure (se hai)\n• Tosta o wrap"
      ),
      T(
        "Tip: add onions or salad for crunch.",
        "Tipp: Zwiebel oder Salat für Crunch.",
        "Consiglio: cipolla o insalata per croccantezza."
      )
    );
  }

  // fallback
  if (pool.length === 0) {
    return T(
      "I couldn’t match a specific recipe yet. Add staples (rice/pasta/eggs/tomato) for better suggestions.",
      "Ich konnte noch kein konkretes Rezept matchen. Füge Basics hinzu (Reis/Pasta/Eier/Tomate).",
      "Non riesco ancora a trovare una ricetta specifica. Aggiungi basi (riso/pasta/uova/pomodoro)."
    );
  }

  return pool.slice(0, 3).map(r => 
    `${r.title}\nWhy: ${r.why}\nSteps:\n${r.steps}${r.tip ? `\nTip: ${r.tip}` : ""}`
  ).join("\n\n---\n\n");
}