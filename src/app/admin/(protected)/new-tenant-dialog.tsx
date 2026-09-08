"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus } from "lucide-react";

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
import { TENANT_TYPE_LABELS } from "@/lib/tenant-type";
import {
  createTenantSchema,
  tenantTypeValues,
  type CreateTenantFormValues,
} from "@/lib/validations/tenant";
import { createTenant } from "../actions";

export function NewTenantDialog() {
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
  } = useForm<CreateTenantFormValues>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      name: "",
      slug: "",
      type: "KRES",
      adminName: "",
      adminEmail: "",
      adminPassword: "",
    },
  });

  const type = watch("type");

  function onSubmit(values: CreateTenantFormValues) {
    startTransition(async () => {
      try {
        await createTenant(values);
        toast.success("Şube oluşturuldu");
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
      <DialogTrigger
        render={
          <Button size="sm">
            <Plus className="size-4" />
            Yeni Şube Oluştur
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni Şube Oluştur</DialogTitle>
          <DialogDescription>
            Şube türünü ve ilk yönetici hesabını belirleyin. Yönetici bu
            bilgilerle giriş yapabilecektir.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="type">Uygulama Türü</Label>
            <Select
              value={type}
              onValueChange={(value) =>
                setValue("type", value as CreateTenantFormValues["type"])
              }
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tenantTypeValues.map((value) => (
                  <SelectItem key={value} value={value}>
                    {TENANT_TYPE_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Şube Adı</Label>
              <Input id="name" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Şube Kodu (slug)</Label>
              <Input id="slug" placeholder="ornek-sube" {...register("slug")} />
              {errors.slug && (
                <p className="text-sm text-destructive">
                  {errors.slug.message}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="adminName">Yönetici Adı</Label>
            <Input id="adminName" {...register("adminName")} />
            {errors.adminName && (
              <p className="text-sm text-destructive">
                {errors.adminName.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Yönetici E-postası</Label>
              <Input
                id="adminEmail"
                type="email"
                {...register("adminEmail")}
              />
              {errors.adminEmail && (
                <p className="text-sm text-destructive">
                  {errors.adminEmail.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminPassword">Yönetici Şifresi</Label>
              <Input
                id="adminPassword"
                type="password"
                {...register("adminPassword")}
              />
              {errors.adminPassword && (
                <p className="text-sm text-destructive">
                  {errors.adminPassword.message}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Oluşturuluyor..." : "Şube Oluştur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
