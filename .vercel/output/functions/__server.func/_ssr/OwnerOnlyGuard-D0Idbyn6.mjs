import { r as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { r as useAuth } from "./auth-DbMKYDei.mjs";
import { _ as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { k as LoaderCircle } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/OwnerOnlyGuard-D0Idbyn6.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Wraps an owner-only route layout. A staff-role partner who navigates
*  here directly (the nav link is already hidden for them, but a typed
*  URL still resolves) gets redirected to the dashboard rather than
*  seeing owner-only content with some fields merely disabled. */
function OwnerOnlyGuard({ children }) {
	const { partner } = useAuth();
	const navigate = useNavigate();
	(0, import_react.useEffect)(() => {
		if (partner && partner.role !== "owner") navigate({ to: "/dashboard" });
	}, [partner, navigate]);
	if (!partner || partner.role !== "owner") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-[50vh] items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-6 w-6 animate-spin text-muted-foreground" })
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
//#endregion
export { OwnerOnlyGuard as t };
