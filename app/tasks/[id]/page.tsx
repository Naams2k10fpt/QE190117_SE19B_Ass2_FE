"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  CheckSquare,
  Calendar,
  FolderGit2,
  Clock,
  ArrowLeft,
  AlertCircle,
  Tag as TagIcon,
  CheckCircle2,
  Pencil,
} from "lucide-react";
import { tasksApi } from "@/lib/api";
import { TaskDetailDto } from "@/lib/types";
import {
  TaskStatusBadge,
  TaskPriorityBadge,
  TagPill,
} from "@/components/Badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useToast } from "@/components/ToastContext";

export default function TaskDetailPage() {
  const params = useParams();
  const { error } = useToast();
  const taskId = Number(params.id);

  const [task, setTask] = useState<TaskDetailDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!Number.isInteger(taskId) || taskId <= 0) {
      setTask(null);
      setLoading(false);
      return;
    }

    async function loadTask() {
      try {
        setLoading(true);
        const data = await tasksApi.getById(taskId);
        setTask(data);
      } catch (err: any) {
        error(err.message || "Failed to load task details.");
      } finally {
        setLoading(false);
      }
    }
    loadTask();
  }, [taskId, error]);

  if (loading) {
    return <LoadingSpinner text="Loading task details..." size="lg" />;
  }

  if (!task) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Task Not Found</h2>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          The requested task could not be found or has been deactivated.
        </p>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Search
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Back button */}
      <div>
        <Link
          href={`/projects/${task.projectId}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Project: {task.projectName}
        </Link>
      </div>

      {/* Main Task Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs space-y-6">
        {/* Top Badges & Meta */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-mono font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-sm">
              TASK #{task.taskId}
            </span>
            <TaskStatusBadge status={task.status} />
            <TaskPriorityBadge priority={task.priority} />
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                task.isActive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}
            >
              {task.isActive ? "Active" : "Soft Deleted"}
            </span>
          </div>

          <Link
            href="/admin/tasks"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 transition"
          >
            <Pencil className="w-3.5 h-3.5 text-slate-500" />
            Manage Tasks
          </Link>
        </div>

        {/* Task Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
          {task.title}
        </h1>

        {/* Project Link */}
        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <FolderGit2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="text-xs text-slate-500">Project:</span>
          <Link
            href={`/projects/${task.projectId}`}
            className="text-sm font-semibold text-blue-600 hover:underline"
          >
            {task.projectName}
          </Link>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Description
          </h3>
          <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
            {task.description || "No detailed description provided for this task."}
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <TagIcon className="w-3.5 h-3.5" />
            Attached Tags ({task.tags?.length || 0})
          </h3>
          {!task.tags || task.tags.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No tags attached.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {task.tags.map((t) => (
                <TagPill key={t.tagId} tag={t} />
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-500">
          <div><p className="uppercase font-semibold">Created by</p><p className="mt-1 text-slate-800">{task.createdById ? `Account #${task.createdById}` : "Not recorded"}</p></div>
          <div><p className="uppercase font-semibold">Updated by</p><p className="mt-1 text-slate-800">{task.updatedById ? `Account #${task.updatedById}` : "Not recorded"}</p></div>
        </div>
        {/* Dates & Timestamps */}
        <div className="pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-[10px] uppercase font-semibold text-slate-400">Due Date</p>
              <p className="text-slate-800 font-semibold mt-0.5">
                {task.dueDate || "None specified"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-[10px] uppercase font-semibold text-slate-400">Created At</p>
              <p className="text-slate-800 font-semibold mt-0.5">
                {new Date(task.createdDate).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-[10px] uppercase font-semibold text-slate-400">Modified At</p>
              <p className="text-slate-800 font-semibold mt-0.5">
                {task.modifiedDate
                  ? new Date(task.modifiedDate).toLocaleString()
                  : "Not modified yet"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
