"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

export function PaginationControls({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function goTo(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    router.push(`${pathname}?${params.toString()}`);
  }

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-end gap-2 pt-4">
      <span className="text-sm text-muted-foreground">
        Sayfa {page} / {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => goTo(page - 1)}
      >
        Önceki
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => goTo(page + 1)}
      >
        Sonraki
      </Button>
    </div>
  );
}
