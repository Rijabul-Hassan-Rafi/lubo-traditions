 "use client";

import { useEffect, useMemo, useState } from "react";
import { Search, ShoppingBag, Menu, X, Plus, Minus, ArrowRight, Instagram, Facebook, MessageCircle, CheckCircle2, Trash2 } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

const money = (n) => `৳${Number(n || 0).toLocaleString("en-BD")}`;
const fallback = []

export default function Home() {
  const [products, setProducts] = useState(fallback);
  const [cart, setCart] = useState([]);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "", note: "" });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);

useEffect(() => {
  const timer = setInterval(() => {
    setCurrentSlide((prev) => (prev + 1) % 5);
  }, 4000);

  return () => clearInterval(timer);
}, []);

  useEffect(() => {
    try {
      const sb = supabaseBrowser();
      sb.from("products").select("id,name,description,category,price,compare_price,image_url,sizes,colors,stock")
        .eq("is_published", true).gt("stock", 0).order("created_at", { ascending: false })
        .then(({ data, error }) => {
          if (!error && data) setProducts(data);
        });
    } catch (e) { console.warn(e.message); }
  }, []);

  const categories = useMemo(() => ["All", ...new Set(products.map(p => p.category).filter(Boolean))], [products]);
  const filtered = useMemo(() => products.filter(p =>
    (category === "All" || p.category === category) &&
    `${p.name || ""} ${p.category || ""}`.toLowerCase().includes(query.trim().toLowerCase())
  ), [products, category, query]);
  const count = cart.reduce((s, item) => s + item.qty, 0);
  const total = cart.reduce((s, item) => s + item.price * item.qty, 0);

  function addToCart(product) {
    if (product.id.toString().startsWith("demo-")) {
      setNotice("Demo item only. Add your own products in the Admin Dashboard.");
      setTimeout(() => setNotice(""), 3000); return;
    }
    setCart(prev => {
      const found = prev.find(x => x.id === product.id);
      return found ? prev.map(x => x.id === product.id ? { ...x, qty: x.qty + 1 } : x) : [...prev, { ...product, qty: 1 }];
    });
    setSelected(null);
    setNotice(`${product.name} added to your bag`);
    setTimeout(() => setNotice(""), 2200);
  }

