import { loadState, saveState, defaultState, uid } from "./storage.js";
import {
  setHeader,
  setStatus,
  setActiveTab,
  renderInventory,
  renderShopping,
  renderPlanner,
  renderReports,
  wireReportsBudget,
  openModal,
  closeModal,
  toast
} from "./ui.js";

console.log("[BudgetBites] app.js loaded");

var state = loadState();
if (!state) state = defaultState();

boot();

function boot() {
  document.getElementById("lang-select").value = state.lang;

  setHeader(state.lang);
  setActiveTab(state.activeTab);
  setStatus(state.lang, "initializing");

  document.getElementById("nav-inventory").onclick = function () { go("inventory"); };
  document.getElementById("nav-shopping").onclick = function () { go("shopping"); };
  document.getElementById("nav-planner").onclick = function () { go("planner"); };
  document.getElementById("nav-reports").onclick = function () { go("reports"); };

  document.getElementById("lang-select").onchange = function (e) {
    state.lang = e.target.value;
    persist();
    setHeader(state.lang);
    render();
  };

  document.getElementById("modal-container").onclick = function (e) {
    if (e.target && e.target.id === "modal-container") closeModal();
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

  var handlers = {
    openAdd: function (listType) {
      var modalArgs = {
        lang: state.lang,
        mode: "add",
        listType: listType,
        item: null
      };

      openModal(modalArgs, function (payload) {
        upsertItem(payload);
        closeModal();
        toast("Saved!");
        render();
      });
    },

    openEdit: function (listType, id) {
      var item = findItem(listType, id);
      if (!item) return;

      var modalArgs = {
        lang: state.lang,
        mode: "edit",
        listType: listType,
        item: item
      };

      openModal(modalArgs, function (payload) {
        upsertItem(payload);
        closeModal();
        toast("Updated!");
        render();
      });
    },

    remove: function (listType, id) {
      var arr = listType === "inventory" ? state.inventory : state.shopping;
      var idx = arr.findIndex(function (x) { return x.id === id; });
      if (idx >= 0) {
        arr.splice(idx, 1);
        persist();
        toast("Deleted!");
        render();
      }
    },

    toggleBought: function (id) {
      var it = state.shopping.find(function (x) { return x.id === id; });
      if (!it) return;
      it.bought = !it.bought;
      it.boughtAtTs = it.bought ? Date.now() : null;
      persist();
      render();
    },

    updateTripBudget: function (val) {
      state.settings.shoppingTripBudget = Number(val || 0);
      persist();
      render();
      toast("Trip budget saved!");
    }
  };

  if (state.activeTab === "inventory") {
    renderInventory(state, handlers);
    return;
  }

  if (state.activeTab === "shopping") {
    renderShopping(state, handlers);
    return;
  }

  if (state.activeTab === "planner") {
    renderPlanner(state);
    return;
  }

  if (state.activeTab === "reports") {
    renderReports(state);
    wireReportsBudget(function (val) {
      state.settings.monthlyBudget = Number(val || 0);
      persist();
      toast("Monthly budget saved!");
      render();
    });
    return;
  }
}

function findItem(listType, id) {
  var arr = listType === "inventory" ? state.inventory : state.shopping;
  return arr.find(function (x) { return x.id === id; });
}

function upsertItem(payload) {
  var listType = payload.listType;
  var arr = listType === "inventory" ? state.inventory : state.shopping;

  var now = Date.now();
  var isNew = !payload.id;

  var base = {
    id: payload.id ? payload.id : uid(),
    name: payload.name,
    category: payload.category ? payload.category : "general",
    qty: Number(payload.qty || 1),
    unit: payload.unit ? payload.unit : "",
    priceTotal: Number(payload.priceTotal || 0)
  };

  if (listType === "inventory") {
    var shelfDays = Number(payload.shelfLifeDays || 0);
    var expiryTs = shelfDays > 0 ? (now + shelfDays * 24 * 60 * 60 * 1000) : null;

    var prev = findItem("inventory", base.id);

    var item = {
      id: base.id,
      name: base.name,
      category: base.category,
      qty: base.qty,
      unit: base.unit,
      priceTotal: base.priceTotal,
      shelfLifeDays: shelfDays,
      expiryTs: expiryTs,
      createdAtTs: isNew ? now : (prev && prev.createdAtTs ? prev.createdAtTs : now)
    };

    var idxInv = arr.findIndex(function (x) { return x.id === item.id; });
    if (idxInv >= 0) arr[idxInv] = item;
    else arr.push(item);

    persist();
    return;
  }

  if (listType === "shopping") {
    var prevS = findItem("shopping", base.id);

    var itemS = {
      id: base.id,
      name: base.name,
      category: base.category,
      qty: base.qty,
      unit: base.unit,
      priceTotal: base.priceTotal,
      bought: prevS ? !!prevS.bought : false,
      createdAtTs: isNew ? now : (prevS && prevS.createdAtTs ? prevS.createdAtTs : now),
      boughtAtTs: prevS ? (prevS.boughtAtTs || null) : null
    };

    var idxShop = arr.findIndex(function (x) { return x.id === itemS.id; });
    if (idxShop >= 0) arr[idxShop] = itemS;
    else arr.push(itemS);
//trig
    persist();
  }
}