"use client";

import { useState } from "react";
import type { AccountDto } from "@/lib/types";
import { authApi } from "@/lib/api";
import { useAuth } from "@/components/AuthContext";
import { useToast } from "@/components/ToastContext";

export default function ProfileForm({ initialAccount }: { initialAccount: AccountDto }) {
  const { updateProfile } = useAuth();
  const { success } = useToast();
  const [fullName, setFullName] = useState(initialAccount.fullName);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [nameError, setNameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const inputClass = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500";

  async function saveName(event: React.FormEvent) {
    event.preventDefault();
    setNameError("");
    if (!fullName.trim()) { setNameError("Full name is required."); return; }
    setBusy(true);
    try {
      await updateProfile(fullName.trim());
      setFullName(fullName.trim());
      success("Profile updated.");
    } catch (reason) { setNameError(reason instanceof Error ? reason.message : "Unable to update profile."); }
    finally { setBusy(false); }
  }
  async function savePassword(event: React.FormEvent) {
    event.preventDefault();
    setPasswordError("");
    if (newPassword !== confirmPassword) { setPasswordError("Passwords do not match."); return; }
    setBusy(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      window.location.assign("/login");
    } catch (reason) { setPasswordError(reason instanceof Error ? reason.message : "Unable to change password."); setBusy(false); }
  }
  return <section className="mx-auto max-w-3xl space-y-6">
    <div><h1 className="text-3xl font-bold">My profile</h1><p className="mt-2 text-slate-500">Update your name or change your password.</p></div>
    <form onSubmit={saveName} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      <h2 className="text-xl font-semibold">Account details</h2>
      <p className="break-all text-sm text-slate-500">{initialAccount.email} · {initialAccount.role === 1 ? "Admin" : "Staff"}</p>
      <label className="block text-sm font-medium">Full name<input required maxLength={100} autoComplete="name" value={fullName} onChange={e => setFullName(e.target.value)} className={inputClass} /></label>
      {nameError && <p role="alert" className="text-sm text-red-600">{nameError}</p>}
      <button disabled={busy} className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50">Save name</button>
    </form>
    <form onSubmit={savePassword} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      <h2 className="text-xl font-semibold">Change password</h2>
      <p className="text-sm text-slate-500">Changing your password signs you out of all sessions. Log in again with the new password.</p>
      <label className="block text-sm font-medium">Current password<input type="password" required maxLength={128} autoComplete="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className={inputClass} /></label>
      <label className="block text-sm font-medium">New password<input type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputClass} /></label>
      <label className="block text-sm font-medium">Confirm new password<input type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputClass} /></label>
      {passwordError && <p role="alert" className="text-sm text-red-600">{passwordError}</p>}
      <button disabled={busy} className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50">Change password</button>
    </form>
  </section>;
}
