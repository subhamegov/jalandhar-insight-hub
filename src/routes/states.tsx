import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader, Panel, PrototypeNote } from "@/components/app/Primitives";
import { CITIES, type CityId } from "@/data/cities/registry";
import { datasetFor } from "@/data/cities/datasets";
import { useCity } from "@/lib/cityContext";
import { useGeo } from "@/lib/geoContext";
import { count } from "@/lib/format";

export const Route = createFileRoute("/states")({
  head: () => ({
    meta: [
      { title: "States | MoHUA Urban Intelligence" },
      {
        name: "description",
        content:
          "States covered by the MoHUA Urban Intelligence prototype, with the cities held under each state.",
      },
      { property: "og:title", content: "States: MoHUA Urban Intelligence" },
      {
        property: "og:description",
        content: "Move from India to a state and then into a city in the prototype.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StatesView,
});

function StatesView() {
  const { setCityId } = useCity();
  const { setLocalityId } = useGeo();
  const navigate = useNavigate();

  const states = Array.from(
    CITIES.reduce((map, c) => {
      const list = map.get(c.state) ?? [];
      list.push(c);
      map.set(c.state, list);
      return map;
    }, new Map<string, typeof CITIES>()),
  ).sort((a, b) => a[0].localeCompare(b[0]));

  const open = (id: CityId) => {
    setLocalityId(null);
    setCityId(id, "/");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="States"
        subtitle="States holding a prototype city. Select a city to open its records."
        note={<PrototypeNote text="Prototype coverage only · Not all states or urban local bodies" />}
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {states.map(([state, cities]) => (
          <Panel key={state} title={state} description={`${count(cities.length)} city in this prototype`}>
            <ul className="space-y-2">
              {cities.map((c) => {
                const dataset = datasetFor(c.city_id);
                return (
                  <li key={c.city_id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {c.city_id} · {count(dataset.projects.length)} project records
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => open(c.city_id)}
                      className="shrink-0 rounded-sm border border-input bg-card px-2.5 py-1 text-xs font-medium hover:bg-accent"
                    >
                      Open
                    </button>
                  </li>
                );
              })}
            </ul>
          </Panel>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        State groupings are read from the existing city registry. No state-level records, boundaries
        or statistics are held in this prototype.
      </p>
    </div>
  );
}
