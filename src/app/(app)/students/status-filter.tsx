"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STUDENT_STATUS_LABELS } from "@/lib/labels";
import { studentStatusValues } from "@/lib/validations/student";

const ALL_VALUE = "ALL";

export function StatusFilter({ value }: { value?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(next: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!next || next === ALL_VALUE) {
      params.delete("status");
    } else {
      params.set("status", next);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={value ?? ALL_VALUE} onValueChange={handleChange}>
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_VALUE}>Tüm Durumlar</SelectItem>
        {studentStatusValues.map((status) => (
          <SelectItem key={status} value={status}>
            {STUDENT_STATUS_LABELS[status]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
