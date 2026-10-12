"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Building2,
  FolderGit2,
  ArrowLeft,
  Calendar,
  AlertCircle,
  PlusCircle,
  CheckCircle2,
} from "lucide-react";
import { departmentsApi } from "@/lib/api";
import { DepartmentDetailDto } from "@/lib/types";
import { ProjectStatusBadge } from "@/components/Badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/components/ToastContext";

export default function DepartmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { error } = useToast();
  const departmentId = Number(params.id);

  const [department, setDepartment] = useState<DepartmentDetailDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!Number.isInteger(departmentId) || departmentId <= 0) {
      setDepartment(null);
      setLoading(false);
      return;
    }

    async function loadDepartment() {
      try {
        setLoading(true);
        const data = await departmentsApi.getById(departmentId);
        setDepartment(data);
      } catch (err: any) {
        error(err.message || "Failed to load department details.");
      } finally {
        setLoading(false);
      }
    }
    loadDepartment();
  }, [departmentId, error]);

  if (loading) {
    return <LoadingSpinner text="Loading department details..." size="lg" />;
  }

  if (!department) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Department Not Found</h2>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          The requested department ID could not be found or has been deactivated.
        </p>
        <Link
          href="/departments"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Departments
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/departments"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all departments
        </Link>
      </div>

      {/* Department Info Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {department.departmentName}
                </h1>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                    department.isActive
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {department.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="text-slate-600 text-sm mt-2 max-w-3xl leading-relaxed">
                {department.departmentDescription}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <Link
              href="/admin/departments"
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition"
            >
              Edit Department
            </Link>
            <Link
              href="/admin/projects"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-xs transition"
            >
              <PlusCircle className="w-4 h-4" />
              New Project
            </Link>
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-blue-600" />
            Department Projects ({department.projects?.length || 0})
          </h2>
        </div>

        {!department.projects || department.projects.length === 0 ? (
          <EmptyState
            title="No Projects in this Department"
            description="There are currently no active projects assigned to this department."
            actionText="Create Project"
            onAction={() => router.push("/admin/projects")}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {department.projects.map((proj) => (
              <Link
                key={proj.projectId}
                href={`/projects/${proj.projectId}`}
                className="group bg-white rounded-2xl border border-slate-200/80 p-5 hover:border-blue-300 hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-400">
                      ID #{proj.projectId}
                    </span>
                    <ProjectStatusBadge status={proj.status} />
                  </div>
                  <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition text-base">
                    {proj.projectName}
                  </h3>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span
                    className={`inline-flex items-center gap-1 ${
                      proj.isActive ? "text-emerald-600" : "text-slate-400"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {proj.isActive ? "Active" : "Archived"}
                  </span>
                  <span className="font-semibold text-blue-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    View Tasks &rarr;
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
