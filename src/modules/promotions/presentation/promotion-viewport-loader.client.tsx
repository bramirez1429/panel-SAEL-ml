"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Props = Readonly<{
  itemId: string;
  onVisible: () => void;
  children: ReactNode;
}>;

export function PromotionViewportLoader({ itemId, onVisible, children }: Props) {
  const elementRef = useRef<HTMLDivElement>(null);
  const onVisibleRef = useRef(onVisible);

  useEffect(() => {
    onVisibleRef.current = onVisible;
  }, [onVisible]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    if (typeof IntersectionObserver === "undefined") {
      onVisibleRef.current();
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      onVisibleRef.current();
    }, { rootMargin: "200px 0px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, [itemId]);

  return <div ref={elementRef} data-promotion-publication={itemId}>{children}</div>;
}
