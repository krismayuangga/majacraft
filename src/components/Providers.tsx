"use client";
import { SessionProvider } from "next-auth/react";
import { ModernDialogProvider } from "@/components/ui/modern-dialog";
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ModernDialogProvider>{children}</ModernDialogProvider>
    </SessionProvider>
  );
}
