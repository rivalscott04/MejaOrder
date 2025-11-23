"use client";

import { ReactNode, useState } from "react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

type DashboardLayoutProps = {
  role: "super-admin" | "tenant-admin" | "cashier";
  userEmail?: string;
  userName?: string;
  children: ReactNode;
};

export function DashboardLayout({ role, userEmail, userName, children }: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        role={role}
        userEmail={userEmail}
        userName={userName}
        onCollapseChange={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />
      <main
        className="flex-1 transition-all duration-300 lg:ml-64 flex flex-col"
        style={{ marginLeft: isCollapsed ? "80px" : undefined }}
      >
        <TopBar onMenuClick={() => setIsMobileOpen(true)} role={role} />
        <div className="flex-1">{children}</div>
      </main>
    </div>
  );
}

