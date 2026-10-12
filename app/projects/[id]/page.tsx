"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FolderGit2,
  Calendar,
  Building2,
  ArrowLeft,
  CheckSquare,
  AlertCircle,
  PlusCircle,
  Filter,
} from "lucide-react";
import { projectsApi } from "@/lib/api";
import { ProjectDetailDto } from "@/lib/types";
import {
  ProjectStatusBadge,
  TaskStatusBadge,
  TaskPriorityBadge,
  TagPill,
} from "@/components/Badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/components/ToastContext";

export default function ProjectDetailPage() {
  const params = useParams();
  const { error } = useToast();
  const projectId = Number(params.id);

  const [project, setProject] = useState<ProjectDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    if (!Number.isInteger(projectId) || projectId <= 0) {
      setProject(null);
      setLoading(false);
      return;
    }

    async function loadProject() {
      try {
        setLoading(true);
        const data = await projectsApi.getById(projectId);
        setProject(data);
      } catch (err: any) {
        error(err.message || "Failed to load project details.");
      } finally {
        setLoading(false);
      }
    }
    loadProject();
  }, [projectId, error]);

  if (loading) {
    return <LoadingSpinner text="Loading project details..." size="lg" />;
  }

  if (!project) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Project Not Found</h2>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          The requested project could not be found or has been deactivated.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    );
  }

  const filteredTasks = (project.tasks || []).filter((task) => {
    if (taskStatusFilter === "ALL") return true;
    return task.status === Number(taskStatusFilter);
  });

  return (
    <div className="space-y-8">
      {/* Top back navigation */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all projects
        </Link>
      </div>

      {/* Project Overview Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href={`/departments/${project.departmentId}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition"
              >
                <Building2 className="w-3.5 h-3.5" />
                {project.departmentName}
              </Link>
              <ProjectStatusBadge status={project.status} />
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                  project.isActive
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                {project.isActive ? "Active" : "Archived"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {project.projectName}
            </h1>

            <p className="text-slate-600 text-sm max-w-3xl leading-relaxed">
              {project.description || "No description provided."}
            </p>

            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-4 h-4 text-slate-400" />
                Start: <strong className="text-slate-700">{project.startDate}</strong>
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-4 h-4 text-slate-400" />
                End:{" "}
                <strong className="text-slate-700">
                  {project.endDate || "Ongoing"}
                </strong>
              </span>
              <span className="text-slate-400">
                Created: {new Date(project.createdDate).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <Link
              href="/admin/projects"
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition"
            >
              Edit Project
            </Link>
            <Link
              href="/admin/tasks"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm transition"
            >
              <PlusCircle className="w-4 h-4" />
              Add Task
            </Link>
          </div>
        </div>
      </div>

      {/* Task List Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900">
              Project Tasks ({project.tasks?.length || 0})
            </h2>
          </div>

          {/* Bonus: Task Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500">Filter Status:</span>
            <select
              value={taskStatusFilter}
              onChange={(e) => setTaskStatusFilter(e.target.value)}
              className="text-xs font-medium bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">All Tasks ({project.tasks?.length || 0})</option>
              <option value="0">To Do</option>
              <option value="1">In Progress</option>
              <option value="2">Done</option>
              <option value="3">Cancelled</option>
            </select>
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <EmptyState
            title="No Tasks Found"
            description={
              taskStatusFilter !== "ALL"
                ? "No tasks match the selected status filter."
                : "No tasks are currently associated with this project."
            }
            actionText="Create New Task"
            onAction={() => (window.location.href = "/admin/tasks")}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTasks.map((task) => (
              <Link
                key={task.taskId}
                href={`/tasks/${task.taskId}`}
                className="group bg-white rounded-2xl border border-slate-200/80 p-5 hover:border-blue-300 hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-mono text-slate-400">
                      #{task.taskId}
                    </span>
                    <div className="flex items-center gap-2">
                      <TaskStatusBadge status={task.status} />
                      <TaskPriorityBadge priority={task.priority} />
                    </div>
                  </div>

                  <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition text-base">
                    {task.title}
                  </h3>

                  {/* Tags */}
                  {task.tags && task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {task.tags.map((t) => (
                        <TagPill key={t.tagId} tag={t} />
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Due:{" "}
                    <strong className="text-slate-700">
                      {task.dueDate || "No due date"}
                    </strong>
                  </span>
                  <span className="font-semibold text-blue-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Task Details &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
