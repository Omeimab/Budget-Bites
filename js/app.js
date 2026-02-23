import { translations, detectDefaultLang, setLang } from "./i18n.js";
import { initFirebase, signInAndSync, saveData } from "./firebase.js";
import { setHeaderText, setOnlineState, openModal, closeModal, renderUI } from "./ui.js";
import { getSmartRecipe } from "./ai_mock.js";

let activeTab = "inventory";
let userId = null;

let inventory = [];
let shoppingList = [];
let historicalWaste = 0;

//  NEW: monthly budget tracking
let monthlyBudget = 0;
let monthSpent = 0;

let lang = detectDefaultLang();
let t = translations[lang];

const { db, auth } = initFirebase();

// initial header + language dropdown
setHeaderText(t);
setupLanguageDropdown();

// navigation buttons
document.getElementById("nav-inventory").onclick = () => switchTab("inventory");
document.…
import { translations, detectDefaultLang, setLang } from "./i18n.js";
import { initFirebase, signInAndSync, saveData } from "./firebase.js";
import { setHeaderText, setOnlineState, openModal, closeModal, renderUI } from "./ui.js";
import { getSmartRecipe } from "./ai_mock.js";

// ----------------------------
// State
// ----------------------------
let activeTab = "inventory";
let userId = null;

let inventory = [];
let shoppingList = [];
let historicalWaste = 0;

let monthlyBudget = 0;
let monthSpent = 0;

let lang = detectDefaultLang();
let t = translations[lang];

const { db, auth } = initFirebase();

// ----------------------------
// Helpers (toast)
// ----------------------------
function toast(message, type = "success") {
  const root = document.getElementById("toast-root");
  if (!root) return;

  const el = document.createElement("div");
  const base =
    "px-4 py-3 rounded-xl shadow-lg text-sm font-bold border flex items-center gap-2";
  const styles =
    type === "error"
      ? "bg-rose-50 border-rose-200 text-rose-800"
      : type === "warn"
      ? "bg-amber-50 border-amber-200 text-amber-800"
      : "bg-emerald-50 border-emerald-200 text-emerald-800";

  el.className = ${base} ${styles};
  el.textContent = message;

  root.appendChild(el);

  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transition = "opacity .2s";
    setTimeout(() => el.remove(), 250);
  }, 1800);
}

// ----------------------------
// Init header + language dropdown
// ----------------------------
setHeaderText(t);
setupLanguageDropdown();

// navigation buttons
document.getElementById("nav-inventory").onclick = () => switchTab("inventory");
document.getElementById("nav-shopping").onclick = () => switchTab("shopping");
document.getElementById("nav-planner").onclick = () => switchTab("planner");
document.getElementById("nav-reports").onclick = () => switchTab("reports");

// modal buttons
document.getElementById("btn-cancel").onclick = closeModal;

// ----------------------------
// Form submit (Add/Edit)
// ----------------------------
document.getElementById("item-form").onsubmit = async (e) => {
  e.preventDefault();

  const type = document.getElementById("list-type").value;
  const id = document.getElementById("item-id").value || crypto.randomUUID();

  const name = document.getElementById("item-name").value.trim();
  const quantity = parseInt(document.getElementById("item-quantity").value || "1", 10);
  const unit = document.getElementById("item-unit").value.trim();

  //  total price
  const priceRaw = document.getElementById("inp-price")?.value ?? "";
  const price = Number(priceRaw);

  //  category (optional)
  const category = document.getElementById("inp-category")?.value ?? "";

  if (!name) return;

  if (type === "inventory") {
    const days = parseInt(document.getElementById("item-shelf-life").value || "", 10);
    let expiry = "";

    if (Number.isFinite(days) && days > 0) {
      const d = new Date();
      d.setDate(d.getDate() + days);
      expiry = d.toISOString().split("T")[0];
    }

    upsert(inventory, {
      id,
      name,
      quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
      unit,
      expiry,
      price: Number.isFinite(price) && price >= 0 ? price : 0,
      category
    });
  } else {
    upsert(shoppingList, {
      id,
      name,
      quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
      unit,
      price: Number.isFinite(price) && price >= 0 ? price : 0,
      category
    });
  }

  await persist();
  closeModal();
  draw();
};

// ----------------------------
// CRUD helpers
// ----------------------------
function upsert(arr, item) {
  const idx = arr.findIndex(x => x.id === item.id);
  if (idx >= 0) arr[idx] = { ...arr[idx], ...item };
  else arr.push(item);
}

function switchTab(tab) {
  activeTab = tab;
  draw();
}

// ----------------------------
// Waste processing
// ----------------------------
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

