 "use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function AdminLogin() {
  const router = useRouter();
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [error,setError] = useState("");
  const [busy,setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const sb = supabaseBrowser();
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { data: { user } } = await sb.auth.getUser();
      const { data: profile, error: profileError } = await sb.from("admin_profiles").select("is_active").eq("user_id", user.id).single();
      if (profileError || !profile?.is_active) {
        await sb.auth.signOut();
        throw new Error("This account is not an active LUBO administrator.");
      }
      router.replace("/admin");
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  return <main className="admin-login"><a className="brand" href="/"><span className="brand-mark">L</span><span>LUBO <b>TRADITIONS</b><small>ADMINISTRATION</small></span></a><form onSubmit={submit} className="admin-login-card"><p className="eyebrow">PRIVATE ACCESS</p><h1>Welcome <em>back.</em></h1><p>Sign in to manage your store.</p><label>Email address<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@example.com"/></label><label>Password<input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Your password"/></label>{error && <p className="form-error">{error}</p>}<button className="primary-btn full" disabled={busy}>{busy ? "SIGNING IN..." : "SIGN IN"}</button><a className="back-link" href="/">← Back to storefront</a></form></main>;
}
