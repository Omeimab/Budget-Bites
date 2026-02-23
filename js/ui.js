export function setHeaderText(t) {
  document.getElementById("app-subtitle").innerText = t.subtitle;
  document.getElementById("user-info").innerText = t.connecting;
  document.getElementById("loading-message").innerText = t.loading;

  document.getElementById("nav-inventory").innerText = t.nav_inv;
  document.getElementById("nav-shopping").innerText = t.nav_shop;
  document.getElementById("nav-planner").innerText = t.nav_plan;
  document.getElementById("nav-reports").innerText = t.nav_rep || t.nav_dash;
}

export function setOnlineState(t) {
  document.getElementById("user-info").textContent = t.active;
  document.getElementById("sync-spinner").style.display = "none";
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
  el.className =
    "px-4 py-3 rounded-xl shadow-lg text-sm font-bold border " +
    (type === "error"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : type === "warn"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : "bg-emerald-50 text-emerald-800 border-emerald-200");

  el.textContent = message;
  container.appendChild(el);

  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transition = "opacity 0.25s ease";
    setTimeout(() => el.remove(), 250);
  }, 1800);
}

export function openModal(t, type, item) {
  const form = document.getElementById("item-form");
  form.reset();

  document.getElementById("list-type").value = type;
  document.getElementById("item-id").value = item ? item.id : "";

  document.getElementById("modal-title").innerText = item ? t.edit : t.add;
  document.getElementById("lbl-name").innerText = t.name;
  document.getElementById("lbl-qty").innerText = t.qty;
  document.getElementById("lbl-unit").innerText = t.unit;
  document.getElementById("lbl-expiry-date").innerText = t.lbl_expiry_date || t.expiry_logic;

  // Sync Price & Category from i18n
  const lblPrice = document.getElementById("lbl-price");
  if (lblPrice) lblPrice.innerText = t.lbl_price || "Price";

  const inpPrice = document.getElementById("inp-price");
  if (inpPrice) inpPrice.value = item?.price ?? "";

  const inpCat = document.getElementById("inp-category");
  if (inpCat) inpCat.value = item?.category ?? "";

  // Fix: Ensure we use the correct ID for the new date input
  const dateInp = document.getElementById("item-expiry-date");
  if (dateInp) dateInp.value = item?.expiry ?? "";

  document.getElementById("btn-save").innerText = t.save;
  document.getElementById("btn-cancel").innerText = t.cancel;

  // Match the HTML container ID
  const expiryField = document.getElementById("expiry-date-container");
  if (expiryField) expiryField.classList.toggle("hidden", type !== "inventory");
  
  document.getElementById("modal-container").classList.replace("hidden", "flex");
}

export function closeModal() {
  document.getElementById("modal-container").classList.replace("flex", "hidden");
}

