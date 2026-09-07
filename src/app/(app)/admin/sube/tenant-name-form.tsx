"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateTenantName } from "../actions";

export function TenantNameForm({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      try {
        await updateTenantName(name);
        toast.success("Şube bilgileri güncellendi");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Bir hata oluştu");
      }
    });
  }

  return (
    <form className="max-w-sm space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="tenantName">Şube Adı</Label>
        <Input
          id="tenantName"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Kaydediliyor..." : "Kaydet"}
      </Button>
    </form>
  );
}
