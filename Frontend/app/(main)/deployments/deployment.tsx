"use client";
import AppTable from "@/components/ui-elements/AppTable";
import { useState } from "react";
import TooltipWrapper from "@/helpers/tooltipWrapper";
import AppIconButton from "@/components/ui-elements/AppIconButton";
import api from "@/libs/axios";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MdOutlineManageHistory, MdDeleteOutline } from "react-icons/md";
import AppCheckbox from "@/components/ui-elements/AppCheckBox";
import AppModal from "@/components/ui-elements/AppModal";
import AppButton from "@/components/ui-elements/AppButton";
import { toast } from "react-toastify";
import { FormatDate } from "@/helpers/formatDate";

import AppSearchInput from "@/components/ui-elements/DebounceSearchInput";
import {
  PiCheckCircleFill,
  PiXCircleFill,
  PiClockFill,
  PiCircleHalfFill,
} from "react-icons/pi";
import { APP_CONSTANTS } from "@/app_constants";

const statusConfig: Record<
  string,
  { label: string; icon: React.ReactNode; className: string }
> = {
   1: {
    label: "Success",
    icon: <PiCheckCircleFill size={14} />,
    className: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  },
  3: {
    label: "Failed",
    icon: <PiXCircleFill size={14} />,
    className: "text-red-400 bg-red-400/10 border-red-400/20",
  },
  2: {
    label: "Running",
    icon: <PiCircleHalfFill size={14} className="animate-spin" />,
    className: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  },
  pending: {
    label: "Pending",
    icon: <PiClockFill size={14} />,
    className: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  },
};

const fetchDeployments = async (
  page: number,
  limit: number,
  search: string = "",
) => {
  const res = await api.get("/deployments", {
    params: { page, limit, search },
  });
  return res.data;
};

type ModalState = {
  type: 1 | 2;
  ids: string[];
  names: string[];
} | null;

