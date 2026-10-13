"use client";

import { useEffect, useState } from "react";
import { History, RotateCcw } from "lucide-react";
import { deletionsApi, type DeletionItem, type DeletionPage } from "@/lib/api";
import { useToast } from "@/components/ToastContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Pagination } from "@/components/Pagination";
import { ConfirmDialog } from "@/components/ConfirmDialog";

const labels: Record<string, string> = { departments: "Departments", projects: "Projects", tasks: "Tasks", tags: "Tags", accounts: "Accounts" };
const date = (value: string) => new Date(value).toLocaleString();

export default function DeletionHistory({ isAdmin, initialResource, initialSearch }: { isAdmin: boolean; initialResource: string; initialSearch: string }) {
  const { error, success } = useToast();
  const [resource, setResource] = useState(initialResource);
  const [state, setState] = useState("all");
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<DeletionPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [selected, setSelected] = useState<DeletionItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(0);
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    let active = true;
    setLoading(true);
    const timer = setTimeout(() => {
      deletionsApi.getPage(resource, state, search, page).then(result => {
        if (!active) return;
        setData(result); setOffset(Date.parse(result.serverTime) - Date.now());
        const lastPage = Math.max(1, Math.ceil(result.totalItems / result.pageSize));
        if (page > lastPage) setPage(lastPage);
      }).catch(reason => { if (active) { setData(null); error(reason instanceof Error ? reason.message : "Unable to load deletion history."); } })
        .finally(() => { if (active) setLoading(false); });
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [resource, state, search, page, reload, error]);
  const available = (item: DeletionItem) => item.canRestore && !item.restoredAt && now + offset < Date.parse(item.undoUntil);
  async function restore() {
    if (!selected || busy) return;
    setBusy(true);
    try { await deletionsApi.restore(selected.deletionId); success("Restored successfully."); setSelected(null); }
    catch (reason) { error(reason instanceof Error ? reason.message : "Unable to restore this deletion."); setSelected(null); }
    finally { setBusy(false); setReload(value => value + 1); }
  }
  return <section className="space-y-6">
    <div><h1 className="flex items-center gap-3 text-3xl font-bold"><History />Deletion history</h1>
      <p className="mt-2 text-slate-500">Undo a deletion within 24 hours. Expired and restored entries remain visible. {isAdmin ? "Account restoration is available to Admins only." : "Account history is available to Admins only."}</p>
      <p className="mt-1 text-sm text-slate-500">Linked-record restrictions still apply. Restore required parents first. History starts when this feature is enabled.</p></div>
    <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <label className="text-sm font-medium">Resource<select value={resource} disabled={busy} onChange={e => { setResource(e.target.value); setPage(1); }} className="ml-2 rounded-lg border p-2"><option value="">All resources</option>{Object.entries(labels).filter(([key]) => isAdmin || key !== "accounts").map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label className="text-sm font-medium">Status<select value={state} disabled={busy} onChange={e => { setState(e.target.value); setPage(1); }} className="ml-2 rounded-lg border p-2"><option value="all">All statuses</option><option value="available">Available to undo</option><option value="expired">Expired</option><option value="restored">Restored</option></select></label>
      <label className="w-full min-w-[200px] flex-none text-sm font-medium sm:w-auto sm:flex-1">Name<input maxLength={300} value={search} disabled={busy} onChange={e => { setSearch(e.target.value); setPage(1); }} className="mt-1 w-full rounded-lg border p-2" /></label>
      <button disabled={loading || busy} onClick={() => setReload(value => value + 1)} className="self-end rounded-lg border px-4 py-2 disabled:opacity-50">Refresh</button>
    </div>
    {loading ? <LoadingSpinner /> : data && <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {data.items.length ? <div className="overflow-x-auto"><table className="w-full min-w-[1040px] text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr>{["Record", "Deleted by", "Deleted at", "Undo deadline", "Status", "Action"].map(label => <th key={label} className="p-4 whitespace-nowrap">{label}</th>)}</tr></thead>
        <tbody>{data.items.map(item => <tr key={item.deletionId} className="border-t border-slate-100">
          <td className="min-w-[200px] max-w-xs p-4"><p className="font-medium wrap-anywhere">{item.entityName}</p><p className="mt-1 text-slate-500">{labels[item.entityType]} #{item.entityId}</p></td>
          <td className="p-4 whitespace-nowrap">Account #{item.deletedById}</td><td className="p-4 whitespace-nowrap">{date(item.deletedAt)}</td><td className="p-4 whitespace-nowrap">{date(item.undoUntil)}</td>
          <td className="p-4">{item.restoredAt ? <>Restored<p className="mt-1 text-xs text-slate-500">{date(item.restoredAt)} · Account #{item.restoredById}</p></> : available(item) ? "Available" : "Expired"}</td>
          <td className="p-4"><button aria-label={`Undo deletion of ${item.entityName}`} disabled={!available(item) || busy} onClick={() => setSelected(item)} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 font-medium text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"><RotateCcw size={16} />Undo</button></td>
        </tr>)}</tbody></table></div> : <p className="p-8 text-center text-slate-500">No deletion history matches these filters.</p>}
      <Pagination currentPage={page} pageSize={20} totalItems={data.totalItems} onPageChange={setPage} />
    </div>}
    <ConfirmDialog isOpen={!!selected} onClose={() => { if (!busy) setSelected(null); }} onConfirm={() => { void restore(); }} title="Undo deletion" confirmText="Restore" isDanger={false} isLoading={busy}
      message={`Restore "${selected?.entityName}" with its original ID? ${selected?.entityType === "accounts" ? "The account keeps its previous role and password, but its old sessions stay revoked." : "The server checks the 24-hour deadline and linked records."}`} />
  </section>;
}
