import { useState } from "react";
import { SectionHeader } from "@/components/ui/section-header";
import { AllowedEmailsTable } from "@/components/admin/allowed-emails-table";
import { AddEmailDialog } from "@/components/admin/add-email-dialog";
import type { AllowedEmailWithId } from "@/lib/allowed-emails-service";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";

export default function AllowedEmailsPage() {
  const { t } = useTranslation();
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const handleAddEmail = () => {
    setAddDialogOpen(true);
  };

  const handleRemoveEmail = (email: AllowedEmailWithId) => {
    // This is handled by the table component
    console.log("Remove email:", email);
  };

  return (
    <>
      <SectionHeader
        title={t("allowedEmails.management")}
        subtitle={t("allowedEmails.subtitle")}
        action={handleAddEmail}
        actionText={t("allowedEmails.addEmail")}
        actionIcon={Plus}
      />

      <div className="px-4 lg:px-6">
        <AllowedEmailsTable
          onRemoveEmail={handleRemoveEmail}
        />
      </div>

      {/* Add Email Dialog */}
      <AddEmailDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />
    </>
  );
} 