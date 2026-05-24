"use client";
import { useForm, useWatch } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { APP_CONSTANTS } from "@/app_constants";
import {
  PiEnvelope,
  PiKey,
  PiUser,
  PiGlobe,
  PiHashStraight,
  PiBracketsCurly,
} from "react-icons/pi";
import AppTextInput from "@/components/ui-elements/AppTextInput";
import AppButton from "@/components/ui-elements/AppButton";
import AppCheckbox from "@/components/ui-elements/AppCheckBox";
import api from "@/libs/axios";
import { toast } from "react-toastify";
import Skeleton from "react-loading-skeleton";

type EmailForm = {
  email_provider: "smtp" | "zeptomail";
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  smtp_password: string;
  smtp_from: string;
  zepto_url: string;
  zepto_api_key: string;
  zepto_from: string;
  active_provider: "smtp" | "zeptomail";
};

async function GetValues() {
  const res = await api.get(`/integrations/mail`);
  return res.data;
}

export default function EmailIntegrationComp() {
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<EmailForm>({
    defaultValues: { email_provider: "smtp", active_provider: "smtp" },
  });

  const email_provider = useWatch({ control, name: "email_provider" });
  const active_provider = useWatch({ control, name: "active_provider" });
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (data: EmailForm) => api.post("/integrations/mail", data),
    onSuccess: (res: any) => {
      if (res.data?.success)
        toast.success(res.data.msg || "Email settings saved");
      queryClient.invalidateQueries({ queryKey: ["mail"] });
    },
  });

  const updateActiveProvider = useMutation({
    mutationFn: (provider: string) =>
      api.patch("/integrations", {
        email_provider: provider,
        type: "mail",
      }),

    onSuccess: (res: any) => {
      if (res.data?.success) {
        toast.success(res.data.msg || "Active provider updated");
      }
    },
  });

  const { data , isLoading} = useQuery({
    queryKey: ["mail"],
    queryFn: GetValues,
    refetchOnMount: false,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  useEffect(() => {
    if (!data || !data.data) return;
    const d = data.data;
    const provider =
      d.provider === APP_CONSTANTS.INTEGRATIONS_EMAIL.SMTP
        ? "smtp"
        : "zeptomail";

    reset({
      email_provider: provider,
      active_provider: d.automation_provider === 1 ? "smtp" : "zeptomail",
      smtp_host: d.smtp_host || "",
      smtp_port: d.smtp_port || "",
      smtp_user: d.smtp_user || "",
      smtp_password: d.smtp_password || "",
      smtp_from: d.smtp_from || "",
      zepto_url: d.zepto_url || "",
      zepto_api_key: d.zepto_api_key || "",
      zepto_from: d.zepto_from || "",
    });
  }, [data, reset]);

  if(isLoading) {
    return    <>
      <div className="px-5 py-4 border-b border-[var(--border-1)]">
        <Skeleton width={140} height={14} />
        <Skeleton width={220} height={12} className="mt-1" />
      </div>

      <div className="px-5 py-5 flex flex-col gap-5">
        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-col gap-2">
            <Skeleton width={60} height={12} />
            <div className="flex gap-3">
              <Skeleton width={90} height={38} borderRadius={8} />
              <Skeleton width={110} height={38} borderRadius={8} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton width={180} height={12} />
            <div className="flex gap-4 mt-1">
              <Skeleton width={80} height={20} />
              <Skeleton width={100} height={20} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Skeleton height={58} borderRadius={8} />
          <Skeleton height={58} borderRadius={8} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton height={58} borderRadius={8} />
          <Skeleton height={58} borderRadius={8} />
        </div>
        <Skeleton height={58} borderRadius={8} />

        <div className="flex justify-end pt-1">
          <Skeleton width={110} height={36} borderRadius={8} />
        </div>
      </div>
    </>
  }

  return (
    <>
      <div className="px-5 py-4 border-b border-[var(--border-1)]">
        <p className="text-[13.5px] font-semibold text-[var(--text-1)]">
          Email Integration
        </p>
        <p className="text-[12px] text-[var(--text-4)] mt-0.5">
          Configure your outgoing email provider
        </p>
      </div>

      <form
        onSubmit={handleSubmit((d) => mutate(d))}
        className="px-5 py-5 flex flex-col gap-5"
      >
        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-col gap-2">
            <p className="text-[12px] font-medium text-[var(--text-3)]">
              Provider
            </p>
            <div className="flex gap-3">
              {(["smtp", "zeptomail"] as const).map((p) => (
                <label
                  key={p}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors duration-150 select-none
                    ${
                      email_provider === p
                        ? "border-[var(--accent)] bg-[var(--accent-tint)] text-[var(--text-1)]"
                        : "border-[var(--border-1)] bg-[var(--bg-2)] text-[var(--text-3)] hover:bg-[var(--bg-3)]"
                    }`}
                >
                  <input
                    type="radio"
                    value={p}
                    className="hidden"
                    {...register("email_provider")}
                  />
                  <span
                    className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                      ${email_provider === p ? "border-[var(--accent)]" : "border-[var(--border-2)]"}`}
                  >
                    {email_provider === p && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                    )}
                  </span>
                  <span className="text-[13px] font-medium capitalize">
                    {p === "zeptomail" ? "ZeptoMail" : "SMTP"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[12px] font-medium text-[var(--text-3)]">
              Provider Use for Automation
            </p>
            <div className="flex gap-4 mt-1">
              {(["smtp", "zeptomail"] as const).map((p) => (
                <label
                  key={p}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    value={p}
                    className="hidden"
                    {...register("active_provider")}
                  />
                  <AppCheckbox
                    checked={active_provider === p}
                    disabled={updateActiveProvider.isPending}
                    onChange={() => {
                      setValue("active_provider", p);

                      updateActiveProvider.mutate(p);
                    }}
                  />
                  <span className="text-[13px] text-[var(--text-2)]">
                    {p === "zeptomail" ? "ZeptoMail" : "SMTP"}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {email_provider === "smtp" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <AppTextInput
                label="SMTP Host"
                placeholder="smtp.example.com"
                leftIcon={<PiGlobe size={14} />}
                error={errors.smtp_host?.message}
                {...register("smtp_host", {
                  required: "SMTP host is required",
                })}
              />
              <AppTextInput
                label="SMTP Port"
                placeholder="587"
                leftIcon={<PiHashStraight size={14} />}
                error={errors.smtp_port?.message}
                {...register("smtp_port", {
                  required: "SMTP port is required",
                })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <AppTextInput
                label="SMTP User"
                placeholder="you@example.com"
                leftIcon={<PiUser size={14} />}
                error={errors.smtp_user?.message}
                {...register("smtp_user", {
                  required: "SMTP user is required",
                })}
              />
              <AppTextInput
                label="SMTP Password"
                placeholder="••••••••"
                type="password"
                leftIcon={<PiKey size={14} />}
                error={errors.smtp_password?.message}
                {...register("smtp_password", {
                  required: "SMTP password is required",
                })}
              />
            </div>
            <AppTextInput
              label="From Address"
              placeholder="no-reply@example.com"
              leftIcon={<PiEnvelope size={14} />}
              error={errors.smtp_from?.message}
              {...register("smtp_from", {
                required: "From address is required",
              })}
            />
          </>
        )}

        {email_provider === "zeptomail" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <AppTextInput
                label="ZeptoMail URL"
                placeholder="api.zeptomail.com"
                leftIcon={<PiBracketsCurly size={14} />}
                error={errors.zepto_url?.message}
                {...register("zepto_url", { required: "URL is required" })}
              />
              <AppTextInput
                label="ZeptoMail API Key"
                placeholder="Zeptomail API key"
                leftIcon={<PiKey size={14} />}
                error={errors.zepto_api_key?.message}
                {...register("zepto_api_key", {
                  required: "API key is required",
                })}
              />
            </div>
            <AppTextInput
              label="From Address"
              placeholder="no-reply@example.com"
              leftIcon={<PiEnvelope size={14} />}
              error={errors.zepto_from?.message}
              {...register("zepto_from", {
                required: "From address is required",
              })}
            />
          </>
        )}

        <div className="flex justify-end pt-1">
          <AppButton type="submit" loading={isPending}>
            Save Changes
          </AppButton>
        </div>
      </form>
    </>
  );
}
