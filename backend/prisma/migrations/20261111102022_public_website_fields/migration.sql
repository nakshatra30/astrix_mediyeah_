-- AlterTable
ALTER TABLE "enquiries" ADD COLUMN     "preferredContactMethod" TEXT;

-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN     "aboutIntro" TEXT,
ADD COLUMN     "address" TEXT,
ADD COLUMN     "agencyName" TEXT,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "footerText" TEXT,
ADD COLUMN     "heroSubtitle" TEXT,
ADD COLUMN     "heroTitle" TEXT,
ADD COLUMN     "socialFacebook" TEXT,
ADD COLUMN     "socialInstagram" TEXT,
ADD COLUMN     "socialLinkedIn" TEXT,
ADD COLUMN     "socialX" TEXT,
ADD COLUMN     "socialYoutube" TEXT,
ADD COLUMN     "whatsappNumber" TEXT;
