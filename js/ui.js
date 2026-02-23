export function setHeaderText(t) {
  document.getElementById("app-subtitle").innerText = t.subtitle || "";
  document.getElementById("user-info").innerText = t.connecting || "";
  document.getElementById("loading-message").innerText = t.loading || "";

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

export function openModal(t, type, item) {
  const form = document.getElementById("item-form");
  form.reset();

  document.getElementById("list-type").value = type;
  document.getElementById("item-id").value = item ? item.id : "";

  // Map to your HTML IDs
  document.getElementById("modal-title").innerText = item ? t.edit : t.add;
  document.getElementById("lbl-name").innerText = t.name;
  document.getElementById("lbl-qty").innerText = t.qty;
  document.getElementById("lbl-unit").innerText = t.unit;
  document.getElementById("lbl-price").innerText = t.lbl_price || "Price";
  document.getElementById("lbl-category").innerText = t.lbl_category || "Category";
  document.getElementById("lbl-expiry-date").innerText = t.lbl_expiry_date || t.expiry_logic;

  // Option labels
  document.getElementById("opt-none").innerText = t.opt_none || "—";
  document.getElementById("opt-dairy").innerText = t.opt_dairy || "Dairy";
  document.getElementById("opt-dry").innerText = t.opt_dry || "Dry";
  document.getElementById("opt-meat").innerText = t.opt_meat || "Meat";
  document.getElementById("opt-produce").innerText = t.opt_produce || "Produce";
  document.getElementById("opt-frozen").innerText = t.opt_frozen || "Frozen";
  document.getElementById("opt-drinks").innerText = t.opt_drinks || "Drinks";
  document.getElementById("opt-snacks").innerText = t.opt_snacks || "Snacks";
  document.getElementById("opt-other").innerText = t.opt_other || "Other";

  // Values
  document.getElementById("item-name").value = item?.name ?? "";
  document.getElementById("item-quantity").value = item?.quantity ?? 1;
  document.getElementById("item-unit").value = item?.unit ?? "";
  document.getElementById("inp-price").value = item?.price ?? "";
  document.getElementById("inp-category").value = item?.category ?? "";
  document.getElementById("item-expiry-date").value = item?.expiry ?? "";

  document.getElementById("btn-save").innerText = t.save;
  document.getElementById("btn-cancel").innerText = t.cancel;

  // Show/Hide expiry container based on tab
  const expiryContainer = document.getElementById("expiry-date-container");
  if (expiryContainer) {
    expiryContainer.classList.toggle("hidden", type !== "inventory");
  }

  // Show the modal
  document.getElementById("modal-container").classList.replace("hidden", "flex");
}

export function closeModal() {
  document.getElementById("modal-container").classList.replace("flex", "hidden");
}

// --- Helper for the list view ---
function formatMoney(v) {
  return `€${Number(v || 0).toFixed(2)}`;
}

export function renderUI(state) {
  const { t, activeTab, inventory, shoppingList, historicalWaste, monthlyBudget, monthSpent, onAdd, onMove, onDelete, onClearInventory, onClearShopping, onResetAll, onSuggest, onRecipe, onSaveBudget, onResetSpent } = state;
  const root = document.getElementById("content-area");
  setActiveTab(activeTab);

  const spent = Number(monthSpent || 0);
  const budget = Number(monthlyBudget || 0);

  // --- INVENTORY VIEW ---
  if (activeTab === "inventory") {
    root.innerHTML = `
      <div class="card">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-extrabold text-gray-800">${t.nav_inv}</h2>
          <div class="flex gap-2">
            <button id="btn-clear-inv" class="text-xs font-bold text-red-400 uppercase mr-2">${t.btn_clear || "Clear"}</button>
            <button id="btn-add-inv" class="bg-emerald-500 text-white px-6 py-2 rounded-full font-bold shadow-lg">+ ${t.add}</button>
          </div>
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
    document.getElementById("btn-clear-inv").onclick = () => onClearInventory();
    root.querySelectorAll("[data-move]").forEach(b => b.onclick = () => onMove(b.dataset.move, "inventory"));
    root.querySelectorAll("[data-del]").forEach(b => b.onclick = () => onDelete("inventory", b.dataset.del));
  } 

  // --- SHOPPING VIEW ---
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
              <div>
                <p class="font-bold text-gray-800">${i.name}</p>
                <p class="text-[10px] text-gray-400 font-bold uppercase">${i.quantity} ${i.unit || ""} ${i.price ? `• ${formatMoney(i.price)}` : ""}</p>
              </div>
              <button data-move-shop="${i.id}" class="bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest">${t.move_bought || "Bought"}</button>
            </div>
          `).join("") || `<p class="text-center py-10 text-gray-300 italic">${t.empty_shop}</p>`}
        </div>
      </div>
    `;
    document.getElementById("btn-add-shop").onclick = () => onAdd("shopping");
    root.querySelectorAll("[data-move-shop]").forEach(b => b.onclick = () => onMove(b.dataset.moveShop, "shopping"));
  }

  // --- OTHERS (Planner/Reports) ---
  else {
    root.innerHTML = `<div class="card text-center py-20"><p class="text-gray-400 font-bold uppercase tracking-widest text-xs">${t.nav_plan || "Coming Soon"}</p></div>`;
  }
}