"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Tag as TagIcon,
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  Palette,
} from "lucide-react";
import { tagsApi } from "@/lib/api";
import { TaskTagDto, CreateTagDto } from "@/lib/types";
import { TagPill } from "@/components/Badge";
import { Modal } from "@/components/Modal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";
import { useToast } from "@/components/ToastContext";

const PAGE_SIZE = 10;

const PRESET_COLORS = [
  "#2563eb", // Blue
  "#7c3aed", // Violet
  "#db2777", // Pink
  "#dc2626", // Red
  "#ea580c", // Orange
  "#d97706", // Amber
  "#059669", // Emerald
  "#0891b2", // Cyan
  "#475569", // Slate
  "#1e293b", // Dark Slate
];

export default function TagManagePage() {
  const { success, error } = useToast();
  const [tags, setTags] = useState<TaskTagDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);

  // Form states
  const [tagName, setTagName] = useState("");
  const [color, setColor] = useState("#2563eb");
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<TaskTagDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadTags = useCallback(async () => {
    try {
      setLoading(true);
      const data = await tagsApi.getAll();
      setTags(data);
    } catch (err: any) {
      error(err.message || "Failed to load tags.");
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedTagId(null);
    setTagName("");
    setColor("#2563eb");
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (tg: TaskTagDto) => {
    setModalMode("edit");
    setSelectedTagId(tg.tagId);
    setTagName(tg.tagName);
    setColor(tg.color || "#2563eb");
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!tagName.trim()) {
      errors.tagName = "Tag name is required.";
    } else if (tagName.trim().length > 50) {
      errors.tagName = "Tag name must not exceed 50 characters.";
    }

    if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      errors.color = "Color must be a valid 6-character hex code (#RRGGBB).";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const payload: CreateTagDto = {
        tagName: tagName.trim(),
        color: color ? color.toUpperCase() : null,
      };

      if (modalMode === "create") {
        await tagsApi.create(payload);
        success("Tag created successfully!");
      } else if (modalMode === "edit" && selectedTagId !== null) {
        await tagsApi.update(selectedTagId, payload);
        success("Tag updated successfully!");
      }

      setIsModalOpen(false);
      await loadTags();
    } catch (err: any) {
      error(err.message || "Failed to save tag.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      await tagsApi.delete(deleteTarget.tagId);
      success(`Tag "${deleteTarget.tagName}" deleted successfully.`);
      setDeleteTarget(null);
      await loadTags();
    } catch (err: any) {
      error(err.message || "Failed to delete tag.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredTags = tags.filter((tg) =>
    tg.tagName.toLowerCase().includes(searchFilter.toLowerCase()),
  );
  const totalPages = Math.max(1, Math.ceil(filteredTags.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const pagedTags = filteredTags.slice(
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
            <TagIcon className="w-8 h-8 text-blue-600" />
            Tag Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Define labels and custom hex colors for categorization across
            project tasks.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Add Tag
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Filter tags by name..."
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

      {/* Tags Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Loading tags..." />
        ) : filteredTags.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No Tags Found"
              description={
                searchFilter
                  ? `No tags match "${searchFilter}".`
                  : "No tags currently exist. Create tags to label tasks."
              }
              actionText="Add New Tag"
              onAction={openCreateModal}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="py-3.5 px-6">ID</th>
                  <th className="py-3.5 px-6">Tag Name</th>
                  <th className="py-3.5 px-6">Color Preview</th>
                  <th className="py-3.5 px-6">Color Hex Code</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagedTags.map((tg) => (
                  <tr
                    key={tg.tagId}
                    className="hover:bg-slate-50/80 transition"
                  >
                    <td className="py-4 px-6 font-mono text-xs text-slate-400">
                      #{tg.tagId}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      <TagPill tag={tg} />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-5 h-5 rounded-full border border-slate-200 shadow-inner"
                          style={{ backgroundColor: tg.color || "#64748b" }}
                        />
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-600">
                      {tg.color || "(None)"}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(tg)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-medium transition"
                      >
                        <Pencil className="w-3.5 h-3.5 text-slate-500" />
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(tg)}
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
            totalItems={filteredTags.length}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === "create" ? "Create New Tag" : "Edit Tag"}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Tag Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              placeholder="e.g. Bug, Frontend, Priority 1"
              maxLength={50}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none transition ${
                formErrors.tagName
                  ? "border-rose-300 bg-rose-50/30 focus:border-rose-500"
                  : "border-slate-200 focus:border-blue-500"
              }`}
            />
            {formErrors.tagName && (
              <p className="text-xs text-rose-600 mt-1">{formErrors.tagName}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Color Hex Code <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 p-0.5"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#RRGGBB"
                maxLength={7}
                className={`flex-1 font-mono uppercase px-3.5 py-2 rounded-xl border text-sm focus:outline-none transition ${
                  formErrors.color
                    ? "border-rose-300 bg-rose-50/30 focus:border-rose-500"
                    : "border-slate-200 focus:border-blue-500"
                }`}
              />
            </div>
            {formErrors.color && (
              <p className="text-xs text-rose-600 mt-1">{formErrors.color}</p>
            )}
          </div>

          {/* Preset Swatches */}
          <div>
            <span className="block text-xs text-slate-400 mb-2">
              Preset Colors
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-full border-2 transition transform hover:scale-110 ${
                    color.toLowerCase() === c.toLowerCase()
                      ? "border-slate-900 ring-2 ring-blue-500"
                      : "border-white"
                  }`}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
          </div>

          {/* Live Preview */}
          <div className="pt-2">
            <span className="block text-xs text-slate-400 mb-1.5">
              Live Preview
            </span>
            <TagPill tag={{ tagName: tagName || "Tag Preview", color }} />
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
              {modalMode === "create" ? "Create Tag" : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Tag"
        message={`Are you sure you want to delete tag "${deleteTarget?.tagName}"? Deletion is only allowed if no tasks are linked to this tag.`}
        confirmText="Confirm Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
