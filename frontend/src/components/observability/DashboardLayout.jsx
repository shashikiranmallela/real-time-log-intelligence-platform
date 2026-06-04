import { Sidebar } from "./Sidebar.jsx";
import { TopBar } from "./TopBar.jsx";

/**
 * DashboardLayout
 * Props:
 *  - title, subtitle         → TopBar
 *  - sidebarBadges, llm, user → Sidebar
 *  - systemStatus, hasAlerts → TopBar
 *  - children
 */
export function DashboardLayout({
  title,
  subtitle,
  children,
  sidebarBadges,
  llm,
  user,
  systemStatus,
  hasAlerts,
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden text-foreground">
      <Sidebar badges={sidebarBadges} llm={llm} user={user} />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          title={title}
          subtitle={subtitle}
          systemStatus={systemStatus}
          hasAlerts={hasAlerts}
        />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
