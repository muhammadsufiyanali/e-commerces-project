/* Shop / listing page */
(function () {
  UI.init("shop");
  const { Products, CATEGORIES, esc, money, catName } = Store;
  const { $, $$ } = UI;
  const PER_PAGE = 12;
  const params = new URLSearchParams(location.search);

  const state = {
    q: params.get("q") || "",
    cats: params.get("cat") ? params.get("cat").split(",") : [],
    brands: [],
    min: "", max: "",
    rating: 0, stock: false, sale: params.get("sort") === "discount",
    sort: params.get("sort") || "featured",
    page: 1,
  };
  if (state.sort === "new" && UI.$('.nav a[href*="sort=new"]')) {
    $$(".nav a").forEach((a) => a.classList.remove("active"));
    $('.nav a[href*="sort=new"]').classList.add("active");
  }

  function buildFilters() {
    const all = Products.all();
    $("#f-cat").innerHTML = CATEGORIES.map((c) => `<label class="check"><input type="checkbox" value="${c.id}" ${state.cats.includes(c.id) ? "checked" : ""}> ${esc(c.name)}<span class="n">${all.filter((p) => p.category === c.id).length}</span></label>`).join("");
    const brands = [...new Set(all.map((p) => p.brand).filter(Boolean))].sort();
    $("#f-brand").innerHTML = brands.map((b) => `<label class="check"><input type="checkbox" value="${esc(b)}" ${state.brands.includes(b) ? "checked" : ""}> ${esc(b)}<span class="n">${all.filter((p) => p.brand === b).length}</span></label>`).join("");
    const maxP = Math.max(10000, ...all.map((p) => p.price));
    const r = $("#f-range");
    r.max = Math.ceil(maxP / 10000) * 10000;
    if (!state.max) r.value = r.max;
    $("#f-range-val").textContent = money(state.max || r.max);
    $("#sort").value = state.sort;
    $("#f-sale").checked = state.sale;
  }

  function filtered() {
    const q = state.q.toLowerCase();
    let list = Products.all().filter((p) => {
      if (q && !(p.name + " " + p.brand + " " + catName(p.category) + " " + p.description).toLowerCase().includes(q)) return false;
      if (state.cats.length && !state.cats.includes(p.category)) return false;
      if (state.brands.length && !state.brands.includes(p.brand)) return false;
      if (state.min !== "" && p.price < +state.min) return false;
      if (state.max !== "" && p.price > +state.max) return false;
      if (state.rating && Products.rating(p).avg < state.rating) return false;
      if (state.stock && p.stock <= 0) return false;
      if (state.sale && !(p.oldPrice > p.price)) return false;
      return true;
    });
    const disc = (p) => (p.oldPrice > p.price ? 1 - p.price / p.oldPrice : 0);
    const sorters = {
      featured: (a, b) => (b.stock > 0) - (a.stock > 0) || Products.rating(b).count - Products.rating(a).count,
      new: (a, b) => (b.createdAt || 0) - (a.createdAt || 0),
      "price-asc": (a, b) => a.price - b.price,
      "price-desc": (a, b) => b.price - a.price,
      rating: (a, b) => Products.rating(b).avg - Products.rating(a).avg,
      discount: (a, b) => disc(b) - disc(a),
      name: (a, b) => a.name.localeCompare(b.name),
    };
    return list.sort(sorters[state.sort] || sorters.featured);
  }

  function chips() {
    const c = [];
    if (state.q) c.push(["q", `Search: “${state.q}”`]);
    state.cats.forEach((x) => c.push(["cat:" + x, catName(x)]));
    state.brands.forEach((x) => c.push(["brand:" + x, x]));
    if (state.min !== "" || state.max !== "") c.push(["price", `${money(state.min || 0)} – ${state.max ? money(state.max) : "any"}`]);
    if (state.rating) c.push(["rating", `${state.rating}★ & up`]);
    if (state.stock) c.push(["stock", "In stock"]);
    if (state.sale) c.push(["sale", "On sale"]);
    $("#chips").innerHTML = c.map(([k, l]) => `<span class="chip">${esc(l)} <button data-chip="${esc(k)}" aria-label="Remove filter"><i class="fa-solid fa-xmark"></i></button></span>`).join("");
  }

  function render() {
    const list = filtered();
    const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    state.page = Math.min(state.page, pages);
    const slice = list.slice((state.page - 1) * PER_PAGE, state.page * PER_PAGE);
    $("#count").innerHTML = `Showing <b>${list.length ? (state.page - 1) * PER_PAGE + 1 : 0}–${(state.page - 1) * PER_PAGE + slice.length}</b> of <b>${list.length}</b> products`;
    $("#grid").innerHTML = slice.length ? slice.map(UI.productCard).join("")
      : `<div class="empty-state"><i class="fa-solid fa-magnifying-glass"></i><h3>No products found</h3><p>Try changing your filters or search term.</p><br><button class="btn btn-primary" id="reset2">Clear filters</button></div>`;
    $("#pager").innerHTML = pages > 1 ? Array.from({ length: pages }, (_, i) => `<button class="${i + 1 === state.page ? "active" : ""}" data-page="${i + 1}">${i + 1}</button>`).join("") : "";
    $("#crumb").textContent = state.cats.length === 1 ? catName(state.cats[0]) : state.q ? `Search results` : "Shop";
    chips();
    UI.reveal();
  }

  function reset() {
    Object.assign(state, { q: "", cats: [], brands: [], min: "", max: "", rating: 0, stock: false, sale: false, page: 1 });
    $("#f-min").value = ""; $("#f-max").value = ""; $("#f-stock").checked = false;
    $('input[name="rating"][value="0"]').checked = true;
    $$("[data-search] input").forEach((i) => (i.value = ""));
    history.replaceState(null, "", "shop.html");
    buildFilters(); render();
  }

  $("#filters").addEventListener("change", (e) => {
    const t = e.target;
    if (t.closest("#f-cat")) state.cats = $$("#f-cat input:checked").map((i) => i.value);
    else if (t.closest("#f-brand")) state.brands = $$("#f-brand input:checked").map((i) => i.value);
    else if (t.name === "rating") state.rating = +t.value;
    else if (t.id === "f-stock") state.stock = t.checked;
    else if (t.id === "f-sale") state.sale = t.checked;
    state.page = 1; render();
  });
  ["#f-min", "#f-max"].forEach((s) => $(s).addEventListener("input", () => {
    state.min = $("#f-min").value; state.max = $("#f-max").value; state.page = 1; render();
  }));
  $("#f-range").addEventListener("input", (e) => {
    state.max = e.target.value === e.target.max ? "" : e.target.value;
    $("#f-max").value = state.max;
    $("#f-range-val").textContent = money(e.target.value);
    state.page = 1; render();
  });
  $("#sort").addEventListener("change", (e) => { state.sort = e.target.value; render(); });
  $("#clear-filters").addEventListener("click", reset);
  $("#open-filters").addEventListener("click", () => UI.openPanel($("#filters")));
  document.addEventListener("click", (e) => {
    if (e.target.closest("#reset2")) reset();
    const pg = e.target.closest("[data-page]");
    if (pg) { state.page = +pg.dataset.page; render(); window.scrollTo({ top: 0, behavior: "smooth" }); }
    const ch = e.target.closest("[data-chip]");
    if (ch) {
      const k = ch.dataset.chip;
      if (k === "q") { state.q = ""; $$("[data-search] input").forEach((i) => (i.value = "")); }
      else if (k.startsWith("cat:")) state.cats = state.cats.filter((x) => x !== k.slice(4));
      else if (k.startsWith("brand:")) state.brands = state.brands.filter((x) => x !== k.slice(6));
      else if (k === "price") { state.min = state.max = ""; $("#f-min").value = $("#f-max").value = ""; }
      else if (k === "rating") { state.rating = 0; $('input[name="rating"][value="0"]').checked = true; }
      else if (k === "stock") { state.stock = false; $("#f-stock").checked = false; }
      else if (k === "sale") { state.sale = false; }
      buildFilters(); render();
    }
  });
  document.addEventListener("store:change", (e) => { if (e.detail.key === Store.KEYS.products) { buildFilters(); render(); } });

  buildFilters(); render();
})();
