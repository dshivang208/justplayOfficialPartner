import { r as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { r as useAuth } from "./auth-DbMKYDei.mjs";
import { _ as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { D as LogOut, H as CirclePause, V as CirclePlay, f as Smartphone, s as TriangleAlert, y as Receipt } from "../_libs/lucide-react.mjs";
import { t as Button } from "./Button-DX-nONYl.mjs";
import { t as Modal } from "./Modal-B2p3_zTG.mjs";
import { n as TextInput } from "./FormFields-DvCxt7FY.mjs";
import { r as useVenueProfile } from "./venueProfile-CzdchA95.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard.settings.account-CEa2Onk4.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AccountPage() {
	const { partner, logout } = useAuth();
	const { profile, updateBusinessDetails, toggleOperationalStatus } = useVenueProfile();
	const navigate = useNavigate();
	const [legalName, setLegalName] = (0, import_react.useState)(profile.legalBusinessName);
	const [gst, setGst] = (0, import_react.useState)(profile.gstNumber ?? "");
	const [businessSaved, setBusinessSaved] = (0, import_react.useState)(true);
	const [businessSaving, setBusinessSaving] = (0, import_react.useState)(false);
	const [businessError, setBusinessError] = (0, import_react.useState)(null);
	const [statusBusy, setStatusBusy] = (0, import_react.useState)(false);
	const [statusError, setStatusError] = (0, import_react.useState)(null);
	const [deactivateOpen, setDeactivateOpen] = (0, import_react.useState)(false);
	if (!partner) return null;
	const handleSaveBusinessDetails = async () => {
		setBusinessSaving(true);
		setBusinessError(null);
		try {
			await updateBusinessDetails({
				legalBusinessName: legalName.trim(),
				gstNumber: gst.trim() || null
			});
			setBusinessSaved(true);
		} catch (e) {
			setBusinessError(e instanceof Error ? e.message : "Could not save business details.");
		} finally {
			setBusinessSaving(false);
		}
	};
	const handleToggleStatus = async () => {
		setStatusBusy(true);
		setStatusError(null);
		try {
			await toggleOperationalStatus();
		} catch (e) {
			setStatusError(e instanceof Error ? e.message : "Could not update venue status.");
		} finally {
			setStatusBusy(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex max-w-xl flex-col gap-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "surface-card rounded-2xl p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						className: "flex items-center gap-2 font-display text-base font-semibold text-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Receipt, { className: "h-4 w-4 text-muted-foreground" }), " Business details"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-0.5 text-xs text-muted-foreground",
						children: "Used on invoices and tax filings."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex flex-col gap-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextInput, {
								label: "Legal business name",
								value: legalName,
								onChange: (e) => {
									setLegalName(e.target.value);
									setBusinessSaved(false);
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextInput, {
								label: "GST number (optional)",
								placeholder: "e.g. 09ABCPV1234F1Z5",
								value: gst,
								onChange: (e) => {
									setGst(e.target.value.toUpperCase());
									setBusinessSaved(false);
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "outline",
								className: "self-start",
								disabled: businessSaved || businessSaving,
								onClick: handleSaveBusinessDetails,
								children: businessSaving ? "Saving…" : businessSaved ? "Saved" : "Save business details"
							}),
							businessError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-medium text-destructive",
								children: businessError
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "surface-card rounded-2xl p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						className: "flex items-center gap-2 font-display text-base font-semibold text-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smartphone, { className: "h-4 w-4 text-muted-foreground" }), " Login phone number"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-sm text-foreground",
						children: ["+91 ", partner.phone]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-muted-foreground",
						children: "Changing your login number isn't available yet — contact the partner team if you've switched numbers."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "surface-card rounded-2xl p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-base font-semibold text-foreground",
						children: "Venue status"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-0.5 text-xs text-muted-foreground",
						children: profile.operationalStatus === "live" ? "Your venue is live and accepting new bookings." : "Your venue is paused — it won't accept new bookings until you reactivate it."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: profile.operationalStatus === "live" ? "outline" : "primary",
						className: "mt-3",
						disabled: statusBusy,
						onClick: () => profile.operationalStatus === "live" ? setDeactivateOpen(true) : handleToggleStatus(),
						children: profile.operationalStatus === "live" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CirclePause, { className: "h-4 w-4" }), " Deactivate venue"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CirclePlay, { className: "h-4 w-4" }),
							" ",
							statusBusy ? "Reactivating…" : "Reactivate venue"
						] })
					}),
					statusError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-xs font-medium text-destructive",
						children: statusError
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "surface-card rounded-2xl p-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-base font-semibold text-foreground",
					children: "Session"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					variant: "outline",
					className: "mt-3",
					onClick: () => {
						logout();
						navigate({ to: "/" });
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "h-4 w-4" }), " Log out"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, {
				open: deactivateOpen,
				onClose: () => setDeactivateOpen(false),
				title: "Deactivate this venue?",
				width: "sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start gap-3 rounded-xl bg-accent/10 px-3.5 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "mt-0.5 h-4 w-4 shrink-0 text-accent" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-foreground",
						children: "Your venue stops accepting new bookings immediately. Existing confirmed bookings aren't affected. You can reactivate any time — this isn't account deletion."
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						className: "flex-1",
						onClick: () => setDeactivateOpen(false),
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "destructive",
						className: "flex-1",
						disabled: statusBusy,
						onClick: async () => {
							await handleToggleStatus();
							setDeactivateOpen(false);
						},
						children: statusBusy ? "Deactivating…" : "Deactivate"
					})]
				})]
			})
		]
	});
}
//#endregion
export { AccountPage as component };
