-- LUBO TRADITIONS: Required privileges for server-side order API
-- The API uses SUPABASE_SERVICE_ROLE_KEY on the server only.
-- Never expose this key in NEXT_PUBLIC_* variables or browser code.

-- Ensure service role can write orders and order items (Supabase service_role
-- normally bypasses RLS; these grants make table privileges explicit).
grant usage on schema public to service_role;
grant select, insert, update, delete on public.orders to service_role;
grant select, insert, update, delete on public.order_items to service_role;
grant select on public.products to service_role;

-- Public storefront only sees published products.
-- Your existing RLS policy already covers this.
-- Admin product and order policies from your earlier SQL remain in place.
