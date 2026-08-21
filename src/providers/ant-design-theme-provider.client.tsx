"use client";

import type { ReactNode } from "react";
import { ConfigProvider } from "antd";

import { antDesignTheme } from "@/shared/config/ant-design-theme";

type AntDesignThemeProviderProps = Readonly<{
  children: ReactNode;
}>;

export function AntDesignThemeProvider({
  children,
}: AntDesignThemeProviderProps) {
  return <ConfigProvider theme={antDesignTheme}>{children}</ConfigProvider>;
}