// ----------------------------
// Persistence
// ----------------------------
async function persist() {
  await saveData({
    db,
    userId,
    inventory,
    shoppingList,
    historicalWaste,
    monthlyBudget,
    monthSpent
  });
}

// ----------------------------
// Budget
// ----------------------------
async function saveBudget(val) {
  const n = Number(val || 0);
  monthlyBudget = Number.isFinite(n) && n >= 0 ? n : 0;
  await persist();
  toast(t.budget_saved || "Budget saved ✅");
  draw();
}

async function resetSpent() {
  if (!confirm(t.reset_spent_confirm || "Reset monthly spending to €0.00?")) return;
  monthSpent = 0;
  await persist();
  toast(t.reset_done || "Reset done ✅", "warn");
  draw();
}

// ✅ General reset (everything)
async function resetAll() {
  if (!confirm(t.reset_all_confirm || "Reset EVERYTHING (inventory, list, budget, spending, waste)?")) return;

  inventory = [];
  shoppingList = [];
  historicalWaste = 0;
  monthlyBudget = 0;
  monthSpent = 0;

  await persist();
  toast(t.reset_all_done || "Everything reset ✅", "warn");
  draw();
}

// Clear all inventory / shopping
async function clearAll(type) {
  const msg =
    type === "inventory"
      ? (t.clear_inv_confirm || "Clear ALL inventory items?")
      : (t.clear_shop_confirm || "Clear ALL shopping list items?");

  if (!confirm(msg)) return;

  if (type === "inventory") inventory = [];
  else shoppingList = [];

  await persist();
  toast(t.cleared || "Cleared ✅", "warn");
  draw();
}

//  Empty item (consume it)
async function emptyItem(id) {
  const item = inventory.find(x => x.id === id);
  if (!item) return;

  const msg = (t.empty_confirm || "Mark as empty/consumed? This will remove the item from inventory.");
  if (!confirm(msg)) return;

  inventory = inventory.filter(x => x.id !== id);

  await persist();
  toast(t.empty_done || "Removed from inventory ✅");
  draw();
}

// ----------------------------
// Move logic (Bought / Need again)
// ----------------------------
async function moveItem(id, from) {
  if (from === "shopping") {
    const i = shoppingList.find(x => x.id === id);
    if (!i) return;

    // remove from shopping
    shoppingList = shoppingList.filter(x => x.id !== id);

    // add to inventory (no modal)
    const moved = { ...i, expiry: "PENDING" };
    inventory.push(moved);

    //  total price counted once (NOT price * quantity)
    const cost = Number.isFinite(Number(i.price)) ? Number(i.price) : 0;
    monthSpent = Number(monthSpent || 0) + cost;

    await persist();
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
    price: Number(i.price || 0),
    category: i.category || ""
  });

  await persist();
  draw();
}

// ----------------------------
// Delete (both lists)
// ----------------------------
async function deleteItem(type, id) {
  if (!confirm(t.delete_confirm || "Delete this item?")) return;

  if (type === "inventory") inventory = inventory.filter(i => i.id !== id);
  else shoppingList = shoppingList.filter(i => i.id !== id);

  await persist();
  toast(t.deleted || "Deleted ✅", "warn");
  draw();
}

// ----------------------------
// AI mock
// ----------------------------
function showSuggestions() {
  const out = document.getElementById("ai-out");
  const names = shoppingList.map(i => i.name);

  // keep your existing function if you have it in your project
  if (typeof getSmartSuggestions === "function") {
    out.innerText = getSmartSuggestions(lang, names);
  } else {
    out.innerText = "Suggestions module not found.";
  }
}

function showRecipe() {
  const out = document.getElementById("ai-recipe-out");
  const names = inventory.map(i => i.name);
  out.innerText = getSmartRecipe(lang, names);
}

// ----------------------------
// Draw UI
// ----------------------------
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

    onAdd: (type) => openModal(t, type, null),
    onMove: moveItem,
    onDelete: deleteItem,
    onSuggest: showSuggestions,
    onRecipe: showRecipe,

    onSaveBudget: saveBudget,
    onResetSpent: resetSpent,

    //  NEW callbacks (need UI buttons)
    onClearAll: clearAll,      // (type) => clearAll(type)
    onResetAll: resetAll,      // () => resetAll()
    onEmpty: emptyItem         // (id) => emptyItem(id)
  });
}

// ----------------------------
// Auth + sync
// ----------------------------
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

    processWaste();
    draw();
  }
});

// ----------------------------
// Language
// ----------------------------
function setupLanguageDropdown() {
  const sel = document.getElementById("lang-select");
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