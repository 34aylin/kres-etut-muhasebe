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
import { CATEGORY_TYPE_LABELS } from "@/lib/labels";
import {
  categorySchema,
  categoryTypeValues,
  type CategoryFormValues,
} from "@/lib/validations/category";
import { createCategory, updateCategory } from "./actions";

type CategoryFormDialogProps = {
  mode: "create" | "edit";
  categoryId?: string;
  defaultValues?: CategoryFormValues;
  trigger: React.ReactElement;
};

export function CategoryFormDialog({
  mode,
  categoryId,
  defaultValues,
  trigger,
}: CategoryFormDialogProps) {
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
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: defaultValues ?? { name: "", type: "INCOME" },
  });

  const type = watch("type");

  function onSubmit(values: CategoryFormValues) {
    startTransition(async () => {
      try {
        if (mode === "create") {
          await createCategory(values);
          toast.success("Kategori eklendi");
        } else if (categoryId) {
          await updateCategory(categoryId, values);
          toast.success("Kategori güncellendi");
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
            {mode === "create" ? "Yeni Kategori" : "Kategoriyi Düzenle"}
          </DialogTitle>
          <DialogDescription>
            Gelir veya gider alt kategorisi tanımlayın.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="name">Kategori Adı</Label>
            <Input
              id="name"
              placeholder="örn. Aidat Geliri"
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
                value && setValue("type", value as CategoryFormValues["type"])
              }
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryTypeValues.map((value) => (
                  <SelectItem key={value} value={value}>
                    {CATEGORY_TYPE_LABELS[value]}
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
