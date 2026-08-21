import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  /** Value used for sorting and free-text search. */
  value: (row: T) => string | number | null;
  render?: (row: T) => ReactNode;
  className?: string;
  align?: "left" | "right";
}

export interface FilterDef<T> {
  key: string;
  label: string;
  options: string[];
  match: (row: T, selected: string) => boolean;
}

export function DataTable<T>({
  rows,
  columns,
  filters = [],
  searchPlaceholder = "Search",
  getRowKey,
  emptyMessage = "No records match the current filters.",
  searchValues,
}: {
  rows: T[];
  columns: Column<T>[];
  filters?: FilterDef<T>[];
  searchPlaceholder?: string;
  getRowKey: (row: T) => string;
  emptyMessage?: string;
  /** Extra fields included in free text search but not shown as columns. */
  searchValues?: (row: T) => (string | number | null)[];
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = rows.filter((row) => {
      for (const f of filters) {
        const selected = active[f.key];
        if (selected && selected !== "all" && !f.match(row, selected)) return false;
      }
      if (!q) return true;
      const extra = searchValues ? searchValues(row) : [];
      return (
        columns.some((c) =>
          String(c.value(row) ?? "")
            .toLowerCase()
            .includes(q),
        ) ||
        extra.some((v) =>
          String(v ?? "")
            .toLowerCase()
            .includes(q),
        )
      );
    });
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      if (col) {
        out = [...out].sort((a, b) => {
          const av = col.value(a);
          const bv = col.value(b);
          if (av === null && bv === null) return 0;
          if (av === null) return 1;
          if (bv === null) return -1;
          const r =
            typeof av === "number" && typeof bv === "number"
              ? av - bv
              : String(av).localeCompare(String(bv));
          return sortDir === "asc" ? r : -r;
        });
      }
    }
    return out;
  }, [rows, columns, filters, active, query, sortKey, sortDir, searchValues]);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <div className="rounded-md border border-border bg-card">
      <div className="border-b border-border p-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1 basis-56">
            <Search className="pointer-events-none absolute top-2.5 left-2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 w-full rounded-sm border border-input bg-background pr-2 pl-7 text-sm outline-none focus:ring-2 focus:ring-ring/40 sm:h-8"
            />
          </div>
          <span className="num text-xs whitespace-nowrap text-muted-foreground">
            {visible.length} of {rows.length}
          </span>
        </div>
        {filters.length ? (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              aria-expanded={filtersOpen}
              className="inline-flex items-center gap-1.5 rounded-sm border border-input px-2.5 py-1.5 text-xs font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none lg:hidden"
            >
              {filtersOpen ? "Hide filters" : "Filters"}
              {activeCount ? (
                <span className="num rounded-sm bg-primary px-1.5 text-primary-foreground">
                  {activeCount}
                </span>
              ) : null}
            </button>
            <div
              className={cn(
                "mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:mt-0 lg:flex lg:flex-wrap lg:items-center",
                !filtersOpen && "hidden lg:flex",
              )}
            >
              {filters.map((f) => (
                <label
                  key={f.key}
                  className="flex min-w-0 flex-col gap-1 text-xs text-muted-foreground lg:flex-row lg:items-center lg:gap-1.5"
                >
                  <span className="truncate">{f.label}</span>
                  <select
                    value={active[f.key] ?? "all"}
                    onChange={(e) => setActive({ ...active, [f.key]: e.target.value })}
                    className="h-9 w-full min-w-0 rounded-sm border border-input bg-background px-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/40 sm:h-8 lg:w-auto"
                  >
                    <option value="all">All</option>
                    {f.options.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </details>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-muted/60">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    "border-b border-border px-3 py-2 text-left font-medium",
                    c.align === "right" && "text-right",
                    c.className,
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleSort(c.key)}
                    className={cn(
                      "field-label inline-flex items-center gap-1 hover:text-foreground",
                      c.align === "right" && "flex-row-reverse",
                    )}
                  >
                    {c.header}
                    {sortKey === c.key ? (
                      sortDir === "asc" ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )
                    ) : (
                      <ChevronsUpDown className="h-3 w-3 opacity-40" />
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr
                key={getRowKey(row)}
                className="border-b border-border last:border-0 hover:bg-muted/40"
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      "px-3 py-2 align-top",
                      c.align === "right" && "text-right",
                      c.className,
                    )}
                  >
                    {c.render
                      ? c.render(row)
                      : (c.value(row) ?? (
                          <span className="text-muted-foreground italic">Not available</span>
                        ))}
                  </td>
                ))}
              </tr>
            ))}
            {visible.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-8 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
