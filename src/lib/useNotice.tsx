import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

/** Tiny inline status banner (this app has no toast library). */
export function useNotice(): { notice: ReactNode; ok: (t: string) => void; err: (t: string) => void } {
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((kind: "ok" | "err", text: string) => {
    setMsg({ kind, text });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 4000);
  }, []);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const notice = msg ? (
    <div
      role="status"
      className={
        "fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-sm font-semibold shadow-lg " +
        (msg.kind === "ok" ? "bg-emerald-600 text-white" : "bg-destructive text-destructive-foreground")
      }
    >
      {msg.text}
    </div>
  ) : null;
  const ok = useCallback((t: string) => show("ok", t), [show]);
  const err = useCallback((t: string) => show("err", t), [show]);
  return useMemo(() => ({ notice, ok, err }), [notice, ok, err]);
}
