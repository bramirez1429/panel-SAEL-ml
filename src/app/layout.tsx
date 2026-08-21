import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AntdRegistry } from "@ant-design/nextjs-registry";

import { AntDesignThemeProvider } from "@/providers/ant-design-theme-provider.client";

import "./globals.css";

export const metadata: Metadata = {
  title: "Panel",
  description: "Panel de gestión",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es">
      <body>
        <AntdRegistry>
          <AntDesignThemeProvider>{children}</AntDesignThemeProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
