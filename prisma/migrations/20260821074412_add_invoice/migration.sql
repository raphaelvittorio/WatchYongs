-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "repairOrderId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "pdfPath" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Invoice_repairOrderId_fkey" FOREIGN KEY ("repairOrderId") REFERENCES "RepairOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_repairOrderId_key" ON "Invoice"("repairOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");
