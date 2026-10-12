import Link from "next/link";
import { departmentsApi, projectsApi, tasksApi, tagsApi } from "@/lib/api";
import { serverAccount } from "@/lib/server-auth";

export default async function AdminDashboard() {
  const [departments, projects, tasks, tags, account] = await Promise.all([
    departmentsApi.getAll(), projectsApi.getAll(), tasksApi.getAll(), tagsApi.getAll(), serverAccount(),
  ]);
  const cards = [
    { label: "Departments", count: departments.length, href: "/admin/departments" },
    { label: "Projects", count: projects.length, href: "/admin/projects" },
    { label: "Tasks", count: tasks.length, href: "/admin/tasks" },
    { label: "Tags", count: tags.length, href: "/admin/tags" },
  ];
  return <section className="space-y-6">
    <div><h1 className="text-3xl font-bold">Management dashboard</h1><p className="mt-2 text-slate-500">Welcome, {account?.fullName}. Manage your team&apos;s work below.</p></div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(card => <Link key={card.href} href={card.href} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-400">
      <p className="text-sm font-medium text-slate-500">{card.label}</p><p className="mt-3 text-4xl font-bold">{card.count}</p><p className="mt-4 text-sm font-medium text-blue-600">Manage {card.label.toLowerCase()} →</p>
    </Link>)}</div>
    {account?.role === 1 && <Link href="/admin/accounts" className="inline-block rounded-lg bg-blue-600 px-4 py-2 font-medium text-white">Manage accounts</Link>}
  </section>;
}
