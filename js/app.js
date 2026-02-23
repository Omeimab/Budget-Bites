
document.getElementById("item-form").onsubmit = async (e) => {
  e.preventDefault();
  const type = document.getElementById("list-type").value;
  const id = document.getElementById("item-id").value || crypto.randomUUID();
  const name = document.getElementById("item-name").value.trim();
  const quantity = parseInt(document.getElementById("item-quantity").value || "1", 10);
  const unit = document.getElementById("item-unit").value.trim();
  const price = parseFloat(document.getElementById("inp-price")?.value || "0");
  const days = parseInt(document.getElementById("item-shelf-life").value || "", 10);

  if (!name) return;

  let expiry = "PENDING";
  if (Number.isFinite(days) && days > 0) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    expiry = d.toISOString().split("T")[0];
  }

  const itemData = { id, name, quantity, unit, price: Number.isFinite(price) ? price : 0, expiry };

  if (type === "inventory") {
    upsert(inventory, itemData);
  } else {
    upsert(shoppingList, itemData);
  }

  closeModal();
  draw();
  await persist();
};