import { r as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { n as useBookings } from "./bookings-DKX0ntLe.mjs";
import { u as formatTimeLabel } from "./inventory-OoBm9l3h.mjs";
import { i as formatINR } from "./dashboard-fdtWZGlf.mjs";
import { n as hoursUntilSlot, r as paymentMethodLabel, t as formatBookingId } from "./bookings-DZADHeQj.mjs";
import { n as PaymentStatusBadge, t as BookingStatusBadge } from "./BookingBadges-BvGD7nzv.mjs";
import { M as notFound, g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { E as MapPin, F as Flag, N as IndianRupee, U as CircleCheck, a as UserX, at as ArrowLeft, i as User, k as LoaderCircle, rt as Ban, v as ReceiptText, w as OctagonAlert, x as Phone } from "../_libs/lucide-react.mjs";
import { t as Route } from "./dashboard.bookings._bookingId-BJkriv6N.mjs";
import { t as Button } from "./Button-DX-nONYl.mjs";
import { t as Modal } from "./Modal-B2p3_zTG.mjs";
import { n as TextInput } from "./FormFields-DvCxt7FY.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard.bookings._bookingId-RhSeTz3N.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function InfoRow({ icon: Icon, label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-3 py-2.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-raised",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-4 w-4 text-muted-foreground" })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm font-semibold text-foreground",
			children: value
		})] })]
	});
}
function BookingDetailPage() {
	const { bookingId } = Route.useParams();
	const { getBooking, loading, markCompleted, markNoShow, cancelBooking, saveNotes, flagBooking, unflagBooking } = useBookings();
	const booking = getBooking(bookingId);
	const [cancelOpen, setCancelOpen] = (0, import_react.useState)(false);
	const [cancelReason, setCancelReason] = (0, import_react.useState)("");
	const [cancelling, setCancelling] = (0, import_react.useState)(false);
	const [cancelError, setCancelError] = (0, import_react.useState)(null);
	const [postCancelMessage, setPostCancelMessage] = (0, import_react.useState)(null);
	const [flagOpen, setFlagOpen] = (0, import_react.useState)(false);
	const [flagReason, setFlagReason] = (0, import_react.useState)("");
	const [flagBusy, setFlagBusy] = (0, import_react.useState)(false);
	const [flagError, setFlagError] = (0, import_react.useState)(null);
	const [actionBusy, setActionBusy] = (0, import_react.useState)(null);
	const [actionError, setActionError] = (0, import_react.useState)(null);
	const [notes, setNotes] = (0, import_react.useState)(booking?.notes ?? "");
	const [notesSaved, setNotesSaved] = (0, import_react.useState)(true);
	const [notesSaving, setNotesSaving] = (0, import_react.useState)(false);
	if (!booking) {
		if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex min-h-[50vh] items-center justify-center",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-6 w-6 animate-spin text-muted-foreground" })
		});
		throw notFound();
	}
	const dateLabel = (/* @__PURE__ */ new Date(`${booking.date}T00:00:00`)).toLocaleDateString("en-IN", {
		weekday: "long",
		day: "numeric",
		month: "long",
		year: "numeric"
	});
	const hoursNotice = Math.max(0, Math.round(hoursUntilSlot(booking) * 10) / 10);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-3xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/dashboard/bookings",
				className: "flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "h-4 w-4" }), " All bookings"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 flex flex-wrap items-center justify-between gap-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "font-display text-2xl font-semibold text-foreground",
							children: formatBookingId(booking.id)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookingStatusBadge, { status: booking.status }),
						booking.flagged && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flag, { className: "h-3 w-3" }), " Flagged"]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: [
						"Booked",
						" ",
						new Date(booking.createdAt).toLocaleDateString("en-IN", {
							day: "numeric",
							month: "short",
							year: "numeric"
						}),
						booking.source === "walk_in" ? " · Walk-in (front desk)" : " · JustPlay app"
					]
				})] })
			}),
			postCancelMessage && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex items-start gap-3 rounded-2xl border-l-4 border-accent bg-accent/10 px-4 py-3.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OctagonAlert, { className: "mt-0.5 h-4 w-4 shrink-0 text-accent" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-foreground",
					children: postCancelMessage
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "surface-card mt-5 rounded-2xl p-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-base font-semibold text-foreground",
					children: "Customer"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 flex flex-col divide-y divide-border",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
						icon: User,
						label: "Name",
						value: booking.customerName
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
						icon: Phone,
						label: "Phone",
						value: booking.customerPhone ? `+91 ${booking.customerPhone}` : "Not provided"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "surface-card mt-4 rounded-2xl p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-base font-semibold text-foreground",
						children: "Booking details"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex flex-col divide-y divide-border",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
								icon: MapPin,
								label: "Venue / court",
								value: `${booking.courtName} \u2014 ${booking.sport}`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
								icon: ReceiptText,
								label: "Date & time",
								value: `${dateLabel}, ${formatTimeLabel(booking.startTime)} \u2013 ${formatTimeLabel(booking.endTime)}`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
								icon: IndianRupee,
								label: "Amount",
								value: formatINR(booking.amount)
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-wrap items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs font-semibold text-muted-foreground",
								children: "Payment:"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaymentStatusBadge, { status: booking.paymentStatus }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-xs text-muted-foreground",
								children: ["via ", paymentMethodLabel(booking.paymentMethod)]
							})
						]
					})
				]
			}),
			booking.status === "cancelled" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "surface-card mt-4 rounded-2xl p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-base font-semibold text-foreground",
						children: "Cancellation"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-foreground",
						children: booking.cancellationReason || "No reason given."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `mt-3 flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-sm ${booking.paymentStatus === "refunded" ? "bg-primary/5 text-foreground" : "bg-surface-raised text-muted-foreground"}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OctagonAlert, { className: "mt-0.5 h-4 w-4 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: booking.paymentStatus === "refunded" ? "Refund issued to the customer." : booking.source === "walk_in" ? "Walk-in bookings are settled directly with the customer — nothing to refund through JustPlay." : booking.paymentStatus === "paid" ? `Cancelled inside the free-cancellation window (policy: 2+ hours before the slot) \u2014 no refund owed.` : "This booking was never paid — nothing to refund." })]
					})
				]
			}),
			booking.status === "confirmed" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "surface-card mt-4 rounded-2xl p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-base font-semibold text-foreground",
						children: "Actions"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-muted-foreground",
						children: hoursNotice > 0 ? `Slot is in ${hoursNotice} hours.` : "Slot time has passed."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								size: "sm",
								disabled: actionBusy != null,
								onClick: async () => {
									setActionBusy("complete");
									setActionError(null);
									try {
										await markCompleted(booking.id);
									} catch (e) {
										setActionError(e instanceof Error ? e.message : "Could not mark this booking completed.");
									} finally {
										setActionBusy(null);
									}
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-4 w-4" }), actionBusy === "complete" ? "Saving…" : "Mark as completed"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								size: "sm",
								variant: "accent",
								disabled: actionBusy != null,
								onClick: async () => {
									setActionBusy("no_show");
									setActionError(null);
									try {
										await markNoShow(booking.id);
									} catch (e) {
										setActionError(e instanceof Error ? e.message : "Could not mark this booking no-show.");
									} finally {
										setActionBusy(null);
									}
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserX, { className: "h-4 w-4" }), actionBusy === "no_show" ? "Saving…" : "Mark as no-show"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								size: "sm",
								variant: "outline",
								disabled: actionBusy != null,
								onClick: () => setCancelOpen(true),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ban, { className: "h-4 w-4" }), " Cancel booking"]
							})
						]
					}),
					actionError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-xs font-semibold text-destructive",
						children: actionError
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "surface-card mt-4 rounded-2xl p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-base font-semibold text-foreground",
						children: "Internal notes"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-0.5 text-xs text-muted-foreground",
						children: "Only visible to your venue staff."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						value: notes,
						onChange: (e) => {
							setNotes(e.target.value);
							setNotesSaved(false);
						},
						rows: 3,
						placeholder: "e.g. Regular customer, prefers evening slots",
						className: "mt-3 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "outline",
						className: "mt-2",
						disabled: notesSaved || notesSaving,
						onClick: async () => {
							setNotesSaving(true);
							try {
								await saveNotes(booking.id, notes);
								setNotesSaved(true);
							} catch {} finally {
								setNotesSaving(false);
							}
						},
						children: notesSaving ? "Saving…" : notesSaved ? "Saved" : "Save notes"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "surface-card mt-4 rounded-2xl p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-base font-semibold text-foreground",
						children: "Flag for review"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-0.5 text-xs text-muted-foreground",
						children: "Logs a dispute or trust concern against this booking — separate from marking it no-show."
					}),
					booking.flagged ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex items-start gap-3 rounded-xl border-l-4 border-destructive bg-destructive/5 px-3.5 py-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flag, { className: "mt-0.5 h-4 w-4 shrink-0 text-destructive" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-semibold text-foreground",
									children: booking.flagReason
								}), booking.flaggedAt && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-0.5 text-xs text-muted-foreground",
									children: ["Flagged ", new Date(booking.flaggedAt).toLocaleDateString("en-IN")]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								disabled: flagBusy,
								onClick: async () => {
									setFlagBusy(true);
									try {
										await unflagBooking(booking.id);
									} catch (e) {
										setFlagError(e instanceof Error ? e.message : "Could not remove this flag.");
									} finally {
										setFlagBusy(false);
									}
								},
								className: "shrink-0 text-xs font-semibold text-destructive underline underline-offset-2",
								children: flagBusy ? "Removing…" : "Remove flag"
							})
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						variant: "outline",
						className: "mt-3",
						onClick: () => setFlagOpen(true),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flag, { className: "h-4 w-4" }), " Flag this booking"]
					}),
					flagError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-xs font-semibold text-destructive",
						children: flagError
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, {
				open: cancelOpen,
				onClose: () => setCancelOpen(false),
				title: "Cancel this booking",
				width: "sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "This frees up the slot on your calendar immediately, and issues a refund automatically if the cancellation policy allows it."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextInput, {
							label: "Reason",
							placeholder: "e.g. Venue unavailable, customer requested",
							value: cancelReason,
							onChange: (e) => setCancelReason(e.target.value),
							autoFocus: true
						})
					}),
					cancelError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-xs font-semibold text-destructive",
						children: cancelError
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							className: "flex-1",
							disabled: cancelling,
							onClick: () => setCancelOpen(false),
							children: "Keep booking"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "destructive",
							className: "flex-1",
							disabled: !cancelReason.trim() || cancelling,
							onClick: async () => {
								setCancelling(true);
								setCancelError(null);
								try {
									const result = await cancelBooking(booking.id, cancelReason.trim());
									setCancelOpen(false);
									setCancelReason("");
									setPostCancelMessage(result.refundError ? result.refundError : result.refunded ? "Booking cancelled and refund issued." : "Booking cancelled.");
								} catch (e) {
									setCancelError(e instanceof Error ? e.message : "Could not cancel this booking.");
								} finally {
									setCancelling(false);
								}
							},
							children: cancelling ? "Cancelling…" : "Cancel booking"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, {
				open: flagOpen,
				onClose: () => setFlagOpen(false),
				title: "Flag this booking",
				width: "sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "For disputes or trust concerns — e.g. payment mismatch, abusive behaviour, suspected fraud."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextInput, {
							label: "Reason",
							placeholder: "e.g. Customer disputed the charge",
							value: flagReason,
							onChange: (e) => setFlagReason(e.target.value),
							autoFocus: true
						})
					}),
					flagError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-xs font-semibold text-destructive",
						children: flagError
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							className: "flex-1",
							disabled: flagBusy,
							onClick: () => setFlagOpen(false),
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "destructive",
							className: "flex-1",
							disabled: !flagReason.trim() || flagBusy,
							onClick: async () => {
								setFlagBusy(true);
								setFlagError(null);
								try {
									await flagBooking(booking.id, flagReason.trim());
									setFlagOpen(false);
									setFlagReason("");
								} catch (e) {
									setFlagError(e instanceof Error ? e.message : "Could not flag this booking.");
								} finally {
									setFlagBusy(false);
								}
							},
							children: flagBusy ? "Flagging…" : "Flag booking"
						})]
					})
				]
			})
		]
	});
}
//#endregion
export { BookingDetailPage as component };
