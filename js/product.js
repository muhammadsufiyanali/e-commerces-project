/* Product detail page */
(function () {
  UI.init("shop");
  const { Products, Reviews, Wishlist, Auth, esc, money, catName } = Store;
  const { $, $$ } = UI;
  const id = new URLSearchParams(location.search).get("id");
  const root = $("#pd-root");
  let qty = 1, rating = 5;

  function render() {
    const p = Products.get(id);
    if (!p) {
      root.innerHTML = `<div class="empty-state" style="padding:100px 20px"><i class="fa-solid fa-box-open"></i><h3>Product not found</h3><p>It may have been removed.</p><br><a href="shop.html" class="btn btn-primary">Back to shop</a></div>`;
      $("#related-section").classList.add("hidden");
      return;
    }
    document.title = `${p.name} — eTrade`;
    const r = Products.rating(p);
    const wish = Wishlist.has(p.id);
    const stockCls = p.stock <= 0 ? "out" : p.stock <= 5 ? "low" : "";
    const stockTxt = p.stock <= 0 ? "Out of stock" : p.stock <= 5 ? `Only ${p.stock} left` : "In stock";
    const reviews = Reviews.for(p.id);
    qty = Math.min(qty, Math.max(1, p.stock));

    root.innerHTML = `
      <div class="breadcrumb"><a href="index.html">Home</a> / <a href="shop.html">Shop</a> / <a href="shop.html?cat=${esc(p.category)}">${esc(catName(p.category))}</a> / <span>${esc(p.name)}</span></div>
      <div class="pd">
        <div class="pd-gallery">
          <div class="pd-main" id="zoom"><img src="${esc(p.image)}" alt="${esc(p.name)}" onerror="imgFallback(this)"></div>
        </div>
        <div class="pd-info">
          <span class="card-cat">${esc(catName(p.category))} · ${esc(p.brand || "")}</span>
          <h1>${esc(p.name)}</h1>
          <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">${UI.stars(r.avg, r.count)}<span class="muted" style="font-size:.85rem">${Number(r.avg).toFixed(1)} out of 5</span><span class="stock-pill ${stockCls}">${stockTxt}</span></div>
          <div style="margin-top:14px">${UI.priceHtml(p)}</div>
          <p class="pd-desc">${esc(p.description)}</p>
          ${(p.features || []).length ? `<ul class="pd-features">${p.features.map((f) => `<li><i class="fa-solid fa-circle-check"></i>${esc(f)}</li>`).join("")}</ul>` : ""}
          <div class="pd-buy">
            <div class="qty lg"><button id="q-dec" aria-label="Decrease">−</button><input id="q-val" value="${qty}" inputmode="numeric" aria-label="Quantity"><button id="q-inc" aria-label="Increase">+</button></div>
            <button class="btn btn-primary" id="add" ${p.stock <= 0 ? "disabled" : ""}><i class="fa-solid fa-cart-plus"></i> Add to cart</button>
            <button class="btn btn-dark" id="buy" ${p.stock <= 0 ? "disabled" : ""}><i class="fa-solid fa-bolt"></i> Buy now</button>
            <button class="icon-btn ${wish ? "on" : ""}" data-wish="${esc(p.id)}" aria-label="Wishlist"><i class="fa-${wish ? "solid" : "regular"} fa-heart"></i></button>
            <button class="icon-btn" id="share" aria-label="Share"><i class="fa-solid fa-share-nodes"></i></button>
          </div>
          <div class="pd-meta">
            <div><i class="fa-solid fa-truck-fast"></i> Free delivery on orders over ${money(Store.Settings.get().freeShippingOver)} · Delivered in <b>2–4 working days</b></div>
            <div><i class="fa-solid fa-rotate-left"></i> <b>7-day</b> easy returns · <i class="fa-solid fa-shield-halved"></i> <b>1-year</b> brand warranty</div>
            <div><i class="fa-solid fa-barcode"></i> SKU: <b>${esc(p.id.toUpperCase())}</b> · Category: <b>${esc(catName(p.category))}</b></div>
          </div>
        </div>
      </div>

      <div class="tabs">
        <div class="tab-btns">
          <button class="active" data-t="desc">Description</button>
          <button data-t="spec">Specifications</button>
          <button data-t="rev">Reviews (${r.count})</button>
        </div>
        <div class="tab-panel active" data-p="desc">
          <p class="muted" style="max-width:800px">${esc(p.description)} The ${esc(p.name)} by ${esc(p.brand || "eTrade")} comes with an official warranty and ships in its original sealed packaging. Every order is quality-checked before dispatch.</p>
        </div>
        <div class="tab-panel" data-p="spec">
          <table class="spec-table">
            <tr><td>Brand</td><td>${esc(p.brand || "—")}</td></tr>
            <tr><td>Category</td><td>${esc(catName(p.category))}</td></tr>
            ${(p.features || []).map((f, i) => `<tr><td>Highlight ${i + 1}</td><td>${esc(f)}</td></tr>`).join("")}
            <tr><td>Warranty</td><td>1 year brand warranty</td></tr>
            <tr><td>Availability</td><td>${stockTxt}</td></tr>
          </table>
        </div>
        <div class="tab-panel" data-p="rev">
          ${reviews.length ? reviews.map((rv) => `
            <div class="review"><span class="avatar">${esc(rv.name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase())}</span>
              <div><b>${esc(rv.name)}</b> <small class="muted">· ${new Date(rv.createdAt).toLocaleDateString()}</small>${UI.stars(rv.rating)}<p>${esc(rv.text)}</p></div></div>`).join("")
            : `<p class="muted">${r.count} verified ratings so far. Be the first to write a review on eTrade!</p>`}
          <form class="review-form" id="review-form">
            <h4>Write a review</h4>
            <div class="star-input" id="star-input">${[1, 2, 3, 4, 5].map((n) => `<i class="fa-solid fa-star ${n <= rating ? "on" : ""}" data-star="${n}"></i>`).join("")}</div>
            <div class="form-grid">
              <div class="field full"><label>Your name</label><input name="name" required value="${esc(Auth.current() ? Auth.current().name : "")}"></div>
              <div class="field full"><label>Your review</label><textarea name="text" required minlength="5" placeholder="What did you like or dislike?"></textarea></div>
            </div>
            <button class="btn btn-primary" style="margin-top:14px">Submit review</button>
          </form>
        </div>
      </div>`;

    const related = Products.all().filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4);
    const more = related.length < 4 ? Products.all().filter((x) => x.id !== p.id && !related.some((r2) => r2.id === x.id)).slice(0, 4 - related.length) : [];
    $("#related").innerHTML = [...related, ...more].map(UI.productCard).join("");
    UI.reveal();
    bind(p);
  }

  function bind(p) {
    const val = $("#q-val");
    const setQ = (n) => { qty = Math.max(1, Math.min(p.stock || 1, n || 1)); val.value = qty; };
    $("#q-dec").onclick = () => setQ(qty - 1);
    $("#q-inc").onclick = () => { if (qty >= p.stock) UI.toast(`Only ${p.stock} in stock`, "error"); setQ(qty + 1); };
    val.onchange = () => setQ(parseInt(val.value, 10));
    $("#add").onclick = () => UI.addToCart(p.id, qty, $("#add"));
    $("#buy").onclick = () => {
      const res = Store.Cart.add(p.id, qty);
      if (!res.ok && !Store.Cart.items().some((i) => i.id === p.id)) return UI.toast(res.msg, "error");
      location.href = "checkout.html";
    };
    $("#share").onclick = async () => {
      try {
        if (navigator.share) await navigator.share({ title: p.name, url: location.href });
        else { await navigator.clipboard.writeText(location.href); UI.toast("Link copied to clipboard", "info"); }
      } catch (e) { /* user cancelled */ }
    };
    $$(".tab-btns button").forEach((b) => (b.onclick = () => {
      $$(".tab-btns button").forEach((x) => x.classList.toggle("active", x === b));
      $$(".tab-panel").forEach((x) => x.classList.toggle("active", x.dataset.p === b.dataset.t));
    }));
    $("#star-input").onclick = (e) => {
      const s = e.target.dataset.star;
      if (!s) return;
      rating = +s;
      $$("#star-input i").forEach((i) => i.classList.toggle("on", +i.dataset.star <= rating));
    };
    $("#review-form").onsubmit = (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      Reviews.add({ productId: p.id, name: f.get("name").trim(), text: f.get("text").trim(), rating });
      UI.toast("Thanks! Your review has been posted.");
      render();
      $('[data-t="rev"]').click();
    };
    // Hover zoom
    const z = $("#zoom"), img = $("img", z);
    z.onmousemove = (e) => {
      const b = z.getBoundingClientRect();
      img.style.transformOrigin = `${((e.clientX - b.left) / b.width) * 100}% ${((e.clientY - b.top) / b.height) * 100}%`;
      img.style.transform = "scale(1.8)";
    };
    z.onmouseleave = () => (img.style.transform = "");
  }

  render();
  document.addEventListener("store:change", (e) => { if (e.detail.key === Store.KEYS.products) render(); });
})();
