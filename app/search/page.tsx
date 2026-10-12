"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search as SearchIcon,
  Filter,
  Calendar,
  FolderGit2,
  Tag as TagIcon,
  CheckSquare,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import { tasksApi, projectsApi, tagsApi } from "@/lib/api";
import {
  TaskListItemDto,
  ProjectListItemDto,
  TaskTagDto,
} from "@/lib/types";
import {
  TaskStatusBadge,
  TaskPriorityBadge,
} from "@/components/Badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/components/ToastContext";

export default function SearchPage() {
  const { error } = useToast();
  const [tasks, setTasks] = useState<TaskListItemDto[]>([]);
  const [projects, setProjects] = useState<ProjectListItemDto[]>([]);
  const [tags, setTags] = useState<TaskTagDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<string>("");
  const [priority, setPriority] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [tagId, setTagId] = useState<string>("");

  // Load projects & tags once
  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const [projList, tagList] = await Promise.all([
          projectsApi.getAll().catch(() => []),
          tagsApi.getAll().catch(() => []),
        ]);
        setProjects(projList);
        setTags(tagList);
      } catch (err: any) {
        console.error("Filter options error", err);
      }
    }
    loadFilterOptions();
  }, []);

  // Ignore responses from searches started before the filters changed.
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await tasksApi.search({
          title: title.trim() || undefined,
          status: status !== "" ? Number(status) : undefined,
          priority: priority !== "" ? Number(priority) : undefined,
          projectId: projectId !== "" ? Number(projectId) : undefined,
          tagId: tagId !== "" ? Number(tagId) : undefined,
        });
        if (active) setTasks(data);
      } catch (err: any) {
        if (active) error(err.message || "Failed to search tasks.");
      } finally {
        if (active) setLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [title, status, priority, projectId, tagId, error]);

  const handleResetFilters = () => {
    setTitle("");
    setStatus("");
    setPriority("");
    setProjectId("");
    setTagId("");
  };

  const hasActiveFilters =
    title || status !== "" || priority !== "" || projectId !== "" || tagId !== "";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
          <SearchIcon className="w-8 h-8 text-blue-600" />
          Filter & Search Tasks
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Dynamic multi-criteria search by title, status, priority, project, and tags. Results update automatically.
        </p>
      </div>

      {/* Filter Panel */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-700">
            <Filter className="w-4 h-4 text-blue-600" />
            Filter Criteria
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Keyword Search */}
          <div className="lg:col-span-1 sm:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Title Keyword
            </label>
            <div className="relative">
              <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Task Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All Statuses</option>
              <option value="0">To Do</option>
              <option value="1">In Progress</option>
              <option value="2">Done</option>
              <option value="3">Cancelled</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All Priorities</option>
              <option value="0">Low</option>
              <option value="1">Medium</option>
              <option value="2">High</option>
              <option value="3">Critical</option>
            </select>
          </div>

          {/* Project */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Project
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.projectId} value={p.projectId}>
                  {p.projectName}
                </option>
              ))}
            </select>
          </div>

          {/* Tag */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Tag
            </label>
            <select
              value={tagId}
              onChange={(e) => setTagId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All Tags</option>
              {tags.map((tg) => (
                <option key={tg.tagId} value={tg.tagId}>
                  {tg.tagName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-600">
            {loading ? "Searching..." : `Found ${tasks.length} matching task(s)`}
          </span>
        </div>

        {loading ? (
          <LoadingSpinner text="Filtering tasks..." />
        ) : tasks.length === 0 ? (
          <EmptyState
            title="No Matching Tasks Found"
            description="Try loosening your search filters or clearing some criteria."
            actionText={hasActiveFilters ? "Reset Filters" : undefined}
            onAction={handleResetFilters}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {tasks.map((task) => (
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
                    <div className="flex items-center gap-1.5">
                      <TaskStatusBadge status={task.status} />
                      <TaskPriorityBadge priority={task.priority} />
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition text-base line-clamp-2">
                    {task.title}
                  </h3>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                    {task.description || "No description."}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2 text-xs text-slate-500">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                      <FolderGit2 className="w-3.5 h-3.5 text-slate-400" />
                      {task.projectName}
                    </span>
                    <span className="font-semibold text-blue-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                      Details &rarr;
                    </span>
                  </div>

                  {task.dueDate && (
                    <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                      <Calendar className="w-3 h-3" />
                      Due: {task.dueDate}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
