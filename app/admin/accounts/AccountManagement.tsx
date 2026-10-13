"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { accountsApi } from "@/lib/api";
import type { AccountDto } from "@/lib/types";
import { Modal } from "@/components/Modal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useToast } from "@/components/ToastContext";

export default function AccountManagement() {
  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AccountDto | null>(null);
  const [deleting, setDeleting] = useState<AccountDto | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState(0);
  const [busy, setBusy] = useState(false);
  const { success, error } = useToast();
  const load = useCallback(async () => {
    try { setAccounts(await accountsApi.getAll()); }
    catch (reason) { error(reason instanceof Error ? reason.message : "Unable to load accounts."); }
    finally { setLoading(false); }
  }, [error]);
  useEffect(() => { void load(); }, [load]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!editing || !name.trim()) { error("Full name is required."); return; }
    setBusy(true);
    try {
      await accountsApi.update(editing.accountId, name.trim(), role);
      setEditing(null);
      success("Account updated. Changing a role signs that account out.");
      await load();
    } catch (reason) { error(reason instanceof Error ? reason.message : "Unable to update account."); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (!deleting) return;
    setBusy(true);
    try {
      await accountsApi.delete(deleting.accountId);
      setDeleting(null);
      success("Account deleted. Its previous sessions remain revoked.",
        { label: "Undo within 24 hours", href: `/admin/deletions?resource=accounts&search=${encodeURIComponent(deleting.fullName)}` });
      await load();
    } catch (reason) { error(reason instanceof Error ? reason.message : "Unable to delete account."); }
    finally { setBusy(false); }
  }
  return <section className="space-y-6">
    <div><h1 className="text-3xl font-bold">Accounts</h1><p className="mt-2 text-slate-500">Only Admins can change accounts. Accounts that created tasks cannot be deleted.</p></div>
    {loading ? <LoadingSpinner /> : <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white"><table className="w-full text-left text-sm">
      <thead className="bg-slate-50 text-slate-500"><tr><th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Role</th><th className="p-4">Actions</th></tr></thead>
      <tbody>{accounts.map(account => <tr key={account.accountId} className="border-t border-slate-100">
        <td className="p-4 font-medium">{account.fullName}</td><td className="p-4">{account.email}</td><td className="p-4">{account.role === 1 ? "Admin" : "Staff"}</td>
        <td className="p-4"><div className="flex gap-2"><button aria-label={`Edit ${account.fullName}`} onClick={() => { setEditing(account); setName(account.fullName); setRole(account.role); }} className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"><Pencil size={18} /></button>
          <button aria-label={`Delete ${account.fullName}`} onClick={() => setDeleting(account)} className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 size={18} /></button></div></td>
      </tr>)}</tbody>
    </table></div>}
    <Modal isOpen={!!editing} onClose={() => { if (!busy) setEditing(null); }} title="Edit account">
      <form onSubmit={save} className="space-y-4">
        <label className="block text-sm font-medium">Full name<input required maxLength={100} value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
        <label className="block text-sm font-medium">Role<select value={role} onChange={e => setRole(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"><option value={0}>Staff</option><option value={1}>Admin</option></select></label>
        <div className="flex justify-end gap-3"><button type="button" disabled={busy} onClick={() => setEditing(null)} className="rounded-lg border px-4 py-2">Cancel</button><button disabled={busy} className="rounded-lg bg-blue-600 px-4 py-2 text-white">{busy ? "Saving…" : "Save"}</button></div>
      </form>
    </Modal>
    <ConfirmDialog isOpen={!!deleting} onClose={() => { if (!busy) setDeleting(null); }} onConfirm={() => { void remove(); }} title="Delete account" message={`Delete ${deleting?.fullName}? Admins can undo this within 24 hours from Deletion history. Old sessions remain revoked. Accounts that created tasks cannot be deleted.`} isLoading={busy} />
  </section>;
}
