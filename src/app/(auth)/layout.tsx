import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <a href="/" className="block text-center mb-10">
          <span className="font-serif text-2xl font-semibold text-neutral-900">
            StyleAI
          </span>
        </a>
        {children}
      </div>
    </div>
  );
}
