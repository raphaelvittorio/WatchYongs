import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireScopePage, scopedOrderWhere } from "@/lib/branch";
import { PrintButton } from "@/components/orders/PrintButton";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/shared/BrandLogo";
import { getWorkChecklist, SERVICE_TYPE_LABELS } from "@/lib/status";

function ChecklistBox({ checked }: { checked: boolean }) {
  return (
    <span
      className={
        "inline-flex h-4 w-4 items-center justify-center rounded-sm border text-[10px] leading-none " +
        (checked ? "border-black bg-black text-white" : "border-black text-transparent")
      }
    >
      ✓
    </span>
  );
}

// Di HP label ditumpuk di atas nilainya; layout dua kolom aslinya tetap
// dipakai mulai sm dan saat dicetak.
function Field({ no, label, value }: { no: number; label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col border-b border-dashed border-neutral-300 py-2.5 text-sm last:border-b-0 sm:flex-row sm:gap-3 print:flex-row print:gap-3">
      <span className="shrink-0 text-neutral-500 sm:w-48 print:w-48">
        <span className="inline-block w-6 font-mono text-xs">{no}.</span>
        {label}
      </span>
      <span className="flex-1 font-medium break-words">{value ?? "-"}</span>
    </div>
  );
}

export default async function KartuKerjaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scope = await requireScopePage();
  const order = await prisma.repairOrder.findFirst({
    where: scopedOrderWhere(scope, id),
    include: { customer: true, branch: true },
  });

  if (!order) {
    notFound();
  }

  const checklist = getWorkChecklist(order.status);
  const watchLabel = `${order.watchBrand}${order.watchModel ? ` ${order.watchModel}` : ""}`;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 p-4 sm:p-8 print:p-0">
      <div className="flex flex-col gap-3 print:hidden sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={`/orders/${order.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            render={
              <a
                href={`/api/orders/${order.id}/tanda-terima`}
                target="_blank"
                rel="noreferrer"
              />
            }
            nativeButton={false}
            className="flex-1 sm:flex-none"
          >
            <FileText className="h-4 w-4" />
            Tanda Terima (PDF)
          </Button>
          <PrintButton className="flex-1 sm:flex-none" />
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5 text-black shadow-card sm:p-8 print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <div className="mb-5 flex items-center justify-between gap-4 border-b-2 border-black pb-4">
          <div className="flex items-center gap-3">
            <BrandMark className="size-11 text-black" />
            <div>
              <p className="text-lg leading-tight font-bold">WatchYongs</p>
              <p className="text-xs text-neutral-500">
                Kartu Kerja Reparasi Jam · Cabang {order.branch.name}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase">
              No. Order
            </p>
            <p className="font-mono text-lg font-bold">{order.orderNumber}</p>
          </div>
        </div>

        <Field no={1} label="Nomor" value={order.orderNumber} />
        <Field no={2} label="Tanggal" value={order.createdAt.toLocaleDateString("id-ID")} />
        <Field no={3} label="Nama Jam" value={watchLabel} />
        <Field no={4} label="Nama Owner Jam" value={order.customer.name} />
        <Field no={5} label="Nomor Hape Owner" value={order.customer.phone} />
        <Field no={6} label="Keterangan Masalah" value={order.notes} />
        {/* Field 7 ke bawah adalah catatan internal — tidak ikut tercetak di
            tanda terima yang diberikan ke customer. */}
        <Field
          no={7}
          label="Usia Owner Jam"
          value={order.customer.ownerAge ? `${order.customer.ownerAge} tahun` : null}
        />
        <Field no={8} label="Karakter Owner Jam" value={order.customer.ownerCharacter} />
        <Field
          no={9}
          label="Jenis Service"
          value={order.serviceType ? SERVICE_TYPE_LABELS[order.serviceType] : null}
        />

        <div className="mt-2 flex flex-col py-2 text-sm sm:flex-row sm:gap-3 print:flex-row print:gap-3">
          <span className="shrink-0 text-neutral-500 sm:w-48 print:w-48">Progress</span>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 font-mono text-xs text-neutral-500">10.</span>
              <ChecklistBox checked={checklist.dropJam} />
              <span>Drop Jam</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 font-mono text-xs text-neutral-500">11.</span>
              <ChecklistBox checked={checklist.onProses} />
              <span>Onproses</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 font-mono text-xs text-neutral-500">12.</span>
              <ChecklistBox checked={checklist.selesai} />
              <span>Selesai</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 font-mono text-xs text-neutral-500">13.</span>
              <ChecklistBox checked={checklist.ambilJam} />
              <span>Ambil Jam</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
