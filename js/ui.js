import { t } from "./i18n.js";
import { suggestMealsFromInventory } from "./ai_mock.js";

/* ---------------- Toast + header ---------------- */

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
  document.getElementById("nav-reports").textContent = t(lang, "dashboard"); // renamed
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

/* ---------------- Inventory ---------------- */

export function renderInventory(state, handlers) {
  const lang = state.lang;
  const items = [...state.inventory].sort((a, b) => (a.expiryTs ?? Infinity) - (b.expiryTs ?? Infinity));

  const content = `
    <section class="space-y-5">
      <div class="flex items-center justify-between">
        <h2 class="text-3xl font-extrabold text-gray-800">${t(lang, "inventory")}</h2>
        <button id="btn-add-inventory" class="px-5 py-3 rounded-2xl bg-emerald-500 text-white font-extrabold shadow hover:bg-emerald-600">
          + ${t(lang, "addInventory")}
        </button>
      </div>

      <div class="grid md:grid-cols-3 gap-4">
        ${items.length ? items.map(it => inventoryCard(lang, it)).join("") : emptyWideCard(lang, t(lang, "emptyInventory"))}
      </div>
    </section>
  `;

  mount(content);

  document.getElementById("btn-add-inventory").onclick = () => handlers.openAdd("inventory");

  for (const it of items) {
    document.getElementById(`edit-inv-${it.id}`).onclick = () => handlers.openEdit("inventory", it.id);
    document.getElementById(`del-inv-${it.id}`).onclick = () => handlers.remove("inventory", it.id);
  }
}

/* ---------------- Shopping (NICE UI) ---------------- */

export function renderShopping(state, handlers) {
  const lang = state.lang;
  const items = [...state.shopping].sort((a,b) => Number(a.bought) - Number(b.bought));

  const tripBudget = Number(state.settings.shoppingTripBudget ?? 0);
  const planned = sum(items.map(x => x.priceTotal ?? 0));
  const remaining = tripBudget - planned;

  const status = budgetStatus(tripBudget, planned); // ok / warn / over
  const barPct = tripBudget > 0 ? clamp((planned / tripBudget) * 100, 0, 120) : 0;

  const content = `
    <section class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-3xl font-extrabold text-gray-800">${t(lang,"shopping")}</h2>
          <p class="text-sm text-gray-500 mt-1">${t(lang,"plannedSpend")}: <span class="font-black">€${planned.toFixed(2)}</span></p>
        </div>
        <button id="btn-add-shopping" class="px-5 py-3 rounded-2xl bg-emerald-500 text-white font-extrabold shadow hover:bg-emerald-600">
          + ${t(lang,"addShopping")}
        </button>
      </div>

      <div class="card">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div class="flex-1">
            <div class="flex items-center justify-between">
              <label class="text-xs font-black text-gray-500 uppercase">${t(lang,"tripBudget")}</label>
              <button id="btn-reset-trip" class="text-xs font-extrabold text-gray-500 hover:text-gray-800">${t(lang,"reset")}</button>
            </div>
            <div class="mt-2 flex gap-3 items-center">
              <input id="inp-trip-budget" type="number" step="0.01" min="0"
                class="w-full md:max-w-[240px] p-3 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500"
                value="${escapeAttr(String(tripBudget))}">
              <div class="text-sm text-gray-700">
                <div>${t(lang,"remaining")}: <span class="font-black ${remaining < 0 ? "text-red-600" : "text-emerald-600"}">€${remaining.toFixed(2)}</span></div>
              </div>
            </div>

            <div class="mt-4">
              <div class="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-3 rounded-full ${status === "over" ? "bg-red-500" : status === "warn" ? "bg-orange-400" : "bg-emerald-500"}"
                     style="width:${barPct}%; transition: width .25s;"></div>
              </div>
              <div class="mt-2 text-xs font-bold ${status === "over" ? "text-red-600" : status === "warn" ? "text-orange-600" : "text-gray-500"}">
                ${status === "over" ? t(lang,"budgetOver") : status === "warn" ? t(lang,"budgetWarn") : t(lang,"budgetOk")}
              </div>
            </div>
          </div>

          <div class="text-sm text-gray-700 md:text-right">
            <div>${t(lang,"plannedSpend")}: <span class="font-black">€${planned.toFixed(2)}</span></div>
            <div>${t(lang,"tripBudgetShort")}: <span class="font-black">€${tripBudget.toFixed(2)}</span></div>
          </div>
        </div>
      </div>

      <div class="space-y-3">
        ${items.length ? items.map(it => shoppingRow(lang, it)).join("") : emptyWideCard(lang, t(lang,"emptyShopping"))}
      </div>
    </section>
  `;

  mount(content);

  document.getElementById("btn-add-shopping").onclick = () => handlers.openAdd("shopping");

  const inp = document.getElementById("inp-trip-budget");
  inp.onchange = () => handlers.updateTripBudget(Number(inp.value || 0));
  document.getElementById("btn-reset-trip").onclick = () => handlers.resetTripBudget();

  for (const it of items) {
    document.getElementById(`buy-${it.id}`).onclick = () => handlers.toggleBought(it.id);
    document.getElementById(`edit-shop-${it.id}`).onclick = () => handlers.openEdit("shopping", it.id);
    document.getElementById(`del-shop-${it.id}`).onclick = () => handlers.remove("shopping", it.id);
  }
}

