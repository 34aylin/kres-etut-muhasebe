"use client";

import { Ban } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DeleteConfirmButton } from "@/components/shared/delete-confirm-button";
import { deactivateAccount, deactivateCategory } from "./actions";

export function DeactivateButton({
  kind,
  id,
  label,
}: {
  kind: "account" | "category";
  id: string;
  label: string;
}) {
  const action = kind === "account" ? deactivateAccount : deactivateCategory;

  return (
    <DeleteConfirmButton
      title={
        kind === "account" ? "Hesabı pasifleştir" : "Kategoriyi pasifleştir"
      }
      description={`"${label}" pasif duruma alınacak; geçmiş hareketler etkilenmez ama yeni kayıtlarda seçilemez.`}
      onConfirm={action.bind(null, id)}
      confirmLabel="Pasifleştir"
      pendingLabel="Pasifleştiriliyor..."
      successMessage="Pasifleştirildi"
      errorMessage="Pasifleştirilemedi"
      trigger={
        <Button variant="outline" size="icon">
          <Ban className="size-4" />
        </Button>
      }
    />
  );
}
