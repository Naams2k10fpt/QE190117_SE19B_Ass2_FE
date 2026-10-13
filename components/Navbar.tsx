"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
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
  UserRound,
  History,
} from "lucide-react";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { account, loading, logout } = useAuth();
  const { error } = useToast();
  const [loggingOut, setLoggingOut] = useState(false);
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
    { label: "Dashboard", href: "/admin", icon: KanbanSquare },
    { label: "Profile", href: "/profile", icon: UserRound },
    { label: "Departments", href: "/admin/departments", icon: Building2 },
    { label: "Projects", href: "/admin/projects", icon: FolderGit2 },
    { label: "Tasks", href: "/admin/tasks", icon: CheckSquare },
    { label: "Tags", href: "/admin/tags", icon: Tag },
    { label: "Deletion history", href: "/admin/deletions", icon: History },
    ...(account?.role === 1 ? [{ label: "Accounts", href: "/admin/accounts", icon: Building2 }] : []),
  ];

  const isManageActive = manageLinks.some((l) => pathname.startsWith(l.href));

  async function handleLogout() {
    setLoggingOut(true);
    try { await logout(); }
    catch (reason) {
      error(reason instanceof Error ? reason.message : "Logout failed. Please try again.");
      setLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm supports-backdrop-filter:bg-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition transform">
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
              {account && <div className="relative" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setManageDropdownOpen(false); }}>
                <button
                  type="button"
                  onClick={() => setManageDropdownOpen(!manageDropdownOpen)}
                  aria-expanded={manageDropdownOpen}
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
                  <div className="absolute left-0 mt-2 w-52 rounded-xl bg-white p-2 shadow-xl border border-slate-100 ring-1 ring-slate-900/5 focus:outline-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1.5 text-[11px] font-semibold uppercase text-slate-400">
                      Management
                    </div>
                    {manageLinks.map((item) => {
                      const ItemIcon = item.icon;
                      const active = pathname.startsWith(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setManageDropdownOpen(false)}
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
              </div>}
            </nav>
          </div>

          {/* Quick Action Button & Mobile toggle */}
          <div className="flex items-center gap-3">
            {loading ? <span className="text-sm text-slate-500">Checking session…</span> : account ? <>
              <span className="hidden sm:block max-w-40 truncate text-sm font-medium" title={account.fullName}>{account.fullName}</span>
              <button type="button" onClick={() => { void handleLogout(); }} disabled={loggingOut} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50">{loggingOut ? "Logging out…" : "Logout"}</button>
            </> : <>
              <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50">Login</Link>
              <Link href="/register" className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">Register</Link>
            </>}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {account && <p className="sm:hidden pb-2 text-sm font-medium text-slate-600 truncate" title={account.fullName}>{account.fullName}</p>}
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

            {account && <><div className="pt-2 px-3 py-1 text-xs font-semibold uppercase text-slate-400">
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
            })}</>}
          </div>
        )}
      </div>
    </header>
  );
};
