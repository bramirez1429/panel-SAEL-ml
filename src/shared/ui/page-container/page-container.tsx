import type { ReactNode } from "react";

type PageContainerProps = Readonly<{
  children: ReactNode;
  className?: string;
}>;

export function PageContainer({ children, className }: PageContainerProps) {
  return <main className={className}>{children}</main>;
}
