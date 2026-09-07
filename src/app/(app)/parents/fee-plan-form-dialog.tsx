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
import {
  feePlanSchema,
  type FeePlanFormValues,
} from "@/lib/validations/fee-plan";
import { createFeePlan } from "./finance-actions";

type Option = { id: string; label: string };

const NONE_VALUE = "__none__";

type FeePlanFormDialogProps = {
  parentId: string;
  students: Option[];
  incomeCategories: Option[];
  trigger: React.ReactElement;
};

export function FeePlanFormDialog({
  parentId,
  students,
  incomeCategories,
  trigger,
}: FeePlanFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FeePlanFormValues>({
    resolver: zodResolver(feePlanSchema),
    defaultValues: {
      name: "",
      parentId,
      categoryId: "",
      installmentAmount: 0,
      installmentCount: 1,
      startDate: new Date().toISOString().slice(0, 10),
    },
  });

  const categoryId = watch("categoryId");

  function onSubmit(values: FeePlanFormValues) {
    if (!studentId) {
      toast.error("Bir öğrenci seçin");
      return;
    }
    startTransition(async () => {
      try {
        await createFeePlan(studentId, values);
        toast.success("Ücret planı oluşturuldu ve taksitler eklendi");
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
          <DialogTitle>Yeni Ücret Planı</DialogTitle>
          <DialogDescription>
            Taksitli/tekrarlayan bir ücret planı tanımlayın (örn. aylık aidat).
            Belirtilen taksit sayısı kadar borç kaydı otomatik oluşturulur.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <input type="hidden" {...register("parentId")} />
          <div className="space-y-2">
            <Label htmlFor="studentId">Öğrenci</Label>
            {students.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Bu veliye bağlı öğrenci yok. Önce Öğrenciler sayfasından
                bağlayın.
              </p>
            ) : (
              <Select
                value={studentId}
                onValueChange={(value) => value && setStudentId(value)}
              >
                <SelectTrigger id="studentId">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Plan Adı</Label>
            <Input
              id="name"
              placeholder="örn. 2026-2027 Aylık Aidat"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoryId">Gelir Kategorisi</Label>
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
                {incomeCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="installmentAmount">Taksit Tutarı (₺)</Label>
              <Input
                id="installmentAmount"
                type="number"
                step="0.01"
                min="0"
                {...register("installmentAmount", { valueAsNumber: true })}
              />
              {errors.installmentAmount && (
                <p className="text-sm text-destructive">
                  {errors.installmentAmount.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="installmentCount">Taksit Sayısı</Label>
              <Input
                id="installmentCount"
                type="number"
                step="1"
                min="1"
                max="36"
                {...register("installmentCount", { valueAsNumber: true })}
              />
              {errors.installmentCount && (
                <p className="text-sm text-destructive">
                  {errors.installmentCount.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">İlk Taksit Tarihi</Label>
            <Input id="startDate" type="date" {...register("startDate")} />
            {errors.startDate && (
              <p className="text-sm text-destructive">
                {errors.startDate.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending || students.length === 0}>
              {isPending ? "Oluşturuluyor..." : "Planı Oluştur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
