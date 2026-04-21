import { Download, FileText, TrendingUp, Calendar, Loader, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../services/api";
import { ChatPanel } from "../components/ChatPanel";
import { useNotification } from "../context/NotificationContext";
import { EmptyState, InlineLoader, LectureSkeleton } from "../components/notifications";

interface Report {
  id: string;
  title: string;
  type: "summary" | "analysis" | "questions";
  date: string;
  status: "ready" | "generating";
}

export function Reports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [chatReport, setChatReport] = useState<{id: string, title: string} | null>(null);
  const { showError, showSuccess } = useNotification();

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getLectures();
      if (res.success) {
        const generatedReports = res.lectures
          .filter((l: any) => l.has_summary || l.has_transcript)
          .map((l: any) => ({
            id: l.id,
            // The replace cleans up the UI since we append "Report" inside the card if we want
            title: l.title,
            type: l.has_summary ? "summary" : "analysis",
            date: new Date(l.created_at).toLocaleDateString(),
            status: "ready",
          }));
        setReports(generatedReports);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const [selectorOpen, setSelectorOpen] = useState<{type: string, label: string} | null>(null);

  const handleGenerateReport = async (lectureId: string, summaryType: string) => {
    setSelectorOpen(null);
    setLoading(true);
    try {
      const res = await apiClient.summarizeLecture(lectureId, summaryType);
      if (res.success) {
        showSuccess("Report Generated", "Your new report is ready.");
        await fetchReports();
      } else {
        showError("Generation Failed", res.error || "Could not generate report.");
      }
    } catch (error) {
      showError("Generation Error", "Something went wrong while generating the report.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (reportId: string, title: string) => {
    setDownloadingId(reportId);
    try {
      const res = await apiClient.getLecture(reportId);
      if (res.success && res.lecture) {
        let summaryText = res.lecture.summary || "No summary";
        
        // Handle case where summary is structured JSON from the backend
        try {
          const parsed = JSON.parse(summaryText);
          if (typeof parsed === 'object' && parsed !== null) {
            summaryText = Object.entries(parsed)
              .map(([k, v]) => `=== ${k.toUpperCase()} ===\n${v}`)
              .join('\n\n');
          }
        } catch (e) {
          // It's a plain string, which is fine
        }

        const textContent = `REPORT: ${title}\n\n=== SUMMARY ===\n${summaryText}\n\n=== TRANSCRIPT ===\n${res.lecture.transcript || "No transcript"}`;
        const blob = new Blob([textContent], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${title.replace(/\s+/g, "_")}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        showError("Download Failed", "Report details not found.");
      }
    } catch (error) {
      console.error("Failed to download report:", error);
      showError("Download Failed", "Something went wrong while fetching the report.");
    } finally {
      setDownloadingId(null);
    }
  };

  const typeLabels = {
    summary: "Study Summary",
    analysis: "Deep Analysis",
    questions: "Practice Questions",
  };

  const typeColors = {
    summary: "bg-blue-100 text-blue-700",
    analysis: "bg-purple-100 text-purple-700",
    questions: "bg-green-100 text-green-700",
  };

  return (
    <div className="min-h-screen bg-[#fafafa] pb-24 md:pb-8 text-gray-900 tracking-tight">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gray-100 blur-3xl rounded-full opacity-50 -z-10 pointer-events-none"></div>
      <div className="max-w-4xl mx-auto px-4 py-12 z-10">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-3 tracking-tighter">Study Reports</h1>
          <p className="text-xl font-medium text-gray-500 tracking-tight">Generate comprehensive study materials from your lectures</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { type: "executive", icon: FileText, label: "Executive Summary", desc: "Brief overview" },
            { type: "detailed", icon: TrendingUp, label: "Analysis Report", desc: "Detailed insights" },
            { type: "questions", icon: Calendar, label: "Exam Questions", desc: "Practice questions" },
          ].map((action, i) => (
            <button
              key={i}
              onClick={() => setSelectorOpen({ type: action.type, label: action.label })}
              className="glass-card rounded-3xl p-8 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] text-left premium-shadow border border-gray-100"
            >
              <action.icon className="w-8 h-8 text-gray-900 mb-4" />
              <p className="font-bold tracking-tight text-gray-900 text-lg mb-1">{action.label}</p>
              <p className="text-sm font-medium text-gray-500">{action.desc}</p>
            </button>
          ))}
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-6">Recent Reports</h2>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <LectureSkeleton key={i} />)}
            </div>
          ) : reports.length === 0 ? (
            <EmptyState type="lectures" actionLabel="Record Now" onAction={() => navigate("/dashboard")} />
          ) : (
            reports.map((report) => (
            <div
              key={report.id}
              className="glass-card rounded-2xl p-6 hover:shadow-lg transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-gray-100"
            >
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-gray-700" />
                </div>
                <div>
                  <h3 className="font-bold tracking-tight text-gray-900 text-lg leading-tight">{report.title}</h3>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${typeColors[report.type]}`}
                    >
                      {typeLabels[report.type]}
                    </span>
                    <span className="text-xs font-medium text-gray-500">{report.date}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                {report.status === "generating" ? (
                  <div className="text-sm font-medium text-gray-500">Generating...</div>
                ) : (
                  <>
                    <button 
                      onClick={() => setChatReport({id: report.id, title: report.title})}
                      className="btn-secondary h-11 w-full md:w-auto text-sm"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Chat
                    </button>
                    <button 
                      onClick={() => handleDownload(report.id, report.title)}
                      disabled={downloadingId === report.id}
                      className="btn-primary h-11 w-full md:w-auto text-sm shadow-none"
                    >
                      {downloadingId === report.id ? <InlineLoader /> : <Download className="w-4 h-4" />}
                      {downloadingId === report.id ? "" : "Download"}
                    </button>
                  </>
                )}
              </div>
            </div>
          )))}
        </div>

        {/* Empty State */}
        <div className="glass-card rounded-3xl p-12 text-center mt-12">
          <p className="text-gray-500 font-medium tracking-tight mb-6">Want to generate a new report?</p>
          <button 
            onClick={() => navigate("/dashboard")}
            className="btn-primary mx-auto shadow-xl hover:shadow-2xl"
          >
            Create New Report
          </button>
        </div>
      </div>

      {chatReport && (
        <ChatPanel
          lectureId={chatReport.id}
          lectureTitle={chatReport.title}
          transcript=""
          onClose={() => setChatReport(null)}
        />
      )}

      {/* Report Type Selector Modal */}
      {selectorOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md premium-shadow">
            <h3 className="text-xl font-bold tracking-tight text-gray-900 mb-2">Generate {selectorOpen.label}</h3>
            <p className="text-sm font-medium text-gray-500 mb-6">Select a transcribed lecture to generate this report for:</p>
            <div className="max-h-[60vh] overflow-y-auto space-y-2 mb-6">
              {reports.map(r => (
                <button
                  key={r.id}
                  onClick={() => handleGenerateReport(r.id, selectorOpen.type)}
                  className="w-full text-left p-4 hover:bg-gray-50 border border-gray-100 rounded-2xl transition"
                >
                  <div className="font-semibold text-gray-900 tracking-tight">{r.title}</div>
                  <div className="text-xs text-gray-400 mt-1">{r.date}</div>
                </button>
              ))}
              {reports.length === 0 && (
                <div className="text-center text-sm text-gray-400 p-4">
                  No transcribed lectures available. Please record a lecture first.
                </div>
              )}
            </div>
            <button
              onClick={() => setSelectorOpen(null)}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
