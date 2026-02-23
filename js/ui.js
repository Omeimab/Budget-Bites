export function setHeaderText(t) {
  document.getElementById("app-subtitle").innerText = t.subtitle;
  document.getElementById("user-info").innerText = t.initializing;
  document.getElementById("loading-message").innerText = t.initializing;

  document.getElementById("nav-inventory").innerText = t.inventory;
  document.getElementById("nav-shopping").innerText = t.shopping;
  document.getElementById("nav-planner").innerText = t.planner;
  document.getElementById("nav-reports").innerText = t.dashboard;
}

export function setOnlineState(t) {
  document.getElementById("user-info").textContent = t.ready;
  const spinner = document.getElementById("sync-spinner");
  if (spinner) spinner.style.display = "none";
}

export function setActiveTab(activeTab) {
  document.getElementById("nav-inventory").classList.toggle("active", activeTab === "inventory");
  document.getElementById("nav-shopping").classList.toggle("active", activeTab === "shopping");
  document.getElementById("nav-planner").classList.toggle("active", activeTab === "planner");
  document.getElementById("nav-reports").classList.toggle("active", activeTab === "reports");
}

export function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const el = document.createElement("div");
  const base = "px-4 py-3 rounded-xl shadow-lg text-sm font-bold border bg-white flex items-center gap-2";
  const variant =
    type === "error"
      ? "border-rose-200 text-rose-700"
      : type === "warn"
      ? "border-amber-200 text-amber-800"
      : "border-emerald-200 text-emerald-700";

  el.className = `${base} ${variant}`;
  el.textContent = message;

  container.appendChild(el);

  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transition = "opacity 0.25s ease";
  }, 2200);

  setTimeout(() => el.remove(), 2600);
}

export function openModal(t, type, item) {
  const form = document.getElementById("item-form");
  form.reset();

  document.getElementById("list-type").value = type;
  document.getElementById("item-id").value = item ? item.id : "";

  const title =
    type === "inventory"
      ? (item ? t.modalEditInv : t.modalAddInv)
      : (item ? t.modalEditShop : t.modalAddShop);

  document.getElementById("modal-title").innerText = title;

  document.getElementById("lbl-name").innerText = t.name;
  document.getElementById("lbl-category").innerText = t.category;
  document.getElementById("lbl-qty").innerText = t.qty;
  document.getElementById("lbl-unit").innerText = t.unit;
  document.getElementById("lbl-price").innerText = t.totalPrice;
  document.getElementById("price-hint").innerText = t.priceHint;
  document.getElementById("lbl-expiry").innerText = t.shelfLife;
  document.getElementById("expiry-hint").innerText = t.expiryHint;

  // fill
  document.getElementById("item-name").value = item?.name ?? "";
  document.getElementById("item-quantity").value = item?.quantity ?? 1;
  document.getElementById("item-unit").value = item?.unit ?? "";

  const cat = document.getElementById("item-category");
  if (cat) cat.value = item?.category || "general";

  const inpPrice = document.getElementById("inp-price");
  if (inpPrice) inpPrice.value = item?.price ?? "";

  const shelf = document.getElementById("item-shelf-life");
  if (shelf) shelf.value = item?.shelfLifeDays ?? "";

  document.getElementById("btn-save").innerText = t.save;
  document.getElementById("btn-cancel").innerText = t.cancel;

  document.getElementById("expiry-field").classList.remove("hidden");
  document.getElementById("modal-container").classList.replace("hidden", "flex");
}

export function closeModal() {
  document.getElementById("modal-container").classList.replace("flex", "hidden");
}

