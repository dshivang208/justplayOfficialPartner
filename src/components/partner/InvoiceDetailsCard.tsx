import { useEffect, useState } from "react";
import { Building2, Copy } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type Invoice = { gstNumber: string; companyName: string; companyAddress: string };

/**
 * GST invoice details the player attached to this booking (their corporate
 * profile, copied at the time). Renders nothing when the player didn't ask
 * for a GST invoice — or when the booking_invoice_details table isn't
 * installed yet. The venue issues the invoice itself.
 */
export function InvoiceDetailsCard({ bookingId }: { bookingId: string }) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase
      .from("booking_invoice_details")
      .select("gst_number, company_name, company_address")
      .eq("booking_id", bookingId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active || error || !data) return;
        setInvoice({
          gstNumber: data.gst_number as string,
          companyName: data.company_name as string,
          companyAddress: data.company_address as string,
        });
      });
    return () => {
      active = false;
    };
  }, [bookingId]);

  if (!invoice) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(
        `${invoice.companyName}\nGSTIN: ${invoice.gstNumber}\n${invoice.companyAddress}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — the details are still on screen */
    }
  };

  return (
    <div className="surface-card mt-4 rounded-2xl border border-primary/30 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="inline-flex items-center gap-2 font-display text-base font-semibold text-foreground">
            <Building2 className="h-4 w-4 text-primary" /> GST invoice requested
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            The customer needs a GST invoice from you for this booking.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void copy()}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <Copy className="h-3.5 w-3.5" /> {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <dl className="mt-3 divide-y divide-border text-sm">
        <div className="flex justify-between gap-4 py-2">
          <dt className="text-muted-foreground">Company</dt>
          <dd className="text-right font-semibold text-foreground">{invoice.companyName}</dd>
        </div>
        <div className="flex justify-between gap-4 py-2">
          <dt className="text-muted-foreground">GSTIN</dt>
          <dd className="text-right font-semibold tracking-wider text-foreground">{invoice.gstNumber}</dd>
        </div>
        <div className="flex justify-between gap-4 py-2">
          <dt className="text-muted-foreground">Address</dt>
          <dd className="max-w-[60%] text-right font-semibold text-foreground">{invoice.companyAddress}</dd>
        </div>
      </dl>
    </div>
  );
}
