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
import { parentSchema, type ParentFormValues } from "@/lib/validations/parent";
import { createParent, updateParent } from "./actions";

type ParentFormDialogProps = {
  mode: "create" | "edit";
  parentId?: string;
  defaultValues?: ParentFormValues;
  trigger: React.ReactElement;
};

export function ParentFormDialog({
  mode,
  parentId,
  defaultValues,
  trigger,
}: ParentFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ParentFormValues>({
    resolver: zodResolver(parentSchema),
    defaultValues: defaultValues ?? {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      nationalId: "",
    },
  });

  function onSubmit(values: ParentFormValues) {
    startTransition(async () => {
      try {
        if (mode === "create") {
          await createParent(values);
          toast.success("Veli eklendi");
        } else if (parentId) {
          await updateParent(parentId, values);
          toast.success("Veli güncellendi");
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
            {mode === "create" ? "Yeni Veli" : "Veliyi Düzenle"}
          </DialogTitle>
          <DialogDescription>
            Veli iletişim bilgilerini girin.
          </DialogDescription>
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
          <div className="space-y-2">
            <Label htmlFor="phone">Telefon</Label>
            <Input
              id="phone"
              placeholder="0555 000 00 00"
              {...register("phone")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-posta</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="nationalId">TC Kimlik No</Label>
            <Input id="nationalId" maxLength={11} {...register("nationalId")} />
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
