"use client";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";

type TransactionState = "idle" | "pending" | "success" | "failed";

export default function TransactionStatus({
  state,
}: {
  state: TransactionState;
}) {
  if (state === "idle") return null;

  if (state === "pending") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4">
        <Loader2 size={20} className="animate-spin text-cyan-400" />

        <div>
          <div className="text-sm font-medium text-white">
            Transaction pending
          </div>

          <div className="text-xs text-gray-500">
            Waiting for Miden transaction confirmation.
          </div>
        </div>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-green-400/20 bg-green-400/5 p-4">
        <CheckCircle2 size={20} className="text-green-400" />

        <div>
          <div className="text-sm font-medium text-white">
            Transaction confirmed
          </div>

          <div className="text-xs text-gray-500">
            Your Miden transaction was confirmed.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-red-400/20 bg-red-400/5 p-4">
      <XCircle size={20} className="text-red-400" />

      <div>
        <div className="text-sm font-medium text-white">
          Transaction failed
        </div>

        <div className="text-xs text-gray-500">
          The transaction was not completed.
        </div>
      </div>
    </div>
  );
}
