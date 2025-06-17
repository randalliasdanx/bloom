// app/dashboard/page.tsx
"use client";

import React, { useState } from "react";
import RoadmapView from "../../components/RoadmapView";

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
  },
];

export default function DashboardPage() {
  const [selectedModule, setSelectedModule] = useState(mockModules[0]);

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
      <main className="flex-1 p-8 bg-gradient-to-br from-[#e6e6fa] to-[#b7eacb]">
        <h1 className="text-3xl font-bold mb-6 text-black">
          {selectedModule.title} Roadmap
        </h1>
        <RoadmapView roadmap={selectedModule.roadmap} />
      </main>
    </div>
  );
}
