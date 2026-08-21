import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { evidence as allEvidence } from "@/data/selectors";
import type { Evidence, EvidenceQuality, ReportedValue } from "@/data/types";
import { SourceBadge } from "@/components/app/SourceBadge";
import { FreshnessBadge } from "@/components/app/FreshnessBadge";
import { EMPTY, dateText, text } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface EvidenceRequest {
  /** The fact this evidence supports, in plain words. */
  fact: string;
  /** The value shown to the user, if any. */
  value?: string | null;
  /** Record the fact belongs to (project id, asset id and similar). */
  entityId?: string | null;
  entityName?: string | null;
  /** Specific evidence records, when known. */
  evidenceIds?: string[];
  /** Values as reported by different government sources. */
  reported?: ReportedValue[];
  lastVerified?: string | null;
  conflictNote?: string | null;
  /** Fallback source when no evidence record exists. */
  fallback?: {
    source_agency?: string | null;
    source_url?: string | null;
    source_date?: string | null;
    evidence_quality?: EvidenceQuality;
  };
}

interface Ctx {
  open: (request: EvidenceRequest) => void;
}

const EvidenceCtx = createContext<Ctx>({ open: () => {} });

export function useEvidenceDrawer() {
  return useContext(EvidenceCtx);
}

export function EvidenceDrawerProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<EvidenceRequest | null>(null);
  const open = useCallback((r: EvidenceRequest) => setRequest(r), []);
  const value = useMemo(() => ({ open }), [open]);

  useEffect(() => {
    if (!request) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setRequest(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [request]);

  return (
    <EvidenceCtx.Provider value={value}>
      {children}
      {request ? <Drawer request={request} onClose={() => setRequest(null)} /> : null}
    </EvidenceCtx.Provider>
  );
}

function resolve(request: EvidenceRequest): Evidence[] {
  if (request.evidenceIds?.length) {
    return allEvidence.filter((e) => request.evidenceIds!.includes(e.evidence_id));
  }
  if (request.entityId) {
    return allEvidence.filter((e) => e.linked_entity === request.entityId);
  }
  return [];
}

function Drawer({ request, onClose }: { request: EvidenceRequest; onClose: () => void }) {
  const records = resolve(request);
  const conflicting = records.filter((e) => e.conflicting_evidence);

  return (
    <div className="fixed inset-0 z-[1000] flex justify-end print:hidden">
      <button
        aria-label="Close evidence panel"
        className="flex-1 bg-foreground/25"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Evidence"
        className="flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-border bg-card shadow-lg sm:w-[26rem]"
      >
        <header className="sticky top-0 flex items-start justify-between gap-3 border-b border-border bg-card px-4 py-3">
          <div className="min-w-0">
            <p className="field-label">Evidence for</p>
            <h2 className="text-sm font-semibold break-words">{request.fact}</h2>
            {request.value ? (
              <p className="num mt-0.5 text-sm text-foreground">{request.value}</p>
            ) : null}
            {request.entityName ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{request.entityName}</p>
            ) : null}
          </div>
          <button
            onClick={onClose}
            aria-label="Close evidence panel"
            className="rounded-sm border border-border p-1 text-muted-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="space-y-4 px-4 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="field-label">Last verified</span>
            <span className="num text-xs">{dateText(request.lastVerified)}</span>
            <FreshnessBadge date={request.lastVerified} />
          </div>

          {request.reported?.length ? (
            <section>
              <h3 className="field-label mb-1">Values reported by government sources</h3>
              <ul className="divide-y divide-border rounded-sm border border-border">
                {request.reported.map((r, i) => (
                  <li key={`${r.label}-${i}`} className="px-3 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium break-words">{text(r.value)}</p>
                        <p className="text-xs text-muted-foreground">{r.label}</p>
                      </div>
                      <SourceBadge quality={r.evidence_quality} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {text(r.source)} · {dateText(r.source_date)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section>
            <h3 className="field-label mb-1">Source documents</h3>
            {records.length ? (
              <ul className="space-y-2">
                {records.map((e) => (
                  <li key={e.evidence_id} className="rounded-sm border border-border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium break-words">{e.title}</p>
                      <SourceBadge quality={e.evidence_quality} />
                    </div>
                    <dl className="mt-2 grid grid-cols-2 gap-1 text-xs">
                      <dt className="text-muted-foreground">Publishing agency</dt>
                      <dd className="break-words">{text(e.publishing_agency)}</dd>
                      <dt className="text-muted-foreground">Published</dt>
                      <dd className="num">{dateText(e.publication_date)}</dd>
                      <dt className="text-muted-foreground">Retrieved</dt>
                      <dd className="num">{dateText(e.retrieved_date)}</dd>
                    </dl>
                    {e.notes ? (
                      <p className="mt-2 border-l-2 border-border pl-2 text-xs text-muted-foreground">
                        {e.notes}
                      </p>
                    ) : null}
                    {e.url ? (
                      <a
                        href={e.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-xs text-primary underline underline-offset-2"
                      >
                        Open source document
                      </a>
                    ) : (
                      <p className="mt-2 text-xs text-muted-foreground italic">
                        No direct link recorded
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-sm border border-dashed border-border p-3 text-xs text-muted-foreground">
                <p>{EMPTY.notVerified}. No source document is attached to this fact.</p>
                {request.fallback ? (
                  <dl className="mt-2 grid grid-cols-2 gap-1">
                    <dt>Recorded source</dt>
                    <dd className="break-words">{text(request.fallback.source_agency)}</dd>
                    <dt>Source date</dt>
                    <dd className="num">{dateText(request.fallback.source_date)}</dd>
                  </dl>
                ) : null}
                {request.fallback?.source_url ? (
                  <a
                    href={request.fallback.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-primary underline underline-offset-2"
                  >
                    Open recorded source
                  </a>
                ) : null}
              </div>
            )}
          </section>

          <section>
            <h3 className="field-label mb-1">Conflicts with other sources</h3>
            {request.conflictNote || conflicting.length ? (
              <div className="rounded-sm border border-destructive/40 bg-destructive/8 p-3 text-xs text-destructive">
                {request.conflictNote ? <p>{request.conflictNote}</p> : null}
                {conflicting.map((e) => (
                  <p key={e.evidence_id} className="mt-1">
                    {e.title}: {text(e.notes)}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No conflicting government source recorded for this fact.
              </p>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
}

/**
 * Inline control that opens the evidence drawer for one fact. Rendered as a
 * dotted underline so it reads as a citation rather than decoration.
 */
export function EvidenceLink({
  request,
  children,
  className,
}: {
  request: EvidenceRequest;
  children?: ReactNode;
  className?: string;
}) {
  const { open } = useEvidenceDrawer();
  return (
    <button
      type="button"
      onClick={() => open(request)}
      aria-label={`View evidence for ${request.fact}`}
      className={cn(
        "inline-flex items-center gap-1 rounded-sm text-[11px] text-primary underline decoration-dotted underline-offset-2 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className,
      )}
    >
      {children ?? "Evidence"}
    </button>
  );
}
