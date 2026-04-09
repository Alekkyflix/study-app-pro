import { Download, FileText, TrendingUp, Calendar } from "lucide-react";
import { useState } from "react";

interface Report {
  id: string;
  title: string;
  type: "summary" | "analysis" | "questions";
  date: string;
  status: "ready" | "generating";
}

export function Reports() {
  const [reports] = useState<Report[]>([
    {
      id: "1",
      title: "Quantum Mechanics Summary",
      type: "summary",
      date: "Apr 10, 2026",
      status: "ready",
    },
    {
      id: "2",
      title: "Organic Chemistry Analysis",
      type: "analysis",
      date: "Apr 9, 2026",
      status: "ready",
    },
    {
      id: "3",
      title: "Biology Exam Questions",
      type: "questions",
      date: "Apr 8, 2026",
      status: "ready",
    },
  ]);

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Study Reports</h1>
          <p className="text-gray-600">Generate comprehensive study materials from your lectures</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { icon: FileText, label: "Executive Summary", desc: "Brief overview" },
            { icon: TrendingUp, label: "Analysis Report", desc: "Detailed insights" },
            { icon: Calendar, label: "Exam Questions", desc: "Practice questions" },
          ].map((action, i) => (
            <button
              key={i}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition text-left"
            >
              <action.icon className="w-8 h-8 text-blue-600 mb-3" />
              <p className="font-semibold text-gray-900">{action.label}</p>
              <p className="text-sm text-gray-500">{action.desc}</p>
            </button>
          ))}
        </div>

        {/* Reports List */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Reports</h2>
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <FileText className="w-10 h-10 text-gray-400" />
                <div>
                  <h3 className="font-semibold text-gray-900">{report.title}</h3>
                  <div className="flex items-center gap-4 mt-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${typeColors[report.type]}`}
                    >
                      {typeLabels[report.type]}
                    </span>
                    <span className="text-sm text-gray-500">{report.date}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {report.status === "generating" ? (
                  <div className="text-sm text-gray-500">Generating...</div>
                ) : (
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        <div className="bg-white rounded-lg shadow-sm p-12 text-center mt-8">
          <p className="text-gray-500 mb-4">Want to generate a new report?</p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition">
            Create New Report
          </button>
        </div>
      </div>
    </div>
  );
}
