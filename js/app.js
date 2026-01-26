import { translations, detectDefaultLang, setLang } from "./i18n.js";
import { initFirebase, signInAndSync, saveData } from "./firebase.js";
import { setHeaderText, setOnlineState, openModal, closeModal, renderUI } from "./ui.js";
import { getSmartRecipe } from "./ai_mock.js";


let activeTab = "inventory";
let userId = null;

let inventory = [];
let shoppingList = [];
let historicalWaste = 0;

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

  if (!name) return;

  if (type === "inventory") {
    const days = parseInt(document.getElementById("item-shelf-life").value || "", 10);
    let expiry = "";

    if (Number.isFinite(days) && days > 0) {
      const d = new Date();
      d.setDate(d.getDate() + days);
      expiry = d.toISOString().split("T")[0];
    }

    upsert(inventory, { id, name, quantity, unit, expiry });
  } else {
    upsert(shoppingList, { id, name, quantity, unit });
  }

  await persist();
  closeModal();
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
    t, lang, activeTab, inventory, shoppingList, historicalWaste,
    onAdd: (type) => openModal(t, type, null),
    onMove: moveItem,
    onDelete: deleteItem,
    onSuggest: showSuggestions,
    onRecipe: showRecipe
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
  await saveData({ db, userId, inventory, shoppingList, historicalWaste });
}

async function moveItem(id, from) {
  if (from === "shopping") {
    const i = shoppingList.find(x => x.id === id);
    shoppingList = shoppingList.filter(x => x.id !== id);

    const moved = { ...i, expiry: "PENDING" };
    inventory.push(moved);

    // open modal so user sets shelf life (human flow)
    openModal(t, "inventory", moved);
  } else {
    const i = inventory.find(x => x.id === id);
    inventory = inventory.filter(x => x.id !== id);
    shoppingList.push({ id: i.id, name: i.name, quantity: i.quantity, unit: i.unit });
  }

  await persist();
  draw();
}

async function deleteItem(type, id) {
  if (!confirm(t.delete_confirm)) return;

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
  db, auth,
  onReady: (uid) => {
    userId = uid;
    setOnlineState(t);
  },
  onData: (d) => {
    inventory = d.inventory || [];
    shoppingList = d.shoppingList || [];
    historicalWaste = d.historicalWaste || 0;

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
    setOnlineState(t); // keeps header consistent if already online
    draw();
  };
}
