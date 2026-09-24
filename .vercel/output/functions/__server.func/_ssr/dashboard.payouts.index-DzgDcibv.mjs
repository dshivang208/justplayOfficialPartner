import { r as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { n as usePayouts } from "./payouts-BQdOpTXM.mjs";
import { i as formatINR } from "./dashboard-fdtWZGlf.mjs";
import { t as formatBookingId } from "./bookings-DZADHeQj.mjs";
import { r as nextPayoutDate, t as dailyEarningsTrend } from "./payouts-ZXT5tEQr.mjs";
import { N as IndianRupee, Q as CalendarClock, c as TrendingUp, k as LoaderCircle, l as TrendingDown, n as Wallet, w as OctagonAlert } from "../_libs/lucide-react.mjs";
import { t as Button } from "./Button-DX-nONYl.mjs";
import { t as PillTabs } from "./PillTabs-Cg1S6P6C.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard.payouts.index-DzgDcibv.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function EarningsChart({ data, height = 180 }) {
	const max = Math.max(1, ...data.map((d) => d.amount));
	const barWidth = 100 / data.length;
	const labelEvery = Math.max(1, Math.ceil(data.length / 8));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		viewBox: `0 0 100 ${height}`,
		preserveAspectRatio: "none",
		className: "h-[180px] w-full overflow-visible",
		children: data.map((point, i) => {
			const barHeight = point.amount / max * (height - 4);
			const x = i * barWidth;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: x + barWidth * .15,
				y: height - barHeight,
				width: barWidth * .7,
				height: barHeight,
				rx: barWidth * .15,
				className: "fill-primary/70",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("title", { children: [
					(/* @__PURE__ */ new Date(`${point.date}T00:00:00`)).toLocaleDateString("en-IN", {
						day: "numeric",
						month: "short"
					}),
					" — ₹",
					point.amount.toLocaleString("en-IN")
				] })
			}, point.date);
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-2 flex justify-between text-[10px] text-muted-foreground",
		children: data.filter((_, i) => i % labelEvery === 0).map((point) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: (/* @__PURE__ */ new Date(`${point.date}T00:00:00`)).toLocaleDateString("en-IN", {
			day: "numeric",
			month: "short"
		}) }, point.date))
	})] });
}
function BreakdownRow({ label, value, emphasis }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between py-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: `text-sm ${emphasis ? "font-semibold text-foreground" : "text-muted-foreground"}`,
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: `text-sm ${emphasis ? "font-bold text-foreground" : "font-semibold text-foreground"}`,
			children: value
		})]
	});
}
function PayoutsOverviewPage() {
	const { payoutBatches, pendingLineItems, pendingDeductions, pendingNet, runPayoutNow, payoutSettings } = usePayouts();
	const [range, setRange] = (0, import_react.useState)(30);
	const [runningPayout, setRunningPayout] = (0, import_react.useState)(false);
	const [runMessage, setRunMessage] = (0, import_react.useState)(null);
	const allLineItems = (0, import_react.useMemo)(() => [...payoutBatches.flatMap((b) => b.lineItems), ...pendingLineItems], [payoutBatches, pendingLineItems]);
	const trend = (0, import_react.useMemo)(() => dailyEarningsTrend(allLineItems, range), [allLineItems, range]);
	const monthTotals = (0, import_react.useMemo)(() => {
		const currentMonth = (/* @__PURE__ */ new Date()).getMonth();
		const inMonth = allLineItems.filter((li) => (/* @__PURE__ */ new Date(`${li.date}T00:00:00`)).getMonth() === currentMonth);
		const gross = inMonth.reduce((sum, li) => sum + li.grossAmount, 0);
		const net = inMonth.reduce((sum, li) => sum + li.netAmount, 0);
		return {
			gross,
			net,
			commission: gross - net
		};
	}, [allLineItems]);
	const pendingGross = pendingLineItems.reduce((sum, li) => sum + li.grossAmount, 0);
	const pendingCommission = pendingLineItems.reduce((sum, li) => sum + (li.grossAmount - li.netAmount), 0);
	const deductionsTotal = pendingDeductions.reduce((sum, d) => sum + d.netAmount, 0);
	const lastCompleted = [...payoutBatches].filter((b) => b.status === "completed").sort((a, b) => a.date < b.date ? 1 : -1)[0];
	const nextDate = nextPayoutDate();
	const canRunPayout = payoutSettings.verificationStatus === "verified" && pendingNet > 0;
	const handleRunPayout = async () => {
		setRunningPayout(true);
		setRunMessage(null);
		try {
			const result = await runPayoutNow();
			if (result.skipped) setRunMessage(result.skipped);
			else if (result.error) setRunMessage(result.error);
			else setRunMessage(`Payout of ${formatINR(result.amount ?? 0)} sent.`);
		} catch (e) {
			setRunMessage(e instanceof Error ? e.message : "Could not run payout.");
		} finally {
			setRunningPayout(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-2 gap-3 lg:grid-cols-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "surface-card rounded-2xl p-4 sm:p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "h-5 w-5 text-primary" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 font-display text-2xl font-bold leading-none text-foreground",
							children: formatINR(monthTotals.net)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1.5 text-xs font-medium text-muted-foreground",
							children: "Net earnings this month"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "surface-card rounded-2xl p-4 sm:p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, { className: "h-5 w-5 text-accent" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 font-display text-2xl font-bold leading-none text-foreground",
							children: formatINR(pendingNet)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1.5 text-xs font-medium text-muted-foreground",
							children: "Pending payout"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "surface-card rounded-2xl p-4 sm:p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IndianRupee, { className: "h-5 w-5 text-primary" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 font-display text-2xl font-bold leading-none text-foreground",
							children: lastCompleted ? formatINR(lastCompleted.amount) : "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1.5 text-xs font-medium text-muted-foreground",
							children: ["Last payout", lastCompleted ? ` \u00b7 ${(/* @__PURE__ */ new Date(`${lastCompleted.date}T00:00:00`)).toLocaleDateString("en-IN", {
								day: "numeric",
								month: "short"
							})}` : ""]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "surface-card rounded-2xl p-4 sm:p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarClock, { className: "h-5 w-5 text-accent" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 font-display text-2xl font-bold leading-none text-foreground",
							children: nextDate.toLocaleDateString("en-IN", {
								day: "numeric",
								month: "short"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1.5 text-xs font-medium text-muted-foreground",
							children: "Next scheduled payout"
						})
					]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "surface-card mt-5 rounded-2xl p-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-base font-semibold text-foreground",
					children: "Earnings trend"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PillTabs, {
					options: [{
						key: 30,
						label: "30 days"
					}, {
						key: 90,
						label: "90 days"
					}],
					value: range,
					onChange: setRange
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EarningsChart, { data: trend })
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-5 grid gap-4 lg:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "surface-card rounded-2xl p-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-base font-semibold text-foreground",
					children: "This month's breakdown"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 flex flex-col divide-y divide-border",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BreakdownRow, {
							label: "Gross bookings revenue",
							value: formatINR(monthTotals.gross)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BreakdownRow, {
							label: "Platform commission",
							value: `\u2212${formatINR(monthTotals.commission)}`
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BreakdownRow, {
							label: "Net payout owed",
							value: formatINR(monthTotals.net),
							emphasis: true
						})
					]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "surface-card rounded-2xl p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-base font-semibold text-foreground",
							children: "Pending payout detail"
						}), canRunPayout && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: handleRunPayout,
							disabled: runningPayout,
							size: "sm",
							children: runningPayout ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin" }) : "Run payout now"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-0.5 text-xs text-muted-foreground",
						children: [
							"Bookings not yet included in a payout batch, next scheduled",
							" ",
							nextDate.toLocaleDateString("en-IN", {
								weekday: "long",
								day: "numeric",
								month: "short"
							}),
							"."
						]
					}),
					runMessage && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-xs font-medium text-foreground",
						children: runMessage
					}),
					pendingLineItems.length === 0 && pendingDeductions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 text-sm text-muted-foreground",
						children: "Nothing pending right now."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-col divide-y divide-border",
						children: [
							pendingLineItems.map((li) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between py-2 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-muted-foreground",
									children: [
										formatBookingId(li.bookingId),
										" · ",
										li.bookingLabel
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-semibold text-foreground",
									children: formatINR(li.netAmount)
								})]
							}, li.bookingId)),
							pendingDeductions.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "py-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start gap-2 rounded-xl bg-destructive/5 px-3 py-2.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OctagonAlert, { className: "mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-sm font-semibold text-destructive",
												children: [
													"Deduction: ",
													formatINR(d.netAmount),
													" (",
													formatBookingId(d.bookingId),
													" ",
													"refunded)"
												]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingDown, { className: "h-3.5 w-3.5 text-destructive" })]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-0.5 text-xs text-muted-foreground",
											children: d.reason
										})]
									})]
								})
							}, d.id)),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between pt-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-sm font-bold text-foreground",
									children: "Total pending"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-display text-lg font-bold text-foreground",
									children: formatINR(pendingNet)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "pt-1 text-[11px] text-muted-foreground",
								children: [
									formatINR(pendingGross),
									" gross · −",
									formatINR(pendingCommission),
									" commission",
									pendingDeductions.length > 0 ? ` \u00b7 \u2212${formatINR(deductionsTotal)} deductions` : ""
								]
							})
						]
					})
				]
			})]
		})
	] });
}
//#endregion
export { PayoutsOverviewPage as component };
