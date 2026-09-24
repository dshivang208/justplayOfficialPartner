import { r as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { r as useAuth } from "./auth-DbMKYDei.mjs";
import { n as useBookings } from "./bookings-DKX0ntLe.mjs";
import { n as usePayouts } from "./payouts-BQdOpTXM.mjs";
import { n as STATS_ACTIVE, r as STATS_EMPTY, t as STATIC_ALERTS } from "./dashboard-fdtWZGlf.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { $ as CalendarCheck, N as IndianRupee, R as Clock, S as Percent, it as ArrowRight } from "../_libs/lucide-react.mjs";
import { a as buildDashboardAlerts, i as StatCard, n as BookingsTable, r as SkeletonDashboard, t as AlertRow } from "./DashboardWidgets-CTgQ_Esl.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard.index-BYTuuZYL.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function DashboardOverviewPage() {
	const { partner } = useAuth();
	const { bookings: allBookings } = useBookings();
	const { pendingDeductions, pendingNet } = usePayouts();
	const [loading, setLoading] = (0, import_react.useState)(true);
	(0, import_react.useEffect)(() => {
		setLoading(true);
		const t = setTimeout(() => setLoading(false), 600);
		return () => clearTimeout(t);
	}, []);
	const todayDate = (0, import_react.useMemo)(() => (/* @__PURE__ */ new Date()).toLocaleDateString("en-IN", {
		weekday: "long",
		day: "numeric",
		month: "long"
	}), []);
	const recentBookings = (0, import_react.useMemo)(() => [...allBookings].sort((a, b) => a.createdAt < b.createdAt ? 1 : -1).slice(0, 7), [allBookings]);
	if (!partner) return null;
	const isNewPartner = partner.sports.length === 0;
	const stats = isNewPartner ? STATS_EMPTY : STATS_ACTIVE;
	const dynamicAlerts = buildDashboardAlerts({
		bookings: allBookings,
		pendingDeductions,
		pendingNet
	});
	const alerts = isNewPartner ? [] : [...dynamicAlerts, ...STATIC_ALERTS];
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonDashboard, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-end justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-2xl font-semibold leading-tight text-foreground sm:text-[28px]",
				children: isNewPartner ? `Welcome, ${partner.ownerName.split(" ")[0]}` : `Good afternoon, ${partner.ownerName.split(" ")[0]}`
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-sm text-muted-foreground",
				children: [
					partner.venueName,
					" · ",
					todayDate
				]
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2.5 rounded-xl border border-border bg-surface px-4 py-2.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "h-4 w-4 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
					children: "Today"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-semibold text-foreground",
					children: stats.todayBookingsCount > 0 ? `${stats.todayBookingsCount} booking${stats.todayBookingsCount === 1 ? "" : "s"} \u00b7 next: ${stats.nextSlotLabel}` : "No bookings today yet"
				})] })]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
					icon: CalendarCheck,
					label: "Bookings this week",
					value: stats.bookingsThisWeek,
					delta: stats.bookingsThisWeekDelta
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
					icon: IndianRupee,
					label: "Revenue this week",
					value: `\u20B9${stats.revenueThisWeek.toLocaleString("en-IN")}`,
					delta: stats.revenueThisWeekDelta,
					tone: "accent"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
					icon: Percent,
					label: "Occupancy rate",
					value: `${stats.occupancyRate}%`,
					delta: stats.occupancyRateDelta
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
					icon: Clock,
					label: "Bookings today",
					value: stats.todayBookingsCount,
					tone: "accent"
				})
			]
		}),
		alerts.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-7",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-[15px] font-semibold text-foreground",
				children: "Needs your attention"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 flex flex-col gap-2.5",
				children: alerts.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertRow, { alert: a }, a.id))
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-7",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-[15px] font-semibold text-foreground",
					children: "Recent bookings"
				}), recentBookings.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/dashboard/bookings",
					className: "flex items-center gap-1 text-xs font-semibold text-primary",
					children: ["View all ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "h-3.5 w-3.5" })]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookingsTable, { bookings: isNewPartner ? [] : recentBookings })
			})]
		})
	] });
}
//#endregion
export { DashboardOverviewPage as component };
