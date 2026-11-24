/* =========================================================
   eTrade — Admin dashboard
   ========================================================= */
(function () {
  const { Products, Orders, Auth, Coupons, Settings, CATEGORIES, money, esc, catName } = Store;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const toast = UI.toast;
  const ADMIN = { user: "admin", pass: "admin123" };
  const SESSION = "et_admin";
  const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];
  const payLabel = { card: "Card", jazzcash: "JazzCash", easypaisa: "Easypaisa", bank: "Bank transfer", cod: "COD" };
  const COLORS = ["#1a8fdd", "#7c3aed", "#f59e0b", "#16a34a", "#e11d48", "#0ea5e9", "#64748b"];

  let view = "dashboard";
  const ui = { pSearch: "", pCat: "all", oSearch: "", oStatus: "all", cSearch: "" };

  /* ---------- Auth ---------- */
  function showApp() {
    $("#login-view").classList.add("hidden");
    $("#admin-view").classList.remove("hidden");
    go((location.hash || "#dashboard").slice(1));
  }
  $("#login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    if (f.user.trim() === ADMIN.user && f.pass === ADMIN.pass) {
      sessionStorage.setItem(SESSION, "1");
      toast("Welcome back, Admin!");
      showApp();
    } else toast("Wrong username or password", "error");
  });
  $("#admin-logout").addEventListener("click", () => { sessionStorage.removeItem(SESSION); location.reload(); });

  /* ---------- Navigation ---------- */
  const TITLES = { dashboard: "Dashboard", products: "Products", orders: "Orders", customers: "Customers", coupons: "Coupons", settings: "Settings" };
  function go(v) {
    view = TITLES[v] ? v : "dashboard";
    history.replaceState(null, "", "#" + view);
    $$(".sidebar [data-view]").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
    $("#view-title").textContent = TITLES[view];
    $("#sidebar").classList.remove("open");
    $(".overlay").classList.remove("show");
    render();
  }
  $$(".sidebar [data-view]").forEach((b) => b.addEventListener("click", () => go(b.dataset.view)));
  $("#sb-toggle").addEventListener("click", () => { $("#sidebar").classList.add("open"); $(".overlay").classList.add("show"); });

  function updateBadge() {
    const n = Orders.all().filter((o) => o.status === "pending").length;
    $("#pending-badge").textContent = n || "";
    $("#pending-badge").style.display = n ? "" : "none";
  }

  function render() {
    updateBadge();
    const fn = { dashboard, products, orders, customers, coupons, settings }[view];
    $("#view").innerHTML = fn();
    after[view] && after[view]();
  }
  const after = {};

  /* ---------- Dashboard ---------- */
  function dashboard() {
    const all = Orders.all();
    const valid = all.filter((o) => o.status !== "cancelled");
    const revenue = valid.reduce((s, o) => s + o.total, 0);
    const prods = Products.all();
    const users = Auth.users();
    const avg = valid.length ? revenue / valid.length : 0;

    // last 7 days
    const days = [...Array(7)].map((_, i) => {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (6 - i));
      const next = d.getTime() + 864e5;
      const v = valid.filter((o) => o.createdAt >= d.getTime() && o.createdAt < next).reduce((s, o) => s + o.total, 0);
      return { label: d.toLocaleDateString("en", { weekday: "short" }), v };
    });
    const max = Math.max(1, ...days.map((d) => d.v));

    // category share
    const catRev = {};
    valid.forEach((o) => o.items.forEach((i) => {
      const p = Products.get(i.id);
      const c = p ? p.category : "other";
      catRev[c] = (catRev[c] || 0) + i.price * i.qty;
    }));
    const catEntries = Object.entries(catRev).sort((a, b) => b[1] - a[1]);
    const catTotal = catEntries.reduce((s, [, v]) => s + v, 0) || 1;
    let acc = 0;
    const grad = catEntries.map(([, v], i) => { const from = acc; acc += (v / catTotal) * 360; return `${COLORS[i % COLORS.length]} ${from}deg ${acc}deg`; }).join(",") || "var(--border) 0 360deg";

    // top products
    const sold = {};
    valid.forEach((o) => o.items.forEach((i) => { sold[i.id] = (sold[i.id] || 0) + i.qty; }));
    const top = Object.entries(sold).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, q]) => ({ p: Products.get(id), q })).filter((x) => x.p);
    const low = prods.filter((p) => p.stock <= 5).sort((a, b) => a.stock - b.stock).slice(0, 6);

    return `
      <div class="kpis">
        <div class="kpi"><span class="ki" style="background:#e6f4fd;color:#1a8fdd"><i class="fa-solid fa-sack-dollar"></i></span><div><small>Total revenue</small><h3>${money(revenue)}</h3><span class="trend"><i class="fa-solid fa-arrow-trend-up"></i> Avg ${money(avg)}/order</span></div></div>
        <div class="kpi"><span class="ki" style="background:#f3e8ff;color:#7c3aed"><i class="fa-solid fa-receipt"></i></span><div><small>Orders</small><h3>${all.length}</h3><span class="trend" style="color:var(--warning)">${all.filter((o) => o.status === "pending").length} pending</span></div></div>
        <div class="kpi"><span class="ki" style="background:#fef3c7;color:#d97706"><i class="fa-solid fa-box-open"></i></span><div><small>Products</small><h3>${prods.length}</h3><span class="trend" style="color:var(--danger)">${prods.filter((p) => p.stock <= 0).length} out of stock</span></div></div>
        <div class="kpi"><span class="ki" style="background:#dcfce7;color:#16a34a"><i class="fa-solid fa-users"></i></span><div><small>Customers</small><h3>${users.length}</h3><span class="trend">${Store.read(Store.KEYS.subscribers, []).length} subscribers</span></div></div>
      </div>

      <div class="dash-grid">
        <div class="panel">
          <div class="panel-head"><h3><i class="fa-solid fa-chart-column"></i> Sales — last 7 days</h3><b>${money(days.reduce((s, d) => s + d.v, 0))}</b></div>
          <div class="bars">${days.map((d) => `<div class="bar"><span style="height:${(d.v / max) * 100}%" data-v="${money(d.v)}"></span></div>`).join("")}</div>
          <div class="bars-labels">${days.map((d) => `<small>${d.label}</small>`).join("")}</div>
        </div>
        <div class="panel">
          <h3><i class="fa-solid fa-chart-pie"></i> Sales by category</h3>
          <div class="donut" style="background:conic-gradient(${grad})"></div>
          <ul class="legend">${catEntries.map(([c, v], i) => `<li><i style="background:${COLORS[i % COLORS.length]}"></i>${esc(catName(c))}<b>${Math.round((v / catTotal) * 100)}%</b></li>`).join("") || '<li class="muted">No sales yet</li>'}</ul>
        </div>
      </div>

      <div class="dash-grid">
        <div class="panel">
          <div class="panel-head"><h3><i class="fa-solid fa-clock-rotate-left"></i> Recent orders</h3><button class="btn btn-outline btn-sm" data-goto="orders">View all</button></div>
          <div class="table-wrap">${ordersTable(all.slice(0, 6), true)}</div>
        </div>
        <div>
          <div class="panel">
            <h3><i class="fa-solid fa-trophy"></i> Top selling</h3>
            ${top.map((t) => `<div class="list-row"><img src="${esc(t.p.image)}" alt="" onerror="imgFallback(this)"><div class="grow"><b>${esc(t.p.name)}</b><small class="muted">${money(t.p.price)}</small></div><span class="chip">${t.q} sold</span></div>`).join("") || '<p class="muted">No sales yet.</p>'}
          </div>
          <div class="panel">
            <h3><i class="fa-solid fa-triangle-exclamation" style="color:var(--warning)"></i> Low stock alerts</h3>
            ${low.map((p) => `<div class="list-row"><img src="${esc(p.image)}" alt="" onerror="imgFallback(this)"><div class="grow"><b>${esc(p.name)}</b><small class="stock-dot ${p.stock <= 0 ? "out" : "low"}">${p.stock <= 0 ? "Out of stock" : p.stock + " left"}</small></div><button class="btn btn-outline btn-sm" data-edit="${esc(p.id)}">Restock</button></div>`).join("") || '<p class="muted">All products are well stocked 👍</p>'}
          </div>
        </div>
      </div>`;
  }

  /* ---------- Products ---------- */
  function products() {
    const q = ui.pSearch.toLowerCase();
    const list = Products.all().filter((p) => (ui.pCat === "all" || p.category === ui.pCat) && (!q || (p.name + " " + p.brand).toLowerCase().includes(q)));
    return `
      <div class="panel">
        <div class="panel-head">
          <div class="filters-row">
            <input type="search" id="p-search" placeholder="Search products..." value="${esc(ui.pSearch)}">
            <select class="select" id="p-cat"><option value="all">All categories</option>${CATEGORIES.map((c) => `<option value="${c.id}" ${ui.pCat === c.id ? "selected" : ""}>${c.name}</option>`).join("")}</select>
          </div>
          <button class="btn btn-primary btn-sm" data-new-product><i class="fa-solid fa-plus"></i> Add product</button>
        </div>
        <p class="muted" style="font-size:.85rem;margin-bottom:10px">${list.length} products</p>
        <div class="table-wrap"><table class="data">
          <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Rating</th><th></th></tr></thead>
          <tbody>${list.map((p) => `
            <tr>
              <td><div class="pcell"><img src="${esc(p.image)}" alt="" onerror="imgFallback(this)"><div><b>${esc(p.name)}</b><br><small class="muted">${esc(p.brand || "")} ${p.badge ? `· <span class="chip" style="padding:0 8px">${esc(p.badge)}</span>` : ""}</small></div></div></td>
              <td>${esc(catName(p.category))}</td>
              <td><b>${money(p.price)}</b>${p.oldPrice > p.price ? `<br><del class="muted" style="font-size:.8rem">${money(p.oldPrice)}</del>` : ""}</td>
              <td><span class="stock-dot ${p.stock <= 0 ? "out" : p.stock <= 5 ? "low" : ""}">${p.stock}</span></td>
              <td>${UI.stars(Products.rating(p).avg)}</td>
              <td><div class="actions">
                <a class="icon-btn" href="product.html?id=${encodeURIComponent(p.id)}" target="_blank" title="View"><i class="fa-regular fa-eye"></i></a>
                <button class="icon-btn" data-edit="${esc(p.id)}" title="Edit"><i class="fa-regular fa-pen-to-square"></i></button>
                <button class="icon-btn danger" data-del-product="${esc(p.id)}" title="Delete"><i class="fa-regular fa-trash-can"></i></button>
              </div></td>
            </tr>`).join("") || `<tr><td colspan="6"><div class="empty-state"><i class="fa-solid fa-box-open"></i><h3>No products found</h3></div></td></tr>`}
          </tbody></table></div>
      </div>`;
  }
  after.products = () => {
    const s = $("#p-search");
    s.addEventListener("input", () => { ui.pSearch = s.value; render(); const n = $("#p-search"); n.focus(); n.setSelectionRange(n.value.length, n.value.length); });
    $("#p-cat").addEventListener("change", (e) => { ui.pCat = e.target.value; render(); });
  };

  function productForm(p) {
    const isNew = !p;
    p = p || { name: "", brand: "", category: "", price: "", oldPrice: "", stock: 10, badge: "", image: "", description: "", features: [] };
    openModal(`
      <h2>${isNew ? "Add new product" : "Edit product"}</h2>
      <form id="product-form" class="form-grid" novalidate>
        <div class="field full"><label>Product image</label>
          <label class="img-drop" id="img-drop">
            <img id="img-preview" src="${esc(p.image) || ""}" alt="" onerror="imgFallback(this)">
            <div><b>Click to upload</b> or drag & drop<br><small class="muted">PNG, JPG, SVG, WEBP — or paste an image URL below</small></div>
            <input type="file" id="img-file" accept="image/*" hidden>
          </label>
        </div>
        <div class="field full"><label>Image URL</label><input name="image" id="img-url" value="${esc(p.image && !p.image.startsWith("data:") ? p.image : "")}" placeholder="https://... or images/products/p1.svg"></div>
        <div class="field"><label>Product name *</label><input name="name" required value="${esc(p.name)}"><span class="err">Name is required</span></div>
        <div class="field"><label>Brand</label><input name="brand" value="${esc(p.brand || "")}"></div>
        <div class="field"><label>Category *</label><select name="category" required><option value="">Select category</option>${CATEGORIES.map((c) => `<option value="${c.id}" ${p.category === c.id ? "selected" : ""}>${c.name}</option>`).join("")}</select><span class="err">Select a category</span></div>
        <div class="field"><label>Badge</label><select name="badge">${["", "New", "Sale", "Hot", "Bestseller", "Premium"].map((b) => `<option value="${b}" ${p.badge === b ? "selected" : ""}>${b || "None"}</option>`).join("")}</select></div>
        <div class="field"><label>Price (Rs.) *</label><input name="price" type="number" min="1" required value="${esc(p.price)}"><span class="err">Enter a valid price</span></div>
        <div class="field"><label>Original price (for discount)</label><input name="oldPrice" type="number" min="0" value="${esc(p.oldPrice || "")}"></div>
        <div class="field"><label>Stock quantity *</label><input name="stock" type="number" min="0" required value="${esc(p.stock)}"><span class="err">Enter stock</span></div>
        <div class="field full"><label>Description</label><textarea name="description" placeholder="Short product description">${esc(p.description || "")}</textarea></div>
        <div class="field full"><label>Key features (one per line)</label><textarea name="features" placeholder="e.g. 6.7&quot; AMOLED display">${esc((p.features || []).join("\n"))}</textarea></div>
      </form>
      <div class="modal-foot"><button class="btn btn-outline" data-close>Cancel</button><button class="btn btn-primary" id="save-product"><i class="fa-solid fa-floppy-disk"></i> ${isNew ? "Add product" : "Save changes"}</button></div>`);

    let imageData = p.image || "";
    const preview = $("#img-preview"), file = $("#img-file"), drop = $("#img-drop");
    const loadFile = (f) => {
      if (!f || !f.type.startsWith("image/")) return toast("Please choose an image file", "error");
      resizeImage(f, 800).then((data) => { imageData = data; preview.src = data; $("#img-url").value = ""; });
    };
    file.addEventListener("change", () => loadFile(file.files[0]));
    ["dragover", "dragenter"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("drag"); }));
    ["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("drag"); }));
    drop.addEventListener("drop", (e) => loadFile(e.dataTransfer.files[0]));
    $("#img-url").addEventListener("input", (e) => { if (e.target.value.trim()) { imageData = e.target.value.trim(); preview.src = imageData; } });

    $("#save-product").addEventListener("click", () => {
      const form = $("#product-form");
      const f = Object.fromEntries(new FormData(form));
      let ok = true;
      const mark = (name, valid) => { form.elements[name].closest(".field").classList.toggle("invalid", !valid); ok = ok && valid; };
      mark("name", f.name.trim().length > 1);
      mark("category", !!f.category);
      mark("price", +f.price > 0);
      mark("stock", f.stock !== "" && +f.stock >= 0);
      if (!ok) return toast("Please fill the required fields", "error");
      if (!imageData) return toast("Please add a product image", "error");
      const data = {
        name: f.name.trim(), brand: f.brand.trim(), category: f.category, badge: f.badge,
        price: Math.round(+f.price), oldPrice: Math.round(+f.oldPrice || 0), stock: Math.round(+f.stock),
        description: f.description.trim() || f.name.trim(), image: imageData,
        features: f.features.split("\n").map((x) => x.trim()).filter(Boolean),
      };
      try {
        Products.upsert(isNew ? data : { ...data, id: p.id });
      } catch (err) {
        return toast("Storage is full — try a smaller image or use an image URL", "error");
      }
      toast(isNew ? "Product added" : "Product updated");
      closeModal();
      render();
    });
  }

  // Downscale uploaded images so they fit in localStorage
  function resizeImage(file, max) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (file.type === "image/svg+xml") return resolve(reader.result);
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement("canvas");
          c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
          const ctx = c.getContext("2d");
          ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
          ctx.drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL("image/jpeg", 0.82));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /* ---------- Orders ---------- */
  function ordersTable(list, compact) {
    if (!list.length) return `<div class="empty-state"><i class="fa-solid fa-receipt"></i><h3>No orders found</h3></div>`;
    return `<table class="data"><thead><tr><th>Order</th><th>Customer</th>${compact ? "" : "<th>Items</th><th>Payment</th>"}<th>Total</th><th>Status</th><th></th></tr></thead><tbody>
      ${list.map((o) => `<tr>
        <td><b>${esc(o.id)}</b><br><small class="muted">${new Date(o.createdAt).toLocaleDateString()}</small></td>
        <td>${esc(o.customer.name)}<br><small class="muted">${esc(o.customer.city || "")}</small></td>
        ${compact ? "" : `<td>${o.items.reduce((s, i) => s + i.qty, 0)}</td><td>${payLabel[o.payment] || esc(o.payment)}<br><small class="${o.paid ? "" : "muted"}" style="${o.paid ? "color:var(--success)" : ""}">${o.paid ? "Paid" : "Unpaid"}</small></td>`}
        <td><b>${money(o.total)}</b></td>
        <td>${compact ? `<span class="status ${esc(o.status)}">${esc(o.status)}</span>` : `<select class="status-select" data-status="${esc(o.id)}">${STATUSES.map((s) => `<option value="${s}" ${o.status === s ? "selected" : ""}>${s[0].toUpperCase() + s.slice(1)}</option>`).join("")}</select>`}</td>
        <td><div class="actions"><button class="icon-btn" data-order="${esc(o.id)}" title="View details"><i class="fa-regular fa-eye"></i></button>${compact ? "" : `<button class="icon-btn danger" data-del-order="${esc(o.id)}" title="Delete"><i class="fa-regular fa-trash-can"></i></button>`}</div></td>
      </tr>`).join("")}</tbody></table>`;
  }
  function orders() {
    const q = ui.oSearch.toLowerCase();
    const all = Orders.all();
    const list = all.filter((o) => (ui.oStatus === "all" || o.status === ui.oStatus) && (!q || (o.id + " " + o.customer.name + " " + o.customer.email).toLowerCase().includes(q)));
    const count = (s) => all.filter((o) => s === "all" || o.status === s).length;
    return `
      <div class="panel">
        <div class="panel-head">
          <div class="seg" id="o-status">${["all", ...STATUSES].map((s) => `<button data-s="${s}" class="${ui.oStatus === s ? "active" : ""}">${s} (${count(s)})</button>`).join("")}</div>
          <div class="filters-row"><input type="search" id="o-search" placeholder="Search by order ID, name or email" value="${esc(ui.oSearch)}"><button class="btn btn-outline btn-sm" id="export-orders"><i class="fa-solid fa-file-csv"></i> Export CSV</button></div>
        </div>
        <div class="table-wrap">${ordersTable(list, false)}</div>
      </div>`;
  }
  after.orders = () => {
    $("#o-status").addEventListener("click", (e) => { const b = e.target.closest("[data-s]"); if (b) { ui.oStatus = b.dataset.s; render(); } });
    const s = $("#o-search");
    s.addEventListener("input", () => { ui.oSearch = s.value; render(); const n = $("#o-search"); n.focus(); n.setSelectionRange(n.value.length, n.value.length); });
    $("#export-orders").addEventListener("click", () => {
      const rows = [["Order ID", "Date", "Customer", "Email", "Phone", "City", "Items", "Payment", "Status", "Total"]];
      Orders.all().forEach((o) => rows.push([o.id, new Date(o.createdAt).toISOString(), o.customer.name, o.customer.email, o.customer.phone, o.customer.city, o.items.map((i) => `${i.name} x${i.qty}`).join("; "), o.payment, o.status, o.total]));
      const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
      download("etrade-orders.csv", csv, "text/csv");
    });
  };

  function orderDetail(id) {
    const o = Orders.get(id);
    if (!o) return;
    openModal(`
      <div class="panel-head" style="padding-right:40px"><div><h2 style="margin:0">Order ${esc(o.id)}</h2><small class="muted">${new Date(o.createdAt).toLocaleString()}</small></div><span class="status ${esc(o.status)}">${esc(o.status)}</span></div>
      <div class="form-grid">
        <div class="panel" style="margin:0"><h3 style="font-size:.95rem"><i class="fa-solid fa-user"></i> Customer</h3>
          <p><b>${esc(o.customer.name)}</b><br>${esc(o.customer.email)}<br>${esc(o.customer.phone)}</p></div>
        <div class="panel" style="margin:0"><h3 style="font-size:.95rem"><i class="fa-solid fa-location-dot"></i> Shipping</h3>
          <p>${esc(o.customer.address)}<br>${esc(o.customer.city)} ${esc(o.customer.zip || "")}<br><small class="muted">${o.shippingMethod === "express" ? "Express" : "Standard"} delivery</small></p></div>
      </div>
      ${o.customer.notes ? `<p style="margin-top:14px"><b>Note:</b> ${esc(o.customer.notes)}</p>` : ""}
      <div style="margin-top:18px">
        ${o.items.map((i) => `<div class="list-row"><img src="${esc(i.image)}" alt="" onerror="imgFallback(this)"><div class="grow"><b>${esc(i.name)}</b><small class="muted">${money(i.price)} × ${i.qty}</small></div><b>${money(i.price * i.qty)}</b></div>`).join("")}
      </div>
      <div style="max-width:320px;margin-left:auto;margin-top:12px">
        <div class="sum-row"><span class="muted">Subtotal</span><span>${money(o.subtotal)}</span></div>
        ${o.discount ? `<div class="sum-row"><span class="muted">Discount ${o.coupon ? "(" + esc(o.coupon) + ")" : ""}</span><span>− ${money(o.discount)}</span></div>` : ""}
        <div class="sum-row"><span class="muted">Shipping</span><span>${o.shipping ? money(o.shipping) : "FREE"}</span></div>
        <div class="sum-row total"><span>Total</span><span>${money(o.total)}</span></div>
        <div class="sum-row"><span class="muted">Payment</span><span>${payLabel[o.payment] || esc(o.payment)}${o.cardLast4 ? " •••• " + esc(o.cardLast4) : ""} · ${o.paid ? "Paid" : "Unpaid"}</span></div>
      </div>
      <div class="modal-foot">
        <select class="status-select" data-status="${esc(o.id)}">${STATUSES.map((s) => `<option value="${s}" ${o.status === s ? "selected" : ""}>${s[0].toUpperCase() + s.slice(1)}</option>`).join("")}</select>
        <button class="btn btn-outline" onclick="window.print()"><i class="fa-solid fa-print"></i> Print</button>
        <button class="btn btn-primary" data-close>Done</button>
      </div>`);
  }

  /* ---------- Customers ---------- */
  function customers() {
    const q = ui.cSearch.toLowerCase();
    const all = Orders.all();
    const list = Auth.users().filter((u) => !q || (u.name + " " + u.email).toLowerCase().includes(q)).map((u) => {
      const os = all.filter((o) => o.userId === u.id || o.customer.email.toLowerCase() === u.email.toLowerCase());
      return { u, count: os.length, spent: os.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0) };
    });
    return `
      <div class="panel">
        <div class="panel-head"><div class="filters-row"><input type="search" id="c-search" placeholder="Search customers..." value="${esc(ui.cSearch)}"></div><span class="muted">${list.length} customers</span></div>
        <div class="table-wrap"><table class="data"><thead><tr><th>Customer</th><th>Phone</th><th>Joined</th><th>Orders</th><th>Total spent</th></tr></thead><tbody>
        ${list.map(({ u, count, spent }) => `<tr>
          <td><div class="pcell"><span class="avatar">${esc(u.name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase())}</span><div><b>${esc(u.name)}</b><br><small class="muted">${esc(u.email)}</small></div></div></td>
          <td>${esc(u.phone || "—")}</td><td>${new Date(u.createdAt).toLocaleDateString()}</td><td>${count}</td><td><b>${money(spent)}</b></td></tr>`).join("") || `<tr><td colspan="5"><div class="empty-state"><h3>No customers found</h3></div></td></tr>`}
        </tbody></table></div>
      </div>`;
  }
  after.customers = () => {
    const s = $("#c-search");
    s.addEventListener("input", () => { ui.cSearch = s.value; render(); const n = $("#c-search"); n.focus(); n.setSelectionRange(n.value.length, n.value.length); });
  };

  /* ---------- Coupons ---------- */
  function coupons() {
    const list = Coupons.all();
    const desc = (c) => (c.type === "percent" ? `${c.value}% off` : c.type === "flat" ? `${money(c.value)} off` : "Free shipping");
    return `
      <div class="dash-grid">
        <div class="panel">
          <h3><i class="fa-solid fa-ticket"></i> Active coupons</h3>
          <div class="table-wrap"><table class="data" style="min-width:480px"><thead><tr><th>Code</th><th>Discount</th><th>Min. order</th><th>Active</th><th></th></tr></thead><tbody>
          ${list.map((c, i) => `<tr><td><b>${esc(c.code)}</b></td><td>${desc(c)}</td><td>${c.min ? money(c.min) : "—"}</td>
            <td><label class="switch"><input type="checkbox" data-coupon-toggle="${i}" ${c.active ? "checked" : ""}><span></span></label></td>
            <td><div class="actions"><button class="icon-btn danger" data-coupon-del="${i}" title="Delete"><i class="fa-regular fa-trash-can"></i></button></div></td></tr>`).join("") || `<tr><td colspan="5" class="muted">No coupons yet.</td></tr>`}
          </tbody></table></div>
        </div>
        <div class="panel">
          <h3><i class="fa-solid fa-plus"></i> Create coupon</h3>
          <form id="coupon-form" class="form-grid">
            <div class="field full"><label>Code</label><input name="code" required placeholder="e.g. EID25" style="text-transform:uppercase"></div>
            <div class="field full"><label>Type</label><select name="type"><option value="percent">Percentage off</option><option value="flat">Fixed amount off</option><option value="ship">Free shipping</option></select></div>
            <div class="field"><label>Value</label><input name="value" type="number" min="0" value="10"></div>
            <div class="field"><label>Min. order (Rs.)</label><input name="min" type="number" min="0" value="0"></div>
            <button class="btn btn-primary full">Create coupon</button>
          </form>
        </div>
      </div>`;
  }
  after.coupons = () => {
    $("#coupon-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target));
      const code = f.code.trim().toUpperCase().replace(/\s+/g, "");
      if (!code) return toast("Enter a code", "error");
      const list = Coupons.all();
      if (list.some((c) => c.code === code)) return toast("This code already exists", "error");
      if (f.type === "percent" && (+f.value <= 0 || +f.value > 90)) return toast("Percentage must be between 1 and 90", "error");
      list.push({ code, type: f.type, value: +f.value || 0, min: +f.min || 0, active: true });
      Coupons.save(list);
      toast(`Coupon ${code} created`);
      render();
    });
  };

  /* ---------- Settings ---------- */
  function settings() {
    const s = Settings.get();
    return `
      <div class="dash-grid">
        <div class="panel">
          <h3><i class="fa-solid fa-truck"></i> Shipping & tax</h3>
          <form id="settings-form" class="form-grid">
            <div class="field"><label>Standard shipping (Rs.)</label><input name="shippingStandard" type="number" min="0" value="${s.shippingStandard}"></div>
            <div class="field"><label>Express shipping (Rs.)</label><input name="shippingExpress" type="number" min="0" value="${s.shippingExpress}"></div>
            <div class="field"><label>Free shipping over (Rs.)</label><input name="freeShippingOver" type="number" min="0" value="${s.freeShippingOver}"></div>
            <div class="field"><label>Tax rate (%)</label><input name="taxRate" type="number" min="0" max="50" step="0.5" value="${s.taxRate}"></div>
            <div class="full"><button class="btn btn-primary"><i class="fa-solid fa-floppy-disk"></i> Save settings</button></div>
          </form>
        </div>
        <div class="panel">
          <h3><i class="fa-solid fa-database"></i> Data</h3>
          <p class="muted" style="font-size:.9rem;margin-bottom:16px">All store data is saved in this browser (localStorage). Export a backup or reset to the demo catalogue.</p>
          <div style="display:grid;gap:10px">
            <button class="btn btn-outline" id="export-data"><i class="fa-solid fa-download"></i> Export backup (JSON)</button>
            <label class="btn btn-outline"><i class="fa-solid fa-upload"></i> Import backup<input type="file" id="import-data" accept="application/json" hidden></label>
            <button class="btn btn-danger" id="reset-data"><i class="fa-solid fa-rotate"></i> Reset demo data</button>
          </div>
        </div>
      </div>`;
  }
  after.settings = () => {
    $("#settings-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target));
      Object.keys(f).forEach((k) => (f[k] = Math.max(0, +f[k] || 0)));
      Settings.save(f);
      toast("Settings saved");
    });
    $("#export-data").addEventListener("click", () => {
      const data = {};
      Object.values(Store.KEYS).forEach((k) => (data[k] = Store.read(k, null)));
      download(`etrade-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2), "application/json");
    });
    $("#import-data").addEventListener("change", (e) => {
      const f = e.target.files[0];
      if (!f) return;
      f.text().then((txt) => {
        try {
          const data = JSON.parse(txt);
          Object.entries(data).forEach(([k, v]) => { if (Object.values(Store.KEYS).includes(k) && v !== null) localStorage.setItem(k, JSON.stringify(v)); });
          toast("Backup imported");
          render();
        } catch { toast("Invalid backup file", "error"); }
      });
    });
    $("#reset-data").addEventListener("click", () => {
      if (!confirm("Reset all products, orders, users and coupons to demo data?")) return;
      [Store.KEYS.cart, Store.KEYS.wishlist, Store.KEYS.reviews, Store.KEYS.session].forEach((k) => localStorage.removeItem(k));
      Store.seed(true);
      toast("Demo data restored");
      render();
    });
  };

  /* ---------- Modal ---------- */
  function openModal(html) {
    $("#admin-modal .modal-content").innerHTML = html;
    $("#admin-modal").classList.add("open");
    document.body.classList.add("no-scroll");
  }
  function closeModal() {
    $("#admin-modal").classList.remove("open");
    document.body.classList.remove("no-scroll");
  }
  function download(name, content, type) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type }));
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  /* ---------- Delegated events ---------- */
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-new-product],[data-edit],[data-del-product],[data-order],[data-del-order],[data-goto],[data-close],[data-coupon-del],[data-theme-toggle],.overlay");
    if (!t) return;
    if (t.matches("[data-new-product]")) productForm(null);
    else if (t.matches("[data-edit]")) productForm(Products.get(t.dataset.edit));
    else if (t.matches("[data-del-product]")) {
      const p = Products.get(t.dataset.delProduct);
      if (p && confirm(`Delete "${p.name}"? This cannot be undone.`)) { Products.remove(p.id); toast("Product deleted", "info"); render(); }
    }
    else if (t.matches("[data-order]")) orderDetail(t.dataset.order);
    else if (t.matches("[data-del-order]")) {
      if (confirm(`Delete order ${t.dataset.delOrder}?`)) { Orders.remove(t.dataset.delOrder); toast("Order deleted", "info"); render(); }
    }
    else if (t.matches("[data-goto]")) go(t.dataset.goto);
    else if (t.matches("[data-coupon-del]")) {
      const list = Coupons.all(); const c = list[+t.dataset.couponDel];
      if (c && confirm(`Delete coupon ${c.code}?`)) { list.splice(+t.dataset.couponDel, 1); Coupons.save(list); render(); }
    }
    else if (t.matches("[data-theme-toggle]")) {
      const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem(Store.KEYS.theme, next);
      $("[data-theme-toggle] i").className = next === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
    }
    else if (t.matches(".overlay")) { $("#sidebar").classList.remove("open"); t.classList.remove("show"); }
    else closeModal();
  });
  document.addEventListener("change", (e) => {
    if (e.target.matches("[data-status]")) {
      Orders.setStatus(e.target.dataset.status, e.target.value);
      toast(`Order ${e.target.dataset.status} marked as ${e.target.value}`);
      const modalOpen = $("#admin-modal").classList.contains("open");
      render();
      if (modalOpen) orderDetail(e.target.dataset.status);
    }
    if (e.target.matches("[data-coupon-toggle]")) {
      const list = Coupons.all();
      list[+e.target.dataset.couponToggle].active = e.target.checked;
      Coupons.save(list);
      toast("Coupon updated", "info");
    }
  });
  document.addEventListener("keydown", (e) => e.key === "Escape" && closeModal());
  window.addEventListener("storage", () => sessionStorage.getItem(SESSION) && render());

  if (document.documentElement.getAttribute("data-theme") === "dark") $("[data-theme-toggle] i").className = "fa-solid fa-sun";
  if (sessionStorage.getItem(SESSION)) showApp();
})();
