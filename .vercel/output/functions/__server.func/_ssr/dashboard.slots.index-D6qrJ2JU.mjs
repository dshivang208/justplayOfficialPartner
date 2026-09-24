import { m as createFileRoute, p as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard.slots.index-D6qrJ2JU.js
var $$splitComponentImporter = () => import("./dashboard.slots.index-DFCMPeg8.mjs");
var Route = createFileRoute("/dashboard/slots/")({
	validateSearch: (search) => {
		const courtId = typeof search["courtId"] === "string" ? search["courtId"] : void 0;
		return courtId ? { courtId } : {};
	},
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
