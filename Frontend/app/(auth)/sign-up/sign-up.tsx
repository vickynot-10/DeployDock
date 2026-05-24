"use client";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { FiGithub, FiMail, FiLock, FiUser } from "react-icons/fi";
import api from "@/libs/axios";
import "../../globals.css";
import { toast } from "react-toastify";

import AppTextInput from "@/components/ui-elements/AppTextInput";
type SignUpFormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

async function signUpFn(data: Omit<SignUpFormData, "confirmPassword">) {
  const res = await api.post("/auth/sign-up", data);
  return res.data;
}

export default function SignUp() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpFormData>();

  const passwordValue = watch("password");

  const { mutate, isPending } = useMutation({
    mutationFn: signUpFn,
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.msg);
        return router.push("/");
      }
    },
  });

  const onSubmit = ({ name, email, password }: SignUpFormData) =>
    mutate({ name, email, password });

  return (
    <div className="flex w-full flex-col items-center h-full flex-1 justify-center ">
      <div className="auth-animate w-full max-w-[60%]">
        <div className="mb-6 flex  justify-center items-center gap-1">
          <span
            className="text-[22px] text-center font-extrabold tracking-tight"
            style={{ color: "var(--text-1)" }}
          >
            Create your account
          </span>
        </div>

        <div className="flex justify-center mb-5">
          <Link
            rel="noopener noreferrer"
            href={`${process.env.NEXT_PUBLIC_BASE_API}/api/auth/github`}
            className="flex items-center gap-2.5 rounded-[9px] px-5 py-[9px] text-[13px] font-medium transition-all duration-150 hover:opacity-80"
            style={{
              border: "1px solid var(--border-2)",
              background: "var(--bg-2)",
              color: "var(--text-1)",
            }}
          >
            <FiGithub size={15} />
            Continue with GitHub
          </Link>
        </div>

        <div
          className="auth-divider mb-5 flex items-center gap-3 text-[11.5px]"
          style={{ color: "var(--text-4)" }}
        >
          <span>or continue with email</span>
        </div>

        <form
          method="post"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
          noValidate
        >
          <AppTextInput
            label="Full Name"
            id="signup-name"
            placeholder="John Doe"
            leftIcon={<FiUser size={14} />}
            error={errors.name?.message}
            {...register("name", {
              required: "Name is required",
              minLength: { value: 2, message: "Name too short" },
            })}
          />

          <AppTextInput
            label="Email"
            id="signup-email"
            type="email"
            placeholder="you@example.com"
            leftIcon={<FiMail size={14} />}
            error={errors.email?.message}
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Enter a valid email",
              },
            })}
          />

          <AppTextInput
            label="Password"
            id="signup-password"
            type="password"
            placeholder="••••••••"
            leftIcon={<FiLock size={14} />}
            error={errors.password?.message}
            {...register("password", {
              required: "Password is required",
              minLength: { value: 8, message: "At least 8 characters" },
            })}
          />

          <AppTextInput
            label="Confirm Password"
            id="signup-confirm"
            type="password"
            placeholder="••••••••"
            leftIcon={<FiLock size={14} />}
            error={errors.confirmPassword?.message}
            {...register("confirmPassword", {
              required: "Please confirm your password",
              validate: (val) =>
                val === passwordValue || "Passwords do not match",
            })}
          />

          <button
            type="submit"
            disabled={isPending}
            className="mt-1 h-[40px] w-full rounded-[8px] text-[13.5px] font-semibold text-white transition-opacity duration-150 hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: "var(--accent)" }}
          >
            {isPending ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p
          className="mt-6 text-center text-[12.5px]"
          style={{ color: "var(--text-4)" }}
        >
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-semibold transition-opacity duration-150 hover:opacity-75"
            style={{ color: "var(--accent)" }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
