import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Clock, Crown, Trash2, UserPlus, Users } from "lucide-react";
import { useStaff } from "@/lib/staff";
import { Button } from "@/components/partner/Button";
import { Modal } from "@/components/partner/Modal";
import { TextInput } from "@/components/partner/FormFields";

export const Route = createFileRoute("/dashboard/settings/staff")({
  head: () => ({ meta: [{ title: "Staff | JustPlay Partner" }] }),
  component: StaffPage,
});

function StaffPage() {
  const { staff, inviteStaff, removeStaff } = useStaff();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

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
      await inviteStaff({ name: name.trim(), phone });
      close();
    } catch (e) {
      setInviteError(e instanceof Error ? e.message : "Could not send the invite.");
    } finally {
      setInviting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-base font-semibold text-foreground">Who has access</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Staff can manage bookings and slots. They can't see payouts, bank details, or venue
            settings.
          </p>
        </div>
        <Button size="sm" onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-4 w-4" /> Invite staff
        </Button>
      </div>

      <div className="surface-card mt-4 flex flex-col divide-y divide-border rounded-2xl">
        {staff.map((s) => (
          <div key={s.id} className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {s.name
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{s.name}</p>
                {s.role === "owner" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    <Crown className="h-3 w-3" /> Owner
                  </span>
                )}
                {s.status === "invited" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-accent">
                    <Clock className="h-3 w-3" /> Invite pending
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">+91 {s.phone}</p>
            </div>
            {s.role !== "owner" && (
              <button
                onClick={() => removeStaff(s.id)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label={`Remove ${s.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
        {staff.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-6 w-6 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No staff added yet.</p>
          </div>
        )}
      </div>

      <Modal
        open={inviteOpen}
        onClose={close}
        title="Invite staff"
        description="They'll get an SMS with a link to set up access."
      >
        <div className="flex flex-col gap-4">
          <TextInput
            label="Name"
            placeholder="e.g. Ajay Kumar"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <TextInput
            label="Phone number"
            type="tel"
            inputMode="numeric"
            placeholder="98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
          />
          <Button
            disabled={name.trim().length < 2 || phone.length !== 10 || inviting}
            onClick={handleInvite}
          >
            {inviting ? "Sending\u2026" : "Send invite"}
          </Button>
          {inviteError && <p className="text-xs font-medium text-destructive">{inviteError}</p>}
        </div>
      </Modal>
    </div>
  );
}