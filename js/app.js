document.getElementById("item-form").onsubmit = async (e) => {
  e.preventDefault();
  const type = document.getElementById("list-type").value;
  const id = document.getElementById("item-id").value || crypto.randomUUID();
  const name = document.getElementById("item-name").value.trim();
  const quantity = parseInt(document.getElementById("item-quantity").value || "1", 10);
  const unit = document.getElementById("item-unit").value.trim();
  const price = parseFloat(document.getElementById("inp-price")?.value || "0");
  const shelfLife = parseInt(document.getElementById("item-shelf-life").value || "", 10);
  
  const safePrice = Number.isFinite(price) && price >= 0 ? price : 0;
  if (!name) return;

  // Calculate Expiry Date based on days entered
  let expiry = "";
  if (Number.isFinite(shelfLife) && shelfLife > 0) {
    const d = new Date();
    d.setDate(d.getDate() + shelfLife);
    expiry = d.toISOString().split("T")[0];
  }

  const newItem = { id, name, quantity, unit, price: safePrice, expiry };

  if (type === "inventory") {
    upsert(inventory, newItem);
  } else {
    upsert(shoppingList, newItem);
  }

  closeModal();
  draw();
  await persist();
};