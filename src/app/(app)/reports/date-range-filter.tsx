"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function startOfMonth(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function startOfYear(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
}

export function DateRangeFilter({ from, to }: { from: string; to: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function apply(nextFrom: string, nextTo: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", nextFrom);
    params.set("to", nextTo);
    router.push(`${pathname}?${params.toString()}`);
  }

  function setPreset(preset: "month" | "year") {
    const now = new Date();
    const start = preset === "month" ? startOfMonth(now) : startOfYear(now);
    apply(isoDate(start), isoDate(now));
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="from" className="text-xs text-muted-foreground">
          Başlangıç
        </Label>
        <Input
          id="from"
          type="date"
          defaultValue={from}
          onChange={(e) => apply(e.target.value, to)}
          className="w-40"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="to" className="text-xs text-muted-foreground">
          Bitiş
        </Label>
        <Input
          id="to"
          type="date"
          defaultValue={to}
          onChange={(e) => apply(from, e.target.value)}
          className="w-40"
        />
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setPreset("month")}
        >
          Bu Ay
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setPreset("year")}
        >
          Bu Yıl
        </Button>
      </div>
    </div>
  );
}
