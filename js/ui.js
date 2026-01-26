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

  document.getElementById("item-shelf-life").placeholder = t.expiry_placeholder;
  document.getElementById("btn-save").innerText = t.save;
  document.getElementById("btn-cancel").innerText = t.cancel;

  document.getElementById("expiry-field").classList.toggle("hidden", type !== "inventory");
  document.getElementById("modal-container").classList.replace("hidden", "flex");
}

export function closeModal() {
  document.getElementById("modal-container").classList.replace("flex", "hidden");
}

export function renderUI({ t, lang, activeTab, inventory, shoppingList, historicalWaste, onAdd, onMove, onDelete, onSuggest, onRecipe }) {
  const root = document.getElementById("content-area");
  setActiveTab(activeTab);

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
                  <p class="text-xs text-gray-400 font-semibold">${i.quantity} ${escapeHtml(i.unit || "")} • ${escapeHtml(i.expiry || "PENDING")}</p>
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

    root.querySelectorAll("[data-move]").forEach(btn => {
      btn.onclick = () => onMove(btn.dataset.move, "inventory");
    });
    root.querySelectorAll("[data-del]").forEach(btn => {
      btn.onclick = () => onDelete("inventory", btn.dataset.del);
    });

    return;
  }

  if (activeTab === "shopping") {
    root.innerHTML = `
      <div class="card">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-800">${t.nav_shop}</h2>
          <button id="btn-add-shop" class="bg-emerald-500 text-white px-6 py-2 rounded-full font-bold shadow-md">+ ${t.add}</button>
        </div>

        <div class="space-y-3 mb-6">
          ${
            shoppingList.map(i => `
              <div class="flex justify-between p-4 border rounded-xl bg-emerald-50/20 items-center border-emerald-100">
                <p class="font-bold text-gray-800">${escapeHtml(i.name)} (${i.quantity} ${escapeHtml(i.unit || "")})</p>
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
    root.querySelectorAll("[data-move]").forEach(btn => {
      btn.onclick = () => onMove(btn.dataset.move, "shopping");
    });
    document.getElementById("btn-suggest").onclick = () => onSuggest();

    return;
  }

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

  // reports
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
  `;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
