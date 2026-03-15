import React from "react";
import { getPayload } from "payload";
import configPromise from "@/payload.config";
import { Activity, CheckCircle, XCircle, Clock, ExternalLink, Play } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import "./Widgets.scss";

export const JobsWidget: React.FC = async () => {
  const payload = await getPayload({ config: configPromise });

  // Fetch recent jobs
  const recentJobs = await payload.find({
    collection: "payload-jobs" as any,
    sort: "-createdAt",
    limit: 5,
  });

  // Fetch counts for summary
  const [failedJobs, pendingJobs] = await Promise.all([
    payload.find({
      collection: "payload-jobs" as any,
      where: {
        hasError: { equals: true },
      },
      limit: 0,
    }),
    payload.find({
      collection: "payload-jobs" as any,
      where: {
        and: [{ completedAt: { exists: false } }, { hasError: { equals: false } }],
      },
      limit: 0,
    }),
  ]);

  return (
    <div className="dashboard-widget">
      <div className="dashboard-widget__header">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Activity size={20} color="var(--theme-primary-500)" />
          <h3 className="dashboard-widget__title" style={{ margin: 0 }}>
            Background Jobs
          </h3>
        </div>
        <Link href="/admin/collections/payload-jobs" className="dashboard-widget__link">
          View All <ExternalLink size={12} />
        </Link>
      </div>

      <div className="dashboard-widget__content">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              padding: "12px",
              background: "var(--theme-elevation-100)",
              borderRadius: "8px",
              border: "1px solid var(--theme-elevation-150)",
            }}
          >
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--theme-elevation-500)",
                marginBottom: "4px",
              }}
            >
              Pending
            </div>
            <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>{pendingJobs.totalDocs}</div>
          </div>
          <div
            style={{
              padding: "12px",
              background: "var(--theme-elevation-100)",
              borderRadius: "8px",
              border: "1px solid var(--theme-elevation-150)",
            }}
          >
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--theme-elevation-500)",
                marginBottom: "4px",
              }}
            >
              Failed (Total)
            </div>
            <div
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: failedJobs.totalDocs > 0 ? "#ef4444" : "inherit",
              }}
            >
              {failedJobs.totalDocs}
            </div>
          </div>
        </div>

        <h4
          style={{
            fontSize: "0.8rem",
            textTransform: "uppercase",
            color: "var(--theme-elevation-400)",
            marginBottom: "12px",
            letterSpacing: "0.05em",
          }}
        >
          Recent Activity
        </h4>

        {recentJobs.docs.length === 0 ? (
          <div className="dashboard-widget__empty">No jobs recorded yet</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {recentJobs.docs.map((job: any) => {
              const status = job.hasError ? "failed" : job.completedAt ? "succeeded" : "pending";

              return (
                <div
                  key={job.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px",
                    background: "var(--theme-elevation-50 white)",
                    border: "1px solid var(--theme-elevation-100)",
                    borderRadius: "6px",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background:
                        status === "succeeded"
                          ? "rgba(16, 185, 129, 0.1)"
                          : status === "failed"
                            ? "rgba(239, 68, 68, 0.1)"
                            : "rgba(59, 130, 246, 0.1)",
                    }}
                  >
                    {status === "succeeded" ? (
                      <CheckCircle size={16} color="#10b981" />
                    ) : status === "failed" ? (
                      <XCircle size={16} color="#ef4444" />
                    ) : (
                      <Clock size={16} color="#3b82f6" />
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                      {job.taskSlug || "Unknown Task"}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--theme-elevation-500)" }}>
                      ID: {job.id.substring(0, 8)}... •{" "}
                      {format(new Date(job.createdAt), "MMM d, HH:mm")}
                    </div>
                  </div>

                  {job.totalTried > 0 && (
                    <div
                      style={{
                        fontSize: "0.7rem",
                        background: "var(--theme-elevation-150)",
                        padding: "2px 6px",
                        borderRadius: "4px",
                      }}
                    >
                      Trials: {job.totalTried}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div
          style={{
            marginTop: "20px",
            padding: "12px",
            background: "rgba(59, 130, 246, 0.05)",
            border: "1px solid rgba(59, 130, 246, 0.1)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "start",
            gap: "10px",
          }}
        >
          <Play size={14} color="#3b82f6" style={{ marginTop: "2px" }} />
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#3b82f6" }}>
              Local Development Tool
            </div>
            <div
              style={{ fontSize: "0.7rem", color: "var(--theme-elevation-600)", marginTop: "2px" }}
            >
              Run <code>pnpm jobs:trigger</code> in your terminal to manually trigger the queue
              runner in local development.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
