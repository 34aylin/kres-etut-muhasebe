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
import { PAYMENT_METHOD_LABELS, TRANSACTION_TYPE_LABELS } from "@/lib/labels";
import {
  paymentMethodValues,
  transactionSchema,
  transactionTypeValues,
  type TransactionFormValues,
} from "@/lib/validations/transaction";
import { createTransaction, updateTransaction } from "./actions";

type Option = { id: string; label: string };

type TransactionFormDialogProps = {
  mode: "create" | "edit";
  transactionId?: string;
  defaultValues?: TransactionFormValues;
  accounts: Option[];
  categories: { id: string; name: string; type: "INCOME" | "EXPENSE" }[];
  students: Option[];
  parents: Option[];
  trigger: React.ReactElement;
};

const NONE_VALUE = "__none__";

export function TransactionFormDialog({
  mode,
  transactionId,
  defaultValues,
  accounts,
  categories,
  students,
  parents,
  trigger,
}: TransactionFormDialogProps) {
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
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: defaultValues ?? {
      type: "INCOME",
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      accountId: "",
      categoryId: "",
      studentId: "",
      parentId: "",
      paymentMethod: "CASH",
      description: "",
    },
  });

  const type = watch("type");
  const accountId = watch("accountId");
  const categoryId = watch("categoryId");
  const studentId = watch("studentId");
  const parentId = watch("parentId");
  const paymentMethod = watch("paymentMethod");

  const filteredCategories = categories.filter(
    (category) => category.type === type,
  );

  function onSubmit(values: TransactionFormValues) {
    startTransition(async () => {
      try {
        if (mode === "create") {
          await createTransaction(values);
          toast.success("Hareket eklendi");
        } else if (transactionId) {
          await updateTransaction(transactionId, values);
          toast.success("Hareket güncellendi");
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
            {mode === "create" ? "Yeni Hareket" : "Hareketi Düzenle"}
          </DialogTitle>
          <DialogDescription>
            Gelir veya gider hareketi girin.
          </DialogDescription>
        </DialogHeader>
        <form
          className="max-h-[70vh] space-y-4 overflow-y-auto pr-1"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tür</Label>
              <Select
                value={type}
                onValueChange={(value) => {
                  if (!value) return;
                  setValue("type", value as TransactionFormValues["type"]);
                  setValue("categoryId", "");
                }}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {transactionTypeValues.map((value) => (
                    <SelectItem key={value} value={value}>
                      {TRANSACTION_TYPE_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Tarih</Label>
              <Input id="date" type="date" {...register("date")} />
              {errors.date && (
                <p className="text-sm text-destructive">
                  {errors.date.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Ödeme Yöntemi</Label>
              <Select
                value={paymentMethod}
                onValueChange={(value) =>
                  value &&
                  setValue(
                    "paymentMethod",
                    value as TransactionFormValues["paymentMethod"],
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

          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="categoryId">Kategori</Label>
              <Select
                value={categoryId || NONE_VALUE}
                onValueChange={(value) =>
                  setValue(
                    "categoryId",
                    value === NONE_VALUE ? "" : (value ?? ""),
                  )
                }
              >
                <SelectTrigger id="categoryId">
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>—</SelectItem>
                  {filteredCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="studentId">Öğrenci (opsiyonel)</Label>
              <Select
                value={studentId || NONE_VALUE}
                onValueChange={(value) =>
                  setValue(
                    "studentId",
                    value === NONE_VALUE ? "" : (value ?? ""),
                  )
                }
              >
                <SelectTrigger id="studentId">
                  <SelectValue placeholder="Öğrenci seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>—</SelectItem>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="parentId">Veli (opsiyonel)</Label>
              <Select
                value={parentId || NONE_VALUE}
                onValueChange={(value) =>
                  setValue(
                    "parentId",
                    value === NONE_VALUE ? "" : (value ?? ""),
                  )
                }
              >
                <SelectTrigger id="parentId">
                  <SelectValue placeholder="Veli seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>—</SelectItem>
                  {parents.map((parent) => (
                    <SelectItem key={parent.id} value={parent.id}>
                      {parent.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea id="description" rows={2} {...register("description")} />
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
