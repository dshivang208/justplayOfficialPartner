import { r as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { u as formatTimeLabel } from "./inventory-OoBm9l3h.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { A as ListChecks, E as MapPin, G as ChevronRight, J as Camera, K as ChevronLeft, t as X, w as OctagonAlert } from "../_libs/lucide-react.mjs";
import { t as Button } from "./Button-DX-nONYl.mjs";
import { n as TextInput } from "./FormFields-DvCxt7FY.mjs";
import { n as useInventory } from "./inventory-BgKRcK7F.mjs";
import { r as useVenueProfile, t as AMENITY_OPTIONS } from "./venueProfile-CzdchA95.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard.settings.index-DO6fhXQ3.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function VenueProfilePage() {
	const { profile, reviewPending, updateDescription, updateAmenities, addPhoto, removePhoto, reorderPhoto, submitMajorChange, discardPendingChange } = useVenueProfile();
	const { courts } = useInventory();
	const fileInputRef = (0, import_react.useRef)(null);
	const [nameDraft, setNameDraft] = (0, import_react.useState)(profile.pendingName ?? profile.name);
	const [addressDraft, setAddressDraft] = (0, import_react.useState)(profile.pendingAddress ?? profile.address);
	const [descriptionDraft, setDescriptionDraft] = (0, import_react.useState)(profile.description);
	const [descriptionSaved, setDescriptionSaved] = (0, import_react.useState)(true);
	const [identityError, setIdentityError] = (0, import_react.useState)(null);
	const [savingField, setSavingField] = (0, import_react.useState)(null);
	const handleSubmitField = async (field, value) => {
		setSavingField(field);
		setIdentityError(null);
		try {
			await submitMajorChange({ [field]: value });
		} catch (e) {
			setIdentityError(e instanceof Error ? e.message : "Could not submit that change.");
		} finally {
			setSavingField(null);
		}
	};
	const handleDiscard = async () => {
		setSavingField("discard");
		setIdentityError(null);
		try {
			await discardPendingChange();
			setNameDraft(profile.name);
			setAddressDraft(profile.address);
		} catch (e) {
			setIdentityError(e instanceof Error ? e.message : "Could not discard the pending change.");
		} finally {
			setSavingField(null);
		}
	};
	const handlePhotoPick = (file) => {
		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result === "string") addPhoto(reader.result);
		};
		reader.readAsDataURL(file);
	};
	const toggleAmenity = (a) => {
		updateAmenities(profile.amenities.includes(a) ? profile.amenities.filter((x) => x !== a) : [...profile.amenities, a]);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-5",
		children: [
			reviewPending && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-3 rounded-2xl border-l-4 border-accent bg-accent/10 px-4 py-3.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OctagonAlert, { className: "mt-0.5 h-4 w-4 shrink-0 text-accent" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-semibold text-foreground",
							children: "Changes pending review"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-0.5 text-sm text-muted-foreground",
							children: [
								profile.pendingName && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									"New name: ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
										className: "text-foreground",
										children: profile.pendingName
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {})
								] }),
								profile.pendingAddress && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									"New address: ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
										className: "text-foreground",
										children: profile.pendingAddress
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {})
								] }),
								"Your venue stays live under its current details until this is approved — usually 1–2 business days."
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: handleDiscard,
							disabled: savingField === "discard",
							className: "mt-2 text-xs font-semibold text-accent underline underline-offset-2 disabled:opacity-50",
							children: savingField === "discard" ? "Discarding…" : "Discard pending change"
						})
					]
				})]
			}),
			identityError && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-3 rounded-2xl border-l-4 border-destructive bg-destructive/5 px-4 py-3.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OctagonAlert, { className: "mt-0.5 h-4 w-4 shrink-0 text-destructive" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-destructive",
					children: identityError
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "surface-card rounded-2xl p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-base font-semibold text-foreground",
						children: "Venue identity"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-0.5 text-xs text-muted-foreground",
						children: "Changes to name or address go through a quick review before going live."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex flex-col gap-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-end gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex-1",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextInput, {
										label: "Venue name",
										value: nameDraft,
										onChange: (e) => setNameDraft(e.target.value)
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									size: "sm",
									disabled: nameDraft.trim() === (profile.pendingName ?? profile.name) || savingField === "name",
									onClick: () => handleSubmitField("name", nameDraft.trim()),
									children: savingField === "name" ? "Submitting…" : "Submit"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-end gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex-1",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextInput, {
										label: "Address",
										icon: MapPin,
										value: addressDraft,
										onChange: (e) => setAddressDraft(e.target.value)
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									size: "sm",
									disabled: addressDraft.trim() === (profile.pendingAddress ?? profile.address) || savingField === "address",
									onClick: () => handleSubmitField("address", addressDraft.trim()),
									children: savingField === "address" ? "Submitting…" : "Submit"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] text-muted-foreground",
								children: "Map preview isn't available in this preview — the live app pins your address on the venue page."
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "surface-card rounded-2xl p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-base font-semibold text-foreground",
						children: "Description"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-0.5 text-xs text-muted-foreground",
						children: "Saves instantly — shown on your venue page."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						value: descriptionDraft,
						onChange: (e) => {
							setDescriptionDraft(e.target.value);
							setDescriptionSaved(false);
						},
						rows: 4,
						placeholder: "Tell players what makes your venue worth booking",
						className: "mt-3 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "outline",
						className: "mt-2",
						disabled: descriptionSaved,
						onClick: () => {
							updateDescription(descriptionDraft);
							setDescriptionSaved(true);
						},
						children: descriptionSaved ? "Saved" : "Save description"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "surface-card rounded-2xl p-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-base font-semibold text-foreground",
							children: "Photos"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-0.5 text-xs text-muted-foreground",
							children: "Saves instantly. First photo is your cover image."
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							ref: fileInputRef,
							type: "file",
							accept: "image/*",
							className: "hidden",
							onChange: (e) => {
								const file = e.target.files?.[0];
								if (file) handlePhotoPick(file);
								e.target.value = "";
							}
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							onClick: () => fileInputRef.current?.click(),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "h-4 w-4" }), " Add photo"]
						})
					]
				}), profile.photos.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-sm text-muted-foreground",
					children: "No photos yet — add a few to help players recognize your venue."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3",
					children: profile.photos.map((src, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "group relative overflow-hidden rounded-xl border border-border",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src,
								alt: `Venue photo ${i + 1}`,
								className: "h-28 w-full object-cover"
							}),
							i === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground",
								children: "Cover"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "absolute inset-x-0 bottom-0 flex items-center justify-between bg-ink/60 px-1.5 py-1 opacity-0 transition-opacity group-hover:opacity-100",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-0.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										disabled: i === 0,
										onClick: () => reorderPhoto(i, -1),
										className: "flex h-6 w-6 items-center justify-center rounded text-white disabled:opacity-30",
										"aria-label": "Move earlier",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "h-3.5 w-3.5" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										disabled: i === profile.photos.length - 1,
										onClick: () => reorderPhoto(i, 1),
										className: "flex h-6 w-6 items-center justify-center rounded text-white disabled:opacity-30",
										"aria-label": "Move later",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "h-3.5 w-3.5" })
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => removePhoto(i),
									className: "flex h-6 w-6 items-center justify-center rounded text-white",
									"aria-label": "Remove photo",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-3.5 w-3.5" })
								})]
							})
						]
					}, i))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "surface-card rounded-2xl p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-base font-semibold text-foreground",
						children: "Amenities"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-0.5 text-xs text-muted-foreground",
						children: "Saves instantly."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 flex flex-wrap gap-2",
						children: AMENITY_OPTIONS.map((a) => {
							const active = profile.amenities.includes(a);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => toggleAmenity(a),
								className: `rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`,
								children: a
							}, a);
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "surface-card rounded-2xl p-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-base font-semibold text-foreground",
						children: "Sports & courts"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/dashboard/slots/courts",
						className: "flex items-center gap-1 text-xs font-semibold text-primary",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListChecks, { className: "h-3.5 w-3.5" }), " Manage in Slots & Inventory"]
					})]
				}), courts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-muted-foreground",
					children: "No courts added yet."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 flex flex-col divide-y divide-border",
					children: courts.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between py-2.5 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-semibold text-foreground",
							children: c.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted-foreground",
							children: c.opensAt && c.closesAt ? `${formatTimeLabel(c.opensAt)} \u2013 ${formatTimeLabel(c.closesAt)}` : "Not set up yet"
						})]
					}, c.id))
				})]
			})
		]
	});
}
//#endregion
export { VenueProfilePage as component };
