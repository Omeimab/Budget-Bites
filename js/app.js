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
let t = translations[lang] || translations['en'];

const { db, auth } = initFirebase();

// ---------- init UI ----------
function init() {
    try {
        updateAllTranslations();
        setupLanguageDropdown();
        // Bind the close button once
        const cancelBtn = document.getElementById("btn-cancel");
        if (cancelBtn) cancelBtn.onclick = closeModal;
    } catch (e) { console.error("Initialization failed", e); }
}

// Navigation
document.getElementById("nav-inventory").onclick = () => switchTab("inventory");
document.getElementById("nav-shopping").onclick = () => switchTab("shopping");
document.getElementById("nav-planner").onclick = () => switchTab("planner");
document.getElementById("nav-reports").onclick = () => switchTab("reports");

// ---------- modal submit ----------
document.getElementById("item-form").onsubmit = async (e) => {
    e.preventDefault();
    
    const type = document.getElementById("list-type").value;
    const id = document.getElementById("item-id").value || crypto.randomUUID();
    const name = document.getElementById("item-name").value.trim();
    const quantity = parseInt(document.getElementById("item-quantity").value || "1", 10);
    const unit = document.getElementById("item-unit").value.trim();
    const price = parseFloat(document.getElementById("inp-price")?.value || "0");
    const category = (document.getElementById("inp-category")?.value || "").trim();
    const expiryDate = document.getElementById("item-expiry-date")?.value || "";

    if (!name) return;

    const itemData = {
        id, name, 
        quantity: isFinite(quantity) ? quantity : 1,
        unit, expiry: expiryDate,
        price: isFinite(price) ? price : 0,
        category
    };

    if (type === "inventory") upsert(inventory, itemData);
    else upsert(shoppingList, itemData);

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
        t, lang, activeTab, inventory, shoppingList,
        historicalWaste, monthlyBudget, monthSpent,
        onAdd: (type) => {
            // SAFE OPEN
            try {
                updateAllTranslations();
                openModal(t, type, null);
            } catch (err) {
                console.error("Modal failed to open:", err);
            }
        },
        onMove: moveItem,
        onDelete: deleteItem,
        onClearInventory: clearInventory,
        onClearShopping: clearShopping,
        onResetAll: resetAll,
        onSuggest: showSuggestions,
        onRecipe: showRecipe,
        onSaveBudget: saveBudget,
        onResetSpent: resetSpent
    });
}

// --- Persistence & Logic ---
async function persist() {
    if (!userId) return;
    try {
        await saveData({ db, userId, inventory, shoppingList, historicalWaste, monthlyBudget, monthSpent });
    } catch (e) { console.error("Save failed", e); }
}

async function moveItem(id, from) {
    if (from === "shopping") {
        const i = shoppingList.find((x) => x.id === id);
        if (!i) return;
        shoppingList = shoppingList.filter((x) => x.id !== id);
        inventory.push({ ...i });
        monthSpent += (Number(i.price) || 0);
    } else {
        const i = inventory.find((x) => x.id === id);
        if (!i) return;
        inventory = inventory.filter((x) => x.id !== id);
        shoppingList.push({ ...i, expiry: "" });
    }
    await persist();
    draw();
}

async function deleteItem(type, id) {
    if (!confirm(t.delete_confirm || "Delete?")) return;
    if (type === "inventory") inventory = inventory.filter((i) => i.id !== id);
    else shoppingList = shoppingList.filter((i) => i.id !== id);
    await persist();
    draw();
}

async function clearInventory() { if(confirm("Clear?")) { inventory = []; await persist(); draw(); }}
async function clearShopping() { if(confirm("Clear?")) { shoppingList = []; await persist(); draw(); }}
async function resetAll() { if(confirm("Reset?")) { inventory = []; shoppingList = []; historicalWaste = 0; monthlyBudget = 0; monthSpent = 0; await persist(); draw(); }}

function showSuggestions() {
    const out = document.getElementById("ai-out");
    if (out) out.innerText = getSmartSuggestions(lang, shoppingList.map(i => i.name));
}

function showRecipe() {
    const out = document.getElementById("ai-recipe-out");
    if (out) out.innerText = getSmartRecipe(lang, inventory.map(i => i.name));
}

async function saveBudget(val) {
    monthlyBudget = Number(val) || 0;
    await persist();
    draw();
}

async function resetSpent() {
    monthSpent = 0;
    await persist();
    draw();
}

function processWaste() {
    const now = new Date();
    now.setHours(0,0,0,0);
    const before = inventory.length;
    inventory = inventory.filter((i) => {
        if (i.expiry) {
            const itemExpiry = new Date(i.expiry);
            if (itemExpiry < now) {
                historicalWaste++;
                return false;
            }
        }
        return true;
    });
    if (inventory.length !== before) persist();
}

// --- Sync ---
signInAndSync({
    db, auth,
    onReady: (uid) => { userId = uid; setOnlineState(t); },
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

function updateAllTranslations() {
    setHeaderText(t);
    const map = {
        'lbl-price': t.lbl_price,
        'tip-price': t.tip_price,
        'lbl-category': t.lbl_category,
        'tip-category': t.tip_category,
        'lbl-expiry-date': t.lbl_expiry_date,
        'opt-none': t.opt_none,
        'opt-dairy': t.opt_dairy,
        'opt-dry': t.opt_dry,
        'opt-meat': t.opt_meat,
        'opt-produce': t.opt_produce,
        'opt-frozen': t.opt_frozen,
        'opt-drinks': t.opt_drinks,
        'opt-snacks': t.opt_snacks,
        'opt-other': t.opt_other,
        'btn-cancel': t.cancel,
        'btn-save': t.save
    };
    Object.keys(map).forEach(id => {
        const el = document.getElementById(id);
        if (el && map[id]) {
            el.innerText = map[id];
        }
    });
}

function setupLanguageDropdown() {
    const sel = document.getElementById("lang-select");
    if (!sel) return;
    sel.value = lang;
    sel.onchange = () => {
        lang = sel.value;
        setLang(lang);
        t = translations[lang] || translations['en'];
        updateAllTranslations();
        setOnlineState(t);
        draw();
    };
}

init();