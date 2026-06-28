"use client"

import { usePathname } from "next/navigation"
import { Bell } from "lucide-react"
import { MobileSidebar } from "./MobileSidebar"
import { useAuth } from "@/lib/hooks/useAuth"

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/suppliers": "Suppliers",
  "/alerts": "Alerts",
  "/agent": "Savings Agent",
}

function getTitle(pathname: string): string {
  for (const [prefix, label] of Object.entries(PAGE_TITLES)) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return label
  }
  return "POP"
}

export function Header() {
  const pathname = usePathname()
  const { user } = useAuth()
  const title = getTitle(pathname)

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm px-4 lg:px-6">
      {/* Mobile menu trigger */}
      <MobileSidebar />

      {/* Page title */}
      <h2 className="text-sm font-semibold text-slate-900 flex-1">{title}</h2>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <button
          className="flex size-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors relative"
          aria-label="Notifications"
        >
          <Bell className="size-4" aria-hidden />
          <span
            className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-red-500"
            aria-hidden
          />
        </button>

        <div
          className="flex size-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white shrink-0"
          aria-label={`Logged in as ${user?.name ?? "User"}`}
        >
          {user?.name
            ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
            : "U"}
        </div>
      </div>
    </header>
  )
}
