-- CreateTable
CREATE TABLE "video_localizations" (
    "id" TEXT NOT NULL,
    "video_id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "video_localizations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "video_localizations_video_id_locale_key" ON "video_localizations"("video_id", "locale");

-- AddForeignKey
ALTER TABLE "video_localizations" ADD CONSTRAINT "video_localizations_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
