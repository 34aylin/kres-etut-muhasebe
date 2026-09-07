"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type DeleteConfirmButtonProps = {
  title: string;
  description: string;
  onConfirm: () => Promise<void>;
  trigger: React.ReactElement;
};

export function DeleteConfirmButton({
  title,
  description,
  onConfirm,
  trigger,
}: DeleteConfirmButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      try {
        await onConfirm();
        toast.success("Silindi");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Silinemedi");
      }
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={trigger} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Vazgeç</AlertDialogCancel>
          <AlertDialogAction disabled={isPending} onClick={handleConfirm}>
            {isPending ? "Siliniyor..." : "Sil"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
