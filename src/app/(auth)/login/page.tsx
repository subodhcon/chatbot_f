"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Sparkles,
  Check,
  ArrowRight,
} from "lucide-react";
import { loginUser, getAccessToken } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/Brand";

const FEATURES = [
  "Deploy AI chatbots across web & channels in minutes",
  "Train on your own data with enterprise-grade security",
  "Track conversations & performance with live analytics",
];

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  // Form state
  const [email, setEmail] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("remembered_email") || ""
      : ""
  );
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(() =>
    typeof window !== "undefined"
      ? !!localStorage.getItem("remembered_email")
      : false
  );
  const [showPassword, setShowPassword] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolveRedirect = useCallback(() => {
    if (typeof window === "undefined") {
      router.push("/");
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect");
    router.push(redirect ? decodeURIComponent(redirect) : "/");
  }, [router]);

  // Redirect if already authenticated
  useEffect(() => {
    if (getAccessToken()) resolveRedirect();
  }, [resolveRedirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!email || !password) {
      setError("Please fill in all required fields.");
      setIsLoading(false);
      return;
    }

    const response = await loginUser(email, password);

    if (!response.success || !response.data) {
      setError(response.error?.message || "Invalid email or password.");
      setIsLoading(false);
      return;
    }

    login(
      {
        ...response.data.user,
        role: (response.data.user as { role?: string }).role || "user",
      },
      response.data.access_token,
      response.data.refresh_token
    );

    if (typeof window !== "undefined") {
      if (rememberMe) {
        localStorage.setItem("remembered_email", email);
      } else {
        localStorage.removeItem("remembered_email");
      }
    }

    resolveRedirect();
  };

  return (
    <div className="min-h-screen bg-slate-950 lg:grid lg:grid-cols-2">
      {/* ============ Brand / Showcase Panel ============ */}
      <aside className="relative hidden overflow-hidden bg-slate-950 lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        {/* Living aurora background */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-24 -top-24 h-[28rem] w-[28rem] animate-aurora rounded-full bg-violet-600/30 blur-[100px]" />
          <div
            className="absolute -bottom-32 -right-16 h-[32rem] w-[32rem] animate-aurora rounded-full bg-indigo-600/25 blur-[110px]"
            style={{ animationDelay: "-6s" }}
          />
          <div
            className="absolute left-1/3 top-1/2 h-80 w-80 animate-aurora rounded-full bg-fuchsia-600/20 blur-[90px]"
            style={{ animationDelay: "-12s" }}
          />
        </div>
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.07)_1px,transparent_0)] [background-size:26px_26px]" />

        {/* Wordmark */}
        <div className="relative flex animate-fade-in-up">
          <BrandMark withRing />
        </div>

        {/* Headline + features */}
        <div className="relative max-w-md animate-fade-in-up" style={{ animationDelay: "80ms" }}>
          <h1 className="text-4xl font-bold leading-[1.15] tracking-tight text-white xl:text-5xl">
            The command center for your{" "}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent">
              AI chatbots
            </span>
          </h1>
          <p className="mt-5 text-base leading-relaxed text-slate-400">
            Build, deploy, and scale intelligent assistants — all from one
            beautiful, secure dashboard.
          </p>

          <ul className="mt-8 space-y-4">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span className="text-sm text-slate-300">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Trust card */}
        <div className="relative animate-fade-in-up" style={{ animationDelay: "160ms" }}>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {["from-pink-500 to-rose-500", "from-amber-500 to-orange-500", "from-emerald-500 to-teal-500", "from-sky-500 to-blue-500"].map(
                  (g, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-9 w-9 rounded-full bg-gradient-to-br ring-2 ring-slate-950",
                        g
                      )}
                    />
                  )
                )}
              </div>
              <p className="text-sm text-slate-300">
                Trusted by{" "}
                <span className="font-semibold text-white">2,000+</span> teams to
                power customer conversations.
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            © {new Date().getFullYear()} Confluxaa. All rights reserved.
          </p>
        </div>
      </aside>

      {/* ============ Form Panel ============ */}
      <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
        {/* subtle glow for mobile */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl lg:hidden" />

        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div
            className="mb-8 flex animate-fade-in-up items-center justify-center lg:hidden"
            style={{ animationDelay: "0ms" }}
          >
            <BrandMark />
          </div>

          {/* Panning gradient accent */}
          <div
            className="mx-auto mb-6 h-1 w-16 animate-gradient-pan rounded-full bg-[linear-gradient(90deg,#a78bfa,#818cf8,#a78bfa,#818cf8)] bg-[length:200%_100%] lg:mx-0"
            style={{ animationDelay: "120ms" }}
          />

          {/* Header */}
          <div
            className="animate-fade-in-up text-center lg:text-left"
            style={{ animationDelay: "60ms" }}
          >
            <h2 className="flex items-center justify-center gap-2 text-3xl font-extrabold tracking-tight text-white lg:justify-start">
              Welcome back
              <Sparkles className="h-5 w-5 animate-pulse text-violet-400" />
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Sign in to manage your AI chatbots.
            </p>
          </div>

          {/* Error callout */}
          {error && (
            <div
              role="alert"
              className="mt-6 flex animate-shake items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
            >
              <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="animate-fade-in-up" style={{ animationDelay: "120ms" }}>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-slate-300"
              >
                Email address
              </label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={isLoading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!error}
                  className={cn(
                    "block w-full rounded-xl border bg-slate-900/70 py-3 pl-10 pr-3 text-sm text-white placeholder-slate-500 outline-none transition-all duration-200",
                    "focus:ring-2 focus:ring-violet-500/40 disabled:opacity-50",
                    error
                      ? "border-red-500/50 focus:border-red-500"
                      : "border-slate-800 focus:border-violet-500 focus:shadow-[0_0_0_4px_rgba(139,92,246,0.12)]"
                  )}
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div className="animate-fade-in-up" style={{ animationDelay: "180ms" }}>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-slate-300"
                >
                  Password
                </label>
                <a
                  href="#"
                  className="text-xs font-semibold text-violet-400 transition-colors hover:text-violet-300"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  disabled={isLoading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-900/70 py-3 pl-10 pr-11 text-sm text-white placeholder-slate-500 outline-none transition-all duration-200 focus:border-violet-500 focus:shadow-[0_0_0_4px_rgba(139,92,246,0.12)] focus:ring-2 focus:ring-violet-500/40 disabled:opacity-50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-0 top-0 flex h-full items-center pr-3 text-slate-500 transition-colors hover:text-slate-300"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div
              className="animate-fade-in-up flex items-center"
              style={{ animationDelay: "240ms" }}
            >
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                disabled={isLoading}
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-violet-600 outline-none transition-colors focus:ring-violet-500/40"
              />
              <label
                htmlFor="remember-me"
                className="ml-2.5 cursor-pointer text-sm text-slate-400"
              >
                Remember my email
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full animate-fade-in-up items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all duration-200 hover:from-violet-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ animationDelay: "300ms" }}
            >
              {/* shimmer sheen on hover */}
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition-opacity duration-300 group-hover:animate-shimmer group-hover:opacity-100" />
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Legal footer */}
          <p
            className="mt-8 animate-fade-in-up text-center text-xs leading-relaxed text-slate-500 lg:text-left"
            style={{ animationDelay: "360ms" }}
          >
            By signing in, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-slate-400">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-slate-400">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
