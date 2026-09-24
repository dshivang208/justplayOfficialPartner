import { r as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { n as useBookings } from "./bookings-DKX0ntLe.mjs";
import { a as dateISO, i as courtTimeRows, l as fetchSlotsForCourt, m as weekDates, p as startOfWeek, r as addDays, u as formatTimeLabel } from "./inventory-OoBm9l3h.mjs";
import { r as paymentMethodLabel, t as formatBookingId } from "./bookings-DZADHeQj.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { A as ListChecks, G as ChevronRight, K as ChevronLeft, O as Lock, U as CircleCheck, Z as CalendarDays, i as User, it as ArrowRight, k as LoaderCircle, p as SlidersHorizontal, t as X } from "../_libs/lucide-react.mjs";
import { t as Button } from "./Button-DX-nONYl.mjs";
import { t as Modal } from "./Modal-B2p3_zTG.mjs";
import { n as TextInput } from "./FormFields-DvCxt7FY.mjs";
import { n as useInventory } from "./inventory-BgKRcK7F.mjs";
import { t as PillTabs } from "./PillTabs-Cg1S6P6C.mjs";
import { t as Route } from "./dashboard.slots.index-D6qrJ2JU.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard.slots.index-DFCMPeg8.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var STATUS_STYLES = {
	available: "border border-primary/25 bg-primary/[0.06] text-foreground hover:bg-primary/[0.12] cursor-pointer",
	booked: "border border-primary/40 bg-primary/15 text-foreground hover:bg-primary/20 cursor-pointer",
	blocked: "border border-border bg-surface-raised text-muted-foreground hover:bg-secondary cursor-pointer",
	past: "border border-border/60 bg-surface-raised/50 text-muted-foreground/50 cursor-not-allowed"
};
function dayLabel(d) {
	return d.toLocaleDateString("en-IN", { weekday: "short" });
}
function dayNumber(d) {
	return d.getDate();
}
function isToday(d) {
	const t = /* @__PURE__ */ new Date();
	return d.toDateString() === t.toDateString();
}
function iso(d) {
	return d.toISOString().slice(0, 10);
}
function CalendarLegend() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex flex-wrap items-center gap-4",
		children: [
			{
				status: "available",
				label: "Available"
			},
			{
				status: "booked",
				label: "Booked"
			},
			{
				status: "blocked",
				label: "Blocked"
			},
			{
				status: "past",
				label: "Past"
			}
		].map((it) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-1.5 text-xs text-muted-foreground",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `h-3 w-3 rounded ${STATUS_STYLES[it.status].split(" ")[1]} border border-border` }), it.label]
		}, it.status))
	});
}
function SlotCell({ slot, selected, onClick }) {
	if (!slot) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-11 rounded-lg bg-transparent" });
	const clickable = slot.status !== "past";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		disabled: !clickable,
		onClick: () => clickable && onClick(slot),
		className: `flex h-11 w-full flex-col items-center justify-center rounded-lg text-[11px] font-semibold leading-tight transition-colors ${STATUS_STYLES[slot.status]} ${selected ? "ring-2 ring-primary ring-offset-1 ring-offset-surface" : ""}`,
		title: slot.status === "blocked" && slot.blockedReason ? slot.blockedReason : void 0,
		children: selected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-3.5 w-3.5 text-primary" }) : slot.status === "booked" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "h-3.5 w-3.5" }) : slot.status === "blocked" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "h-3.5 w-3.5" }) : slot.status === "past" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-[10px]",
			children: "—"
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["₹", slot.price] })
	});
}
function WeeklyCalendar({ court, slots, weekStart, isSelected, onSlotClick }) {
	const rows = (0, import_react.useMemo)(() => courtTimeRows(court), [court]);
	const days = (0, import_react.useMemo)(() => weekDates(weekStart), [weekStart]);
	const slotsByDay = (0, import_react.useMemo)(() => {
		const map = /* @__PURE__ */ new Map();
		for (const s of slots) {
			if (!map.has(s.date)) map.set(s.date, /* @__PURE__ */ new Map());
			map.get(s.date).set(s.startTime, s);
		}
		return map;
	}, [slots]);
	if (rows.length === 0) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "overflow-x-auto",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-[720px]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-[64px_repeat(7,1fr)] gap-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {}), days.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: `rounded-lg py-1.5 text-center ${isToday(d) ? "bg-primary/10" : ""}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
						children: dayLabel(d)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: `text-sm font-bold ${isToday(d) ? "text-primary" : "text-foreground"}`,
						children: dayNumber(d)
					})]
				}, iso(d)))]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1.5 flex flex-col gap-1.5",
				children: rows.map((time) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-[64px_repeat(7,1fr)] items-center gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "pr-1 text-right text-[11px] font-medium text-muted-foreground",
						children: formatTimeLabel(time)
					}), days.map((d) => {
						const dateStr = iso(d);
						const slot = slotsByDay.get(dateStr)?.get(time);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlotCell, {
							slot,
							selected: slot ? isSelected(slot) : false,
							onClick: onSlotClick
						}, dateStr + time);
					})]
				}, time))
			})]
		})
	});
}
function DailyCalendar({ slots, isSelected, onSlotClick }) {
	if (slots.length === 0) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex flex-col gap-2",
		children: slots.map((slot) => {
			const clickable = slot.status !== "past";
			const selected = isSelected(slot);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				disabled: !clickable,
				onClick: () => clickable && onSlotClick(slot),
				className: `flex items-center justify-between rounded-xl px-4 py-3 text-left text-sm transition-colors ${STATUS_STYLES[slot.status]} ${selected ? "ring-2 ring-primary ring-offset-1 ring-offset-surface" : ""}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "flex items-center gap-2 font-semibold text-foreground",
					children: [
						selected && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-4 w-4 text-primary" }),
						formatTimeLabel(slot.startTime),
						" – ",
						formatTimeLabel(slot.endTime)
					]
				}), slot.status === "booked" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "flex items-center gap-2 text-xs font-semibold",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "h-3.5 w-3.5" }), "Booked"]
				}) : slot.status === "blocked" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "flex items-center gap-1.5 text-xs font-semibold",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "h-3.5 w-3.5" }), slot.blockedReason ?? "Blocked"]
				}) : slot.status === "past" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs",
					children: "Past"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-xs font-semibold",
					children: [
						"₹",
						slot.price.toLocaleString("en-IN"),
						" · Available"
					]
				})]
			}, slot.id);
		})
	});
}
function formatDateLabel(dateISO) {
	return (/* @__PURE__ */ new Date(`${dateISO}T00:00:00`)).toLocaleDateString("en-IN", {
		weekday: "long",
		day: "numeric",
		month: "long"
	});
}
var PAYMENT_OPTIONS = [
	{
		method: "cash",
		label: "Cash",
		impliesPaid: false
	},
	{
		method: "upi",
		label: "UPI",
		impliesPaid: false
	},
	{
		method: "online",
		label: "Already paid online",
		impliesPaid: true
	}
];
function SlotActionModal({ slots, courtName, onClose, onChanged }) {
	const { blockSlot, unblockSlot } = useInventory();
	const { bookings, createWalkinBooking } = useBookings();
	const [mode, setMode] = (0, import_react.useState)("summary");
	const [blockReason, setBlockReason] = (0, import_react.useState)("");
	const [customerName, setCustomerName] = (0, import_react.useState)("");
	const [customerPhone, setCustomerPhone] = (0, import_react.useState)("");
	const [paymentMethod, setPaymentMethod] = (0, import_react.useState)("cash");
	const [markPaidNow, setMarkPaidNow] = (0, import_react.useState)(true);
	const [amount, setAmount] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	if (slots.length === 0) return null;
	const firstSlot = slots[0];
	const lastSlot = slots[slots.length - 1];
	const isMulti = slots.length > 1;
	const totalPrice = slots.reduce((sum, s) => sum + s.price, 0);
	const timeRange = `${formatTimeLabel(firstSlot.startTime)} \u2013 ${formatTimeLabel(lastSlot.endTime)}`;
	const dateLabel = formatDateLabel(firstSlot.date);
	const selectedOption = PAYMENT_OPTIONS.find((o) => o.method === paymentMethod);
	const effectiveAmount = amount === "" ? totalPrice : Number(amount);
	const matchedBooking = bookings.find((b) => b.courtId === firstSlot.courtId && b.date === firstSlot.date && b.startTime === firstSlot.startTime);
	const close = () => {
		setMode("summary");
		setBlockReason("");
		setCustomerName("");
		setCustomerPhone("");
		setPaymentMethod("cash");
		setMarkPaidNow(true);
		setAmount("");
		setError(null);
		onClose();
	};
	const header = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-5 rounded-xl bg-surface-raised px-4 py-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "text-sm font-semibold text-foreground",
			children: [
				courtName,
				" · ",
				firstSlot.sport,
				isMulti ? ` \u00b7 ${slots.length} slots` : ""
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-0.5 text-sm text-muted-foreground",
			children: [
				dateLabel,
				" · ",
				timeRange
			]
		})]
	});
	if (firstSlot.status === "booked") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, {
		open: true,
		onClose: close,
		title: "Booking summary",
		children: [header, matchedBooking ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3 rounded-xl border border-border p-3.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary",
							children: matchedBooking.customerName.split(" ").map((p) => p[0]).slice(0, 2).join("")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-semibold text-foreground",
							children: matchedBooking.customerName
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted-foreground",
							children: [formatBookingId(matchedBooking.id), matchedBooking.customerPhone ? ` \u00b7 +91 ${matchedBooking.customerPhone}` : ""]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: `ml-auto rounded-full px-2.5 py-1 text-xs font-semibold ${matchedBooking.paymentStatus === "paid" ? "bg-primary/10 text-primary" : matchedBooking.paymentStatus === "refunded" ? "bg-surface-raised text-muted-foreground" : "bg-accent/15 text-accent"}`,
							children: matchedBooking.paymentStatus === "paid" ? "Paid" : matchedBooking.paymentStatus === "refunded" ? "Refunded" : "Payment pending"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted-foreground",
						children: "Payment method"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-semibold text-foreground",
						children: paymentMethodLabel(matchedBooking.paymentMethod)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted-foreground",
						children: "Booked via"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-semibold text-foreground",
						children: matchedBooking.source === "walk_in" ? "Walk-in (front desk)" : "JustPlay app"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/dashboard/bookings/$bookingId",
					params: { bookingId: matchedBooking.id },
					className: "mt-2 flex items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground hover:bg-secondary",
					children: ["View full booking details ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "h-3.5 w-3.5" })]
				})
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start gap-3 rounded-xl border-l-4 border-primary bg-primary/5 px-3.5 py-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "mt-0.5 h-4 w-4 shrink-0 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-foreground",
				children: "This slot is booked, but the matching booking hasn't loaded yet. Try the Bookings page."
			})]
		})]
	});
	if (firstSlot.status === "blocked") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, {
		open: true,
		onClose: close,
		title: "Slot blocked",
		children: [
			header,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-3 rounded-xl border-l-4 border-muted-foreground bg-surface-raised px-3.5 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-semibold text-foreground",
					children: firstSlot.blockedReason ?? "Blocked"
				})]
			}),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-xs font-semibold text-destructive",
				children: error
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "outline",
				className: "mt-4 w-full",
				disabled: busy,
				onClick: async () => {
					setBusy(true);
					setError(null);
					try {
						await unblockSlot([firstSlot.id]);
						onChanged();
						close();
					} catch (e) {
						setError(e instanceof Error ? e.message : "Could not unblock this slot.");
					} finally {
						setBusy(false);
					}
				},
				children: busy ? "Unblocking…" : "Unblock this slot"
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, {
		open: true,
		onClose: close,
		title: isMulti ? `${slots.length} slots selected` : "Available slot",
		children: [
			header,
			mode === "summary" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => setMode("book"),
					className: "flex items-center gap-3 rounded-xl border border-border p-3.5 text-left hover:border-primary",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "h-5 w-5 text-primary" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block text-sm font-semibold text-foreground",
						children: "Create walk-in booking"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block text-xs text-muted-foreground",
						children: "For a customer booking at the front desk"
					})] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => setMode("block"),
					className: "flex items-center gap-3 rounded-xl border border-border p-3.5 text-left hover:border-accent",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "h-5 w-5 text-accent" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "block text-sm font-semibold text-foreground",
						children: ["Block ", isMulti ? "these slots" : "this slot"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block text-xs text-muted-foreground",
						children: "e.g. maintenance, private event"
					})] })]
				})]
			}),
			mode === "block" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextInput, {
						label: "Reason",
						placeholder: "e.g. Turf maintenance",
						value: blockReason,
						onChange: (e) => setBlockReason(e.target.value),
						autoFocus: true
					}),
					error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-semibold text-destructive",
						children: error
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							className: "flex-1",
							disabled: busy,
							onClick: () => setMode("summary"),
							children: "Back"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "accent",
							className: "flex-1",
							disabled: !blockReason.trim() || busy,
							onClick: async () => {
								setBusy(true);
								setError(null);
								try {
									await blockSlot(slots.map((s) => s.id), blockReason.trim());
									onChanged();
									close();
								} catch (e) {
									setError(e instanceof Error && e.message.includes("SLOT_NOT_AVAILABLE") ? "One of these slots was just taken. Refresh and try again." : e instanceof Error ? e.message : "Could not block this slot.");
								} finally {
									setBusy(false);
								}
							},
							children: busy ? "Blocking…" : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-4 w-4" }),
								" Block",
								" ",
								isMulti ? `${slots.length} slots` : "slot"
							] })
						})]
					})
				]
			}),
			mode === "book" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextInput, {
						label: "Customer name",
						placeholder: "e.g. Rohan Kapoor",
						value: customerName,
						onChange: (e) => setCustomerName(e.target.value),
						autoFocus: true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextInput, {
						label: "Phone number",
						type: "tel",
						inputMode: "numeric",
						placeholder: "98765 43210",
						value: customerPhone,
						onChange: (e) => setCustomerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mb-1.5 block text-sm font-semibold text-foreground",
						children: "Payment method"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex gap-2",
						children: PAYMENT_OPTIONS.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => {
								setPaymentMethod(o.method);
								if (o.impliesPaid) setMarkPaidNow(true);
							},
							className: `flex-1 rounded-xl border py-2 text-xs font-semibold transition-colors ${paymentMethod === o.method ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`,
							children: o.label
						}, o.method))
					})] }),
					!selectedOption.impliesPaid && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mb-1.5 block text-sm font-semibold text-foreground",
						children: "Payment status"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex gap-2",
						children: [{
							value: true,
							label: "Collected now"
						}, {
							value: false,
							label: "Pay later"
						}].map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setMarkPaidNow(opt.value),
							className: `flex-1 rounded-xl border py-2 text-sm font-semibold transition-colors ${markPaidNow === opt.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`,
							children: opt.label
						}, String(opt.value)))
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "mb-1.5 block text-sm font-semibold text-foreground",
							children: ["Amount", isMulti ? ` (${slots.length} slots)` : ""]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1 rounded-xl border border-border bg-surface px-3.5 py-2.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm text-muted-foreground",
								children: "₹"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "number",
								min: 0,
								placeholder: String(totalPrice),
								value: amount,
								onChange: (e) => setAmount(e.target.value),
								className: "w-full bg-transparent text-sm text-foreground outline-none"
							})]
						})]
					}),
					error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-semibold text-destructive",
						children: error
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							className: "flex-1",
							disabled: busy,
							onClick: () => setMode("summary"),
							children: "Back"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "flex-1",
							disabled: !customerName.trim() || customerPhone.length !== 10 || busy,
							onClick: async () => {
								setBusy(true);
								setError(null);
								try {
									await createWalkinBooking({
										slotIds: slots.map((s) => s.id),
										customerName: customerName.trim(),
										customerPhone,
										amount: effectiveAmount,
										paymentMethod,
										paymentStatus: selectedOption.impliesPaid || markPaidNow ? "paid" : "pending"
									});
									onChanged();
									close();
								} catch (e) {
									setError(e instanceof Error && e.message.includes("SLOT_UNAVAILABLE") ? "Someone just booked one of these slots. Refresh and try another." : e instanceof Error ? e.message : "Could not create this booking.");
								} finally {
									setBusy(false);
								}
							},
							children: busy ? "Booking…" : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-4 w-4" }), " Confirm booking"] })
						})]
					})
				]
			})
		]
	});
}
function weekRangeLabel(weekStart) {
	const end = addDays(weekStart, 6);
	const sameMonth = weekStart.getMonth() === end.getMonth();
	return `${weekStart.toLocaleDateString("en-IN", {
		day: "numeric",
		month: sameMonth ? void 0 : "short"
	})} \u2013 ${end.toLocaleDateString("en-IN", {
		day: "numeric",
		month: "short",
		year: "numeric"
	})}`;
}
function CalendarPage() {
	const { courts } = useInventory();
	const { courtId: preselectedCourtId } = Route.useSearch();
	const [selectedCourtId, setSelectedCourtId] = (0, import_react.useState)(preselectedCourtId ?? courts[0]?.id ?? "");
	const [view, setView] = (0, import_react.useState)("week");
	const [anchor, setAnchor] = (0, import_react.useState)(() => /* @__PURE__ */ new Date());
	const [pendingSelection, setPendingSelection] = (0, import_react.useState)([]);
	const [activeSlots, setActiveSlots] = (0, import_react.useState)([]);
	const [slots, setSlots] = (0, import_react.useState)([]);
	const [slotsLoading, setSlotsLoading] = (0, import_react.useState)(false);
	const selectedCourt = courts.find((c) => c.id === selectedCourtId) ?? courts[0];
	const weekStart = (0, import_react.useMemo)(() => startOfWeek(anchor), [anchor]);
	const rangeFrom = view === "week" ? dateISO(weekStart) : dateISO(anchor);
	const rangeTo = view === "week" ? dateISO(addDays(weekStart, 6)) : dateISO(anchor);
	const courtRows = (0, import_react.useMemo)(() => selectedCourt ? courtTimeRows(selectedCourt) : [], [selectedCourt]);
	const step = (dir) => setAnchor((d) => addDays(d, view === "week" ? dir * 7 : dir));
	const loadSlots = (0, import_react.useCallback)(async () => {
		if (!selectedCourt?.opensAt) {
			setSlots([]);
			return;
		}
		setSlotsLoading(true);
		const data = await fetchSlotsForCourt(selectedCourt.id, rangeFrom, rangeTo);
		setSlots(data);
		setSlotsLoading(false);
	}, [
		selectedCourt,
		rangeFrom,
		rangeTo
	]);
	(0, import_react.useEffect)(() => {
		loadSlots();
	}, [loadSlots]);
	(0, import_react.useEffect)(() => {
		setPendingSelection([]);
	}, [
		selectedCourtId,
		view,
		rangeFrom,
		rangeTo
	]);
	(0, import_react.useEffect)(() => {
		if (courts.length === 0) return;
		if (!courts.some((c) => c.id === selectedCourtId)) setSelectedCourtId(preselectedCourtId ?? courts[0].id);
	}, [
		courts,
		selectedCourtId,
		preselectedCourtId
	]);
	const handleSlotClick = (slot) => {
		if (slot.status !== "available") {
			setPendingSelection([]);
			setActiveSlots([slot]);
			return;
		}
		setPendingSelection((prev) => {
			if (prev.some((s) => s.id === slot.id)) return [];
			if (prev.length === 0) return [slot];
			if (prev[0].date !== slot.date) return [slot];
			const firstIdx = courtRows.indexOf(prev[0].startTime);
			const lastIdx = courtRows.indexOf(prev[prev.length - 1].startTime);
			const slotIdx = courtRows.indexOf(slot.startTime);
			if (slotIdx === lastIdx + 1) return [...prev, slot];
			if (slotIdx === firstIdx - 1) return [slot, ...prev];
			return [slot];
		});
	};
	const isSlotSelected = (0, import_react.useCallback)((slot) => pendingSelection.some((s) => s.id === slot.id), [pendingSelection]);
	const pendingTotal = pendingSelection.reduce((sum, s) => sum + s.price, 0);
	if (courts.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "surface-card flex flex-col items-center justify-center rounded-2xl py-24 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-raised",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListChecks, { className: "h-6 w-6 text-muted-foreground" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-4 font-display text-xl font-semibold text-foreground",
				children: "You haven't added any courts yet"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1.5 max-w-sm text-sm text-muted-foreground",
				children: "Add a court or sport offering, then run Bulk Slot Setup to open it up for bookings."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				className: "mt-5",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/dashboard/slots/courts",
					children: "Add your first court"
				})
			})
		]
	});
	const needsSetup = selectedCourt && !selectedCourt.opensAt;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-center gap-3",
			children: [courts.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PillTabs, {
				options: courts.map((c) => ({
					key: c.id,
					label: c.name
				})),
				value: selectedCourtId || courts[0].id,
				onChange: setSelectedCourtId
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "rounded-xl bg-surface-raised px-4 py-2 text-sm font-semibold text-foreground",
				children: courts[0].name
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "ml-auto flex items-center gap-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PillTabs, {
					options: [{
						key: "week",
						label: "Week"
					}, {
						key: "day",
						label: "Day"
					}],
					value: view,
					onChange: setView
				})
			})]
		}),
		needsSetup ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "surface-card mt-5 flex flex-col items-center justify-center rounded-2xl py-24 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-raised",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlidersHorizontal, { className: "h-6 w-6 text-muted-foreground" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
					className: "mt-4 font-display text-xl font-semibold text-foreground",
					children: [selectedCourt.name, " isn't set up yet"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1.5 max-w-sm text-sm text-muted-foreground",
					children: "Set operating hours, slot duration and pricing to start generating availability for this court."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					className: "mt-5",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/dashboard/slots/setup",
						search: { courtId: selectedCourt.id },
						children: "Run Bulk Slot Setup"
					})
				})
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => step(-1),
							className: "flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary",
							"aria-label": "Previous",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "h-4 w-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => step(1),
							className: "flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary",
							"aria-label": "Next",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "h-4 w-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "ml-1 flex items-center gap-1.5 text-sm font-semibold text-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, { className: "h-4 w-4 text-muted-foreground" }), view === "week" ? weekRangeLabel(weekStart) : anchor.toLocaleDateString("en-IN", {
								weekday: "long",
								day: "numeric",
								month: "long"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setAnchor(/* @__PURE__ */ new Date()),
							className: "ml-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/10",
							children: "Today"
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarLegend, {})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-xs text-muted-foreground",
				children: "Click an available slot to select it, then click the next one to extend a run — handy for a walk-in booking or block spanning more than one slot."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "surface-card relative mt-4 rounded-2xl p-4 sm:p-5",
				children: [slotsLoading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-surface/70",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-5 w-5 animate-spin text-muted-foreground" })
				}), view === "week" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WeeklyCalendar, {
					court: selectedCourt,
					slots,
					weekStart,
					isSelected: isSlotSelected,
					onSlotClick: handleSlotClick
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DailyCalendar, {
					slots,
					isSelected: isSlotSelected,
					onSlotClick: handleSlotClick
				})]
			})
		] }),
		pendingSelection.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur sm:inset-x-auto sm:bottom-6 sm:right-6 sm:rounded-2xl sm:border sm:shadow-lg",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex max-w-lg items-center gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-4 w-4 shrink-0 text-primary" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "font-semibold text-foreground",
							children: [
								pendingSelection.length,
								" slot",
								pendingSelection.length > 1 ? "s" : "",
								" selected"
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted-foreground",
							children: [
								"\\u20b9",
								pendingTotal.toLocaleString("en-IN"),
								" total"
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setPendingSelection([]),
						className: "flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary",
						"aria-label": "Cancel selection",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => {
							setActiveSlots(pendingSelection);
							setPendingSelection([]);
						},
						children: "Continue"
					})
				]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlotActionModal, {
			slots: activeSlots,
			courtName: selectedCourt?.name ?? "",
			onClose: () => setActiveSlots([]),
			onChanged: loadSlots
		})
	] });
}
//#endregion
export { CalendarPage as component };
