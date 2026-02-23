export function renderUI({
  t, lang, activeTab, inventory, shoppingList, historicalWaste,
  monthlyBudget, monthSpent, monthPurchases,
  onAdd, onMove, onDelete, onEmpty, onSuggest, onRecipe,
  onSaveBudget, onResetSpent, onClearAllInventory, onClearAllShopping, onResetAll
}) {
  const root = document.getElementById("content-area");
  if (!root) return;

  root.innerHTML = ""; 
  setActiveTab(activeTab);

  const spent = Number(monthSpent || 0);
  const budget = Number(monthlyBudget || 0);
  const remaining = budget > 0 ? budget - spent : 0;
  const pct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;

  const budgetWidgetHTML = `
    <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
      <div class="flex items-center justify-between">
        <p class="text-xs font-black text-slate-500 uppercase tracking-widest">Monthly Budget</p>
        <p class="text-sm font-black text-slate-700">${formatMoney(spent)} spent</p>
      </div>
      <div class="mt-3 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div class="h-2 bg-emerald-500" style="width:${pct}%"></div>
      </div>
      <div class="mt-4 flex gap-3 items-center">
        <input id="inp-budget" type="number" class="flex-1 border rounded-lg p-3 text-sm" placeholder="Budget €" value="${budget > 0 ? budget : ""}" />
        <button id="btn-save-budget" class="bg-emerald-500 text-white px-4 py-3 rounded-xl font-black text-xs uppercase">Save</button>
      </div>
      <div class="mt-3 flex gap-4">
        <button id="btn-reset-month" class="text-[10px] text-red-500 font-bold uppercase">Reset Month</button>
        <button id="btn-reset-all" class="text-[10px] text-slate-400 font-bold uppercase">Reset All</button>
      </div>
    </div>
  `;

  if (activeTab === "inventory") {
    root.innerHTML = `
      <div class="card">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-800">${t.nav_inv}</h2>
          <div class="flex gap-2">
            <button id="btn-clear-inv" class="bg-slate-100 text-slate-700 px-4 py-2 rounded-full text-xs font-bold uppercase">${t.clear_all || "Clear"}</button>
            <button id="btn-add-inv" class="bg-emerald-500 text-white px-6 py-2 rounded-full font-bold shadow-md">+ ${t.add}</button>
          </div>
        </div>
        <div class="space-y-3">
          ${inventory.map(i => `
            <div class="flex justify-between p-4 border rounded-xl items-center bg-white shadow-sm">
              <div class="max-w-[65%]">
                <p class="font-bold text-gray-800 truncate">${escapeHtml(i.name)}</p>
                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                  ${i.quantity} ${escapeHtml(i.unit || "")} • ${i.expiry || "PENDING"}
                </p>
              </div>
              <div class="flex gap-2">
                <button data-move="${i.id}" class="text-[10px] font-black text-amber-600 uppercase bg-amber-50 px-3 py-2 rounded-lg">Refill</button>
                <button data-del="${i.id}" class="text-slate-300 px-2 font-black">✕</button>
              </div>
            </div>
          `).join("") || `<p class="text-center italic text-gray-400 py-10">${t.empty_inv}</p>`}
        </div>
      </div>
    `;
    document.getElementById("btn-add-inv").onclick = () => onAdd("inventory");
    document.getElementById("btn-clear-inv").onclick = onClearAllInventory;
    root.querySelectorAll("[data-move]").forEach(b => b.onclick = () => onMove(b.dataset.move, "inventory"));
    root.querySelectorAll("[data-del]").forEach(b => b.onclick = () => onDelete("inventory", b.dataset.del));

  } else if (activeTab === "shopping") {
    root.innerHTML = `
      <div class="card">
        <h2 class="text-2xl font-bold text-gray-800 mb-6">${t.nav_shop}</h2>
        ${budgetWidgetHTML}
        <div class="mt-6 flex justify-between items-center mb-4">
           <h3 class="font-black text-xs text-slate-400 uppercase tracking-widest">My List</h3>
           <button id="btn-add-shop" class="text-emerald-500 font-bold text-xs uppercase">+ Add Item</button>
        </div>
        <div class="space-y-2">
          ${shoppingList.map(i => `
            <div class="flex justify-between p-4 border rounded-xl bg-emerald-50/10 items-center border-emerald-100">
              <div class="max-w-[50%]">
                <p class="font-bold text-gray-800 truncate">${escapeHtml(i.name)}</p>
                <p class="text-[10px] text-emerald-600 font-bold">${i.price ? formatMoney(i.price) : "€0.00"} ${i.expiry ? `• Exp: ${i.expiry}` : ""}</p>
              </div>
              <div class="flex gap-2">
                <button data-del="${i.id}" class="text-slate-400 text-[10px] font-bold uppercase px-2">Del</button>
                <button data-move="${i.id}" class="bg-emerald-500 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase shadow-sm">Bought</button>
              </div>
            </div>
          `).join("") || `<p class="text-center italic text-gray-400 py-6">${t.empty_shop}</p>`}
        </div>
      </div>
    `;
    document.getElementById("btn-add-shop").onclick = () => onAdd("shopping");
    document.getElementById("btn-save-budget").onclick = () => onSaveBudget(document.getElementById("inp-budget").value);
    document.getElementById("btn-reset-month").onclick = onResetSpent;
    document.getElementById("btn-reset-all").onclick = onResetAll;
    root.querySelectorAll("[data-move]").forEach(b => b.onclick = () => onMove(b.dataset.move, "shopping"));
    root.querySelectorAll("[data-del]").forEach(b => b.onclick = () => onDelete("shopping", b.dataset.del));

  } else if (activeTab === "planner") {
    root.innerHTML = `<div class="card text-center py-10"><h2 class="text-2xl font-bold mb-4">${t.nav_plan}</h2><button id="btn-recipe" class="bg-purple-600 text-white px-10 py-3 rounded-full font-black uppercase text-[10px]">Generate Recipe</button><div id="ai-recipe-out" class="mt-8 p-6 bg-slate-50 text-left text-xs italic"></div></div>`;
    document.getElementById("btn-recipe").onclick = onRecipe;
  } else {
    root.innerHTML = `<div class="grid grid-cols-2 gap-4 mb-6"><div class="card text-center bg-rose-50"><p class="text-[10px] font-black text-rose-600 uppercase">Waste</p><h3 class="text-3xl font-black text-rose-900">${historicalWaste}</h3></div><div class="card text-center bg-emerald-50"><p class="text-[10px] font-black text-emerald-600 uppercase">Stock</p><h3 class="text-3xl font-black text-emerald-900">${inventory.length}</h3></div></div>${budgetWidgetHTML}`;
    document.getElementById("btn-save-budget").onclick = () => onSaveBudget(document.getElementById("inp-budget").value);
    document.getElementById("btn-reset-month").onclick = onResetSpent;
    document.getElementById("btn-reset-all").onclick = onResetAll;
  }
}

function setActiveTab(tab) {
  document.querySelectorAll(".tab-button").forEach(b => b.classList.toggle("active", b.id === `nav-${tab}`));
}
function formatMoney(v) { return "€" + Number(v || 0).toFixed(2); }
function escapeHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }