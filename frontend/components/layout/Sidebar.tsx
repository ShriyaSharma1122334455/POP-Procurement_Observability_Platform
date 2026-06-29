"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Building2,
  Bell,
  Sparkles,
  LogOut,
  Diamond,
  type LucideIcon,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/hooks/useAuth"
import * as alertsApi from "@/lib/api/alerts"

type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  badge?: number
}

const NAV_ITEMS: Omit<NavItem, "badge">[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Suppliers", href: "/suppliers", icon: Building2 },
  { label: "Alerts", href: "/alerts", icon: Bell },
  { label: "Savings Agent", href: "/agent", icon: Sparkles },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const { data: alertsData } = useQuery({
    queryKey: ["alerts", "open-count"],
    queryFn: () => alertsApi.list({ status: "OPEN" }),
    staleTime: 60_000,
    retry: 1,
  })
  const openAlertCount = alertsData?.total ?? 0

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U"

  return (
    <aside
      className="hidden lg:flex w-60 shrink-0 flex-col bg-[#0F172A] h-screen sticky top-0"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700/50">
        <div
          className="flex size-8 items-center justify-center rounded-lg bg-blue-600 shrink-0"
          aria-hidden
        >
          <Diamond className="size-4 text-white fill-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white leading-tight">POP</p>
          <p className="text-[10px] text-slate-400 leading-tight truncate">
            Procurement Observability
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`)
          const badge = label === "Alerts" ? openAlertCount : 0
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "sidebar-nav-item flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                isActive
                  ? "bg-blue-900/50 text-white border-l-2 border-blue-500 pl-[10px]"
                  : "text-slate-400 hover:text-white hover:bg-slate-800 border-l-2 border-transparent pl-[10px]"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              <span className="flex-1 truncate">{label}</span>
              {badge > 0 && (
                <span
                  className="text-[10px] font-semibold bg-red-500 text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
                  aria-label={`${badge} open alerts`}
                >
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="border-t border-slate-700/50 px-3 py-4">
        <div className="flex items-center gap-3 px-2">
          <div
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white"
            aria-hidden
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.name ?? "User"}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              {user?.email ?? ""}
            </p>
          </div>
          <button
            onClick={logout}
            className="flex size-7 items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="size-3.5" aria-hidden />
          </button>
        </div>
      </div>
    </aside>
  )
}
