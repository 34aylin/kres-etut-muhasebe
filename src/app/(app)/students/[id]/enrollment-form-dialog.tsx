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
import { PROGRAM_TYPE_LABELS, STUDENT_STATUS_LABELS } from "@/lib/labels";
import {
  enrollmentSchema,
  enrollmentStatusValues,
  programTypeValues,
  type EnrollmentFormValues,
} from "@/lib/validations/enrollment";
import { createEnrollment, updateEnrollment } from "../actions";

type EnrollmentFormDialogProps = {
  mode: "create" | "edit";
  studentId: string;
  enrollmentId?: string;
  defaultValues?: EnrollmentFormValues;
  trigger: React.ReactElement;
};

export function EnrollmentFormDialog({
  mode,
  studentId,
  enrollmentId,
  defaultValues,
  trigger,
}: EnrollmentFormDialogProps) {
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
  } = useForm<EnrollmentFormValues>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: defaultValues ?? {
      program: "KRES",
      startDate: "",
      endDate: "",
      status: "ACTIVE",
    },
  });

  const program = watch("program");
  const status = watch("status");

  function onSubmit(values: EnrollmentFormValues) {
    startTransition(async () => {
      try {
        if (mode === "create") {
          await createEnrollment(studentId, values);
          toast.success("Kayıt eklendi");
        } else if (enrollmentId) {
          await updateEnrollment(enrollmentId, studentId, values);
          toast.success("Kayıt güncellendi");
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
            {mode === "create" ? "Yeni Kayıt" : "Kaydı Düzenle"}
          </DialogTitle>
          <DialogDescription>
            Öğrencinin hangi programa, hangi tarihte kaydolduğunu belirtin.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="program">Program</Label>
            <Select
              value={program}
              onValueChange={(value) =>
                setValue("program", value as EnrollmentFormValues["program"])
              }
            >
              <SelectTrigger id="program">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {programTypeValues.map((value) => (
                  <SelectItem key={value} value={value}>
                    {PROGRAM_TYPE_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Başlangıç Tarihi</Label>
              <Input id="startDate" type="date" {...register("startDate")} />
              {errors.startDate && (
                <p className="text-sm text-destructive">
                  {errors.startDate.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Bitiş Tarihi (opsiyonel)</Label>
              <Input id="endDate" type="date" {...register("endDate")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Durum</Label>
            <Select
              value={status}
              onValueChange={(value) =>
                setValue("status", value as EnrollmentFormValues["status"])
              }
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {enrollmentStatusValues.map((value) => (
                  <SelectItem key={value} value={value}>
                    {STUDENT_STATUS_LABELS[value]}
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
