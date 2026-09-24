import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/FormFields-DvCxt7FY.js
var import_jsx_runtime = require_jsx_runtime();
function TextInput({ label, icon: Icon, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mb-1.5 block text-sm font-semibold text-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2.5 rounded-xl border border-border bg-surface px-3.5 py-2.5 transition-colors focus-within:border-primary",
			children: [Icon ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-4 w-4 shrink-0 text-muted-foreground" }) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				...props,
				className: "w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
			})]
		})]
	});
}
function OtpField({ otp, setOtp, onEdit, phone }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-1.5 flex items-center justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm font-semibold text-foreground",
				children: "One-time code"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: onEdit,
				className: "text-xs font-semibold text-primary underline underline-offset-2",
				children: "Edit number"
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			type: "tel",
			inputMode: "numeric",
			autoFocus: true,
			placeholder: "• • • • • •",
			value: otp,
			onChange: (e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)),
			style: { letterSpacing: "0.4em" },
			className: "w-full rounded-xl border border-border px-4 py-3 text-center text-2xl font-semibold text-foreground outline-none focus:border-primary"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-2 text-xs text-muted-foreground",
			children: [
				"Demo mode — enter any 6 digits to continue. Code sent to +91 ",
				phone,
				"."
			]
		})
	] });
}
//#endregion
export { TextInput as n, OtpField as t };
