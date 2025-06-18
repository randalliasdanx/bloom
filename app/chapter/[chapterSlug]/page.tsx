"use client";

import { useParams, useRouter } from "next/navigation";
import React from "react";

// Mock data with quizzes interleaved between lessons
const mockChapter = {
  title: "Vectors",
  videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
  content: [
    { type: "lesson", title: "Introduction to Vectors", completed: true },
    { type: "quiz", title: "Quiz 1: Basics of Vectors", status: "not started" },
    { type: "lesson", title: "Vector Addition", completed: false },
    { type: "lesson", title: "Dot Product", completed: false },
    { type: "quiz", title: "Quiz 2: Vector Operations", status: "not started" },
  ],
};

export default function ChapterPage() {
  const params = useParams();
  const router = useRouter();
  const chapterSlug = params.chapterSlug as string;

  // In a real app, fetch chapter data by slug
  const chapter = mockChapter;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e6e6fa] to-[#b7eacb]">
      <div className="max-w-3xl mx-auto p-8">
        <div className="flex items-center mb-4">
          <button
            onClick={() => router.back()}
            className="mr-4 px-3 py-1 bg-green-800 hover:bg-green-900 text-white font-semibold rounded shadow transition"
          >
            <span className="text-2xl">&#8592;</span>
          </button>
          <h1 className="text-4xl font-bold text-green-700 capitalize">
            {chapter.title}
          </h1>
        </div>
        <div className="mb-8 rounded-lg overflow-hidden shadow-lg bg-white">
          <video
            src={chapter.videoUrl}
            controls
            className="w-full h-64 object-cover bg-black"
          />
        </div>
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-3 text-green-800">
            Lessons & Quizzes
          </h2>
          <ul className="space-y-2">
            {chapter.content.map((item, i) =>
              item.type === "lesson" ? (
                <li
                  key={i}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg shadow-sm border ${
                    item.completed
                      ? "bg-green-100 border-green-300"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <span className="text-lg font-semibold text-green-700">
                    {item.title}
                  </span>
                  {item.completed ? (
                    <span className="text-green-600 font-semibold">
                      Completed
                    </span>
                  ) : (
                    <button className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600 transition">
                      Start
                    </button>
                  )}
                </li>
              ) : (
                <li
                  key={i}
                  className="flex items-center justify-between px-4 py-3 rounded-lg shadow-sm border bg-blue-50 border-blue-200"
                >
                  <span className="text-lg font-semibold text-green-800">
                    {item.title}
                  </span>
                  <button className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 transition">
                    {item.status === "not started" ? "Start Quiz" : "Continue"}
                  </button>
                </li>
              )
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
