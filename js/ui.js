/* =========================================================
   eTrade — Shared UI: header, footer, cart & wishlist drawers,
   quick view, toasts, theme, product cards
   ========================================================= */
(function () {
  const { Products, Cart, Wishlist, Auth, Settings, CATEGORIES, money, esc, catName } = Store;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  const FALLBACK_IMG =
    "data:image/svg+xml;utf8," +
    encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="#eef2f7"/><path d="M150 250l40-50 30 36 20-24 50 38H110z" fill="#cbd5e1"/><circle cx="160" cy="160" r="22" fill="#cbd5e1"/></svg>');
  window.imgFallback = (img) => { img.onerror = null; img.src = FALLBACK_IMG; };

  /* ---------- Theme ---------- */
  const savedTheme = localStorage.getItem(Store.KEYS.theme);
  if (savedTheme) document.documentElement.setAttribute("data-theme", savedTheme);
  function toggleTheme() {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(Store.KEYS.theme, next);
    updateThemeIcon();
  }
  function updateThemeIcon() {
    const dark = document.documentElement.getAttribute("data-theme") === "dark";
    $$("[data-theme-toggle] i").forEach((i) => (i.className = dark ? "fa-solid fa-sun" : "fa-solid fa-moon"));
  }

  /* ---------- Helpers ---------- */
  function stars(rating, count) {
    let h = "";
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) h += '<i class="fa-solid fa-star"></i>';
      else if (rating >= i - 0.5) h += '<i class="fa-solid fa-star-half-stroke"></i>';
      else h += '<i class="fa-regular fa-star"></i>';
    }
    return `<div class="stars">${h}${count !== undefined ? `<span>(${count})</span>` : ""}</div>`;
  }
  function badgeHtml(p) {
    if (p.stock <= 0) return '<span class="badge out">Sold out</span>';
    if (p.badge) return `<span class="badge ${esc(p.badge.toLowerCase())}">${esc(p.badge)}</span>`;
    if (p.oldPrice > p.price) return `<span class="badge sale">-${Math.round((1 - p.price / p.oldPrice) * 100)}%</span>`;
    return "";
  }
  function priceHtml(p) {
    const off = p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
    return `<div class="price"><b>${money(p.price)}</b>${off ? `<del>${money(p.oldPrice)}</del><span class="off">${off}% off</span>` : ""}</div>`;
  }
  function productCard(p) {
    const r = Products.rating(p);
    const wish = Wishlist.has(p.id);
    const out = p.stock <= 0;
    return `
    <article class="card reveal" data-id="${esc(p.id)}">
      ${badgeHtml(p)}
      <div class="card-actions">
        <button class="icon-btn ${wish ? "on" : ""}" data-wish="${esc(p.id)}" title="Wishlist" aria-label="Add to wishlist"><i class="fa-${wish ? "solid" : "regular"} fa-heart"></i></button>
        <button class="icon-btn" data-quick="${esc(p.id)}" title="Quick view" aria-label="Quick view"><i class="fa-regular fa-eye"></i></button>
      </div>
      <a class="card-media" href="product.html?id=${encodeURIComponent(p.id)}"><img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" onerror="imgFallback(this)"></a>
      <div class="card-body">
        <span class="card-cat">${esc(catName(p.category))} · ${esc(p.brand || "")}</span>
        <a class="card-title" href="product.html?id=${encodeURIComponent(p.id)}">${esc(p.name)}</a>
        ${stars(r.avg, r.count)}
        ${priceHtml(p)}
        ${p.stock > 0 && p.stock <= 5 ? `<span class="stock-low"><i class="fa-solid fa-fire"></i> Only ${p.stock} left</span>` : ""}
        <div class="card-foot">
          <button class="add-btn" data-add="${esc(p.id)}" ${out ? "disabled" : ""}>
            <i class="fa-solid ${out ? "fa-ban" : "fa-cart-plus"}"></i> ${out ? "Out of stock" : "Add to cart"}
          </button>
        </div>
      </div>
    </article>`;
  }

  /* ---------- Toasts ---------- */
  function toast(msg, type = "success") {
    let wrap = $(".toasts");
    if (!wrap) { wrap = document.createElement("div"); wrap.className = "toasts"; document.body.appendChild(wrap); }
    const icon = { success: "fa-circle-check", error: "fa-circle-exclamation", info: "fa-circle-info" }[type];
    const t = document.createElement("div");
    t.className = "toast " + type;
    t.innerHTML = `<i class="fa-solid ${icon}"></i><span>${esc(msg)}</span>`;
    wrap.appendChild(t);
    setTimeout(() => { t.classList.add("hide"); setTimeout(() => t.remove(), 300); }, 2800);
  }

  /* ---------- Layout injection ---------- */
  function headerHtml(active) {
    const user = Auth.current();
    const link = (href, label, key) => `<a href="${href}" class="${active === key ? "active" : ""}">${label}</a>`;
    return `
    <div class="topbar"><div class="container">
      <span><i class="fa-solid fa-truck-fast"></i> Free delivery on orders over ${money(Settings.get().freeShippingOver)}<span class="tb-code"> · Use code <b>WELCOME10</b></span></span>
      <div class="tb-links"><a href="account.html#orders">Track order</a><a href="#site-footer">Help</a><a href="admin.html"><i class="fa-solid fa-user-shield"></i> Admin</a></div>
    </div></div>
    <header class="header"><div class="container">
      <button class="icon-btn menu-toggle" data-open-menu aria-label="Menu"><i class="fa-solid fa-bars"></i></button>
      <a href="index.html" class="logo"><span class="logo-mark">e</span><span><b>e</b>Trade</span></a>
      <nav class="nav">
        ${link("index.html", "Home", "home")}
        ${link("shop.html", "Shop", "shop")}
        ${link("index.html#deals", "Deals", "deals")}
        ${link("shop.html?sort=new", "New Arrivals", "new")}
        ${link("account.html", "My Account", "account")}
      </nav>
      <form class="search-box" data-search>
        <input type="search" name="q" placeholder="Search products, brands..." autocomplete="off" aria-label="Search">
        <button type="submit" aria-label="Search"><i class="fa-solid fa-magnifying-glass"></i></button>
        <div class="search-suggest"></div>
      </form>
      <div class="header-actions">
        <button class="icon-btn hide-sm" data-theme-toggle aria-label="Toggle theme"><i class="fa-solid fa-moon"></i></button>
        <a class="icon-btn hide-sm" href="account.html" title="${user ? esc(user.name) : "Login"}" aria-label="Account"><i class="fa-${user ? "solid" : "regular"} fa-user"></i></a>
        <button class="icon-btn" data-open-wish aria-label="Wishlist"><i class="fa-regular fa-heart"></i><span class="count" data-wish-count></span></button>
        <button class="icon-btn" data-open-cart aria-label="Cart"><i class="fa-solid fa-bag-shopping"></i><span class="count" data-cart-count></span></button>
      </div>
    </div></header>
    <aside class="mobile-nav" aria-label="Mobile menu">
      <div class="mn-head"><a href="index.html" class="logo"><span class="logo-mark">e</span><span><b>e</b>Trade</span></a>
        <button class="icon-btn" data-close aria-label="Close"><i class="fa-solid fa-xmark"></i></button></div>
      <form class="search-box" data-search><input type="search" name="q" placeholder="Search products..." autocomplete="off"><button type="submit"><i class="fa-solid fa-magnifying-glass"></i></button><div class="search-suggest"></div></form>
      <a href="index.html"><i class="fa-solid fa-house"></i> Home</a>
      <a href="shop.html"><i class="fa-solid fa-store"></i> Shop</a>
      <a href="index.html#deals"><i class="fa-solid fa-bolt"></i> Deals</a>
      <a href="shop.html?sort=new"><i class="fa-solid fa-star"></i> New Arrivals</a>
      <a href="account.html"><i class="fa-solid fa-user"></i> ${user ? "My Account" : "Login / Register"}</a>
      <a href="account.html#orders"><i class="fa-solid fa-box"></i> Track Order</a>
      <a href="admin.html"><i class="fa-solid fa-user-shield"></i> Admin Panel</a>
      <a href="#" data-theme-toggle><i class="fa-solid fa-moon"></i> Toggle dark mode</a>
    </aside>`;
  }

  function footerHtml() {
    return `
    <footer class="footer" id="site-footer"><div class="container">
      <div class="footer-grid">
        <div>
          <a href="index.html" class="logo"><span class="logo-mark">e</span><span><b>e</b>Trade</span></a>
          <p>Your one-stop shop for the latest phones, laptops, wearables and audio gear — genuine products, warranty and fast delivery across Pakistan.</p>
          <div class="socials">
            <a href="#" aria-label="Facebook"><i class="fa-brands fa-facebook-f"></i></a>
            <a href="#" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a>
            <a href="#" aria-label="X"><i class="fa-brands fa-x-twitter"></i></a>
            <a href="#" aria-label="YouTube"><i class="fa-brands fa-youtube"></i></a>
          </div>
        </div>
        <div><h5>Shop</h5><ul>
          ${CATEGORIES.slice(0, 5).map((c) => `<li><a href="shop.html?cat=${c.id}">${c.name}</a></li>`).join("")}
        </ul></div>
        <div><h5>Customer care</h5><ul>
          <li><a href="account.html">My account</a></li>
          <li><a href="account.html#orders">Track your order</a></li>
          <li><a href="account.html#wishlist">Wishlist</a></li>
          <li><a href="checkout.html">Checkout</a></li>
          <li><a href="admin.html">Admin panel</a></li>
        </ul></div>
        <div><h5>Contact</h5><ul>
          <li><i class="fa-solid fa-location-dot"></i> Shahrah-e-Faisal, Karachi</li>
          <li><i class="fa-solid fa-phone"></i> +92 300 0000000</li>
          <li><i class="fa-solid fa-envelope"></i> support@etrade.demo</li>
          <li><i class="fa-solid fa-clock"></i> Mon–Sat, 10am – 8pm</li>
        </ul></div>
      </div>
      <div class="footer-bottom">
        <span>© ${new Date().getFullYear()} eTrade. Demo store — all rights reserved.</span>
        <div class="pay-icons"><i class="fa-brands fa-cc-visa"></i><i class="fa-brands fa-cc-mastercard"></i><i class="fa-brands fa-cc-paypal"></i><i class="fa-brands fa-cc-amex"></i><i class="fa-solid fa-money-bill-wave"></i></div>
      </div>
    </div></footer>
    <div class="overlay"></div>
    <aside class="drawer" id="cart-drawer" aria-label="Shopping cart">
      <div class="drawer-head"><h3><i class="fa-solid fa-bag-shopping"></i> Your cart</h3><button class="icon-btn" data-close aria-label="Close"><i class="fa-solid fa-xmark"></i></button></div>
      <div class="drawer-body"></div>
      <div class="drawer-foot"></div>
    </aside>
    <aside class="drawer" id="wish-drawer" aria-label="Wishlist">
      <div class="drawer-head"><h3><i class="fa-solid fa-heart"></i> Wishlist</h3><button class="icon-btn" data-close aria-label="Close"><i class="fa-solid fa-xmark"></i></button></div>
      <div class="drawer-body"></div>
    </aside>
    <div class="modal" id="quick-modal" role="dialog" aria-modal="true">
      <div class="modal-backdrop" data-close></div>
      <div class="modal-box"><button class="icon-btn modal-close" data-close aria-label="Close"><i class="fa-solid fa-xmark"></i></button><div class="modal-content"></div></div>
    </div>
    <button class="icon-btn back-top" aria-label="Back to top"><i class="fa-solid fa-arrow-up"></i></button>`;
  }

  /* ---------- Drawers ---------- */
  const overlay = () => $(".overlay");
  function openPanel(el) {
    closeAll();
    el.classList.add("open");
    overlay().classList.add("show");
    document.body.classList.add("no-scroll");
  }
  function closeAll() {
    $$(".drawer.open, .mobile-nav.open, .filters.open, .modal.open").forEach((d) => d.classList.remove("open"));
    overlay() && overlay().classList.remove("show");
    document.body.classList.remove("no-scroll");
  }

  function renderCart() {
    const drawer = $("#cart-drawer");
    if (!drawer) return;
    const items = Cart.detailed();
    const body = $(".drawer-body", drawer);
    const foot = $(".drawer-foot", drawer);
    if (!items.length) {
      body.innerHTML = `<div class="empty-state"><i class="fa-solid fa-cart-shopping"></i><h3>Your cart is empty</h3><p>Looks like you haven't added anything yet.</p><br><a href="shop.html" class="btn btn-primary">Start shopping</a></div>`;
      foot.style.display = "none";
      return;
    }
    foot.style.display = "";
    body.innerHTML = items.map((i) => `
      <div class="line-item">
        <a href="product.html?id=${encodeURIComponent(i.id)}"><img src="${esc(i.product.image)}" alt="" onerror="imgFallback(this)"></a>
        <div>
          <h5>${esc(i.product.name)}</h5>
          <div class="li-price">${money(i.product.price)}</div>
          <div class="qty"><button data-qty="${esc(i.id)}" data-d="-1" aria-label="Decrease">−</button><span>${i.qty}</span><button data-qty="${esc(i.id)}" data-d="1" aria-label="Increase">+</button></div>
        </div>
        <div style="text-align:right"><b>${money(i.product.price * i.qty)}</b><br><button class="remove" data-remove="${esc(i.id)}" aria-label="Remove"><i class="fa-regular fa-trash-can"></i></button></div>
      </div>`).join("");
    const sub = Cart.subtotal();
    const s = Settings.get();
    const left = s.freeShippingOver - sub;
    const pct = Math.min(100, (sub / s.freeShippingOver) * 100);
    foot.innerHTML = `
      <div class="ship-progress">${left > 0 ? `Add <b>${money(left)}</b> more for <b>FREE delivery</b> 🚚` : `🎉 You've unlocked <b>FREE delivery!</b>`}
        <div class="progress"><span style="width:${pct}%"></span></div></div>
      <div class="sum-row total" style="border:none;margin:0;padding-top:0"><span>Subtotal</span><span>${money(sub)}</span></div>
      <p class="muted" style="font-size:.8rem;margin-bottom:14px">Shipping & discounts calculated at checkout.</p>
      <a href="checkout.html" class="btn btn-primary btn-block"><i class="fa-solid fa-lock"></i> Checkout</a>
      <a href="shop.html" class="btn btn-outline btn-block">Continue shopping</a>`;
  }

  function renderWishlist() {
    const drawer = $("#wish-drawer");
    if (!drawer) return;
    const items = Wishlist.items().map((id) => Products.get(id)).filter(Boolean);
    const body = $(".drawer-body", drawer);
    body.innerHTML = items.length ? items.map((p) => `
      <div class="line-item">
        <a href="product.html?id=${encodeURIComponent(p.id)}"><img src="${esc(p.image)}" alt="" onerror="imgFallback(this)"></a>
        <div><h5>${esc(p.name)}</h5><div class="li-price">${money(p.price)}</div>
          <button class="btn btn-primary btn-sm" style="margin-top:6px" data-add="${esc(p.id)}" ${p.stock <= 0 ? "disabled" : ""}><i class="fa-solid fa-cart-plus"></i> ${p.stock <= 0 ? "Sold out" : "Add"}</button></div>
        <button class="remove" data-wish="${esc(p.id)}" aria-label="Remove"><i class="fa-solid fa-xmark"></i></button>
      </div>`).join("")
      : `<div class="empty-state"><i class="fa-regular fa-heart"></i><h3>No saved items</h3><p>Tap the heart on any product to save it here.</p></div>`;
  }

  function updateCounts() {
    const c = Cart.count(), w = Wishlist.items().length;
    $$("[data-cart-count]").forEach((el) => { el.textContent = c || ""; });
    $$("[data-wish-count]").forEach((el) => { el.textContent = w || ""; });
  }

  /* ---------- Quick view ---------- */
  function quickView(id) {
    const p = Products.get(id);
    if (!p) return;
    const r = Products.rating(p);
    const modal = $("#quick-modal");
    $(".modal-content", modal).innerHTML = `
      <div class="quick-view">
        <div class="qv-img"><img src="${esc(p.image)}" alt="${esc(p.name)}" onerror="imgFallback(this)"></div>
        <div class="qv-info">
          <span class="card-cat">${esc(catName(p.category))} · ${esc(p.brand || "")}</span>
          <h2>${esc(p.name)}</h2>
          ${stars(r.avg, r.count)}
          ${priceHtml(p)}
          <p class="muted">${esc(p.description)}</p>
          ${(p.features || []).length ? `<ul class="pd-features" style="margin:0">${p.features.slice(0, 4).map((f) => `<li><i class="fa-solid fa-check"></i>${esc(f)}</li>`).join("")}</ul>` : ""}
          <div class="pd-buy" style="margin:6px 0 0">
            <button class="btn btn-primary" data-add="${esc(p.id)}" ${p.stock <= 0 ? "disabled" : ""}><i class="fa-solid fa-cart-plus"></i> ${p.stock <= 0 ? "Out of stock" : "Add to cart"}</button>
            <a class="btn btn-outline" href="product.html?id=${encodeURIComponent(p.id)}">View details</a>
          </div>
        </div>
      </div>`;
    openPanel(modal);
  }

  /* ---------- Search suggestions ---------- */
  function bindSearch(form) {
    const input = $("input", form);
    const box = $(".search-suggest", form);
    const params = new URLSearchParams(location.search);
    if (params.get("q")) input.value = params.get("q");
    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      if (q.length < 2) { box.classList.remove("open"); return; }
      const res = Products.all().filter((p) => (p.name + " " + p.brand + " " + catName(p.category)).toLowerCase().includes(q)).slice(0, 6);
      box.innerHTML = res.length ? res.map((p) => `<a href="product.html?id=${encodeURIComponent(p.id)}"><img src="${esc(p.image)}" alt="" onerror="imgFallback(this)"><span>${esc(p.name)}<br><small class="muted">${money(p.price)}</small></span></a>`).join("")
        : `<div class="empty">No products found for “${esc(q)}”</div>`;
      box.classList.add("open");
    });
    input.addEventListener("blur", () => setTimeout(() => box.classList.remove("open"), 200));
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      location.href = "shop.html?q=" + encodeURIComponent(input.value.trim());
    });
  }

  /* ---------- Global actions ---------- */
  function addToCart(id, qty = 1, btn) {
    const res = Cart.add(id, qty);
    if (!res.ok) return toast(res.msg, "error");
    const p = Products.get(id);
    toast(`${p.name} added to cart`);
    if (btn) {
      const html = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-check"></i> Added';
      setTimeout(() => (btn.innerHTML = html), 1200);
    }
  }

  function bindGlobal() {
    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-add],[data-wish],[data-quick],[data-qty],[data-remove],[data-open-cart],[data-open-wish],[data-open-menu],[data-close],[data-theme-toggle],.overlay,.back-top");
      if (!t) return;
      if (t.matches("[data-add]")) { e.preventDefault(); addToCart(t.dataset.add, 1, t); }
      else if (t.matches("[data-wish]")) {
        e.preventDefault();
        const on = Wishlist.toggle(t.dataset.wish);
        toast(on ? "Saved to wishlist" : "Removed from wishlist", on ? "success" : "info");
        $$(`[data-wish="${CSS.escape(t.dataset.wish)}"]`).forEach((b) => {
          if (!b.classList.contains("icon-btn")) return;
          b.classList.toggle("on", on);
          b.innerHTML = `<i class="fa-${on ? "solid" : "regular"} fa-heart"></i>`;
        });
      }
      else if (t.matches("[data-quick]")) quickView(t.dataset.quick);
      else if (t.matches("[data-qty]")) {
        const line = Cart.items().find((i) => i.id === t.dataset.qty);
        const p = Products.get(t.dataset.qty);
        const next = (line ? line.qty : 0) + Number(t.dataset.d);
        if (p && next > p.stock) return toast(`Only ${p.stock} in stock`, "error");
        Cart.setQty(t.dataset.qty, next);
      }
      else if (t.matches("[data-remove]")) { Cart.remove(t.dataset.remove); toast("Item removed", "info"); }
      else if (t.matches("[data-open-cart]")) openPanel($("#cart-drawer"));
      else if (t.matches("[data-open-wish]")) openPanel($("#wish-drawer"));
      else if (t.matches("[data-open-menu]")) openPanel($(".mobile-nav"));
      else if (t.matches("[data-theme-toggle]")) { e.preventDefault(); toggleTheme(); }
      else if (t.matches(".back-top")) window.scrollTo({ top: 0 });
      else closeAll();
    });
    document.addEventListener("keydown", (e) => e.key === "Escape" && closeAll());
    document.addEventListener("store:change", () => { updateCounts(); renderCart(); renderWishlist(); });
    window.addEventListener("storage", () => { updateCounts(); renderCart(); renderWishlist(); });
    window.addEventListener("scroll", () => {
      const y = window.scrollY;
      $(".header") && $(".header").classList.toggle("scrolled", y > 10);
      $(".back-top") && $(".back-top").classList.toggle("show", y > 600);
    }, { passive: true });
  }

  /* ---------- Reveal animation ---------- */
  const io = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: 0.08 }) : null;
  function reveal(root = document) {
    $$(".reveal:not(.in)", root).forEach((el) => (io ? io.observe(el) : el.classList.add("in")));
  }

  function init(active) {
    const h = $("#site-header"), f = $("#site-footer-slot");
    if (h) h.outerHTML = headerHtml(active);
    if (f) f.outerHTML = footerHtml();
    $$("[data-search]").forEach(bindSearch);
    bindGlobal();
    updateCounts(); renderCart(); renderWishlist(); updateThemeIcon(); reveal();
    if (location.hash === "#cart") openPanel($("#cart-drawer"));
  }

  window.UI = { init, productCard, stars, priceHtml, badgeHtml, toast, reveal, quickView, openPanel, closeAll, addToCart, $, $$ };
})();
