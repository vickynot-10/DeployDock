"use client";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import Loader from "@/components/ui-elements/Loader";
import { FiGithub, FiMail, FiLock } from "react-icons/fi";
import api from "@/libs/axios";
import "../../globals.css";
import { useRouter } from "next/navigation";
import AppTextInput from "@/components/ui-elements/AppTextInput";
type SignInFormData = {
  email: string;
  password: string;
};

async function signInFn(data: SignInFormData) {
  const res = await api.post("/auth/sign-in", data);
  return res.data;
}

export default function SignIn() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>();

  const { mutate, isPending } = useMutation({
    mutationFn: signInFn,
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.msg);
        return router.push("/");
      }
    },
  });

  const onSubmit = (data: SignInFormData) => mutate(data);

  return (
    <div className="flex w-full flex-col items-center h-full flex-1 justify-center ">
      <div className="auth-animate w-full max-w-[60%]">
        <div className="mb-6 flex  justify-center items-center gap-1">
          <span
            className="text-[22px] text-center font-extrabold tracking-tight"
            style={{ color: "var(--text-1)" }}
          >
            Sign in to your account
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
            label="Email"
            id="signin-email"
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
            id="signin-password"
            type="password"
            placeholder="••••••••"
            leftIcon={<FiLock size={14} />}
            error={errors.password?.message}
            {...register("password", {
              required: "Password is required",
              minLength: { value: 6, message: "At least 6 characters" },
            })}
          />

          <Link
            href="/forgot-password"
            className="text-[12px] text-end transition-colors duration-150 hover:opacity-75"
            style={{ color: "var(--accent)" }}
          >
            {" "}
            Forgot password?{" "}
          </Link>

          <button
            type="submit"
            disabled={isPending}
            className="mt-1 h-[40px] w-full rounded-[8px] text-[13.5px] font-semibold text-white transition-opacity duration-150 hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: "var(--accent)" }}
          >
            {isPending ? (
              <div className=" flex items-center justify-center w-full">
                <Loader color="white" />
              </div>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p
          className="mt-6 text-center text-[12.5px]"
          style={{ color: "var(--text-4)" }}
        >
          Don&apos;t have an account?{" "}
          <Link
            href="/sign-up"
            className="font-semibold transition-opacity duration-150 hover:opacity-75"
            style={{ color: "var(--accent)" }}
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
