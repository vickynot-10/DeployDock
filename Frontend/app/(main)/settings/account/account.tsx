"use client";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { PiUserCircle, PiEnvelope } from "react-icons/pi";
import api from "@/libs/axios";
import { toast } from "react-toastify";
import AppTextInput from "@/components/ui-elements/AppTextInput";
import AppButton from "@/components/ui-elements/AppButton";
import { useMe } from "@/hooks/useMe";
import { useEffect } from "react";
import Skeleton from "react-loading-skeleton";

import { useQueryClient } from "@tanstack/react-query";
type AccountForm = {
  full_name: string;
  email: string;
};

export default function AccountComp() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<AccountForm>();

  const queryClient = useQueryClient();
  const { data, isLoading } = useMe();

  const { mutate, isPending } = useMutation({
    mutationFn: (data: AccountForm) => api.patch("/settings", data),
    onSuccess: (res: any) => {
      
      if (res.data && res.data.isUpdate) {
        toast.success(res.data.msg || "Profile updated successfully");
        queryClient.invalidateQueries({ queryKey: ["me"] });
      }
    },
  });

  useEffect(() => {
    if (data) {
      setValue("full_name", data.name);
      setValue("email", data.email);
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="px-5 py-5 flex flex-col gap-5">
        <Skeleton height={20} width={120} />
        <Skeleton height={40} />

        <Skeleton height={20} width={140} />
        <Skeleton height={40} />

        <div className="flex justify-end pt-1">
          <Skeleton height={35} width={120} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="px-5 py-4 border-b border-[var(--border-1)]">
        <p className="text-[13.5px] font-semibold text-[var(--text-1)]">
          Account Details
        </p>
        <p className="text-[12px] text-[var(--text-4)] mt-0.5">
          Update your name and email address
        </p>
      </div>

      <form
        onSubmit={handleSubmit((d) => mutate(d))}
        className="px-5 py-5 flex flex-col gap-5"
      >
        <AppTextInput
          label="Full Name"
          placeholder="John Doe"
          error={errors.full_name?.message}
          leftIcon={<PiUserCircle size={14} />}
          {...register("full_name", {
            required: "Full name is required",
          })}
        />

        <AppTextInput
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          leftIcon={<PiEnvelope size={14} />}
          {...register("email", {
            required: "Email is required",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Enter a valid email",
            },
          })}
        />

        <div className="flex justify-end pt-1">
          <AppButton type="submit" loading={isPending}>
            Save Changes
          </AppButton>
        </div>
      </form>
    </>
  );
}
