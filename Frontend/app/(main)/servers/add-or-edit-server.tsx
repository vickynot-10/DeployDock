"use client";
import { useForm, Controller } from "react-hook-form";
import { useEffect } from "react";
import AppTextInput from "@/components/ui-elements/AppTextInput";
import AppButton from "@/components/ui-elements/AppButton";
import AppTextArea from "@/components/ui-elements/AppTextArea";
import { useMutation, useQuery } from "@tanstack/react-query";
import BreadCrumbs from "@/components/ui-elements/BreadCrumbs";
import { toast } from "react-toastify";
import Skeleton from "react-loading-skeleton";
import api from "@/libs/axios";
import { useRouter } from "next/navigation";
import Loader from "@/components/ui-elements/Loader";

import { IoArrowBack } from "react-icons/io5";
import TooltipWrapper from "@/helpers/tooltipWrapper";
import AppIconButton from "@/components/ui-elements/AppIconButton";
type ServerFormValues = {
  name: string;
  ssh_host?: string;
  ssh_user?: string;
  ssh_key?: string;
  vercel_token?: string;
  vercel_project_id?: string;
  netlify_token?: string;
  netlify_site_id?: string;
};

async function save_server(data: ServerFormValues, id?: string) {
  const payload = id ? { ...data, id } : data;
  const res = await api.post("/servers", payload);
  return res.data;
}

async function get_server_by_id(id: string) {
  const res = await api.get(`/servers/${id}`);
  return res.data;
}

type Props = { id?: string };

export default function AddOrEditServer({ id }: Props) {
  const {
    register,
    reset,
    watch,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ServerFormValues>();

  const router = useRouter();

  const { data: server_data, isLoading: server_loading } = useQuery({
    queryKey: ["server", id],
    queryFn: () => get_server_by_id(id!),
    enabled: !!id,
    refetchOnMount: true,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: ServerFormValues) => save_server(data, id),
    onSuccess: (data: any) => {
      if (data.is_created || data.is_updated) {
        toast.success(
          data.msg || (data.is_created ? "Server Added" : "Server Updated"),
        );
        go_back();
      } else {
        toast.error(data.msg || "An error occurred");
      }
    },
  });

  useEffect(() => {
    if (server_data?.data) reset(server_data.data);
  }, [server_data, reset]);

  function go_back() {
    router.push("/servers");
  }

  const on_submit = (data: ServerFormValues) => mutate(data);

  const breadcrumb_items = [
    { label: "Servers", url: "/servers", active: false },
    { label: id ? "Edit Server" : "Add Server", active: true },
  ];

  if (id && server_loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton height={20} width={200} borderRadius={6} />
        <div className="grid grid-cols-4 gap-2.5">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} height={72} borderRadius={10} />
          ))}
        </div>
        <div className="flex flex-col gap-2.5 mt-1">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} height={44} borderRadius={8} />
          ))}
        </div>
        <div className="flex justify-end gap-4 mt-2">
          <Skeleton height={40} width={90} borderRadius={8} />
          <Skeleton height={40} width={90} borderRadius={8} />
        </div>
      </div>
    );
  }

  return (
    <>
     <div className=" flex  mb-3 flex-row items-center justify-between  w-full" >
          <div>
            
           <TooltipWrapper content="Go Back" direction="bottom" placement="left" >
            <AppIconButton variant="outline" onClick={go_back}>
              <IoArrowBack  />
            </AppIconButton>
          </TooltipWrapper>
          </div>
          
          <BreadCrumbs items={breadcrumb_items} />
        </div>
      <form
        onSubmit={handleSubmit(on_submit)}
        className="flex flex-col gap-4"
        noValidate
      >
        <AppTextInput
          placeholder="e.g. My DigitalOcean VPS"
          {...register("name", { required: "Server name is required" })}
          className="h-11"
          error={errors.name?.message}
        />

        <div className="grid grid-cols-2 gap-2.5">
          <AppTextInput
            placeholder="192.168.1.1 or example.com"
            {...register("ssh_host", { required: "SSH host is required" })}
            className="h-11"
            error={errors.ssh_host?.message}
          />
          <AppTextInput
            placeholder="SSH user (e.g. root, ubuntu)"
            {...register("ssh_user", { required: "SSH user is required" })}
            className="h-11"
            error={errors.ssh_user?.message}
          />
        </div>
        <AppTextArea
          placeholder={
            "Paste your SSH private key\n-----BEGIN OPENSSH PRIVATE KEY-----\n...\n-----END OPENSSH PRIVATE KEY-----"
          }
          rows={8}
          {...register("ssh_key", { required: "SSH key is required" })}
          error={errors.ssh_key?.message}
        />

        <div className="flex flex-row items-center justify-end gap-4 mt-2">
          <AppButton
            variant="secondary"
            type="button"
            onClick={go_back}
            disabled={isPending}
          >
            Go Back
          </AppButton>
          <AppButton variant="primary" type="submit" disabled={isPending}>
            {isPending ? <Loader color="black" /> : id ? "Update" : "Save"}
          </AppButton>
        </div>
      </form>
    </>
  );
}
