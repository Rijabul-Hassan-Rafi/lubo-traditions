# LUBO TRADITIONS — Premium E-commerce

## Included
- Responsive premium storefront
- Supabase product catalogue
- Shopping cart and checkout
- Server-side order creation (price is read from Supabase, not trusted from browser)
- WhatsApp order handoff after database save
- Admin login, product CRUD, image upload and order status management

## 1. Install
```bash
npm install
```

## 2. Configure environment
Copy `.env.example` to `.env.local` and fill:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service_role key (server only; never publish)
- `NEXT_PUBLIC_WHATSAPP_NUMBER`: Store WhatsApp number with country code, digits only. Bangladesh example format: 8801XXXXXXXXX

## 3. Supabase setup
You already created the tables, admin profile and `products` Storage bucket.
Run `SUPABASE-ORDER-PERMISSIONS.sql` in Supabase SQL Editor.
Confirm Storage policies allow only active admins to upload/update/delete files in `products`.
Your existing admin policies use `private.is_admin()`.

Important: Keep `SUPABASE_SERVICE_ROLE_KEY` secret. Add it only to `.env.local` locally and Vercel Environment Variables. Do not put it in client-side code or GitHub.

## 4. Run locally
```bash
npm run dev
```
Open http://localhost:3000
Admin login: http://localhost:3000/admin/login

## 5. Add products
Sign in with the Auth user that has an active row in `public.admin_profiles`.
Open Products → Add Product. Upload an image or paste an image URL. Set stock and Publish.

## 6. Deploy with GitHub + Vercel
1. Create a GitHub repository named `lubo-traditions`.
2. Upload/push all project files (do not upload `.env.local`).
3. In Vercel choose Add New → Project → Import the repository.
4. Framework preset: Next.js. Build command: `npm run build`.
5. Add all four environment variables from `.env.local` under Project Settings → Environment Variables.
6. Deploy. If you change environment variables, redeploy.

## 7. Order flow
The server validates customer data and fetches product prices from Supabase. It writes the order and order items using the server-only service role key. After a successful save, the browser opens WhatsApp with a prefilled order message. The customer must press Send in WhatsApp; the site cannot silently send WhatsApp messages.

## Before going live
- Replace social links and store contact details in `app/page.jsx`.
- Add your real WhatsApp number in Vercel env vars.
- Add real product photos, prices, stock, sizes and colors from Admin.
- Test a small order end-to-end.
- Consider adding rate limiting / CAPTCHA and an order privacy notice before public advertising.

## Notes
- Delivery charge is currently set to 0 and the storefront says it will be confirmed with the store. Adjust `delivery` in `app/api/orders/route.js` if you decide on a fixed charge.
- Demo products are visual placeholders only and cannot be ordered. Add real products in Admin to make them purchasable.
