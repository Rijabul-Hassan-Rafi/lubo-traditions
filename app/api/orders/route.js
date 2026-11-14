import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();
    const customer = body?.customer || {};
    const items = body?.items || [];
    const name = String(customer.name || "").trim();
    const phone = String(customer.phone || "").trim();
    const address = String(customer.address || "").trim();
    const note = String(customer.note || "").trim();

    if (name.length < 2 || name.length > 100) return NextResponse.json({ error: "Please enter a valid name." }, { status: 400 });
    if (!/^01[3-9]\d{8}$/.test(phone)) return NextResponse.json({ error: "Enter a valid Bangladesh mobile number (01XXXXXXXXX)." }, { status: 400 });
    if (address.length < 8 || address.length > 500) return NextResponse.json({ error: "Please enter your complete delivery address." }, { status: 400 });
    if (!Array.isArray(items) || items.length < 1 || items.length > 30) return NextResponse.json({ error: "Your cart is empty or contains too many items." }, { status: 400 });

    const ids = [...new Set(items.map(x => String(x.product_id || "")))];
    if (ids.some(id => !/^[0-9a-f-]{36}$/i.test(id))) return NextResponse.json({ error: "Invalid product in cart. Please refresh and try again." }, { status: 400 });

    const sb = supabaseAdmin();
    const { data: products, error: productError } = await sb.from("products")
      .select("id,name,price,stock,is_published").in("id", ids);
    if (productError) throw productError;
    if (!products || products.length !== ids.length) return NextResponse.json({ error: "One or more products are no longer available." }, { status: 400 });

    const normalized = [];
    for (const item of items) {
      const product = products.find(p => p.id === item.product_id);
      const qty = Number(item.quantity);
      if (!product || !product.is_published || !Number.isInteger(qty) || qty < 1 || qty > 20) {
        return NextResponse.json({ error: "Invalid product or quantity." }, { status: 400 });
      }
      if (product.stock < qty) return NextResponse.json({ error: `${product.name} does not have enough stock.` }, { status: 400 });
      normalized.push({ product_id: product.id, product_name: product.name, quantity: qty, unit_price: Number(product.price), line_total: Number(product.price) * qty });
    }
    const subtotal = normalized.reduce((sum, x) => sum + x.line_total, 0);
    const delivery = 0; // Store can confirm/set delivery charge later.
    const total = subtotal + delivery;

    const { data: order, error: orderError } = await sb.from("orders").insert({
      customer_name: name, customer_phone: phone, customer_address: address,
      customer_note: note || null, subtotal, delivery_charge: delivery, total
    }).select("id,order_number").single();
    if (orderError) throw orderError;

    const rows = normalized.map(x => ({
      order_id: order.id, product_id: x.product_id, product_name: x.product_name,
      quantity: x.quantity, unit_price: x.unit_price, line_total: x.line_total
    }));
    const { error: itemError } = await sb.from("order_items").insert(rows);
    if (itemError) {
      await sb.from("orders").delete().eq("id", order.id);
      throw itemError;
    }

    return NextResponse.json({
      order_number: order.order_number, subtotal, delivery_charge: delivery, total,
      items: normalized.map(x => ({ name: x.product_name, quantity: x.quantity, line_total: x.line_total }))
    }, { status: 201 });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "We could not place your order right now. Please try again or contact the store." }, { status: 500 });
  }
}
