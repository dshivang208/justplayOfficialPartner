import { r as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { d as isOvernightRange, n as SPORT_OPTIONS, u as formatTimeLabel } from "./inventory-OoBm9l3h.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { B as CircleSlash, C as Pencil, E as MapPin, X as CalendarOff, b as Plus, d as Sparkles, u as Trash2 } from "../_libs/lucide-react.mjs";
import { t as Button } from "./Button-DX-nONYl.mjs";
import { t as Modal } from "./Modal-B2p3_zTG.mjs";
import { n as TextInput } from "./FormFields-DvCxt7FY.mjs";
import { n as useInventory } from "./inventory-BgKRcK7F.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard.slots.courts-DlCNzLNw.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function CourtsPage() {
	const { courts, priceRulesForCourt, addCourt, updateCourt, deleteCourt, exceptions, addException, removeException } = useInventory();
	const [addOpen, setAddOpen] = (0, import_react.useState)(false);
	const [editCourt, setEditCourt] = (0, import_react.useState)(null);
	const [deleteCandidate, setDeleteCandidate] = (0, import_react.useState)(null);
	const [exceptionOpen, setExceptionOpen] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-lg font-semibold text-foreground",
					children: "Courts & sports"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					onClick: () => setAddOpen(true),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-4 w-4" }), " Add court"]
				})]
			}), courts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "surface-card mt-4 flex flex-col items-center justify-center rounded-2xl py-16 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-raised",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "h-5 w-5 text-muted-foreground" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3.5 text-sm font-semibold text-foreground",
						children: "No courts yet"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 max-w-xs text-sm text-muted-foreground",
						children: "Add each court or sport your venue offers — e.g. \"Turf A — Football\"."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						className: "mt-4",
						onClick: () => setAddOpen(true),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-4 w-4" }), " Add your first court"]
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 flex flex-col gap-2.5",
				children: courts.map((court) => {
					const rules = priceRulesForCourt(court.id);
					const priceLow = rules.length ? Math.min(...rules.map((r) => r.pricePerSlot)) : null;
					const priceHigh = rules.length ? Math.max(...rules.map((r) => r.pricePerSlot)) : null;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "surface-card flex flex-wrap items-center gap-4 rounded-2xl p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-display text-base font-semibold text-foreground",
										children: court.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `rounded-full px-2 py-0.5 text-[11px] font-semibold ${court.status === "active" ? "bg-primary/10 text-primary" : "bg-surface-raised text-muted-foreground"}`,
										children: court.status === "active" ? "Active" : "Inactive"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-xs text-muted-foreground",
									children: court.sport
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1.5 text-xs text-muted-foreground",
									children: [court.opensAt && court.closesAt ? `${formatTimeLabel(court.opensAt)} \u2013 ${formatTimeLabel(court.closesAt)}${isOvernightRange(court.opensAt, court.closesAt) ? court.opensAt === court.closesAt ? " (24 hours)" : " (+1 day)" : ""} \u00b7 ${court.slotDurationMinutes}-min slots` : "Hours not set up yet", priceLow != null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
										" ",
										"· ₹",
										priceLow,
										priceHigh !== priceLow ? `\u2013\u20B9${priceHigh}` : ""
									] })]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "outline",
									asChild: true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
										to: "/dashboard/slots/setup",
										search: { courtId: court.id },
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-3.5 w-3.5" }), court.opensAt ? "Edit hours & pricing" : "Set up"]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setEditCourt(court),
									className: "flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-secondary",
									"aria-label": "Edit court",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-4 w-4" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setDeleteCandidate(court),
									className: "flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:border-destructive hover:text-destructive",
									"aria-label": "Delete court",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" })
								})
							]
						})]
					}, court.id);
				})
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-lg font-semibold text-foreground",
					children: "Holidays & exceptions"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-0.5 text-sm text-muted-foreground",
					children: "Close the venue or change hours for a specific date."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					variant: "outline",
					onClick: () => setExceptionOpen(true),
					disabled: courts.length === 0,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarOff, { className: "h-4 w-4" }), " Add exception"]
				})]
			}), exceptions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-sm text-muted-foreground",
				children: "No exceptions set. Every date follows normal operating hours."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 flex flex-col gap-2",
				children: exceptions.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "surface-card flex items-center gap-3 rounded-xl p-3.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleSlash, { className: "h-4 w-4 text-accent" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-semibold text-foreground",
								children: (/* @__PURE__ */ new Date(`${e.date}T00:00:00`)).toLocaleDateString("en-IN", {
									weekday: "long",
									day: "numeric",
									month: "long"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted-foreground",
								children: [e.type === "closed" ? "Closed" : `Modified hours: ${e.opensAt} \u2013 ${e.closesAt}`, e.reason ? ` \u00b7 ${e.reason}` : ""]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => removeException(e.id).catch((err) => console.error("Could not remove exception:", err)),
							className: "text-xs font-semibold text-destructive",
							children: "Remove"
						})
					]
				}, e.id))
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AddCourtModal, {
				open: addOpen,
				onClose: () => setAddOpen(false),
				onAdd: addCourt
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditCourtModal, {
				court: editCourt,
				onClose: () => setEditCourt(null),
				onSave: updateCourt
			}, editCourt?.id ?? "none"),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeleteCourtModal, {
				court: deleteCandidate,
				onClose: () => setDeleteCandidate(null),
				onDelete: async (id) => {
					await deleteCourt(id);
					setDeleteCandidate(null);
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AddExceptionModal, {
				open: exceptionOpen,
				onClose: () => setExceptionOpen(false),
				onAdd: addException
			})
		]
	});
}
function AddCourtModal({ open, onClose, onAdd }) {
	const [name, setName] = (0, import_react.useState)("");
	const [sport, setSport] = (0, import_react.useState)(SPORT_OPTIONS[0]);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const close = () => {
		setName("");
		setSport(SPORT_OPTIONS[0]);
		setError(null);
		onClose();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
		open,
		onClose: close,
		title: "Add a court or sport",
		description: "You can set operating hours and pricing next, via Bulk Slot Setup.",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextInput, {
					label: "Court name",
					placeholder: "e.g. Turf A",
					value: name,
					onChange: (e) => setName(e.target.value),
					autoFocus: true
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mb-1.5 block text-sm font-semibold text-foreground",
					children: "Sport"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
					value: sport,
					onChange: (e) => setSport(e.target.value),
					className: "w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary",
					children: SPORT_OPTIONS.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: s,
						children: s
					}, s))
				})] }),
				error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-semibold text-destructive",
					children: error
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					disabled: name.trim().length < 2 || busy,
					onClick: async () => {
						setBusy(true);
						setError(null);
						try {
							await onAdd({
								name: name.trim(),
								sport
							});
							close();
						} catch (e) {
							setError(e instanceof Error ? e.message : "Could not add this court.");
						} finally {
							setBusy(false);
						}
					},
					children: busy ? "Adding…" : "Add court"
				})
			]
		})
	});
}
function EditCourtModal({ court, onClose, onSave }) {
	const [name, setName] = (0, import_react.useState)(court?.name ?? "");
	const [sport, setSport] = (0, import_react.useState)(court?.sport ?? SPORT_OPTIONS[0]);
	const [status, setStatus] = (0, import_react.useState)(court?.status ?? "active");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	if (!court) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
		open: true,
		onClose,
		title: "Edit court",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextInput, {
					label: "Court name",
					value: name,
					onChange: (e) => setName(e.target.value)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mb-1.5 block text-sm font-semibold text-foreground",
					children: "Sport"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
					value: sport,
					onChange: (e) => setSport(e.target.value),
					className: "w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary",
					children: SPORT_OPTIONS.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: s,
						children: s
					}, s))
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mb-1.5 block text-sm font-semibold text-foreground",
						children: "Status"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex gap-2",
						children: ["active", "inactive"].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setStatus(s),
							className: `flex-1 rounded-xl border py-2 text-sm font-semibold capitalize transition-colors ${status === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`,
							children: s
						}, s))
					}),
					status === "inactive" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1.5 text-xs text-muted-foreground",
						children: "Inactive courts stop appearing to customers, but keep their history."
					})
				] }),
				error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-semibold text-destructive",
					children: error
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					disabled: name.trim().length < 2 || busy,
					onClick: async () => {
						setBusy(true);
						setError(null);
						try {
							await onSave(court.id, {
								name: name.trim(),
								sport,
								status
							});
							onClose();
						} catch (e) {
							setError(e instanceof Error ? e.message : "Could not save changes.");
							setBusy(false);
						}
					},
					children: busy ? "Saving…" : "Save changes"
				})
			]
		})
	});
}
function DeleteCourtModal({ court, onClose, onDelete }) {
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	if (!court) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, {
		open: true,
		onClose,
		title: `Delete ${court.name}?`,
		width: "sm",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "This removes the court, its pricing and generated slots. This can't be undone."
			}),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-xs font-semibold text-destructive",
				children: error
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					className: "flex-1",
					disabled: busy,
					onClick: onClose,
					children: "Cancel"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "destructive",
					className: "flex-1",
					disabled: busy,
					onClick: async () => {
						setBusy(true);
						setError(null);
						try {
							await onDelete(court.id);
						} catch (e) {
							setError(e instanceof Error ? e.message : "Could not delete this court.");
							setBusy(false);
						}
					},
					children: busy ? "Deleting…" : "Delete"
				})]
			})
		]
	});
}
function AddExceptionModal({ open, onClose, onAdd }) {
	const [date, setDate] = (0, import_react.useState)("");
	const [type, setType] = (0, import_react.useState)("closed");
	const [opensAt, setOpensAt] = (0, import_react.useState)("10:00");
	const [closesAt, setClosesAt] = (0, import_react.useState)("18:00");
	const [reason, setReason] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const close = () => {
		setDate("");
		setType("closed");
		setReason("");
		setError(null);
		onClose();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
		open,
		onClose: close,
		title: "Add a date exception",
		description: "Applies across every court on this date.",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mb-1.5 block text-sm font-semibold text-foreground",
						children: "Date"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "date",
						value: date,
						onChange: (e) => setDate(e.target.value),
						className: "w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mb-1.5 block text-sm font-semibold text-foreground",
					children: "Type"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setType("closed"),
						className: `flex-1 rounded-xl border py-2 text-sm font-semibold transition-colors ${type === "closed" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`,
						children: "Closed all day"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setType("modified_hours"),
						className: `flex-1 rounded-xl border py-2 text-sm font-semibold transition-colors ${type === "modified_hours" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`,
						children: "Modified hours"
					})]
				})] }),
				type === "modified_hours" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mb-1.5 block text-sm font-semibold text-foreground",
							children: "Opens at"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "time",
							value: opensAt,
							onChange: (e) => setOpensAt(e.target.value),
							className: "w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mb-1.5 block text-sm font-semibold text-foreground",
							children: "Closes at"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "time",
							value: closesAt,
							onChange: (e) => setClosesAt(e.target.value),
							className: "w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextInput, {
					label: "Reason",
					placeholder: "e.g. Diwali, private event",
					value: reason,
					onChange: (e) => setReason(e.target.value)
				}),
				error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-semibold text-destructive",
					children: error
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					disabled: !date || !reason.trim() || busy,
					onClick: async () => {
						setBusy(true);
						setError(null);
						try {
							await onAdd({
								date,
								type,
								reason: reason.trim(),
								...type === "modified_hours" ? {
									opensAt,
									closesAt
								} : {}
							});
							close();
						} catch (e) {
							setError(e instanceof Error ? e.message : "Could not add this exception.");
							setBusy(false);
						}
					},
					children: busy ? "Adding…" : "Add exception"
				})
			]
		})
	});
}
//#endregion
export { CourtsPage as component };
