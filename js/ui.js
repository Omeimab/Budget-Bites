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
    monthSpent = export function setHeaderText(t) {
  const ids = {
    "app-subtitle": t.subtitle,
    "user-info": t.connecting,
    "loading-message": t.loading,
    "nav-inventory": t.nav_inv,
    "nav-shopping": t.nav_shop,
    "nav-planner": t.nav_plan,
    "nav-reports": t.nav_rep
  };
  Object.keys(ids).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerText = ids[id] || "";
  });
}

export function setOnlineState(t) {
  const info = document.getElementById("user-info");
  const spinner = document.getElementById("sync-spinner");
  if (info) info.textContent = t.active;
  if (spinner) spinner.style.display = "none";
}

export function setActiveTab(activeTab) {
  ["nav-inventory", "nav-shopping", "nav-planner", "nav-reports"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle("active", id === `nav-${activeTab}`);
  });
}

export function openModal(t, type, item) {
  const container = document.getElementById("modal-container");
  if (!container) return;

  document.getElementById("item-form").reset();
  document.getElementById("list-type").value = type;
  document.getElementById("item-id").value = item ? item.id : "";

  const set = (id, txt) => { const el = document.getElementById(id); if(el) el.innerText = txt; };

  set("modal-title", item ? t.edit : t.add);
  set("lbl-name", t.name);
  set("lbl-qty", t.qty);
  set("lbl-unit", t.unit);
  set("lbl-price", t.lbl_price);
  set("lbl-category", t.lbl_category);
  set("lbl-expiry-date", t.lbl_expiry_date);
  set("btn-save", t.save);
  set("btn-cancel", t.cancel);

  // Categories
  ["none", "dairy", "dry", "meat", "produce", "frozen", "drinks", "snacks", "other"].forEach(opt => {
    set(`opt-${opt}`, t[`opt_${opt}`]);
  });

  if (item) {
    document.getElementById("item-name").value = item.name || "";
    document.getElementById("item-quantity").value = item.quantity || 1;
    document.getElementById("item-unit").value = item.unit || "";
    document.getElementById("inp-price").value = item.price || "";
    document.getElementById("inp-category").value = item.category || "";
    document.getElementById("item-expiry-date").value = item.expiry || "";
  }

  const expiryContainer = document.getElementById("expiry-date-container");
  if (expiryContainer) expiryContainer.classList.toggle("hidden", type !== "inventory");

  container.classList.replace("hidden", "flex");
}

export function closeModal() {
  const container = document.getElementById("modal-container");
  if (container) container.classList.replace("flex", "hidden");
}

export function renderUI(state) {
  const { t, activeTab, inventory, shoppingList, monthSpent, monthlyBudget, onAdd, onMove, onDelete, onSaveBudget, onResetSpent } = state;
  const root = document.getElementById("content-area");
  if (!root) return;
  
  setActiveTab(activeTab);

  if (activeTab === "inventory") {
    root.innerHTML = `
      <div class="card">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-extrabold text-gray-800">${t.nav_inv}</h2>
          <button id="btn-add-inv" class="bg-emerald-500 text-white px-6 py-2 rounded-full font-bold shadow-lg">+ ${t.add}</button>
        </div>
        <div class="space-y-3">
          ${inventory.map(i => `
            <div class="flex justify-between p-4 border rounded-2xl items-center bg-white hover:border-emerald-200 transition-all">
              <div>
                <p class="font-bold text-gray-800">${i.name}</p>
                <p class="text-[10px] font-bold text-gray-400 uppercase">${i.quantity} ${i.unit || ""} • ${i.expiry || "—"}</p>
              </div>
              <div class="flex gap-4">
                <button data-move="${i.id}" class="text-[10px] font-black text-amber-500 uppercase">${t.move_need}</button>
                <button data-del="${i.id}" class="text-gray-300 hover:text-red-500">✕</button>
              </div>
            </div>
          `).join("") || `<p class="text-center py-10 text-gray-300 italic">${t.empty_inv}</p>`}
        </div>
      </div>
    `;
    document.getElementById("btn-add-inv").onclick = () => onAdd("inventory");
    root.querySelectorAll("[data-move]").forEach(b => b.onclick = () => onMove(b.dataset.move, "inventory"));
    root.querySelectorAll("[data-del]").forEach(b => b.onclick = () => onDelete("inventory", b.dataset.del));
  } 
  
  else if (activeTab === "reports") {
    const remaining = monthlyBudget - monthSpent;
    const perc = Math.min((monthSpent / (monthlyBudget || 1)) * 100, 100);
    root.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="card">
          <h3 class="text-lg font-bold mb-4">${t.budget}</h3>
          <div class="flex justify-between text-sm mb-2">
            <span>${t.spent}: €${monthSpent.toFixed(2)}</span>
            <span>${t.remaining}: €${remaining.toFixed(2)}</span>
          </div>
          <div class="cat-bar-bg"><div class="cat-bar-fill" style="width: ${perc}%"></div></div>
          <div class="mt-6">
            <input id="budget-input" type="number" value="${monthlyBudget}" class="border rounded p-2 w-24 text-sm" />
            <button id="btn-save-budget" class="bg-gray-800 text-white px-4 py-2 rounded-lg text-xs ml-2">${t.save}</button>
            <button id="btn-reset-spent" class="text-xs text-red-500 ml-4 font-bold uppercase">${t.btn_clear}</button>
          </div>
        </div>
      </div>
    `;
    document.getElementById("btn-save-budget").onclick = () => onSaveBudget(document.getElementById("budget-input").value);
    document.getElementById("btn-reset-spent").onclick = onResetSpent;
  }
  
  else if (activeTab === "shopping") {
    root.innerHTML = `
      <div class="card">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-extrabold text-gray-800">${t.nav_shop}</h2>
          <button id="btn-add-shop" class="bg-emerald-500 text-white px-6 py-2 rounded-full font-bold shadow-lg">+ ${t.add}</button>
        </div>
        <div class="space-y-3">
          ${shoppingList.map(i => `
            <div class="flex justify-between p-4 border rounded-2xl bg-white items-center">
              <div><p class="font-bold text-gray-800">${i.name}</p><p class="text-xs text-gray-400">€${(i.price || 0).toFixed(2)}</p></div>
              <button data-move-shop="${i.id}" class="bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest">${t.move_bought || "Bought"}</button>
            </div>
          `).join("") || `<p class="text-center py-10 text-gray-300 italic">${t.empty_shop}</p>`}
        </div>
      </div>
    `;
    document.getElementById("btn-add-shop").onclick = () => onAdd("shopping");
    root.querySelectorAll("[data-move-shop]").forEach(b => b.onclick = () => onMove(b.dataset.moveShop, "shopping"));
  }
}Number(d.monthSpent || 0);

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