/* Account page: login / register / orders / wishlist / profile / guest tracking */
(function () {
  UI.init("account");
  const { Auth, Orders, Wishlist, Products, money, esc } = Store;
  const { $, $$ } = UI;
  const root = $("#account-root");
  const params = new URLSearchParams(location.search);
  const STEPS = ["pending", "processing", "shipped", "delivered"];
  const STEP_ICONS = ["fa-receipt", "fa-box", "fa-truck", "fa-house-circle-check"];
  const payLabel = { card: "Card", jazzcash: "JazzCash", easypaisa: "Easypaisa", bank: "Bank transfer", cod: "Cash on delivery" };

  function orderCard(o, cancellable) {
    const idx = STEPS.indexOf(o.status);
    const highlight = params.get("order") === o.id;
    return `
      <div class="order-card" ${highlight ? 'style="border-color:var(--primary);box-shadow:0 0 0 4px var(--primary-soft)"' : ""}>
        <div class="oc-head">
          <div><b>${esc(o.id)}</b><br><small class="muted">${new Date(o.createdAt).toLocaleString()} · ${payLabel[o.payment] || esc(o.payment)}</small></div>
          <div style="text-align:right"><span class="status ${esc(o.status)}">${esc(o.status)}</span><br><b>${money(o.total)}</b></div>
        </div>
        <div class="oc-items">${o.items.map((i) => `<img src="${esc(i.image)}" alt="${esc(i.name)}" title="${esc(i.name)} × ${i.qty}" onerror="imgFallback(this)">`).join("")}</div>
        <small class="muted">${o.items.map((i) => `${esc(i.name)} × ${i.qty}`).join(", ")}</small>
        ${o.status === "cancelled" ? `<p style="color:var(--danger);margin-top:10px;font-size:.88rem"><i class="fa-solid fa-ban"></i> This order was cancelled.</p>` : `
        <div class="track">${STEPS.map((s, i) => `<div class="tp ${i <= idx ? "done" : ""}"><i class="fa-solid ${i <= idx ? "fa-check" : STEP_ICONS[i]}"></i>${s}</div>`).join("")}</div>`}
        ${cancellable && o.status === "pending" ? `<div style="margin-top:14px;text-align:right"><button class="btn btn-outline btn-sm" data-cancel="${esc(o.id)}">Cancel order</button></div>` : ""}
      </div>`;
  }

  /* ---------- Logged out ---------- */
  function renderAuth(mode = "login") {
    root.innerHTML = `
      <div class="auth-wrap">
        <div class="panel">
          <div class="auth-tabs"><button class="${mode === "login" ? "active" : ""}" data-mode="login">Login</button><button class="${mode === "register" ? "active" : ""}" data-mode="register">Register</button></div>
          ${mode === "login" ? `
          <h2>Welcome back 👋</h2><p class="muted" style="margin-bottom:20px">Log in to track orders and check out faster.</p>
          <form id="auth-form" class="form-grid">
            <div class="field full"><label>Email</label><div class="input-icon"><i class="fa-regular fa-envelope"></i><input name="email" type="email" required placeholder="you@example.com"></div></div>
            <div class="field full"><label>Password</label><div class="input-icon"><i class="fa-solid fa-lock"></i><input name="password" type="password" required minlength="6" placeholder="••••••"></div></div>
            <button class="btn btn-primary btn-block full">Login</button>
            <p class="muted full" style="font-size:.8rem;text-align:center">Demo account: ayesha@example.com / 123456</p>
          </form>` : `
          <h2>Create an account</h2><p class="muted" style="margin-bottom:20px">Join eTrade for exclusive deals and easy order tracking.</p>
          <form id="auth-form" class="form-grid">
            <div class="field full"><label>Full name</label><div class="input-icon"><i class="fa-regular fa-user"></i><input name="name" required minlength="2" placeholder="Your name"></div></div>
            <div class="field full"><label>Email</label><div class="input-icon"><i class="fa-regular fa-envelope"></i><input name="email" type="email" required placeholder="you@example.com"></div></div>
            <div class="field full"><label>Phone (optional)</label><div class="input-icon"><i class="fa-solid fa-phone"></i><input name="phone" type="tel" placeholder="03XX-XXXXXXX"></div></div>
            <div class="field full"><label>Password</label><div class="input-icon"><i class="fa-solid fa-lock"></i><input name="password" type="password" required minlength="6" placeholder="At least 6 characters"></div></div>
            <button class="btn btn-primary btn-block full">Create account</button>
          </form>`}
        </div>
        <div class="panel" id="orders">
          <h3><i class="fa-solid fa-location-crosshairs"></i> Track an order</h3>
          <form id="track-form" class="form-grid">
            <div class="field"><label>Order ID</label><input name="id" required placeholder="ET-123456" value="${esc(params.get("order") || "")}"></div>
            <div class="field"><label>Email used at checkout</label><input name="email" type="email" required></div>
            <button class="btn btn-dark full">Track</button>
          </form>
          <div id="track-result" style="margin-top:16px"></div>
        </div>
      </div>`;
    $$("[data-mode]").forEach((b) => (b.onclick = () => renderAuth(b.dataset.mode)));
    $("#auth-form").onsubmit = (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target));
      const res = mode === "login" ? Auth.login(f.email.trim(), f.password) : Auth.register({ name: f.name.trim(), email: f.email.trim(), password: f.password, phone: f.phone.trim() });
      if (!res.ok) return UI.toast(res.msg, "error");
      UI.toast(mode === "login" ? `Welcome back, ${res.user.name.split(" ")[0]}!` : "Account created successfully!");
      const next = params.get("next");
      if (next && /^[a-z]+\.html$/.test(next)) location.href = next;
      else location.reload();
    };
    $("#track-form").onsubmit = (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target));
      const o = Orders.get(f.id.trim().toUpperCase());
      $("#track-result").innerHTML = o && o.customer.email.toLowerCase() === f.email.trim().toLowerCase()
        ? orderCard(o, false) : `<p style="color:var(--danger)"><i class="fa-solid fa-circle-exclamation"></i> No order found with these details.</p>`;
    };
  }

  /* ---------- Logged in ---------- */
  let tab = (location.hash || "#orders").slice(1);
  function renderDash() {
    const u = Auth.current();
    const orders = Orders.forUser(u.id);
    const spent = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
    const initials = u.name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
    if (!["orders", "wishlist", "profile"].includes(tab)) tab = "orders";
    root.innerHTML = `
      <div class="breadcrumb"><a href="index.html">Home</a> / <span>My account</span></div>
      <div class="account">
        <aside class="panel acc-nav">
          <div class="who"><span class="avatar">${esc(initials)}</span><div><b>${esc(u.name)}</b><br><small class="muted">${esc(u.email)}</small></div></div>
          <button data-tab="orders" class="${tab === "orders" ? "active" : ""}"><i class="fa-solid fa-box"></i> My orders <span class="chip" style="margin-left:auto;padding:1px 8px">${orders.length}</span></button>
          <button data-tab="wishlist" class="${tab === "wishlist" ? "active" : ""}"><i class="fa-regular fa-heart"></i> Wishlist</button>
          <button data-tab="profile" class="${tab === "profile" ? "active" : ""}"><i class="fa-regular fa-id-card"></i> Profile</button>
          <button id="logout"><i class="fa-solid fa-arrow-right-from-bracket"></i> Logout</button>
        </aside>
        <section>
          <div class="features" style="margin:0 0 22px;grid-template-columns:repeat(auto-fit,minmax(180px,1fr))">
            <div class="feature"><i class="fa-solid fa-bag-shopping"></i><div><h4>${orders.length}</h4><p>Total orders</p></div></div>
            <div class="feature"><i class="fa-solid fa-wallet"></i><div><h4>${money(spent)}</h4><p>Total spent</p></div></div>
            <div class="feature"><i class="fa-solid fa-heart"></i><div><h4>${Wishlist.items().length}</h4><p>Saved items</p></div></div>
          </div>
          <div class="panel" id="tab-body"></div>
        </section>
      </div>`;
    const body = $("#tab-body");
    if (tab === "orders") {
      body.innerHTML = `<h3><i class="fa-solid fa-box"></i> Order history</h3>` + (orders.length ? orders.map((o) => orderCard(o, true)).join("")
        : `<div class="empty-state"><i class="fa-solid fa-box-open"></i><h3>No orders yet</h3><p>When you place an order it will show up here.</p><br><a class="btn btn-primary" href="shop.html">Start shopping</a></div>`);
    } else if (tab === "wishlist") {
      const items = Wishlist.items().map((id) => Products.get(id)).filter(Boolean);
      body.innerHTML = `<h3><i class="fa-solid fa-heart"></i> Wishlist</h3>` + (items.length ? `<div class="grid">${items.map(UI.productCard).join("")}</div>`
        : `<div class="empty-state"><i class="fa-regular fa-heart"></i><h3>Your wishlist is empty</h3><p>Save products you love for later.</p></div>`);
      UI.reveal(body);
    } else {
      body.innerHTML = `<h3><i class="fa-regular fa-id-card"></i> Profile details</h3>
        <form id="profile" class="form-grid">
          <div class="field"><label>Full name</label><input name="name" required value="${esc(u.name)}"></div>
          <div class="field"><label>Phone</label><input name="phone" value="${esc(u.phone || "")}"></div>
          <div class="field full"><label>Email</label><input value="${esc(u.email)}" disabled></div>
          <div class="field"><label>Address</label><input name="address" value="${esc(u.address || "")}"></div>
          <div class="field"><label>City</label><input name="city" value="${esc(u.city || "")}"></div>
          <div class="field full"><label>New password (leave blank to keep current)</label><input name="password" type="password" minlength="6"></div>
          <div class="full"><button class="btn btn-primary">Save changes</button></div>
        </form>`;
      $("#profile").onsubmit = (e) => {
        e.preventDefault();
        const f = Object.fromEntries(new FormData(e.target));
        if (!f.password) delete f.password;
        Auth.update(f);
        UI.toast("Profile updated");
        renderDash();
      };
    }
    $$("[data-tab]").forEach((b) => (b.onclick = () => { tab = b.dataset.tab; history.replaceState(null, "", "#" + tab); renderDash(); }));
    $("#logout").onclick = () => { Auth.logout(); UI.toast("Logged out", "info"); setTimeout(() => (location.href = "index.html"), 500); };
  }

  document.addEventListener("click", (e) => {
    const c = e.target.closest("[data-cancel]");
    if (c && confirm("Cancel this order?")) { Orders.setStatus(c.dataset.cancel, "cancelled"); UI.toast("Order cancelled", "info"); renderDash(); }
  });
  document.addEventListener("store:change", (e) => {
    if (Auth.current() && tab === "wishlist" && e.detail.key === Store.KEYS.wishlist) renderDash();
  });

  Auth.current() ? renderDash() : renderAuth();
})();
