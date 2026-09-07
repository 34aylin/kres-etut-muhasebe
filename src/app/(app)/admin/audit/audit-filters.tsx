"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL_VALUE = "ALL";

const ACTIONS = ["CREATE", "UPDATE", "DELETE", "LOGIN"] as const;
const ENTITY_TYPES = [
  "Parent",
  "Student",
  "Transaction",
  "Charge",
  "FeePlan",
  "User",
] as const;

export function AuditFilters({
  action,
  entityType,
}: {
  action?: string;
  entityType?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === ALL_VALUE) params.delete(key);
    else params.set(key, value);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Select
        value={action ?? ALL_VALUE}
        onValueChange={(v) => update("action", v)}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Aksiyon" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>Tüm Aksiyonlar</SelectItem>
          {ACTIONS.map((a) => (
            <SelectItem key={a} value={a}>
              {a}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={entityType ?? ALL_VALUE}
        onValueChange={(v) => update("entityType", v)}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Varlık Türü" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>Tüm Varlıklar</SelectItem>
          {ENTITY_TYPES.map((t) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
