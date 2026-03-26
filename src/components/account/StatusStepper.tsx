"use client";

import { STATUS_STEPS } from "@/lib/data/order-constants";

export function StatusStepper({ status }: { status: string }) {
  const currentIdx = STATUS_STEPS.findIndex((s) => s.key === status);
  return (
    <div className="flex items-center mt-2.5 w-full max-w-xs">
      {STATUS_STEPS.map((step, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                  done
                    ? "bg-[#16C2F3]"
                    : active
                    ? "border-2 border-[#16C2F3] bg-white"
                    : "border-2 border-gray-200 bg-white"
                }`}
              >
                {done && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                    <path
                      d="M2 5l2.5 2.5L8 3"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <span
                className={`text-[9px] mt-0.5 whitespace-nowrap leading-tight ${
                  active
                    ? "text-[#16C2F3] font-bold"
                    : done
                    ? "text-gray-400"
                    : "text-gray-300"
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < STATUS_STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-0.5 mb-3.5 ${
                  idx < currentIdx ? "bg-[#16C2F3]" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
