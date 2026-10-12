"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckSquare,
  Plus,
  Pencil,
  Trash2,
  Search,
  ExternalLink,
  Loader2,
  Calendar,
  FolderGit2,
  Tag as TagIcon,
  X,
} from "lucide-react";
import { tasksApi, projectsApi, tagsApi } from "@/lib/api";
import {
  TaskListItemDto,
  ProjectListItemDto,
  TaskTagDto,
  CreateTaskDto,
  UpdateTaskDto,
} from "@/lib/types";
import {
  TaskStatusBadge,
  TaskPriorityBadge,
  TagPill,
} from "@/components/Badge";
import { Modal } from "@/components/Modal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";
import { useToast } from "@/components/ToastContext";

const PAGE_SIZE = 10;

export default function TaskManagePage() {
  const { success, error } = useToast();
  const [tasks, setTasks] = useState<TaskListItemDto[]>([]);
  const [projects, setProjects] = useState<ProjectListItemDto[]>([]);
  const [tags, setTags] = useState<TaskTagDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter toolbar
  const [titleFilter, setTitleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [projectFilter, setProjectFilter] = useState<string>("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<number>(0);
  const [priority, setPriority] = useState<number>(1);
  const [dueDate, setDueDate] = useState("");
  const [projectId, setProjectId] = useState<number | "">("");
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<TaskListItemDto | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [taskList, projList, tagList] = await Promise.all([
        tasksApi.getAll(),
        projectsApi.getAll().catch(() => []),
        tagsApi.getAll().catch(() => []),
      ]);
      setTasks(taskList);
      setProjects(projList);
      setTags(tagList);
    } catch (err: any) {
      error(err.message || "Failed to load tasks data.");
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterSearch = async () => {
    try {
      setLoading(true);
      setCurrentPage(1);
      const data = await tasksApi.search({
        title: titleFilter || undefined,
        status: statusFilter !== "" ? Number(statusFilter) : undefined,
        priority: priorityFilter !== "" ? Number(priorityFilter) : undefined,
        projectId: projectFilter !== "" ? Number(projectFilter) : undefined,
      });
      setTasks(data);
    } catch (err: any) {
      error(err.message || "Failed to filter tasks.");
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setTitleFilter("");
    setStatusFilter("");
    setPriorityFilter("");
    setProjectFilter("");
    setCurrentPage(1);
    loadData();
  };

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedTaskId(null);
    setTitle("");
    setDescription("");
    setStatus(0);
    setPriority(1);
    setDueDate("");
    setProjectId(projects.length > 0 ? projects[0].projectId : "");
    setSelectedTagIds([]);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = async (t: TaskListItemDto) => {
    try {
      setModalMode("edit");
      setSelectedTaskId(t.taskId);
      setTitle(t.title);
      setDescription(t.description || "");
      setStatus(t.status);
      setPriority(t.priority);
      setDueDate(t.dueDate || "");
      setProjectId(t.projectId);
      setFormErrors({});

      // Fetch task detail to get its current tag IDs
      const detail = await tasksApi.getById(t.taskId);
      setSelectedTagIds(detail.tags ? detail.tags.map((tg) => tg.tagId) : []);
      setIsModalOpen(true);
    } catch (err: any) {
      error(err.message || "Failed to load task details for editing.");
    }
  };

  const toggleTagSelection = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!title.trim()) {
      errors.title = "Task title is required.";
    } else if (title.trim().length > 300) {
      errors.title = "Title must not exceed 300 characters.";
    }

    if (projectId === "" || Number(projectId) <= 0) {
      errors.projectId = "Project selection is required.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      if (modalMode === "create") {
        const payload: CreateTaskDto = {
          title: title.trim(),
          description: description.trim() || null,
          status,
          priority,
          dueDate: dueDate || null,
          projectId: Number(projectId),
          tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
        };
        await tasksApi.create(payload);
        success("Task created successfully!");
      } else if (modalMode === "edit" && selectedTaskId !== null) {
        const payload: UpdateTaskDto = {
          title: title.trim(),
          description: description.trim() || null,
          status,
          priority,
          dueDate: dueDate || null,
          projectId: Number(projectId),
          tagIds: selectedTagIds,
        };
        await tasksApi.update(selectedTaskId, payload);
        success("Task updated successfully!");
      }
      setIsModalOpen(false);
      await handleFilterSearch();
    } catch (err: any) {
      error(err.message || "Failed to save task.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      await tasksApi.delete(deleteTarget.taskId);
      success(`Task "${deleteTarget.title}" soft-deleted successfully.`);
      setDeleteTarget(null);
      await handleFilterSearch();
    } catch (err: any) {
      error(err.message || "Failed to delete task.");
    } finally {
      setIsDeleting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(tasks.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const pagedTasks = tasks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setCurrentPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
            <CheckSquare className="w-8 h-8 text-blue-600" />
            Task Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Create, edit, attach tags, and soft-delete tasks across all
            projects.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-center">
        <div>
          <input
            type="text"
            placeholder="Search by title..."
            value={titleFilter}
            onChange={(e) => setTitleFilter(e.target.value)}
            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Statuses</option>
            <option value="0">To Do</option>
            <option value="1">In Progress</option>
            <option value="2">Done</option>
            <option value="3">Cancelled</option>
          </select>
        </div>

        <div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Priorities</option>
            <option value="0">Low</option>
            <option value="1">Medium</option>
            <option value="2">High</option>
            <option value="3">Critical</option>
          </select>
        </div>

        <div>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.projectId} value={p.projectId}>
                {p.projectName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleFilterSearch}
            className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-medium transition"
          >
            Search
          </button>
          {(titleFilter ||
            statusFilter !== "" ||
            priorityFilter !== "" ||
            projectFilter !== "") && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-slate-500 hover:text-slate-800 text-sm font-medium transition"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Loading tasks..." />
        ) : tasks.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No Tasks Found"
              description="No tasks match your current filter or no tasks exist."
              actionText="Add New Task"
              onAction={openCreateModal}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="py-3.5 px-6">ID</th>
                  <th className="py-3.5 px-6">Title</th>
                  <th className="py-3.5 px-6">Project</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Priority</th>
                  <th className="py-3.5 px-6">Due Date</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagedTasks.map((task) => (
                  <tr
                    key={task.taskId}
                    className="hover:bg-slate-50/80 transition"
                  >
                    <td className="py-4 px-6 font-mono text-xs text-slate-400">
                      #{task.taskId}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-900 max-w-xs truncate">
                      <Link
                        href={`/tasks/${task.taskId}`}
                        className="hover:text-blue-600 transition inline-flex items-center gap-1.5"
                      >
                        {task.title}
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </Link>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-700">
                      <Link
                        href={`/projects/${task.projectId}`}
                        className="hover:underline flex items-center gap-1"
                      >
                        <FolderGit2 className="w-3.5 h-3.5 text-slate-400" />
                        {task.projectName}
                      </Link>
                    </td>
                    <td className="py-4 px-6">
                      <TaskStatusBadge status={task.status} />
                    </td>
                    <td className="py-4 px-6">
                      <TaskPriorityBadge priority={task.priority} />
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500">
                      {task.dueDate || "-"}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(task)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-medium transition"
                      >
                        <Pencil className="w-3.5 h-3.5 text-slate-500" />
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(task)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 text-xs font-medium transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && (
          <Pagination
            currentPage={page}
            pageSize={PAGE_SIZE}
            totalItems={tasks.length}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Create / Edit Modal with Tag Multi-select */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === "create" ? "Create New Task" : "Edit Task"}
        maxWidth="xl"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement authentication middleware"
              maxLength={300}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none transition ${
                formErrors.title
                  ? "border-rose-300 bg-rose-50/30 focus:border-rose-500"
                  : "border-slate-200 focus:border-blue-500"
              }`}
            />
            {formErrors.title && (
              <p className="text-xs text-rose-600 mt-1">{formErrors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Project <span className="text-rose-500">*</span>
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(Number(e.target.value))}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none transition ${
                formErrors.projectId
                  ? "border-rose-300 bg-rose-50/30 focus:border-rose-500"
                  : "border-slate-200 focus:border-blue-500"
              }`}
            >
              <option value="">Select a project...</option>
              {projects.map((p) => (
                <option key={p.projectId} value={p.projectId}>
                  {p.projectName}
                </option>
              ))}
            </select>
            {formErrors.projectId && (
              <p className="text-xs text-rose-600 mt-1">
                {formErrors.projectId}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed acceptance criteria and technical notes..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Status <span className="text-rose-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value={0}>0 — To Do</option>
                <option value={1}>1 — In Progress</option>
                <option value={2}>2 — Done</option>
                <option value={3}>3 — Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Priority <span className="text-rose-500">*</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value={0}>0 — Low</option>
                <option value={1}>1 — Medium</option>
                <option value={2}>2 — High</option>
                <option value={3}>3 — Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Tags Multi-select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <TagIcon className="w-3.5 h-3.5" />
                Select Tags (Multi-select)
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                Click to toggle
              </span>
            </label>
            {tags.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                No tags created yet. Add tags in Tag Management.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80 max-h-36 overflow-y-auto">
                {tags.map((tg) => {
                  const isSelected = selectedTagIds.includes(tg.tagId);
                  const color = tg.color || "#64748b";
                  return (
                    <button
                      type="button"
                      key={tg.tagId}
                      onClick={() => toggleTagSelection(tg.tagId)}
                      style={{
                        backgroundColor: isSelected ? `${color}25` : "white",
                        borderColor: isSelected ? color : "#e2e8f0",
                        color: isSelected ? color : "#475569",
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition transform ${
                        isSelected
                          ? "scale-105 font-bold shadow-sm"
                          : "hover:border-slate-300"
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span>{tg.tagName}</span>
                      {isSelected && <span className="ml-1 text-xs">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm transition disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {modalMode === "create" ? "Create Task" : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Soft Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Soft-Delete Task"
        message={`Are you sure you want to soft-delete the task "${deleteTarget?.title}"? Its status will be marked inactive.`}
        confirmText="Confirm Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
