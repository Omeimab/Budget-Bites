import { loadState, saveState, defaultState, uid } from "./storage.js";
import { setHeader, setStatus, setActiveTab, renderInventory, renderShopping, renderPlanner, renderReports, wireReportsBudget, openModal, closeModal, toast } from "./ui.js";

const state = loadState() ?? defaultState();

boot();

function boot() {
  // initial UI
  document.getElementById("lang-select").value = state.lang;
  setHeader(state.lang);
  setActiveTab(state.activeTab);
  setStatus(state.lang, "initializing");

  // nav events
  document.getElementById("nav-inventory").onclick = () => go("inventory");
  document.getElementById("nav-shopping").onclick = () => go("shopping");
  document.getElementById("nav-planner").onclick = () => go("planner");
  document.getElementById("nav-reports").onclick = () => go("reports");

  // lang switch
  document.getElementById("lang-select").onchange = (e) => {
    state.lang = e.target.value;
    persist();
    setHeader(state.lang);
    render();
  };

  // close modal if click backdrop
  document.getElementById("modal-container").onclick = (e) => {
    if (e.target.id === "modal-container") closeModal();
  };

  // first render
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
        },
        () => {}
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
        },
        () => {}
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
      it.bought = !it.bought;
      it.boughtAtTs = it.bought ? Date.now() : null;
      persist();
      render();
    },

    updateTripBudget: (val) => {
      state.settings.shoppingTripBudget = Number(val || 0);
      persist();
      render();
      toast("Trip budget saved!");
    }
  };

  if (state.activeTab === "inventory") return renderInventory(state, handlers);
  if (state.activeTab === "shopping") return renderShopping(state, handlers);
  if (state.activeTab === "planner") return renderPlanner(state);
  if (state.activeTab === "reports") {
    renderReports(state);
    wireReportsBudget((val) => {
      state.settings.monthlyBudget = Number(val || 0);
      persist();
      toast("Monthly budget saved!");
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
  };

  if (listType === "inventory") {
    const shelfDays = Number(payload.shelfLifeDays || 0);
    const expiryTs = shelfDays > 0 ? (now + shelfDays * 24 * 60 * 60 * 1000) : null;

    const item = {
      ...base,
      shelfLifeDays: shelfDays,
      expiryTs,
      createdAtTs: isNew ? now : (findItem("inventory", base.id)?.createdAtTs ?? now),
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