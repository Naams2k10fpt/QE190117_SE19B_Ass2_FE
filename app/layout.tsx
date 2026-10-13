import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ToastProvider } from "@/components/ToastContext";
import { AuthProvider } from "@/components/AuthContext";

export const maxDuration = 120;

export const metadata: Metadata = {
  title: "TaskTrack - Task & Team Management",
  description: "Task & Team Management application for PRN232 Assignment 2",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased">
        <ToastProvider>
          <AuthProvider>
          <Navbar />
          <main className="wrap-anywhere flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <Footer />
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
