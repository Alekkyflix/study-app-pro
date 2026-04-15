import { BarChart3, Clock, BookOpen, Target, TrendingUp, Loader } from "lucide-react";
import { useState, useEffect } from "react";
import { apiClient } from "../services/api";

interface LectureStat {
  id: string;
  title: string;
  duration: number;
  has_transcript: boolean;
  has_summary: boolean;
  created_at: string | null;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
}

export function Analytics() {
  const [lectures, setLectures] = useState<LectureStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month">("week");

  useEffect(() => {
    setLoading(true);
    apiClient
      .getLectures()
      .then((res) => {
        if (res?.success) {
          setLectures(res.lectures || []);
        } else {
          setError("Could not load analytics data.");
        }
      })
      .catch(() => setError("Failed to connect to the server."))
      .finally(() => setLoading(false));
  }, []);

  // --- Derived stats from real lecture data ---
  const now = new Date();
  const filtered = lectures.filter((l) => {
    if (!l.created_at) return false;
    const d = new Date(l.created_at);
    const diffMs = now.getTime() - d.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (timeRange === "day") return diffDays <= 1;
    if (timeRange === "week") return diffDays <= 7;
    return diffDays <= 30;
  });

  const totalSeconds = filtered.reduce((sum, l) => sum + (l.duration || 0), 0);
  const totalLectures = filtered.length;
  const withTranscript = filtered.filter((l) => l.has_transcript).length;
  const withSummary = filtered.filter((l) => l.has_summary).length;
  const coveragePercent =
    totalLectures > 0 ? Math.round((withTranscript / totalLectures) * 100) : 0;

  // Streak: consecutive days with at least one lecture (looking back from today)
  const datesWithLectures = new Set(
    lectures
      .filter((l) => l.created_at)
      .map((l) => new Date(l.created_at!).toDateString())
  );
  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    if (datesWithLectures.has(d.toDateString())) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  // Last-7-days bar chart
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const label = getDayLabel(d.toDateString());
    const count = lectures.filter(
      (l) => l.created_at && new Date(l.created_at).toDateString() === d.toDateString()
    ).length;
    return { label, count };
  });
  const maxCount = Math.max(...last7.map((d) => d.count), 1);

  // AI coverage breakdown
  const aiBreakdown = [
    {
      name: "Transcribed",
      value: withTranscript,
      total: totalLectures,
      color: "bg-blue-500",
    },
    {
      name: "Summarized",
      value: withSummary,
      total: totalLectures,
      color: "bg-purple-500",
    },
    {
      name: "Pending",
      value: totalLectures - withTranscript,
      total: totalLectures,
      color: "bg-gray-300",
    },
  ];

  const metrics = [
    {
      label: "Total Study Time",
      value: totalSeconds > 0 ? formatDuration(totalSeconds) : "—",
      sub: timeRange === "day" ? "today" : timeRange === "week" ? "this week" : "this month",
      icon: Clock,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Lectures Recorded",
      value: String(totalLectures),
      sub: "in period",
      icon: BookOpen,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "AI Coverage",
      value: `${coveragePercent}%`,
      sub: "transcribed",
      icon: Target,
      color: "bg-purple-50 text-purple-600",
    },
    {
      label: "Learning Streak",
      value: `${streak}`,
      sub: streak === 1 ? "day" : "days",
      icon: TrendingUp,
      color: "bg-orange-50 text-orange-600",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 animate-spin text-gray-400" />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
            Loading Analytics
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa] p-6">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-semibold">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold tracking-tighter text-gray-900 mb-1">
            Analytics
          </h1>
          <p className="text-gray-500 font-medium">Your real study progress</p>
        </div>

        {/* Time Range Filter */}
        <div className="flex gap-2 mb-8">
          {(["day", "week", "month"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition capitalize ${
                timeRange === range
                  ? "bg-gray-900 text-white shadow-md"
                  : "bg-white text-gray-500 border border-gray-100 hover:border-gray-200"
              }`}
            >
              {range}
            </button>
          ))}
        </div>

        {/* No data state */}
        {totalLectures === 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center mb-8">
            <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-semibold">
              No lectures recorded in this period.
            </p>
            <p className="text-gray-300 text-sm mt-1">
              Record a lecture to see your analytics.
            </p>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((metric, i) => {
            const Icon = metric.icon;
            return (
              <div
                key={i}
                className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm"
              >
                <div className={`${metric.color} p-3 rounded-2xl w-fit mb-4`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-1">
                  {metric.label}
                </p>
                <p className="text-2xl font-extrabold tracking-tighter text-gray-900">
                  {metric.value}
                  <span className="text-sm font-semibold text-gray-400 ml-1">
                    {metric.sub}
                  </span>
                </p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity Chart — Last 7 Days */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-base font-extrabold tracking-tighter text-gray-900 mb-6">
              Lectures — Last 7 Days
            </h2>
            <div className="flex items-end justify-between h-48 gap-2">
              {last7.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t-xl bg-gray-900 transition-all duration-500"
                    style={{
                      height: `${Math.max((day.count / maxCount) * 160, day.count > 0 ? 12 : 4)}px`,
                      opacity: day.count > 0 ? 1 : 0.08,
                    }}
                  />
                  <p className="text-[10px] font-bold text-gray-400">{day.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Coverage Breakdown */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-base font-extrabold tracking-tighter text-gray-900 mb-6">
              AI Processing Coverage
            </h2>
            {totalLectures === 0 ? (
              <p className="text-sm text-gray-400 font-semibold mt-8 text-center">
                No data available
              </p>
            ) : (
              <div className="space-y-5">
                {aiBreakdown.map((item, i) => {
                  const pct =
                    item.total > 0 ? Math.round((item.value / item.total) * 100) : 0;
                  return (
                    <div key={i}>
                      <div className="flex justify-between mb-2">
                        <p className="text-sm font-bold text-gray-700">{item.name}</p>
                        <p className="text-sm font-black text-gray-900">
                          {item.value}
                          <span className="text-gray-400 font-semibold">
                            /{item.total}
                          </span>
                        </p>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-700 ${item.color}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Lectures Table */}
        {lectures.length > 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm mt-6">
            <h2 className="text-base font-extrabold tracking-tighter text-gray-900 mb-4">
              Recent Lectures
            </h2>
            <div className="space-y-2">
              {lectures.slice(0, 5).map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{l.title}</p>
                    <p className="text-[11px] text-gray-400 font-semibold">
                      {l.created_at
                        ? new Date(l.created_at).toLocaleDateString()
                        : "Unknown date"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {l.has_transcript && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-lg tracking-wider">
                        Transcript
                      </span>
                    )}
                    {l.has_summary && (
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[10px] font-black uppercase rounded-lg tracking-wider">
                        Summary
                      </span>
                    )}
                    {l.duration > 0 && (
                      <span className="text-xs font-bold text-gray-400">
                        {formatDuration(l.duration)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
