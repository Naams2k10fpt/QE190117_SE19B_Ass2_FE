import React from "react";
import Link from "next/link";
import { KanbanSquare, CheckCircle, Github } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <KanbanSquare className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-slate-800">TaskTrack Management System</span>
            <span className="text-xs text-slate-400">| PRN232 Assignment 2</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/departments" className="hover:text-blue-600 transition">
              Departments
            </Link>
            <Link href="/search" className="hover:text-blue-600 transition">
              Search
            </Link>
            <Link href="/admin/tasks" className="hover:text-blue-600 transition">
              Tasks CRUD
            </Link>
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <CheckCircle className="w-3.5 h-3.5" />
              API Connected
            </span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
          Built with Next.js 15, Tailwind CSS, TypeScript & ASP.NET Core Web API 8 (.NET 8)
        </div>
      </div>
    </footer>
  );
};
