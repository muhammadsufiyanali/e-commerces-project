/* =========================================================
   eTrade — Data layer (localStorage based, no backend needed)
   ========================================================= */
(function () {
  const KEYS = {
    products: "et_products",
    cart: "et_cart",
    wishlist: "et_wishlist",
    orders: "et_orders",
    users: "et_users",
    session: "et_session",
    reviews: "et_reviews",
    coupons: "et_coupons",
    settings: "et_settings",
    subscribers: "et_subscribers",
    theme: "et_theme",
    version: "et_version",
  };
  const DATA_VERSION = 2;

  const CATEGORIES = [
    { id: "phone", name: "Smartphones", icon: "fa-mobile-screen-button", image: "about/category-phone.png" },
    { id: "laptop", name: "Laptops", icon: "fa-laptop", image: "about/category-laptop.jpeg" },
    { id: "watch", name: "Smart Watches", icon: "fa-clock", image: "about/category-watch.jpeg" },
    { id: "headphone", name: "Audio", icon: "fa-headphones", image: "about/category-headphone.png" },
    { id: "tablet", name: "Tablets", icon: "fa-tablet-screen-button", image: "images/products/p17.svg" },
    { id: "camera", name: "Cameras", icon: "fa-camera", image: "images/products/p22.svg" },
    { id: "accessory", name: "Accessories", icon: "fa-gamepad", image: "images/products/p20.svg" },
  ];

  const DEFAULT_COUPONS = [
    { code: "WELCOME10", type: "percent", value: 10, min: 0, active: true },
    { code: "SAVE5000", type: "flat", value: 5000, min: 50000, active: true },
    { code: "FREESHIP", type: "ship", value: 0, min: 0, active: true },
  ];

  const DEFAULT_SETTINGS = {
    storeName: "eTrade",
    currency: "Rs.",
    freeShippingOver: 25000,
    shippingStandard: 250,
    shippingExpress: 750,
    taxRate: 0,
  };

  const read = (k, fallback) => {
    try {
      const v = JSON.parse(localStorage.getItem(k));
      return v ?? fallback;
    } catch {
      return fallback;
    }
  };
  const write = (k, v) => {
    localStorage.setItem(k, JSON.stringify(v));
    document.dispatchEvent(new CustomEvent("store:change", { detail: { key: k } }));
  };
  const uid = (p = "") => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  /* ---------- Seeding ---------- */
  function seed(force = false) {
    if (force || read(KEYS.version, 0) < DATA_VERSION || !read(KEYS.products)) {
      let products = JSON.parse(JSON.stringify(window.SEED_PRODUCTS || []));
      // Import any products created with the old admin page (key "product")
      const legacy = read("product", []);
      if (Array.isArray(legacy) && !force) {
        legacy.forEach((l) => {
          if (!l || !l.Product_name) return;
          products.push({
            id: uid("p"), name: l.Product_name, brand: "eTrade", category: l.category || "accessory",
            price: Number(l.price) || 9999, oldPrice: 0, rating: 4.5, reviews: 0, stock: 20, badge: "New",
            image: l.img_url, description: "Added from the admin panel.", features: [], createdAt: Date.now(),
          });
        });
      }
      localStorage.setItem(KEYS.products, JSON.stringify(products));
      if (force || !read(KEYS.coupons)) localStorage.setItem(KEYS.coupons, JSON.stringify(DEFAULT_COUPONS));
      if (force || !read(KEYS.settings)) localStorage.setItem(KEYS.settings, JSON.stringify(DEFAULT_SETTINGS));
      if (force || !read(KEYS.orders)) localStorage.setItem(KEYS.orders, JSON.stringify(demoOrders(products)));
      if (force || !read(KEYS.users)) localStorage.setItem(KEYS.users, JSON.stringify(demoUsers()));
      localStorage.setItem(KEYS.version, JSON.stringify(DATA_VERSION));
    }
  }

  function demoUsers() {
    return [
      { id: "u1", name: "Ayesha Khan", email: "ayesha@example.com", password: "123456", phone: "0300-1234567", createdAt: Date.now() - 20 * 864e5 },
      { id: "u2", name: "Bilal Ahmed", email: "bilal@example.com", password: "123456", phone: "0321-7654321", createdAt: Date.now() - 12 * 864e5 },
      { id: "u3", name: "Sara Malik", email: "sara@example.com", password: "123456", phone: "0333-1112223", createdAt: Date.now() - 5 * 864e5 },
    ];
  }

  function demoOrders(products) {
    const pick = (id) => products.find((p) => p.id === id);
    const mk = (n, user, items, status, days, payment) => {
      const lines = items.map(([id, qty]) => {
        const p = pick(id);
        return { id, name: p.name, image: p.image, price: p.price, qty };
      });
      const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
      return {
        id: "ET-" + (100230 + n), userId: user.id, customer: { name: user.name, email: user.email, phone: user.phone, address: "House 12, Street 4", city: "Karachi", zip: "75500" },
        items: lines, subtotal, discount: 0, shipping: 0, total: subtotal, payment, shippingMethod: "standard",
        status, createdAt: Date.now() - days * 864e5,
      };
    };
    const u = demoUsers();
    return [
      mk(1, u[0], [["p1", 1], ["p15", 1]], "delivered", 18, "card"),
      mk(2, u[1], [["p6", 1]], "delivered", 14, "cod"),
      mk(3, u[2], [["p9", 2]], "shipped", 7, "jazzcash"),
      mk(4, u[0], [["p13", 1], ["p19", 1]], "processing", 3, "easypaisa"),
      mk(5, u[1], [["p5", 1]], "pending", 1, "card"),
      mk(6, u[2], [["p17", 1], ["p21", 2]], "pending", 0, "cod"),
    ];
  }

  /* ---------- Products ---------- */
  const Products = {
    all: () => read(KEYS.products, []),
    get: (id) => Products.all().find((p) => p.id === id),
    save(list) { write(KEYS.products, list); },
    upsert(p) {
      const list = Products.all();
      const i = list.findIndex((x) => x.id === p.id);
      if (i > -1) list[i] = { ...list[i], ...p };
      else list.unshift({ id: uid("p"), createdAt: Date.now(), rating: 0, reviews: 0, features: [], ...p });
      Products.save(list);
    },
    remove(id) { Products.save(Products.all().filter((p) => p.id !== id)); },
    rating(p) {
      const extra = Reviews.for(p.id);
      if (!extra.length) return { avg: p.rating || 0, count: p.reviews || 0 };
      const total = (p.rating || 0) * (p.reviews || 0) + extra.reduce((s, r) => s + r.rating, 0);
      const count = (p.reviews || 0) + extra.length;
      return { avg: Math.round((total / count) * 10) / 10, count };
    },
  };

  /* ---------- Cart ---------- */
  const Cart = {
    items: () => read(KEYS.cart, []),
    save(items) { write(KEYS.cart, items); },
    add(id, qty = 1) {
      const p = Products.get(id);
      if (!p) return { ok: false, msg: "Product not found" };
      if (p.stock <= 0) return { ok: false, msg: "Sorry, this item is out of stock" };
      const items = Cart.items();
      const line = items.find((i) => i.id === id);
      const newQty = (line ? line.qty : 0) + qty;
      if (newQty > p.stock) return { ok: false, msg: `Only ${p.stock} left in stock` };
      if (line) line.qty = newQty;
      else items.push({ id, qty });
      Cart.save(items);
      return { ok: true };
    },
    setQty(id, qty) {
      const p = Products.get(id);
      let items = Cart.items();
      if (qty <= 0) items = items.filter((i) => i.id !== id);
      else {
        const line = items.find((i) => i.id === id);
        if (line) line.qty = Math.min(qty, p ? p.stock : qty);
      }
      Cart.save(items);
    },
    remove(id) { Cart.save(Cart.items().filter((i) => i.id !== id)); },
    clear() { Cart.save([]); },
    detailed() {
      return Cart.items()
        .map((i) => ({ ...i, product: Products.get(i.id) }))
        .filter((i) => i.product);
    },
    count: () => Cart.items().reduce((s, i) => s + i.qty, 0),
    subtotal: () => Cart.detailed().reduce((s, i) => s + i.product.price * i.qty, 0),
  };

  /* ---------- Wishlist ---------- */
  const Wishlist = {
    items: () => read(KEYS.wishlist, []),
    has: (id) => Wishlist.items().includes(id),
    toggle(id) {
      let w = Wishlist.items();
      const on = !w.includes(id);
      w = on ? [...w, id] : w.filter((x) => x !== id);
      write(KEYS.wishlist, w);
      return on;
    },
    remove(id) { write(KEYS.wishlist, Wishlist.items().filter((x) => x !== id)); },
  };

  /* ---------- Users / auth ---------- */
  const Auth = {
    users: () => read(KEYS.users, []),
    current() {
      const s = read(KEYS.session, null);
      return s ? Auth.users().find((u) => u.id === s) || null : null;
    },
    register({ name, email, password, phone = "" }) {
      const users = Auth.users();
      if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) return { ok: false, msg: "An account with this email already exists" };
      const user = { id: uid("u"), name, email, password, phone, createdAt: Date.now() };
      users.push(user);
      write(KEYS.users, users);
      write(KEYS.session, user.id);
      return { ok: true, user };
    },
    login(email, password) {
      const u = Auth.users().find((x) => x.email.toLowerCase() === email.toLowerCase() && x.password === password);
      if (!u) return { ok: false, msg: "Invalid email or password" };
      write(KEYS.session, u.id);
      return { ok: true, user: u };
    },
    update(patch) {
      const cur = Auth.current();
      if (!cur) return;
      write(KEYS.users, Auth.users().map((u) => (u.id === cur.id ? { ...u, ...patch } : u)));
    },
    logout() { localStorage.removeItem(KEYS.session); document.dispatchEvent(new CustomEvent("store:change", { detail: { key: KEYS.session } })); },
  };

  /* ---------- Orders ---------- */
  const Orders = {
    all: () => read(KEYS.orders, []).sort((a, b) => b.createdAt - a.createdAt),
    get: (id) => Orders.all().find((o) => o.id === id),
    forUser: (uid_) => Orders.all().filter((o) => o.userId === uid_),
    create(order) {
      const list = read(KEYS.orders, []);
      const id = "ET-" + (100000 + Math.floor(Math.random() * 899999));
      const full = { ...order, id, status: "pending", createdAt: Date.now() };
      list.push(full);
      write(KEYS.orders, list);
      // reduce stock
      const products = Products.all();
      order.items.forEach((it) => {
        const p = products.find((x) => x.id === it.id);
        if (p) p.stock = Math.max(0, p.stock - it.qty);
      });
      Products.save(products);
      return full;
    },
    setStatus(id, status) {
      const list = read(KEYS.orders, []);
      const o = list.find((x) => x.id === id);
      if (!o) return;
      // restock if cancelled
      if (status === "cancelled" && o.status !== "cancelled") {
        const products = Products.all();
        o.items.forEach((it) => { const p = products.find((x) => x.id === it.id); if (p) p.stock += it.qty; });
        Products.save(products);
      }
      o.status = status;
      write(KEYS.orders, list);
    },
    remove(id) { write(KEYS.orders, read(KEYS.orders, []).filter((o) => o.id !== id)); },
  };

  /* ---------- Reviews ---------- */
  const Reviews = {
    all: () => read(KEYS.reviews, []),
    for: (pid) => Reviews.all().filter((r) => r.productId === pid),
    add(r) { write(KEYS.reviews, [{ id: uid("r"), createdAt: Date.now(), ...r }, ...Reviews.all()]); },
  };

  /* ---------- Coupons & settings ---------- */
  const Coupons = {
    all: () => read(KEYS.coupons, DEFAULT_COUPONS),
    save(list) { write(KEYS.coupons, list); },
    find: (code) => Coupons.all().find((c) => c.code.toUpperCase() === String(code).trim().toUpperCase() && c.active),
  };
  const Settings = {
    get: () => ({ ...DEFAULT_SETTINGS, ...read(KEYS.settings, {}) }),
    save(s) { write(KEYS.settings, { ...Settings.get(), ...s }); },
  };

  /* ---------- Pricing ---------- */
  function computeTotals({ subtotal, coupon, shippingMethod = "standard" }) {
    const s = Settings.get();
    let discount = 0;
    let freeShip = subtotal >= s.freeShippingOver;
    let couponMsg = "";
    if (coupon) {
      if (subtotal < (coupon.min || 0)) couponMsg = `Minimum order Rs. ${coupon.min.toLocaleString()} required`;
      else if (coupon.type === "percent") discount = Math.round((subtotal * coupon.value) / 100);
      else if (coupon.type === "flat") discount = Math.min(coupon.value, subtotal);
      else if (coupon.type === "ship") freeShip = true;
    }
    let shipping = 0;
    if (subtotal > 0) {
      if (shippingMethod === "express") shipping = s.shippingExpress;
      else shipping = freeShip ? 0 : s.shippingStandard;
    }
    const tax = Math.round(((subtotal - discount) * (s.taxRate || 0)) / 100);
    const total = Math.max(0, subtotal - discount + shipping + tax);
    return { subtotal, discount, shipping, tax, total, couponMsg };
  }

  const money = (n) => Settings.get().currency + " " + Math.round(Number(n) || 0).toLocaleString("en-PK");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const catName = (id) => (CATEGORIES.find((c) => c.id === id) || { name: id }).name;

  seed();

  window.Store = {
    KEYS, CATEGORIES, Products, Cart, Wishlist, Auth, Orders, Reviews, Coupons, Settings,
    computeTotals, money, esc, catName, uid, seed, read, write,
  };
})();
