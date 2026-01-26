export const translations = {
  it: {
    subtitle: "Gestione Alimentare Mensile & Zero Sprechi",
    connecting: "Sincronizzazione Cloud...",
    active: "Sistema Online",
    loading: "Caricamento dati...",
    nav_inv: "Dispensa",
    nav_shop: "Lista Spesa",
    nav_plan: "Meal Planner",
    nav_dash: "Dashboard",
    add: "Aggiungi",
    edit: "Modifica",
    name: "Nome Prodotto",
    qty: "Quantità",
    unit: "Unità",
    expiry_logic: "Scadenza (Giorni)",
    expiry_placeholder: "Giorni freschezza",
    save: "Salva",
    cancel: "Annulla",
    empty_inv: "Dispensa vuota.",
    empty_shop: "Nulla da comprare.",
    sugg_btn: "Suggerimenti",
    sugg_info: "Suggerimenti intelligenti basati sulla tua lista.",
    recipe_btn: "Genera Ricetta",
    recipe_info: "Ricetta basata su quello che hai.",
    stat_waste: "Sprechi Totali",
    stat_stock: "Scorte Attive",
    move_need: "Finita",
    move_bought: "Comprato",
    delete_confirm: "Eliminare elemento?"
  },
  de: {
    subtitle: "Monatliche Lebensmittelverwaltung & Zero Waste",
    connecting: "Cloud-Synchronisation...",
    active: "System Online",
    loading: "Daten werden geladen...",
    nav_inv: "Vorrat",
    nav_shop: "Einkaufsliste",
    nav_plan: "Meal Planner",
    nav_dash: "Dashboard",
    add: "Hinzufügen",
    edit: "Bearbeiten",
    name: "Produktname",
    qty: "Menge",
    unit: "Einheit",
    expiry_logic: "Haltbarkeit (Tage)",
    expiry_placeholder: "Haltbarkeit",
    save: "Speichern",
    cancel: "Abbrechen",
    empty_inv: "Vorrat leer.",
    empty_shop: "Nichts zu kaufen.",
    sugg_btn: "Vorschläge",
    sugg_info: "Smarte Vorschläge basierend auf deiner Liste.",
    recipe_btn: "Rezept generieren",
    recipe_info: "Rezept basierend auf Vorräten.",
    stat_waste: "Gesamtabfall",
    stat_stock: "Aktiver Vorrat",
    move_need: "Leer",
    move_bought: "Gekauft",
    delete_confirm: "Löschen?"
  },
  en: {
    subtitle: "Monthly Food Management & Zero Waste",
    connecting: "Cloud Syncing...",
    active: "System Online",
    loading: "Loading data...",
    nav_inv: "Inventory",
    nav_shop: "Shopping List",
    nav_plan: "Meal Planner",
    nav_dash: "Dashboard",
    add: "Add",
    edit: "Edit",
    name: "Product Name",
    qty: "Quantity",
    unit: "Unit",
    expiry_logic: "Shelf Life (Days)",
    expiry_placeholder: "Freshness days",
    save: "Save",
    cancel: "Cancel",
    empty_inv: "Inventory empty.",
    empty_shop: "Nothing to buy.",
    sugg_btn: "Suggestions",
    sugg_info: "Smart suggestions based on your list.",
    recipe_btn: "Generate Recipe",
    recipe_info: "Recipe based on what you have.",
    stat_waste: "Total Waste",
    stat_stock: "Active Stock",
    move_need: "Empty",
    move_bought: "Bought",
    delete_confirm: "Delete?"
  }
};

export function detectDefaultLang() {
  const saved = localStorage.getItem("bb_lang");
  if (saved && translations[saved]) return saved;

  const nav = navigator.language.split("-")[0];
  return translations[nav] ? nav : "en";
}

export function setLang(lang) {
  if (!translations[lang]) return;
  localStorage.setItem("bb_lang", lang);
}