/* ---------------- Meal planner ---------------- */

export function renderPlanner(state, handlers) {
  const lang = state.lang;
  const ideas = suggestMealsFromInventory(state.inventory);

  mount(`
    <section class="space-y-5">
      <div class="flex items-center justify-between">
        <h2 class="text-3xl font-extrabold text-gray-800">${t(lang,"planner")}</h2>
        <button id="btn-gen-meals" class="px-5 py-3 rounded-2xl bg-emerald-500 text-white font-extrabold shadow hover:bg-emerald-600">
          ${t(lang,"generateRecipes")}
        </button>
      </div>

      <div class="card">
        <p class="text-gray-600">${t(lang,"plannerHint")}</p>
      </div>

      <div id="meal-results" class="grid md:grid-cols-2 gap-4"></div>
    </section>
  `);

  document.getElementById("btn-gen-meals").onclick = () => {
    const out = document.getElementById("meal-results");
    out.innerHTML = ideas.map(x => `
      <div class="card">
        <div class="text-lg font-extrabold text-gray-800">${escapeHtml(x)}</div>
        <div class="text-sm text-gray-500 mt-1">${t(lang,"recipePlaceholder")}</div>
      </div>
    `).join("");
  };
}

/* ---------------- DASHBOARD (Reports tab) ---------------- */

