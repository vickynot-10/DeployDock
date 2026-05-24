"use client";
import AppTable from "@/components/ui-elements/AppTable";
import { useState } from "react";
import { FiPlus } from "react-icons/fi";
import TooltipWrapper from "@/helpers/tooltipWrapper";
import AppIconButton from "@/components/ui-elements/AppIconButton";
import api from "@/libs/axios";
import AppCheckBox from "@/components/ui-elements/AppCheckBox";
import { useRouter } from "next/navigation";
import { MdEdit, MdDeleteOutline } from "react-icons/md";
import { useQuery } from "@tanstack/react-query";
import AppModal from "@/components/ui-elements/AppModal";
import AppSwitch from "@/components/ui-elements/AppSwitch";
import AppButton from "@/components/ui-elements/AppButton";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { TbServer } from "react-icons/tb";
import { SiDocker } from "react-icons/si";

import AppSearchInput from "@/components/ui-elements/DebounceSearchInput";


const fetchServers = async (
  page: number,
  limit: number,
  search: string = "",
) => {
  const res = await api.get("/servers", {
    params: { page, limit, search },
  });

  return res.data;
};

export default function ServersPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const [modalState, setModalState] = useState<{
    ids: string[];
  } | null>(null);

  function handleStatusChange(id: string, status: boolean) {
    statusMutation.mutate({ id, status });
  }

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: boolean }) => {
      return api.patch(`/servers`, { status, id });
    },
    onSuccess: (res: any) => {
      if (res.data.is_enabled) {
        toast.success(res.data.msg);
        queryClient.invalidateQueries({ queryKey: ["servers"] });
      }
    },
  });
  function NavigatePages(id?: string) {
    if (id) {
      router.push(`/servers/edit/${id}`);
      return;
    }
    router.push(`/servers/create`);
  }

  const { data: queryData, isLoading } = useQuery({
    queryKey: ["servers", page, pageSize, search],
    queryFn: () => fetchServers(page, pageSize, search),
    refetchOnMount: true,
    retry: false,
  });

  const tableData = queryData?.data || [];
  const total = queryData?.total || 0;

  const [selected, setSelected] = useState<string[]>([]);

  const selectableIds: string[] = tableData.map((r: any) => r._id);
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

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => api.post(`/servers/bulk-delete`, { ids }),
    onSuccess: (res: any) => {
      toast.success(res.data?.msg || "Servers deleted");
      setSelected([]);
      queryClient.invalidateQueries({ queryKey: ["servers"] });
    },
  });

  function CloseModal() {
    setOpen(false);
    setModalState(null);
  }

  function openDeleteModal(ids: string[]) {
    setModalState({ ids });
    setOpen(true);
  }
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/servers/${id}`);
    },
    onSuccess: (data: any) => {
      if (data && data.data.is_deleted) {
        toast.success(data.data.msg);
        CloseModal();
        queryClient.invalidateQueries({ queryKey: ["servers"] });
      }
    },
  });
  function handleDelete() {
    if (!modalState?.ids?.length) return;

    if (modalState.ids.length === 1) {
      deleteMutation.mutate(modalState.ids[0]);
    } else {
      bulkDeleteMutation.mutate(modalState.ids);
    }
    CloseModal();
  }
  const columns: any[] = [
    {
      key: "checkbox",
      label: (
        <AppCheckBox
          checked={isAllSelected}
          indeterminate={isIndeterminate}
          onChange={toggleAll}
        />
      ),
      headerClassName: "!w-10",
      render: (_: any, row: any) => {
        return (
          <AppCheckBox
            checked={selected.includes(row._id)}
            onChange={() => toggleOne(row._id)}
          />
        );
      },
    },
    { key: "name", label: "Server Name" },
 

    {
      key: "status",
      label: "Status",
      headerClassName: "!text-center",
      render: (_: any, row: any) => (
        <div className="flex justify-center">
          <AppSwitch
            checked={row.status}
            onChange={(e) => {
              handleStatusChange(row._id, e.target.checked);
            }}
            disabled={statusMutation.isPending}
          />
        </div>
      ),
    },

    ,
    {
      key: "actions",
      label: "Actions",
      headerClassName: "!text-center",
      render: (_: any, row: any) => {
        return (
          <div className=" flex flex-row items-center w-full justify-center gap-3">
            <TooltipWrapper content="Edit Server Details">
              <AppIconButton
                variant="secondary"
                onClick={() => NavigatePages(row._id)}
              >
                <MdEdit color="white" size={18} />
              </AppIconButton>
            </TooltipWrapper>

            <TooltipWrapper content="Delete Server Details">
              <AppIconButton
                variant="danger"
                onClick={() => openDeleteModal([row._id])}
              >
                <MdDeleteOutline color="white" size={18} />
              </AppIconButton>
            </TooltipWrapper>
          </div>
        );
      },
    },
  ];
  function handleSearch(val: string) {
    setSearch(val);
    setPage(1);
  }

  return (
    <>
      <div className="  mb-3 flex flex-row items-center gap-2  justify-between">
        <AppSearchInput
          placeholder="Search Servers..."
          debounce={1000}
          onChange={handleSearch}
          fullWidth={false}
          wrapperClassName="w-64"
        />
        <TooltipWrapper
          content="Create Server Details"
          placement="right"
          direction="bottom"
        >
          <AppIconButton onClick={() => NavigatePages()}>
            <FiPlus size={15} className="text-(--bg-0)" />
          </AppIconButton>
        </TooltipWrapper>

        {selected.length > 0 && (
          <AppButton
            variant="danger"
            size="sm"
            onClick={() => openDeleteModal(selected)}
          >
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
        open={open}
        onClose={CloseModal}
        title={"Confirm Delete"}
        width="400px"
        submit_text="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending || bulkDeleteMutation.isPending}
        onSubmit={handleDelete}
      >
        <div className="flex flex-col items-center text-center gap-4 py-2">
          <div
            className={`w-14 h-14 flex items-center justify-center rounded-full bg-red-500/10"
            }`}
          >
            <MdDeleteOutline className="text-red-500" size={28} />
          </div>

          <div>
            <h3 className="text-[16px] font-medium text-[var(--text-1)]">
              {modalState?.ids.length === 1
                ? "Delete Server?"
                : `Delete ${modalState?.ids.length} Servers?`}
            </h3>

            <p className="text-[13px] text-[var(--text-3)] mt-1">
              This action cannot be undone. This will permanently delete the
              selected server
              {modalState && modalState.ids.length > 1 ? "s" : ""}.
            </p>
          </div>
        </div>
      </AppModal>
    </>
  );
}
