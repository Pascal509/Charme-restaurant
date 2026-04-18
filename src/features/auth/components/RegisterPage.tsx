"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import Container from "@/components/layout/Container";
import { useCartStore } from "@/store/useCartStore";

type RegisterState = {
  name: string;
  email: string;
  password: string;
};

export default function RegisterPage({
  locale,
  country
}: {
  locale: string;
  country: string;
}) {
  const [form, setForm] = useState<RegisterState>({ name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { setItemCount } = useCartStore();

  const basePath = `/${locale}/${country}`;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name || undefined,
        email: form.email,
        password: form.password
      })
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      setError(errorBody.error || "Unable to create account");
      setIsLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false
    });

    if (!result || result.error) {
      setError(result?.error || "Account created, but sign in failed");
      setIsLoading(false);
      return;
    }

    await mergeGuestCart(setItemCount);
    window.location.href = `${basePath}/account`;
  }

  async function handleGoogleLogin() {
    setError(null);
    setIsLoading(true);
    await signIn("google", { callbackUrl: `${basePath}/account` });
  }

  return (
    <main className="bg-brand-rice">
      <Container className="py-12">
        <div className="mx-auto max-w-xl rounded-2xl border border-brand-ink/10 bg-white p-8 shadow-soft">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-ink/60">Join Charme</p>
          <h1 className="mt-3 font-display text-3xl text-brand-ink">Create account</h1>
          <p className="mt-2 text-sm text-brand-ink/70">
            Save delivery details, track orders, and manage your profile.
          </p>

          {error ? (
            <div className="mt-6 rounded-md border border-brand-cinnabar/30 bg-brand-cinnabar/5 px-4 py-3 text-sm text-brand-cinnabar">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-ink/60">
                Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="w-full rounded-md border border-brand-ink/10 px-3 py-2 text-sm text-brand-ink"
                placeholder="Full name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-ink/60">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                className="w-full rounded-md border border-brand-ink/10 px-3 py-2 text-sm text-brand-ink"
                placeholder="hello@charme.com"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-ink/60">
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                className="w-full rounded-md border border-brand-ink/10 px-3 py-2 text-sm text-brand-ink"
                placeholder="Minimum 8 characters"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-brand-cinnabar px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-brand-cinnabar/60"
            >
              {isLoading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3 text-xs text-brand-ink/50">
            <span className="h-px flex-1 bg-brand-ink/10" />
            or
            <span className="h-px flex-1 bg-brand-ink/10" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="mt-5 w-full rounded-md border border-brand-ink/15 bg-white px-4 py-3 text-sm font-semibold text-brand-ink disabled:cursor-not-allowed disabled:opacity-70"
          >
            Continue with Google
          </button>

          <p className="mt-6 text-sm text-brand-ink/70">
            Already have an account?{" "}
            <Link href={`${basePath}/auth/login`} className="font-semibold text-brand-ink">
              Sign in
            </Link>
          </p>
        </div>
      </Container>
    </main>
  );
}

async function mergeGuestCart(setItemCount: (count: number) => void) {
  if (typeof window === "undefined") return;
  const guestId = window.localStorage.getItem("guestId");
  if (!guestId) return;

  const response = await fetch("/api/cart/merge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guestId })
  });

  if (response.ok) {
    window.localStorage.removeItem("guestId");
    setItemCount(0);
  }
}
