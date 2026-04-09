import { BarChart3, Clock, BookOpen, Target } from "lucide-react";
import { useState } from "react";

interface Metric {
  label: string;
  value: string;
  unit: string;
  icon: any;
  color: string;
}

export function Analytics() {
  const [timeRange] = useState("week");

  const metrics: Metric[] = [
    {
      label: "Total Study Time",
      value: "12",
      unit: "hours",
      icon: Clock,
      color: "bg-blue-100 text-blue-600",
    },
    {
      label: "Lectures Recorded",
      value: "8",
      unit: "lectures",
      icon: BookOpen,
      color: "bg-green-100 text-green-600",
    },
    {
      label: "Avg. Note Coverage",
      value: "87",
      unit: "%",
      icon: Target,
      color: "bg-purple-100 text-purple-600",
    },
    {
      label: "Learning Streak",
      value: "5",
      unit: "days",
      icon: BarChart3,
      color: "bg-orange-100 text-orange-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Learning Analytics</h1>
          <p className="text-gray-600">Track your study progress and performance</p>
        </div>

        {/* Time Range Filter */}
        <div className="flex gap-2 mb-8">
          {["day", "week", "month"].map((range) => (
            <button
              key={range}
              className={`px-4 py-2 rounded-lg font-medium transition capitalize ${
                timeRange === range
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {range}
            </button>
          ))}
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((metric, i) => {
            const Icon = metric.icon;
            return (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6">
                <div className={`${metric.color} p-3 rounded-lg w-fit mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <p className="text-gray-600 text-sm font-medium mb-2">{metric.label}</p>
                <p className="text-3xl font-bold text-gray-900">
                  {metric.value}
                  <span className="text-lg font-normal text-gray-500 ml-1">{metric.unit}</span>
                </p>
              </div>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Study Time Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Study Time This Week</h2>
            <div className="flex items-end justify-between h-64 gap-2">
              {[3, 5, 4, 6, 8, 5, 4].map((height, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-600 rounded-t transition hover:bg-blue-700"
                    style={{ height: `${height * 30}px` }}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Topic Distribution */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Topics Covered</h2>
            <div className="space-y-4">
              {[
                { name: "Physics", percent: 45, color: "bg-blue-600" },
                { name: "Chemistry", percent: 30, color: "bg-purple-600" },
                { name: "Biology", percent: 20, color: "bg-green-600" },
                { name: "Math", percent: 15, color: "bg-orange-600" },
              ].map((topic, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-1">
                    <p className="text-sm font-medium text-gray-700">{topic.name}</p>
                    <p className="text-sm text-gray-500">{topic.percent}%</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${topic.color}`}
                      style={{ width: `${topic.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
