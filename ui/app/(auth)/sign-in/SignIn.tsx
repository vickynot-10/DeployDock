"use client";
import { motion, Variants } from "motion/react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignInFormValues } from "@/types/auth.types";
import { useSignin } from "@/hooks/queries/useAuth";
import GithubButton from "../components/GithubLogin";
import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "lucide-react";
const fieldVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.4, ease: "easeOut" as const },
  }),
};

export default function SignIn() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormValues>();

  const { resolvedTheme, setTheme } = useTheme();
  const { isPending, mutate } = useSignin();

  const onSubmit = (data: SignInFormValues) => {
    mutate(data);
  };

  function handleThemeToggle() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  return (
    <div className=" min-h-screen w-full flex items-center justify-center bg-background p-6">
      <div className="rounded-3xl border border-border bg-card p-3 shadow-sm">
        <div className="grid grid-cols-1 gap-3">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col justify-center p-4"
          >
            <div className="flex flex-row items-center justify-between">
              <motion.h1
                variants={fieldVariants}
                custom={0}
                initial="hidden"
                animate="visible"
                className="text-3xl font-bold text-foreground"
              >
                Welcome Back
              </motion.h1>

              <motion.div
                variants={fieldVariants}
                custom={1}
                initial="hidden"
                animate="visible"
                whileHover={{ scale: 1.1, rotate: 15 }}
                whileTap={{ scale: 0.9, rotate: -15 }}
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleThemeToggle}
                >
                  <SunIcon className="hidden dark:block" />
                  <MoonIcon className="block dark:hidden" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </motion.div>
            </div>

            <motion.p
              variants={fieldVariants}
              custom={1}
              initial="hidden"
              animate="visible"
              className="mt-2 text-sm text-muted-foreground"
            >
              Let's get started. Fill in the details below to sign in to your
              account.
            </motion.p>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="mt-8 space-y-5"
              noValidate
            >
              <motion.div
                variants={fieldVariants}
                custom={3}
                initial="hidden"
                animate="visible"
                className="space-y-2"
              >
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
                  aria-invalid={!!errors.email}
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Enter a valid email address",
                    },
                  })}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </motion.div>

              <motion.div
                variants={fieldVariants}
                custom={4}
                initial="hidden"
                animate="visible"
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-sm font-semibold text-foreground"
                  >
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  aria-invalid={!!errors.password}
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 8,
                      message: "Minimum 8 characters.",
                    },
                  })}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </motion.div>

              <motion.div
                variants={fieldVariants}
                custom={6}
                initial="hidden"
                animate="visible"
              >
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full py-6 text-sm font-semibold"
                  >
                    {isPending ? "Signing In..." : "Sign In"}
                  </Button>
                </motion.div>
              </motion.div>

              <motion.p
                variants={fieldVariants}
                custom={7}
                initial="hidden"
                animate="visible"
                className="text-center text-sm text-muted-foreground"
              >
                Don&apos;t have an account?{" "}
                <Link
                  href="/sign-up"
                  className="font-medium text-foreground underline"
                >
                  Sign up
                </Link>
              </motion.p>
              <motion.div
                variants={fieldVariants}
                custom={7}
                initial="hidden"
                animate="visible"
                className="space-y-5"
              >
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">OR</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <GithubButton />
              </motion.div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
