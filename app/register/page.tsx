"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api";
import { useToast } from "@/components/ToastContext";

export default function RegisterPage() {
  const router = useRouter();
  const { success } = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!fullName.trim()) { setError("Full name is required."); return; }
    if (password.length < 8) { setError("Password must contain at least 8 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setError("");
    setSubmitting(true);
    try {
      await authApi.register(fullName.trim(), email.trim(), password);
      success("Registration successful. Please log in.");
      router.push("/login");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Registration failed.");
      setSubmitting(false);
    }
  }
  return <section className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
    <h1 className="text-2xl font-bold">Register</h1>
    <p className="mt-2 text-slate-500">Create a Staff account to manage your team&apos;s work.</p>
    <form onSubmit={submit} className="mt-6 space-y-4">
      <label className="block text-sm font-medium">Full name
        <input required maxLength={100} autoComplete="name" value={fullName} onChange={e => setFullName(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
      </label>
      <label className="block text-sm font-medium">Email
        <input type="email" required maxLength={255} autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
      </label>
      <label className="block text-sm font-medium">Password
        <input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
      </label>
      <label className="block text-sm font-medium">Confirm password
        <input type="password" required minLength={8} autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
      </label>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <button disabled={submitting} className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50">{submitting ? "Creating account…" : "Register"}</button>
    </form>
    <p className="mt-5 text-sm text-slate-600">Already registered? <Link href="/login" className="font-medium text-blue-600">Login</Link></p>
  </section>;
}
