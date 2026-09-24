import { r as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { n as useBookings } from "./bookings-DKX0ntLe.mjs";
import { u as formatTimeLabel } from "./inventory-OoBm9l3h.mjs";
import { i as formatINR } from "./dashboard-fdtWZGlf.mjs";
import { i as statusLabel, t as formatBookingId } from "./bookings-DZADHeQj.mjs";
import { n as PaymentStatusBadge, t as BookingStatusBadge } from "./BookingBadges-BvGD7nzv.mjs";
import { _ as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { I as Download, Y as CalendarX2, g as Search } from "../_libs/lucide-react.mjs";
import { t as Button } from "./Button-DX-nONYl.mjs";
import { n as useInventory } from "./inventory-BgKRcK7F.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard.bookings.index-HO3BGqgB.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var STATUS_FILTERS = [
	{
		key: "all",
		label: "All statuses"
	},
	{
		key: "confirmed",
		label: "Confirmed"
	},
	{
		key: "completed",
		label: "Completed"
	},
	{
		key: "cancelled",
		label: "Cancelled"
	},
	{
		key: "no_show",
		label: "No-show"
	}
];
function dateLabel(dateISO) {
	return (/* @__PURE__ */ new Date(`${dateISO}T00:00:00`)).toLocaleDateString("en-IN", {
		day: "numeric",
		month: "short",
		year: "numeric"
	});
}
function downloadCsv(rows, filename) {
	if (rows.length === 0) return;
	const headers = Object.keys(rows[0]);
	const escape = (v) => `"${String(v).replace(/"/g, "\"\"")}"`;
	const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h] ?? "")).join(","))].join("\n");
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}
function BookingsListPage() {
	const { courts } = useInventory();
	const { bookings } = useBookings();
	const navigate = useNavigate();
	const [search, setSearch] = (0, import_react.useState)("");
	const [courtId, setCourtId] = (0, import_react.useState)("all");
	const [status, setStatus] = (0, import_react.useState)("all");
	const [dateFrom, setDateFrom] = (0, import_react.useState)("");
	const [dateTo, setDateTo] = (0, import_react.useState)("");
	const filtered = (0, import_react.useMemo)(() => {
		const q = search.trim().toLowerCase();
		return bookings.filter((b) => courtId === "all" ? true : b.courtId === courtId).filter((b) => status === "all" ? true : b.status === status).filter((b) => dateFrom ? b.date >= dateFrom : true).filter((b) => dateTo ? b.date <= dateTo : true).filter((b) => q === "" || b.customerName.toLowerCase().includes(q) || b.customerPhone.includes(q) || formatBookingId(b.id).toLowerCase().includes(q)).sort((a, b) => a.date === b.date ? a.startTime < b.startTime ? 1 : -1 : a.date < b.date ? 1 : -1);
	}, [
		bookings,
		search,
		courtId,
		status,
		dateFrom,
		dateTo
	]);
	const exportCsv = () => {
		downloadCsv(filtered.map((b) => ({
			"Booking ID": formatBookingId(b.id),
			Customer: b.customerName,
			Phone: b.customerPhone,
			"Sport/Court": `${b.sport} \u2014 ${b.courtName}`,
			Date: b.date,
			Time: `${b.startTime}\u2013${b.endTime}`,
			"Amount paid": b.amount,
			"Payment status": b.paymentStatus,
			"Payment method": b.paymentMethod,
			Status: statusLabel(b.status)
		})), `justplay-bookings-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`);
	};
	const openBooking = (id) => void navigate({
		to: "/dashboard/bookings/$bookingId",
		params: { bookingId: id }
	});
	const hasFilters = Boolean(search || courtId !== "all" || status !== "all" || dateFrom || dateTo);
	const clearFilters = () => {
		setSearch("");
		setCourtId("all");
		setStatus("all");
		setDateFrom("");
		setDateTo("");
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-center justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-2xl font-semibold text-foreground sm:text-[28px]",
				children: "Bookings"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted-foreground",
				children: "Every booking across your venue, filterable and exportable."
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "outline",
				size: "sm",
				onClick: exportCsv,
				disabled: filtered.length === 0,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "h-4 w-4" }), " Export CSV"]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "surface-card mt-5 flex flex-wrap items-center gap-3 rounded-2xl p-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: search,
						onChange: (e) => setSearch(e.target.value),
						placeholder: "Search customer name or phone",
						className: "w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					value: courtId,
					onChange: (e) => setCourtId(e.target.value),
					className: "rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "all",
						children: "All courts"
					}), courts.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: c.id,
						children: c.name
					}, c.id))]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
					value: status,
					onChange: (e) => setStatus(e.target.value),
					className: "rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary",
					children: STATUS_FILTERS.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: s.key,
						children: s.label
					}, s.key))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "date",
					value: dateFrom,
					onChange: (e) => setDateFrom(e.target.value),
					className: "rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary",
					"aria-label": "From date"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-sm text-muted-foreground",
					children: "to"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "date",
					value: dateTo,
					onChange: (e) => setDateTo(e.target.value),
					className: "rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary",
					"aria-label": "To date"
				}),
				hasFilters && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: clearFilters,
					className: "text-xs font-semibold text-muted-foreground underline underline-offset-2",
					children: "Clear filters"
				})
			]
		}),
		filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "surface-card mt-4 flex flex-col items-center justify-center rounded-2xl py-20 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-raised",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarX2, { className: "h-5 w-5 text-muted-foreground" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3.5 text-sm font-semibold text-foreground",
					children: bookings.length === 0 ? "No bookings yet" : "No bookings match your filters"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 max-w-xs text-sm text-muted-foreground",
					children: bookings.length === 0 ? "Once your venue is live, bookings from the app and walk-ins will appear here." : "Try widening your date range or clearing a filter."
				})
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "surface-card mt-4 overflow-x-auto rounded-2xl",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "w-full min-w-[880px] text-left",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
					className: "bg-surface-raised",
					children: [
						"Booking ID",
						"Customer",
						"Sport / Court",
						"Date",
						"Time",
						"Amount",
						"Payment",
						"Status"
					].map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground",
						children: h
					}, h))
				}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: filtered.map((b, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					onClick: () => openBooking(b.id),
					tabIndex: 0,
					onKeyDown: (e) => e.key === "Enter" && openBooking(b.id),
					className: `cursor-pointer hover:bg-secondary/40 ${i === 0 ? "" : "border-t border-border"}`,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-4 py-3.5 text-xs font-semibold text-muted-foreground",
							children: formatBookingId(b.id)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-4 py-3.5 text-sm font-semibold text-foreground",
							children: b.customerName
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
							className: "px-4 py-3.5 text-sm text-muted-foreground",
							children: [
								b.sport,
								" · ",
								b.courtName
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-4 py-3.5 text-sm text-muted-foreground",
							children: dateLabel(b.date)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-4 py-3.5 text-sm text-muted-foreground",
							children: formatTimeLabel(b.startTime)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-4 py-3.5 text-sm font-semibold text-foreground",
							children: formatINR(b.amount)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-4 py-3.5",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaymentStatusBadge, { status: b.paymentStatus })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-4 py-3.5",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookingStatusBadge, { status: b.status })
						})
					]
				}, b.id)) })]
			})
		})
	] });
}
//#endregion
export { BookingsListPage as component };
