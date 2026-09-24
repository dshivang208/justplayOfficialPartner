import { type InputHTMLAttributes, type ElementType } from "react";

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: ElementType;
};

export function TextInput({ label, icon: Icon, ...props }: TextInputProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-foreground">{label}</span>
      <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface px-3.5 py-2.5 transition-colors focus-within:border-primary">
        {Icon ? <Icon className="h-4 w-4 shrink-0 text-muted-foreground" /> : null}
        <input
          {...props}
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
    </label>
  );
}

export function OtpField({
  otp,
  setOtp,
  onEdit,
  phone,
}: {
  otp: string;
  setOtp: (v: string) => void;
  onEdit: () => void;
  phone: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">One-time code</span>
        <button
          type="button"
          onClick={onEdit}
          className="text-xs font-semibold text-primary underline underline-offset-2"
        >
          Edit number
        </button>
      </div>
      <input
        type="tel"
        inputMode="numeric"
        autoFocus
        placeholder="• • • • • •"
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
        style={{ letterSpacing: "0.4em" }}
        className="w-full rounded-xl border border-border px-4 py-3 text-center text-2xl font-semibold text-foreground outline-none focus:border-primary"
      />
      <p className="mt-2 text-xs text-muted-foreground">
        Demo mode &mdash; enter any 6 digits to continue. Code sent to +91 {phone}.
      </p>
    </div>
  );
}
