//#region node_modules/.nitro/vite/services/ssr/assets/bookings-DZADHeQj.js
function bookingSlotStart(b) {
	return /* @__PURE__ */ new Date(`${b.date}T${b.startTime}:00`);
}
function hoursUntilSlot(b, now = /* @__PURE__ */ new Date()) {
	return (bookingSlotStart(b).getTime() - now.getTime()) / 36e5;
}
function paymentMethodLabel(m) {
	return m === "cash" ? "Cash" : m === "upi" ? "UPI" : "Online";
}
function statusLabel(s) {
	switch (s) {
		case "confirmed": return "Confirmed";
		case "completed": return "Completed";
		case "cancelled": return "Cancelled";
		case "no_show": return "No-show";
	}
}
function formatBookingId(id) {
	return `JP-${id.replace(/\D/g, "").slice(-6).padStart(6, "0")}`;
}
//#endregion
export { statusLabel as i, hoursUntilSlot as n, paymentMethodLabel as r, formatBookingId as t };
