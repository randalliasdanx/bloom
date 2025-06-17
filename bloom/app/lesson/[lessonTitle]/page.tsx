"use client";

import { useRouter } from "next/navigation";

export default function LessonPage() {
  const router = useRouter();
  // In a real app, you would get the chapterSlug from params or context
  const chapterSlug = "vectors"; // Placeholder for demo
  const { lessonTitle } = (router as any).query || {};

  // Mock mastery points and icons
  const masteryPoints = 3200;
  const icons = Array(20).fill("not-started");
  icons[2] = "quiz";
  icons[5] = "quiz";
  icons[19] = "unit-test";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e6e6fa] to-[#b7eacb]">
      <div className="max-w-3xl mx-auto p-8 relative">
        <button
          onClick={() => router.push("/chapter")}
          className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 bg-green-800 hover:bg-green-900 text-white font-semibold rounded shadow transition"
        >
          <span className="text-2xl">&#8592;</span>
          <span className="text-lg">Back to Chapters</span>
        </button>
        <h1 className="text-3xl font-bold mb-4 text-green-700 capitalize mt-16">
          {lessonTitle || "Lesson Title"}
        </h1>
        <div className="text-gray-600 mb-4">
          {masteryPoints.toLocaleString()} possible mastery points{" "}
          <span title="What are mastery points?">ℹ️</span>
        </div>
        <div className="flex items-center gap-1 mb-6">
          {icons.map((icon, i) => (
            <span key={i} className="inline-block">
              {icon === "quiz" ? (
                <span title="Quiz" className="inline-block text-blue-500">
                  ⚡
                </span>
              ) : icon === "unit-test" ? (
                <span title="Unit test" className="inline-block text-gray-500">
                  ★
                </span>
              ) : (
                <span className="inline-block border border-gray-400 rounded w-6 h-6 align-middle"></span>
              )}
            </span>
          ))}
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-black text-lg">Lesson content goes here...</p>
        </div>
      </div>
    </div>
  );
}
