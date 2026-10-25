"use client";

import { Check, Pencil, RefreshCw } from "lucide-react";
import { Button } from "@/src/components/ui/button";

export function StickyApprovalBar({
  statusLabel,
  nextLabel,
  onRegenerate,
  onEdit,
  onApprove,
  onCancel,
  regenerating = false,
  saving = false,
  canApprove,
  editing,
}: {
  statusLabel: string;
  nextLabel: string;
  onRegenerate: () => void;
  onEdit: () => void;
  onApprove: () => void;
  onCancel: () => void;
  regenerating?: boolean;
  saving?: boolean;
  canApprove: boolean;
  editing: boolean;
}) {
  return (
    <div className="flex h-20 shrink-0 items-center justify-between gap-4 border-t border-line bg-surface px-5 sm:px-8">
      <div className="min-w-0">
        <p className="truncate text-[12px] text-ink">{statusLabel}</p>
        <p className="mt-0.5 truncate text-[11px] text-ink-muted">
          {nextLabel}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {editing ? (
          <>
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              onClick={onApprove}
              loading={saving}
              disabled={!canApprove}
              leftIcon={<Check size={15} />}
            >
              Approve & Save
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              onClick={onRegenerate}
              loading={regenerating}
              leftIcon={<RefreshCw size={15} />}
              className="hidden sm:inline-flex"
            >
              Regenerate
            </Button>
            <Button
              variant="secondary"
              onClick={onEdit}
              leftIcon={<Pencil size={15} />}
            >
              Edit
            </Button>
            <Button
              onClick={onApprove}
              loading={saving}
              disabled={!canApprove}
              leftIcon={<Check size={15} />}
            >
              Approve & Save
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
