-- AlterTable
ALTER TABLE "quick_payment_links" ADD COLUMN     "show_on_website" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "quick_payment_links_show_on_website_idx" ON "quick_payment_links"("show_on_website");
