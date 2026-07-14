import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  withRing?: boolean;
  textClassName?: string;
  className?: string;
}

export function BrandMark({
  withRing = false,
  textClassName = "text-white",
  className,
}: BrandMarkProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative flex h-11 w-11 items-center justify-center">
        <Image
          src="/logo.png"
          alt="Confluxaa"
          width={44}
          height={44}
          unoptimized
          priority
          className="h-11 w-11 rounded-xl object-contain"
        />
        {withRing && (
          <span className="absolute -inset-1 animate-spin-slow rounded-xl border border-white/15 border-t-violet-300/70" />
        )}
      </span>
      <span
        className={cn("text-lg font-semibold tracking-tight", textClassName)}
      >
        Confluxaa
      </span>
    </span>
  );
}