export function renderDashboard(state, handlers) {
  const lang = state.lang;

  const now = Date.now();
  const inv = state.inventory || [];

  const expiredOrSoon = inv
    .filter(x => x.expiryTs)
    .map(x => ({ ...x, daysLeft: Math.ceil((x.expiryTs - now) / DAY_MS) }))
    .filter(x => x.daysLeft <= 2)
    .sort((a,b)=>a.daysLeft - b.daysLeft);

  const invCount = inv.length;

  const monthlyBudget = Number(state.settings.monthlyBudget ?? 0);
  const spentThisMonth = calcSpentThisMonth(state);
  const remaining = monthlyBudget - spentThisMonth;

  const breakdown = categoryBreakdownThisMonth(state);
  const donut = donutSvg(breakdown);

  mount(`
    <section class="space-y-6">
      <h2 class="text-3xl font-extrabold text-gray-800">${t(lang,"dashboard")}</h2>

      <div class="grid md:grid-cols-2 gap-4">
        <div class="card border-2 border-red-100">
          <div class="flex items-center justify-between">
            <div class="text-lg font-extrabold text-gray-800">${t(lang,"expiredBlockTitle")}</div>
            <span class="text-xs font-black text-red-600">${expiredOrSoon.length}</span>
          </div>
          <div class="mt-3 space-y-2">
            ${expiredOrSoon.length ? expiredOrSoon.slice(0,6).map(x => `
              <div class="flex items-center justify-between text-sm">
                <span class="font-semibold ${x.daysLeft < 0 ? "text-red-700" : "text-orange-700"}">${escapeHtml(x.name)}</span>
                <span class="font-black ${x.daysLeft < 0 ? "text-red-700" : "text-orange-700"}">
                  ${x.daysLeft < 0 ? t(lang,"expired") : `${x.daysLeft} ${t(lang,"daysLeft")}`}
                </span>
              </div>
            `).join("") : `<p class="text-sm text-gray-500">${t(lang,"noExpired")}</p>`}
          </div>
        </div>

        <div class="card border-2 border-emerald-100">
          <div class="flex items-center justify-between">
            <div class="text-lg font-extrabold text-gray-800">${t(lang,"inventoryBlockTitle")}</div>
            <span class="text-xs font-black text-emerald-600">${invCount}</span>
          </div>
          <p class="text-sm text-gray-600 mt-3">${t(lang,"inventoryBlockHint")}</p>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between gap-4 flex-wrap">
          <div class="flex-1">
            <div class="flex items-center justify-between">
              <label class="text-xs font-black text-gray-500 uppercase">${t(lang,"monthlyBudget")}</label>
              <button id="btn-reset-monthly" class="text-xs font-extrabold text-gray-500 hover:text-gray-800">${t(lang,"reset")}</button>
            </div>
            <input id="inp-monthly-budget" type="number" step="0.01" min="0"
              class="mt-2 w-full md:max-w-[280px] p-3 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500"
              value="${escapeAttr(String(monthlyBudget))}">
          </div>

          <div class="text-sm text-gray-700">
            <div>${t(lang,"spentThisMonth")}: <span class="font-black">€${spentThisMonth.toFixed(2)}</span></div>
            <div>${t(lang,"remaining")}: <span class="font-black ${remaining < 0 ? "text-red-600" : "text-emerald-600"}">€${remaining.toFixed(2)}</span></div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-extrabold text-gray-800">${t(lang,"categoryCircleTitle")}</h3>
          <span class="text-xs text-gray-400">${t(lang,"categoryCircleHint")}</span>
        </div>

        <div class="mt-4 flex flex-col md:flex-row gap-6 items-center">
          <div class="w-[220px] h-[220px]">${donut}</div>
          <div class="flex-1 w-full">
            ${Object.keys(breakdown).length ? Object.entries(breakdown).sort((a,b)=>b[1]-a[1]).map(([cat,val]) => `
              <div class="flex items-center justify-between text-sm py-1">
                <span class="font-semibold text-gray-700">${escapeHtml(cat)}</span>
                <span class="font-black text-gray-800">€${val.toFixed(2)}</span>
              </div>
            `).join("") : `<p class="text-sm text-gray-500">${t(lang,"noSpending")}</p>`}
          </div>
        </div>
      </div>
    </section>
  `);

  document.getElementById("btn-reset-monthly").onclick = () => handlers.resetMonthlyBudget();
}

export function wireDashboardBudget(handler) {
  const el = document.getElementById("inp-monthly-budget");
  if (!el) return;
  el.onchange = () => handler(Number(el.value || 0));
}

/* ---------------- Modal (NOW: category + expiry for BOTH) ---------------- */

