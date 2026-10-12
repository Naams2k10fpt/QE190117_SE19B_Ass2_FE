"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";

export default function LoginPage() {
  const { account, loading, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => { if (!loading && account) window.location.replace("/admin"); }, [account, loading]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      window.location.assign("/admin");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Login failed.");
      setSubmitting(false);
    }
  }
  return <section className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xs">
    <h1 className="text-2xl font-bold">Login</h1>
    <p className="mt-2 text-slate-500">Sign in to manage departments, projects, tasks and tags.</p>
    <form onSubmit={submit} className="mt-6 space-y-4">
      <label className="block text-sm font-medium">Email
        <input type="email" required maxLength={255} autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
      </label>
      <label className="block text-sm font-medium">Password
        <input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
      </label>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <button disabled={submitting || loading} className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50">{submitting ? "Signing in…" : "Login"}</button>
    </form>
    <p className="mt-5 text-sm text-slate-600">No account? <Link href="/register" className="font-medium text-blue-600">Register</Link></p>
  </section>;
}