export default function Deployment() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<string[]>([]);
  const [modalState, setModalState] = useState<ModalState>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const { data: queryData, isLoading } = useQuery({
    queryKey: ["deployments", page, pageSize, search],
    queryFn: () => fetchDeployments(page, pageSize, search),
    refetchOnMount: true,
    retry: false,
  });
  function handleSearch(val: string) {
    setSearch(val);
    setPage(1);
  }

  const tableData = queryData?.data || [];
  const total = queryData?.total || 0;

  const selectableIds: string[] = tableData
    .map((r: any) => r._id);
  const isAllSelected =
    selectableIds.length > 0 &&
    selectableIds.every((id) => selected.includes(id));
  const isIndeterminate = selected.length > 0 && !isAllSelected;

  function toggleAll() {
    setSelected(isAllSelected ? [] : selectableIds);
  }

  function toggleOne(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function openSingleDelete(row: any) {
    setModalState({ type: 1, ids: [row._id], names: [row.project_name] });
  }

  function openBulkDelete() {
    const names = tableData
      .filter((r: any) => selected.includes(r._id))
      .map((r: any) => r.project_name);
    setModalState({ type: 2, ids: [...selected], names });
  }

  function closeModal() {
    setModalState(null);
  }

  function NavigatePages(id: string) {
    if (!id) return;
    router.push(`/deployments/logs/${id}`);
  }

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      if (ids.length === 1) return api.delete(`/deployments/${ids[0]}`);
      return api.post(`/deployments/bulk-delete`, { ids });
    },
    onSuccess: (data: any) => {
      const msg = data?.data?.msg;
      if (msg) toast.success(msg);
      setSelected([]);
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["deployments"] });
    },
  });

  const columns: any = [
    {
      key: "checkbox",
      label: (
        <AppCheckbox
          checked={isAllSelected}
          indeterminate={isIndeterminate}
          onChange={toggleAll}
        />
      ),
      headerClassName: "!w-10",
      render: (_: any, row: any) => {
     
        return (
          <AppCheckbox
            checked={selected.includes(row._id)}
            onChange={() => toggleOne(row._id)}
          />
        );
      },
    },


    { key: "deployment_id", label: "Deployment ID" },
    { key: "project_name", label: "Project Name" },
    
    {
      key: "deployed_at",
      label: "Deployed At",
      render: (row: any) => FormatDate(row),
    },
    {
      key: "duration_seconds",
      label: "Duration",
      render: (_: any, row: any) => {
        const s = row.duration_seconds;
        if (!s && s !== 0)
          return <span className="text-[var(--text-4)] text-[13px]">-</span>;
        const status = row.status
        const colorClass =
          status === APP_CONSTANTS.DEPLOYMENT_STATUS.SUCCESS
            ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
            : status === APP_CONSTANTS.DEPLOYMENT_STATUS.FAILED
              ? "text-red-400 bg-red-400/10 border-red-400/20"
              : status === APP_CONSTANTS.DEPLOYMENT_STATUS.RUNNING
                ? "text-blue-400 bg-blue-400/10 border-blue-400/20"
                : "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
        const display = s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${colorClass}`}
          >
            <PiClockFill size={12} />
            {display}
          </span>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (_: any, row: any) => {
        const config = statusConfig[row.status] ?? {
          label: row.status ?? "-",
          icon: null,
          className:
            "text-[var(--text-3)] bg-[var(--bg-4)] border-[var(--border-2)]",
        };
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${config.className}`}
          >
            {config.icon}
            {config.label}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      headerClassName: "!text-center",
      render: (_: any, row: any) => (
        <div className="flex flex-row items-center w-full justify-center gap-3">
          <TooltipWrapper content="View Deployment Logs">
            <AppIconButton
              variant="secondary"
              onClick={() => NavigatePages(row._id)}
            >
              <MdOutlineManageHistory color="white" size={18} />
            </AppIconButton>
          </TooltipWrapper>
          
            <TooltipWrapper content="Delete Deployment">
              <AppIconButton
                variant="danger"
                onClick={() => openSingleDelete(row)}
              >
                <MdDeleteOutline color="white" size={18} />
              </AppIconButton>
            </TooltipWrapper>
          
        </div>
      ),
    },
  ];

  function SaveModal(){
    if( !modalState || !modalState?.ids) return
    deleteMutation.mutate(modalState.ids)
  }

  return (
    <>
      <div className="mb-3 flex flex-row items-center  justify-between">
        <AppSearchInput
          placeholder="Search Deployments..."
          debounce={1000}
          onChange={handleSearch}
          fullWidth={false}
          wrapperClassName="w-64"
        />
        {selected.length > 0 && (
          <AppButton variant="danger" size="sm" onClick={openBulkDelete}>
            <MdDeleteOutline size={15} />
            Delete ({selected.length})
          </AppButton>
        )}
      </div>

      <AppTable
        columns={columns}
        data={tableData}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        isLoading={isLoading}
      />

      <AppModal
        open={!!modalState}
        onClose={closeModal}
        title={
          modalState?.ids.length === 1
            ? "Delete Deployment"
            : "Delete Deployments"
        }
        width="420px"
        isLoading={deleteMutation.isPending}
        variant="danger"
        onSubmit={ SaveModal }
        submit_text="delete"
      >
        <div className="flex flex-col items-center text-center gap-4 py-2">
          <div className="w-14 h-14 flex items-center justify-center rounded-full bg-red-500/10">
            <MdDeleteOutline className="text-red-500" size={28} />
          </div>
          <div>
            <h3 className="text-[16px] font-medium text-[var(--text-1)]">
              {modalState?.ids.length === 1
                ? "Delete this deployment?"
                : `Delete ${modalState?.ids.length} deployments?`}
            </h3>
            <p className="text-[13px] text-[var(--text-3)] mt-1">
              This action cannot be undone. The following{" "}
              {modalState?.ids.length === 1 ? "deployment" : "deployments"} will
              be permanently deleted:
            </p>
          </div>

          <div className="w-full flex flex-col gap-1.5 max-h-40 overflow-y-auto">
            {modalState?.names.map((name, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[var(--bg-3)] border border-[var(--border-1)]"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                <span className="text-[13px] text-[var(--text-2)] text-left truncate">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </AppModal>
    </>
  );
}
