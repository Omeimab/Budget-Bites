import { t } from "./i18n.js";

export function toast(msg, type = "info") {
  const container = document.getElementById("toast-container");
  const el = document.createElement("div");
  el.className = "card px-4 py-3 text-sm flex items-center gap-2 border";
  el.style.borderColor = type === "error" ? "#fecaca" : "#bbf7d0";
  el.innerHTML = `
    <span class="font-bold ${type === "error" ? "text-red-600" : "text-emerald-600"}">•</span>
    <span class="text-gray-700">${escapeHtml(msg)}</span>
  `;
  container.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

export function setHeader(lang) {
  document.getElementById("app-subtitle").textContent = t(lang, "subtitle");

  document.getElementById("nav-inventory").textContent = t(lang, "inventory");
  document.getElementById("nav-shopping").textContent = t(lang, "shopping");
  document.getElementById("nav-planner").textContent = t(lang, "planner");
  document.getElementById("nav-reports").textContent = t(lang, "reports");
}

export function setStatus(lang, statusKey) {
  const spinner = document.getElementById("sync-spinner");
  const info = document.getElementById("user-info");

  if (statusKey === "initializing") {
    spinner.classList.remove("hidden");
    info.textContent = t(lang, "initializing");
  } else {
    spinner.classList.add("hidden");
    info.textContent = t(lang, "ready");
  }
}

export function setActiveTab(tabId) {
  const ids = ["inventory", "shopping", "planner", "reports"];
  for (const id of ids) {
    const btn = document.getElementById(`nav-${id}`);
    btn.classList.toggle("active", id === tabId);
  }
}

export function renderInventory(state, handlers) {
  const lang = state.lang;
  const items = [...state.inventory].sort((a,b) => (a.expiryTs ?? 0) - (b.expiryTs ?? 0));

  const content = `
    <section class="space-y-5">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-extrabold text-gray-800">${t(lang,"inventory")}</h2>
        <button id="btn-add-inventory" class="px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold shadow hover:bg-emerald-600">
          + ${t(lang,"addInventory")}
        </button>
      </div>

      <div class="grid md:grid-cols-3 gap-4">
        ${items.length ? items.map(it => inventoryCard(lang, it)).join("") : emptyCard(lang, t(lang,"emptyInventory"))}
      </div>
    </section>
  `;

  mount(content);

  document.getElementById("btn-add-inventory").onclick = () => handlers.openAdd("inventory");

  for (const it of items) {
    document.getElementById(`edit-${it.id}`).onclick = () => handlers.openEdit("inventory", it.id);
    document.getElementById(`del-${it.id}`).onclick = () => handlers.remove("inventory", it.id);
  }
}

export function renderShopping(state, handlers) {
  const lang = state.lang;
  const items = [...state.shopping].sort((a,b) => Number(a.bought) - Number(b.bought));

  const planned = sum(items.filter(x => !x.bought).map(x => x.priceTotal ?? 0));
  const tripBudget = Number(state.settings.shoppingTripBudget ?? 0);
  const remaining = tripBudget - planned;

  const content = `
    <section class="space-y-5">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-extrabold text-gray-800">${t(lang,"shopping")}</h2>
          <p class="text-sm text-gray-500 mt-1">${t(lang,"plannedSpend")}: <span class="font-bold">€${planned.toFixed(2)}</span></p>
        </div>
        <button id="btn-add-shopping" class="px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold shadow hover:bg-emerald-600">
          + ${t(lang,"addShopping")}
        </button>
      </div>

      <div class="card flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div class="flex-1">
          <label class="text-xs font-black text-gray-500 uppercase">${t(lang,"tripBudget")}</label>
          <input id="inp-trip-budget" type="number" step="0.01" min="0"
            class="mt-2 w-full md:max-w-xs p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
            value="${escapeAttr(String(tripBudget))}">
        </div>
        <div class="text-sm text-gray-700">
          <div>${t(lang,"plannedSpend")}: <span class="font-bold">€${planned.toFixed(2)}</span></div>
          <div>${t(lang,"remaining")}: <span class="font-bold ${remaining < 0 ? "text-red-600" : "text-emerald-600"}">€${remaining.toFixed(2)}</span></div>
        </div>
      </div>

      <div class="grid md:grid-cols-2 gap-4">
        ${items.length ? items.map(it => shoppingCard(lang, it)).join("") : emptyCard(lang, t(lang,"emptyShopping"))}
      </div>
    </section>
  `;

  mount(content);

  document.getElementById("btn-add-shopping").onclick = () => handlers.openAdd("shopping");

  const inp = document.getElementById("inp-trip-budget");
  inp.onchange = () => handlers.updateTripBudget(Number(inp.value || 0));

  for (const it of items) {
    document.getElementById(`toggle-${it.id}`).onclick = () => handlers.toggleBought(it.id);
    document.getElementById(`edit-${it.id}`).onclick = () => handlers.openEdit("shopping", it.id);
    document.getElementById(`del-${it.id}`).onclick = () => handlers.remove("shopping", it.id);
  }
}

export function renderPlanner(state) {
  const lang = state.lang;
  mount(`
    <section class="space-y-4">
      <h2 class="text-2xl font-extrabold text-gray-800">${t(lang,"planner")}</h2>
      <div class="card text-gray-600">${t(lang,"plannerComing")}</div>
    </section>
  `);
}

export function renderReports(state) {
  const lang = state.lang;

  const monthlyBudget = Number(state.settings.monthlyBudget ?? 0);
  const spentThisMonth = calcSpentThisMonth(state);
  const remaining = monthlyBudget - spentThisMonth;

  const breakdown = categoryBreakdown(state);

  mount(`
    <section class="space-y-5">
      <h2 class="text-2xl font-extrabold text-gray-800">${t(lang,"reports")}</h2>

      <div class="card flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div class="flex-1">
          <label class="text-xs font-black text-gray-500 uppercase">${t(lang,"monthlyBudget")}</label>
          <input id="inp-monthly-budget" type="number" step="0.01" min="0"
            class="mt-2 w-full md:max-w-xs p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
            value="${escapeAttr(String(monthlyBudget))}">
        </div>
        <div class="text-sm text-gray-700">
          <div>${t(lang,"spentThisMonth")}: <span class="font-bold">€${spentThisMonth.toFixed(2)}</span></div>
          <div>${t(lang,"remaining")}: <span class="font-bold ${remaining < 0 ? "text-red-600" : "text-emerald-600"}">€${remaining.toFixed(2)}</span></div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-extrabold text-gray-800">${t(lang,"byCategory")}</h3>
          <span class="text-xs text-gray-400">Inventory + bought shopping items</span>
        </div>
        <div class="mt-4 space-y-2">
          ${Object.keys(breakdown).length ? Object.entries(breakdown).sort((a,b)=>b[1]-a[1]).map(([cat,val]) => `
            <div class="flex items-center justify-between text-sm">
              <span class="font-semibold text-gray-700">${escapeHtml(cat)}</span>
              <span class="font-bold text-gray-800">€${val.toFixed(2)}</span>
            </div>
          `).join("") : `<p class="text-sm text-gray-500">No spending data yet.</p>`}
        </div>
      </div>
    </section>
  `);
}

export function wireReportsBudget(handler) {
  const el = document.getElementById("inp-monthly-budget");
  if (!el) return;
  el.onchange = () => handler(Number(el.value || 0));
}

/* ---------------- Modal helpers ---------------- */

export function openModal({ lang, mode, listType, item }, onSubmit, onCancel) {
  const modal = document.getElementById("modal-container");
  const form = document.getElementById("item-form");

  // labels
  document.getElementById("lbl-name").textContent = t(lang, "name");
  document.getElementById("lbl-category").textContent = t(lang, "category");
  document.getElementById("lbl-qty").textContent = t(lang, "qty");
  document.getElementById("lbl-unit").textContent = t(lang, "unit");
  document.getElementById("lbl-price").textContent = t(lang, "totalPrice");
  document.getElementById("hint-price").textContent = t(lang, "priceHint");
  document.getElementById("lbl-expiry").textContent = t(lang, "shelfLife");
  document.getElementById("hint-expiry").textContent = t(lang, "expiryHint");
  document.getElementById("btn-cancel").textContent = t(lang, "cancel");
  document.getElementById("btn-save").textContent = t(lang, "save");

  // title
  const titleId =
    listType === "inventory"
      ? (mode === "add" ? "modalAddInv" : "modalEditInv")
      : (mode === "add" ? "modalAddShop" : "modalEditShop");

  document.getElementById("modal-title").textContent = t(lang, titleId);

  // show/hide expiry (inventory only)
  const expiryField = document.getElementById("expiry-field");
  expiryField.classList.toggle("hidden", listType !== "inventory");

  // fill fields
  document.getElementById("item-id").value = item?.id ?? "";
  document.getElementById("list-type").value = listType;

  document.getElementById("item-name").value = item?.name ?? "";
  document.getElementById("item-category").value = item?.category ?? "general";
  document.getElementById("item-quantity").value = item?.qty ?? 1;
  document.getElementById("item-unit").value = item?.unit ?? "";
  document.getElementById("inp-price").value = item?.priceTotal ?? "";
  document.getElementById("item-shelf-life").value = item?.shelfLifeDays ?? "";

  // events
  const cancelBtn = document.getElementById("btn-cancel");
  const onCancelClick = () => {
    closeModal();
    onCancel?.();
  };
  cancelBtn.onclick = onCancelClick;

  form.onsubmit = (e) => {
    e.preventDefault();
    const payload = {
      id: document.getElementById("item-id").value || null,
      listType: document.getElementById("list-type").value,
      name: document.getElementById("item-name").value.trim(),
      category: document.getElementById("item-category").value,
      qty: Number(document.getElementById("item-quantity").value || 1),
      unit: document.getElementById("item-unit").value.trim(),
      priceTotal: Number(document.getElementById("inp-price").value || 0),
      shelfLifeDays: Number(document.getElementById("item-shelf-life").value || 0),
    };
    onSubmit(payload);
  };

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

export function closeModal() {
  const modal = document.getElementById("modal-container");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

/* ---------------- Utilities ---------------- */

function mount(html) {
  document.getElementById("content-area").innerHTML = html;
}

function sum(arr) {
  return arr.reduce((a,b)=>a+Number(b||0),0);
}

function calcSpentThisMonth(state) {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const inv = state.inventory.filter(it => {
    const d = new Date(it.createdAtTs ?? 0);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const boughtShop = state.shopping.filter(it => it.bought).filter(it => {
    const d = new Date(it.boughtAtTs ?? 0);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  return sum(inv.map(x=>x.priceTotal ?? 0)) + sum(boughtShop.map(x=>x.priceTotal ?? 0));
}

function categoryBreakdown(state) {
  const out = {};
  for (const it of state.inventory) {
    const cat = it.category ?? "general";
    out[cat] = (out[cat] || 0) + Number(it.priceTotal || 0);
  }
  for (const it of state.shopping) {
    if (!it.bought) continue;
    const cat = it.category ?? "general";
    out[cat] = (out[cat] || 0) + Number(it.priceTotal || 0);
  }
  return out;
}

function inventoryCard(lang, it) {
  const expiry = formatExpiry(lang, it);
  const price = Number(it.priceTotal || 0).toFixed(2);

  return `
    <div class="card">
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="text-lg font-extrabold text-gray-800">${escapeHtml(it.name)}</div>
          <div class="text-xs text-gray-500 mt-1">${escapeHtml(it.category || "general")} • ${escapeHtml(String(it.qty))} ${escapeHtml(it.unit || "")}</div>
          <div class="text-sm mt-2 text-gray-700"><span class="font-bold">€${price}</span> ${expiry ? `• ${expiry}` : ""}</div>
        </div>
        <div class="flex flex-col gap-2">
          <button id="edit-${it.id}" class="px-3 py-1 rounded-lg bg-gray-100 font-bold text-xs hover:bg-gray-200">${t(lang,"edit")}</button>
          <button id="del-${it.id}" class="px-3 py-1 rounded-lg bg-red-50 font-bold text-xs text-red-700 hover:bg-red-100">${t(lang,"delete")}</button>
        </div>
      </div>
    </div>
  `;
}

function shoppingCard(lang, it) {
  const price = Number(it.priceTotal || 0).toFixed(2);
  const bought = !!it.bought;

  return `
    <div class="card">
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="text-lg font-extrabold ${bought ? "text-gray-400 line-through" : "text-gray-800"}">${escapeHtml(it.name)}</div>
          <div class="text-xs text-gray-500 mt-1">${escapeHtml(it.category || "general")} • ${escapeHtml(String(it.qty))} ${escapeHtml(it.unit || "")}</div>
          <div class="text-sm mt-2 text-gray-700"><span class="font-bold">€${price}</span></div>
        </div>
        <div class="flex flex-col gap-2">
          <button id="toggle-${it.id}" class="px-3 py-1 rounded-lg ${bought ? "bg-emerald-50 text-emerald-700" : "bg-gray-100"} font-bold text-xs hover:bg-gray-200">
            ${bought ? t(lang,"bought") : t(lang,"notBought")}
          </button>
          <button id="edit-${it.id}" class="px-3 py-1 rounded-lg bg-gray-100 font-bold text-xs hover:bg-gray-200">${t(lang,"edit")}</button>
          <button id="del-${it.id}" class="px-3 py-1 rounded-lg bg-red-50 font-bold text-xs text-red-700 hover:bg-red-100">${t(lang,"delete")}</button>
        </div>
      </div>
    </div>
  `;
}

function emptyCard(lang, text) {
  return `
    <div class="card md:col-span-3 text-center text-gray-500">
      ${escapeHtml(text)}
    </div>
  `;
}

function formatExpiry(lang, it) {
  if (!it.expiryTs) return "";
  const now = Date.now();
  const ms = it.expiryTs - now;
  const days = Math.ceil(ms / (1000*60*60*24));

  const date = new Date(it.expiryTs).toLocaleDateString(lang === "de" ? "de-DE" : lang === "it" ? "it-IT" : "en-GB");

  if (days < 0) return `<span class="text-red-600 font-bold">${t(lang,"expired")} • ${t(lang,"expires")}: ${date}</span>`;
  if (days <= 2) return `<span class="text-orange-600 font-bold">${t(lang,"expires")}: ${date} • ${days} ${t(lang,"daysLeft")}</span>`;
  return `<span class="text-emerald-700 font-bold">${t(lang,"expires")}: ${date} • ${days} ${t(lang,"daysLeft")}</span>`;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function escapeAttr(s) {
  return escapeHtml(s).replaceAll("\n"," ");
}