function buyNow(product) {
  if (product.id.toString().startsWith("demo-")) {
    setNotice("Please order an available store product.");
    setTimeout(() => setNotice(""), 3000);
    return;
  }

  setCart([{ ...product, qty: 1 }]);
  setSelected(null);
  setCartOpen(false);
  setCheckoutOpen(true);
}

  function changeQty(id, delta) {
    setCart(prev => prev.map(x => x.id === id ? { ...x, qty: x.qty + delta } : x).filter(x => x.qty > 0));
  }

  async function placeOrder(e) {
    e.preventDefault();
    if (!cart.length) return;
    setBusy(true); setNotice("");
    try {
      const response = await fetch("/api/orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer: form, items: cart.map(({ id, qty }) => ({ product_id: id, quantity: qty })) })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save your order.");
      const lines = result.items.map(x => `${x.name} x ${x.quantity} — ${money(x.line_total)}`).join("\n");
      const message = `Assalamu Alaikum, I would like to place an order at LUBO TRADITIONS.\n\nOrder: ${result.order_number}\n${lines}\nSubtotal: ${money(result.subtotal)}\nDelivery: ${money(result.delivery_charge)}\nTotal: ${money(result.total)}\n\nCustomer: ${form.name}\nPhone: ${form.phone}\nAddress: ${form.address}\nNote: ${form.note || "N/A"}`;
      const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";
      setCart([]); setCheckoutOpen(false); setCartOpen(false);
      if (number && !number.includes("X")) {
        window.open(`https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
        setNotice(`Order ${result.order_number} saved. Please send the message in WhatsApp.`);
      } else {
        setNotice(`Order ${result.order_number} saved. Store WhatsApp number is not configured yet.`);
      }
    } catch (err) {
      setNotice(err.message);
    } finally { setBusy(false); }
  }

  return (
    <main>
      <div className="announcement">A LITTLE MORE BEAUTY IN EVERYDAY LIFE <span>✦</span> THOUGHTFULLY CURATED FOR YOU</div>
      <header className="header">
        <button className="icon-btn mobile-menu" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">{mobileOpen ? <X/> : <Menu/>}</button>
        <nav className={`nav-left ${mobileOpen ? "show" : ""}`}>
          <a href="#shop" onClick={() => setMobileOpen(false)}>SHOP</a><a href="#story" onClick={() => setMobileOpen(false)}>OUR STORY</a><a href="#contact" onClick={() => setMobileOpen(false)}>CONTACT</a>
        </nav>
       <a className="brand" href="#">
  <img
    src="/logo.png"
    alt="L"
    className="brand-mark"
    style={{ objectFit: "contain" }}
  />
  <span>LUBO <b>TRADITIONS</b><small>TIMELESS • THOUGHTFUL • YOU</small></span>
</a>
        <div className="header-actions">
          <label className="search-box"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search pieces..." /></label>
          <button className="bag-button" onClick={() => setCartOpen(true)} aria-label="Open shopping bag"><ShoppingBag size={19}/><span> BAG ({count})</span></button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">THE ART OF EVERYDAY ELEGANCE</p>
          <h1>Tradition, with<br/><em>a modern soul.</em></h1>
          <p className="hero-text">Thoughtfully chosen pieces that celebrate where you come from — and everything you are becoming.</p>
          <a className="primary-btn" href="#shop">EXPLORE THE COLLECTION <ArrowRight size={16}/></a>
          <div className="hero-note"><span>✳</span> MADE TO BE WORN, LOVED & REMEMBERED</div>
        </div>
        <div className="hero-image">
  <div
    className="hero-slide"
    style={{
      backgroundImage: `url('/banner-${currentSlide + 1}.jpg')`
    }}
  />

  

  <div className="hero-dots">
    {[0, 1, 2, 3, 4].map((index) => (
      <button
        key={index}
        className={currentSlide === index ? "active" : ""}
        onClick={() => setCurrentSlide(index)}
        aria-label={`Go to slide ${index + 1}`}
      />
    ))}
  </div>
  <div className="hero-image-label">
    <span>THE NEW EDIT</span>
    <b>Quietly timeless.</b>
  </div>
</div>
        <div className="hero-side">LUBO TRADITIONS — EST. WITH LOVE</div>
      </section>

      <section className="values"><div><span>✳</span><p>TIMELESS DESIGN</p></div><div><span>◇</span><p>THOUGHTFUL DETAILS</p></div><div><span>♡</span><p>MADE FOR YOUR MOMENTS</p></div></section>

      <section className="shop-section" id="shop">
        <div className="section-heading"><div><p className="eyebrow">CURATED FOR YOU</p><h2>Pieces to <em>cherish.</em></h2></div><p>Discover the collection —<br/>made for every version of you.</p></div>
        <div className="category-row">{categories.map(c => <button key={c} className={category === c ? "category active" : "category"} onClick={() => setCategory(c)}>{c}</button>)}</div>
        <div className="product-grid">
          {filtered.map((p, i) => <article className="product-card" key={p.id}>
            <button className="product-image" onClick={() => setSelected(p)} aria-label={`View ${p.name}`}><img src={p.image_url || "https://placehold.co/700x900?text=LUBO"} alt={p.name} loading={i > 2 ? "lazy" : "eager"}/>{p.compare_price && Number(p.compare_price) > Number(p.price) && <span className="tag">SPECIAL PRICE</span>}<span className="quick-view">QUICK VIEW <ArrowRight size={13}/></span></button>
            
<div className="product-info">
  <div>
    <h3>{p.name}</h3>
    <p>{p.category}</p>
  </div>
  <div className="product-pricing">
    <strong>{money(p.price)}</strong>
    {Number(p.compare_price) > Number(p.price) && (
      <>
        <del>{money(p.compare_price)}</del>
        <span className="discount-badge">
          SAVE {Math.round((Number(p.compare_price) - Number(p.price)) / Number(p.compare_price) * 100)}%
        </span>
      </>
    )}
  </div>
</div>

<button className="add-btn" onClick={() => addToCart(p)}>
  ADD TO BAG <Plus size={14}/>
</button>

<button className="order-now-btn" onClick={() => buyNow(p)}>
  ORDER NOW <ArrowRight size={14}/>
</button>

          </article>)}
        </div>
        {filtered.length === 0 && <p className="empty">No pieces found. Try another search.</p>}
      </section>

      

<section className="story-editorial" id="story">
  <div className="story-editorial-inner">

    <div className="story-topline">
      <span className="story-number">01 — OUR PHILOSOPHY</span>
      <span className="story-star">✳</span>
      <span className="story-label">THE LUBO JOURNAL</span>
    </div>

    <div className="story-main">
      <div className="story-left">
        <p className="eyebrow">A NOTE FROM LUBO</p>

        <h2>
          Rooted in heritage.
          <br />
          <em>Made for today.</em>
        </h2>

        <div className="story-divider">
          <span></span><span>✦</span><span></span>
        </div>
      </div>

      <div className="story-right">
        <p className="story-description">
          We believe getting dressed can be a small, beautiful ritual.
          LUBO TRADITIONS brings together thoughtful design, graceful
          details and the comfort to feel like yourself — every single day.
        </p>

        <a href="#shop" className="story-editorial-link">
          FIND YOUR NEXT FAVOURITE
          <ArrowRight size={15} />
        </a>
      </div>
    </div>

    <div className="story-bottomline">
      TIMELESS • THOUGHTFUL • YOU
    </div>

  </div>
</section>


      <section className="newsletter"><p className="eyebrow">STAY IN THE LOOP</p><h2>Something lovely is <em>on its way.</em></h2><p>Follow along for new arrivals, styling notes and little moments from LUBO.</p><a className="primary-btn dark" href="#contact">CONNECT WITH US <ArrowRight size={16}/></a></section>

      <footer id="contact"><div className="footer-main"><div><a className="brand footer-brand" href="#"><img
  src="/logo.png"
  alt="L"
  className="brand-mark"
  style={{ objectFit: "contain" }}
/><span>LUBO <b>TRADITIONS</b><small>TIMELESS • THOUGHTFUL • YOU</small></span></a><p className="footer-blurb">Celebrating timeless style, thoughtful details and the beauty of tradition.</p></div><div><h4>EXPLORE</h4><a href="#shop">Shop all</a><a href="#story">Our story</a><a href="#contact">Contact</a></div><div><h4>WE'RE HERE</h4><p>For orders & enquiries</p><p>Bangladesh</p><p>WhatsApp: 8801767470490</p></div><div><h4>FOLLOW OUR JOURNEY</h4><div className="socials"><a href="https://www.instagram.com/lubotraditions/" aria-label="Instagram"><Instagram/></a><a href="https://www.facebook.com/profile.php?id=61572302204625" aria-label="Facebook"><Facebook/></a><a href="https://wa.me/8801767470490" aria-label="WhatsApp"><MessageCircle/></a></div></div></div>

<div className="payment-methods">
  <h4>PAYMENT METHODS</h4>

  <div className="payment-list">
    <div className="payment-item bkash">
      <img src="/bkash.png" alt="bKash" />
      <span>bKash</span>
    </div>

    <div className="payment-item nagad">
      <img src="/nagad.png" alt="Nagad" />
      <span>Nagad</span>
    </div>

    <div className="payment-item bank">
      <span className="payment-icon">🏦</span>
      <span>Bank Payment</span>
    </div>

    <div className="payment-item cod">
      <span className="payment-icon">🚚</span>
      <span>Cash on Delivery</span>
    </div>
  </div>
</div>
<div className="copyright"><span>© {new Date().getFullYear()} LUBO TRADITIONS. ALL RIGHTS RESERVED.</span>&nbsp;&nbsp;<span>MADE WITH CARE ✳</span></div></footer>

      {notice && <div className="toast"><CheckCircle2 size={17}/>{notice}</div>}
      {selected && <div className="overlay" onClick={() => setSelected(null)}><div className="modal product-modal" onClick={e => e.stopPropagation()}><button className="close" onClick={() => setSelected(null)}><X/></button><img src={selected.image_url || "https://placehold.co/700x900?text=LUBO"} alt={selected.name}/><div className="modal-copy"><p className="eyebrow">{selected.category}</p><h2>{selected.name}</h2><strong>{money(selected.price)}</strong><p>{selected.description}</p>{selected.sizes?.length > 0 && <p>Sizes: {selected.sizes.join(", ")}</p>}<button className="primary-btn" onClick={() => addToCart(selected)}>ADD TO BAG <ArrowRight size={16}/></button></div></div></div>}

      {cartOpen && <div className="overlay" onClick={() => setCartOpen(false)}><aside className="drawer" onClick={e => e.stopPropagation()}><div className="drawer-head"><h2>Your bag <span>({count})</span></h2><button className="icon-btn" onClick={() => setCartOpen(false)}><X/></button></div>
        {cart.length === 0 ? <div className="empty-cart"><ShoppingBag size={35}/><p>Your bag is waiting for something lovely.</p><button className="text-link" onClick={() => setCartOpen(false)}>CONTINUE SHOPPING</button></div> : <>
          <div className="cart-items">{cart.map(item => <div className="cart-item" key={item.id}><img src={item.image_url} alt={item.name}/><div className="cart-item-info"><h3>{item.name}</h3><strong>{money(item.price)}</strong><div className="qty"><button onClick={() => changeQty(item.id, -1)}><Minus size={13}/></button><span>{item.qty}</span><button onClick={() => changeQty(item.id, 1)}><Plus size={13}/></button><button className="remove" onClick={() => changeQty(item.id, -item.qty)}><Trash2 size={14}/></button></div></div></div>)}</div>
          <div className="cart-bottom"><div className="subtotal"><span>Subtotal</span><strong>{money(total)}</strong></div><p>Delivery charge will be confirmed with your order.</p><button className="primary-btn full" onClick={() => {setCartOpen(false);setCheckoutOpen(true)}}>PROCEED TO CHECKOUT <ArrowRight size={16}/></button></div>
        </>}
      </aside></div>}

      {checkoutOpen && <div className="overlay" onClick={() => !busy && setCheckoutOpen(false)}><div className="modal checkout-modal" onClick={e => e.stopPropagation()}><button className="close" onClick={() => setCheckoutOpen(false)}><X/></button><p className="eyebrow">ALMOST YOURS</p><h2>Delivery <em>details.</em></h2><p className="checkout-sub">Please enter your information so we can get your order to you.</p><form onSubmit={placeOrder} className="checkout-form">
        <label>Full name<input required minLength="2" value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Your full name"/></label>
        <label>Mobile number<input required pattern="01[3-9][0-9]{8}" title="Enter a valid Bangladesh mobile number, e.g. 017XXXXXXXX" value={form.phone} onChange={e => setForm({...form,phone:e.target.value})} placeholder="01XXXXXXXXX"/></label>
        <label>Full delivery address<textarea required minLength="8" value={form.address} onChange={e => setForm({...form,address:e.target.value})} placeholder="House, road, area, district"/></label>
        <label>Order note (optional)<input value={form.note} onChange={e => setForm({...form,note:e.target.value})} placeholder="Size, color or delivery instructions"/></label>
        <div className="checkout-total"><span>Order total (delivery may apply)</span><strong>{money(total)}</strong></div>
        <button className="primary-btn full" disabled={busy}>{busy ? "PLACING ORDER..." : "PLACE ORDER & CONTINUE TO WHATSAPP"} <ArrowRight size={16}/></button>
      </form></div></div>}
    </main>
  );
}
