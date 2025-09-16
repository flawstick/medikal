// This is file of your component

// You can use any dependencies from npm; we import them automatically in package.json
"use client";
import { ArrowLeft } from "lucide-react";

export function FlowButton({ text = "צור משלוח" }: { text?: string }) {
  return (
    <button className="group relative flex items-center gap-1 overflow-hidden rounded-[100px] border border-border bg-card px-8 py-3 text-sm font-semibold text-foreground cursor-pointer transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-transparent hover:text-primary-foreground hover:rounded-[12px] active:scale-[0.95]">
      {/* Left arrow (entering from left) */}
      <ArrowLeft className="absolute w-4 h-4 left-[-25%] stroke-foreground fill-none z-[9] group-hover:left-4 group-hover:stroke-primary-foreground transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]" />

      {/* Text */}
      <span className="relative z-[1] -translate-x-3 group-hover:translate-x-3 transition-all duration-[800ms] ease-out">
        {text}
      </span>

      {/* Circle */}
      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-[50%] opacity-0 group-hover:w-[220px] group-hover:h-[220px] group-hover:opacity-100 transition-all duration-[800ms] ease-[cubic-bezier(0.19,1,0.22,1)]"></span>

      {/* Left arrow (exiting to right) */}
      <ArrowLeft className="absolute w-4 h-4 right-4 stroke-foreground fill-none z-[9] group-hover:right-[-25%] group-hover:stroke-primary-foreground transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]" />
    </button>
  );
}
