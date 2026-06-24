"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconSalad, IconEye, IconEyeOff } from "@tabler/icons-react";
import { loginSchema, type LoginInput } from "@/lib/validators";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/home");
      router.refresh();
    }
  }

  return (
    <div className="text-center">
      {/* Logo */}
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 bg-red rounded-xl flex items-center justify-center">
          <IconSalad size={36} className="text-white" />
        </div>
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-1">Platemate</h1>
      <p className="text-muted mb-8">Cook smarter, together</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
        {error && (
          <div className="bg-red-light text-red-dark text-sm p-3 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register("email")}
            className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-red focus:border-transparent"
            placeholder="you@university.edu"
          />
          {errors.email && (
            <p className="text-red-dark text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              {...register("password")}
              className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-red focus:border-transparent pr-10"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-dark text-xs mt-1">{errors.password.message}</p>
          )}
        </div>

        <div className="text-right">
          <button type="button" className="text-sm text-red hover:underline">
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red text-white py-2.5 rounded-lg font-semibold hover:bg-red-darker transition-colors disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>

      <div className="flex items-center my-6">
        <div className="flex-1 border-t border-border" />
        <span className="px-4 text-sm text-muted">or</span>
        <div className="flex-1 border-t border-border" />
      </div>

      <Link
        href="/register"
        className="block w-full py-2.5 border-2 border-red text-red rounded-lg font-semibold hover:bg-red-light transition-colors"
      >
        Create account
      </Link>
    </div>
  );
}
