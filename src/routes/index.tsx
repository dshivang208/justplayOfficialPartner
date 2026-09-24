import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Building2, CheckCircle2, MapPin, Phone, User } from "lucide-react";
import { Logo } from "@/components/partner/Logo";
import { Button } from "@/components/partner/Button";
import { TextInput, OtpField } from "@/components/partner/FormFields";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Log in | JustPlay Partner" },
      {
        name: "description",
        content:
          "Log in or list your venue on JustPlay Partner — the venue console for Kanpur sports venues.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { partner, requestOtp, verifyOtp, signup } = useAuth();

  const [tab, setTab] = useState<"login" | "signup">("login");
  const [stage, setStage] = useState<"form" | "otp">("form");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [loginPhone, setLoginPhone] = useState("");
  const [otp, setOtp] = useState("");

  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [signupPhone, setSignupPhone] = useState("");

  useEffect(() => {
    if (!partner) return;
    void navigate({ to: partner.status === "active" ? "/dashboard" : "/pending" });
  }, [partner, navigate]);

  const switchTab = (t: "login" | "signup") => {
    setTab(t);
    setStage("form");
    setOtp("");
    setError(null);
  };

  const canSendLoginOtp = loginPhone.replace(/\D/g, "").length === 10;
  const canSendSignupOtp =
    businessName.trim().length > 1 &&
    ownerName.trim().length > 1 &&
    signupPhone.replace(/\D/g, "").length === 10;

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
      const phone = tab === "login" ? loginPhone : signupPhone;
      const { hasPartnerAccount } = await verifyOtp(phone, otp);

      if (tab === "login" && !hasPartnerAccount) {
        setError("No partner account found for this number. Try Sign Up instead.");
        return;
      }
      if (tab === "signup" && !hasPartnerAccount) {
        await signup({ businessName, ownerName, city: "Kanpur" });
      }
      // On success, the `partner` state update above triggers the
      // navigation effect — nothing else to do here.
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed. Try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left brand panel */}
      <div
        className="relative hidden w-[42%] flex-col justify-between overflow-hidden px-12 py-10 lg:flex"
        style={{
          background:
            "linear-gradient(160deg, oklch(0.4 0.12 152) 0%, oklch(0.55 0.14 152) 62%, oklch(0.58 0.15 150) 100%)",
        }}
      >
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/[0.06]" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-white/5" />

        <Logo dark />

        <div className="relative">
          <p className="max-w-sm font-display text-[28px] font-semibold leading-[1.25] text-white">
            Run your venue from one screen &mdash; slots, bookings and payouts, sorted.
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/75">
            JustPlay Partner is how Kanpur's grounds, courts and turfs manage what happens on them
            &mdash; built for the front desk, not the boardroom.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            {[
              "See every booking the moment it's made",
              "Never double-book a slot again",
              "Track payouts without calling support",
            ].map((line) => (
              <div key={line} className="flex items-center gap-2.5 text-sm text-white/85">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-white/70" />
                {line}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/50">
          Approved venue partners across Kanpur &middot; justplay.app/partners
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-10">
        <div className="mb-8 flex w-full max-w-[400px] items-center justify-between lg:hidden">
          <Logo />
        </div>

        <div className="w-full max-w-[400px]">
          <div className="mb-7 inline-flex rounded-xl bg-surface-raised p-1">
            {(["login", "signup"] as const).map((t) => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${
                  tab === t ? "bg-surface text-foreground shadow-card" : "text-muted-foreground"
                }`}
              >
                {t === "login" ? "Log in" : "New partner"}
              </button>
            ))}
          </div>

          <h1 className="font-display text-[26px] font-semibold leading-tight text-foreground">
            {tab === "login" ? "Welcome back" : "List your venue on JustPlay"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {tab === "login"
              ? stage === "form"
                ? "Log in with the phone number on your venue account."
                : `Enter the code sent to +91 ${loginPhone}`
              : stage === "form"
                ? "Tell us about your business. We'll verify your phone number next."
                : `Enter the code sent to +91 ${signupPhone}`}
          </p>

          <div className="mt-6 flex flex-col gap-4">
            {tab === "login" && stage === "form" && (
              <TextInput
                label="Phone number"
                icon={Phone}
                type="tel"
                inputMode="numeric"
                placeholder="98765 43210"
                value={loginPhone}
                onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              />
            )}

            {tab === "login" && stage === "otp" && (
              <OtpField
                otp={otp}
                setOtp={setOtp}
                onEdit={() => setStage("form")}
                phone={loginPhone}
              />
            )}

            {tab === "signup" && stage === "form" && (
              <>
                <TextInput
                  label="Business name"
                  icon={Building2}
                  placeholder="e.g. Greenfield Sports Pvt. Ltd."
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
                <TextInput
                  label="Owner / manager name"
                  icon={User}
                  placeholder="e.g. Rakesh Verma"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                />
                <TextInput
                  label="Phone number"
                  icon={Phone}
                  type="tel"
                  inputMode="numeric"
                  placeholder="98765 43210"
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                />
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-foreground">
                    Venue city
                  </span>
                  <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface-raised px-3.5 py-2.5">
                    <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm text-foreground">Kanpur</span>
                    <span className="ml-auto rounded-full border border-border bg-surface px-2 py-0.5 text-[10.5px] font-semibold text-muted-foreground">
                      More cities soon
                    </span>
                  </div>
                </label>
              </>
            )}

            {tab === "signup" && stage === "otp" && (
              <OtpField
                otp={otp}
                setOtp={setOtp}
                onEdit={() => setStage("form")}
                phone={signupPhone}
              />
            )}

            <Button
              size="lg"
              className="w-full"
              disabled={
                sending ||
                (stage === "form"
                  ? tab === "login"
                    ? !canSendLoginOtp
                    : !canSendSignupOtp
                  : otp.length !== 6)
              }
              onClick={stage === "form" ? sendOtp : verify}
            >
              {sending
                ? "Please wait\u2026"
                : stage === "form"
                  ? "Send OTP"
                  : tab === "login"
                    ? "Verify & log in"
                    : "Create partner account"}
            </Button>

            {error && (
              <p className="text-xs font-semibold text-destructive" role="alert">
                {error}
              </p>
            )}

            {tab === "signup" && stage === "form" && (
              <p className="text-xs leading-relaxed text-muted-foreground">
                After sign-up, our team reviews and verifies every new venue before it goes live on
                JustPlay &mdash; this usually takes 1&ndash;2 business days.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