function formatMoney(v) {
  const n = Number(v || 0);
  return `€${n.toFixed(2)}`;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function spendByCategory(shoppingList) {
  const map = {};
  for (const it of shoppingList) {
    const cat = (it.category || "other").trim() || "other";
    const price = Number(it.price || 0);
    map[cat] = (map[cat] || 0) + price;
  }
  return map;
}

export function renderUI(state) {
  const {
    t, lang, activeTab, inventory, shoppingList,
    historicalWaste, monthlyBudget, monthSpent,
    onAdd, onMove, onDelete, onDeleteShopping,
    onClearInventory, onClearShopping, onResetAll,
    onSuggest, onRecipe, onSaveBudget, onResetSpent
  } = state;

  const root = document.getElementById("content-area");
  setActiveTab(activeTab);

  const spent = Number(monthSpent || 0);
  const budget = Number(monthlyBudget || 0);
  const remainingRaw = budget - spent;
  const remaining = Math.max(0, remainingRaw);
  const pct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
  const isOver = budget > 0 && spent > budget;

  const budgetWidget = () => `
    <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm mb-6">
      <div class="flex items-center justify-between">
        <p class="text-xs font-black text-slate-500 uppercase tracking-widest">${t.budget || 'Budget'}</p>
        <p class="text-sm font-black text-slate-700">${formatMoney(spent)} <span class="text-slate-400 font-semibold">${t.spent || 'spent'}</span></p>
      </div>
      <div class="mt-3 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div class="h-2 ${isOver ? "bg-rose-500" : "bg-emerald-500"}" style="width:${pct}%"></div>
      </div>
      <div class="mt-2 flex items-center justify-between text-xs font-semibold text-slate-500">
        <span>${pct}%</span>
        <span>${budget > 0 ? `${formatMoney(remaining)} ${t.remaining || 'remaining'}` : 'Set budget'}</span>
      </div>
      <div class="mt-4 flex gap-3 items-center">
        <input id="inp-budget" type="number" class="flex-1 border rounded-lg p-2 text-sm" placeholder="e.g. 300" value="${budget || ''}" />
        <button id="btn-save-budget" class="bg-emerald-500 text-white px-4 py-2 rounded-lg font-black text-xs uppercase">${t.save}</button>
      </div>
    </div>
  `;

  // --- INVENTORY ---
  if (activeTab === "inventory") {
    root.innerHTML = `
      <div class="card">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-black text-gray-800">${t.nav_inv}</h2>
          <div class="flex gap-2">
            <button id="btn-clear-inv" class="text-[10px] font-bold text-red-400 uppercase">${t.btn_clear || 'Clear'}</button>
            <button id="btn-add-inv" class="bg-emerald-500 text-white px-5 py-2 rounded-xl font-bold shadow-md">+ ${t.add}</button>
          </div>
        </div>
        <div class="space-y-3">
          ${inventory.map(i => `
            <div class="flex justify-between p-4 border rounded-xl items-center bg-white hover:border-emerald-200 transition-all">
              <div>
                <p class="font-bold text-gray-800">${escapeHtml(i.name)}</p>
                <p class="text-[10px] text-gray-400 font-bold uppercase">
                  ${i.quantity} ${escapeHtml(i.unit || "")} • ${i.expiry || "—"}
                  ${i.category ? ` • ${escapeHtml(i.category)}` : ""}
                </p>
              </div>
              <div class="flex gap-4">
                <button data-move="${i.id}" class="text-[10px] font-black text-amber-500 uppercase">${t.move_need}</button>
                <button data-del="${i.id}" class="text-gray-300 hover:text-red-500 font-bold">✕</button>
              </div>
            </div>
          `).join("") || `<p class="text-center py-10 text-gray-300 italic">${t.empty_inv}</p>`}
        </div>
      </div>
    `;
    document.getElementById("btn-add-inv").onclick = () => onAdd("inventory");
    document.getElementById("btn-clear-inv").onclick = () => onClearInventory();
    root.querySelectorAll("[data-move]").forEach(btn => (btn.onclick = () => onMove(btn.dataset.move, "inventory")));
    root.querySelectorAll("[data-del]").forEach(btn => (btn.onclick = () => onDelete("inventory", btn.dataset.del)));
    return;
  }

  // --- SHOPPING ---
  if (activeTab === "shopping") {
    root.innerHTML = `
      <div class="card">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-black text-gray-800">${t.nav_shop}</h2>
          <div class="flex gap-2">
            <button id="btn-clear-shop" class="text-[10px] font-bold text-red-400 uppercase">${t.btn_clear || 'Clear'}</button>
            <button id="btn-add-shop" class="bg-emerald-500 text-white px-5 py-2 rounded-xl font-bold shadow-md">+ ${t.add}</button>
          </div>
        </div>
        ${budgetWidget()}
        <div class="space-y-3">
          ${shoppingList.map(i => `
            <div class="flex justify-between p-4 border rounded-xl bg-white border-slate-100 items-center">
              <div>
                <p class="font-bold text-gray-800">${escapeHtml(i.name)}</p>
                <p class="text-[10px] text-slate-400 font-bold uppercase">
                  ${i.quantity} ${escapeHtml(i.unit || "")} ${i.price ? `• ${formatMoney(i.price)}` : ""}
                </p>
              </div>
              <div class="flex items-center gap-3">
                <button data-delshop="${i.id}" class="text-[10px] font-bold text-slate-300 hover:text-red-500 uppercase">✕</button>
                <button data-move="${i.id}" class="bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest">
                  ${t.bought || t.move_bought}
                </button>
              </div>
            </div>
          `).join("") || `<p class="text-center py-10 text-gray-300 italic">${t.empty_shop}</p>`}
        </div>
        <div class="mt-6 bg-indigo-50 p-4 rounded-xl">
           <button id="btn-suggest" class="text-[10px] bg-indigo-600 text-white px-3 py-1.5 rounded font-black uppercase mb-2">${t.sugg_btn}</button>
           <div id="ai-out" class="text-[10px] italic text-indigo-700 font-medium">${t.sugg_info}</div>
        </div>
      </div>
    `;
    document.getElementById("btn-add-shop").onclick = () => onAdd("shopping");
    document.getElementById("btn-clear-shop").onclick = () => onClearShopping();
    document.getElementById("btn-suggest").onclick = () => onSuggest();
    root.querySelectorAll("[data-move]").forEach(btn => (btn.onclick = () => onMove(btn.dataset.move, "shopping")));
    root.querySelectorAll("[data-delshop]").forEach(btn => (btn.onclick = () => onDeleteShopping(btn.dataset.delshop)));
    document.getElementById("btn-save-budget").onclick = () => onSaveBudget(document.getElementById("inp-budget").value);
    return;
  }

  // --- PLANNER ---
  if (activeTab === "planner") {
    root.innerHTML = `
      <div class="card text-center py-10">
        <h2 class="text-2xl font-black mb-4 text-gray-800">${t.nav_plan}</h2>
        <p class="text-xs text-gray-500 mb-8 max-w-sm mx-auto font-bold uppercase tracking-widest">${t.recipe_info}</p>
        <button id="btn-recipe" class="bg-purple-600 text-white px-10 py-3 rounded-full font-black shadow-lg uppercase tracking-widest text-xs">
          ${t.recipe_btn}
        </button>
        <div id="ai-recipe-out" class="mt-8 p-6 bg-slate-50 text-left text-sm whitespace-pre-wrap rounded-2xl border border-slate-100 leading-relaxed text-slate-700"></div>
      </div>
    `;
    document.getElementById("btn-recipe").onclick = () => onRecipe();
    return;
  }

  // --- REPORTS/DASHBOARD ---
  const byCat = spendByCategory(shoppingList);
  const topCats = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 5);

  root.innerHTML = `
    <div class="grid grid-cols-2 gap-4 mb-6">
      <div class="card bg-rose-50 border-rose-100 text-center">
        <p class="text-[10px] font-black text-rose-600 uppercase mb-1">${t.stat_waste}</p>
        <h3 class="text-4xl font-black text-rose-900">${historicalWaste}</h3>
      </div>
      <div class="card bg-emerald-50 border-emerald-100 text-center">
        <p class="text-[10px] font-black text-emerald-600 uppercase mb-1">${t.stat_stock}</p>
        <h3 class="text-4xl font-black text-emerald-900">${inventory.length}</h3>
      </div>
    </div>
    ${budgetWidget()}
    <div class="card">
      <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Top Spending Categories</p>
      <div class="space-y-2">
        ${topCats.length ? topCats.map(([cat, total]) => `
          <div class="flex justify-between text-sm font-bold text-slate-700">
            <span>${escapeHtml(cat)}</span>
            <span>${formatMoney(total)}</span>
          </div>
        `).join("") : `<p class="text-xs italic text-slate-400">Add prices to see data.</p>`}
      </div>
      <div class="mt-10 pt-6 border-t border-slate-50 flex flex-col gap-2">
         <button id="btn-reset-month" class="text-[10px] text-red-400 font-black uppercase hover:underline">Reset Month</button>
         <button id="btn-reset-all" class="text-[10px] text-slate-300 font-black uppercase hover:underline">Reset Everything</button>
      </div>
    </div>
  `;
  document.getElementById("btn-save-budget").onclick = () => onSaveBudget(document.getElementById("inp-budget").value);
  document.getElementById("btn-reset-month").onclick = () => onResetSpent();
  document.getElementById("btn-reset-all").onclick = () => onResetAll();
}