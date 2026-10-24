export function PillTabs<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
}) {
  return (
    <div className="inline-flex max-w-full overflow-x-auto rounded-xl bg-surface-raised p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`shrink-0 whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm sm:px-4 font-semibold transition-colors ${
            value === opt.key
              ? "bg-surface text-foreground shadow-card"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
