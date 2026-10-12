import Link from "next/link";
import { projectsApi } from "@/lib/api";
import { ProjectStatusBadge } from "@/components/Badge";

export default async function ProjectsPage() {
  const projects = await projectsApi.getAll();
  return <section className="space-y-6"><h1 className="text-3xl font-bold">Projects</h1>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{projects.map(project => <Link key={project.projectId} href={`/projects/${project.projectId}`} className="rounded-xl border border-slate-200 bg-white p-6 hover:border-blue-400">
      <ProjectStatusBadge status={project.status} /><h2 className="mt-3 text-lg font-semibold">{project.projectName}</h2><p className="mt-1 text-sm text-slate-500">{project.departmentName}</p><p className="mt-3 text-sm text-slate-600">{project.description}</p>
    </Link>)}</div>{projects.length === 0 && <p className="text-slate-500">No active projects.</p>}
  </section>;
}
