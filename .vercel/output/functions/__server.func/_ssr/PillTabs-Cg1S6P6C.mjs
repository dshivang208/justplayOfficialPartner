import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/PillTabs-Cg1S6P6C.js
var import_jsx_runtime = require_jsx_runtime();
function PillTabs({ options, value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "inline-flex rounded-xl bg-surface-raised p-1",
		children: options.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			onClick: () => onChange(opt.key),
			className: `rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${value === opt.key ? "bg-surface text-foreground shadow-card" : "text-muted-foreground hover:text-foreground"}`,
			children: opt.label
		}, opt.key))
	});
}
//#endregion
export { PillTabs as t };
