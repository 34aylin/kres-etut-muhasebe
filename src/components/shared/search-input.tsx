"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";

export function SearchInput({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("q", value);
      } else {
        params.delete("q");
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    }, 300);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <Input
      value={value}
      onChange={(event) => setValue(event.target.value)}
      placeholder={placeholder}
      className="max-w-xs"
    />
  );
}
