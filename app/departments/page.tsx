"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Search,
  ArrowRight,
  PlusCircle,
  FolderGit2,
} from "lucide-react";
import { departmentsApi } from "@/lib/api";
import { DepartmentListItemDto } from "@/lib/types";
import { LoadingSpinner, CardSkeleton } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/components/ToastContext";

export default function DepartmentsPage() {
  const { error } = useToast();
  const [departments, setDepartments] = useState<DepartmentListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const latestRequestId = useRef(0);

  const fetchDepartments = useCallback(
    async (query = "") => {
      const requestId = ++latestRequestId.current;
      try {
        setLoading(true);
        if (query.trim()) {
          const results = await departmentsApi.search(query.trim());
          if (requestId === latestRequestId.current) setDepartments(results);
        } else {
          const all = await departmentsApi.getAll();
          if (requestId === latestRequestId.current) setDepartments(all);
        }
      } catch (err: any) {
        if (requestId === latestRequestId.current) {
          error(err.message || "Failed to load departments.");
        }
      } finally {
        if (requestId === latestRequestId.current) setLoading(false);
      }
    },
    [error],
  );

  useEffect(() => {
    fetchDepartments();
    return () => {
      latestRequestId.current += 1;
    };
  }, [fetchDepartments]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDepartments(searchQuery);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-600" />
            Departments
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Browse all active departments and view their associated projects.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/departments"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-sm"
          >
            Manage Departments
          </Link>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search departments by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition shrink-0"
          >
            Search
          </button>
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                fetchDepartments("");
              }}
              className="px-4 py-2.5 text-slate-500 hover:text-slate-800 text-sm font-medium transition shrink-0"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Department Cards Grid */}
      {loading ? (
        <CardSkeleton count={6} />
      ) : departments.length === 0 ? (
        <EmptyState
          title="No Departments Found"
          description={
            searchQuery
              ? `No departments matching "${searchQuery}". Try a different keyword.`
              : "No active departments currently exist."
          }
          actionText="Create Department"
          onAction={() => (window.location.href = "/admin/departments")}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <Link
              key={dept.departmentId}
              href={`/departments/${dept.departmentId}`}
              className="group flex flex-col justify-between bg-white rounded-2xl border border-slate-200/80 p-6 hover:shadow-lg hover:border-blue-300 transition duration-200"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-105 transition transform">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition">
                  {dept.departmentName}
                </h3>
                <p className="text-sm text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                  {dept.departmentDescription}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5 font-medium text-slate-600">
                  <FolderGit2 className="w-3.5 h-3.5 text-slate-400" />
                  View Projects
                </span>
                <span className="font-semibold text-blue-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  Explore &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
