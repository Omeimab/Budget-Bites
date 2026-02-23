import { translations, detectDefaultLang, setLang } from "./i18n.js";
import { initFirebase, signInAndSync, saveData } from "./firebase.js";
import { setHeaderText, setOnlineState, openModal, closeModal, renderUI, showToast } from "./ui.js";
import { getSmartRecipe } from "./ai_mock.js";
import { getSmartSuggestions } from "./ai_mock.js";

let activeTab = "inventory";
let userId = null;

let inventory = [];
let shoppingList = [];
let historicalWaste = 0;

let monthlyBudget = 0;
let monthSpent = 0;

// NEW: track purchases for “what did I spend on most?”
let monthPurchases = [];

let lang = detectDefaultLang();
let t = translations[lang];

const { db, auth } = initFirebase();

// initial header + language dropdown
setHeaderText(t);
setupLanguageDropdown();

// navigation buttons
document.getElementById("nav-inventory").onclick = () => switchTab("inventory");
document.getElementById("nav-shopping").onclick = () => switchTab("shopping");
document.getElementById("nav-planner").onclick = () => switchTab("planner");
document.getElementById("nav-reports").onclick = () => switchTab("reports");

// modal buttons
document.getElementById("btn-cancel").onclick = closeModal;

document.getElementById("item-form").onsubmit = async (e) => {
  e.preventDefault();

  const type = document.getElementById("list-type").value;
  const id = document.getElementById("item-id").value || crypto.randomUUID();

  const name = document.getElementById("item-name").value.trim();
  const quantity = parseInt(document.getElementById("item-quantity").value || "1", 10);
  const unit = document.getElementById("item-unit").value.trim();

  // total price (not per unit)
  const price = parseFloat(document.getElementById("inp-price")?.value || "0");
  const safePrice = Number.isFinite(price) && price >= 0 ? price : 0;

  if (!name) return;

  if (type === "inventory") {
    const days = parseInt(document.getElementById("item-shelf-life").value || "", 10);
    let expiry = "";

    if (Number.isFinite(days) && days > 0) {
      const d = new Date();
      d.setDate(d.getDate() + days);
      expiry = d.toISOString().split("T")[0];
    }

    upsert(inventory, { id, name, quantity, unit, expiry, price: safePrice });
  } else {
    upsert(shoppingList, { id, name, quantity, unit, price: safePrice });
  }

  await persist();
  closeModal();
  draw();
};

function upsert(arr, item) {
  const idx = arr.findIndex(x => x.id === item.id);
  if (idx >= 0) arr[idx] = { ...arr[idx], ...item };
  else arr.push(item);
}

function switchTab(tab) {
  activeTab = tab;
  draw();
}

function draw() {
  renderUI({
    t,
    lang,
    activeTab,
    inventory,
    shoppingList,
    historicalWaste,
    monthlyBudget,
    monthSpent,
    monthPurchases,
    onAdd: (type) => openModal(t, type, null),
    onMove: moveItem,
    onDelete: deleteItem,
    onEmpty: emptyItem,
    onSuggest: showSuggestions,
    onRecipe: showRecipe,
    onSaveBudget: saveBudget,
    onResetSpent: resetSpent,
    onClearAllInventory: clearAllInventory,
    onClearAllShopping: clearAllShopping,
    onResetAll: resetAll
  });
}

function processWaste() {
  const now = new Date();
  const before = inventory.length;

  inventory = inventory.filter(i => {
    if (i.expiry && i.expiry !== "PENDING" && new Date(i.expiry) < now) {
      historicalWaste++;
      return false;
    }
    return true;
  });

  if (inventory.length !== before) persist();
}

async function persist() {
  await saveData({
    db,
    userId,
    inventory,
    shoppingList,
    historicalWaste,
    monthlyBudget,
    monthSpent,
    monthPurchases
  });
}

async function saveBudget(val) {
  const n = Number(val || 0);
  monthlyBudget = Number.isFinite(n) && n >= 0 ? n : 0;
  await persist();
  showToast("✅ Budget saved", "success");
  draw();
}

