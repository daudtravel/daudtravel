-- CreateTable
CREATE TABLE "insurance_settings" (
    "id" TEXT NOT NULL,
    "pricePerPerson" DECIMAL(10,2) NOT NULL,
    "adminEmail" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_submissions" (
    "id" TEXT NOT NULL,
    "submitter_email" TEXT NOT NULL,
    "external_order_id" TEXT NOT NULL,
    "bog_order_id" TEXT NOT NULL,
    "payment_url" TEXT,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "people_count" INTEGER NOT NULL,
    "price_per_person" DECIMAL(10,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "transaction_id" TEXT,
    "payment_method" TEXT,
    "callback_data" JSONB,
    "email_sent" BOOLEAN NOT NULL DEFAULT false,
    "email_sent_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "paid_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_people" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "passport_photo" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insurance_people_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "insurance_submissions_external_order_id_key" ON "insurance_submissions"("external_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_submissions_bog_order_id_key" ON "insurance_submissions"("bog_order_id");

-- CreateIndex
CREATE INDEX "insurance_submissions_submitter_email_idx" ON "insurance_submissions"("submitter_email");

-- CreateIndex
CREATE INDEX "insurance_submissions_status_created_at_idx" ON "insurance_submissions"("status", "created_at");

-- CreateIndex
CREATE INDEX "insurance_submissions_external_order_id_idx" ON "insurance_submissions"("external_order_id");

-- CreateIndex
CREATE INDEX "insurance_people_submission_id_idx" ON "insurance_people"("submission_id");

-- AddForeignKey
ALTER TABLE "insurance_people" ADD CONSTRAINT "insurance_people_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "insurance_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
