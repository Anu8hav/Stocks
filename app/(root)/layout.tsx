import Header from "@/components/Header";
import React from "react";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen text-gray-400">
      {/* Header */}
      <Header />
      <div className="container py-10">
        {children}
      </div>
    </main>
  );
}