async function resetSpent() {
  if (!confirm("Reset monthly spending to €0.00?")) return;
  monthSpent = 0;
  monthPurchases = [];
  await persist();
  showToast("Monthly spending reset", "warn");
  draw();
}

async function resetAll() {
  if (!confirm("Reset ALL data? This will clear inventory, shopping list, budget and stats.")) return;

  inventory = [];
  shoppingList = [];
  historicalWaste = 0;
  monthlyBudget = 0;
  monthSpent = 0;
  monthPurchases = [];

  await persist();
  showToast("All data reset", "warn");
  draw();
}

// Shopping → Inventory (BOUGHT) + spending
async function moveItem(id, from) {
  if (from === "shopping") {
    const i = shoppingList.find(x => x.id === id);
    if (!i) return;

    shoppingList = shoppingList.filter(x => x.id !== id);

    // add to inventory
    const moved = { ...i, expiry: "PENDING" };
    inventory.push(moved);

    // add spending = total price
    const price = Number(i.price || 0);
    const cost = Number.isFinite(price) ? price : 0;

    monthSpent = Number(monthSpent || 0) + cost;
    monthPurchases.push({
      id: crypto.randomUUID(),
      name: i.name,
      cost,
      ts: Date.now()
    });

    await persist();
    showToast("Added to inventory + tracked spending", "success");
    draw();
    return;
  }

  // inventory → shopping (need again)
  const i = inventory.find(x => x.id === id);
  if (!i) return;

  inventory = inventory.filter(x => x.id !== id);
  shoppingList.push({
    id: i.id,
    name: i.name,
    quantity: i.quantity,
    unit: i.unit,
    price: Number(i.price || 0)
  });

  await persist();
  draw();
}

async function emptyItem(id) {
  const i = inventory.find(x => x.id === id);
  if (!i) return;

  if (!confirm(`Mark "${i.name}" as empty? (It will be removed)`)) return;

  inventory = inventory.filter(x => x.id !== id);
  historicalWaste += 1;

  await persist();
  showToast("Item removed", "warn");
  draw();
}

async function deleteItem(type, id) {
  if (!confirm("Delete this item?")) return;

  if (type === "inventory") inventory = inventory.filter(i => i.id !== id);
  else shoppingList = shoppingList.filter(i => i.id !== id);

  await persist();
  showToast("Removed", "warn");
  draw();
}

async function clearAllInventory() {
  if (!confirm("Are you sure you want to clear ALL inventory items?")) return;
  inventory = [];
  await persist();
  showToast("Inventory cleared", "warn");
  draw();
}

async function clearAllShopping() {
  if (!confirm("Are you sure you want to clear ALL shopping list items?")) return;
  shoppingList = [];
  await persist();
  showToast("Shopping list cleared", "warn");
  draw();
}

function showSuggestions() {
  const out = document.getElementById("ai-out");
  const names = shoppingList.map(i => i.name);
  out.innerText = getSmartSuggestions(lang, names);
}

function showRecipe() {
  const out = document.getElementById("ai-recipe-out");
  const names = inventory.map(i => i.name);
  out.innerText = getSmartRecipe(lang, names);
}

// Auth + sync
signInAndSync({
  db, auth,
  onReady: (uid) => {
    userId = uid;
    setOnlineState(t);
  },
  onData: (d) => {
    inventory = d.inventory || [];
    shoppingList = d.shoppingList || [];
    historicalWaste = d.historicalWaste || 0;

    monthlyBudget = Number(d.monthlyBudget || 0);
    monthSpent = Number(d.monthSpent || 0);
    monthPurchases = Array.isArray(d.monthPurchases) ? d.monthPurchases : [];

    processWaste();
    draw();
  }
});

function setupLanguageDropdown() {
  const sel = document.getElementById("lang-select");
  if (!sel) return;
  sel.value = lang;

  sel.onchange = () => {
    lang = sel.value;
    setLang(lang);
    t = translations[lang];
    setHeaderText(t);
    setOnlineState(t);
    draw();
  };
}