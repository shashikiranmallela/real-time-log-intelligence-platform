import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");

  const handleSearch = (val) => {
    setSearchValue(val);
    // Navigate to search page with query pre-filled after short debounce
    if (val.trim().length > 0) {
      navigate(`/obs/search?q=${encodeURIComponent(val.trim())}`);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden text-foreground">
      <Sidebar badges={sidebarBadges} llm={llm} user={user} />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          title={title}
          subtitle={subtitle}
          systemStatus={systemStatus}
          hasAlerts={hasAlerts}
          searchValue={searchValue}
          onSearchChange={handleSearch}
          onBellClick={() => navigate("/obs/alerts")}
        />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
