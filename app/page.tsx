"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  FolderGit2,
  CheckSquare,
  ArrowRight,
  Calendar,
  Layers,
  Sparkles,
  PlusCircle,
} from "lucide-react";
import { departmentsApi, projectsApi, tasksApi } from "@/lib/api";
import { ProjectListItemDto } from "@/lib/types";
import { ProjectStatusBadge } from "@/components/Badge";
import { LoadingSpinner, CardSkeleton } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/components/ToastContext";

export default function HomePage() {
  const { error } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    departmentsCount: number;
    projectsCount: number;
    tasksCount: number;
  } | null>(null);
  const [activeProjects, setActiveProjects] = useState<ProjectListItemDto[]>(
    [],
  );

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [depts, projects, tasks] = await Promise.all([
          departmentsApi.getAll(),
          projectsApi.getAll(),
          tasksApi.getAll(),
        ]);

        setStats({
          departmentsCount: depts.length,
          projectsCount: projects.length,
          tasksCount: tasks.length,
        });
        setActiveProjects(projects);
      } catch (err: any) {
        error(err.message || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [error]);

  return (
    <div className="space-y-10">
      {/* Hero / Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-r from-blue-700 via-indigo-600 to-blue-800 text-white p-8 md:p-12 shadow-xl shadow-blue-900/10">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-blue-100 text-xs font-medium border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>PRN232 Assignment 2 — Task & Team Hub</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Streamline Projects, Departments & Tasks seamlessly
          </h1>
          <p className="text-blue-100 text-base sm:text-lg leading-relaxed max-w-2xl">
            Browse departments, projects and tasks publicly. Sign in to create,
            update and manage your team&apos;s work.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/admin/projects"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold bg-white text-blue-700 hover:bg-blue-50 transition shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              Manage Projects
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold bg-blue-600/60 hover:bg-blue-600 text-white border border-white/20 transition"
            >
              Search Tasks
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-80 h-80 rounded-full bg-white/5 pointer-events-none blur-2xl" />
        <div className="absolute right-20 top-0 -translate-y-12 w-64 h-64 rounded-full bg-indigo-400/10 pointer-events-none blur-xl" />
      </section>

      {/* Summary Counts Section */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Active Departments
              </p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-1">
                {loading ? "-" : (stats?.departmentsCount ?? "—")}
              </h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Organizational Units</span>
            <Link
              href="/departments"
              className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-1"
            >
              View all &rarr;
            </Link>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Active Projects
              </p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-1">
                {loading ? "-" : (stats?.projectsCount ?? "—")}
              </h3>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <FolderGit2 className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Ongoing initiatives</span>
            <Link
              href="/admin/projects"
              className="text-indigo-600 font-semibold hover:underline inline-flex items-center gap-1"
            >
              Manage &rarr;
            </Link>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Active Tasks
              </p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-1">
                {loading ? "-" : (stats?.tasksCount ?? "—")}
              </h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckSquare className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Assigned work items</span>
            <Link
              href="/search"
              className="text-emerald-600 font-semibold hover:underline inline-flex items-center gap-1"
            >
              Explore &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Active Projects Cards Section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-6 h-6 text-blue-600" />
              Active Projects
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Explore ongoing projects and inspect linked tasks and milestones.
            </p>
          </div>
          <Link
            href="/admin/projects"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
          >
            Manage all projects
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <CardSkeleton count={6} />
        ) : activeProjects.length === 0 ? (
          <EmptyState
            title="No Active Projects"
            description="There are currently no active projects recorded in the system. Get started by creating one."
            actionText="Create New Project"
            onAction={() => (window.location.href = "/admin/projects")}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeProjects.map((project) => (
              <Link
                key={project.projectId}
                href={`/projects/${project.projectId}`}
                className="group relative flex flex-col justify-between bg-white rounded-2xl border border-slate-200/80 p-6 hover:shadow-lg hover:border-blue-300 transition duration-200"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      {project.departmentName}
                    </span>
                    <ProjectStatusBadge status={project.status} />
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition line-clamp-1">
                    {project.projectName}
                  </h3>

                  <p className="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                    {project.description ||
                      "No description provided for this project."}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {project.startDate}
                    {project.endDate ? ` → ${project.endDate}` : " (Ongoing)"}
                  </span>
                  <span className="font-semibold text-blue-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Details &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
