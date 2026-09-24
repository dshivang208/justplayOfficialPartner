import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CircleCheck, Hourglass, RefreshCw, XCircle } from "lucide-react";
import { Logo } from "@/components/partner/Logo";
import { Button } from "@/components/partner/Button";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/pending")({
  head: () => ({
    meta: [{ title: "Application under review | JustPlay Partner" }],
  }),
  component: PendingPage,
});

const STEPS = [
  { label: "Application submitted", done: true, current: false },
  { label: "Under review by JustPlay", done: false, current: true },
  { label: "Venue approved & live", done: false, current: false },
];

function PendingPage() {
  const navigate = useNavigate();
  const { partner, refreshPartnerContext, logout } = useAuth();
  const [checking, setChecking] = useState(false);
  const [checkedOnce, setCheckedOnce] = useState(false);

  useEffect(() => {
    if (!partner) {
      void navigate({ to: "/" });
    } else if (partner.status === "active") {
      void navigate({ to: "/dashboard" });
    }
  }, [partner, navigate]);

  if (!partner) return null;

  const checkAgain = async () => {
    setChecking(true);
    try {
      await refreshPartnerContext();
    } finally {
      setChecking(false);
      setCheckedOnce(true);
    }
  };

  if (partner.status === "rejected") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16">
        <div className="mb-8">
          <Logo />
        </div>
        <div className="surface-card w-full max-w-md rounded-2xl p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
            <XCircle className="h-6 w-6 text-destructive" />
          </div>
          <h1 className="mt-5 font-display text-2xl font-semibold leading-tight text-foreground">
            Your application wasn't approved
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Reach the partner team at{" "}
            <strong className="text-foreground">partners@justplay.app</strong> to find out what to
            fix and resubmit.
          </p>
          <Button variant="outline" className="mt-5" onClick={logout}>
            Back to login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16">
      <div className="mb-8">
        <Logo />
      </div>

      <div className="surface-card w-full max-w-md rounded-2xl p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15">
          <Hourglass className="h-6 w-6 text-accent" />
        </div>

        <h1 className="mt-5 font-display text-2xl font-semibold leading-tight text-foreground">
          Your venue is under review
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Thanks, {partner.ownerName.split(" ")[0]}. We've received{" "}
          <strong className="text-foreground">{partner.businessName}</strong> and our team is
          verifying it. You'll get an SMS the moment you're approved and live.
        </p>

        <div className="mt-7 flex flex-col text-left">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                    s.done
                      ? "bg-primary"
                      : s.current
                        ? "border-2 border-accent bg-accent/15"
                        : "bg-surface-raised"
                  }`}
                >
                  {s.done ? (
                    <CircleCheck className="h-4 w-4 text-primary-foreground" />
                  ) : (
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${s.current ? "bg-accent" : "bg-muted-foreground"}`}
                    />
                  )}
                </div>
                {i < STEPS.length - 1 && <div className="my-0.5 h-8 w-px bg-border" />}
              </div>
              <div className="pb-8 pt-0.5">
                <p
                  className={`text-sm font-semibold ${s.current || s.done ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {s.label}
                </p>
                {s.current && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Usually takes 1&ndash;2 business days
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-primary/5 p-3.5 text-left">
          <p className="text-xs leading-relaxed text-foreground/80">
            Questions about your application? Reach the partner team at{" "}
            <strong>partners@justplay.app</strong> or <strong>+91 512 400 1122</strong>.
          </p>
        </div>
      </div>

      <Button variant="outline" className="mt-6" onClick={checkAgain} disabled={checking}>
        <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
        {checking ? "Checking\u2026" : "Check approval status"}
      </Button>
      {checkedOnce && !checking && (
        <p className="mt-2 text-xs text-muted-foreground">Still pending &mdash; check back soon.</p>
      )}
    </div>
  );
}
