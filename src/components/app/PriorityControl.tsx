// Controls for reordering a prioritised list.
//
// Drag with the handle, or use the keyboard buttons. Both routes are provided
// because this view is used in government offices where pointer dragging is
// often not practical.

import { useState, type DragEvent } from "react";
import { GripVertical, ChevronUp, ChevronDown, RotateCcw } from "lucide-react";
import type { PriorityOrder } from "@/lib/priorityOrder";

export function usePriorityDrag(priority: PriorityOrder) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);

  function rowProps(id: string) {
    return {
      draggable: true,
      onDragStart: (e: DragEvent) => {
        setDragging(id);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", id);
      },
      onDragOver: (e: DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (over !== id) setOver(id);
      },
      onDrop: (e: DragEvent) => {
        e.preventDefault();
        const from = dragging ?? e.dataTransfer.getData("text/plain");
        if (from && from !== id) priority.moveTo(from, priority.order.indexOf(id));
        setDragging(null);
        setOver(null);
      },
      onDragEnd: () => {
        setDragging(null);
        setOver(null);
      },
      "data-dragging": dragging === id ? "true" : undefined,
      "data-drop-target": over === id && dragging !== id ? "true" : undefined,
      className: [
        dragging === id ? "opacity-50" : "",
        over === id && dragging !== id ? "outline-2 outline-offset-[-2px] outline-primary" : "",
      ]
        .filter(Boolean)
        .join(" "),
    };
  }

  return { rowProps };
}

export function PriorityHandle({
  id,
  label,
  priority,
}: {
  id: string;
  label: string;
  priority: PriorityOrder;
}) {
  const index = priority.order.indexOf(id);
  const position = index + 1;
  const btn =
    "rounded-sm border border-input bg-card p-0.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-40 disabled:hover:bg-card";

  return (
    <span className="flex items-center gap-1">
      <GripVertical
        aria-hidden="true"
        className="h-3.5 w-3.5 shrink-0 cursor-grab text-muted-foreground"
      />
      <span className="num w-5 text-right text-xs font-semibold">{position}</span>
      <span className="flex flex-col gap-0.5">
        <button
          type="button"
          className={btn}
          disabled={index <= 0}
          aria-label={`Move ${label} up to position ${position - 1}`}
          onClick={() => priority.move(id, -1)}
        >
          <ChevronUp className="h-3 w-3" />
        </button>
        <button
          type="button"
          className={btn}
          disabled={index === -1 || index >= priority.order.length - 1}
          aria-label={`Move ${label} down to position ${position + 1}`}
          onClick={() => priority.move(id, 1)}
        >
          <ChevronDown className="h-3 w-3" />
        </button>
      </span>
    </span>
  );
}

export function PriorityNotice({
  priority,
  computedLabel = "computed ranking",
}: {
  priority: PriorityOrder;
  computedLabel?: string;
}) {
  if (!priority.isCustom) {
    return (
      <span className="text-xs text-muted-foreground">
        Shown in the {computedLabel}. Drag or use the arrows to set your own order.
      </span>
    );
  }
  return (
    <span className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground">
        Your review order is applied. Records and scores are unchanged.
      </span>
      <button
        type="button"
        onClick={priority.reset}
        className="inline-flex items-center gap-1 rounded-sm border border-input bg-card px-2 py-1 font-medium hover:bg-accent"
      >
        <RotateCcw className="h-3 w-3" aria-hidden="true" />
        Restore {computedLabel}
      </button>
    </span>
  );
}
