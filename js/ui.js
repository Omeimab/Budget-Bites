export function setHeaderText(t) {
  document.getElementById("app-subtitle").innerText = t.subtitle;
  document.getElementById("user-info").innerText = t.connecting;
  document.getElementById("loading-message").innerText = t.loading;

  document.getElementById("nav-inventory").innerText = t.nav_inv;
  document.getElementById("nav-shopping").innerText = t.nav_shop;
  document.getElementById("nav-planner").innerText = t.nav_plan;
  document.getElementById("nav-reports").innerText = t.nav_dash;
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

export function openModal(t, type, item) {
  const form = document.getElementById("item-form");
  form.reset();

  document.getElementById("list-type").value = type;
  document.getElementById("item-id").value = item ? item.id : "";

  document.getElementById("modal-title").innerText = item ? t.edit : t.add;
  document.getElementById("lbl-name").innerText = t.name;
  document.getElementById("lbl-qty").innerText = t.qty;
  document.getElementById("lbl-unit").innerText = t.unit;
  document.getElementById("lbl-expiry").innerText = t.expiry_logic;

  // ✅ price label (safe if exists)
  const lblPrice = document.getElementById("lbl-price");
  if (lblPrice) lblPrice.innerText = t.price || "Price (€)";

  const inpPrice = document.getElementById("inp-price");
  if (inpPrice) inpPrice.value = item?.price ?? "";

  document.getElementById("item-shelf-life").placeholder = t.expiry_placeholder;
  document.getElementById("btn-save").innerText = t.save;
  document.getElementById("btn-cancel").innerText = t.cancel;

  document.getElementById("expiry-field").classList.toggle("hidden", type !== "inventory");
  document.getElementById("modal-container").classList.replace("hidden", "flex");
}

export function closeModal() {
  document.getElementById("modal-container").classList.replace("flex", "hidden");
}

export function renderUI({
  t,
  lang,
  activeTab,
  inventory,
  shoppingList,
  historicalWaste,
  monthlyBudget,
  monthSpent,
  onAdd,
  onMove,
  onDelete,
  onSuggest,
  onRecipe,
  onSaveBudget
}) {
  const root = document.getElementById("content-area");
  setActiveTab(activeTab);

  const spent = Number(monthSpent || 0);
  const budget = Number(monthlyBudget || 0);
  const remaining = Math.max(0, budget - spent);
  const pct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;

  const budgetWidget = () => `
    <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
      <div class="flex items-center justify-between">
        <p class="text-xs font-black text-slate-500 uppercase tracking-widest">Monthly Budget</p>
        <p class="text-sm font-black text-slate-700">${formatMoney(spent)} <span class="text-slate-400 font-semibold">spent</span></p>
      </div>

      <div class="mt-3 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div class="h-2 bg-emerald-500" style="width:${pct}%"></div>
      </div>

      <div class="mt-2 flex items-center justify-between text-xs font-semibold text-slate-500">
        <span>${pct}% used</span>
        <span>${budget > 0 ? `${formatMoney(remaining)} remaining` : `Set a budget to track remaining`}</span>
      </div>

      ${budget > 0 && remaining <= budget * 0.1 ? `
        <div class="mt-3 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          ⚠️ Watch out: you're close to your monthly budget.
        </div>
      ` : ""}

      <div class="mt-4 flex gap-3 items-center">
        <div class="flex-1">
          <p class="text-sm font-bold mb-1">Set monthly budget (€)</p>
          <input id="inp-budget" type="number" min="0" step="1"
            class="w-full border rounded-lg p-3"
            placeholder="e.g. 300"
            value="${budget > 0 ? String(budget) : ""}"
          />
        </div>
        <button id="btn-save-budget"
          class="bg-emerald-500 text-white px-6 py-3 rounded-xl font-black shadow-md hover:bg-emerald-600">
          Save
        </button>
      </div>

      <p class="mt-2 text-xs text-slate-500">
        Tip: Add prices to Shopping List items and click BOUGHT to track spending automatically.
      </p>
    </div>
  `;

  // INVENTORY
  if (activeTab === "inventory") {
    root.innerHTML = `
      <div class="card">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-800">${t.nav_inv}</h2>
          <button id="btn-add-inv" class="bg-emerald-500 text-white px-6 py-2 rounded-full font-bold shadow-md hover:bg-emerald-600 transition-colors">+ ${t.add}</button>
        </div>
        <div class="space-y-3">
          ${
            inventory.map(i => `
              <div class="flex justify-between p-4 border rounded-xl items-center bg-white shadow-sm hover:border-emerald-200 transition-all">
                <div>
                  <p class="font-bold text-gray-800">${escapeHtml(i.name)}</p>
                  <p class="text-xs text-gray-400 font-semibold">
                    ${i.quantity} ${escapeHtml(i.unit || "")} • ${escapeHtml(i.expiry || "PENDING")}
                    ${i.price != null && i.price !== "" ? ` • ${formatMoney(i.price)}` : ""}
                  </p>
                </div>
                <div class="flex gap-3">
                  <button data-move="${i.id}" class="text-xs font-bold text-amber-600 uppercase tracking-tighter">${t.move_need}</button>
                  <button data-del="${i.id}" class="text-xs text-red-400 font-bold uppercase tracking-tighter">X</button>
                </div>
              </div>
            `).join("") || `<p class="text-center italic text-gray-400 py-10 font-medium">${t.empty_inv}</p>`
          }
        </div>
      </div>
    `;

    document.getElementById("btn-add-inv").onclick = () => onAdd("inventory");
    root.querySelectorAll("[data-move]").forEach(btn => btn.onclick = () => onMove(btn.dataset.move, "inventory"));
    root.querySelectorAll("[data-del]").forEach(btn => btn.onclick = () => onDelete("inventory", btn.dataset.del));
    return;
  }

  // SHOPPING
  if (activeTab === "shopping") {
    root.innerHTML = `
      <div class="card">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-800">${t.nav_shop}</h2>
          <button id="btn-add-shop" class="bg-emerald-500 text-white px-6 py-2 rounded-full font-bold shadow-md">+ ${t.add}</button>
        </div>

        ${budgetWidget()}

        <div class="space-y-3 mt-6 mb-6">
          ${
            shoppingList.map(i => `
              <div class="flex justify-between p-4 border rounded-xl bg-emerald-50/20 items-center border-emerald-100">
                <div>
                  <p class="font-bold text-gray-800">
                    ${escapeHtml(i.name)} (${i.quantity} ${escapeHtml(i.unit || "")})
                  </p>
                  <p class="text-xs text-slate-500 font-semibold">
                    ${i.price != null && i.price !== "" ? `Price: ${formatMoney(i.price)}` : "No price yet"}
                  </p>
                </div>
                <button data-move="${i.id}" class="bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-xs font-black shadow-sm uppercase tracking-tighter">${t.move_bought}</button>
              </div>
            `).join("") || `<p class="text-center italic text-gray-400 py-10 font-medium">${t.empty_shop}</p>`
          }
        </div>

        <div class="bg-indigo-50 p-5 rounded-xl border border-indigo-100 shadow-inner">
          <button id="btn-suggest" class="text-xs bg-indigo-600 text-white px-4 py-2 rounded font-black mb-2 uppercase tracking-widest shadow-md">${t.sugg_btn}</button>
          <div id="ai-out" class="text-xs italic text-indigo-700 leading-relaxed font-medium">${t.sugg_info}</div>
        </div>
      </div>
    `;

    document.getElementById("btn-add-shop").onclick = () => onAdd("shopping");
    root.querySelectorAll("[data-move]").forEach(btn => btn.onclick = () => onMove(btn.dataset.move, "shopping"));
    document.getElementById("btn-suggest").onclick = () => onSuggest();

    document.getElementById("btn-save-budget").onclick = () => {
      const val = document.getElementById("inp-budget").value;
      onSaveBudget(val);
    };

    return;
  }

  // PLANNER
  if (activeTab === "planner") {
    root.innerHTML = `
      <div class="card text-center py-10">
        <h2 class="text-2xl font-bold mb-4 text-gray-800">${t.nav_plan}</h2>
        <p class="text-gray-500 mb-8 max-w-sm mx-auto font-medium">${t.recipe_info}</p>
        <button id="btn-recipe" class="bg-purple-600 text-white px-10 py-3 rounded-full font-extrabold shadow-lg shadow-purple-200 hover:scale-105 transition-transform uppercase tracking-widest text-xs">${t.recipe_btn}</button>
        <div id="ai-recipe-out" class="mt-8 p-6 bg-slate-50 text-left text-sm whitespace-pre-wrap rounded-2xl border-2 border-slate-100 leading-relaxed text-slate-700"></div>
      </div>
    `;
    document.getElementById("btn-recipe").onclick = () => onRecipe();
    return;
  }

  // DASHBOARD
  root.innerHTML = `
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div class="card text-center bg-rose-50 border-2 border-rose-100 shadow-none">
        <p class="text-xs font-black text-rose-600 uppercase tracking-widest mb-2">${t.stat_waste}</p>
        <h3 class="text-6xl font-black text-rose-900">${historicalWaste}</h3>
      </div>
      <div class="card text-center bg-emerald-50 border-2 border-emerald-100 shadow-none">
        <p class="text-xs font-black text-emerald-600 uppercase tracking-widest mb-2">${t.stat_stock}</p>
        <h3 class="text-6xl font-black text-emerald-900">${inventory.length}</h3>
      </div>
    </div>

    <div class="mt-6">
      ${budgetWidget()}
    </div>
  `;

  document.getElementById("btn-save-budget").onclick = () => {
    const val = document.getElementById("inp-budget").value;
    onSaveBudget(val);
  };
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
