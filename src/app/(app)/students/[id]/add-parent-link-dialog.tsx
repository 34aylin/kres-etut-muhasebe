"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { addParentLink } from "../actions";

type AddParentLinkDialogProps = {
  studentId: string;
  availableParents: { id: string; firstName: string; lastName: string }[];
  trigger: React.ReactElement;
};

export function AddParentLinkDialog({
  studentId,
  availableParents,
  trigger,
}: AddParentLinkDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [parentId, setParentId] = useState<string>("");
  const [relation, setRelation] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!parentId) {
      toast.error("Bir veli seçin");
      return;
    }
    startTransition(async () => {
      try {
        await addParentLink(studentId, parentId, relation);
        toast.success("Veli bağlandı");
        setOpen(false);
        setParentId("");
        setRelation("");
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
          <DialogTitle>Veli Bağla</DialogTitle>
          <DialogDescription>
            Bu öğrenciye bağlı olan (veya kardeş desteği için) bir veli seçin.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="parent">Veli</Label>
            {availableParents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Bağlanabilecek başka veli yok. Önce Veliler sayfasından ekleyin.
              </p>
            ) : (
              <Select
                value={parentId}
                onValueChange={(value) => setParentId(value ?? "")}
              >
                <SelectTrigger id="parent">
                  <SelectValue placeholder="Veli seçin" />
                </SelectTrigger>
                <SelectContent>
                  {availableParents.map((parent) => (
                    <SelectItem key={parent.id} value={parent.id}>
                      {parent.firstName} {parent.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="relation">Yakınlık (opsiyonel)</Label>
            <Input
              id="relation"
              placeholder="anne, baba, vasi..."
              value={relation}
              onChange={(event) => setRelation(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={isPending || availableParents.length === 0}
            >
              {isPending ? "Kaydediliyor..." : "Bağla"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
