import { r as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { r as useAuth } from "./auth-DbMKYDei.mjs";
import { _ as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { E as MapPin, U as CircleCheck, et as Building2, i as User, x as Phone } from "../_libs/lucide-react.mjs";
import { t as Logo } from "./Logo-dgsTARq_.mjs";
import { t as Button } from "./Button-DX-nONYl.mjs";
import { n as TextInput, t as OtpField } from "./FormFields-DvCxt7FY.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-3Hbw99DS.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AuthPage() {
	const navigate = useNavigate();
	const { partner, requestOtp, verifyOtp, signup } = useAuth();
	const [tab, setTab] = (0, import_react.useState)("login");
	const [stage, setStage] = (0, import_react.useState)("form");
	const [sending, setSending] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [loginPhone, setLoginPhone] = (0, import_react.useState)("");
	const [otp, setOtp] = (0, import_react.useState)("");
	const [businessName, setBusinessName] = (0, import_react.useState)("");
	const [ownerName, setOwnerName] = (0, import_react.useState)("");
	const [signupPhone, setSignupPhone] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		if (!partner) return;
		navigate({ to: partner.status === "active" ? "/dashboard" : "/pending" });
	}, [partner, navigate]);
	const switchTab = (t) => {
		setTab(t);
		setStage("form");
		setOtp("");
		setError(null);
	};
	const canSendLoginOtp = loginPhone.replace(/\D/g, "").length === 10;
	const canSendSignupOtp = businessName.trim().length > 1 && ownerName.trim().length > 1 && signupPhone.replace(/\D/g, "").length === 10;
	const sendOtp = async () => {
		setSending(true);
		setError(null);
		try {
			await requestOtp(tab === "login" ? loginPhone : signupPhone);
			setStage("otp");
		} catch (e) {
			setError(e instanceof Error ? e.message : "Could not send OTP. Try again.");
		} finally {
			setSending(false);
		}
	};
	const verify = async () => {
		setSending(true);
		setError(null);
		try {
			const { hasPartnerAccount } = await verifyOtp(tab === "login" ? loginPhone : signupPhone, otp);
			if (tab === "login" && !hasPartnerAccount) {
				setError("No partner account found for this number. Try Sign Up instead.");
				return;
			}
			if (tab === "signup" && !hasPartnerAccount) await signup({
				businessName,
				ownerName,
				city: "Kanpur"
			});
		} catch (e) {
			setError(e instanceof Error ? e.message : "Verification failed. Try again.");
		} finally {
			setSending(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative hidden w-[42%] flex-col justify-between overflow-hidden px-12 py-10 lg:flex",
			style: { background: "linear-gradient(160deg, oklch(0.4 0.12 152) 0%, oklch(0.55 0.14 152) 62%, oklch(0.58 0.15 150) 100%)" },
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/[0.06]" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-white/5" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Logo, { dark: true }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "max-w-sm font-display text-[28px] font-semibold leading-[1.25] text-white",
							children: "Run your venue from one screen — slots, bookings and payouts, sorted."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-4 max-w-sm text-sm leading-relaxed text-white/75",
							children: "JustPlay Partner is how Kanpur's grounds, courts and turfs manage what happens on them — built for the front desk, not the boardroom."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-8 flex flex-col gap-3",
							children: [
								"See every booking the moment it's made",
								"Never double-book a slot again",
								"Track payouts without calling support"
							].map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2.5 text-sm text-white/85",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-4 w-4 shrink-0 text-white/70" }), line]
							}, line))
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "relative text-xs text-white/50",
					children: "Approved venue partners across Kanpur · justplay.app/partners"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-10",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-8 flex w-full max-w-[400px] items-center justify-between lg:hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Logo, {})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "w-full max-w-[400px]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-7 inline-flex rounded-xl bg-surface-raised p-1",
						children: ["login", "signup"].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => switchTab(t),
							className: `rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${tab === t ? "bg-surface text-foreground shadow-card" : "text-muted-foreground"}`,
							children: t === "login" ? "Log in" : "New partner"
						}, t))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-[26px] font-semibold leading-tight text-foreground",
						children: tab === "login" ? "Welcome back" : "List your venue on JustPlay"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1.5 text-sm text-muted-foreground",
						children: tab === "login" ? stage === "form" ? "Log in with the phone number on your venue account." : `Enter the code sent to +91 ${loginPhone}` : stage === "form" ? "Tell us about your business. We'll verify your phone number next." : `Enter the code sent to +91 ${signupPhone}`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 flex flex-col gap-4",
						children: [
							tab === "login" && stage === "form" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextInput, {
								label: "Phone number",
								icon: Phone,
								type: "tel",
								inputMode: "numeric",
								placeholder: "98765 43210",
								value: loginPhone,
								onChange: (e) => setLoginPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
							}),
							tab === "login" && stage === "otp" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OtpField, {
								otp,
								setOtp,
								onEdit: () => setStage("form"),
								phone: loginPhone
							}),
							tab === "signup" && stage === "form" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextInput, {
									label: "Business name",
									icon: Building2,
									placeholder: "e.g. Greenfield Sports Pvt. Ltd.",
									value: businessName,
									onChange: (e) => setBusinessName(e.target.value)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextInput, {
									label: "Owner / manager name",
									icon: User,
									placeholder: "e.g. Rakesh Verma",
									value: ownerName,
									onChange: (e) => setOwnerName(e.target.value)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextInput, {
									label: "Phone number",
									icon: Phone,
									type: "tel",
									inputMode: "numeric",
									placeholder: "98765 43210",
									value: signupPhone,
									onChange: (e) => setSignupPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mb-1.5 block text-sm font-semibold text-foreground",
										children: "Venue city"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2.5 rounded-xl border border-border bg-surface-raised px-3.5 py-2.5",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "h-4 w-4 shrink-0 text-muted-foreground" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-sm text-foreground",
												children: "Kanpur"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "ml-auto rounded-full border border-border bg-surface px-2 py-0.5 text-[10.5px] font-semibold text-muted-foreground",
												children: "More cities soon"
											})
										]
									})]
								})
							] }),
							tab === "signup" && stage === "otp" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OtpField, {
								otp,
								setOtp,
								onEdit: () => setStage("form"),
								phone: signupPhone
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "lg",
								className: "w-full",
								disabled: sending || (stage === "form" ? tab === "login" ? !canSendLoginOtp : !canSendSignupOtp : otp.length !== 6),
								onClick: stage === "form" ? sendOtp : verify,
								children: sending ? "Please wait…" : stage === "form" ? "Send OTP" : tab === "login" ? "Verify & log in" : "Create partner account"
							}),
							error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-semibold text-destructive",
								role: "alert",
								children: error
							}),
							tab === "signup" && stage === "form" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs leading-relaxed text-muted-foreground",
								children: "After sign-up, our team reviews and verifies every new venue before it goes live on JustPlay — this usually takes 1–2 business days."
							})
						]
					})
				]
			})]
		})]
	});
}
//#endregion
export { AuthPage as component };
