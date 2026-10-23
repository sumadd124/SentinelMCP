"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  Home,
  Radio,
  BarChart3,
  KeyRound,
  FlaskConical,
  Clock,
  ShieldAlert,
  Database,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  RefreshCw,
} from "lucide-react";
import { TelemetryProvider, useTelemetry } from "../hooks/useTelemetry";

export interface NavItem {
  label: string;
  href: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface NavGroup {
  category: string;
  items: NavItem[];
}

export const NAVIGATION_GROUPS: NavGroup[] = [
  {
    category: "Overview",
    items: [
      {
        label: "Home",
        href: "/",
        description: "SentinelMCP landing page and platform overview",
        icon: Home,
      },
    ],
  },
  {
    category: "Monitor",
    items: [
      {
        label: "Security Stream",
        href: "/security-stream",
        description: "Live security events, alerts, threat activity, and event monitoring",
        icon: Radio,
      },
      {
        label: "Security Analytics",
        href: "/security-analytics",
        description: "Aggregated security statistics, trends, event distributions, and operational metrics",
        icon: BarChart3,
      },
    ],
  },
  {
    category: "Access & Testing",
    items: [
      {
        label: "Capability Token Studio",
        href: "/capability-tokens",
        description: "Issue, inspect, and verify cryptographic HMAC-SHA256 capability tokens",
        icon: KeyRound,
      },
      {
        label: "Attack Lab & Simulations",
        href: "/attack-lab",
        description: "Controlled attack scenarios, security testing, simulation execution, and results",
        icon: FlaskConical,
      },
    ],
  },
  {
    category: "Investigate",
    items: [
      {
        label: "Forensics & Incident Timeline",
        href: "/forensics",
        description: "Chronological security events, incident context, and forensic evidence",
        icon: Clock,
      },
      {
        label: "Risk Intelligence Matrix",
        href: "/risk-intelligence",
        description: "Risk prioritization, threat severity, risk relationships, and intelligence insights",
        icon: ShieldAlert,
      },
    ],
  },
  {
    category: "Audit & Compliance",
    items: [
      {
        label: "Persisted Security Ledger",
        href: "/security-ledger",
        description: "Security event history, persisted audit records, traceability, and verification",
        icon: Database,
      },
      {
        label: "Privacy Policy",
        href: "/privacy-policy",
        description: "Application data handling, telemetry, storage retention, and privacy practices",
        icon: FileText,
      },
    ],
  },
];

function isRouteActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getCurrentNavMeta(pathname: string): {
  category: string;
  item: NavItem;
} {
  for (const group of NAVIGATION_GROUPS) {
    for (const item of group.items) {
      if (isRouteActive(pathname, item.href)) {
        return { category: group.category, item };
      }
    }
  }
  return {
    category: "Overview",
    item: NAVIGATION_GROUPS[0].items[0],
  };
}

function ShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const { isConnected, events, refreshBackendRecords } = useTelemetry();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openForPathname, setOpenForPathname] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isMobileOpen = openForPathname === pathname;

  const mobileMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobileCloseButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobileDrawerRef = useRef<HTMLDivElement | null>(null);

  // Hydrate persisted desktop sidebar collapse preference asynchronously
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem("sentinel_sidebar_collapsed");
        if (saved === "true") {
          setIsCollapsed(true);
        }
      } catch {
        // Ignore storage errors
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem("sentinel_sidebar_collapsed", String(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  // Focus management, Escape key, and scroll lock for mobile drawer
  useEffect(() => {
    if (!isMobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const timer = window.setTimeout(() => {
      mobileCloseButtonRef.current?.focus();
    }, 10);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpenForPathname(null);
        mobileMenuButtonRef.current?.focus();
        return;
      }

      if (e.key === "Tab" && mobileDrawerRef.current) {
        const focusable = mobileDrawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileOpen]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshBackendRecords();
    window.setTimeout(() => setIsRefreshing(false), 350);
  };

  const currentMeta = getCurrentNavMeta(pathname);

  return (
    <div className="flex min-h-screen bg-[#f7f8fc] text-[#172033]">
      {/* Desktop Persistent & Collapsible Sidebar */}
      <aside
        aria-label="Primary Sidebar Navigation"
        className={`hidden lg:flex lg:flex-col lg:shrink-0 border-r border-[#e7e9f0] bg-white transition-[width] duration-200 ease-in-out ${
          isCollapsed ? "lg:w-[76px]" : "lg:w-[272px]"
        }`}
      >
        <div className="sticky top-0 flex h-screen flex-col justify-between">
          {/* Sidebar Top Brand & Collapse Toggle */}
          <div
            className={`flex h-16 items-center border-b border-[#e7e9f0] px-4 ${
              isCollapsed ? "justify-center" : "justify-between"
            }`}
          >
            <Link
              href="/"
              className="flex items-center gap-3 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7047eb]"
              title="SentinelMCP — Home"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#7047eb] text-white shadow-sm">
                <Shield className="h-5 w-5" strokeWidth={2.2} />
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <span className="block text-base font-bold tracking-tight text-[#172033]">
                    Sentinel<span className="text-[#7047eb]">MCP</span>
                  </span>
                  <span className="block truncate text-[11px] font-medium text-[#697386]">
                    Zero-Trust Gateway
                  </span>
                </div>
              )}
            </Link>

            {!isCollapsed && (
              <button
                type="button"
                onClick={toggleCollapse}
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[#697386] transition hover:bg-[#f5f6fa] hover:text-[#172033] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7047eb]"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Navigation Groups */}
          <nav
            aria-label="SentinelMCP Platform Sections"
            className="flex-1 overflow-y-auto overflow-x-visible px-3 py-4 space-y-5"
          >
            {NAVIGATION_GROUPS.map((group) => (
              <div key={group.category}>
                {!isCollapsed ? (
                  <p className="mb-1.5 px-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8790a2]">
                    {group.category}
                  </p>
                ) : (
                  <div
                    className="mx-auto mb-2 h-px w-6 bg-[#e7e9f0]"
                    aria-hidden="true"
                  />
                )}
                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isRouteActive(pathname, item.href);
                    const tooltipId = `nav-tooltip-${item.href.replace(/\W+/g, "-")}`;

                    return (
                      <li key={item.href} className="relative group/navitem">
                        <Link
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          aria-describedby={isCollapsed ? tooltipId : undefined}
                          title={isCollapsed ? `${item.label} — ${item.description}` : undefined}
                          className={`flex items-center gap-3 rounded-xl px-2.5 py-2 text-xs font-semibold transition duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7047eb] ${
                            isCollapsed ? "justify-center px-0 py-2.5" : ""
                          } ${
                            active
                              ? "bg-[#f0ebff] text-[#7047eb]"
                              : "text-[#465066] hover:bg-[#f5f6fa] hover:text-[#172033]"
                          }`}
                        >
                          <Icon
                            className={`h-4 w-4 shrink-0 ${
                              active
                                ? "text-[#7047eb]"
                                : "text-[#697386] group-hover/navitem:text-[#172033]"
                            }`}
                          />
                          {!isCollapsed && (
                            <span className="truncate">{item.label}</span>
                          )}
                          {!isCollapsed &&
                            item.href === "/security-stream" &&
                            events.length > 0 && (
                              <span
                                className={`ml-auto rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                                  active
                                    ? "bg-[#7047eb] text-white"
                                    : "bg-[#f0ebff] text-[#7047eb]"
                                }`}
                              >
                                {events.length}
                              </span>
                            )}
                        </Link>

                        {/* Accessible Compact Mode Tooltip */}
                        {isCollapsed && (
                          <div
                            id={tooltipId}
                            role="tooltip"
                            className="pointer-events-none invisible opacity-0 group-hover/navitem:visible group-hover/navitem:opacity-100 group-focus-within/navitem:visible group-focus-within/navitem:opacity-100 fixed left-[84px] z-50 w-56 -translate-y-8 rounded-xl border border-[#e7e9f0] bg-[#172033] px-3 py-2 text-left text-white shadow-lg transition-opacity duration-150"
                          >
                            <p className="text-xs font-bold text-white">
                              {item.label}
                            </p>
                            <p className="mt-0.5 text-[11px] leading-4 text-slate-300">
                              {item.description}
                            </p>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          {/* Sidebar Footer: Gateway Status & Expand Button */}
          <div className="border-t border-[#e7e9f0] p-3 space-y-2">
            {isCollapsed ? (
              <div className="flex flex-col items-center gap-2">
                <div
                  title={
                    isConnected
                      ? "Gateway Connected (Live SSE)"
                      : "Gateway Disconnected"
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e7e9f0] bg-[#fcfcfe]"
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      isConnected
                        ? "animate-pulse bg-emerald-500"
                        : "bg-rose-500"
                    }`}
                  />
                </div>
                <button
                  type="button"
                  onClick={toggleCollapse}
                  aria-label="Expand sidebar"
                  title="Expand sidebar"
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-[#697386] transition hover:bg-[#f5f6fa] hover:text-[#172033] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7047eb]"
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-xl border border-[#e7e9f0] bg-[#fcfcfe] px-3 py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      isConnected
                        ? "animate-pulse bg-emerald-500"
                        : "bg-rose-500"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-bold tracking-wide text-[#172033]">
                      {isConnected ? "GATEWAY ONLINE" : "GATEWAY OFFLINE"}
                    </p>
                    <p className="truncate text-[10px] text-[#697386]">
                      {isConnected ? "SSE telemetry active" : "Check local server"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  title="Refresh gateway audit & ledger data"
                  aria-label="Refresh gateway audit and ledger data"
                  className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[#e7e9f0] bg-white text-[#697386] transition hover:text-[#7047eb]"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${
                      isRefreshing ? "animate-spin text-[#7047eb]" : ""
                    }`}
                  />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Slide-In Navigation Drawer + Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Drawer"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#172033]/40 backdrop-blur-[1px] transition-opacity"
            onClick={() => {
              setOpenForPathname(null);
              mobileMenuButtonRef.current?.focus();
            }}
            aria-hidden="true"
          />

          {/* Slide-in Panel */}
          <div
            ref={mobileDrawerRef}
            className="fixed inset-y-0 left-0 z-10 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl"
          >
            <div className="flex h-16 items-center justify-between border-b border-[#e7e9f0] px-4">
              <Link
                href="/"
                onClick={() => setOpenForPathname(null)}
                className="flex items-center gap-3 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7047eb]"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7047eb] text-white">
                  <Shield className="h-5 w-5" strokeWidth={2.2} />
                </div>
                <div>
                  <span className="block text-base font-bold tracking-tight text-[#172033]">
                    Sentinel<span className="text-[#7047eb]">MCP</span>
                  </span>
                  <span className="block text-[11px] text-[#697386]">
                    Security Command Center
                  </span>
                </div>
              </Link>

              <button
                ref={mobileCloseButtonRef}
                type="button"
                onClick={() => {
                  setOpenForPathname(null);
                  mobileMenuButtonRef.current?.focus();
                }}
                aria-label="Close navigation menu"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-[#e7e9f0] text-[#465066] transition hover:bg-[#f5f6fa] hover:text-[#172033] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7047eb]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav
              aria-label="Mobile SentinelMCP Sections"
              className="flex-1 overflow-y-auto px-3 py-4 space-y-5"
            >
              {NAVIGATION_GROUPS.map((group) => (
                <div key={group.category}>
                  <p className="mb-1.5 px-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8790a2]">
                    {group.category}
                  </p>
                  <ul className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = isRouteActive(pathname, item.href);
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => setOpenForPathname(null)}
                            aria-current={active ? "page" : undefined}
                            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                              active
                                ? "bg-[#f0ebff] text-[#7047eb]"
                                : "text-[#465066] hover:bg-[#f5f6fa] hover:text-[#172033]"
                            }`}
                          >
                            <Icon
                              className={`h-4 w-4 shrink-0 ${
                                active ? "text-[#7047eb]" : "text-[#697386]"
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                            {item.href === "/security-stream" &&
                              events.length > 0 && (
                                <span className="ml-auto rounded-full bg-[#f0ebff] px-2 py-0.5 font-mono text-[10px] font-bold text-[#7047eb]">
                                  {events.length}
                                </span>
                              )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>

            <div className="border-t border-[#e7e9f0] p-4">
              <div className="flex items-center gap-2.5 rounded-xl border border-[#e7e9f0] bg-[#fcfcfe] px-3 py-2.5">
                <span
                  className={`h-2 w-2 rounded-full ${
                    isConnected
                      ? "animate-pulse bg-emerald-500"
                      : "bg-rose-500"
                  }`}
                />
                <span className="text-xs font-semibold text-[#465066]">
                  {isConnected ? "GATEWAY CONNECTED" : "GATEWAY DISCONNECTED"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-[#e7e9f0] bg-white/95 px-4 backdrop-blur-xs sm:px-7 lg:px-10">
          <div className="flex items-center gap-3 min-w-0">
            <button
              ref={mobileMenuButtonRef}
              type="button"
              onClick={() => setOpenForPathname(pathname)}
              aria-label="Open navigation menu"
              aria-expanded={isMobileOpen}
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#e7e9f0] bg-white text-[#465066] transition hover:bg-[#f5f6fa] hover:text-[#172033] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7047eb] lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
              <span className="hidden font-semibold text-[#697386] sm:inline">
                {currentMeta.category}
              </span>
              <span
                className="hidden text-[#8790a2] sm:inline"
                aria-hidden="true"
              >
                /
              </span>
              <span className="truncate font-bold text-[#172033]">
                {currentMeta.item.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 rounded-full border border-[#e7e9f0] bg-[#fcfcfe] px-3.5 py-1.5">
              <span
                className={`h-2 w-2 rounded-full ${
                  isConnected ? "animate-pulse bg-emerald-500" : "bg-rose-500"
                }`}
              />
              <span className="text-[11px] font-semibold tracking-wide text-[#465066]">
                {isConnected ? "GATEWAY CONNECTED" : "GATEWAY DISCONNECTED"}
              </span>
            </div>
          </div>
        </header>

        {/* Route Workspace Content */}
        <main className="flex-1 px-4 py-6 sm:px-7 lg:px-10 lg:py-8">
          <div className="mx-auto max-w-[1360px]">{children}</div>
        </main>

        {/* Shared Footer */}
        <footer className="border-t border-[#e7e9f0] bg-white px-4 py-4 text-xs text-[#8790a2] sm:px-7 lg:px-10">
          <div className="mx-auto flex max-w-[1360px] flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <span>
              SentinelMCP · Zero-Trust Security Gateway & Transaction Monitor for MCP
            </span>
            <div className="flex items-center gap-4">
              <Link
                href="/security-ledger"
                className="font-medium text-[#697386] transition hover:text-[#7047eb]"
              >
                Security Ledger
              </Link>
              <Link
                href="/privacy-policy"
                className="font-medium text-[#697386] transition hover:text-[#7047eb]"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <TelemetryProvider>
      <Suspense
        fallback={
          <div className="flex min-h-screen bg-[#f7f8fc] text-[#172033]">
            <div className="flex-1 px-4 py-6 sm:px-7 lg:px-10 lg:py-8">
              <div className="mx-auto max-w-[1360px]">{children}</div>
            </div>
          </div>
        }
      >
        <ShellInner>{children}</ShellInner>
      </Suspense>
    </TelemetryProvider>
  );
}
