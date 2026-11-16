"use client";

import Link from "next/link";
import { useState } from "react";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import {
  AppTableHeader,
  EmptyRow,
  LogsCell,
  SearchInput,
  ServiceNameCell,
  StatusCell,
  TableLoader,
  TimeCells,
  TriggerCell,
} from "@/components/common/AppTable";
import { ServiceSelect } from "@/components/common/ServiceSelect";
import { useGetDeployments } from "@/hooks/queries/useDeployments";

import useDebounce from "@/hooks/app/useDebounce";
import { DEPLOYMENT_STATUS } from "@/constants";

const empty: never[] = [];

const TABLE_HEADERS = [
  { id: 1, label: "Service Name" },
  { id: 2, label: "Deployment Status" },
  { id: 3, label: "Trigger" },
  { id: 4, label: "Source" },
  { id: 5, label: "Started" },
  { id: 6, label: "Duration" },
  { id: 7, label: null },
];
const limit = 10;
export default function Deployments() {
  const [page, setPage] = useState(1);

  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debounceSearch = useDebounce(search, 500);

  const { data, isLoading } = useGetDeployments({
    page,
    limit,
    search: debounceSearch,
    service_id: selectedService,
  });

  const rows = data?.data?.rows ?? empty;

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleServiceChange(id: string | null) {
    setSelectedService(id);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <SearchInput
          search={search}
          setSearch={handleSearch}
          placeholder="Search Deployments by service name"
        />
        <ServiceSelect value={selectedService} onChange={handleServiceChange} />
      </div>

      {isLoading ? (
        <TableLoader />
      ) : (
        <Table>
          <AppTableHeader items={TABLE_HEADERS} />
          <TableBody>
            {rows.length === 0 && (
              <EmptyRow
                text="No deployments found"
                colspan={TABLE_HEADERS.length}
              />
            )}
            {rows.map((row: any) => (
              <TableRow key={row.deployment_id} className="h-14">
                <TableCell>
                  <Link
                    href={
                      row.service_host &&
                      row.status === DEPLOYMENT_STATUS.RUNNING
                        ? `https://${row.service_host}`
                        : `/services/${row.service_type}/${row.service_id}/deploys`
                    }
                    target={row.service_host ? "_blank" : undefined}
                    rel={row.service_host ? "noopener noreferrer" : undefined}
                  >
                    <ServiceNameCell
                      deploy_type={row.deploy_type}
                      service_name={row.service_name}
                      enabled={row.enabled}
                    />
                  </Link>
                </TableCell>
                <StatusCell status={row.status} enabled={!!row.enabled} />
                <TriggerCell trigger={row.trigger} />
                <TableCell className="text-muted-foreground">
                  {row.repo_full_name ?? row.image_url ?? "-"}
                </TableCell>
                <TimeCells deployment={row} />
                <LogsCell
                  deployment_id={row.deployment_id}
                  type={row.service_type}
                  service_id={row.service_id}
                />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
