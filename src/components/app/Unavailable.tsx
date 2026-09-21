import { Link } from "@tanstack/react-router";
import { useCity } from "@/lib/cityContext";

/**
 * One shared treatment for every dead end in the prototype: a missing page, a
 * record that does not belong to the active city, or a view that is not built
 * yet. It says plainly that the part is still in progress and always returns
 * the reader to the home of the context they are in, national or city.
 */
export function Unavailable({
  title,
  detail,
  backTo,
  backLabel,
}: {
  title: string;
  detail?: string;
  backTo?: string;
  backLabel?: string;
}) {
  const { portfolio, city } = useCity();
  const homeTo = portfolio ? "/national" : "/";
  const homeLabel = portfolio ? "National overview" : `${city.name} overview`;

  return (
    <section className="rounded-sm border border-border bg-card p-5 shadow-sm">
      <p className="field-label">Work in progress</p>
      <h2 className="mt-1 text-lg font-semibold text-foreground">{title}</h2>
      {detail ? (
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{detail}</p>
      ) : null}
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        This part of the prototype is still being built.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {backTo ? (
          <Link
            to={backTo as never}
            className="rounded-sm border border-input bg-card px-3 py-1.5 text-sm hover:bg-accent"
          >
            Back to {backLabel ?? "the list"}
          </Link>
        ) : null}
        <Link
          to={homeTo}
          className="rounded-sm border border-input bg-card px-3 py-1.5 text-sm font-medium hover:bg-accent"
        >
          Back to {homeLabel}
        </Link>
      </div>
    </section>
  );
}
