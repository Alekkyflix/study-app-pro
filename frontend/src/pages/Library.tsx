import { Search, Download, Trash2, Clock, BookOpen } from "lucide-react";
import { useState } from "react";

interface Lecture {
  id: string;
  title: string;
  date: string;
  duration: string;
  size: string;
}

export function Library() {
  const [searchQuery, setSearchQuery] = useState("");
  const [lectures] = useState<Lecture[]>([
    {
      id: "1",
      title: "Physics - Quantum Mechanics 101",
      date: "Apr 10, 2026",
      duration: "1:23:45",
      size: "142 MB",
    },
    {
      id: "2",
      title: "Chemistry - Organic Synthesis",
      date: "Apr 9, 2026",
      duration: "58:30",
      size: "98 MB",
    },
    {
      id: "3",
      title: "Biology - Cellular Biology",
      date: "Apr 8, 2026",
      duration: "1:45:20",
      size: "176 MB",
    },
  ]);

  const filtered = lectures.filter((l) =>
    l.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Lecture Library</h1>
          <p className="text-gray-600">Browse and manage your recorded lectures</p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search lectures..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Lectures Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((lecture) => (
              <div
                key={lecture.id}
                className="bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded transition">
                      <Download className="w-4 h-4 text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded transition">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  {lecture.title}
                </h3>
                <div className="space-y-1 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {lecture.duration}
                  </div>
                  <p>{lecture.date}</p>
                  <p className="text-xs text-gray-400">{lecture.size}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No lectures found</p>
          </div>
        )}
      </div>
    </div>
  );
}
