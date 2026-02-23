const KEY = "budgetbites_v1";

export function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load state", e);
    return null;
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    console.error("Failed to save state", e);
    return false;
  }
}

export function defaultState() {
  return {
    version: 1,
    lang: "en",
    activeTab: "inventory",
    settings: {
      monthlyBudget: 200,
      shoppingTripBudget: 40
    },
    inventory: [],
    shopping: []
  };
}
