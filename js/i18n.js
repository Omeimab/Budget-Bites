export const I18N = {
  en: {
    subtitle: "Smarter groceries, less waste, better budget.",
    inventory: "Inventory",
    shopping: "Shopping List",
    planner: "Meal Planner",
    reports: "Reports",
    initializing: "Initializing…",
    ready: "Ready • autosaved locally",
    loading: "Loading…",

    addInventory: "Add inventory item",
    addShopping: "Add shopping item",
    emptyInventory: "No items yet. Add your first inventory item.",
    emptyShopping: "No items yet. Add your first shopping item.",

    modalAddInv: "Add to Inventory",
    modalEditInv: "Edit Inventory Item",
    modalAddShop: "Add to Shopping List",
    modalEditShop: "Edit Shopping Item",

    name: "Name",
    category: "Category",
    qty: "Quantity",
    unit: "Unit",
    totalPrice: "Total price (€)",
    priceHint: "Tip: enter the total price for this item (not per unit).",
    shelfLife: "Expiry (days)",
    expiryHint: "We will calculate an expiry date from today.",
    cancel: "Cancel",
    save: "Save",

    bought: "Bought",
    notBought: "Not bought",
    delete: "Delete",
    edit: "Edit",

    tripBudget: "Shopping trip budget (€)",
    monthlyBudget: "Monthly budget (€)",
    plannedSpend: "Planned spend",
    spentThisMonth: "Spent this month",
    remaining: "Remaining",
    byCategory: "By category",

    expires: "Expires",
    expired: "Expired",
    daysLeft: "days left",

    plannerComing: "Planner is a placeholder for now (we can add AI recipes next).",
  },

  de: {
    subtitle: "Clever einkaufen, weniger Verschwendung, besseres Budget.",
    inventory: "Vorrat",
    shopping: "Einkaufsliste",
    planner: "Essensplan",
    reports: "Berichte",
    initializing: "Initialisiere…",
    ready: "Bereit • lokal automatisch gespeichert",
    loading: "Lädt…",

    addInventory: "Vorratsartikel hinzufügen",
    addShopping: "Einkaufsartikel hinzufügen",
    emptyInventory: "Noch keine Artikel. Füge deinen ersten Vorratsartikel hinzu.",
    emptyShopping: "Noch keine Artikel. Füge deinen ersten Einkaufsartikel hinzu.",

    modalAddInv: "Zum Vorrat hinzufügen",
    modalEditInv: "Vorratsartikel bearbeiten",
    modalAddShop: "Zur Einkaufsliste hinzufügen",
    modalEditShop: "Einkaufsartikel bearbeiten",

    name: "Name",
    category: "Kategorie",
    qty: "Menge",
    unit: "Einheit",
    totalPrice: "Gesamtpreis (€)",
    priceHint: "Tipp: Gesamtpreis für diesen Artikel eingeben (nicht pro Stück).",
    shelfLife: "Haltbarkeit (Tage)",
    expiryHint: "Wir berechnen ein Ablaufdatum ab heute.",
    cancel: "Abbrechen",
    save: "Speichern",

    bought: "Gekauft",
    notBought: "Nicht gekauft",
    delete: "Löschen",
    edit: "Bearbeiten",

    tripBudget: "Einkaufs-Budget (€)",
    monthlyBudget: "Monatsbudget (€)",
    plannedSpend: "Geplante Ausgaben",
    spentThisMonth: "Ausgaben diesen Monat",
    remaining: "Übrig",
    byCategory: "Nach Kategorie",

    expires: "Ablauf",
    expired: "Abgelaufen",
    daysLeft: "Tage übrig",

    plannerComing: "Essensplan ist vorerst ein Platzhalter (AI Rezepte können wir als Nächstes hinzufügen).",
  },

  it: {
    subtitle: "Spesa più smart, meno sprechi, budget migliore.",
    inventory: "Dispensa",
    shopping: "Lista Spesa",
    planner: "Piano Pasti",
    reports: "Report",
    initializing: "Inizializzazione…",
    ready: "Pronto • salvato in locale",
    loading: "Caricamento…",

    addInventory: "Aggiungi in dispensa",
    addShopping: "Aggiungi in lista spesa",
    emptyInventory: "Nessun elemento. Aggiungi il primo.",
    emptyShopping: "Nessun elemento. Aggiungi il primo.",

    modalAddInv: "Aggiungi in Dispensa",
    modalEditInv: "Modifica Dispensa",
    modalAddShop: "Aggiungi alla Lista Spesa",
    modalEditShop: "Modifica Lista Spesa",

    name: "Nome",
    category: "Categoria",
    qty: "Quantità",
    unit: "Unità",
    totalPrice: "Prezzo totale (€)",
    priceHint: "Tip: inserisci il prezzo totale (non per unità).",
    shelfLife: "Scadenza (giorni)",
    expiryHint: "Calcoliamo una data di scadenza da oggi.",
    cancel: "Annulla",
    save: "Salva",

    bought: "Comprato",
    notBought: "Non comprato",
    delete: "Elimina",
    edit: "Modifica",

    tripBudget: "Budget spesa (€)",
    monthlyBudget: "Budget mensile (€)",
    plannedSpend: "Spesa prevista",
    spentThisMonth: "Speso questo mese",
    remaining: "Rimanente",
    byCategory: "Per categoria",

    expires: "Scade",
    expired: "Scaduto",
    daysLeft: "giorni rimasti",

    plannerComing: "Il planner è un placeholder (poi aggiungiamo ricette AI).",
  }
};

export function t(lang, key) {
  return (I18N[lang] && I18N[lang][key]) ? I18N[lang][key] : I18N.en[key] ?? key;
}