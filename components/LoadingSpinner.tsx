import React from "react";
import { Loader2 } from "lucide-react";

export const LoadingSpinner: React.FC<{
  text?: string;
  size?: "sm" | "md" | "lg";
}> = ({ text = "Loading data...", size = "md" }) => {
  const sizeClass =
    size === "sm" ? "w-4 h-4" : size === "lg" ? "w-8 h-8" : "w-6 h-6";

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <Loader2 className={`${sizeClass} animate-spin text-blue-600 mb-2`} />
      {text && <p className="text-sm text-slate-500 font-medium">{text}</p>}
    </div>
  );
};

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse"
        >
          <div className="h-5 bg-slate-200 rounded-sm w-2/3 mb-4"></div>
          <div className="h-4 bg-slate-100 rounded-sm w-full mb-2"></div>
          <div className="h-4 bg-slate-100 rounded-sm w-4/5 mb-6"></div>
          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <div className="h-4 bg-slate-200 rounded-sm w-1/4"></div>
            <div className="h-4 bg-slate-200 rounded-sm w-1/4"></div>
          </div>
        </div>
      ))}
    </div>
  );
};
