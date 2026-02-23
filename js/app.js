import { I18N, detectDefaultLang, setLang } from "./i18n.js";
import { initFirebase, signInAndSync, saveData } from "./firebase.js";
import { setHeaderText, setOnlineState, openModal, closeModal, renderUI, showToast } from "./ui.js";
import { getSmartRecipe, getSmartSuggestions } from "./ai_mock.js";

let activeTab = "inventory";
let userId = null;

let inventory = [];
let shoppingList = [];
let historicalWaste = 0;

let monthlyBudget = 0;
let monthSpent = 0;
let monthPurchases = [];

let tripBudget = 50;

let lang = detectDefaultLang();
let t = I18N[lang];

const { db, auth } = initFirebase();

setHeaderText(t);
setupLanguageDropdown();

["inventory", "shopping", "planner", "reports"].forEach(id => {
  const el = document.getElementById(`nav-${id}`);
  if (el) el.onclick = () => switchTab(id);
});

document.getElementById("btn-cancel").onclick = closeModal;

document.getElementById("modal-container").onclick = (e) => {
  if (e.target && e.target.id === "modal-container") closeModal();
};

document.getElementById("item-form").onsubmit = async (e) => {
  e.preventDefault();

  const type = document.getElementById("list-type").value;
  const id = document.getElementById("item-id").value || crypto.randomUUID();

  const name = document.getElementById("item-name").value.trim();
  const quantity = parseInt(document.getElementById("item-quantity").value || "1", 10);
  const unit = document.getElementById("item-unit").value.trim();

  const category = (document.getElementById("item-category")?.value || "general").trim();

  const price = parseFloat(document.getElementById("inp-price")?.value || "0");
  const safePrice = Number.isFinite(price) && price >= 0 ? price : 0;

  const days = parseInt(document.getElementById("item-shelf-life")?.value || "", 10);
  const shelfLifeDays = Number.isFinite(days) && days > 0 ? days : 0;

  if (!name) return;

  if (type === "inventory") {
    const expiry = shelfLifeDays > 0 ? addDaysISO(shelfLifeDays) : "";
    upsert(inventory, { id, name, category, quantity, unit, expiry, price: safePrice });
  } else {
    upsert(shoppingList, { id, name, category, quantity, unit, shelfLifeDays, price: safePrice });
  }

  closeModal();
  draw();
  await persist();
};

function addDaysISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

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
    tripBudget,

    onAdd: (type) => openModal(t, type, null),
    onMove: moveItem,
    onDelete: deleteItem,
    onEmpty: emptyItem,

    onSuggest: showSuggestions,
    onRecipe: showRecipe,

    onSaveBudget: saveMonthlyBudget,
    onResetSpent: resetSpent,

    onSaveTripBudget: saveTripBudget,
    onResetTripBudget: resetTripBudget,

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
    db, userId,
    inventory, shoppingList, historicalWaste,
    monthlyBudget, monthSpent,
    monthPurchases,
    tripBudget
  });
}

async function saveMonthlyBudget(val) {
  const n = Number(val || 0);
  monthlyBudget = Number.isFinite(n) && n >= 0 ? n : 0;
  draw();
  await persist();
  showToast("✅ Budget saved", "success");
}

async function saveTripBudget(val) {
  const n = Number(val || 0);
  tripBudget = Number.isFinite(n) && n >= 0 ? n : 0;
  draw();
  await persist();
  showToast("✅ Trip budget saved", "success");
}

async function resetTripBudget() {
  tripBudget = 50;
  draw();
  await persist();
  showToast("Trip budget reset", "warn");
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
  inventory = [];
  shoppingList = [];
  historicalWaste = 0;

  monthlyBudget = 0;
  monthSpent = 0;
  monthPurchases = [];

  tripBudget = 50;

  draw();
  await persist();
  showToast("All data reset", "warn");
}

async function moveItem(id, from) {
  if (from === "shopping") {
    const i = shoppingList.find(x => x.id === id);
    if (!i) return;

    shoppingList = shoppingList.filter(x => x.id !== id);

    let expiry = "";
    const shelf = Number(i.shelfLifeDays || 0);
    if (shelf > 0) expiry = addDaysISO(shelf);
    else expiry = "PENDING";

    inventory.push({ ...i, expiry });

    const cost = Number(i.price || 0);
    const safeCost = Number.isFinite(cost) ? cost : 0;

    monthSpent = (Number(monthSpent) || 0) + safeCost;

    monthPurchases.push({
      id: crypto.randomUUID(),
      name: i.name,
      category: i.category || "general",
      cost: safeCost,
      ts: Date.now()
    });

    draw();
    await persist();
    showToast("✅ Bought → moved to inventory", "success");
    return;
  }

  const inv = inventory.find(x => x.id === id);
  if (!inv) return;

  inventory = inventory.filter(x => x.id !== id);
  shoppingList.push({
    id: inv.id,
    name: inv.name,
    category: inv.category || "general",
    quantity: inv.quantity,
    unit: inv.unit || "",
    shelfLifeDays: 0,
    price: Number(inv.price || 0)
  });

  draw();
  await persist();
}

async function emptyItem(id) {
  const i = inventory.find(x => x.id === id);
  if (!i) return;

  if (!confirm(`Mark "${i.name}" as empty?`)) return;

  inventory = inventory.filter(x => x.id !== id);
  historicalWaste += 1;

  draw();
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
  if (!confirm("Clear ALL shopping list?")) return;
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

// Firebase sync
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

    tripBudget = Number(d.tripBudget || 50);

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
    t = I18N[lang] || I18N.en;

    setHeaderText(t);
    setOnlineState(t);
    draw();
  };
}