export function renderUI({
  t,
  activeTab,
  inventory,
  shoppingList,
  historicalWaste,
  monthlyBudget,
  monthSpent,
  monthPurchases,
  tripBudget,

  onAdd,
  onMove,
  onDelete,
  onEmpty,
  onSuggest,
  onRecipe,
  onSaveBudget,
  onResetSpent,

  onSaveTripBudget,
  onResetTripBudget,

  onClearAllInventory,
  onClearAllShopping,
  onResetAll
}) {
  const root = document.getElementById("content-area");
  setActiveTab(activeTab);

  const spent = Number(monthSpent || 0);
  const budget = Number(monthlyBudget || 0);
  const remaining = budget > 0 ? budget - spent : 0;
  const pct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
  const overBy = budget > 0 ? Math.max(0, spent - budget) : 0;

  const budgetWidget = () => `
    <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
      <div class="flex items-center justify-between">
        <p class="text-xs font-black text-slate-500 uppercase tracking-widest">${t.monthlyBudget}</p>
        <p class="text-sm font-black text-slate-700">${formatMoney(spent)} <span class="text-slate-400 font-semibold">${t.spentThisMonth}</span></p>
      </div>

      <div class="mt-3 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div class="h-2 bg-emerald-500" style="width:${pct}%; transition: width .25s ease;"></div>
      </div>

      <div class="mt-2 flex items-center justify-between text-xs font-semibold text-slate-500">
        <span>${pct}%</span>
        <span>
          ${
            budget > 0
              ? (remaining >= 0
                  ? `${formatMoney(remaining)} ${t.remaining}`
                  : `${formatMoney(overBy)} ${t.budgetOver}`)
              : t.setMonthlyBudget
          }
        </span>
      </div>

      ${
        budget > 0 && remaining <= budget * 0.1 && remaining >= 0
          ? `<div class="mt-3 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">${t.budgetWarn}</div>`
          : ""
      }
      ${
        budget > 0 && remaining < 0
          ? `<div class="mt-3 text-xs font-black text-rose-700 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">${t.budgetOver}</div>`
          : ""
      }

      <div class="mt-4 flex gap-3 items-end">
        <div class="flex-1">
          <p class="text-sm font-bold mb-1">${t.setMonthlyBudget}</p>
          <input id="inp-budget" type="number" min="0" step="1"
            class="w-full border rounded-lg p-3"
            placeholder="e.g. 300"
            value="${budget > 0 ? String(budget) : ""}"
          />
        </div>
        <button id="btn-save-budget"
          class="bg-emerald-500 text-white px-6 py-3 rounded-xl font-black shadow-md hover:bg-emerald-600">
          ${t.save}
        </button>
      </div>

      <div class="mt-3 flex flex-wrap gap-3">
        <button id="btn-reset-month" class="text-xs text-red-500 font-bold hover:underline">
          ${t.resetMonthly}
        </button>
        <button id="btn-reset-all" class="text-xs text-slate-500 font-bold hover:underline">
          ${t.resetAll}
        </button>
      </div>

      <p class="mt-2 text-xs text-slate-500">${t.monthTip}</p>
    </div>
  `;

  const tripBudgetWidget = () => {
    const planned = sum(shoppingList.map(i => Number(i.price || 0)));
    const b = Number(tripBudget || 0);
    const left = b - planned;
    const ratio = b > 0 ? planned / b : 0;

    const status = ratio >= 1 ? "over" : ratio >= 0.85 ? "warn" : "ok";
    const pct = b > 0 ? Math.min(120, Math.round(ratio * 100)) : 0;

    const barClass =
      status === "over" ? "bg-rose-500" : status === "warn" ? "bg-amber-400" : "bg-emerald-500";

    const msg =
      status === "over" ? t.budgetOver : status === "warn" ? t.budgetWarn : t.budgetOk;

    return `
      <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
        <div class="flex items-center justify-between">
          <p class="text-xs font-black text-slate-500 uppercase tracking-widest">${t.tripBudgetShort}</p>
          <p class="text-sm font-black text-slate-700">${formatMoney(planned)} <span class="text-slate-400 font-semibold">${t.plannedSpend}</span></p>
        </div>

        <div class="mt-3 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div class="h-2 ${barClass}" style="width:${pct}%; transition: width .25s ease;"></div>
        </div>

        <div class="mt-2 flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>${pct}%</span>
          <span class="${left < 0 ? "text-rose-600 font-black" : "text-emerald-600 font-black"}">
            ${left >= 0 ? `${formatMoney(left)} ${t.remaining}` : `${formatMoney(Math.abs(left))} ${t.budgetOver}`}
          </span>
        </div>

        <div class="mt-3 text-xs font-bold ${status === "over" ? "text-rose-700 bg-rose-50 border-rose-100" : status === "warn" ? "text-amber-800 bg-amber-50 border-amber-100" : "text-emerald-700 bg-emerald-50 border-emerald-100"} border rounded-lg px-3 py-2">
          ${msg}
        </div>

        <div class="mt-4 flex gap-3 items-end">
          <div class="flex-1">
            <p class="text-sm font-bold mb-1">${t.setTripBudget}</p>
            <input id="inp-trip" type="number" min="0" step="1"
              class="w-full border rounded-lg p-3"
              placeholder="e.g. 50"
              value="${b > 0 ? String(b) : ""}"
            />
          </div>
          <button id="btn-save-trip"
            class="bg-slate-900 text-white px-6 py-3 rounded-xl font-black shadow-md hover:bg-slate-800">
            ${t.save}
          </button>
        </div>

        <div class="mt-3">
          <button id="btn-reset-trip" class="text-xs text-slate-500 font-bold hover:underline">
            ${t.resetTripBudget}
          </button>
        </div>
      </div>
    `;
  };

  // INVENTORY
  if (activeTab === "inventory") {
    root.innerHTML = `
      <div class="card">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-800">${t.inventory}</h2>
          <div class="flex gap-2">
            <button id="btn-clear-inv" class="bg-slate-100 text-slate-700 px-4 py-2 rounded-full font-bold">
              ${t.clearAll}
            </button>
            <button id="btn-add-inv" class="bg-emerald-500 text-white px-6 py-2 rounded-full font-bold shadow-md hover:bg-emerald-600 transition-colors">
              + ${t.addInventory}
            </button>
          </div>
        </div>

        <div class="space-y-3">
          ${
            inventory.map(i => {
              const exp = i.expiry ? i.expiry : "—";
              const badge = expiryBadge(exp, t);

              return `
                <div class="flex justify-between p-4 border rounded-xl items-center bg-white shadow-sm hover:border-emerald-200 transition-all">
                  <div>
                    <p class="font-bold text-gray-800">${escapeHtml(i.name)}</p>
                    <p class="text-xs text-gray-400 font-semibold">
                      ${escapeHtml(i.category || "general")} • ${i.quantity} ${escapeHtml(i.unit || "")}
                      ${i.price != null && i.price !== "" ? ` • ${formatMoney(i.price)}` : ""}
                    </p>
                    <div class="mt-1 text-xs font-bold">${badge}</div>
                  </div>
                  <div class="flex gap-3 items-center">
                    <button data-move="${i.id}" class="text-xs font-bold text-amber-600 uppercase tracking-tighter">${t.shopping}</button>
                    <button data-empty="${i.id}" class="text-xs font-bold text-rose-600 uppercase tracking-tighter">${t.empty}</button>
                    <button data-del="${i.id}" class="text-xs text-red-400 font-bold uppercase tracking-tighter">X</button>
                  </div>
                </div>
              `;
            }).join("") || `<p class="text-center italic text-gray-400 py-10 font-medium">${t.emptyInventory}</p>`
          }
        </div>
      </div>
    `;

    document.getElementById("btn-add-inv").onclick = () => onAdd("inventory");
    document.getElementById("btn-clear-inv").onclick = () => onClearAllInventory();
    root.querySelectorAll("[data-move]").forEach(btn => btn.onclick = () => onMove(btn.dataset.move, "inventory"));
    root.querySelectorAll("[data-empty]").forEach(btn => btn.onclick = () => onEmpty(btn.dataset.empty));
    root.querySelectorAll("[data-del]").forEach(btn => btn.onclick = () => onDelete("inventory", btn.dataset.del));
    return;
  }

  // SHOPPING
  if (activeTab === "shopping") {
    root.innerHTML = `
      <div class="card">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-800">${t.shopping}</h2>
          <div class="flex gap-2">
            <button id="btn-clear-shop" class="bg-slate-100 text-slate-700 px-4 py-2 rounded-full font-bold">
              ${t.clearAll}
            </button>
            <button id="btn-add-shop" class="bg-emerald-500 text-white px-6 py-2 rounded-full font-bold shadow-md">
              + ${t.addShopping}
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          ${tripBudgetWidget()}
          ${budgetWidget()}
        </div>

        <div class="space-y-3 mt-6 mb-6">
          ${
            shoppingList.map(i => `
              <div class="flex justify-between p-4 border rounded-xl bg-white items-center border-slate-100 shadow-sm hover:border-emerald-200 transition-all">
                <div>
                  <p class="font-bold text-gray-800">${escapeHtml(i.name)}</p>
                  <p class="text-xs text-slate-500 font-semibold">
                    ${escapeHtml(i.category || "general")} • ${i.quantity} ${escapeHtml(i.unit || "")}
                    ${i.shelfLifeDays ? ` • ${t.expiryIn} ${i.shelfLifeDays} ${t.days}` : ""}
                  </p>
                  <p class="text-xs text-slate-500 font-semibold mt-1">
                    ${i.price != null && i.price !== "" ? `${t.total}: ${formatMoney(i.price)}` : t.noPrice}
                  </p>
                </div>

                <div class="flex gap-2 items-center">
                  <button data-del="${i.id}" class="text-xs font-black text-slate-500 hover:underline">
                    ${t.remove}
                  </button>

                  <button data-move="${i.id}"
                    class="bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-black shadow-sm uppercase tracking-widest hover:bg-emerald-600 active:scale-[0.98] transition">
                    ${t.bought}
                  </button>
                </div>
              </div>
            `).join("") || `<p class="text-center italic text-gray-400 py-10 font-medium">${t.emptyShopping}</p>`
          }
        </div>

        <div class="bg-indigo-50 p-5 rounded-xl border border-indigo-100 shadow-inner">
          <button id="btn-suggest" class="text-xs bg-indigo-600 text-white px-4 py-2 rounded font-black mb-2 uppercase tracking-widest shadow-md">
            ${t.generateRecipes}
          </button>
          <div id="ai-out" class="text-xs italic text-indigo-700 leading-relaxed font-medium"></div>
        </div>
      </div>
    `;

    document.getElementById("btn-add-shop").onclick = () => onAdd("shopping");
    document.getElementById("btn-clear-shop").onclick = () => onClearAllShopping();

    root.querySelectorAll("[data-move]").forEach(btn => btn.onclick = () => onMove(btn.dataset.move, "shopping"));
    root.querySelectorAll("[data-del]").forEach(btn => btn.onclick = () => onDelete("shopping", btn.dataset.del));
    document.getElementById("btn-suggest").onclick = () => onSuggest();

    document.getElementById("btn-save-budget").onclick = () => onSaveBudget(document.getElementById("inp-budget").value);
    document.getElementById("btn-reset-month").onclick = () => onResetSpent();
    document.getElementById("btn-reset-all").onclick = () => onResetAll();

    document.getElementById("btn-save-trip").onclick = () => onSaveTripBudget(document.getElementById("inp-trip").value);
    document.getElementById("btn-reset-trip").onclick = () => onResetTripBudget();

    return;
  }

  // PLANNER
  if (activeTab === "planner") {
    root.innerHTML = `
      <div class="card text-center py-10">
        <h2 class="text-2xl font-bold mb-4 text-gray-800">${t.planner}</h2>
        <p class="text-gray-500 mb-8 max-w-sm mx-auto font-medium">${t.plannerHint}</p>
        <button id="btn-recipe" class="bg-purple-600 text-white px-10 py-3 rounded-full font-extrabold shadow-lg shadow-purple-200 hover:scale-105 transition-transform uppercase tracking-widest text-xs">
          ${t.generateRecipes}
        </button>
        <div id="ai-recipe-out" class="mt-8 p-6 bg-slate-50 text-left text-sm whitespace-pre-wrap rounded-2xl border-2 border-slate-100 leading-relaxed text-slate-700">
          ${t.recipePlaceholder}
        </div>
      </div>
    `;
    document.getElementById("btn-recipe").onclick = () => onRecipe();
    return;
  }

  // DASHBOARD
  const urgent = getExpiredOrSoon(inventory);
  const purchases = Array.isArray(monthPurchases) ? monthPurchases : [];
  const byCategory = groupByCategory(purchases);
  const donut = donutSvg(byCategory);

  root.innerHTML = `
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div class="card bg-rose-50 border-2 border-rose-100 shadow-none">
        <div class="flex items-center justify-between">
          <p class="text-xs font-black text-rose-600 uppercase tracking-widest">${t.expiredBlockTitle}</p>
          <span class="text-xs font-black text-rose-700">${urgent.length}</span>
        </div>
        <div class="mt-3 space-y-2">
          ${
            urgent.length === 0
              ? `<p class="text-sm text-rose-700/70 italic">${t.noExpired}</p>`
              : urgent.slice(0, 6).map(x => `
                <div class="flex items-center justify-between bg-white/60 border border-rose-100 rounded-xl px-4 py-2">
                  <div class="text-sm font-bold text-rose-900">${escapeHtml(x.name)}</div>
                  <div class="text-xs font-black text-rose-700">${escapeHtml(x.badge)}</div>
                </div>
              `).join("")
          }
        </div>
      </div>

      <div class="card text-center bg-emerald-50 border-2 border-emerald-100 shadow-none">
        <p class="text-xs font-black text-emerald-600 uppercase tracking-widest mb-2">${t.inventoryBlockTitle}</p>
        <h3 class="text-6xl font-black text-emerald-900">${inventory.length}</h3>
        <p class="text-xs text-emerald-700/70 font-semibold mt-2">${t.inventoryBlockHint}</p>
      </div>
    </div>

    <div class="mt-6">${budgetWidget()}</div>

    <div class="mt-6 card">
      <div class="flex items-center justify-between">
        <p class="text-xs font-black text-slate-500 uppercase tracking-widest">${t.categoryCircleTitle}</p>
        <p class="text-xs text-slate-400 font-semibold">${t.categoryCircleHint}</p>
      </div>

      <div class="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div class="flex justify-center">${donut}</div>
        <div>
          ${
            Object.keys(byCategory).length === 0
              ? `<p class="text-sm text-slate-400 italic">${t.noSpending}</p>`
              : Object.entries(byCategory)
                  .sort((a,b)=>b[1]-a[1])
                  .map(([k,v]) => `
                    <div class="flex items-center justify-between border rounded-xl px-4 py-3 mb-2">
                      <div class="text-sm font-bold text-slate-700">${escapeHtml(k)}</div>
                      <div class="text-sm font-black text-slate-800">${formatMoney(v)}</div>
                    </div>
                  `).join("")
          }
        </div>
      </div>
    </div>
  `;

  document.getElementById("btn-save-budget").onclick = () => onSaveBudget(document.getElementById("inp-budget").value);
  document.getElementById("btn-reset-month").onclick = () => onResetSpent();
  document.getElementById("btn-reset-all").onclick = () => onResetAll();
}

