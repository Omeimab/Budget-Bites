import { loadState, saveState, defaultState, uid } from "./storage.js";
import {
  setHeader,
  setStatus,
  setActiveTab,
  renderInventory,
  renderShopping,
  renderPlanner,
  renderDashboard,
  wireDashboardBudget,
  openModal,
  closeModal,
  toast
} from "./ui.js";

const state = loadState() ?? defaultState();

// ensure new fields exist (for older saved states)
state.settings = state.settings || {};
if (typeof state.settings.monthlyBudget !== "number") state.settings.monthlyBudget = 200;
if (typeof state.settings.shoppingTripBudget !== "number") state.settings.shoppingTripBudget = 50;

state.inventory = state.inventory || [];
state.shopping = state.shopping || [];

boot();

function boot() {
  document.getElementById("lang-select").value = state.lang;
  setHeader(state.lang);
  setActiveTab(state.activeTab);
  setStatus(state.lang, "initializing");

  document.getElementById("nav-inventory").onclick = () => go("inventory");
  document.getElementById("nav-shopping").onclick = () => go("shopping");
  document.getElementById("nav-planner").onclick = () => go("planner");
  document.getElementById("nav-reports").onclick = () => go("reports"); // reports == dashboard now

  document.getElementById("lang-select").onchange = (e) => {
    state.lang = e.target.value;
    persist();
    setHeader(state.lang);
    render();
  };

  document.getElementById("modal-container").onclick = (e) => {
    if (e.target.id === "modal-container") closeModal();
  };

  render();
  setStatus(state.lang, "ready");
}

function go(tab) {
  state.activeTab = tab;
  persist();
  render();
}

function persist() {
  saveState(state);
}

function render() {
  setHeader(state.lang);
  setActiveTab(state.activeTab);

  const handlers = {
    openAdd: (listType) => {
      openModal(
        { lang: state.lang, mode: "add", listType, item: null },
        (payload) => {
          upsertItem(payload);
          closeModal();
          toast("Saved!");
          render();
        }
      );
    },

    openEdit: (listType, id) => {
      const item = findItem(listType, id);
      if (!item) return;
      openModal(
        { lang: state.lang, mode: "edit", listType, item },
        (payload) => {
          upsertItem(payload);
          closeModal();
          toast("Updated!");
          render();
        }
      );
    },

    remove: (listType, id) => {
      const arr = listType === "inventory" ? state.inventory : state.shopping;
      const idx = arr.findIndex(x => x.id === id);
      if (idx >= 0) {
        arr.splice(idx, 1);
        persist();
        toast("Deleted!");
        render();
      }
    },

    toggleBought: (id) => {
      const it = state.shopping.find(x => x.id === id);
      if (!it) return;

      // mark bought
      it.bought = !it.bought;
      it.boughtAtTs = it.bought ? Date.now() : null;

      // if bought => MOVE INTO INVENTORY and remove from shopping
      if (it.bought) {
        moveShoppingToInventory(it);
        state.shopping = state.shopping.filter(x => x.id !== id);
        toast("Moved to inventory ✅");
      }

      persist();
      render();
    },

    updateTripBudget: (val) => {
      state.settings.shoppingTripBudget = Number(val || 0);
      persist();
      render();
    },

    resetTripBudget: () => {
      state.settings.shoppingTripBudget = 50;
      persist();
      render();
    },

    resetMonthlyBudget: () => {
      state.settings.monthlyBudget = 200;
      persist();
      render();
    }
  };

  if (state.activeTab === "inventory") return renderInventory(state, handlers);
  if (state.activeTab === "shopping") return renderShopping(state, handlers);
  if (state.activeTab === "planner") return renderPlanner(state, handlers);

  // reports tab is now Dashboard
  if (state.activeTab === "reports") {
    renderDashboard(state, handlers);
    wireDashboardBudget((val) => {
      state.settings.monthlyBudget = Number(val || 0);
      persist();
      render();
    });
    return;
  }
}

function findItem(listType, id) {
  const arr = listType === "inventory" ? state.inventory : state.shopping;
  return arr.find(x => x.id === id);
}

function upsertItem(payload) {
  const listType = payload.listType;
  const arr = listType === "inventory" ? state.inventory : state.shopping;

  const now = Date.now();
  const isNew = !payload.id;

  const base = {
    id: payload.id ?? uid(),
    name: payload.name,
    category: payload.category || "general",
    qty: Number(payload.qty || 1),
    unit: payload.unit || "",
    priceTotal: Number(payload.priceTotal || 0),
    shelfLifeDays: Number(payload.shelfLifeDays || 0),
  };

  if (listType === "inventory") {
    const expiryTs = base.shelfLifeDays > 0 ? (now + base.shelfLifeDays * 24 * 60 * 60 * 1000) : null;
    const prev = findItem("inventory", base.id);

    const item = {
      ...base,
      expiryTs,
      createdAtTs: isNew ? now : (prev?.createdAtTs ?? now),
    };

    const idx = arr.findIndex(x => x.id === item.id);
    if (idx >= 0) arr[idx] = item; else arr.push(item);
    persist();
    return;
  }

  if (listType === "shopping") {
    const prev = findItem("shopping", base.id);
    const item = {
      ...base,
      bought: prev?.bought ?? false,
      createdAtTs: isNew ? now : (prev?.createdAtTs ?? now),
      boughtAtTs: prev?.boughtAtTs ?? null,
    };

    const idx = arr.findIndex(x => x.id === item.id);
    if (idx >= 0) arr[idx] = item; else arr.push(item);
    persist();
  }
}

function moveShoppingToInventory(shopItem) {
  const now = Date.now();
  const shelf = Number(shopItem.shelfLifeDays || 0);
  const expiryTs = shelf > 0 ? (now + shelf * 24 * 60 * 60 * 1000) : null;

  state.inventory.push({
    id: uid(),
    name: shopItem.name,
    category: shopItem.category || "general",
    qty: Number(shopItem.qty || 1),
    unit: shopItem.unit || "",
    priceTotal: Number(shopItem.priceTotal || 0),
    shelfLifeDays: shelf,
    expiryTs,
    createdAtTs: now,
    source: "shopping"
  });
}