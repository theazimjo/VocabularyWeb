"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Folder, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Asosiy",
      href: "/dashboard",
      icon: Home,
    },
    {
      label: "Papkalar",
      href: "/dashboard/folders",
      icon: Folder,
    },
    {
      label: "Sozlamalar",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-white/5 px-6 pb-safe-area">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-all active:scale-95 py-1 min-w-[64px]",
                isActive ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-xl transition-colors",
                isActive ? "bg-emerald-500/10" : "bg-transparent"
              )}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
