import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as Slot } from "../_libs/radix-ui__react-slot.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/Button-DX-nONYl.js
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50", {
	variants: {
		variant: {
			primary: "gradient-primary text-primary-foreground hover:glow-primary",
			accent: "bg-accent text-accent-foreground hover:brightness-110",
			outline: "border border-border bg-transparent text-foreground hover:border-primary hover:text-primary",
			ghost: "bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground",
			surface: "bg-secondary text-secondary-foreground hover:bg-surface-raised",
			destructive: "bg-destructive text-destructive-foreground hover:brightness-110"
		},
		size: {
			sm: "h-9 px-4 text-xs",
			md: "h-11 px-5 text-sm",
			lg: "h-13 px-8 text-base",
			icon: "h-10 w-10"
		}
	},
	defaultVariants: {
		variant: "primary",
		size: "md"
	}
});
function Button({ className, variant, size, asChild, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
}
//#endregion
export { Button as t };
