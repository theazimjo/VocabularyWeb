import DashboardHeader from "@/components/dashboard-header";
import BottomNav from "@/components/bottom-nav";

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-emerald-500/20 selection:text-emerald-200">
      <DashboardHeader />
      <main className="flex-1 pb-20 sm:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
