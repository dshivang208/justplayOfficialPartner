import { m as createFileRoute, p as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard.slots.setup-B47YsUQR.js
var $$splitComponentImporter = () => import("./dashboard.slots.setup-B76LXLbz.mjs");
var Route = createFileRoute("/dashboard/slots/setup")({
	validateSearch: (search) => {
		const courtId = typeof search["courtId"] === "string" ? search["courtId"] : void 0;
		return courtId ? { courtId } : {};
	},
	head: () => ({ meta: [{ title: "Bulk Slot Setup | JustPlay Partner" }] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
