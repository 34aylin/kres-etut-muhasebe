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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAYMENT_METHOD_LABELS } from "@/lib/labels";
import {
  paymentSchema,
  type PaymentFormValues,
} from "@/lib/validations/payment";
import { paymentMethodValues } from "@/lib/validations/transaction";
import { recordPayment } from "./finance-actions";

type Option = { id: string; label: string };

type RecordPaymentDialogProps = {
  chargeId: string;
  parentId: string;
  remainingAmount: number;
  accounts: Option[];
  trigger: React.ReactElement;
};

export function RecordPaymentDialog({
  chargeId,
  parentId,
  remainingAmount,
  accounts,
  trigger,
}: RecordPaymentDialogProps) {
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
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: remainingAmount,
      date: new Date().toISOString().slice(0, 10),
      accountId: accounts[0]?.id ?? "",
      paymentMethod: "CASH",
      description: "",
    },
  });

  const accountId = watch("accountId");
  const paymentMethod = watch("paymentMethod");

  function onSubmit(values: PaymentFormValues) {
    startTransition(async () => {
      try {
        await recordPayment(chargeId, parentId, values);
        toast.success("Tahsilat kaydedildi");
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
          <DialogTitle>Tahsilat Al</DialogTitle>
          <DialogDescription>
            Bu borca karşılık alınan ödemeyi kaydedin.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="amount">Tutar (₺)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              {...register("amount", { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">
                {errors.amount.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Tarih</Label>
              <Input id="date" type="date" {...register("date")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Ödeme Yöntemi</Label>
              <Select
                value={paymentMethod}
                onValueChange={(value) =>
                  value &&
                  setValue(
                    "paymentMethod",
                    value as PaymentFormValues["paymentMethod"],
                  )
                }
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethodValues.map((value) => (
                    <SelectItem key={value} value={value}>
                      {PAYMENT_METHOD_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountId">Kasa/Banka Hesabı</Label>
            <Select
              value={accountId}
              onValueChange={(value) => value && setValue("accountId", value)}
            >
              <SelectTrigger id="accountId">
                <SelectValue placeholder="Hesap seçin" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.accountId && (
              <p className="text-sm text-destructive">
                {errors.accountId.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Açıklama (opsiyonel)</Label>
            <Textarea id="description" rows={2} {...register("description")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Kaydediliyor..." : "Tahsilatı Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
