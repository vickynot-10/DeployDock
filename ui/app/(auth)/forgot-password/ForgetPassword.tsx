"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, Variants, AnimatePresence } from "motion/react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  useUpdatePassword,
  useSendOTP,
  useVerifyOTP,
} from "@/hooks/queries/useAuth";
import {
  SendOTPFormValues,
  VerifyOTPFormValues,
  UpdatePasswordFormValues,
} from "@/types/auth.types";

const fieldVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.4, ease: "easeOut" as const },
  }),
};

type Step = "email" | "otp" | "password";

const RESEND_SECONDS = 60;

export default function ForgetPassword() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { mutate: sendOTP, isPending: sending } = useSendOTP();
  const { mutate: verifyOTP, isPending: verifying } = useVerifyOTP();
  const { mutate: updatePassword, isPending: changing } = useUpdatePassword();

  const startCooldown = () => {
    setCooldown(RESEND_SECONDS);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ---- Step 1: Email ----
  const emailForm = useForm<SendOTPFormValues>();

  const onSendOtp = (data: SendOTPFormValues) => {
    sendOTP(data, {
      onSuccess: (res) => {
        if (res.success) {
          setEmail(data.email);
          setStep("otp");
          startCooldown();
        }
      },
    });
  };

  // ---- Step 2: OTP ----
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");

  const onVerifyOtp = () => {
    if (otp.length !== 6) {
      setOtpError("Enter the 6-digit code");
      return;
    }
    setOtpError("");
    const payload: VerifyOTPFormValues = { email, otp };
    verifyOTP(payload, {
      onSuccess: (res) => {
        if (res.success) {
          setStep("password");
        } else {
          setOtpError("Invalid or expired code");
        }
      },
      onError: () => setOtpError("Invalid or expired code"),
    });
  };

  const onResend = () => {
    if (cooldown > 0) return;
    sendOTP(
      { email },
      {
        onSuccess: (res) => {
          if (res.success) {
            setOtp("");
            startCooldown();
          }
        },
      },
    );
  };

  // ---- Step 3: New password ----
  const passwordForm = useForm<
    UpdatePasswordFormValues & { confirm: string }
  >();

  const onUpdatePassword = (
    data: UpdatePasswordFormValues & { confirm: string },
  ) => {
    if (data.password !== data.confirm) {
      passwordForm.setError("confirm", {
        message: "Passwords do not match",
      });
      return;
    }
    updatePassword({ email, password: data.password });
  };

  return (
    <div className=" min-h-screen w-full flex items-center justify-center bg-background p-4">
      <div className="rounded-3xl border border-border bg-card p-3 shadow-sm w-full max-w-md">
        <div className="grid grid-cols-1 gap-3">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col justify-center p-4"
          >
            <motion.h1
              variants={fieldVariants}
              custom={0}
              initial="hidden"
              animate="visible"
              className="text-3xl font-bold text-foreground"
            >
              {step === "email" && "Forgot Password"}
              {step === "otp" && "Verify Code"}
              {step === "password" && "Set New Password"}
            </motion.h1>

            <motion.p
              variants={fieldVariants}
              custom={1}
              initial="hidden"
              animate="visible"
              className="mt-2 text-sm text-muted-foreground"
            >
              {step === "email" &&
                "Enter your email and we'll send you a reset code."}
              {step === "otp" && (
                <>
                  We sent a 6-digit code to{" "}
                  <span className="text-foreground font-medium">{email}</span>
                </>
              )}
              {step === "password" && "Choose a new password for your account."}
            </motion.p>

            {/* Step indicator */}
            <motion.div
              variants={fieldVariants}
              custom={2}
              initial="hidden"
              animate="visible"
              className="mt-6 flex items-center gap-2"
            >
              {(["email", "otp", "password"] as Step[]).map((s, i) => (
                <div
                  key={s}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    ["email", "otp", "password"].indexOf(step) >= i
                      ? "bg-foreground"
                      : "bg-border"
                  }`}
                />
              ))}
            </motion.div>

            <AnimatePresence mode="wait">
              {step === "email" && (
                <motion.form
                  key="email-step"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={emailForm.handleSubmit(onSendOtp)}
                  className="mt-8 space-y-5"
                  noValidate
                >
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-sm font-semibold text-foreground"
                    >
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Email"
                      aria-invalid={!!emailForm.formState.errors.email}
                      {...emailForm.register("email", {
                        required: "Email is required",
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: "Enter a valid email address",
                        },
                      })}
                    />
                    {emailForm.formState.errors.email && (
                      <p className="text-xs text-destructive">
                        {emailForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      disabled={sending}
                      className="w-full py-6 text-sm font-semibold"
                    >
                      {sending ? "Sending Code..." : "Send Code"}
                    </Button>
                  </motion.div>
                </motion.form>
              )}

              {step === "otp" && (
                <motion.div
                  key="otp-step"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.25 }}
                  className="mt-8 space-y-5"
                >
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={(val) => {
                        setOtp(val);
                        if (otpError) setOtpError("");
                      }}
                    >
                      <InputOTPGroup>
                        {Array.from({ length: 6 }).map((_, i) => (
                          <InputOTPSlot key={i} index={i} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  {otpError && (
                    <p className="text-xs text-destructive text-center">
                      {otpError}
                    </p>
                  )}

                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="button"
                      onClick={onVerifyOtp}
                      disabled={verifying || otp.length !== 6}
                      className="w-full py-6 text-sm font-semibold"
                    >
                      {verifying ? "Verifying..." : "Verify Code"}
                    </Button>
                  </motion.div>

                  <p className="text-center text-sm text-muted-foreground">
                    Didn&apos;t get the code?{" "}
                    <button
                      type="button"
                      onClick={onResend}
                      disabled={cooldown > 0 || sending}
                      className="font-medium text-foreground underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
                    >
                      {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                    </button>
                  </p>
                </motion.div>
              )}

              {step === "password" && (
                <motion.form
                  key="password-step"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={passwordForm.handleSubmit(onUpdatePassword)}
                  className="mt-8 space-y-5"
                  noValidate
                >
                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="text-sm font-semibold text-foreground"
                    >
                      New Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="New password"
                      aria-invalid={!!passwordForm.formState.errors.password}
                      {...passwordForm.register("password", {
                        required: "Password is required",
                        minLength: {
                          value: 8,
                          message: "Minimum 8 characters.",
                        },
                      })}
                    />
                    {passwordForm.formState.errors.password && (
                      <p className="text-xs text-destructive">
                        {passwordForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="confirm"
                      className="text-sm font-semibold text-foreground"
                    >
                      Confirm Password
                    </Label>
                    <Input
                      id="confirm"
                      type="password"
                      placeholder="Confirm new password"
                      aria-invalid={!!passwordForm.formState.errors.confirm}
                      {...passwordForm.register("confirm", {
                        required: "Please confirm your password",
                      })}
                    />
                    {passwordForm.formState.errors.confirm && (
                      <p className="text-xs text-destructive">
                        {passwordForm.formState.errors.confirm.message}
                      </p>
                    )}
                  </div>

                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      disabled={changing}
                      className="w-full py-6 text-sm font-semibold"
                    >
                      {changing ? "Updating..." : "Update Password"}
                    </Button>
                  </motion.div>
                </motion.form>
              )}
            </AnimatePresence>

            <motion.p
              variants={fieldVariants}
              custom={8}
              initial="hidden"
              animate="visible"
              className="mt-6 text-center text-sm text-muted-foreground"
            >
              Remembered your password?{" "}
              <Link
                href="/sign-in"
                className="font-medium text-foreground underline"
              >
                Sign in
              </Link>
            </motion.p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
