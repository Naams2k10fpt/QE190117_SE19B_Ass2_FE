"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  Search,
  ExternalLink,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { departmentsApi } from "@/lib/api";
import {
  DepartmentListItemDto,
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from "@/lib/types";
import { Modal } from "@/components/Modal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";
import { useToast } from "@/components/ToastContext";

const PAGE_SIZE = 10;

export default function DepartmentManagePage() {
  const { success, error } = useToast();
  const [departments, setDepartments] = useState<DepartmentListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete dialog states
  const [deleteTarget, setDeleteTarget] =
    useState<DepartmentListItemDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadDepartments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await departmentsApi.getAll();
      setDepartments(data);
    } catch (err: any) {
      error(err.message || "Failed to load departments.");
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedDeptId(null);
    setName("");
    setDescription("");
    setIsActive(true);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (dept: DepartmentListItemDto) => {
    setModalMode("edit");
    setSelectedDeptId(dept.departmentId);
    setName(dept.departmentName);
    setDescription(dept.departmentDescription);
    setIsActive(true);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!name.trim()) {
      errors.name = "Department name is required.";
    } else if (name.trim().length > 100) {
      errors.name = "Department name must not exceed 100 characters.";
    }

    if (!description.trim()) {
      errors.description = "Department description is required.";
    } else if (description.trim().length > 300) {
      errors.description =
        "Department description must not exceed 300 characters.";
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
        const payload: CreateDepartmentDto = {
          departmentName: name.trim(),
          departmentDescription: description.trim(),
        };
        await departmentsApi.create(payload);
        success("Department created successfully!");
      } else if (modalMode === "edit" && selectedDeptId !== null) {
        const payload: UpdateDepartmentDto = {
          departmentName: name.trim(),
          departmentDescription: description.trim(),
          isActive: isActive,
        };
        await departmentsApi.update(selectedDeptId, payload);
        success("Department updated successfully!");
      }
      setIsModalOpen(false);
      await loadDepartments();
    } catch (err: any) {
      error(err.message || "Operation failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      await departmentsApi.delete(deleteTarget.departmentId);
      success(
        `Department "${deleteTarget.departmentName}" deleted successfully.`,
      );
      setDeleteTarget(null);
      await loadDepartments();
    } catch (err: any) {
      error(err.message || "Failed to delete department.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredDepartments = departments.filter(
    (d) =>
      d.departmentName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      d.departmentDescription
        .toLowerCase()
        .includes(searchFilter.toLowerCase()),
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredDepartments.length / PAGE_SIZE),
  );
  const page = Math.min(currentPage, totalPages);
  const pagedDepartments = filteredDepartments.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  useEffect(() => {
    setCurrentPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-600" />
            Department Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Create, view, update, or remove departments. Deletion requires that
            no linked projects exist.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Add Department
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Filter by department name or description..."
          value={searchFilter}
          onChange={(e) => {
            setSearchFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full text-sm bg-transparent border-none focus:outline-none placeholder-slate-400"
        />
        {searchFilter && (
          <button
            onClick={() => {
              setSearchFilter("");
              setCurrentPage(1);
            }}
            className="text-xs text-slate-400 hover:text-slate-600 font-medium px-2 py-1"
          >
            Clear
          </button>
        )}
      </div>

      {/* Departments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Loading departments..." />
        ) : filteredDepartments.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No Departments Found"
              description={
                searchFilter
                  ? `No department matches "${searchFilter}".`
                  : "No departments currently exist."
              }
              actionText="Add New Department"
              onAction={openCreateModal}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="py-3.5 px-6">ID</th>
                  <th className="py-3.5 px-6">Department Name</th>
                  <th className="py-3.5 px-6">Description</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagedDepartments.map((dept) => (
                  <tr
                    key={dept.departmentId}
                    className="hover:bg-slate-50/80 transition"
                  >
                    <td className="py-4 px-6 font-mono text-xs text-slate-400">
                      #{dept.departmentId}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      <Link
                        href={`/departments/${dept.departmentId}`}
                        className="hover:text-blue-600 transition inline-flex items-center gap-1.5"
                      >
                        {dept.departmentName}
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </Link>
                    </td>
                    <td className="py-4 px-6 text-slate-600 max-w-md truncate">
                      {dept.departmentDescription}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(dept)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-medium transition"
                      >
                        <Pencil className="w-3.5 h-3.5 text-slate-500" />
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(dept)}
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
            totalItems={filteredDepartments.length}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          modalMode === "create" ? "Create New Department" : "Edit Department"
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Department Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Engineering, Human Resources"
              maxLength={100}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none transition ${
                formErrors.name
                  ? "border-rose-300 bg-rose-50/30 focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                  : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              }`}
            />
            {formErrors.name && (
              <p className="text-xs text-rose-600 mt-1">{formErrors.name}</p>
            )}
            <p className="text-[11px] text-slate-400 mt-1">
              Maximum 100 characters.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Department Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the department's core responsibilities..."
              maxLength={300}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none transition ${
                formErrors.description
                  ? "border-rose-300 bg-rose-50/30 focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                  : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              }`}
            />
            {formErrors.description && (
              <p className="text-xs text-rose-600 mt-1">
                {formErrors.description}
              </p>
            )}
            <p className="text-[11px] text-slate-400 mt-1">
              Maximum 300 characters.
            </p>
          </div>

          {modalMode === "edit" && (
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isActiveDept"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="isActiveDept"
                className="text-sm font-medium text-slate-700"
              >
                Department is Active
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
              {modalMode === "create" ? "Create Department" : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Department"
        message={`Are you sure you want to permanently delete the department "${deleteTarget?.departmentName}"? Note: If any projects are currently linked to this department, deletion will be rejected.`}
        confirmText="Confirm Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