export function openModal({ lang, mode, listType, item }, onSubmit) {
  const modal = document.getElementById("modal-container");
  const form = document.getElementById("item-form");

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

  const titleId =
    listType === "inventory"
      ? (mode === "add" ? "modalAddInv" : "modalEditInv")
      : (mode === "add" ? "modalAddShop" : "modalEditShop");

  document.getElementById("modal-title").textContent = t(lang, titleId);

  // expiry always visible now (shopping needs it too)
  document.getElementById("expiry-field").classList.remove("hidden");

  document.getElementById("item-id").value = item?.id ?? "";
  document.getElementById("list-type").value = listType;

  document.getElementById("item-name").value = item?.name ?? "";
  document.getElementById("item-category").value = item?.category ?? "general";
  document.getElementById("item-quantity").value = item?.qty ?? 1;
  document.getElementById("item-unit").value = item?.unit ?? "";
  document.getElementById("inp-price").value = item?.priceTotal ?? "";
  document.getElementById("item-shelf-life").value = item?.shelfLifeDays ?? "";

  document.getElementById("btn-cancel").onclick = () => closeModal();

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

/* ---------------- UI pieces ---------------- */

function inventoryCard(lang, it) {
  return `
    <div class="card">
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="text-lg font-extrabold text-gray-800">${escapeHtml(it.name)}</div>
          <div class="text-xs text-gray-500 mt-1">${escapeHtml(it.category || "general")} • ${escapeHtml(String(it.qty))} ${escapeHtml(it.unit || "")}</div>
          <div class="text-sm mt-2 text-gray-700">
            <span class="font-black">€${Number(it.priceTotal || 0).toFixed(2)}</span>
            ${it.expiryTs ? ` • ${formatExpiry(lang, it.expiryTs)}` : ""}
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <button id="edit-inv-${it.id}" class="px-3 py-1 rounded-xl bg-gray-100 font-extrabold text-xs hover:bg-gray-200">${t(lang,"edit")}</button>
          <button id="del-inv-${it.id}" class="px-3 py-1 rounded-xl bg-red-50 font-extrabold text-xs text-red-700 hover:bg-red-100">${t(lang,"delete")}</button>
        </div>
      </div>
    </div>
  `;
}

function shoppingRow(lang, it) {
  return `
    <div class="card">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <button id="buy-${it.id}" class="w-10 h-10 rounded-2xl border-2 ${it.bought ? "border-emerald-500 bg-emerald-50" : "border-gray-200 bg-white"} flex items-center justify-center">
            <span class="${it.bought ? "text-emerald-700 font-black" : "text-gray-400 font-black"}">✓</span>
          </button>
          <div>
            <div class="text-lg font-extrabold text-gray-800">${escapeHtml(it.name)}</div>
            <div class="text-xs text-gray-500 mt-1">
              ${escapeHtml(it.category || "general")} • ${escapeHtml(String(it.qty))} ${escapeHtml(it.unit || "")}
              ${it.shelfLifeDays ? ` • ${t(lang,"expiryIn")} ${escapeHtml(String(it.shelfLifeDays))} ${t(lang,"days")}` : ""}
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="text-right">
            <div class="text-sm text-gray-500">${t(lang,"price")}</div>
            <div class="text-lg font-black text-gray-800">€${Number(it.priceTotal || 0).toFixed(2)}</div>
          </div>
          <div class="flex flex-col gap-2">
            <button id="edit-shop-${it.id}" class="px-3 py-1 rounded-xl bg-gray-100 font-extrabold text-xs hover:bg-gray-200">${t(lang,"edit")}</button>
            <button id="del-shop-${it.id}" class="px-3 py-1 rounded-xl bg-red-50 font-extrabold text-xs text-red-700 hover:bg-red-100">${t(lang,"delete")}</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function emptyWideCard(lang, text) {
  return `<div class="card text-center text-gray-500">${escapeHtml(text)}</div>`;
}

function mount(html) {
  document.getElementById("content-area").innerHTML = html;
}

/* ---------------- Calculations ---------------- */

const DAY_MS = 1000 * 60 * 60 * 24;

function sum(arr) {
  return arr.reduce((a,b)=>a+Number(b||0),0);
}

function clamp(x, min, max) {
  return Math.max(min, Math.min(max, x));
}

function budgetStatus(budget, planned) {
  if (budget <= 0) return "ok";
  const ratio = planned / budget;
  if (ratio >= 1) return "over";
  if (ratio >= 0.8) return "warn";
  return "ok";
}

function calcSpentThisMonth(state) {
  const now = new Date();
  const m = now.getMonth();
  const y = now.getFullYear();

  // inventory items added this month (including moved from shopping)
  const inv = (state.inventory || []).filter(it => {
    const d = new Date(it.createdAtTs ?? 0);
    return d.getMonth() === m && d.getFullYear() === y;
  });

  return sum(inv.map(x => x.priceTotal ?? 0));
}

function categoryBreakdownThisMonth(state) {
  const out = {};
  const now = new Date();
  const m = now.getMonth();
  const y = now.getFullYear();

  for (const it of (state.inventory || [])) {
    const d = new Date(it.createdAtTs ?? 0);
    if (d.getMonth() !== m || d.getFullYear() !== y) continue;

    const cat = it.category ?? "general";
    out[cat] = (out[cat] || 0) + Number(it.priceTotal || 0);
  }
  return out;
}

/* ---------------- Donut chart (SVG) ---------------- */

function donutSvg(breakdown) {
  const entries = Object.entries(breakdown);
  const total = entries.reduce((a, [,v]) => a + v, 0);

  const size = 220;
  const r = 80;
  const cx = size/2;
  const cy = size/2;
  const stroke = 22;
  const C = 2 * Math.PI * r;

  if (!entries.length || total <= 0) {
    return `
      <svg viewBox="0 0 ${size} ${size}" width="220" height="220">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#e5e7eb" stroke-width="${stroke}"></circle>
        <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-size="14" fill="#6b7280" font-weight="700">
          No data
        </text>
      </svg>
    `;
  }

  // simple palette
  const colors = ["#10b981","#60a5fa","#f59e0b","#ef4444","#a78bfa","#14b8a6","#fb7185","#22c55e"];
  let offset = 0;

  const slices = entries
    .sort((a,b)=>b[1]-a[1])
    .slice(0, 6);

  const circles = slices.map(([cat, val], i) => {
    const frac = val / total;
    const len = frac * C;
    const dash = `${len} ${C - len}`;
    const el = `
      <circle cx="${cx}" cy="${cy}" r="${r}"
        fill="none"
        stroke="${colors[i % colors.length]}"
        stroke-width="${stroke}"
        stroke-dasharray="${dash}"
        stroke-dashoffset="${-offset}"
        stroke-linecap="butt"
        transform="rotate(-90 ${cx} ${cy})"
      ></circle>
    `;
    offset += len;
    return el;
  }).join("");

  return `
    <svg viewBox="0 0 ${size} ${size}" width="220" height="220">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#eef2f7" stroke-width="${stroke}"></circle>
      ${circles}
      <circle cx="${cx}" cy="${cy}" r="${r-28}" fill="white"></circle>
      <text x="${cx}" y="${cy-6}" text-anchor="middle" dominant-baseline="middle" font-size="12" fill="#6b7280" font-weight="800">Total</text>
      <text x="${cx}" y="${cy+14}" text-anchor="middle" dominant-baseline="middle" font-size="16" fill="#111827" font-weight="900">€${total.toFixed(0)}</text>
    </svg>
  `;
}

/* ---------------- Expiry formatting ---------------- */

function formatExpiry(lang, expiryTs) {
  const date = new Date(expiryTs).toLocaleDateString(
    lang === "de" ? "de-DE" : lang === "it" ? "it-IT" : "en-GB"
  );

  const days = Math.ceil((expiryTs - Date.now()) / DAY_MS);
  if (days < 0) return `<span class="text-red-600 font-black">${t(lang,"expired")} • ${date}</span>`;
  if (days <= 2) return `<span class="text-orange-600 font-black">${date} • ${days} ${t(lang,"daysLeft")}</span>`;
  return `<span class="text-emerald-700 font-black">${date} • ${days} ${t(lang,"daysLeft")}</span>`;
}

/* ---------------- Escaping ---------------- */

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