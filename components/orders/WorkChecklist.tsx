import { getWorkChecklist, type OrderStatus } from "@/lib/status";

const ROWS: { key: keyof ReturnType<typeof getWorkChecklist>; label: string }[] = [
  { key: "dropJam", label: "Drop Jam" },
  { key: "onProses", label: "Onproses" },
  { key: "selesai", label: "Selesai" },
  { key: "ambilJam", label: "Ambil Jam" },
];

export function WorkChecklist({ status }: { status: OrderStatus }) {
  const checklist = getWorkChecklist(status);

  return (
    <ul className="space-y-2">
      {ROWS.map((row) => {
        const checked = checklist[row.key];
        return (
          <li key={row.key} className="flex items-center gap-2 text-sm">
            <span
              className={
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border text-[10px] leading-none " +
                (checked
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-muted-foreground/40 text-transparent")
              }
            >
              ✓
            </span>
            <span className={checked ? "" : "text-muted-foreground"}>{row.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
