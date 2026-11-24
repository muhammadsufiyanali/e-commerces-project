/* Checkout page */
(function () {
  UI.init("");
  const { Cart, Auth, Orders, Coupons, Settings, computeTotals, money, esc } = Store;
  const { $, $$ } = UI;
  const form = $("#checkout-form");
  let coupon = null;

  /* Prefill for logged-in user */
  const user = Auth.current();
  if (user) {
    $("#name").value = user.name || "";
    $("#email").value = user.email || "";
    $("#phone").value = user.phone || "";
    if (user.address) $("#address").value = user.address;
    if (user.city) $("#city").value = user.city;
    $("#login-hint").innerHTML = `Logged in as <b>${esc(user.email)}</b>`;
  }
  const s = Settings.get();
  $("#ship-std-lbl").textContent = `2–4 working days · ${money(s.shippingStandard)} (free over ${money(s.freeShippingOver)})`;
  $("#ship-exp-lbl").textContent = `Next day delivery · ${money(s.shippingExpress)}`;

  const shipMethod = () => $('input[name="ship"]:checked').value;
  const payMethod = () => $('input[name="pay"]:checked').value;

  function renderSummary() {
    const items = Cart.detailed();
    if (!items.length && $("#success-view").classList.contains("hidden")) {
      $("#checkout-view").innerHTML = `<div class="empty-state" style="padding:100px 20px"><i class="fa-solid fa-cart-shopping"></i><h3>Your cart is empty</h3><p>Add some products before checking out.</p><br><a class="btn btn-primary" href="shop.html">Go to shop</a></div>`;
      return;
    }
    $("#sum-items").innerHTML = items.map((i) => `
      <div class="line-item">
        <img src="${esc(i.product.image)}" alt="" onerror="imgFallback(this)">
        <div><h5>${esc(i.product.name)}</h5>
          <div class="qty"><button type="button" data-qty="${esc(i.id)}" data-d="-1">−</button><span>${i.qty}</span><button type="button" data-qty="${esc(i.id)}" data-d="1">+</button></div></div>
        <b style="font-size:.9rem">${money(i.product.price * i.qty)}</b>
      </div>`).join("");
    const t = computeTotals({ subtotal: Cart.subtotal(), coupon, shippingMethod: shipMethod() });
    $("#sum-totals").innerHTML = `
      <div class="sum-row"><span class="muted">Subtotal (${Cart.count()} items)</span><span>${money(t.subtotal)}</span></div>
      ${t.discount ? `<div class="sum-row" style="color:var(--success)"><span>Discount (${esc(coupon.code)})</span><span>− ${money(t.discount)}</span></div>` : ""}
      <div class="sum-row"><span class="muted">Shipping</span><span>${t.shipping ? money(t.shipping) : '<b style="color:var(--success)">FREE</b>'}</span></div>
      ${t.tax ? `<div class="sum-row"><span class="muted">Tax</span><span>${money(t.tax)}</span></div>` : ""}
      ${coupon ? `<div class="sum-row"><span class="chip">${esc(coupon.code)} <button type="button" id="rm-coupon" aria-label="Remove coupon"><i class="fa-solid fa-xmark"></i></button></span>${t.couponMsg ? `<small style="color:var(--danger)">${esc(t.couponMsg)}</small>` : ""}</div>` : ""}
      <div class="sum-row total"><span>Total</span><span>${money(t.total)}</span></div>`;
    $("#place").innerHTML = `<i class="fa-solid fa-lock"></i> ${payMethod() === "cod" ? "Place order" : "Pay"} ${money(t.total)}`;
  }

  /* Coupon */
  $("#apply-coupon").addEventListener("click", () => {
    const code = $("#coupon").value.trim();
    if (!code) return UI.toast("Enter a coupon code", "error");
    const c = Coupons.find(code);
    if (!c) return UI.toast("Invalid or expired coupon", "error");
    coupon = c;
    const t = computeTotals({ subtotal: Cart.subtotal(), coupon, shippingMethod: shipMethod() });
    UI.toast(t.couponMsg || `Coupon ${c.code} applied!`, t.couponMsg ? "error" : "success");
    $("#coupon").value = "";
    renderSummary();
  });
  $("#coupon").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); $("#apply-coupon").click(); } });
  document.addEventListener("click", (e) => { if (e.target.closest("#rm-coupon")) { coupon = null; renderSummary(); } });

  /* Radio option styling */
  form.addEventListener("change", (e) => {
    if (e.target.name === "ship" || e.target.name === "pay") {
      $$(`input[name="${e.target.name}"]`).forEach((r) => r.closest(".pay-opt").classList.toggle("active", r.checked));
      if (e.target.name === "pay") $$(".pay-details").forEach((d) => d.classList.toggle("show", d.dataset.pay === e.target.value));
      renderSummary();
    }
  });

  /* Card input formatting + live preview */
  const luhn = (num) => {
    let sum = 0, alt = false;
    for (let i = num.length - 1; i >= 0; i--) {
      let n = +num[i];
      if (alt) { n *= 2; if (n > 9) n -= 9; }
      sum += n; alt = !alt;
    }
    return num.length >= 13 && sum % 10 === 0;
  };
  const brandIcon = (n) => (/^4/.test(n) ? "fa-cc-visa" : /^(5[1-5]|2[2-7])/.test(n) ? "fa-cc-mastercard" : /^3[47]/.test(n) ? "fa-cc-amex" : /^6/.test(n) ? "fa-cc-discover" : "fa-cc-visa");
  $("#cc-num").addEventListener("input", (e) => {
    const d = e.target.value.replace(/\D/g, "").slice(0, 16);
    e.target.value = d.replace(/(.{4})/g, "$1 ").trim();
    $("#cp-num").textContent = (d + "•".repeat(16 - d.length)).replace(/(.{4})/g, "$1 ").trim();
    $("#cp-brand").className = "fa-brands " + brandIcon(d);
  });
  $("#cc-name").addEventListener("input", (e) => ($("#cp-name").textContent = e.target.value.toUpperCase() || "YOUR NAME"));
  $("#cc-exp").addEventListener("input", (e) => {
    let d = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (d.length >= 3) d = d.slice(0, 2) + "/" + d.slice(2);
    e.target.value = d;
    $("#cp-exp").textContent = d || "MM/YY";
  });
  $("#cc-cvv").addEventListener("input", (e) => (e.target.value = e.target.value.replace(/\D/g, "")));

  /* Validation */
  const phoneOk = (v) => /^(\+92|0)?3\d{2}-?\d{7}$/.test(v.replace(/\s/g, ""));
  function mark(el, ok) { el.closest(".field").classList.toggle("invalid", !ok); return ok; }
  function validate() {
    let ok = true;
    ok = mark($("#name"), $("#name").value.trim().length > 1) && ok;
    ok = mark($("#phone"), phoneOk($("#phone").value)) && ok;
    ok = mark($("#email"), /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($("#email").value.trim())) && ok;
    ok = mark($("#address"), $("#address").value.trim().length > 4) && ok;
    ok = mark($("#city"), !!$("#city").value) && ok;
    const pm = payMethod();
    if (pm === "card") {
      const num = $("#cc-num").value.replace(/\s/g, "");
      ok = mark($("#cc-num"), luhn(num)) && ok;
      ok = mark($("#cc-name"), $("#cc-name").value.trim().length > 2) && ok;
      const [mm, yy] = $("#cc-exp").value.split("/").map(Number);
      const now = new Date();
      const expOk = mm >= 1 && mm <= 12 && yy >= 0 && new Date(2000 + yy, mm, 0, 23, 59) >= now;
      ok = mark($("#cc-exp"), expOk) && ok;
      ok = mark($("#cc-cvv"), /^\d{3,4}$/.test($("#cc-cvv").value)) && ok;
    }
    if (pm === "jazzcash") ok = mark($("#jc-num"), phoneOk($("#jc-num").value)) && ok;
    if (pm === "easypaisa") ok = mark($("#ep-num"), phoneOk($("#ep-num").value)) && ok;
    return ok;
  }
  form.addEventListener("input", (e) => { const f = e.target.closest(".field"); if (f) f.classList.remove("invalid"); });

  /* Place order */
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validate()) {
      UI.toast("Please fix the highlighted fields", "error");
      const bad = $(".field.invalid");
      if (bad) bad.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!$("#terms").checked) return UI.toast("Please accept the terms to continue", "error");
    // Stock check
    for (const i of Cart.detailed()) {
      if (i.qty > i.product.stock) return UI.toast(`${i.product.name}: only ${i.product.stock} left in stock`, "error");
    }
    const items = Cart.detailed().map((i) => ({ id: i.id, name: i.product.name, image: i.product.image, price: i.product.price, qty: i.qty }));
    const t = computeTotals({ subtotal: Cart.subtotal(), coupon, shippingMethod: shipMethod() });
    const pm = payMethod();
    const customer = {
      name: $("#name").value.trim(), email: $("#email").value.trim(), phone: $("#phone").value.trim(),
      address: $("#address").value.trim(), city: $("#city").value, zip: $("#zip").value.trim(), notes: $("#notes").value.trim(),
    };
    $("#processing").classList.add("show");
    if (pm === "cod" || pm === "bank") $("#processing h3").textContent = "Placing your order…";
    setTimeout(() => {
      const order = Orders.create({
        userId: user ? user.id : null, customer, items,
        subtotal: t.subtotal, discount: t.discount, shipping: t.shipping, tax: t.tax, total: t.total,
        coupon: coupon && !t.couponMsg ? coupon.code : null, payment: pm, shippingMethod: shipMethod(),
        paid: pm === "card" || pm === "jazzcash" || pm === "easypaisa",
        cardLast4: pm === "card" ? $("#cc-num").value.replace(/\s/g, "").slice(-4) : null,
      });
      if (user) Auth.update({ phone: customer.phone, address: customer.address, city: customer.city });
      Cart.clear();
      $("#processing").classList.remove("show");
      showSuccess(order);
    }, 1800);
  });

  const payLabel = { card: "Credit / Debit card", jazzcash: "JazzCash", easypaisa: "Easypaisa", bank: "Bank transfer", cod: "Cash on delivery" };
  function showSuccess(o) {
    $("#checkout-view").classList.add("hidden");
    const v = $("#success-view");
    v.classList.remove("hidden");
    const eta = new Date(Date.now() + (o.shippingMethod === "express" ? 1 : 4) * 864e5).toDateString();
    v.innerHTML = `
      <div class="success-box">
        <div class="success-icon"><i class="fa-solid fa-check"></i></div>
        <h1>Thank you for your order!</h1>
        <p class="muted">Order <b style="color:var(--text)">${esc(o.id)}</b> has been placed. A confirmation has been sent to <b style="color:var(--text)">${esc(o.customer.email)}</b>.</p>
        <div class="steps" style="justify-content:center">
          <div class="step done"><span class="n"><i class="fa-solid fa-check"></i></span><span class="lbl">Cart</span></div><div class="step-line"></div>
          <div class="step done"><span class="n"><i class="fa-solid fa-check"></i></span><span class="lbl">Payment</span></div><div class="step-line"></div>
          <div class="step done"><span class="n"><i class="fa-solid fa-check"></i></span><span class="lbl">Confirmed</span></div>
        </div>
        <div class="panel" style="text-align:left">
          ${o.items.map((i) => `<div class="sum-row"><span>${esc(i.name)} × ${i.qty}</span><span>${money(i.price * i.qty)}</span></div>`).join("")}
          ${o.discount ? `<div class="sum-row" style="color:var(--success)"><span>Discount</span><span>− ${money(o.discount)}</span></div>` : ""}
          <div class="sum-row"><span>Shipping</span><span>${o.shipping ? money(o.shipping) : "FREE"}</span></div>
          <div class="sum-row total"><span>Total ${o.paid ? "paid" : "due"}</span><span>${money(o.total)}</span></div>
          <hr style="border:none;border-top:1px solid var(--border);margin:14px 0">
          <div class="sum-row"><span class="muted">Payment</span><span>${payLabel[o.payment]}${o.cardLast4 ? " •••• " + esc(o.cardLast4) : ""}</span></div>
          <div class="sum-row"><span class="muted">Deliver to</span><span style="text-align:right">${esc(o.customer.address)}, ${esc(o.customer.city)}</span></div>
          <div class="sum-row"><span class="muted">Estimated delivery</span><span>${eta}</span></div>
        </div>
        <div style="display:flex;gap:12px;justify-content:center;margin-top:24px;flex-wrap:wrap">
          <a class="btn btn-primary" href="account.html?order=${encodeURIComponent(o.id)}#orders"><i class="fa-solid fa-location-crosshairs"></i> Track order</a>
          <a class="btn btn-outline" href="shop.html">Continue shopping</a>
        </div>
      </div>`;
    window.scrollTo({ top: 0 });
  }

  renderSummary();
  document.addEventListener("store:change", (e) => { if (e.detail.key === Store.KEYS.cart && $("#success-view").classList.contains("hidden")) renderSummary(); });
})();
