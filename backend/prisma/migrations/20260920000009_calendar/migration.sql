-- CreateTable
CREATE TABLE "calendar_notes" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "time" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "color" TEXT NOT NULL DEFAULT 'green',
    "is_done" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "calendar_notes_date_idx" ON "calendar_notes"("date");

-- CreateIndex
CREATE INDEX "calendar_notes_created_by_id_idx" ON "calendar_notes"("created_by_id");

-- AddForeignKey
ALTER TABLE "calendar_notes" ADD CONSTRAINT "calendar_notes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

