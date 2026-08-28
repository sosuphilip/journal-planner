/* ========================================
   AUTH — sign up / sign in screen
   ======================================== */
import React, { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Auth() {
  const [mode, setMode] = useState("sign-in"); // "sign-in" | "sign-up"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const fn =
      mode === "sign-up"
        ? supabase.auth.signUp({ email, password })
        : supabase.auth.signInWithPassword({ email, password });

    const { error: authError } = await fn;

    if (authError) {
      setError(authError.message);
    } else if (mode === "sign-up") {
      setError("Check your email for a confirmation link!");
    }

    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
    }
  };

  return (
    <div
      className="w-screen h-screen flex items-center justify-center"
      style={{ background: "var(--bg)" }}
    >
      <div
        className="w-full max-w-sm rounded-xl p-6"
        style={{
          background: "var(--page)",
          border: "1.5px solid var(--border-strong)",
          boxShadow: "0 4px 20px var(--shadow)",
        }}
      >
        {/* Logo / title */}
        <div className="text-center mb-5">
          <span className="text-3xl">📓</span>
          <h1
            className="font-hand text-2xl font-bold mt-2"
            style={{ color: "var(--text)" }}
          >
            Journal Planner
          </h1>
          <p
            className="font-hand text-sm mt-1"
            style={{ color: "var(--text-faint)" }}
          >
            {mode === "sign-in"
              ? "Welcome back! Sign in to continue."
              : "Create an account to start journaling."}
          </p>
        </div>

        {/* Google sign-in */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-hand text-base transition-colors"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--border-strong)",
            color: "var(--text)",
            cursor: loading ? "wait" : "pointer",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div
            className="flex-1"
            style={{ borderTop: "1px solid var(--border)" }}
          />
          <span
            className="font-hand text-xs"
            style={{ color: "var(--text-faint)" }}
          >
            or
          </span>
          <div
            className="flex-1"
            style={{ borderTop: "1px solid var(--border)" }}
          />
        </div>

        {/* Email / password form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full px-3 py-2.5 rounded-lg font-hand text-base"
            style={{
              background: "var(--journal-bg)",
              border: "1px solid var(--journal-border)",
              color: "var(--text)",
            }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            minLength={6}
            className="w-full px-3 py-2.5 rounded-lg font-hand text-base"
            style={{
              background: "var(--journal-bg)",
              border: "1px solid var(--journal-border)",
              color: "var(--text)",
            }}
          />

          {error && (
            <p
              className="font-hand text-sm text-center"
              style={{ color: "var(--color-muted-red)" }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg font-hand text-base font-semibold transition-colors"
            style={{
              background: "var(--color-sage)",
              color: "white",
              cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading
              ? "Loading..."
              : mode === "sign-in"
              ? "Sign In"
              : "Sign Up"}
          </button>
        </form>

        {/* Toggle sign-in / sign-up */}
        <p
          className="text-center font-hand text-sm mt-4"
          style={{ color: "var(--text-faint)" }}
        >
          {mode === "sign-in" ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => {
              setMode(mode === "sign-in" ? "sign-up" : "sign-in");
              setError("");
            }}
            className="font-hand text-sm font-semibold bg-transparent border-none cursor-pointer"
            style={{ color: "var(--color-accent-blue)" }}
          >
            {mode === "sign-in" ? "Sign Up" : "Sign In"}
          </button>
        </p>

        {/* Privacy note */}
        <p
          className="text-center font-hand text-xs mt-3"
          style={{ color: "var(--text-faint)", opacity: 0.7 }}
        >
          🔒 Your journal is private — only you can see it.
        </p>
      </div>
    </div>
  );
}
