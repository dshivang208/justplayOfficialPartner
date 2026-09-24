export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl font-display text-lg font-bold ${
          dark ? "bg-white text-primary" : "bg-primary text-primary-foreground"
        }`}
      >
        J
      </div>
      <div className="leading-tight">
        <div
          className={`font-display text-[15px] font-bold tracking-tight ${
            dark ? "text-white" : "text-foreground"
          }`}
        >
          JustPlay Partner
        </div>
        <div
          className={`text-[10.5px] font-semibold uppercase tracking-widest ${
            dark ? "text-white/60" : "text-muted-foreground"
          }`}
        >
          Venue Console
        </div>
      </div>
    </div>
  );
}
