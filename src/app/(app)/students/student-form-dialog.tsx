"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { STUDENT_STATUS_LABELS } from "@/lib/labels";
import {
  studentSchema,
  studentStatusValues,
  type StudentFormValues,
} from "@/lib/validations/student";
import { createStudent, updateStudent } from "./actions";

type StudentFormDialogProps = {
  mode: "create" | "edit";
  studentId?: string;
  defaultValues?: StudentFormValues;
  availableParents?: { id: string; firstName: string; lastName: string }[];
  trigger: React.ReactElement;
};

export function StudentFormDialog({
  mode,
  studentId,
  defaultValues,
  availableParents = [],
  trigger,
}: StudentFormDialogProps) {
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
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: defaultValues ?? {
      firstName: "",
      lastName: "",
      birthDate: "",
      status: "ACTIVE",
      parentIds: [],
    },
  });

  const selectedParentIds = watch("parentIds");
  const status = watch("status");

  function toggleParent(parentId: string, checked: boolean) {
    const current = selectedParentIds ?? [];
    setValue(
      "parentIds",
      checked
        ? [...current, parentId]
        : current.filter((id) => id !== parentId),
    );
  }

  function onSubmit(values: StudentFormValues) {
    startTransition(async () => {
      try {
        if (mode === "create") {
          await createStudent(values);
          toast.success("Öğrenci eklendi");
        } else if (studentId) {
          await updateStudent(studentId, values);
          toast.success("Öğrenci güncellendi");
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
            {mode === "create" ? "Yeni Öğrenci" : "Öğrenciyi Düzenle"}
          </DialogTitle>
          <DialogDescription>Öğrenci bilgilerini girin.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Ad</Label>
              <Input id="firstName" {...register("firstName")} />
              {errors.firstName && (
                <p className="text-sm text-destructive">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Soyad</Label>
              <Input id="lastName" {...register("lastName")} />
              {errors.lastName && (
                <p className="text-sm text-destructive">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="birthDate">Doğum Tarihi</Label>
              <Input id="birthDate" type="date" {...register("birthDate")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Durum</Label>
              <Select
                value={status}
                onValueChange={(value) =>
                  setValue("status", value as StudentFormValues["status"])
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {studentStatusValues.map((value) => (
                    <SelectItem key={value} value={value}>
                      {STUDENT_STATUS_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {mode === "create" && (
            <div className="space-y-2">
              <Label>Veli(ler)</Label>
              {availableParents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Önce Veliler sayfasından bir veli ekleyin.
                </p>
              ) : (
                <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border p-2">
                  {availableParents.map((parent) => (
                    <label
                      key={parent.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Checkbox
                        checked={(selectedParentIds ?? []).includes(parent.id)}
                        onCheckedChange={(checked) =>
                          toggleParent(parent.id, checked === true)
                        }
                      />
                      {parent.firstName} {parent.lastName}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

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
