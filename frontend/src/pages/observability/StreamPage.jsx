import { useEffect, useState } from "react";
import { DashboardLayout, LiveLogStream } from "@/components/observability";
import { fetchRecentLogs, fetchLogsSince } from "@/api/api";

export default function StreamPage() {
  const [logs, setLogs]   = useState([]);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    fetchRecentLogs(150).then(setLogs).catch(() => {});
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      const last = logs[logs.length - 1];
      const sinceIso = last ? last.ts : new Date(Date.now() - 5000).toISOString();
      fetchLogsSince(sinceIso, 100)
        .then((newLogs) => {
          if (!newLogs || newLogs.length === 0) return;
          setLogs((prev) => [...prev, ...newLogs].slice(-500));
        })
        .catch(() => {});
    }, 1000);
    return () => clearInterval(id);
  }, [paused, logs]);

  return (
    <DashboardLayout title="Live Stream" subtitle="Tailing all services">
      <div className="p-6 max-w-[1800px] mx-auto">
        <LiveLogStream
          logs={logs}
          height={720}
          paused={paused}
          onTogglePause={() => setPaused((p) => !p)}
          onClear={() => setLogs([])}
        />
      </div>
    </DashboardLayout>
  );
}
