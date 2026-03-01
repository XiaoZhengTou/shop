"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "注册失败");
    } else {
      router.push("/login?registered=1");
    }
  };

  return (
    <div className="bg-white border border-neutral-200 p-8">
      <h1 className="font-serif text-2xl font-semibold text-neutral-900 mb-1">
        创建账户
      </h1>
      <p className="font-sans text-sm text-neutral-500 mb-8">
        加入 StyleAI，探索 AI 时尚
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="name"
            className="block font-sans text-xs font-medium text-neutral-700 mb-1.5 uppercase tracking-wider"
          >
            姓名（选填）
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            className="w-full border border-neutral-200 px-3 py-2.5 font-sans text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors duration-200"
            placeholder="您的姓名"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block font-sans text-xs font-medium text-neutral-700 mb-1.5 uppercase tracking-wider"
          >
            邮箱
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full border border-neutral-200 px-3 py-2.5 font-sans text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors duration-200"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block font-sans text-xs font-medium text-neutral-700 mb-1.5 uppercase tracking-wider"
          >
            密码
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full border border-neutral-200 px-3 py-2.5 font-sans text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors duration-200"
            placeholder="至少 6 位"
          />
        </div>

        {error && (
          <p className="font-sans text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#D4AF37] text-white font-sans text-sm font-medium py-3 hover:bg-[#B8960F] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
        >
          {loading ? "注册中…" : "立即注册"}
        </button>
      </form>

      <p className="mt-6 text-center font-sans text-sm text-neutral-500">
        已有账户？{" "}
        <a
          href="/login"
          className="text-neutral-900 font-medium hover:text-[#D4AF37] transition-colors duration-200"
        >
          立即登录
        </a>
      </p>
    </div>
  );
}
