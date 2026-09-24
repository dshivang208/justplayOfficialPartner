import { r as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime, t as QueryClientProvider } from "../_libs/react+tanstack__react-query.mjs";
import { t as PartnerAuthProvider } from "./auth-DbMKYDei.mjs";
import { t as BookingsProvider } from "./bookings-DKX0ntLe.mjs";
import { t as PayoutsProvider } from "./payouts-BQdOpTXM.mjs";
import { c as HeadContent, d as createRouter, f as Outlet, g as Link, h as createRootRouteWithContext, m as createFileRoute, p as lazyRouteComponent, s as Scripts, v as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as Route$18 } from "./dashboard.bookings._bookingId-BJkriv6N.mjs";
import { t as InventoryProvider } from "./inventory-BgKRcK7F.mjs";
import { n as VenueProfileProvider } from "./venueProfile-CzdchA95.mjs";
import { t as NotificationPrefsProvider } from "./notifications-CPFj2m05.mjs";
import { t as StaffProvider } from "./staff-CR_0WWjy.mjs";
import { t as Route$19 } from "./dashboard.slots.index-D6qrJ2JU.mjs";
import { t as Route$20 } from "./dashboard.slots.setup-B47YsUQR.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-CyujSb0I.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var styles_default = "/assets/styles-DNiMuUzN.css";
function reportLovableError(error, context = {}) {
	if (typeof window === "undefined") return;
	window.__lovableEvents?.captureException?.(error, {
		source: "react_error_boundary",
		route: window.location.pathname,
		...context
	}, {
		mechanism: "react_error_boundary",
		handled: false,
		severity: "error"
	});
	const message = error instanceof Response ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}` : error instanceof Error ? error.message : String(error);
	const stack = error instanceof Error ? error.stack : void 0;
	window.__lovableReportRuntimeError?.({
		message,
		...stack !== void 0 && { stack },
		filename: window.location.pathname
	});
}
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist or has been moved."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Go home"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		reportLovableError(error, { boundary: "tanstack_root_error_component" });
	}, [error]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong on our end. You can try refreshing or head back home."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Try again"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$17 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "JustPlay Partner — Venue Console" },
			{
				name: "description",
				content: "Manage bookings, slots and payouts for your JustPlay venue in Kanpur."
			},
			{
				name: "author",
				content: "JustPlay"
			},
			{
				property: "og:title",
				content: "JustPlay Partner — Venue Console"
			},
			{
				property: "og:description",
				content: "Manage bookings, slots and payouts for your JustPlay venue in Kanpur."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			}
		],
		links: [
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "icon",
				href: "/favicon.ico",
				type: "image/x-icon"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$17.useRouteContext();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryClientProvider, {
		client: queryClient,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PartnerAuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InventoryProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookingsProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PayoutsProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VenueProfileProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StaffProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NotificationPrefsProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }) }) }) }) }) }) })
	});
}
var $$splitComponentImporter$16 = () => import("./routes-3Hbw99DS.mjs");
var Route$16 = createFileRoute("/")({
	head: () => ({ meta: [{ title: "Log in | JustPlay Partner" }, {
		name: "description",
		content: "Log in or list your venue on JustPlay Partner — the venue console for Kanpur sports venues."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$16, "component")
});
var $$splitComponentImporter$15 = () => import("./dashboard-D4FmmL0k.mjs");
var Route$15 = createFileRoute("/dashboard")({ component: lazyRouteComponent($$splitComponentImporter$15, "component") });
var $$splitComponentImporter$14 = () => import("./pending-C5h-ZkSt.mjs");
var Route$14 = createFileRoute("/pending")({
	head: () => ({ meta: [{ title: "Application under review | JustPlay Partner" }] }),
	component: lazyRouteComponent($$splitComponentImporter$14, "component")
});
var $$splitComponentImporter$13 = () => import("./dashboard.index-BYTuuZYL.mjs");
var Route$13 = createFileRoute("/dashboard/")({
	head: () => ({ meta: [{ title: "Dashboard | JustPlay Partner" }] }),
	component: lazyRouteComponent($$splitComponentImporter$13, "component")
});
var $$splitComponentImporter$12 = () => import("./dashboard.bookings-C5tP3A35.mjs");
var Route$12 = createFileRoute("/dashboard/bookings")({ component: lazyRouteComponent($$splitComponentImporter$12, "component") });
var $$splitComponentImporter$11 = () => import("./dashboard.payouts-SafxbCs4.mjs");
var Route$11 = createFileRoute("/dashboard/payouts")({ component: lazyRouteComponent($$splitComponentImporter$11, "component") });
var $$splitComponentImporter$10 = () => import("./dashboard.settings-CKAF1WiN.mjs");
var Route$10 = createFileRoute("/dashboard/settings")({ component: lazyRouteComponent($$splitComponentImporter$10, "component") });
var $$splitComponentImporter$9 = () => import("./dashboard.slots-BoWmP_qK.mjs");
var Route$9 = createFileRoute("/dashboard/slots")({
	head: () => ({ meta: [{ title: "Slots & Inventory | JustPlay Partner" }] }),
	component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
var $$splitComponentImporter$8 = () => import("./dashboard.bookings.index-HO3BGqgB.mjs");
var Route$8 = createFileRoute("/dashboard/bookings/")({
	head: () => ({ meta: [{ title: "Bookings | JustPlay Partner" }] }),
	component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
var $$splitComponentImporter$7 = () => import("./dashboard.payouts.index-DzgDcibv.mjs");
var Route$7 = createFileRoute("/dashboard/payouts/")({
	head: () => ({ meta: [{ title: "Earnings Overview | JustPlay Partner" }] }),
	component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
var $$splitComponentImporter$6 = () => import("./dashboard.payouts.history-DtIoVBEq.mjs");
var Route$6 = createFileRoute("/dashboard/payouts/history")({
	head: () => ({ meta: [{ title: "Payout History | JustPlay Partner" }] }),
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
var $$splitComponentImporter$5 = () => import("./dashboard.payouts.settings-DXCYzfZ6.mjs");
var Route$5 = createFileRoute("/dashboard/payouts/settings")({
	head: () => ({ meta: [{ title: "Bank Details | JustPlay Partner" }] }),
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitComponentImporter$4 = () => import("./dashboard.settings.index-DO6fhXQ3.mjs");
var Route$4 = createFileRoute("/dashboard/settings/")({
	head: () => ({ meta: [{ title: "Venue Profile | JustPlay Partner" }] }),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var $$splitComponentImporter$3 = () => import("./dashboard.settings.account-CEa2Onk4.mjs");
var Route$3 = createFileRoute("/dashboard/settings/account")({
	head: () => ({ meta: [{ title: "Account | JustPlay Partner" }] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./dashboard.settings.notifications-Ch6nTuQR.mjs");
var Route$2 = createFileRoute("/dashboard/settings/notifications")({
	head: () => ({ meta: [{ title: "Notifications | JustPlay Partner" }] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./dashboard.settings.staff-CkmvuWYM.mjs");
var Route$1 = createFileRoute("/dashboard/settings/staff")({
	head: () => ({ meta: [{ title: "Staff | JustPlay Partner" }] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("./dashboard.slots.courts-DlCNzLNw.mjs");
var Route = createFileRoute("/dashboard/slots/courts")({
	head: () => ({ meta: [{ title: "Courts & Sports | JustPlay Partner" }] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var IndexRoute = Route$16.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$17
});
var DashboardRoute = Route$15.update({
	id: "/dashboard",
	path: "/dashboard",
	getParentRoute: () => Route$17
});
var PendingRoute = Route$14.update({
	id: "/pending",
	path: "/pending",
	getParentRoute: () => Route$17
});
var DashboardIndexRoute = Route$13.update({
	id: "/",
	path: "/",
	getParentRoute: () => DashboardRoute
});
var DashboardBookingsRoute = Route$12.update({
	id: "/bookings",
	path: "/bookings",
	getParentRoute: () => DashboardRoute
});
var DashboardPayoutsRoute = Route$11.update({
	id: "/payouts",
	path: "/payouts",
	getParentRoute: () => DashboardRoute
});
var DashboardSettingsRoute = Route$10.update({
	id: "/settings",
	path: "/settings",
	getParentRoute: () => DashboardRoute
});
var DashboardSlotsRoute = Route$9.update({
	id: "/slots",
	path: "/slots",
	getParentRoute: () => DashboardRoute
});
var DashboardBookingsIndexRoute = Route$8.update({
	id: "/",
	path: "/",
	getParentRoute: () => DashboardBookingsRoute
});
var DashboardBookingsBookingIdRoute = Route$18.update({
	id: "/$bookingId",
	path: "/$bookingId",
	getParentRoute: () => DashboardBookingsRoute
});
var DashboardPayoutsIndexRoute = Route$7.update({
	id: "/",
	path: "/",
	getParentRoute: () => DashboardPayoutsRoute
});
var DashboardPayoutsHistoryRoute = Route$6.update({
	id: "/history",
	path: "/history",
	getParentRoute: () => DashboardPayoutsRoute
});
var DashboardPayoutsSettingsRoute = Route$5.update({
	id: "/settings",
	path: "/settings",
	getParentRoute: () => DashboardPayoutsRoute
});
var DashboardSettingsIndexRoute = Route$4.update({
	id: "/",
	path: "/",
	getParentRoute: () => DashboardSettingsRoute
});
var DashboardSettingsAccountRoute = Route$3.update({
	id: "/account",
	path: "/account",
	getParentRoute: () => DashboardSettingsRoute
});
var DashboardSettingsNotificationsRoute = Route$2.update({
	id: "/notifications",
	path: "/notifications",
	getParentRoute: () => DashboardSettingsRoute
});
var DashboardSettingsStaffRoute = Route$1.update({
	id: "/staff",
	path: "/staff",
	getParentRoute: () => DashboardSettingsRoute
});
var DashboardSlotsIndexRoute = Route$19.update({
	id: "/",
	path: "/",
	getParentRoute: () => DashboardSlotsRoute
});
var DashboardSlotsCourtsRoute = Route.update({
	id: "/courts",
	path: "/courts",
	getParentRoute: () => DashboardSlotsRoute
});
var DashboardSlotsSetupRoute = Route$20.update({
	id: "/setup",
	path: "/setup",
	getParentRoute: () => DashboardSlotsRoute
});
var DashboardBookingsRouteChildren = {
	DashboardBookingsBookingIdRoute,
	DashboardBookingsIndexRoute
};
var DashboardBookingsRouteWithChildren = DashboardBookingsRoute._addFileChildren(DashboardBookingsRouteChildren);
var DashboardPayoutsRouteChildren = {
	DashboardPayoutsHistoryRoute,
	DashboardPayoutsSettingsRoute,
	DashboardPayoutsIndexRoute
};
var DashboardPayoutsRouteWithChildren = DashboardPayoutsRoute._addFileChildren(DashboardPayoutsRouteChildren);
var DashboardSettingsRouteChildren = {
	DashboardSettingsAccountRoute,
	DashboardSettingsNotificationsRoute,
	DashboardSettingsStaffRoute,
	DashboardSettingsIndexRoute
};
var DashboardSettingsRouteWithChildren = DashboardSettingsRoute._addFileChildren(DashboardSettingsRouteChildren);
var DashboardSlotsRouteChildren = {
	DashboardSlotsCourtsRoute,
	DashboardSlotsSetupRoute,
	DashboardSlotsIndexRoute
};
var DashboardRouteChildren = {
	DashboardBookingsRoute: DashboardBookingsRouteWithChildren,
	DashboardPayoutsRoute: DashboardPayoutsRouteWithChildren,
	DashboardSettingsRoute: DashboardSettingsRouteWithChildren,
	DashboardSlotsRoute: DashboardSlotsRoute._addFileChildren(DashboardSlotsRouteChildren),
	DashboardIndexRoute
};
var rootRouteChildren = {
	IndexRoute,
	DashboardRoute: DashboardRoute._addFileChildren(DashboardRouteChildren),
	PendingRoute
};
var routeTree = Route$17._addFileChildren(rootRouteChildren)._addFileTypes();
var getRouter = () => {
	const queryClient = new QueryClient();
	return createRouter({
		routeTree,
		context: { queryClient },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
