"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  FolderGit2,
  Plus,
  Pencil,
  Trash2,
  Search,
  Filter,
  ExternalLink,
  Loader2,
  Calendar,
  Building2,
} from "lucide-react";
import { projectsApi, departmentsApi } from "@/lib/api";
import {
  ProjectListItemDto,
  DepartmentListItemDto,
  CreateProjectDto,
  UpdateProjectDto,
} from "@/lib/types";
import { ProjectStatusBadge } from "@/components/Badge";
import { Modal } from "@/components/Modal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";
import { useToast } from "@/components/ToastContext";

const PAGE_SIZE = 10;

export default function ProjectManagePage() {
  const { success, error } = useToast();
  const [projects, setProjects] = useState<ProjectListItemDto[]>([]);
  const [departments, setDepartments] = useState<DepartmentListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [nameFilter, setNameFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [deptFilter, setDeptFilter] = useState<string>("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null,
  );

  // Form states
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<number>(0);
  const [departmentId, setDepartmentId] = useState<number | "">("");
  const [isActive, setIsActive] = useState(true);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<ProjectListItemDto | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [projList, deptList] = await Promise.all([
        projectsApi.getAll(),
        departmentsApi.getAll().catch(() => []),
      ]);
      setProjects(projList);
      setDepartments(deptList);
    } catch (err: any) {
      error(err.message || "Failed to load project data.");
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
      const data = await projectsApi.search({
        name: nameFilter || undefined,
        status: statusFilter !== "" ? Number(statusFilter) : undefined,
        departmentId: deptFilter !== "" ? Number(deptFilter) : undefined,
      });
      setProjects(data);
    } catch (err: any) {
      error(err.message || "Failed to filter projects.");
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setNameFilter("");
    setStatusFilter("");
    setDeptFilter("");
    setCurrentPage(1);
    loadData();
  };

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedProjectId(null);
    setProjectName("");
    setDescription("");
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate("");
    setStatus(0);
    setDepartmentId(departments.length > 0 ? departments[0].departmentId : "");
    setIsActive(true);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (proj: ProjectListItemDto) => {
    setModalMode("edit");
    setSelectedProjectId(proj.projectId);
    setProjectName(proj.projectName);
    setDescription(proj.description || "");
    setStartDate(proj.startDate);
    setEndDate(proj.endDate || "");
    setStatus(proj.status);
    setDepartmentId(proj.departmentId);
    setIsActive(true);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!projectName.trim()) {
      errors.projectName = "Project name is required.";
    } else if (projectName.trim().length > 200) {
      errors.projectName = "Project name must not exceed 200 characters.";
    }

    if (!startDate) {
      errors.startDate = "Start date is required.";
    }

    if (startDate && endDate && endDate < startDate) {
      errors.endDate = "End date cannot be earlier than start date.";
    }

    if (departmentId === "" || Number(departmentId) <= 0) {
      errors.departmentId = "Department selection is required.";
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
        const payload: CreateProjectDto = {
          projectName: projectName.trim(),
          description: description.trim() || null,
          startDate,
          endDate: endDate || null,
          status,
          departmentId: Number(departmentId),
        };
        await projectsApi.create(payload);
        success("Project created successfully!");
      } else if (modalMode === "edit" && selectedProjectId !== null) {
        const payload: UpdateProjectDto = {
          projectName: projectName.trim(),
          description: description.trim() || null,
          startDate,
          endDate: endDate || null,
          status,
          departmentId: Number(departmentId),
          isActive,
        };
        await projectsApi.update(selectedProjectId, payload);
        success("Project updated successfully!");
      }
      setIsModalOpen(false);
      await handleFilterSearch();
    } catch (err: any) {
      error(err.message || "Failed to save project.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      await projectsApi.delete(deleteTarget.projectId);
      success(`Project "${deleteTarget.projectName}" deleted successfully.`);
      setDeleteTarget(null);
      await handleFilterSearch();
    } catch (err: any) {
      error(err.message || "Failed to delete project.");
    } finally {
      setIsDeleting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(projects.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const pagedProjects = projects.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  useEffect(() => {
    setCurrentPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
            <FolderGit2 className="w-8 h-8 text-blue-600" />
            Project Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Maintain projects, link departments, update schedules, or remove
            completed work.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Add Project
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-center">
        <div>
          <input
            type="text"
            placeholder="Search by project name..."
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
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
            <option value="0">Not Started</option>
            <option value="1">In Progress</option>
            <option value="2">Completed</option>
            <option value="3">On Hold</option>
          </select>
        </div>

        <div>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.departmentId} value={d.departmentId}>
                {d.departmentName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleFilterSearch}
            className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-medium transition"
          >
            Apply Filter
          </button>
          {(nameFilter || statusFilter !== "" || deptFilter !== "") && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-slate-500 hover:text-slate-800 text-sm font-medium transition"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Loading projects..." />
        ) : projects.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No Projects Found"
              description="No projects match the current filter criteria."
              actionText="Add New Project"
              onAction={openCreateModal}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="py-3.5 px-6">ID</th>
                  <th className="py-3.5 px-6">Project Name</th>
                  <th className="py-3.5 px-6">Department</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Timeline</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagedProjects.map((proj) => (
                  <tr
                    key={proj.projectId}
                    className="hover:bg-slate-50/80 transition"
                  >
                    <td className="py-4 px-6 font-mono text-xs text-slate-400">
                      #{proj.projectId}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      <Link
                        href={`/projects/${proj.projectId}`}
                        className="hover:text-blue-600 transition inline-flex items-center gap-1.5"
                      >
                        {proj.projectName}
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </Link>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {proj.departmentName}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <ProjectStatusBadge status={proj.status} />
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500">
                      <span>{proj.startDate}</span>
                      {proj.endDate && <span> → {proj.endDate}</span>}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(proj)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-medium transition"
                      >
                        <Pencil className="w-3.5 h-3.5 text-slate-500" />
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(proj)}
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
            totalItems={projects.length}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === "create" ? "Create New Project" : "Edit Project"}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Project Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Website Revamp 2026"
              maxLength={200}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none transition ${
                formErrors.projectName
                  ? "border-rose-300 bg-rose-50/30 focus:border-rose-500"
                  : "border-slate-200 focus:border-blue-500"
              }`}
            />
            {formErrors.projectName && (
              <p className="text-xs text-rose-600 mt-1">
                {formErrors.projectName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Department <span className="text-rose-500">*</span>
            </label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(Number(e.target.value))}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none transition ${
                formErrors.departmentId
                  ? "border-rose-300 bg-rose-50/30 focus:border-rose-500"
                  : "border-slate-200 focus:border-blue-500"
              }`}
            >
              <option value="">Select a department...</option>
              {departments.map((d) => (
                <option key={d.departmentId} value={d.departmentId}>
                  {d.departmentName}
                </option>
              ))}
            </select>
            {formErrors.departmentId && (
              <p className="text-xs text-rose-600 mt-1">
                {formErrors.departmentId}
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
              placeholder="Project goals, objectives, and deliverables..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Start Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none transition ${
                  formErrors.startDate
                    ? "border-rose-300 bg-rose-50/30 focus:border-rose-500"
                    : "border-slate-200 focus:border-blue-500"
                }`}
              />
              {formErrors.startDate && (
                <p className="text-xs text-rose-600 mt-1">
                  {formErrors.startDate}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none transition ${
                  formErrors.endDate
                    ? "border-rose-300 bg-rose-50/30 focus:border-rose-500"
                    : "border-slate-200 focus:border-blue-500"
                }`}
              />
              {formErrors.endDate && (
                <p className="text-xs text-rose-600 mt-1">
                  {formErrors.endDate}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Status <span className="text-rose-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value={0}>0 — Not Started</option>
              <option value={1}>1 — In Progress</option>
              <option value={2}>2 — Completed</option>
              <option value={3}>3 — On Hold</option>
            </select>
          </div>

          {modalMode === "edit" && (
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isActiveProj"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="isActiveProj"
                className="text-sm font-medium text-slate-700"
              >
                Project is Active
              </label>
            </div>
          )}

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
              {modalMode === "create" ? "Create Project" : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Project"
        message={`Are you sure you want to delete the project "${deleteTarget?.projectName}"? Note: If any tasks are linked to this project, deletion will be rejected.`}
        confirmText="Confirm Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
