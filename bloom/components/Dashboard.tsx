"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../utils/supabaseClient";
import mermaid from "mermaid";

// Mock data for modules, chapters, and lessons
const mockModules = [
  {
    id: "algorithms",
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
  {
    id: "linear-algebra",
    title: "Linear Algebra",
    chapters: [
      {
        id: "ch1",
        title: "Vectors",
        lessons: ["Vector Addition", "Dot Product", "Cross Product"],
      },
      {
        id: "ch2",
        title: "Matrices",
        lessons: ["Matrix Multiplication", "Determinants", "Inverses"],
      },
    ],
    progress: 0.5,
  },
  {
    id: "calculus",
    title: "Calculus",
    chapters: [
      {
        id: "ch1",
        title: "Limits & Continuity",
        lessons: ["Limits", "Continuity"],
      },
      {
        id: "ch2",
        title: "Derivatives",
        lessons: ["Definition of Derivative", "Product Rule", "Chain Rule"],
      },
      {
        id: "ch3",
        title: "Integrals",
        lessons: [
          "Definite Integrals",
          "Indefinite Integrals",
          "Fundamental Theorem",
        ],
      },
    ],
    progress: 0.2,
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
    (async () => {
      const { svg } = await mermaid.render("roadmap", roadmap);
      setMermaidSvg(svg);
    })();
  }, [selectedModule]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/signin");
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
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={handleSignOut}
          className="mt-auto mb-4 bg-green-200 text-black px-4 py-2 rounded shadow hover:bg-green-300 transition"
        >
          Sign Out
        </button>
      </aside>
      {/* Main Content */}
      <main className="flex-1 p-8 bg-transparent">
        <h1 className="text-3xl font-bold mb-4" style={{ color: "black" }}>
          {selectedModule.title} Roadmap
        </h1>
        <div className="mb-4">
          <div className="w-full bg-gray-300 rounded h-4">
            <div
              className="bg-green-500 h-4 rounded"
              style={{ width: `${selectedModule.progress * 100}%` }}
            ></div>
          </div>
          <div className="text-right text-sm mt-1" style={{ color: "black" }}>
            {Math.round(selectedModule.progress * 100)}% complete
          </div>
        </div>
        <div
          id="roadmap-container"
          dangerouslySetInnerHTML={{ __html: mermaidSvg }}
          className="mb-8"
        />
        <div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "black" }}>
            Chapters & Lessons
          </h2>
          <ul>
            {selectedModule.chapters.map((ch) => (
              <li key={ch.id} className="mb-2">
                <span className="font-bold" style={{ color: "black" }}>
                  {ch.title}:
                </span>{" "}
                <span className="font-normal" style={{ color: "black" }}>
                  {ch.lessons.join(", ")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
