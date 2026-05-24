"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { FiMail, FiArrowLeft, FiLock } from "react-icons/fi";
import api from "@/libs/axios";
import "../../globals.css";

type StepOne = { email: string };
type StepTwo = { otp: string };
type StepThree = { password: string; confirm_password: string };

type Step = "email" | "otp" | "reset" | "done";

async function sendOtpFn(data: StepOne) {
  const res = await api.post("/auth/forgot-password", data);
  return res.data;
}

async function verifyOtpFn(data: { email: string; otp: string }) {
  const res = await api.post("/auth/verify-otp", data);
  return res.data;
}

async function resetPasswordFn(data: { email: string; password: string }) {
  const res = await api.post("/auth/reset-password", data);
  return res.data;
}

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");

  const stepOneForm = useForm<StepOne>();
  const stepTwoForm = useForm<StepTwo>();
  const stepThreeForm = useForm<StepThree>();

  const sendOtp = useMutation({
    mutationFn: sendOtpFn,
    onSuccess: (_, vars) => {
      setEmail(vars.email);
      setStep("otp");
    },
  });

  const verifyOtp = useMutation({
    mutationFn: verifyOtpFn,
    onSuccess: (data) => {
      if (data?.success) setStep("reset");
      else
        stepTwoForm.setError("otp", {
          message: data.msg || "Invalid or expired OTP",
        });
    },
  });

  const resetPassword = useMutation({
    mutationFn: resetPasswordFn,
    onSuccess: () => setStep("done"),
  });

  return (
    <div className="flex w-full flex-col items-center h-full flex-1 justify-center ">
      <div className="auth-animate w-full max-w-[60%]">
       
        {step === "email" && (
          <>
            <p
              className="mb-6 text-[13px] leading-relaxed"
              style={{ color: "var(--text-3)" }}
            >
              Enter your email and we&apos;ll send you a 6-digit OTP.
            </p>
            <form
              onSubmit={stepOneForm.handleSubmit((d) => sendOtp.mutate(d))}
              className="flex flex-col gap-4"
              noValidate
            >
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-[12px] font-semibold"
                  style={{ color: "var(--text-3)" }}
                >
                  Email
                </label>
                <div
                  className="auth-input-wrap flex h-[40px] items-center gap-2.5 rounded-[8px] border px-3 transition-colors duration-150"
                  style={{
                    background: "var(--bg-2)",
                    borderColor: stepOneForm.formState.errors.email
                      ? "#f87171"
                      : "var(--border-2)",
                  }}
                >
                  <FiMail
                    size={14}
                    style={{ color: "var(--text-4)", flexShrink: 0 }}
                  />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="min-w-0 flex-1 bg-transparent text-[13px] outline-none"
                    style={{
                      color: "var(--text-1)",
                      caretColor: "var(--accent)",
                    }}
                    {...stepOneForm.register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Enter a valid email",
                      },
                    })}
                  />
                </div>
                {stepOneForm.formState.errors.email && (
                  <p className="text-[11px] text-[#f87171]">
                    {stepOneForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={sendOtp.isPending}
                className="h-[40px] w-full rounded-[8px] text-[13.5px] font-semibold text-white transition-opacity duration-150 hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: "var(--accent)" }}
              >
                {sendOtp.isPending ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>
          </>
        )}

        {/* ── Step 2: OTP ── */}
        {step === "otp" && (
          <>
            <p
              className="mb-6 text-[13px] leading-relaxed"
              style={{ color: "var(--text-3)" }}
            >
              We sent a 6-digit code to{" "}
              <span style={{ color: "var(--text-1)" }}>{email}</span>. Enter it
              below.
            </p>
            <form
              onSubmit={stepTwoForm.handleSubmit((d) =>
                verifyOtp.mutate({ email, otp: d.otp }),
              )}
              className="flex flex-col gap-4"
              noValidate
            >
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-[12px] font-semibold"
                  style={{ color: "var(--text-3)" }}
                >
                  OTP
                </label>
                <div
                  className="auth-input-wrap flex h-[40px] items-center gap-2.5 rounded-[8px] border px-3 transition-colors duration-150"
                  style={{
                    background: "var(--bg-2)",
                    borderColor: stepTwoForm.formState.errors.otp
                      ? "#f87171"
                      : "var(--border-2)",
                  }}
                >
                  <input
                    type="text"
                    placeholder="123456"
                    maxLength={6}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className="min-w-0 flex-1 bg-transparent text-center text-[18px] font-semibold tracking-[0.35em] outline-none"
                    style={{
                      color: "var(--text-1)",
                      caretColor: "var(--accent)",
                    }}
                    {...stepTwoForm.register("otp", {
                      required: "OTP is required",
                      pattern: {
                        value: /^\d{6}$/,
                        message: "Enter the 6-digit code",
                      },
                    })}
                  />
                </div>
                {stepTwoForm.formState.errors.otp && (
                  <p className="text-[11px] text-[#f87171]">
                    {stepTwoForm.formState.errors.otp.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={verifyOtp.isPending}
                className="h-[40px] w-full rounded-[8px] text-[13.5px] font-semibold text-white transition-opacity duration-150 hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: "var(--accent)" }}
              >
                {verifyOtp.isPending ? "Verifying..." : "Verify OTP"}
              </button>

              <button
                type="button"
                disabled={sendOtp.isPending}
                onClick={() => sendOtp.mutate({ email })}
                className="h-[36px] w-full rounded-[8px] text-[13px] font-medium transition-opacity duration-150 hover:opacity-75 disabled:opacity-40"
                style={{
                  background: "var(--bg-2)",
                  border: "1px solid var(--border-2)",
                  color: "var(--text-3)",
                }}
              >
                {sendOtp.isPending ? "Resending..." : "Resend OTP"}
              </button>
            </form>
          </>
        )}

        {step === "reset" && (
          <>
            <p
              className="mb-6 text-[13px] leading-relaxed"
              style={{ color: "var(--text-3)" }}
            >
              Choose a strong new password for{" "}
              <span style={{ color: "var(--text-1)" }}>{email}</span>.
            </p>
            <form
              onSubmit={stepThreeForm.handleSubmit((d) =>
                resetPassword.mutate({ email, password: d.password }),
              )}
              className="flex flex-col gap-4"
              noValidate
            >
              {(["password", "confirm_password"] as const).map((field) => (
                <div key={field} className="flex flex-col gap-1.5">
                  <label
                    className="text-[12px] font-semibold"
                    style={{ color: "var(--text-3)" }}
                  >
                    {field === "password" ? "New password" : "Confirm password"}
                  </label>
                  <div
                    className="auth-input-wrap flex h-[40px] items-center gap-2.5 rounded-[8px] border px-3 transition-colors duration-150"
                    style={{
                      background: "var(--bg-2)",
                      borderColor: stepThreeForm.formState.errors[field]
                        ? "#f87171"
                        : "var(--border-2)",
                    }}
                  >
                    <FiLock
                      size={14}
                      style={{ color: "var(--text-4)", flexShrink: 0 }}
                    />
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="min-w-0 flex-1 bg-transparent text-[13px] outline-none"
                      style={{
                        color: "var(--text-1)",
                        caretColor: "var(--accent)",
                      }}
                      {...stepThreeForm.register(field, {
                        required: "This field is required",
                        ...(field === "password" && {
                          minLength: {
                            value: 8,
                            message: "Minimum 8 characters",
                          },
                        }),
                        ...(field === "confirm_password" && {
                          validate: (v) =>
                            v === stepThreeForm.getValues("password") ||
                            "Passwords do not match",
                        }),
                      })}
                    />
                  </div>
                  {stepThreeForm.formState.errors[field] && (
                    <p className="text-[11px] text-[#f87171]">
                      {stepThreeForm.formState.errors[field]?.message}
                    </p>
                  )}
                </div>
              ))}

              <button
                type="submit"
                disabled={resetPassword.isPending}
                className="h-[40px] w-full rounded-[8px] text-[13.5px] font-semibold text-white transition-opacity duration-150 hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: "var(--accent)" }}
              >
                {resetPassword.isPending ? "Saving..." : "Save New Password"}
              </button>
            </form>
          </>
        )}

        {step === "done" && (
          <div className="flex flex-col gap-3">
            <p
              className="text-[15px] font-bold"
              style={{ color: "var(--text-1)" }}
            >
              Password updated
            </p>
            <p
              className="text-[13px] leading-relaxed"
              style={{ color: "var(--text-3)" }}
            >
              Your password has been reset successfully. You can now sign in
              with your new password.
            </p>
            <Link
              href="/sign-in"
              className="mt-2 flex h-[40px] w-full items-center justify-center rounded-[8px] text-[13.5px] font-semibold text-white transition-opacity duration-150 hover:opacity-85"
              style={{ background: "var(--accent)" }}
            >
              Back to Sign In
            </Link>
          </div>
        )}

        {step !== "done" && (
          <Link
            href="/sign-in"
            className="mt-8 flex items-center gap-1.5 text-[12.5px] transition-colors duration-150 hover:opacity-75"
            style={{ color: "var(--text-4)" }}
          >
            <FiArrowLeft size={13} />
            Back to Sign In
          </Link>
        )}
      </div>
    </div>
  );
}
