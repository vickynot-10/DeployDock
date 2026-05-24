"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { PiLockSimple, PiEye, PiEyeSlash, PiShieldCheck } from "react-icons/pi";
import AppTextInput from "@/components/ui-elements/AppTextInput";
import AppButton from "@/components/ui-elements/AppButton";
import AppIconButton from "@/components/ui-elements/AppIconButton";
import api from "@/libs/axios";
import { toast } from "react-toastify";
import { useMe } from "@/hooks/useMe";
type ChangePasswordForm = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};

export default function ChangePasswordComp() {
  const [visible, set_visible] = useState({
    current_password: false,
    new_password: false,
    confirm_password: false,
  });
  const { data } = useMe();

  const toggle = (field: keyof typeof visible) =>
    set_visible((prev) => ({ ...prev, [field]: !prev[field] }));

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordForm>();

  const { mutate, isPending } = useMutation({
    mutationFn: (data: ChangePasswordForm) =>
      api.post("/auth/change-password", data),
    onSuccess: (data: any) => {
      if (data && data.data.is_updated) {
        toast.success(data.data.msg || "Password updated successfully");
        reset();
      } else {
        toast.success(data.data.msg);
      }
    },
  });
  if (data && data.provider === "github") {
    return null;
  }

  if (data && data.provider === "app") {
    return (
      <>
        <div className="px-5 py-4 border-b border-[var(--border-1)]">
          <p className="text-[13px] font-semibold text-[var(--text-1)]">
            Change Password
          </p>
          <p className="text-[11.5px] text-[var(--text-4)] mt-0.5">
            Choose a strong password
          </p>
        </div>
        <form
          onSubmit={handleSubmit((d) => mutate(d))}
          className="px-5 py-5 flex flex-col gap-5"
        >
          <div className=" grid grid-cols-2 gap-3">
            <AppTextInput
              label="Current Password"
              placeholder="Enter current password"
              type={visible.current_password ? "text" : "password"}
              leftIcon={<PiLockSimple size={15} />}
              error={errors.current_password?.message}
              {...register("current_password", {
                required: "Current password is required",
              })}
              rightIcon={
                <AppIconButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="pointer-events-auto -mr-1.5"
                  onClick={() => toggle("current_password")}
                >
                  {visible.current_password ? (
                    <PiEyeSlash size={15} />
                  ) : (
                    <PiEye size={15} />
                  )}
                </AppIconButton>
              }
            />

            <AppTextInput
              label="New Password"
              placeholder="Enter new password"
              type={visible.new_password ? "text" : "password"}
              leftIcon={<PiLockSimple size={15} />}
              error={errors.new_password?.message}
              {...register("new_password", {
                required: "New password is required",
                minLength: {
                  value: 8,
                  message: "Minimum 8 characters",
                },
              })}
              rightIcon={
                <AppIconButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="pointer-events-auto -mr-1.5"
                  onClick={() => toggle("new_password")}
                >
                  {visible.new_password ? (
                    <PiEyeSlash size={15} />
                  ) : (
                    <PiEye size={15} />
                  )}
                </AppIconButton>
              }
            />
          </div>

          <AppTextInput
            label="Confirm New Password"
            placeholder="Re-enter new password"
            type={visible.confirm_password ? "text" : "password"}
            leftIcon={<PiLockSimple size={15} />}
            error={errors.confirm_password?.message}
            {...register("confirm_password", {
              required: "Please confirm your password",
              validate: (val) =>
                val === watch("new_password") || "Passwords do not match",
            })}
            rightIcon={
              <AppIconButton
                type="button"
                variant="ghost"
                size="sm"
                className="pointer-events-auto -mr-1.5"
                onClick={() => toggle("confirm_password")}
              >
                {visible.confirm_password ? (
                  <PiEyeSlash size={15} />
                ) : (
                  <PiEye size={15} />
                )}
              </AppIconButton>
            }
          />

          <div className="flex items-center justify-between pt-1">
            <p className="text-[11.5px] text-[var(--text-4)]">
              Min. 8 characters required
            </p>
            <div className=" flex flex-row items-center gap-3">
              <AppButton type="submit" loading={isPending}>
                Update Password
              </AppButton>
            </div>
          </div>
        </form>
      </>
    );
  }
}
