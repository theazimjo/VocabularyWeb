import DashboardHeader from "@/components/dashboard-header";
import BottomNav from "@/components/bottom-nav";
import NavVisibilityWrapper from "@/components/NavVisibilityWrapper";

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-emerald-500/20 selection:text-emerald-200">
      <NavVisibilityWrapper>
        <DashboardHeader />
      </NavVisibilityWrapper>
      <NavVisibilityWrapper type="padding">
        {children}
      </NavVisibilityWrapper>
      <NavVisibilityWrapper>
        <BottomNav />
      </NavVisibilityWrapper>
    </div>
  );
}
