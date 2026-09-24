import { r as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { L as Crown, R as Clock, o as UserPlus, r as Users, u as Trash2 } from "../_libs/lucide-react.mjs";
import { t as Button } from "./Button-DX-nONYl.mjs";
import { t as Modal } from "./Modal-B2p3_zTG.mjs";
import { n as TextInput } from "./FormFields-DvCxt7FY.mjs";
import { n as useStaff } from "./staff-CR_0WWjy.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard.settings.staff-CkmvuWYM.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function StaffPage() {
	const { staff, inviteStaff, removeStaff } = useStaff();
	const [inviteOpen, setInviteOpen] = (0, import_react.useState)(false);
	const [name, setName] = (0, import_react.useState)("");
	const [phone, setPhone] = (0, import_react.useState)("");
	const [inviting, setInviting] = (0, import_react.useState)(false);
	const [inviteError, setInviteError] = (0, import_react.useState)(null);
	const close = () => {
		setInviteOpen(false);
		setName("");
		setPhone("");
		setInviteError(null);
	};
	const handleInvite = async () => {
		setInviting(true);
		setInviteError(null);
		try {
			await inviteStaff({
				name: name.trim(),
				phone
			});
			close();
		} catch (e) {
			setInviteError(e instanceof Error ? e.message : "Could not send the invite.");
		} finally {
			setInviting(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-base font-semibold text-foreground",
				children: "Who has access"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-0.5 text-xs text-muted-foreground",
				children: "Staff can manage bookings and slots. They can't see payouts, bank details, or venue settings."
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				size: "sm",
				onClick: () => setInviteOpen(true),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserPlus, { className: "h-4 w-4" }), " Invite staff"]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "surface-card mt-4 flex flex-col divide-y divide-border rounded-2xl",
			children: [staff.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3 p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary",
						children: s.name.split(" ").map((p) => p[0]).slice(0, 2).join("")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-semibold text-foreground",
									children: s.name
								}),
								s.role === "owner" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crown, { className: "h-3 w-3" }), " Owner"]
								}),
								s.status === "invited" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-accent",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "h-3 w-3" }), " Invite pending"]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted-foreground",
							children: ["+91 ", s.phone]
						})]
					}),
					s.role !== "owner" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => removeStaff(s.id),
						className: "flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
						"aria-label": `Remove ${s.name}`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" })
					})
				]
			}, s.id)), staff.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col items-center justify-center py-16 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "h-6 w-6 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-muted-foreground",
					children: "No staff added yet."
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
			open: inviteOpen,
			onClose: close,
			title: "Invite staff",
			description: "They'll get an SMS with a link to set up access.",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextInput, {
						label: "Name",
						placeholder: "e.g. Ajay Kumar",
						value: name,
						onChange: (e) => setName(e.target.value),
						autoFocus: true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextInput, {
						label: "Phone number",
						type: "tel",
						inputMode: "numeric",
						placeholder: "98765 43210",
						value: phone,
						onChange: (e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						disabled: name.trim().length < 2 || phone.length !== 10 || inviting,
						onClick: handleInvite,
						children: inviting ? "Sending…" : "Send invite"
					}),
					inviteError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-medium text-destructive",
						children: inviteError
					})
				]
			})
		})
	] });
}
//#endregion
export { StaffPage as component };
