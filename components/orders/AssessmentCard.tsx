"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Assessment = {
  estimatedPrice: number;
  diagnosis: string | null;
  decision: "PENDING" | "APPROVED" | "REJECTED";
} | null;

export function AssessmentCard({
  orderId,
  assessment,
}: {
  orderId: string;
  assessment: Assessment;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(!assessment);
  const [estimatedPrice, setEstimatedPrice] = useState(
    assessment?.estimatedPrice?.toString() ?? "",
  );
  const [diagnosis, setDiagnosis] = useState(assessment?.diagnosis ?? "");
  const [saving, setSaving] = useState(false);
  const [deciding, setDeciding] = useState(false);

  async function saveEstimate() {
    setSaving(true);
    const res = await fetch(`/api/orders/${orderId}/assessment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        estimatedPrice: Number(estimatedPrice),
        diagnosis,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Gagal menyimpan estimasi.");
      return;
    }
    toast.success("Estimasi disimpan.");
    setEditing(false);
    router.refresh();
  }

  async function decide(decision: "APPROVED" | "REJECTED") {
    setDeciding(true);
    const res = await fetch(`/api/orders/${orderId}/assessment/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    setDeciding(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Gagal menyimpan keputusan.");
      return;
    }
    toast.success(
      decision === "APPROVED" ? "Customer setuju." : "Customer menolak.",
    );
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Assessment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {editing ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="estimatedPrice">Estimasi Harga (Rp)</Label>
              <Input
                id="estimatedPrice"
                type="number"
                min={0}
                value={estimatedPrice}
                onChange={(e) => setEstimatedPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="diagnosis">Diagnosis</Label>
              <Textarea
                id="diagnosis"
                rows={3}
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={saving || !estimatedPrice}
                onClick={saveEstimate}
              >
                {saving ? "Menyimpan..." : "Simpan Estimasi"}
              </Button>
              {assessment && (
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                  Batal
                </Button>
              )}
            </div>
          </div>
        ) : (
          assessment && (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Estimasi Harga</p>
                <p className="text-lg font-semibold">
                  Rp {assessment.estimatedPrice.toLocaleString("id-ID")}
                </p>
              </div>
              {assessment.diagnosis && (
                <div>
                  <p className="text-sm text-muted-foreground">Diagnosis</p>
                  <p className="text-sm">{assessment.diagnosis}</p>
                </div>
              )}

              {assessment.decision === "PENDING" ? (
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button size="sm" disabled={deciding} onClick={() => decide("APPROVED")}>
                    Setuju
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={deciding}
                    onClick={() => decide("REJECTED")}
                  >
                    Tolak
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                    Edit Estimasi
                  </Button>
                </div>
              ) : (
                <Badge
                  variant="outline"
                  className={
                    assessment.decision === "APPROVED"
                      ? "border-emerald-200 bg-emerald-100 text-emerald-800"
                      : "border-red-200 bg-red-100 text-red-800"
                  }
                >
                  {assessment.decision === "APPROVED"
                    ? "Disetujui customer"
                    : "Ditolak customer"}
                </Badge>
              )}
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
