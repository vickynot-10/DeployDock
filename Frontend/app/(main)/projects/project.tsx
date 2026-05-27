"use client";
import AppTable from "@/components/ui-elements/AppTable";
import { useState, useRef, useEffect } from "react";
import { FiPlus } from "react-icons/fi";
import TooltipWrapper from "@/helpers/tooltipWrapper";
import AppIconButton from "@/components/ui-elements/AppIconButton";
import api from "@/libs/axios";
import { useRouter } from "next/navigation";
import { MdEdit, MdDeleteOutline } from "react-icons/md";
import { useQuery } from "@tanstack/react-query";
import { IoPlayOutline } from "react-icons/io5";
import AppSearchInput from "@/components/ui-elements/DebounceSearchInput";
import AppModal from "@/components/ui-elements/AppModal";
import AppSwitch from "@/components/ui-elements/AppSwitch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useMe } from "@/hooks/useMe";
import { PiStopCircle, PiArrowsClockwise } from "react-icons/pi";
import { PiCircleFill } from "react-icons/pi";
const modal_config: Record<
  number,
  {
    title: string;
    desc: string;
    icon: React.ReactNode;
    variant: "danger" | "primary";
    btn: string;
  }
> = {
  1: {
    title: "Delete Project?",
    btn: "Delete",
    variant: "danger",
    icon: <MdDeleteOutline className="text-red-500" size={28} />,
    desc: "This action cannot be undone. This will permanently delete your project and will stop project !.",
  },
  2: {
    title: "Deploy Project?",
    btn: "Deploy",
    variant: "primary",
    icon: <IoPlayOutline className="text-blue-500" size={28} />,
    desc: "This will start a new deployment using your current configuration.",
  },
  3: {
    title: "Stop Project?",
    btn: "Stop",
    variant: "danger",
    icon: <PiStopCircle className="text-red-500" size={28} />,
    desc: "This will stop the running process on your server.",
  },

  5: {
    title: "Rollback Project?",
    btn: "Rollback",
    variant: "danger",
    icon: <PiArrowsClockwise className="text-yellow-500" size={28} />,
    desc: "This will rollback to the last successful deployment.",
  },
};
const env_config: Record<string, { label: string; className: string }> = {
  development: {
    label: "Development",
    className: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  },
  staging: {
    label: "Staging",
    className: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  },
  production: {
    label: "Production",
    className: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  },
};
import { FormatDate } from "@/helpers/formatDate";
import { PiTerminalWindow } from "react-icons/pi";

const SETTINGS_TABS = [
  { label: "New Projects", value: 0 },
  { label: "Running", value: 1 },
  { label: "Stopped", value: 2 },
];

const status_config: Record<string, { className: string; text: string }> = {
  1: { className: "text-emerald-400", text: "sucess" },
  3: { className: "text-red-400", text: "failed" },
  2: { className: "text-blue-400", text: "running" },
};

const fetchProjects = async (
  page: number,
  limit: number,
  search: string = "",

  type: number = 0,
) => {
  const res = await api.get("/projects", {
    params: { page, limit, search, type },
  });

  return res.data;
};

import { PiDotsThreeVertical } from "react-icons/pi";

import { createPortal } from "react-dom";

