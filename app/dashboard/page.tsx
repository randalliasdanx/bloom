// app/dashboard/page.tsx
"use client";

import React, { useState } from "react";
import RoadmapView from "../../components/RoadmapView";
import { useRouter } from "next/navigation";

const mockModules = [
  {
    id: "algorithms",
    title: "Algorithms",
    progress: 0.7,
    roadmap: {
      units: [
        {
          title: "Unit 1: Foundations",
          chapters: [
            {
              title: "Arrays & Hashing",
              lessons: [{ title: "Two Pointers" }, { title: "Stack" }],
            },
            {
              title: "Trees",
              lessons: [{ title: "Tries" }, { title: "Heap / Priority Queue" }],
            },
          ],
        },
      ],
    },
    upcomingChapters: [
      {
        id: "dp",
        title: "Dynamic Programming",
        status: "upcoming",
        description: "Learn advanced problem-solving techniques with dynamic programming",
      }
    ]
  },
  {
    id: "linear-algebra",
    title: "Linear Algebra",
    progress: 0.4,
    roadmap: {
      units: [
        {
          title: "Unit 1: Foundations",
          chapters: [
            {
              title: "Vectors",
              lessons: [
                { title: "Introduction to Vectors" },
                { title: "Vector Operations" },
              ],
            },
            {
              title: "Matrices",
              lessons: [
                { title: "Matrix Multiplication" },
                { title: "Determinants" },
              ],
            },
          ],
        },
        {
          title: "Unit 2: Applications",
          chapters: [
            {
              title: "Linear Transformations",
              lessons: [{ title: "Definition" }, { title: "Examples" }],
            },
          ],
        },
      ],
    },
    upcomingChapters: [
      {
        id: "eigenvalues",
        title: "Eigenvalues & Eigenvectors",
        status: "upcoming",
        description: "Master the concepts of eigenvalues and eigenvectors",
      }
    ]
  },
  {
    id: "calculus",
    title: "Calculus",
    progress: 0.15,
    roadmap: {
      units: [
        {
          title: "Unit 1: Limits & Continuity",
          chapters: [
            {
              title: "Limits",
              lessons: [
                { title: "Introduction to Limits" },
                { title: "Limit Laws" },
              ],
            },
            {
              title: "Continuity",
              lessons: [
                { title: "Definition of Continuity" },
                { title: "Types of Discontinuity" },
              ],
            },
          ],
        },
        {
          title: "Unit 2: Derivatives",
          chapters: [
            {
              title: "Derivatives",
              lessons: [
                { title: "Definition of Derivative" },
                { title: "Product Rule" },
                { title: "Chain Rule" },
              ],
            },
          ],
        },
      ],
    },
    upcomingChapters: [
      {
        id: "integration",
        title: "Integration",
        status: "upcoming",
        description: "Learn the fundamental theorem of calculus and integration techniques",
      }
    ]
  },
];

export default function DashboardPage() {
  const [selectedModule, setSelectedModule] = useState(mockModules[0]);
  const router = useRouter();

  const handleUpcomingChapterClick = (chapterId: string) => {
    router.push(`/chapter/${chapterId}/upcoming`);
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-[#d4f5e9] text-black flex flex-col items-center py-8">
        <div className="w-full">
          <h3 className="mb-2 px-4 font-bold">Modules</h3>
          <ul>
            {mockModules.map((mod) => (
              <li
                key={mod.id}
                className={`px-4 py-2 cursor-pointer ${
                  selectedModule.id === mod.id ? "bg-[#b7eacb]" : ""
                }`}
                style={{ fontWeight: selectedModule.id === mod.id ? 500 : 400 }}
                onClick={() => setSelectedModule(mod)}
              >
                <span className="font-normal">{mod.title}</span>
                <div className="w-full h-2 bg-gray-200 rounded mt-2">
                  <div
                    className="h-2 rounded bg-green-500 transition-all"
                    style={{ width: `${Math.round(mod.progress * 100)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-green-700 mt-1 font-semibold text-right">
                  {Math.round(mod.progress * 100)}% complete
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-1 p-8 bg-gradient-to-br from-[#e6e6fa] to-[#b7eacb] overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          <h1 className="text-3xl font-bold text-black">
            {selectedModule.title} Roadmap
          </h1>
          
          <div className="bg-white/50 rounded-lg p-6">
            <RoadmapView roadmap={selectedModule.roadmap} />
          </div>
          
          {/* Upcoming Chapters Section */}
          {selectedModule.upcomingChapters && selectedModule.upcomingChapters.length > 0 && (
            <div className="bg-white/50 rounded-lg p-6">
              <h2 className="text-3xl font-bold mb-6 text-black" style={{ fontFamily: 'var(--font-arvo)' }}>
                Upcoming Chapters
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedModule.upcomingChapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className="bg-white/90 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 border-2 border-transparent hover:border-green-300"
                    onClick={() => handleUpcomingChapterClick(chapter.id)}
                  >
                    <h3 className="text-2xl font-semibold text-green-700 mb-3" style={{ fontFamily: 'var(--font-arvo)' }}>
                      {chapter.title}
                    </h3>
                    <p className="text-gray-600 mb-6 text-lg">{chapter.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-green-600">
                        <span className="mr-2 text-xl">🔜</span>
                        <span>Coming Soon</span>
                      </div>
                      <button className="bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors">
                        Upload Voice
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
