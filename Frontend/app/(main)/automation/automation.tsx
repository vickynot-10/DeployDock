"use client";
import AppTable from "@/components/ui-elements/AppTable";
import { useState } from "react";
import TooltipWrapper from "@/helpers/tooltipWrapper";
import AppIconButton from "@/components/ui-elements/AppIconButton";
import api from "@/libs/axios";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { APP_CONSTANTS } from "@/app_constants";
import { toast } from "react-toastify";
import AppSwitch from "@/components/ui-elements/AppSwitch";

import Link from "next/link";
function getRepoName(url: string) {
  try {
    const parts = url.split("/");
    let name = parts[parts.length - 1];
    return name.replace(".git", "");
  } catch {
    return url;
  }
}

const fetchAutomations = async (page: number, limit: number) => {
  const res = await api.get("/automations", { params: { page, limit } });
  return res.data;
};

export default function Automation() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: queryData, isLoading } = useQuery({
    queryKey: ["automations", page, pageSize],
    queryFn: () => fetchAutomations(page, pageSize),
    refetchOnMount: true,
    retry: false,
  });

  const tableData = queryData?.data || [];
  const total = queryData?.total || 0;

  const columns: any = [
    { key: "project_name", label: "Project Name" },
    { key: "deploy_target", label: "Deployed Target" },

    {
      key: "repo_url",
      label: "Repo",
      
      render: (val: string) => {
        const repoName = getRepoName(val);

        return (
          <Link
            href={val}
            target="_blank"
            onClick={(e) => e.stopPropagation()}
            className="px-2 py-1 m-0 bg-[var(--bg-3)] hover:bg-[var(--bg-4)] rounded-md text-xs transition"
          >
            {repoName}
          </Link>
        );
      },
    },
    { key: "branch", label: "Branch" },
    {
      key: "enable_webhook",
      label: "WebHook",
      headerClassName: "!text-center",
      render: (_: any, row: any) => (
        <div className="flex justify-center">
          <AppSwitch
            checked={row.enable_webhook}
            onChange={(e) => {
              handleStatusChange(row._id, e.target.checked);
            }}
            disabled={statusMutation.isPending}
          />
        </div>
      ),
    },

    {
      key: "actions",
      label: "Actions",
      headerClassName: "!text-center",
      render: (_: any, row: any) => (
        <div className="flex flex-row items-center w-full justify-center gap-3">
          <TooltipWrapper content="Trigger Automation">
            <AppIconButton
              variant="secondary"
              onClick={() => NavigatePages(row._id)}
            >
              <img src={APP_CONSTANTS.ICONS.automation} alt="Automation" />
            </AppIconButton>
          </TooltipWrapper>

          
        </div>
      ),
    },
  ];

  function NavigatePages(id: string) {
    if (!id) return;
     router.push(`/automation/${id}`);
  }

  function handleStatusChange(id: string, status: boolean) {
    statusMutation.mutate({ id, status });
  }

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: boolean }) => {
      return api.patch(`/projects`, { status, id });
    },
    onSuccess: (res: any) => {
      if (res.data.is_enabled) {
        toast.success(res.data.msg);
        queryClient.invalidateQueries({ queryKey: ["automations"] });
      }
    },
  });
  return (
    <>
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
    </>
  );
}
