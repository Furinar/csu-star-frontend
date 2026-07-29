"use client";

import type { ReactNode } from "react";
import { ConfigProvider } from "tdesign-react";
import zhCN from "tdesign-react/es/locale/zh_CN";
// React 19 render adapter required by tdesign-react
import "tdesign-react/es/_util/react-19-adapter";

export default function TDesignProvider({ children }: { children: ReactNode }) {
  return <ConfigProvider globalConfig={zhCN}>{children}</ConfigProvider>;
}
