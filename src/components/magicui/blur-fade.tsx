import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface BlurFadeProps {
  children: React.ReactNode;
  className?: string;
  variant?: {
    hidden: { y: number; opacity: number; filter: string };
    visible: { y: number; opacity: number; filter: string };
  };
  duration?: number;
  delay?: number;
  yOffset?: number;
  blur?: string;
}

export function BlurFade({
  children,
  className,
  variant,
  duration = 0.4,
  delay = 0,
  yOffset = 6,
  blur = "6px",
}: BlurFadeProps) {
  const ref = useRef<HTMLDivElement>(null);

  const defaultVariants = {
    hidden: { y: yOffset, opacity: 0, filter: `blur(${blur})` },
    visible: { y: -yOffset, opacity: 1, filter: `blur(0px)` },
  };

  const combinedVariants = variant || defaultVariants;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Apply initial hidden state
    Object.assign(element.style, {
      transform: `translateY(${combinedVariants.hidden.y}px)`,
      opacity: combinedVariants.hidden.opacity.toString(),
      filter: combinedVariants.hidden.filter,
      transition: `all ${duration}s ease-out ${delay}s`,
    });

    // Trigger animation after a brief delay
    const timer = setTimeout(() => {
      Object.assign(element.style, {
        transform: `translateY(${combinedVariants.visible.y}px)`,
        opacity: combinedVariants.visible.opacity.toString(),
        filter: combinedVariants.visible.filter,
      });
    }, 50);

    return () => clearTimeout(timer);
  }, [combinedVariants, duration, delay]);

  return (
    <div ref={ref} className={cn("", className)}>
      {children}
    </div>
  );
}
