"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ACCOUNT_TYPE_LABELS } from "@/lib/labels";
import {
  accountSchema,
  accountTypeValues,
  type AccountFormValues,
} from "@/lib/validations/account";
import { createAccount, updateAccount } from "./actions";

type AccountFormDialogProps = {
  mode: "create" | "edit";
  accountId?: string;
  defaultValues?: AccountFormValues;
  trigger: React.ReactElement;
};

export function AccountFormDialog({
  mode,
  accountId,
  defaultValues,
  trigger,
}: AccountFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: defaultValues ?? { name: "", type: "CASH" },
  });

  const type = watch("type");

  function onSubmit(values: AccountFormValues) {
    startTransition(async () => {
      try {
        if (mode === "create") {
          await createAccount(values);
          toast.success("Hesap eklendi");
        } else if (accountId) {
          await updateAccount(accountId, values);
          toast.success("Hesap güncellendi");
        }
        setOpen(false);
        reset();
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Bir hata oluştu");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Yeni Hesap" : "Hesabı Düzenle"}
          </DialogTitle>
          <DialogDescription>
            Kasa veya banka hesabı bilgilerini girin.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="name">Hesap Adı</Label>
            <Input
              id="name"
              placeholder="örn. İş Bankası"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Tür</Label>
            <Select
              value={type}
              onValueChange={(value) =>
                value && setValue("type", value as AccountFormValues["type"])
              }
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {accountTypeValues.map((value) => (
                  <SelectItem key={value} value={value}>
                    {ACCOUNT_TYPE_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
