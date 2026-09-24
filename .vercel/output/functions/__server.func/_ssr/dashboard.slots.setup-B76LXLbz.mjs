import { r as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { d as isOvernightRange, f as rangeDurationMinutes, n as SPORT_OPTIONS, r as addDays, t as DURATION_OPTIONS } from "./inventory-OoBm9l3h.mjs";
import { _ as useNavigate, g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { G as ChevronRight, N as IndianRupee, R as Clock, U as CircleCheck, b as Plus, d as Sparkles, u as Trash2 } from "../_libs/lucide-react.mjs";
import { t as Button } from "./Button-DX-nONYl.mjs";
import { n as TextInput } from "./FormFields-DvCxt7FY.mjs";
import { n as useInventory } from "./inventory-BgKRcK7F.mjs";
import { t as Route } from "./dashboard.slots.setup-B47YsUQR.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard.slots.setup-B76LXLbz.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var STEPS = [
	"Court",
	"Hours & duration",
	"Pricing",
	"Generate"
];
var QUICK_RANGES = [
	7,
	14,
	30,
	60
];
function BulkSetupPage() {
	const { courts, priceRulesForCourt, addCourt, runBulkSetup } = useInventory();
	useNavigate();
	const { courtId: preselectedCourtId } = Route.useSearch();
	const [step, setStep] = (0, import_react.useState)(0);
	const [courtId, setCourtId] = (0, import_react.useState)(preselectedCourtId ?? courts[0]?.id ?? "");
	const [addingCourt, setAddingCourt] = (0, import_react.useState)(courts.length === 0);
	const [newCourtName, setNewCourtName] = (0, import_react.useState)("");
	const [newCourtSport, setNewCourtSport] = (0, import_react.useState)(SPORT_OPTIONS[0]);
	const selectedCourt = courts.find((c) => c.id === courtId);
	const [opensAt, setOpensAt] = (0, import_react.useState)(selectedCourt?.opensAt ?? "06:00");
	const [closesAt, setClosesAt] = (0, import_react.useState)(selectedCourt?.closesAt ?? "22:00");
	const [duration, setDuration] = (0, import_react.useState)(selectedCourt?.slotDurationMinutes ?? 60);
	const existingRules = selectedCourt ? priceRulesForCourt(selectedCourt.id) : [];
	const [bands, setBands] = (0, import_react.useState)(existingRules.length > 0 ? existingRules.map((r) => ({
		id: r.id,
		label: r.label,
		startTime: r.startTime,
		endTime: r.endTime,
		pricePerSlot: r.pricePerSlot
	})) : [{
		id: "b1",
		label: "All day",
		startTime: opensAt,
		endTime: closesAt,
		pricePerSlot: 700
	}]);
	(0, import_react.useEffect)(() => {
		if (!selectedCourt) return;
		if (selectedCourt.opensAt) setOpensAt(selectedCourt.opensAt);
		if (selectedCourt.closesAt) setClosesAt(selectedCourt.closesAt);
		if (selectedCourt.slotDurationMinutes) setDuration(selectedCourt.slotDurationMinutes);
		const rules = priceRulesForCourt(selectedCourt.id);
		if (rules.length > 0) setBands(rules.map((r) => ({
			id: r.id,
			label: r.label,
			startTime: r.startTime,
			endTime: r.endTime,
			pricePerSlot: r.pricePerSlot
		})));
	}, [
		selectedCourt?.id,
		selectedCourt?.opensAt,
		selectedCourt?.slotDurationMinutes
	]);
	const [generateDays, setGenerateDays] = (0, import_react.useState)(30);
	const [customDays, setCustomDays] = (0, import_react.useState)("");
	const [done, setDone] = (0, import_react.useState)(false);
	const effectiveCourtId = addingCourt ? null : courtId;
	const canProceedStep0 = addingCourt ? newCourtName.trim().length > 1 : Boolean(effectiveCourtId);
	const canProceedStep2 = bands.length > 0 && bands.every((b) => b.pricePerSlot > 0);
	const rowsPerDay = (0, import_react.useMemo)(() => {
		const total = rangeDurationMinutes(opensAt, closesAt);
		return Math.floor(total / duration);
	}, [
		opensAt,
		closesAt,
		duration
	]);
	const finalGenerateDays = customDays ? Math.max(1, Math.min(365, Number(customDays) || 0)) : generateDays;
	const totalSlots = rowsPerDay * finalGenerateDays;
	const endDate = addDays(/* @__PURE__ */ new Date(), finalGenerateDays - 1);
	const updateBand = (id, patch) => {
		setBands((prev) => prev.map((b) => b.id === id ? {
			...b,
			...patch
		} : b));
	};
	const addBand = () => {
		setBands((prev) => [...prev, {
			id: `b${prev.length + 1}_${Date.now()}`,
			label: "New band",
			startTime: "17:00",
			endTime: "22:00",
			pricePerSlot: 900
		}]);
	};
	const removeBand = (id) => setBands((prev) => prev.filter((b) => b.id !== id));
	const [busyStep, setBusyStep] = (0, import_react.useState)(false);
	const [stepError, setStepError] = (0, import_react.useState)(null);
	const goNext = async () => {
		if (step === 0 && addingCourt) {
			setBusyStep(true);
			setStepError(null);
			try {
				const created = await addCourt({
					name: newCourtName.trim(),
					sport: newCourtSport
				});
				setCourtId(created.id);
				setAddingCourt(false);
			} catch (e) {
				setStepError(e instanceof Error ? e.message : "Could not add this court. Try again.");
				setBusyStep(false);
				return;
			}
			setBusyStep(false);
		}
		setStep((s) => Math.min(s + 1, STEPS.length - 1));
	};
	const [generating, setGenerating] = (0, import_react.useState)(false);
	const [generateError, setGenerateError] = (0, import_react.useState)(null);
	const handleGenerate = async () => {
		if (!effectiveCourtId) return;
		setGenerating(true);
		setGenerateError(null);
		try {
			await runBulkSetup({
				courtId: effectiveCourtId,
				opensAt,
				closesAt,
				slotDurationMinutes: duration,
				priceRules: bands.map((b) => ({
					label: b.label,
					startTime: b.startTime,
					endTime: b.endTime,
					pricePerSlot: b.pricePerSlot
				})),
				generateDays: finalGenerateDays
			});
			setDone(true);
		} catch (e) {
			setGenerateError(e instanceof Error ? e.message : "Could not generate slots. Try again.");
		} finally {
			setGenerating(false);
		}
	};
	if (done) {
		const court = courts.find((c) => c.id === effectiveCourtId);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "surface-card mx-auto max-w-lg rounded-2xl p-8 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-6 w-6 text-primary" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 font-display text-xl font-semibold text-foreground",
					children: "Slots generated"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1.5 text-sm text-muted-foreground",
					children: [
						totalSlots.toLocaleString("en-IN"),
						" slots created for",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
							className: "text-foreground",
							children: court?.name
						}),
						" through",
						" ",
						endDate.toLocaleDateString("en-IN", {
							day: "numeric",
							month: "long"
						}),
						"."
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						onClick: () => window.location.assign("/dashboard/slots/setup"),
						children: "Set up another court"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/dashboard/slots",
							search: effectiveCourtId ? { courtId: effectiveCourtId } : {},
							children: "View calendar"
						})
					})]
				})
			]
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mb-6 flex items-center gap-2",
		children: STEPS.map((label, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: `flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i < step ? "bg-primary text-primary-foreground" : i === step ? "border-2 border-primary text-primary" : "bg-surface-raised text-muted-foreground"}`,
					children: i < step ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-4 w-4" }) : i + 1
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: `text-xs font-semibold ${i === step ? "text-foreground" : "text-muted-foreground"}`,
					children: label
				}),
				i < STEPS.length - 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "h-3.5 w-3.5 text-border" })
			]
		}, label))
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "surface-card max-w-xl rounded-2xl p-6",
		children: [
			step === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-lg font-semibold text-foreground",
					children: "Which court is this for?"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: "Set operating hours, slot duration and pricing for one court or sport at a time."
				}),
				courts.length > 0 && !addingCourt && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 flex flex-col gap-2",
					children: [courts.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setCourtId(c.id),
						className: `flex items-center justify-between rounded-xl border p-3.5 text-left ${courtId === c.id ? "border-primary bg-primary/5" : "border-border"}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block text-sm font-semibold text-foreground",
							children: c.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block text-xs text-muted-foreground",
							children: c.opensAt ? `${c.opensAt}\u2013${c.closesAt} \u00b7 already set up` : "Not set up yet"
						})] }), courtId === c.id && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-4 w-4 shrink-0 text-primary" })]
					}, c.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setAddingCourt(true),
						className: "flex items-center gap-2 rounded-xl border border-dashed border-border p-3.5 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-4 w-4" }), " Add a new court"]
					})]
				}),
				(addingCourt || courts.length === 0) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 flex flex-col gap-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextInput, {
							label: "Court name",
							placeholder: "e.g. Turf A",
							value: newCourtName,
							onChange: (e) => setNewCourtName(e.target.value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mb-1.5 block text-sm font-semibold text-foreground",
							children: "Sport"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							value: newCourtSport,
							onChange: (e) => setNewCourtSport(e.target.value),
							className: "w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary",
							children: SPORT_OPTIONS.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: s,
								children: s
							}, s))
						})] }),
						courts.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setAddingCourt(false),
							className: "self-start text-xs font-semibold text-primary",
							children: "Choose an existing court instead"
						})
					]
				})
			] }),
			step === 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-lg font-semibold text-foreground",
					children: "Operating hours & slot duration"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: [selectedCourt?.name ?? newCourtName, " · used to generate individual bookable slots."]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 grid grid-cols-2 gap-4",
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
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => {
						setOpensAt("00:00");
						setClosesAt("00:00");
					},
					className: `mt-2.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${opensAt === "00:00" && closesAt === "00:00" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary hover:text-primary"}`,
					children: "Open 24 hours"
				}),
				isOvernightRange(opensAt, closesAt) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2.5 text-xs text-muted-foreground",
					children: opensAt === closesAt ? "Open the full 24 hours, every day." : `Hours cross midnight \u2014 closes at ${closesAt} the following day.`
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mb-1.5 block text-sm font-semibold text-foreground",
						children: "Slot duration"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex gap-2",
						children: DURATION_OPTIONS.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setDuration(d),
							className: `flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-colors ${duration === d ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`,
							children: [d, " min"]
						}, d))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-4 flex items-center gap-1.5 text-xs text-muted-foreground",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "h-3.5 w-3.5" }),
						"That's ",
						rowsPerDay,
						" slots per day, ",
						opensAt,
						"–",
						closesAt,
						isOvernightRange(opensAt, closesAt) && opensAt !== closesAt ? " (+1 day)" : "",
						"."
					]
				})
			] }),
			step === 2 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-lg font-semibold text-foreground",
					children: "Set your pricing"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: "Add a price band for each time range — e.g. price mornings lower than peak evening hours."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 flex flex-col gap-3",
					children: [bands.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl border border-border p-3.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: b.label,
									onChange: (e) => updateBand(b.id, { label: e.target.value }),
									className: "flex-1 bg-transparent text-sm font-semibold text-foreground outline-none",
									placeholder: "Band label"
								}), bands.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => removeBand(b.id),
									className: "text-muted-foreground hover:text-destructive",
									"aria-label": "Remove band",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" })
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 grid grid-cols-3 gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "time",
										value: b.startTime,
										onChange: (e) => updateBand(b.id, { startTime: e.target.value }),
										className: "rounded-lg border border-border bg-surface px-2.5 py-2 text-xs text-foreground outline-none focus:border-primary"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "time",
										value: b.endTime,
										onChange: (e) => updateBand(b.id, { endTime: e.target.value }),
										className: "rounded-lg border border-border bg-surface px-2.5 py-2 text-xs text-foreground outline-none focus:border-primary"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IndianRupee, { className: "h-3.5 w-3.5 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "number",
											min: 0,
											value: b.pricePerSlot,
											onChange: (e) => updateBand(b.id, { pricePerSlot: Number(e.target.value) }),
											className: "w-full bg-transparent text-xs text-foreground outline-none"
										})]
									})
								]
							}),
							isOvernightRange(b.startTime, b.endTime) && b.startTime !== b.endTime && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1.5 text-[11px] text-muted-foreground",
								children: [
									"Crosses midnight — covers ",
									b.startTime,
									" through ",
									b.endTime,
									" the next day."
								]
							})
						]
					}, b.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: addBand,
						className: "flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2.5 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-4 w-4" }), " Add price band"]
					})]
				})
			] }),
			step === 3 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-lg font-semibold text-foreground",
					children: "Generate slots"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: "Choose how far ahead to open up availability."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-5 grid grid-cols-4 gap-2",
					children: QUICK_RANGES.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => {
							setGenerateDays(n);
							setCustomDays("");
						},
						className: `rounded-xl border py-2.5 text-sm font-semibold transition-colors ${!customDays && generateDays === n ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`,
						children: [n, " days"]
					}, n))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2.5",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextInput, {
						label: "Or a custom number of days",
						type: "number",
						min: 1,
						max: 365,
						placeholder: "e.g. 45",
						value: customDays,
						onChange: (e) => setCustomDays(e.target.value.replace(/\D/g, ""))
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 flex items-start gap-3 rounded-xl bg-primary/5 p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "mt-0.5 h-4 w-4 shrink-0 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-foreground",
						children: [
							"This generates ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [totalSlots.toLocaleString("en-IN"), " slots"] }),
							" for",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: selectedCourt?.name ?? newCourtName }),
							", from today through",
							" ",
							endDate.toLocaleDateString("en-IN", {
								day: "numeric",
								month: "long"
							}),
							" (",
							finalGenerateDays,
							" days).",
							selectedCourt?.slotsGeneratedUntil && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: " This replaces the existing setup for this court." })
						]
					})]
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-7 flex justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					onClick: () => setStep((s) => Math.max(0, s - 1)),
					disabled: step === 0 || busyStep || generating,
					children: "Back"
				}), step < STEPS.length - 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: goNext,
					disabled: busyStep || step === 0 && !canProceedStep0 || step === 2 && !canProceedStep2,
					children: busyStep ? "Please wait…" : "Continue"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: handleGenerate,
					disabled: totalSlots <= 0 || generating,
					children: generating ? "Generating…" : "Generate slots"
				})]
			}),
			(stepError || generateError) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-right text-xs font-semibold text-destructive",
				children: stepError ?? generateError
			})
		]
	})] });
}
//#endregion
export { BulkSetupPage as component };
