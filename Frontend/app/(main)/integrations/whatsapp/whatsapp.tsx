"use client";
import { useForm, useWatch } from "react-hook-form";
import { PiKey, PiPhone, PiHashStraight } from "react-icons/pi";
import { SiTwilio, SiMeta } from "react-icons/si";
import AppTextInput from "@/components/ui-elements/AppTextInput";
import AppButton from "@/components/ui-elements/AppButton";
import AppCheckbox from "@/components/ui-elements/AppCheckBox";
import api from "@/libs/axios";
import { toast } from "react-toastify";
import Skeleton from "react-loading-skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

type WhatsappForm = {
  whatsapp_provider: "twilio" | "meta";
  active_provider: "twilio" | "meta";
  twilio_account_sid: string;
  twilio_auth_token: string;
  twilio_from_number: string;
  meta_access_token: string;
  meta_phone_number_id: string;
  meta_business_account_id: string;
};

async function GetValues() {
  const res = await api.get(`/integrations/whatsapp`);
  return res.data;
}

export default function WhatsappIntegrationComp() {
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<WhatsappForm>({
    defaultValues: { whatsapp_provider: "twilio", active_provider: "twilio" },
  });

  const whatsapp_provider = useWatch({ control, name: "whatsapp_provider" });
  const active_provider = useWatch({ control, name: "active_provider" });
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (data: WhatsappForm) => api.post("/integrations/whatsapp", data),
    onSuccess: (res: any) => {
      if (res.data?.success) toast.success(res.data.msg || "WhatsApp settings saved");
      queryClient.invalidateQueries({ queryKey: ["whatsapp"] });
    },
  });

  const updateActiveProvider = useMutation({
    mutationFn: (provider: string) =>
      api.patch("/integrations", { whatsapp_provider: provider, type: "whatsapp" }),
    onSuccess: (res: any) => {
      if (res.data?.success) toast.success(res.data.msg || "Active provider updated");
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["whatsapp"],
    queryFn: GetValues,
    refetchOnMount: false,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  useEffect(() => {
    if (!data || !data.data) return;
    const d = data.data;
    reset({
      whatsapp_provider: d.provider || "twilio",
      active_provider: d.automation_provider === 2 ? "meta" : "twilio",
      twilio_account_sid: d.twilio_account_sid || "",
      twilio_auth_token: d.twilio_auth_token || "",
      twilio_from_number: d.twilio_from_number || "",
      meta_access_token: d.meta_access_token || "",
      meta_phone_number_id: d.meta_phone_number_id || "",
      meta_business_account_id: d.meta_business_account_id || "",
    });
  }, [data, reset]);

  if (isLoading) {
    return (
      <>
        <div className="px-5 py-4 border-b border-[var(--border-1)]">
          <Skeleton width={160} height={14} />
          <Skeleton width={240} height={12} className="mt-1" />
        </div>
        <div className="px-5 py-5 flex flex-col gap-5">
          <div className="flex flex-row items-center justify-between">
            <div className="flex flex-col gap-2">
              <Skeleton width={60} height={12} />
              <div className="flex gap-3">
                <Skeleton width={90} height={38} borderRadius={8} />
                <Skeleton width={130} height={38} borderRadius={8} />
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
          <Skeleton height={58} borderRadius={8} />
          <div className="flex justify-end pt-1">
            <Skeleton width={110} height={36} borderRadius={8} />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="px-5 py-4 border-b border-[var(--border-1)]">
        <p className="text-[13.5px] font-semibold text-[var(--text-1)]">WhatsApp Integration</p>
        <p className="text-[12px] text-[var(--text-4)] mt-0.5">Configure your WhatsApp messaging provider</p>
      </div>

      <form onSubmit={handleSubmit((d) => mutate(d))} className="px-5 py-5 flex flex-col gap-5">
        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-col gap-2">
            <p className="text-[12px] font-medium text-[var(--text-3)]">Provider</p>
            <div className="flex gap-3">
              {([
                { value: "twilio", label: "Twilio", Icon: SiTwilio },
                { value: "meta", label: "Meta Cloud API", Icon: SiMeta },
              ] as const).map(({ value, label, Icon }) => (
                <label
                  key={value}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors duration-150 select-none
                    ${whatsapp_provider === value
                      ? "border-[var(--accent)] bg-[var(--accent-tint)] text-[var(--text-1)]"
                      : "border-[var(--border-1)] bg-[var(--bg-2)] text-[var(--text-3)] hover:bg-[var(--bg-3)]"
                    }`}
                >
                  <input type="radio" value={value} className="hidden" {...register("whatsapp_provider")} />
                  <span
                    className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                      ${whatsapp_provider === value ? "border-[var(--accent)]" : "border-[var(--border-2)]"}`}
                  >
                    {whatsapp_provider === value && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                    )}
                  </span>
                  <Icon size={13} />
                  <span className="text-[13px] font-medium">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[12px] font-medium text-[var(--text-3)]">Provider Use for Automation</p>
            <div className="flex gap-4 mt-1">
              {(["twilio", "meta"] as const).map((p) => (
                <label key={p} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value={p} className="hidden" {...register("active_provider")} />
                  <AppCheckbox
                    checked={active_provider === p}
                    disabled={updateActiveProvider.isPending}
                    onChange={() => {
                      setValue("active_provider", p);
                      updateActiveProvider.mutate(p);
                    }}
                  />
                  <span className="text-[13px] text-[var(--text-2)]">
                    {p === "meta" ? "Meta Cloud API" : "Twilio"}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {whatsapp_provider === "twilio" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <AppTextInput
                label="Account SID"
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                leftIcon={<PiHashStraight size={14} />}
                error={errors.twilio_account_sid?.message}
                {...register("twilio_account_sid", { required: "Account SID is required" })}
              />
              <AppTextInput
                label="Auth Token"
                placeholder="••••••••••••••••••••••••••••••••"
                type="password"
                leftIcon={<PiKey size={14} />}
                error={errors.twilio_auth_token?.message}
                {...register("twilio_auth_token", { required: "Auth token is required" })}
              />
            </div>
            <AppTextInput
              label="From Number"
              placeholder="+1415XXXXXXX"
              leftIcon={<PiPhone size={14} />}
              error={errors.twilio_from_number?.message}
              {...register("twilio_from_number", { required: "From number is required" })}
            />
          </>
        )}

        {whatsapp_provider === "meta" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <AppTextInput
                label="Phone Number ID"
                placeholder="1234567890"
                leftIcon={<PiHashStraight size={14} />}
                error={errors.meta_phone_number_id?.message}
                {...register("meta_phone_number_id", { required: "Phone number ID is required" })}
              />
              <AppTextInput
                label="Business Account ID"
                placeholder="1234567890"
                leftIcon={<PiHashStraight size={14} />}
                error={errors.meta_business_account_id?.message}
                {...register("meta_business_account_id", { required: "Business account ID is required" })}
              />
            </div>
            <AppTextInput
              label="Access Token"
              placeholder="EAAxxxxxxxxxxxxxxxx"
              type="password"
              leftIcon={<PiKey size={14} />}
              error={errors.meta_access_token?.message}
              {...register("meta_access_token", { required: "Access token is required" })}
            />
          </>
        )}

        <div className="flex justify-end pt-1">
          <AppButton type="submit" loading={isPending}>Save Changes</AppButton>
        </div>
      </form>
    </>
  );
}