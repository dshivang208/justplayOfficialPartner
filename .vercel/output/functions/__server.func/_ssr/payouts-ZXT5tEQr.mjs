//#region node_modules/.nitro/vite/services/ssr/assets/payouts-ZXT5tEQr.js
function maskAccountNumber(accountNumber) {
	const digits = accountNumber.replace(/\D/g, "");
	if (digits.length <= 4) return digits;
	return `\u2022\u2022\u2022\u2022 ${digits.slice(-4)}`;
}
/** Payouts run weekly, every Monday, for the previous week's earnings —
*  returns the next Monday strictly after `from`. */
function nextPayoutDate(from = /* @__PURE__ */ new Date()) {
	const d = new Date(from);
	d.setHours(0, 0, 0, 0);
	const daysUntilMonday = (8 - d.getDay()) % 7 || 7;
	d.setDate(d.getDate() + daysUntilMonday);
	return d;
}
/** Real daily net-earnings trend for the last `days` days, built from
*  actual line items (pending + already-paid-out) rather than fake/random
*  data — payouts themselves are weekly batches, but the chart wants
*  daily granularity, so it's bucketed by each booking's own date. Days
*  with no bookings show as 0, not omitted, so the x-axis stays continuous. */
function dailyEarningsTrend(items, days) {
	const totalsByDate = /* @__PURE__ */ new Map();
	for (const item of items) totalsByDate.set(item.date, (totalsByDate.get(item.date) ?? 0) + item.netAmount);
	const points = [];
	const today = /* @__PURE__ */ new Date();
	for (let i = days - 1; i >= 0; i--) {
		const d = new Date(today);
		d.setDate(d.getDate() - i);
		const dateStr = d.toISOString().slice(0, 10);
		points.push({
			date: dateStr,
			amount: totalsByDate.get(dateStr) ?? 0
		});
	}
	return points;
}
function statusLabel(s) {
	switch (s) {
		case "processing": return "Processing";
		case "completed": return "Completed";
		case "failed": return "Failed";
	}
}
function verificationLabel(s) {
	switch (s) {
		case "verified": return "Verified";
		case "pending": return "Pending verification";
		case "failed": return "Verification failed";
	}
}
//#endregion
export { verificationLabel as a, statusLabel as i, maskAccountNumber as n, nextPayoutDate as r, dailyEarningsTrend as t };
