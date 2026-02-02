import { translations, detectDefaultLang, setLang } from "./i18n.js";
import { initFirebase, signInAndSync, saveData } from "./firebase.js";
import { setHeaderText, setOnlineState, openModal, closeModal, renderUI } from "./ui.js";
import { getSmartSuggestions, getSmartRecipe } from "./ai_mock.js";

let activeTab = "inventory";
let userId = null;

let inventory = [];
let shoppingList = [];
let historicalWaste = 0;

//  NEW: budget state
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

  //  NEW: price
  const rawPrice = (document.getElementById("inp-price")?.value || "").trim();
  const price = rawPrice === "" ? null : Number(rawPrice);

  if (!name) return;

  if (type === "inventory") {
    const days = parseInt(document.getElementById("item-shelf-life").value || "", 10);
    let expiry = "";

    if (Number.isFinite(days) && days > 0) {
      const d = new Date();
      d.setDate(d.getDate() + days);
      expiry = d.toISOString().split("T")[0];
    }

    upsert(inventory, { id, name, quantity, unit, expiry, price });
  } else {
    upsert(shoppingList, { id, name, quantity, unit, price });
  }

  await persist();
  closeModal();
  draw();
};

function upsert(arr, item) {
  const idx = arr.findIndex(x => x.id === item.id);
  if (idx >= 0) arr[idx] = item;
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
    onSuggest: showSuggestions,
    onRecipe: showRecipe,
    onSaveBudget: saveBudget
  });
  const resetBtn = document.getElementById("btn-reset-month");
if (resetBtn) {
  resetBtn.onclick = async () => {
    if (!confirm("Reset monthly spending to 0€?")) return;
    monthSpent = 0;
    await persist();
    draw();
  };
}

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
    monthSpent
  });
}

//  NEW: budget save
async function saveBudget(newBudget) {
  monthlyBudget = Math.max(0, Number(newBudget || 0));
  await persist();
  draw();
}

//  UPDATED: no more second modal after BOUGHT
async function moveItem(id, from) {
  if (from === "shopping") {
    const i = shoppingList.find(x => x.id === id);
    if (!i) return;

    shoppingList = shoppingList.filter(x => x.id !== id);

    // add to spent (price * qty)
    const line = (Number(i.price || 0) * Number(i.quantity || 1));
    if (Number.isFinite(line) && line > 0) monthSpent = Number(monthSpent || 0) + line;

    const moved = { ...i, expiry: "PENDING" };
    inventory.push(moved);

    await persist();
    draw();
    return;
  }

  // inventory -> shopping (need)
  const i = inventory.find(x => x.id === id);
  if (!i) return;

  inventory = inventory.filter(x => x.id !== id);
  shoppingList.push({ id: i.id, name: i.name, quantity: i.quantity, unit: i.unit, price: i.price ?? null });

  await persist();
  draw();
}

async function deleteItem(type, id) {
  if (!confirm(t.delete_confirm || "Delete this item?")) return;

  if (type === "inventory") inventory = inventory.filter(i => i.id !== id);
  else shoppingList = shoppingList.filter(i => i.id !== id);

  await persist();
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
  db,
  auth,
  onReady: (uid) => {
    userId = uid;
    setOnlineState(t);
  },
  onData: (d) => {
    inventory = d.inventory || [];
    shoppingList = d.shoppingList || [];
    historicalWaste = d.historicalWaste || 0;

    //  IMPORTANT: read budget values from firebase
    monthlyBudget = Number(d.monthlyBudget || 0);
    monthSpent = Number(d.monthSpent || 0);

    processWaste();
    draw();
  }
});

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
