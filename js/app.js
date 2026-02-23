import { translations, detectDefaultLang, setLang } from "./i18n.js";
import { initFirebase, signInAndSync, saveData } from "./firebase.js";
import { setHeaderText, setOnlineState, openModal, closeModal, renderUI } from "./ui.js";
import { getSmartRecipe, getSmartSuggestions } from "./ai_mock.js";

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

// ---------- init UI ----------
setHeaderText(t);
setupLanguageDropdown();

document.getElementById("nav-inventory").onclick = () => switchTab("inventory");
document.getElementById("nav-shopping").onclick = () => switchTab("shopping");
document.getElementById("nav-planner").onclick = () => switchTab("planner");
document.getElementById("nav-reports").onclick = () => switchTab("reports");

document.getElementById("btn-cancel").onclick = closeModal;

// ---------- modal submit ----------
document.getElementById("item-form").onsubmit = async (e) => {
  e.preventDefault();

  const type = document.getElementById("list-type").value;
  const id = document.getElementById("item-id").value || crypto.randomUUID();

  const name = document.getElementById("item-name").value.trim();
  const quantity = parseInt(document.getElementById("item-quantity").value || "1", 10);
  const unit = document.getElementById("item-unit").value.trim();

  // total price (not per unit)
  const price = parseFloat(document.getElementById("inp-price")?.value || "0");

  // category (optional)
  const category = (document.getElementById("inp-category")?.value || "").trim();

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
      quantity: Number.isFinite(quantity) ? quantity : 1,
      unit,
      expiry,
      price: Number.isFinite(price) ? price : 0,
      category
    });
  } else {
    upsert(shoppingList, {
      id,
      name,
      quantity: Number.isFinite(quantity) ? quantity : 1,
      unit,
      price: Number.isFinite(price) ? price : 0,
      category
    });
  }

  await persist();
  closeModal();
  draw();
};

function upsert(arr, item) {
  const idx = arr.findIndex((x) => x.id === item.id);
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

    onAdd: (type) => openModal(t, type, null),

    onMove: moveItem,
    onDelete: deleteItem,

    // NEW
    onDeleteShopping: deleteShoppingItem,
    onClearInventory: clearInventory,
    onClearShopping: clearShopping,
    onResetAll: resetAll,

    onSuggest: showSuggestions,
    onRecipe: showRecipe,

    onSaveBudget: saveBudget,
    onResetSpent: resetSpent
  });
}

// auto-waste processing (expired items)
function processWaste() {
  const now = new Date();
  const before = inventory.length;

  inventory = inventory.filter((i) => {
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
    monthSpent
  });
}

// ---------- budget ----------
async function saveBudget(val) {
  const n = Number(val || 0);
  monthlyBudget = Number.isFinite(n) && n >= 0 ? n : 0;
  await persist();
  draw({ toast: "budget_saved" });
}

async function resetSpent() {
  if (!confirm("Reset monthly spending to €0.00?")) return;
  monthSpent = 0;
  await persist();
  draw({ toast: "spent_reset" });
}

// ---------- workflows ----------
async function moveItem(id, from) {
  // shopping → inventory (bought)
  if (from === "shopping") {
    const i = shoppingList.find((x) => x.id === id);
    if (!i) return;

    shoppingList = shoppingList.filter((x) => x.id !== id);

    // moved item into inventory with expiry pending
    inventory.push({ ...i, expiry: "PENDING" });

    // spending add = total price * quantity
    const price = Number(i.price || 0);
    const qty = Number(i.quantity || 1);
    const cost = (Number.isFinite(price) ? price : 0) * (Number.isFinite(qty) ? qty : 1);

    monthSpent = Number(monthSpent || 0) + cost;

    await persist();
    draw();
    return;
  }

  // inventory → shopping (need again)
  const i = inventory.find((x) => x.id === id);
  if (!i) return;

  inventory = inventory.filter((x) => x.id !== id);
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

// Inventory delete (with confirm)
async function deleteItem(type, id) {
  if (!confirm(t.delete_confirm || "Delete this item?")) return;

  if (type === "inventory") inventory = inventory.filter((i) => i.id !== id);
  else shoppingList = shoppingList.filter((i) => i.id !== id);

  await persist();
  draw();
}

// Shopping delete single item (NO “Bought” needed)
async function deleteShoppingItem(id) {
  if (!confirm("Remove this item from the shopping list?")) return;
  shoppingList = shoppingList.filter((x) => x.id !== id);
  await persist();
  draw();
}

// Clear all inventory
async function clearInventory() {
  if (!confirm("Are you sure you want to clear ALL inventory items?")) return;
  inventory = [];
  await persist();
  draw();
}

// Clear all shopping list
async function clearShopping() {
  if (!confirm("Are you sure you want to clear ALL shopping list items?")) return;
  shoppingList = [];
  await persist();
  draw();
}

// Reset everything
async function resetAll() {
  if (!confirm("Reset EVERYTHING (inventory, shopping list, budget spent, waste)?")) return;
  inventory = [];
  shoppingList = [];
  historicalWaste = 0;
  monthlyBudget = 0;
  monthSpent = 0;
  await persist();
  draw();
}

// ---------- AI mock ----------
function showSuggestions() {
  const out = document.getElementById("ai-out");
  const names = shoppingList.map((i) => i.name);
  out.innerText = getSmartSuggestions(lang, names);
}

function showRecipe() {
  const out = document.getElementById("ai-recipe-out");
  const names = inventory.map((i) => i.name);
  out.innerText = getSmartRecipe(lang, names);
}

// ---------- auth + sync ----------
signInAndSync({
  db,
  auth,
  onReady: (uid) => {
    userId = uid;
    setOnlineState(t);
  },
  onData: (d) => {
    inventory = d.inventory || [];
    shoppingList = d.shoppingList || [];
    historicalWaste = Number(d.historicalWaste || 0);

    monthlyBudget = Number(d.monthlyBudget || 0);
    monthSpent = Number(d.monthSpent || 0);

    processWaste();
    draw();
  }
});

// ---------- language ----------
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