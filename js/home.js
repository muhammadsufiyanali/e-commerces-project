/* Home page */
(function () {
  UI.init("home");
  const { Products, CATEGORIES, esc } = Store;
  const { $, $$ } = UI;

  /* Hero slider */
  const slides = $$("#hero .slide");
  const dots = $("#hero .slider-dots");
  let cur = 0, timer;
  dots.innerHTML = slides.map((_, i) => `<button aria-label="Slide ${i + 1}" data-dot="${i}" class="${i === 0 ? "active" : ""}"></button>`).join("");
  function go(n) {
    cur = (n + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle("active", i === cur));
    $$("button", dots).forEach((d, i) => d.classList.toggle("active", i === cur));
    clearInterval(timer);
    timer = setInterval(() => go(cur + 1), 6000);
  }
  dots.addEventListener("click", (e) => e.target.dataset.dot && go(+e.target.dataset.dot));
  $$("[data-slide]").forEach((b) => b.addEventListener("click", () => go(cur + Number(b.dataset.slide))));
  go(0);

  /* Categories */
  function renderCats() {
    const all = Products.all();
    $("#categories").innerHTML = CATEGORIES.map((c) => `
      <a class="cat-card reveal" href="shop.html?cat=${c.id}">
        <div class="cat-img"><img src="${esc(c.image)}" alt="${esc(c.name)}" onerror="imgFallback(this)"></div>
        <h4>${esc(c.name)}</h4><span>${all.filter((p) => p.category === c.id).length} products</span>
      </a>`).join("");
  }

  /* Product tabs */
  let tab = "best";
  function renderGrid() {
    let list = Products.all();
    if (tab === "best") list = list.sort((a, b) => Products.rating(b).count * Products.rating(b).avg - Products.rating(a).count * Products.rating(a).avg);
    if (tab === "new") list = list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    if (tab === "sale") list = list.filter((p) => p.oldPrice > p.price);
    $("#home-grid").innerHTML = list.slice(0, 8).map(UI.productCard).join("") || `<div class="empty-state"><h3>No products yet</h3></div>`;
    const deals = Products.all().filter((p) => p.oldPrice > p.price && p.stock > 0)
      .sort((a, b) => (1 - b.price / b.oldPrice) - (1 - a.price / a.oldPrice)).slice(0, 4);
    $("#deal-grid").innerHTML = deals.map(UI.productCard).join("");
    UI.reveal();
  }
  $("#home-tabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab]");
    if (!b) return;
    tab = b.dataset.tab;
    $$("#home-tabs button").forEach((x) => x.classList.toggle("active", x === b));
    renderGrid();
  });

  /* Countdown to midnight */
  function tick() {
    const end = new Date(); end.setHours(23, 59, 59, 999);
    let diff = Math.max(0, end - new Date()) / 1000;
    const d = Math.floor(diff / 86400); diff -= d * 86400;
    const h = Math.floor(diff / 3600); diff -= h * 3600;
    const m = Math.floor(diff / 60); const s = Math.floor(diff - m * 60);
    const pad = (n) => String(n).padStart(2, "0");
    $('[data-cd="d"]').textContent = pad(d); $('[data-cd="h"]').textContent = pad(h);
    $('[data-cd="m"]').textContent = pad(m); $('[data-cd="s"]').textContent = pad(s);
  }
  tick(); setInterval(tick, 1000);

  /* Newsletter */
  $("#newsletter").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = $("input", e.target).value.trim();
    const list = Store.read(Store.KEYS.subscribers, []);
    if (list.includes(email)) return UI.toast("You're already subscribed!", "info");
    Store.write(Store.KEYS.subscribers, [...list, email]);
    e.target.reset();
    UI.toast("Subscribed! Use code WELCOME10 for 10% off.");
  });

  renderCats(); renderGrid();
  document.addEventListener("store:change", (e) => {
    if (e.detail.key === Store.KEYS.products) { renderCats(); renderGrid(); }
  });
})();
