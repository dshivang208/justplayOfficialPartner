//#region node_modules/.nitro/vite/services/ssr/assets/dashboard-fdtWZGlf.js
var STATS_ACTIVE = {
	todayBookingsCount: 6,
	nextSlotLabel: "6:00 PM – Box Cricket – Aditya M.",
	bookingsThisWeek: 41,
	bookingsThisWeekDelta: 12,
	revenueThisWeek: 36850,
	revenueThisWeekDelta: 8,
	occupancyRate: 74,
	occupancyRateDelta: -3
};
var STATS_EMPTY = {
	todayBookingsCount: 0,
	nextSlotLabel: null,
	bookingsThisWeek: 0,
	bookingsThisWeekDelta: 0,
	revenueThisWeek: 0,
	revenueThisWeekDelta: 0,
	occupancyRate: 0,
	occupancyRateDelta: 0
};
var STATIC_ALERTS = [{
	id: "a3",
	level: "info",
	text: "Sunday evening slots (6–9 PM) are fully booked — consider adding more capacity",
	action: "Manage slots",
	href: "/dashboard/slots"
}];
function formatINR(n) {
	return `\u20B9${n.toLocaleString("en-IN")}`;
}
//#endregion
export { formatINR as i, STATS_ACTIVE as n, STATS_EMPTY as r, STATIC_ALERTS as t };
