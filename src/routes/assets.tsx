import { createFileRoute, Link } from "@tanstack/react-router";
import { DataTable, type Column } from "@/components/app/DataTable";
import { PageHeader } from "@/components/app/Primitives";
import { lookupEntity } from "@/data/four-city/dataset";
import { Breadcrumbs } from "@/components/app/Breadcrumbs";
import { assets } from "@/data/selectors";
import type { Asset } from "@/data/types";
import { CITY_SYSTEMS } from "@/data/types";
import { count, dateText, text } from "@/lib/format";

export const Route = createFileRoute("/assets")({
  head: () => ({
    meta: [
      { title: "Assets | Jalandhar City Intelligence" },
      {
        name: "description",
        content:
          "Register of city infrastructure assets in Jalandhar with owning agency, capacity and operational status.",
      },
      { property: "og:title", content: "Assets: Jalandhar City Intelligence" },
      {
        property: "og:description",
        content: "What infrastructure exists in Jalandhar, who owns it and whether it works.",
      },
    ],
  }),
  component: AssetsPage,
});

function AssetsPage() {
  const columns: Column<Asset>[] = [
    {
      key: "asset_name",
      header: "Asset",
      value: (a) => a.asset_name,
      render: (a) =>
        lookupEntity(a.asset_id) ? (
          <Link
            to="/records/$recordId"
            params={{ recordId: a.asset_id }}
            className="underline underline-offset-2"
          >
            {a.asset_name}
          </Link>
        ) : (
          a.asset_name
        ),
    },
    {
      key: "asset_type",
      header: "Type",
      value: (a) => a.asset_type,
      render: (a) => text(a.asset_type),
    },
    { key: "sector", header: "System", value: (a) => a.sector, render: (a) => text(a.sector) },
    {
      key: "owning_agency",
      header: "Owning agency",
      value: (a) => a.owning_agency,
      render: (a) => text(a.owning_agency),
    },
    {
      key: "operating_agency",
      header: "Operating agency",
      value: (a) => a.operating_agency,
      render: (a) => text(a.operating_agency),
    },
    {
      key: "capacity",
      header: "Capacity",
      align: "right",
      value: (a) => a.capacity,
      render: (a) => (
        <span className="num">
          {a.capacity === null ? "Not available" : `${count(a.capacity)} ${text(a.capacity_unit)}`}
        </span>
      ),
    },
    {
      key: "operational_status",
      header: "Operational status",
      value: (a) => a.operational_status,
      render: (a) => text(a.operational_status),
    },
    {
      key: "commissioning_date",
      header: "Commissioned",
      value: (a) => a.commissioning_date,
      render: (a) => <span className="num">{dateText(a.commissioning_date)}</span>,
    },
    {
      key: "related_projects",
      header: "Related projects",
      value: (a) => a.related_projects.join(" "),
      render: (a) =>
        a.related_projects.length === 0 ? (
          <span className="text-muted-foreground italic">Not available</span>
        ) : (
          <div className="flex flex-col">
            {a.related_projects.map((id) => (
              <Link
                key={id}
                to="/projects/$projectId"
                params={{ projectId: id }}
                className="num text-xs hover:underline"
              >
                {id}
              </Link>
            ))}
          </div>
        ),
    },
  ];

  return (
    <>
      <Breadcrumbs trail={[{ label: "Assets" }]} />
      <PageHeader
        title="Assets"
        subtitle="Physical infrastructure in the city, independent of the project that created it."
      />
      <DataTable
        rows={assets}
        columns={columns}
        getRowKey={(a) => a.asset_id}
        searchPlaceholder="Search asset, type or agency"
        filters={[
          {
            key: "sector",
            label: "System",
            options: [...CITY_SYSTEMS],
            match: (a, s) => a.sector === s,
          },
          {
            key: "status",
            label: "Status",
            options: [...new Set(assets.map((a) => a.operational_status ?? "Not available"))],
            match: (a, s) => (a.operational_status ?? "Not available") === s,
          },
        ]}
      />
    </>
  );
}