/* helpers */
function sum(arr) { return arr.reduce((a,b)=>a+Number(b||0),0); }
function formatMoney(v) { const n = Number(v || 0); return `€${n.toFixed(2)}`; }

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function expiryBadge(iso, t) {
  if (!iso || iso === "PENDING") return `<span class="text-slate-400">Expiry: —</span>`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return `<span class="text-slate-400">Expiry: —</span>`;

  const now = new Date();
  const diffDays = Math.ceil((d - now) / (1000*60*60*24));

  if (diffDays < 0) return `<span class="text-rose-700 bg-rose-50 border border-rose-100 px-2 py-1 rounded-lg">${t.expired}</span>`;
  if (diffDays <= 2) return `<span class="text-amber-800 bg-amber-50 border border-amber-100 px-2 py-1 rounded-lg">${diffDays} ${t.daysLeft}</span>`;
  return `<span class="text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">${diffDays} ${t.daysLeft}</span>`;
}

function getExpiredOrSoon(inventory) {
  const out = [];
  const now = new Date();

  for (const i of inventory) {
    if (!i.expiry || i.expiry === "PENDING") continue;
    const d = new Date(i.expiry);
    if (Number.isNaN(d.getTime())) continue;

    const diffDays = Math.ceil((d - now) / (1000*60*60*24));
    if (diffDays < 0) out.push({ name: i.name, badge: "Expired" });
    else if (diffDays <= 2) out.push({ name: i.name, badge: `${diffDays} days left` });
  }
  return out;
}

function groupByCategory(purchases) {
  const out = {};
  for (const p of purchases) {
    const cat = p.category || "general";
    const cost = Number(p.cost || 0);
    out[cat] = (out[cat] || 0) + cost;
  }
  return out;
}

function donutSvg(map) {
  const entries = Object.entries(map);
  const total = entries.reduce((a, [,v]) => a + v, 0);

  const size = 220, r = 78, cx = size/2, cy = size/2, stroke = 22;
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

  const colors = ["#10b981","#60a5fa","#f59e0b","#ef4444","#a78bfa","#14b8a6","#fb7185","#22c55e"];
  let offset = 0;

  const slices = entries.sort((a,b)=>b[1]-a[1]).slice(0,6);

  const circles = slices.map(([_,val], idx) => {
    const frac = val / total;
    const len = frac * C;
    const dash = `${len} ${C - len}`;
    const el = `
      <circle cx="${cx}" cy="${cy}" r="${r}"
        fill="none"
        stroke="${colors[idx % colors.length]}"
        stroke-width="${stroke}"
        stroke-dasharray="${dash}"
        stroke-dashoffset="${-offset}"
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
  //hello
}