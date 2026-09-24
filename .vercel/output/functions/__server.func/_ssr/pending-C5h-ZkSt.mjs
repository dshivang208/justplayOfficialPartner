import { r as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { r as useAuth } from "./auth-DbMKYDei.mjs";
import { _ as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as Hourglass, U as CircleCheck, _ as RefreshCw, z as CircleX } from "../_libs/lucide-react.mjs";
import { t as Logo } from "./Logo-dgsTARq_.mjs";
import { t as Button } from "./Button-DX-nONYl.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/pending-C5h-ZkSt.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var STEPS = [
	{
		label: "Application submitted",
		done: true,
		current: false
	},
	{
		label: "Under review by JustPlay",
		done: false,
		current: true
	},
	{
		label: "Venue approved & live",
		done: false,
		current: false
	}
];
function PendingPage() {
	const navigate = useNavigate();
	const { partner, refreshPartnerContext, logout } = useAuth();
	const [checking, setChecking] = (0, import_react.useState)(false);
	const [checkedOnce, setCheckedOnce] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!partner) navigate({ to: "/" });
		else if (partner.status === "active") navigate({ to: "/dashboard" });
	}, [partner, navigate]);
	if (!partner) return null;
	const checkAgain = async () => {
		setChecking(true);
		try {
			await refreshPartnerContext();
		} finally {
			setChecking(false);
			setCheckedOnce(true);
		}
	};
	if (partner.status === "rejected") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mb-8",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Logo, {})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "surface-card w-full max-w-md rounded-2xl p-8 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, { className: "h-6 w-6 text-destructive" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-5 font-display text-2xl font-semibold leading-tight text-foreground",
					children: "Your application wasn't approved"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-sm leading-relaxed text-muted-foreground",
					children: [
						"Reach the partner team at",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
							className: "text-foreground",
							children: "partners@justplay.app"
						}),
						" to find out what to fix and resubmit."
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					className: "mt-5",
					onClick: logout,
					children: "Back to login"
				})
			]
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Logo, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "surface-card w-full max-w-md rounded-2xl p-8 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hourglass, { className: "h-6 w-6 text-accent" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-5 font-display text-2xl font-semibold leading-tight text-foreground",
						children: "Your venue is under review"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-sm leading-relaxed text-muted-foreground",
						children: [
							"Thanks, ",
							partner.ownerName.split(" ")[0],
							". We've received",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
								className: "text-foreground",
								children: partner.businessName
							}),
							" and our team is verifying it. You'll get an SMS the moment you're approved and live."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-7 flex flex-col text-left",
						children: STEPS.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col items-center",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: `flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${s.done ? "bg-primary" : s.current ? "border-2 border-accent bg-accent/15" : "bg-surface-raised"}`,
									children: s.done ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-4 w-4 text-primary-foreground" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `h-1.5 w-1.5 rounded-full ${s.current ? "bg-accent" : "bg-muted-foreground"}` })
								}), i < STEPS.length - 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "my-0.5 h-8 w-px bg-border" })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "pb-8 pt-0.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: `text-sm font-semibold ${s.current || s.done ? "text-foreground" : "text-muted-foreground"}`,
									children: s.label
								}), s.current && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-0.5 text-xs text-muted-foreground",
									children: "Usually takes 1–2 business days"
								})]
							})]
						}, s.label))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rounded-xl bg-primary/5 p-3.5 text-left",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs leading-relaxed text-foreground/80",
							children: [
								"Questions about your application? Reach the partner team at",
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "partners@justplay.app" }),
								" or ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "+91 512 400 1122" }),
								"."
							]
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "outline",
				className: "mt-6",
				onClick: checkAgain,
				disabled: checking,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: `h-4 w-4 ${checking ? "animate-spin" : ""}` }), checking ? "Checking…" : "Check approval status"]
			}),
			checkedOnce && !checking && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-xs text-muted-foreground",
				children: "Still pending — check back soon."
			})
		]
	});
}
//#endregion
export { PendingPage as component };
