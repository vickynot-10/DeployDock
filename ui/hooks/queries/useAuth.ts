"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/utils/axios";
import { toast } from "sonner";
import {
  SignUpFormValues,
  SignInFormValues,
  SendOTPFormValues,
  VerifyOTPFormValues,
  UpdatePasswordFormValues,
} from "@/types/auth.types";

export function useSignup() {
  const router = useRouter();
  return useMutation({
    mutationFn: async (data: SignUpFormValues) => {
      const res = await api.post("/auth/sign-up", data);
      return res.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.msg ?? "Account created successfully");
        router.push("/");
      }
    },
  });
}

export function useSignin() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: SignInFormValues) => {
      const res = await api.post("/auth/sign-in", data);
      return res.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.msg ?? "Account created successfully");
        router.push("/");
      }
    },
  });
}

export function useSendOTP() {
  return useMutation({
    mutationFn: async (data: SendOTPFormValues) => {
      const res = await api.post("/send-otp", data);
      return res.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.msg ?? "OTP Send Successfully !");
      }
    },
  });
}

export function useVerifyOTP() {
  return useMutation({
    mutationFn: async (data: VerifyOTPFormValues) => {
      const res = await api.post("/verify-otp", data);
      return res.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.msg ?? "OTP Verified Successfully !");
      }
    },
  });
}

export function useUpdatePassword() {
  const router = useRouter();
  return useMutation({
    mutationFn: async (data: UpdatePasswordFormValues) => {
      const res = await api.post("/change-password", data);
      return res.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.msg ?? "Password Updated Successfully !");
        router.push("/sign-in");
      }
    },
  });
}

export function useSignout() {
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      const res = await api.post("/auth/sign-out");
      return res.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.msg ?? "Logged out Successfully !");
        router.push("/sign-in");
      }
    },
  });
}

export async function SignOut() {
  const res = await api.post("/auth/sign-out");
  return res.data;
}
