import { r as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { n as usePayouts } from "./payouts-BQdOpTXM.mjs";
import { a as verificationLabel, n as maskAccountNumber } from "./payouts-ZXT5tEQr.mjs";
import { M as Landmark, R as Clock, U as CircleCheck, W as CircleAlert, f as Smartphone, k as LoaderCircle } from "../_libs/lucide-react.mjs";
import { t as Button } from "./Button-DX-nONYl.mjs";
import { n as TextInput } from "./FormFields-DvCxt7FY.mjs";
import { t as PillTabs } from "./PillTabs-Cg1S6P6C.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard.payouts.settings-DXCYzfZ6.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function PayoutSettingsPage() {
	const { payoutSettings, savePayoutSettings } = usePayouts();
	const [method, setMethod] = (0, import_react.useState)(payoutSettings.method);
	const [accountHolderName, setAccountHolderName] = (0, import_react.useState)(payoutSettings.bank?.accountHolderName ?? "");
	const [accountNumber, setAccountNumber] = (0, import_react.useState)(payoutSettings.bank?.accountNumber ?? "");
	const [ifsc, setIfsc] = (0, import_react.useState)(payoutSettings.bank?.ifsc ?? "");
	const [upiId, setUpiId] = (0, import_react.useState)(payoutSettings.upi?.upiId ?? "");
	const [saving, setSaving] = (0, import_react.useState)(false);
	const [saved, setSaved] = (0, import_react.useState)(false);
	const [saveMessage, setSaveMessage] = (0, import_react.useState)(null);
	const [saveError, setSaveError] = (0, import_react.useState)(null);
	const canSave = method === "bank" ? accountHolderName.trim().length > 1 && accountNumber.trim().length >= 6 && ifsc.trim().length >= 6 : /^[\w.-]{2,}@[\w]{2,}$/.test(upiId.trim());
	const handleSave = async () => {
		setSaving(true);
		setSaveError(null);
		setSaveMessage(null);
		try {
			const result = method === "bank" ? await savePayoutSettings({
				method: "bank",
				bank: {
					accountHolderName: accountHolderName.trim(),
					accountNumber: accountNumber.trim(),
					ifsc: ifsc.trim().toUpperCase()
				}
			}) : await savePayoutSettings({
				method: "upi",
				upi: { upiId: upiId.trim() }
			});
			setSaved(true);
			if (result.message) setSaveMessage(result.message);
		} catch (e) {
			setSaveError(e instanceof Error ? e.message : "Could not save payout details. Try again.");
		} finally {
			setSaving(false);
		}
	};
	const verificationStyles = {
		verified: "bg-primary/10 text-primary",
		pending: "bg-accent/15 text-accent",
		failed: "bg-destructive/10 text-destructive"
	};
	const verificationCopy = {
		verified: `Verified${payoutSettings.updatedAt ? " on " + new Date(payoutSettings.updatedAt).toLocaleDateString("en-IN", {
			day: "numeric",
			month: "long",
			year: "numeric"
		}) : ""}. Payouts go to this account.`,
		pending: "We're verifying these details — this usually takes 1–2 business days. Payouts are held until verification completes.",
		failed: "Cashfree couldn't verify these details. Double-check the account/IFSC or UPI ID and save again."
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "max-w-xl",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "surface-card rounded-2xl p-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-base font-semibold text-foreground",
					children: "Verification status"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: `inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${verificationStyles[payoutSettings.verificationStatus]}`,
					children: [payoutSettings.verificationStatus === "verified" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-3.5 w-3.5" }) : payoutSettings.verificationStatus === "failed" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "h-3.5 w-3.5" }), verificationLabel(payoutSettings.verificationStatus)]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted-foreground",
				children: verificationCopy[payoutSettings.verificationStatus]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "surface-card mt-4 rounded-2xl p-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-base font-semibold text-foreground",
					children: "Payout method"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-0.5 text-xs text-muted-foreground",
					children: "Where should we send your weekly payouts?"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PillTabs, {
						options: [{
							key: "bank",
							label: "Bank account"
						}, {
							key: "upi",
							label: "UPI"
						}],
						value: method,
						onChange: (m) => {
							setMethod(m);
							setSaved(false);
							setSaveMessage(null);
							setSaveError(null);
						}
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex flex-col gap-4",
					children: [
						method === "bank" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextInput, {
								label: "Account holder name",
								placeholder: "As per bank records",
								value: accountHolderName,
								onChange: (e) => {
									setAccountHolderName(e.target.value);
									setSaved(false);
								},
								icon: Landmark
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextInput, {
								label: "Account number",
								placeholder: "e.g. 50100234456789",
								value: accountNumber,
								onChange: (e) => {
									setAccountNumber(e.target.value.replace(/\D/g, ""));
									setSaved(false);
								}
							}),
							payoutSettings.bank && accountNumber === payoutSettings.bank.accountNumber && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "-mt-2 text-xs text-muted-foreground",
								children: ["Currently on file: ", maskAccountNumber(payoutSettings.bank.accountNumber)]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextInput, {
								label: "IFSC code",
								placeholder: "e.g. HDFC0001234",
								value: ifsc,
								onChange: (e) => {
									setIfsc(e.target.value.toUpperCase());
									setSaved(false);
								}
							})
						] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextInput, {
							label: "UPI ID",
							placeholder: "yourname@bank",
							value: upiId,
							onChange: (e) => {
								setUpiId(e.target.value);
								setSaved(false);
							},
							icon: Smartphone
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							disabled: !canSave || saving || saved,
							onClick: handleSave,
							className: "self-start",
							children: saving ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : saved ? "Saved" : "Save payout details"
						}),
						saveError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-medium text-destructive",
							children: saveError
						}),
						!saveError && saveMessage && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-medium text-muted-foreground",
							children: saveMessage
						}),
						!saved && !saveError && (payoutSettings.bank || payoutSettings.upi) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: "Saving new details will reset your verification status."
						})
					]
				})
			]
		})]
	});
}
//#endregion
export { PayoutSettingsPage as component };
