import { r as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { r as useAuth } from "./auth-DbMKYDei.mjs";
import { n as useBookings } from "./bookings-DKX0ntLe.mjs";
import { n as usePayouts } from "./payouts-BQdOpTXM.mjs";
import { _ as useNavigate, f as Outlet, g as Link, l as useLocation } from "../_libs/@tanstack/react-router+[...].mjs";
import { A as ListChecks, D as LogOut, T as Menu, et as Building2, h as Settings, j as LayoutDashboard, k as LoaderCircle, m as ShieldCheck, n as Wallet, nt as Bell, q as ChevronDown, t as X, tt as BookOpen } from "../_libs/lucide-react.mjs";
import { a as buildDashboardAlerts, t as AlertRow } from "./DashboardWidgets-CTgQ_Esl.mjs";
import { t as Logo } from "./Logo-dgsTARq_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard-D4FmmL0k.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var NAV_ITEMS = [
	{
		key: "dashboard",
		label: "Dashboard",
		to: "/dashboard",
		icon: LayoutDashboard,
		live: true,
		ownerOnly: false
	},
	{
		key: "slots",
		label: "Slots & Inventory",
		to: "/dashboard/slots",
		icon: ListChecks,
		live: true,
		ownerOnly: false
	},
	{
		key: "bookings",
		label: "Bookings",
		to: "/dashboard/bookings",
		icon: BookOpen,
		live: true,
		ownerOnly: false
	},
	{
		key: "payouts",
		label: "Payouts",
		to: "/dashboard/payouts",
		icon: Wallet,
		live: true,
		ownerOnly: true
	},
	{
		key: "settings",
		label: "Venue Settings",
		to: "/dashboard/settings",
		icon: Settings,
		live: true,
		ownerOnly: true
	}
];
function NavButton({ item, active, onClick }) {
	const Icon = item.icon;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to: item.to,
		onClick,
		className: `flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-[18px] w-[18px] shrink-0" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "flex-1",
				children: item.label
			}),
			!item.live && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "rounded-full bg-surface-raised px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground",
				children: item.phase
			})
		]
	});
}
function DashboardShell({ children }) {
	const { partner, logout } = useAuth();
	const { bookings } = useBookings();
	const { pendingDeductions, pendingNet } = usePayouts();
	const navigate = useNavigate();
	const location = useLocation();
	const [mobileNavOpen, setMobileNavOpen] = (0, import_react.useState)(false);
	const [profileOpen, setProfileOpen] = (0, import_react.useState)(false);
	const [notificationsOpen, setNotificationsOpen] = (0, import_react.useState)(false);
	const visibleNavItems = (0, import_react.useMemo)(() => NAV_ITEMS.filter((item) => !item.ownerOnly || partner?.role === "owner"), [partner?.role]);
	const alerts = (0, import_react.useMemo)(() => buildDashboardAlerts({
		bookings,
		pendingDeductions,
		pendingNet
	}), [
		bookings,
		pendingDeductions,
		pendingNet
	]);
	if (!partner) return null;
	const active = [...NAV_ITEMS].sort((a, b) => b.to.length - a.to.length).find((item) => location.pathname === item.to || location.pathname.startsWith(item.to + "/"))?.key ?? "dashboard";
	const handleLogout = () => {
		logout();
		navigate({ to: "/" });
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface px-4 py-5 lg:flex",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "px-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Logo, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						className: "mt-8 flex flex-1 flex-col gap-1",
						children: visibleNavItems.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavButton, {
							item,
							active: item.key === active
						}, item.key))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 rounded-xl border border-border bg-surface-raised p-3.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "h-4 w-4 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs font-semibold text-foreground",
								children: "Verified partner"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-[11.5px] leading-snug text-muted-foreground",
							children: [partner.venueName, " is live and accepting bookings."]
						})]
					})
				]
			}),
			mobileNavOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fixed inset-0 z-40 flex lg:hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute inset-0 bg-ink/40",
					onClick: () => setMobileNavOpen(false)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative flex h-full w-72 flex-col bg-surface px-4 py-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between px-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Logo, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setMobileNavOpen(false),
							"aria-label": "Close menu",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-5 w-5 text-muted-foreground" })
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						className: "mt-8 flex flex-col gap-1",
						children: visibleNavItems.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavButton, {
							item,
							active: item.key === active,
							onClick: () => setMobileNavOpen(false)
						}, item.key))
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-h-screen flex-1 flex-col",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/90 px-5 py-3.5 backdrop-blur sm:px-8",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "lg:hidden",
							onClick: () => setMobileNavOpen(true),
							"aria-label": "Open menu",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "h-5 w-5 text-muted-foreground" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							className: "flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-foreground",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "h-4 w-4 text-muted-foreground" }),
								partner.venueName,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "h-3.5 w-3.5 text-muted-foreground" })
							]
						}),
						partner.role === "staff" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent",
							children: "Staff access"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "ml-auto flex items-center gap-2.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => {
										setNotificationsOpen((v) => !v);
										setProfileOpen(false);
									},
									className: "relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface",
									"aria-label": alerts.length > 0 ? `${alerts.length} notifications` : "Notifications",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "h-4 w-4 text-muted-foreground" }), alerts.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-destructive" })]
								}), notificationsOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "absolute right-0 top-11 w-[22rem] max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-xl border border-border bg-surface shadow-card",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "border-b border-border px-3.5 py-2.5",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm font-semibold text-foreground",
											children: "Notifications"
										})
									}), alerts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-col items-center justify-center gap-2 px-4 py-8 text-center",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "h-5 w-5 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm text-muted-foreground",
											children: "Nothing needs your attention."
										})]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex max-h-80 flex-col gap-2 overflow-y-auto p-2.5",
										children: alerts.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											onClick: () => setNotificationsOpen(false),
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertRow, { alert: a })
										}, a.id))
									})]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => {
										setProfileOpen((v) => !v);
										setNotificationsOpen(false);
									},
									className: "flex items-center gap-2 rounded-xl border border-border bg-surface py-1.5 pl-1.5 pr-2.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground",
										children: partner.ownerName.split(" ").map((p) => p[0]).slice(0, 2).join("")
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "h-3.5 w-3.5 text-muted-foreground" })]
								}), profileOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "absolute right-0 top-11 w-64 overflow-hidden rounded-xl border border-border bg-surface shadow-card",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "border-b border-border px-3.5 py-2.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm font-semibold text-foreground",
											children: partner.ownerName
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-muted-foreground",
											children: partner.businessName
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										onClick: handleLogout,
										className: "flex w-full items-center gap-2 px-3.5 py-2.5 text-sm font-semibold text-destructive",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "h-3.5 w-3.5" }), "Log out"]
									})]
								})]
							})]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
					className: "flex-1 px-5 py-6 sm:px-8 sm:py-8",
					children
				})]
			})
		]
	});
}
function DashboardLayout() {
	const navigate = useNavigate();
	const { partner, hydrated } = useAuth();
	(0, import_react.useEffect)(() => {
		if (!hydrated) return;
		if (!partner) navigate({ to: "/" });
		else if (partner.status !== "active") navigate({ to: "/pending" });
	}, [
		partner,
		hydrated,
		navigate
	]);
	if (!hydrated || !partner || partner.status !== "active") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-6 w-6 animate-spin text-muted-foreground" })
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DashboardShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) });
}
//#endregion
export { DashboardLayout as component };