function ActionsDropdown({ row, onDelete, onLogs, onRollback }: any) {
  const [open, set_open] = useState(false);
  const [pos, set_pos] = useState({ top: 0, left: 0 });
  const btn_ref = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (
        ref.current &&
        !ref.current.contains(e.target as Node) &&
        btn_ref.current &&
        !btn_ref.current.contains(e.target as Node)
      ) {
        set_open(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function toggle() {
    if (!open && btn_ref.current) {
      const rect = btn_ref.current.getBoundingClientRect();
      set_pos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.right + window.scrollX - 176,
      });
    }
    set_open(!open);
  }

  const menu = (
    <div
      ref={ref}
      style={{ top: pos.top, left: pos.left }}
      className="fixed z-[9999] w-44 bg-[var(--bg-2)] border border-[var(--border-1)] rounded-xl shadow-xl overflow-hidden"
    >
      {[
        {
          label: "Runtime Logs",
          icon: <PiTerminalWindow size={14} />,
          action: onLogs,
        },

        {
          label: "Rollback",
          icon: <PiArrowsClockwise size={14} />,
          action: () => onRollback(row._id),
        },
        {
          label: "Delete",
          icon: <MdDeleteOutline size={14} />,
          action: onDelete,
          danger: true,
        },
      ].map(({ label, icon, action, danger }: any) => (
        <button
          key={label}
          onClick={() => {
            action();
            set_open(false);
          }}
          className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] transition-colors hover:bg-[var(--bg-3)] ${
            danger ? "text-red-400" : "text-[var(--text-2)]"
          }`}
        >
          {icon}
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <div ref={btn_ref}>
        <AppIconButton variant="outline" onClick={toggle}>
          <PiDotsThreeVertical size={18} />
        </AppIconButton>
      </div>
      {open && createPortal(menu, document.body)}
    </>
  );
}

export default function Project() {
  const [page, setPage] = useState(1);
  const { data: UserData } = useMe();
  const [pageSize, setPageSize] = useState(10);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");

  const [modalData, setModalData] = useState<{
    id: string;
    type: number;
  } | null>(null);

  const columns: any[] = [
    { key: "project_name", label: "Project Name" },
    {
      key: "environment",
      label: "Environment",
      render: (_: any, row: any) => {
        const env = env_config[row.environment];

        return (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              {env && (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-medium ${env.className}`}
                >
                  {env.label}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "last_deployed_at",
      label: "Last Deployed",
      render: (_: any, row: any) => {
        const status = status_config[row.last_deployed_status];
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-[12px] text-[var(--text-2)]">
              {FormatDate(row.last_deployed_at)}
            </span>
            {row.last_deployed_status && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] capitalize ${status?.className ?? "text-[var(--text-4)]"}`}
              >
                <PiCircleFill size={7} />
                {status.text}
              </span>
            )}
          </div>
        );
      },
    },
    ...(UserData && UserData.provider && UserData.provider === "github"
      ? [
          {
            key: "enable_webhook",
            label: "WebHook",
            headerClassName: "!text-center",
            render: (_: any, row: any) => (
              <div className="flex justify-center">
                <AppSwitch
                  checked={webhookStates[row._id] ?? row.enable_webhook}
                  onChange={(e) => {
                    handleStatusChange(row._id, e.target.checked);
                  }}
                />
              </div>
            ),
          },
        ]
      : []),

    ,
    {
      key: "actions",
      label: "Actions",
      headerClassName: "!text-center",

      render: (_: any, row: any) => (
        <div className="flex flex-row items-center justify-center gap-2">
          <TooltipWrapper content="Edit">
            <AppIconButton
              variant="outline"
              onClick={() => NavigatePages(row._id)}
            >
              <MdEdit size={18} />
            </AppIconButton>
          </TooltipWrapper>

          <TooltipWrapper content="Deploy">
            <AppIconButton
              variant="outline"
              onClick={() => OpenModal(row._id, 2)}
            >
              <IoPlayOutline size={18} />
            </AppIconButton>
          </TooltipWrapper>

          {row.status === 1 && (
            <TooltipWrapper content="Stop">
              <AppIconButton
                variant="danger"
                onClick={() => OpenModal(row._id, 3)}
              >
                <PiStopCircle size={18} />
              </AppIconButton>
            </TooltipWrapper>
          )}

          <ActionsDropdown
            row={row}
            onDelete={() => OpenModal(row._id, 1)}
            onLogs={() => NavigateToLogs(row._id)}
            onRollback={() => OpenModal(row._id, 5)}
          />
        </div>
      ),
    },
  ];

  const stopMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.post(`/projects/stop`, { id });
    },
    onSuccess: (data: any) => {
      if (data?.data?.is_stopped) {
        toast.success(data.data.msg);
        CloseModal();
        queryClient.invalidateQueries({ queryKey: ["projects"] });
      }
    },
  });

  const rollbackMutation = useMutation({
    mutationFn: async (id: string) => api.post(`/projects/rollback`, { id }),
    onSuccess: (data: any) => {
      if (data?.data?.is_rolled_back) {
        toast.success(data.data.msg);
        CloseModal();
        queryClient.invalidateQueries({ queryKey: ["projects"] });
      } else {
        toast.error(data?.data?.msg || "Rollback failed");
      }
    },
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [webhookStates, setWebhookStates] = useState<Record<string, boolean>>(
    {},
  );

  function handleStatusChange(id: string, status: boolean) {
    setWebhookStates((prev) => ({ ...prev, [id]: status }));

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      statusMutation.mutate(
        { id, status },
        {
          onError: () => {
            setWebhookStates((prev) => ({ ...prev, [id]: !status }));
            toast.error("Failed to update webhook");
          },
        },
      );
    }, 600);
  }

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: boolean }) => {
      return api.patch(`/projects`, { status, id });
    },
    onSuccess: (res: any) => {
      if (res.data.is_enabled) {
        toast.success(res.data.msg);
        queryClient.invalidateQueries({ queryKey: ["projects"] });
      }
    },
  });
  function NavigatePages(id?: string) {
    if (id) {
      router.push(`/projects/edit/${id}`);
      return;
    }
    router.push(`/projects/create`);
  }

  function NavigateToLogs(id: string) {
    router.push(`/projects/runtime-logs/${id}`);
  }
  const [active_tab, setActiveTab] = useState(0);
  const { data: queryData, isLoading } = useQuery({
    queryKey: ["projects", page, pageSize, search, active_tab],
    queryFn: () => fetchProjects(page, pageSize, search, active_tab),
    refetchOnMount: true,
    retry: false,
  });
  function handleSearch(val: string) {
    setSearch(val);
    setPage(1);
  }
  const tableData = queryData?.data || [];
  const total = queryData?.total || 0;

  function CloseModal() {
    setOpen(false);
    setModalData(null);
  }

  function OpenModal(id: string, type: number) {
    setModalData({ id, type });
    setOpen(true);
  }
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/projects/${id}`);
    },
    onSuccess: (data: any) => {
      if (data && data.data.is_deleted) {
        toast.success(data.data.msg);
        CloseModal();
        queryClient.invalidateQueries({ queryKey: ["projects"] });
      }
    },
  });

  const deployMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.post(`/projects/deploy/${id}`);
    },
    onSuccess: (data: any) => {
      if (data?.data?.success) {
        const deploymentId = data?.data?.deployment_id;
        if (deploymentId) {
          toast.success(
            <div className="flex flex-col gap-2">
              <p>{data?.data?.msg || "Deployment started"}</p>

              <button
                onClick={() => {
                  router.push(`/deployments/logs/${deploymentId}`);
                }}
                className="text-blue-400 underline text-sm text-left"
              >
                Click here to view live logs
              </button>
            </div>,
          );
        } else {
          toast.success(data.data.msg || "Deployment started");
        }

        CloseModal();
      } else {
        toast.error(data?.data?.msg || "Deployment failed");
      }
    },
  });

  function SubmitModal() {
    if (!modalData || !modalData.id) return;
    if (modalData.type === 1) {
      deleteMutation.mutate(modalData.id);
      return;
    }
    if (modalData.type === 2) {
      deployMutation.mutate(modalData.id);
      return;
    }
    if (modalData.type === 3) {
      stopMutation.mutate(modalData.id);
      return;
    }

    if (modalData.type === 5) {
      rollbackMutation.mutate(modalData.id);
      return;
    }
  }
  const tabsRef = useRef<HTMLDivElement>(null);

  const [pillStyle, setPillStyle] = useState({ width: 0, x: 0 });

  function SetActiveTabs(val: number) {
    setActiveTab(val);
  }

  useEffect(() => {
    const activeBtn = tabsRef.current?.querySelector<HTMLButtonElement>(
      "[data-active='true']",
    );
    if (activeBtn) {
      setPillStyle({
        width: activeBtn.offsetWidth,
        x: activeBtn.offsetLeft - 3,
      });
    }
  }, [active_tab]);

  return (
    <>
      <div className="  mb-3 flex flex-row items-center gap-2  justify-between">
        <AppSearchInput
          placeholder="Search Projects..."
          debounce={1000}
          onChange={handleSearch}
          fullWidth={false}
          wrapperClassName="w-64"
        />
        <div
          ref={tabsRef}
          className="relative flex gap-0 bg-[var(--bg-1)] border border-[var(--border-1)] rounded-[10px] p-[3px] w-fit"
        >
          <div
            className="absolute top-[3px] h-[calc(100%-6px)] bg-[var(--bg-4)] border border-[var(--border-2)] rounded-[7px] pointer-events-none z-0"
            style={{
              width: pillStyle.width,
              transform: `translateX(${pillStyle.x}px)`,
              transition:
                "transform 0.22s cubic-bezier(0.35,0,0.25,1), width 0.22s cubic-bezier(0.35,0,0.25,1)",
            }}
          />

          {SETTINGS_TABS.map(({ label, value }) => {
            const isActive = value === active_tab;
            return (
              <button
                key={value}
                data-active={isActive}
                onClick={() => SetActiveTabs(value)}
                className={`
              relative z-10 px-3.5 py-1.5 rounded-[7px] text-[13px] font-medium
              border border-transparent transition-colors duration-150 whitespace-nowrap
              ${isActive ? "text-[var(--text-1)]" : "text-[var(--text-4)] hover:text-[var(--text-2)]"}
            `}
              >
                {label}
              </button>
            );
          })}
        </div>
        <TooltipWrapper
          content="Create Project"
          placement="right"
          direction="bottom"
        >
          <AppIconButton onClick={() => NavigatePages()}>
            <FiPlus size={15} className="text-(--bg-0)" />
          </AppIconButton>
        </TooltipWrapper>
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
        open={open}
        onClose={CloseModal}
        title={modal_config[modalData?.type ?? 1]?.title}
        width="400px"
        isLoading={
          deleteMutation.isPending ||
          deployMutation.isPending ||
          stopMutation.isPending ||
          rollbackMutation.isPending
        }
        submit_text={modal_config[modalData?.type ?? 1]?.btn}
        variant={modal_config[modalData?.type ?? 1]?.variant}
        onSubmit={SubmitModal}
      >
        <div className="flex flex-col items-center text-center gap-4 py-2">
          <div
            className={`w-14 h-14 flex items-center justify-center rounded-full ${
              [1, 3].includes(modalData?.type ?? 0)
                ? "bg-red-500/10"
                : "bg-blue-500/10"
            }`}
          >
            {modal_config[modalData?.type ?? 1]?.icon}
          </div>
          <div>
            <h3 className="text-[16px] font-medium text-[var(--text-1)]">
              {modal_config[modalData?.type ?? 1]?.title}
            </h3>
            <p className="text-[13px] text-[var(--text-3)] mt-1">
              {modal_config[modalData?.type ?? 1]?.desc}
            </p>
          </div>
          {modalData?.type === 5 &&
            (() => {
              const row = tableData.find((r: any) => r._id === modalData.id);
              return row?.last_success ? (
                <div className="w-full bg-[var(--bg-2)] border border-[var(--border-1)] rounded-xl px-4 py-3 flex flex-col gap-2 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[var(--text-4)]">
                      Last successful deploy
                    </span>
                    <span className="text-[12px] text-[var(--text-2)]">
                      {FormatDate(row.last_success)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-full bg-[var(--bg-2)] border border-[var(--border-1)] rounded-xl px-4 py-3 text-center">
                  <span className="text-[12px] text-[var(--text-4)]">
                    No successful deployment found to rollback to
                  </span>
                </div>
              );
            })()}
        </div>
      </AppModal>
    </>
  );
}
