import DashboardHeader from "@/components/dashboard-header";

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-emerald-500/20 selection:text-emerald-200">
      <DashboardHeader />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
