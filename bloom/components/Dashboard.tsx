"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../utils/supabaseClient";
import mermaid from "mermaid";

// Mock data for modules, chapters, and lessons
const mockModules = [
  {
    id: "mod1",
    title: "Algorithms",
    chapters: [
      {
        id: "ch1",
        title: "Arrays & Hashing",
        lessons: ["Two Pointers", "Stack"],
      },
      {
        id: "ch2",
        title: "Trees",
        lessons: ["Tries", "Heap / Priority Queue"],
      },
    ],
    progress: 0.3,
  },
];

const Dashboard: React.FC = () => {
  const router = useRouter();
  const [selectedModule, setSelectedModule] = useState(mockModules[0]);
  const [mermaidSvg, setMermaidSvg] = useState("");

  useEffect(() => {
    // Generate Mermaid roadmap string
    const roadmap =
      `graph TD\n` +
      selectedModule.chapters
        .map((ch, i) => {
          const chapterNode = `A${i}[\"${ch.title}\"]`;
          const lessonNodes = ch.lessons
            .map((lesson, j) => `A${i}_${j}[\"${lesson}\"]`)
            .join("\n");
          const lessonLinks = ch.lessons
            .map((_, j) => `${chapterNode} --> A${i}_${j}`)
            .join("\n");
          return `${chapterNode}\n${lessonNodes}\n${lessonLinks}`;
        })
        .join("\n");
    mermaid.render("roadmap", roadmap, (svgCode: string) =>
      setMermaidSvg(svgCode)
    );
  }, [selectedModule]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/signin");
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-900 text-white flex flex-col items-center py-8">
        <div className="mb-8 text-2xl font-bold">YourLogo</div>
        <div className="w-full">
          <h3 className="mb-2 px-4">Modules</h3>
          <ul>
            {mockModules.map((mod) => (
              <li
                key={mod.id}
                className={`px-4 py-2 cursor-pointer ${
                  selectedModule.id === mod.id ? "bg-blue-700" : ""
                }`}
                onClick={() => setSelectedModule(mod)}
              >
                {mod.title}
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={handleSignOut}
          className="mt-auto mb-4 bg-red-600 px-4 py-2 rounded"
        >
          Sign Out
        </button>
      </aside>
      {/* Main Content */}
      <main className="flex-1 p-8 bg-gray-50">
        <h1 className="text-3xl font-bold mb-4">
          {selectedModule.title} Roadmap
        </h1>
        <div className="mb-4">
          <div className="w-full bg-gray-300 rounded h-4">
            <div
              className="bg-green-500 h-4 rounded"
              style={{ width: `${selectedModule.progress * 100}%` }}
            ></div>
          </div>
          <div className="text-right text-sm mt-1">
            {Math.round(selectedModule.progress * 100)}% complete
          </div>
        </div>
        <div
          id="roadmap-container"
          dangerouslySetInnerHTML={{ __html: mermaidSvg }}
          className="mb-8"
        />
        <div>
          <h2 className="text-xl font-semibold mb-2">Chapters & Lessons</h2>
          <ul>
            {selectedModule.chapters.map((ch) => (
              <li key={ch.id} className="mb-2">
                <span className="font-bold">{ch.title}:</span>{" "}
                {ch.lessons.join(", ")}
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
