"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TRANSACTION_TYPE_LABELS } from "@/lib/labels";
import { transactionTypeValues } from "@/lib/validations/transaction";

const ALL_VALUE = "ALL";

export function TransactionFilters({ value }: { value?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(next: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!next || next === ALL_VALUE) {
      params.delete("type");
    } else {
      params.set("type", next);
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
        <SelectItem value={ALL_VALUE}>Tümü</SelectItem>
        {transactionTypeValues.map((type) => (
          <SelectItem key={type} value={type}>
            {TRANSACTION_TYPE_LABELS[type]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
