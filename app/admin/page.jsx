 "use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { LayoutDashboard, Package, ShoppingBag, LogOut, Plus, Pencil, Trash2, X, Upload, RefreshCw, ExternalLink } from "lucide-react";

const money = n => `৳${Number(n || 0).toLocaleString("en-BD")}`;
const blank = { name:"", description:"", category:"Traditional", sku:"", price:"", compare_price:"", image_url:"", sizes:"", colors:"", stock:"0", is_published:true };
const statuses = ["pending","confirmed","processing","shipped","delivered","cancelled"];

export default function AdminPage() {
  const router = useRouter();
  const [sb,setSb] = useState(null);
  const [user,setUser] = useState(null);
  const [tab,setTab] = useState("overview");
  const [products,setProducts] = useState([]);
  const [orders,setOrders] = useState([]);
  const [items,setItems] = useState({});
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");
  const [message,setMessage] = useState("");
  const [editing,setEditing] = useState(null);
  const [form,setForm] = useState(blank);
  const [file,setFile] = useState(null);
  const [saving,setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const client = supabaseBrowser();
        const { data:{ user }, error } = await client.auth.getUser();
        if (error || !user) { router.replace("/admin/login"); return; }
        const { data: profile, error: pErr } = await client.from("admin_profiles").select("is_active,full_name").eq("user_id",user.id).single();
        if (pErr || !profile?.is_active) { await client.auth.signOut(); router.replace("/admin/login"); return; }
        if (active) { setSb(client); setUser({ ...user, full_name: profile.full_name }); }
        await loadData(client);
      } catch(e) { if(active) setError(e.message); }
      finally { if(active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [router]);

  async function loadData(client=sb) {
    if (!client) return;
    const [p,o] = await Promise.all([
      client.from("products").select("*").order("created_at",{ascending:false}),
      client.from("orders").select("*").order("created_at",{ascending:false})
    ]);
    if (p.error) throw p.error;
    if (o.error) throw o.error;
    setProducts(p.data || []); setOrders(o.data || []);
    const orderIds=(o.data||[]).map(x=>x.id);
    if(orderIds.length) {
      const {data:oi,error:oiError}=await client.from("order_items").select("*").in("order_id",orderIds);
      if(oiError) throw oiError;
      const grouped={}; (oi||[]).forEach(x=>{(grouped[x.order_id] ||= []).push(x);}); setItems(grouped);
    } else setItems({});
  }

  async function signOut() { await sb.auth.signOut(); router.replace("/admin/login"); }
  function openNew() { setEditing("new"); setForm(blank); setFile(null); setTab("products"); }
  function openEdit(p) { setEditing(p.id); setForm({ ...p, price:String(p.price), compare_price:p.compare_price == null ? "" : String(p.compare_price), stock:String(p.stock), sizes:(p.sizes||[]).join(", "), colors:(p.colors||[]).join(", ") }); setFile(null); }
  async function saveProduct(e) {
    e.preventDefault(); setSaving(true); setError(""); setMessage("");
    try {
      let image_url=form.image_url;
      if(file) {
        const ext=(file.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"");
        const path=`${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
        const {error:uploadError}=await sb.storage.from("products").upload(path,file,{upsert:false,contentType:file.type});
        if(uploadError) throw uploadError;
        const {data}=sb.storage.from("products").getPublicUrl(path);
        image_url=data.publicUrl;
      }
      const payload={
        name:form.name.trim(), description:form.description.trim(), category:form.category.trim(),
        sku:form.sku.trim()||null, price:Number(form.price), compare_price:form.compare_price?Number(form.compare_price):null,
        image_url, sizes:form.sizes.split(",").map(x=>x.trim()).filter(Boolean),
        colors:form.colors.split(",").map(x=>x.trim()).filter(Boolean), stock:Number(form.stock),
        is_published:Boolean(form.is_published), updated_at:new Date().toISOString()
      };
      if(!payload.name || !payload.category || !Number.isFinite(payload.price) || payload.price<0 || !Number.isInteger(payload.stock) || payload.stock<0) throw new Error("Check product name, category, price and stock.");
      const result=editing==="new" ? await sb.from("products").insert(payload) : await sb.from("products").update(payload).eq("id",editing);
      if(result.error) throw result.error;
      setEditing(null); setMessage("Product saved successfully."); await loadData();
    } catch(e) { setError(e.message); }
    finally { setSaving(false); }
  }
  async function deleteProduct(p) {
    if(!confirm(`Delete "${p.name}"?`)) return;
    const {error}=await sb.from("products").delete().eq("id",p.id);
    if(error) setError(error.message); else { setMessage("Product deleted."); await loadData(); }
  }
  async function updateStatus(id,status) {
    const {error}=await sb.from("orders").update({status,updated_at:new Date().toISOString()}).eq("id",id);
    if(error) setError(error.message); else { setMessage("Order status updated."); await loadData(); }
  }
  const revenue=orders.filter(o=>o.status!=="cancelled").reduce((s,o)=>s+Number(o.total),0);
  if(loading) return <div className="admin-loading">Loading LUBO Admin...</div>;

  return <div className="admin-shell">
    <aside className="admin-sidebar"><a className="brand" href="/"><span className="brand-mark">L</span><span>LUBO <b>TRADITIONS</b><small>ADMIN STUDIO</small></span></a><div className="sidebar-label">WORKSPACE</div>
      <button className={tab==="overview"?"side-link selected":"side-link"} onClick={()=>{setTab("overview");setEditing(null)}}><LayoutDashboard size={18}/> Overview</button>
      <button className={tab==="products"?"side-link selected":"side-link"} onClick={()=>{setTab("products");setEditing(null)}}><Package size={18}/> Products</button>
      <button className={tab==="orders"?"side-link selected":"side-link"} onClick={()=>{setTab("orders");setEditing(null)}}><ShoppingBag size={18}/> Orders <span className="side-count">{orders.filter(o=>o.status==="pending").length}</span></button>
      <div className="sidebar-bottom"><p>{user?.email}</p><button className="side-link" onClick={signOut}><LogOut size={17}/> Sign out</button><a href="/" className="side-link"><ExternalLink size={17}/> View store</a></div>
    </aside>
    <main className="admin-main"><header className="admin-top"><div><p className="eyebrow">LUBO TRADITIONS / ADMIN</p><h1>{tab==="overview"?"Overview":tab==="products"?"Product management":"Order management"}</h1></div><button className="refresh-btn" onClick={()=>loadData()}><RefreshCw size={16}/> Refresh</button></header>
      {error && <div className="admin-alert error">{error}<button onClick={()=>setError("")}><X size={15}/></button></div>}
      {message && <div className="admin-alert">{message}<button onClick={()=>setMessage("")}><X size={15}/></button></div>}
      {tab==="overview" && <><div className="stats-grid"><div className="stat-card"><span>Total products</span><strong>{products.length}</strong><small>In your catalogue</small></div><div className="stat-card"><span>Total orders</span><strong>{orders.length}</strong><small>All-time orders</small></div><div className="stat-card"><span>Pending orders</span><strong>{orders.filter(o=>o.status==="pending").length}</strong><small>Need your attention</small></div><div className="stat-card"><span>Order value</span><strong>{money(revenue)}</strong><small>Excludes cancelled orders</small></div></div><section className="admin-panel"><div className="panel-heading"><div><p className="eyebrow">LATEST ACTIVITY</p><h2>Recent orders</h2></div><button className="outline-btn" onClick={()=>setTab("orders")}>VIEW ALL</button></div><OrdersTable orders={orders.slice(0,6)} items={items} updateStatus={updateStatus}/></section></>}
      {tab==="products" && <section className="admin-panel"><div className="panel-heading"><div><p className="eyebrow">YOUR COLLECTION</p><h2>{editing ? (editing==="new"?"Add a product":"Edit product") : "All products"}</h2></div>{!editing && <button className="primary-btn compact" onClick={openNew}><Plus size={16}/> ADD PRODUCT</button>}</div>
        {editing ? <form className="product-form" onSubmit={saveProduct}><div className="form-grid"><label>Product name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>Category<input required value={form.category} onChange={e=>setForm({...form,category:e.target.value})} placeholder="Kurtis, Saree, Co-ord Sets"/></label><label>Price (BDT)<input required type="number" min="0" step="0.01" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/></label><label>Compare price (optional)<input type="number" min="0" step="0.01" value={form.compare_price} onChange={e=>setForm({...form,compare_price:e.target.value})}/></label><label>SKU (optional)<input value={form.sku||""} onChange={e=>setForm({...form,sku:e.target.value})}/></label><label>Stock quantity<input required type="number" min="0" step="1" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})}/></label><label>Sizes (comma separated)<input value={form.sizes} onChange={e=>setForm({...form,sizes:e.target.value})} placeholder="S, M, L, XL"/></label><label>Colors (comma separated)<input value={form.colors} onChange={e=>setForm({...form,colors:e.target.value})} placeholder="Black, Cream, Olive"/></label><label className="wide">Description<textarea rows="3" value={form.description||""} onChange={e=>setForm({...form,description:e.target.value})}/></label><label className="wide">Product image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>setFile(e.target.files?.[0]||null)}/><small>Upload JPG, PNG or WebP. Images are stored in the public products bucket.</small></label><label className="wide">Or image URL<input type="url" value={form.image_url||""} onChange={e=>setForm({...form,image_url:e.target.value})} placeholder="https://..."/></label><label className="publish-check"><input type="checkbox" checked={Boolean(form.is_published)} onChange={e=>setForm({...form,is_published:e.target.checked})}/> Publish this product on the storefront</label></div><div className="form-actions"><button type="button" className="outline-btn" onClick={()=>setEditing(null)}>CANCEL</button><button className="primary-btn compact" disabled={saving}>{saving?"SAVING...":"SAVE PRODUCT"}</button></div></form> : <div className="admin-product-list">{products.map(p=><div className="admin-product-row" key={p.id}><img src={p.image_url||"https://placehold.co/100x120?text=LUBO"} alt=""/><div className="admin-product-details"><strong>{p.name}</strong><span>{p.category} · {money(p.price)} · Stock: {p.stock}</span><small>{p.is_published?"Published":"Draft"}</small></div><button className="mini-action" onClick={()=>openEdit(p)} aria-label="Edit"><Pencil size={16}/></button><button className="mini-action danger" onClick={()=>deleteProduct(p)} aria-label="Delete"><Trash2 size={16}/></button></div>)}{products.length===0&&<p className="empty">No products yet. Add your first product.</p>}</div>}
      </section>}
      {tab==="orders" && <section className="admin-panel"><div className="panel-heading"><div><p className="eyebrow">CUSTOMER PURCHASES</p><h2>All orders</h2></div></div><OrdersTable orders={orders} items={items} updateStatus={updateStatus}/></section>}
    </main>
  </div>;
}

function OrdersTable({orders,items,updateStatus}) {
  if(!orders.length) return <p className="empty">No orders have been placed yet.</p>;
  return <div className="orders-list">{orders.map(o=><article className="order-card" key={o.id}><div className="order-top"><div><strong>{o.order_number}</strong><span>{new Date(o.created_at).toLocaleString("en-BD")}</span></div><strong>{money(o.total)}</strong></div><div className="order-customer"><b>{o.customer_name}</b><span>{o.customer_phone}</span><span>{o.customer_address}</span>{o.customer_note&&<i>Note: {o.customer_note}</i>}</div><div className="order-lines">{(items[o.id]||[]).map(i=><span key={i.id}>{i.product_name} × {i.quantity} — {money(i.line_total)}</span>)}</div><div className="order-bottom"><span className={`status status-${o.status}`}>{o.status}</span><select value={o.status} onChange={e=>updateStatus(o.id,e.target.value)} aria-label="Update order status">{statuses.map(s=><option key={s} value={s}>{s.toUpperCase()}</option>)}</select></div></article>)}</div>;
}
