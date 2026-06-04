import { useEffect, useState } from "react";
import { DashboardLayout, IncidentCenter } from "@/components/observability";
import { fetchIncidents } from "@/api/api";

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    fetchIncidents().then(setIncidents).catch(() => {});
  }, []);

  return (
    <DashboardLayout title="Incidents" subtitle="Active incident management">
      <div className="p-6 max-w-[1800px] mx-auto">
        <IncidentCenter incidents={incidents} />
      </div>
    </DashboardLayout>
  );
}
