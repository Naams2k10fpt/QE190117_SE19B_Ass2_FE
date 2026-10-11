"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  KanbanSquare,
  Building2,
  FolderGit2,
  CheckSquare,
  Tag,
  Search,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [manageDropdownOpen, setManageDropdownOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  const navLinks = [
    { label: "Home", href: "/", icon: KanbanSquare },
    { label: "Departments", href: "/departments", icon: Building2 },
    { label: "Search Tasks", href: "/search", icon: Search },
  ];

  const manageLinks = [
    { label: "Departments", href: "/departments/manage", icon: Building2 },
    { label: "Projects", href: "/projects/manage", icon: FolderGit2 },
    { label: "Tasks", href: "/tasks/manage", icon: CheckSquare },
    { label: "Tags", href: "/tags/manage", icon: Tag },
  ];

  const isManageActive = manageLinks.some((l) => pathname.startsWith(l.href));

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition transform">
                <KanbanSquare className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg leading-tight text-slate-900">
                  Task<span className="text-blue-600">Track</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  PRN232 Ass2
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href) && !isManageActive;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      active
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}

              {/* Management Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setManageDropdownOpen(!manageDropdownOpen)}
                  onBlur={() => setTimeout(() => setManageDropdownOpen(false), 200)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isManageActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <span>Management</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      manageDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {manageDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-52 rounded-xl bg-white p-2 shadow-xl border border-slate-100 ring-1 ring-slate-900/5 focus:outline-none animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1.5 text-[11px] font-semibold uppercase text-slate-400">
                      Manage Entities (CRUD)
                    </div>
                    {manageLinks.map((item) => {
                      const ItemIcon = item.icon;
                      const active = pathname.startsWith(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                            active
                              ? "bg-blue-50 text-blue-700"
                              : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          <ItemIcon className="w-4 h-4 text-slate-500" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Quick Action Button & Mobile toggle */}
          <div className="flex items-center gap-3">
            <Link
              href="/tasks/manage"
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition"
            >
              <CheckSquare className="w-4 h-4" />
              Manage Tasks
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 space-y-1 animate-in slide-in-from-top-2">
            <div className="px-3 py-1 text-xs font-semibold uppercase text-slate-400">
              Navigation
            </div>
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive(link.href)
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}

            <div className="pt-2 px-3 py-1 text-xs font-semibold uppercase text-slate-400">
              CRUD Management
            </div>
            {manageLinks.map((item) => {
              const ItemIcon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                    pathname.startsWith(item.href)
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <ItemIcon className="w-4 h-4" />
                  {item.label} Management
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
