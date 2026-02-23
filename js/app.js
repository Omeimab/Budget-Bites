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
let monthPurchases = [];

let lang = detectDefaultLang();
let t = translations[lang];

const { db, auth } = initFirebase();

// Initial Setup
setHeaderText(t);
setupLanguageDropdown();

// Navigation Setup
const navs = ["inventory", "shopping", "planner", "reports"];
navs.forEach(id => {
  const el = document.getElementById(`nav-${id}`);
  if (el) el.onclick = () => switchTab(id);
});

document.getElementById("btn-cancel").onclick = closeModal;

document.getElementById("item-form").onsubmit = async (e) => {
  e.preventDefault();
  const type = document.getElementById("list-type").value;
  const id = document.getElementById("item-id").value || crypto.randomUUID();
  const name = document.getElementById("item-name").value.trim();
  const quantity = parseInt(document.getElementById("item-quantity").value || "1", 10);
  const unit = document.getElementById("item-unit").value.trim();
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

  closeModal();
  draw(); // Draw immediately for speed
  await persist();
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
    t, lang, activeTab, inventory, shoppingList, historicalWaste,
    monthlyBudget, monthSpent, monthPurchases,
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
  if (!userId) return;
  await saveData({
    db, userId, inventory, shoppingList, historicalWaste,
    monthlyBudget, monthSpent, monthPurchases
  });
}

async function saveBudget(val) {
  const n = Number(val || 0);
  monthlyBudget = Number.isFinite(n) && n >= 0 ? n : 0;
  draw();
  await persist();
  showToast("✅ Budget saved", "success");
}

async function resetSpent() {
  if (!confirm("Reset monthly spending to €0.00?")) return;
  monthSpent = 0;
  monthPurchases = [];
  draw();
  await persist();
  showToast("Monthly spending reset", "warn");
}

async function resetAll() {
  if (!confirm("Reset ALL data? This will clear inventory, shopping list, budget and stats.")) return;
  inventory = []; shoppingList = []; historicalWaste = 0;
  monthlyBudget = 0; monthSpent = 0; monthPurchases = [];
  draw();
  await persist();
  showToast("All data reset", "warn");
}

async function moveItem(id, from) {
  if (from === "shopping") {
    const i = shoppingList.find(x => x.id === id);
    if (!i) return;
    shoppingList = shoppingList.filter(x => x.id !== id);
    inventory.push({ ...i, expiry: "PENDING" });
    const price = Number(i.price || 0);
    const cost = Number.isFinite(price) ? price : 0;
    monthSpent = (Number(monthSpent) || 0) + cost;
    monthPurchases.push({ id: crypto.randomUUID(), name: i.name, cost, ts: Date.now() });
    
    draw(); 
    await persist();
    showToast("Added to inventory", "success");
    return;
  }
  const i = inventory.find(x => x.id === id);
  if (!i) return;
  inventory = inventory.filter(x => x.id !== id);
  shoppingList.push({ ...i, price: Number(i.price || 0) });
  draw();
  await persist();
}

async function emptyItem(id) {
  const i = inventory.find(x => x.id === id);
  if (!i) return;

  // Confirmation popup
  if (!confirm(`Mark "${i.name}" as empty?`)) return;

  // 1. Update local data
  inventory = inventory.filter(x => x.id !== id);
  historicalWaste += 1;

  // 2. Re-draw the UI immediately
  draw(); 

  // 3. Save to cloud in background
  await persist();
  showToast("Item removed", "warn");
}

async function deleteItem(type, id) {
  if (!confirm("Delete this item?")) return;
  if (type === "inventory") inventory = inventory.filter(i => i.id !== id);
  else shoppingList = shoppingList.filter(i => i.id !== id);
  
  draw();
  await persist();
  showToast("Removed", "warn");
}

async function clearAllInventory() {
  if (!confirm("Clear ALL inventory?")) return;
  inventory = [];
  draw();
  await persist();
}

async function clearAllShopping() {
  if (!confirm("Clear ALL shopping?")) return;
  shoppingList = [];
  draw();
  await persist();
}

function showSuggestions() {
  const out = document.getElementById("ai-out");
  if (!out) return;
  const names = shoppingList.map(i => i.name);
  out.innerText = getSmartSuggestions(lang, names);
}

function showRecipe() {
  const out = document.getElementById("ai-recipe-out");
  if (!out) return;
  const names = inventory.map(i => i.name);
  out.innerText = getSmartRecipe(lang, names);
}

// Auth & Sync
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