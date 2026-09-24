import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { u as formatTimeLabel } from "./inventory-OoBm9l3h.mjs";
import { i as formatINR } from "./dashboard-fdtWZGlf.mjs";
import { t as formatBookingId } from "./bookings-DZADHeQj.mjs";
import { t as BookingStatusBadge } from "./BookingBadges-BvGD7nzv.mjs";
import { r as nextPayoutDate } from "./payouts-ZXT5tEQr.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { $ as CalendarCheck, c as TrendingUp, l as TrendingDown, nt as Bell, s as TriangleAlert } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/DashboardWidgets-CTgQ_Esl.js
var import_jsx_runtime = require_jsx_runtime();
function buildDashboardAlerts(input) {
	const { bookings, pendingDeductions, pendingNet } = input;
	const alerts = [];
	const pendingPaymentsCount = bookings.filter((b) => b.paymentStatus === "pending" && (b.status === "confirmed" || b.status === "completed")).length;
	if (pendingPaymentsCount > 0) alerts.push({
		id: "pending-payments",
		level: "warning",
		text: `${pendingPaymentsCount} booking${pendingPaymentsCount === 1 ? "" : "s"} still ${pendingPaymentsCount === 1 ? "has" : "have"} payment collection pending`,
		action: "Review bookings",
		href: "/dashboard/bookings"
	});
	if (pendingDeductions.length > 0) {
		const first = pendingDeductions[0];
		alerts.push({
			id: "deduction",
			level: "warning",
			text: `A refund deduction of ${formatINR(first.netAmount)} will apply to your next payout (${formatBookingId(first.bookingId)} refunded)`,
			action: "View payout",
			href: "/dashboard/payouts"
		});
	}
	if (pendingNet > 0) alerts.push({
		id: "payout",
		level: "info",
		text: `Payout of ${formatINR(pendingNet)} is scheduled for ${nextPayoutDate().toLocaleDateString("en-IN", {
			weekday: "long",
			day: "numeric",
			month: "short"
		})}`,
		action: "View payout",
		href: "/dashboard/payouts"
	});
	return alerts;
}
function StatCard({ icon: Icon, label, value, delta, deltaGood = true, tone = "primary" }) {
	const hasDelta = delta !== void 0 && delta !== 0;
	const isPositive = (delta ?? 0) > 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "surface-card flex-1 rounded-2xl p-4 sm:p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: `flex h-9 w-9 items-center justify-center rounded-xl ${tone === "accent" ? "bg-accent/15" : "bg-primary/10"}`,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: `h-5 w-5 ${tone === "accent" ? "text-accent" : "text-primary"}` })
				}), hasDelta && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: `inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${isPositive === deltaGood ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`,
					children: [
						isPositive ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "h-3 w-3" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingDown, { className: "h-3 w-3" }),
						Math.abs(delta ?? 0),
						"%"
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 font-display text-2xl font-bold leading-none text-foreground",
				children: value
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1.5 text-xs font-medium text-muted-foreground",
				children: label
			})
		]
	});
}
function AlertRow({ alert }) {
	const cfg = alert.level === "warning" ? {
		color: "border-accent text-accent",
		bg: "bg-accent/10",
		Icon: TriangleAlert
	} : {
		color: "border-primary text-primary",
		bg: "bg-primary/5",
		Icon: Bell
	};
	const { Icon } = cfg;
	const [borderColor, textColor] = cfg.color.split(" ");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `flex items-start gap-3 rounded-xl border-l-4 px-3.5 py-3 ${borderColor} ${cfg.bg}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: `mt-0.5 h-4 w-4 shrink-0 ${textColor}` }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "flex-1 text-sm leading-snug text-foreground",
				children: alert.text
			}),
			alert.href ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: alert.href,
				className: `shrink-0 text-xs font-semibold underline underline-offset-2 ${textColor}`,
				children: alert.action
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: `shrink-0 text-xs font-semibold ${textColor}`,
				children: alert.action
			})
		]
	});
}
function dateLabel(dateISO) {
	const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
	const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
	if (dateISO === today) return "Today";
	if (dateISO === tomorrow) return "Tomorrow";
	return (/* @__PURE__ */ new Date(`${dateISO}T00:00:00`)).toLocaleDateString("en-IN", {
		day: "numeric",
		month: "short"
	});
}
function BookingsTable({ bookings }) {
	if (bookings.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "surface-card flex flex-col items-center justify-center rounded-2xl py-16 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarCheck, { className: "h-5 w-5 text-muted-foreground" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3.5 text-sm font-semibold text-foreground",
				children: "No bookings yet"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 max-w-xs text-sm text-muted-foreground",
				children: "Once your venue is approved and live, bookings will appear here."
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "surface-card overflow-hidden rounded-2xl",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
			className: "hidden w-full text-left sm:table",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
				className: "bg-surface-raised",
				children: [
					"Sport",
					"When",
					"Customer",
					"Status",
					"Amount"
				].map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
					className: "px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground",
					children: h
				}, h))
			}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: bookings.map((b, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
				className: i === 0 ? "" : "border-t border-border",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "p-0",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/dashboard/bookings/$bookingId",
							params: { bookingId: b.id },
							className: "block px-4 py-3.5 text-sm font-semibold text-foreground hover:text-primary",
							children: b.sport
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
						className: "px-4 py-3.5 text-sm text-muted-foreground",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-semibold text-foreground",
								children: dateLabel(b.date)
							}),
							" ",
							formatTimeLabel(b.startTime)
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-4 py-3.5 text-sm text-muted-foreground",
						children: b.customerName
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-4 py-3.5",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookingStatusBadge, { status: b.status })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-4 py-3.5 text-sm font-semibold text-foreground",
						children: formatINR(b.amount)
					})
				]
			}, b.id)) })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex flex-col divide-y divide-border sm:hidden",
			children: bookings.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/dashboard/bookings/$bookingId",
				params: { bookingId: b.id },
				className: "block px-4 py-3.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm font-semibold text-foreground",
							children: b.sport
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookingStatusBadge, { status: b.status })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-xs text-muted-foreground",
						children: [
							dateLabel(b.date),
							" · ",
							formatTimeLabel(b.startTime),
							" ·",
							" ",
							formatBookingId(b.id)
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-1.5 flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted-foreground",
							children: b.customerName
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm font-semibold text-foreground",
							children: formatINR(b.amount)
						})]
					})
				]
			}, b.id))
		})]
	});
}
function SkeletonDashboard() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "animate-pulse",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-6 w-56 rounded-md bg-surface-raised" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mt-2 h-4 w-72 rounded-md bg-surface-raised" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4",
				children: [
					0,
					1,
					2,
					3
				].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-28 rounded-2xl bg-surface-raised" }, i))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mt-6 h-32 rounded-2xl bg-surface-raised" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mt-6 h-64 rounded-2xl bg-surface-raised" })
		]
	});
}
//#endregion
export { buildDashboardAlerts as a, StatCard as i, BookingsTable as n, SkeletonDashboard as r, AlertRow as t };
