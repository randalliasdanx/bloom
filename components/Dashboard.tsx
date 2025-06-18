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
        objectives: [
          "Understand array data structures",
          "Learn hashing techniques",
        ],
        keyConcepts: ["Arrays", "Hash Tables", "Collisions"],
        lessons: [
          {
            title: "Two Pointers",
            resources: [
              "https://leetcode.com/tag/two-pointers/",
              "Textbook Ch. 2",
            ],
          },
          {
            title: "Stack",
            resources: [
              "https://en.wikipedia.org/wiki/Stack_(abstract_data_type)",
            ],
          },
        ],
      },
      {
        id: "ch2",
        title: "Trees",
        objectives: [
          "Understand tree data structures",
          "Implement basic tree traversals",
        ],
        keyConcepts: ["Binary Trees", "Tree Traversal", "Recursion"],
        lessons: [
          {
            title: "Tries",
            resources: ["https://en.wikipedia.org/wiki/Trie"],
          },
          {
            title: "Heap / Priority Queue",
            resources: ["https://en.wikipedia.org/wiki/Heap_(data_structure)"],
          },
        ],
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
        objectives: [
          "Understand vector operations",
          "Apply dot and cross products",
        ],
        keyConcepts: ["Vectors", "Dot Product", "Cross Product"],
        lessons: [
          {
            title: "Vector Addition",
            resources: ["https://en.wikipedia.org/wiki/Vector_addition"],
          },
          {
            title: "Dot Product",
            resources: ["https://en.wikipedia.org/wiki/Dot_product"],
          },
          {
            title: "Cross Product",
            resources: ["https://en.wikipedia.org/wiki/Cross_product"],
          },
        ],
      },
      {
        id: "ch2",
        title: "Matrices",
        objectives: [
          "Understand matrix multiplication",
          "Calculate determinants and inverses",
        ],
        keyConcepts: ["Matrices", "Multiplication", "Determinants", "Inverses"],
        lessons: [
          {
            title: "Matrix Multiplication",
            resources: ["https://en.wikipedia.org/wiki/Matrix_multiplication"],
          },
          {
            title: "Determinants",
            resources: ["https://en.wikipedia.org/wiki/Determinant"],
          },
          {
            title: "Inverses",
            resources: ["https://en.wikipedia.org/wiki/Invertible_matrix"],
          },
        ],
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
        objectives: [
          "Understand the concept of limits",
          "Explore continuity in functions",
        ],
        keyConcepts: ["Limits", "Continuity"],
        lessons: [
          {
            title: "Limits",
            resources: ["https://en.wikipedia.org/wiki/Limit_(mathematics)"],
          },
          {
            title: "Continuity",
            resources: ["https://en.wikipedia.org/wiki/Continuous_function"],
          },
        ],
      },
      {
        id: "ch2",
        title: "Derivatives",
        objectives: [
          "Understand the definition of a derivative",
          "Apply product and chain rules",
        ],
        keyConcepts: ["Derivatives", "Product Rule", "Chain Rule"],
        lessons: [
          {
            title: "Definition of Derivative",
            resources: ["https://en.wikipedia.org/wiki/Derivative"],
          },
          {
            title: "Product Rule",
            resources: ["https://en.wikipedia.org/wiki/Product_rule"],
          },
          {
            title: "Chain Rule",
            resources: ["https://en.wikipedia.org/wiki/Chain_rule"],
          },
        ],
      },
      {
        id: "ch3",
        title: "Integrals",
        objectives: [
          "Understand definite and indefinite integrals",
          "Apply the fundamental theorem of calculus",
        ],
        keyConcepts: [
          "Definite Integrals",
          "Indefinite Integrals",
          "Fundamental Theorem",
        ],
        lessons: [
          {
            title: "Definite Integrals",
            resources: ["https://en.wikipedia.org/wiki/Integral"],
          },
          {
            title: "Indefinite Integrals",
            resources: ["https://en.wikipedia.org/wiki/Integral"],
          },
          {
            title: "Fundamental Theorem",
            resources: [
              "https://en.wikipedia.org/wiki/Fundamental_theorem_of_calculus",
            ],
          },
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
  const [view, setView] = useState<"visual" | "verbose">("visual");

  useEffect(() => {
    if (view !== "visual") return;
    // Generate Mermaid roadmap string
    const roadmap =
      `graph TD\n` +
      selectedModule.chapters
        .map((ch, i) => {
          const chapterNode = `A${i}[\"${ch.title}\"]`;
          const lessonNodes = ch.lessons
            .map(
              (lesson, j) =>
                `A${i}_${j}[\"${
                  typeof lesson === "string" ? lesson : lesson.title
                }\"]`
            )
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
  }, [selectedModule, view]);

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
        {/* Toggle View */}
        <div className="mb-6 flex gap-4">
          <button
            className={`px-4 py-2 rounded ${
              view === "visual"
                ? "bg-green-600 text-white"
                : "bg-gray-200 text-black"
            }`}
            onClick={() => setView("visual")}
          >
            Visual View
          </button>
          <button
            className={`px-4 py-2 rounded ${
              view === "verbose"
                ? "bg-green-600 text-white"
                : "bg-gray-200 text-black"
            }`}
            onClick={() => setView("verbose")}
          >
            Verbose View
          </button>
        </div>
        {view === "visual" ? (
          <div
            id="roadmap-container"
            dangerouslySetInnerHTML={{ __html: mermaidSvg }}
            className="mb-8"
          />
        ) : (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4" style={{ color: "black" }}>
              Verbose Roadmap
            </h2>
            {selectedModule.chapters.map((ch, idx) => (
              <div key={ch.id} className="mb-6 p-4 bg-white/80 rounded shadow">
                <h3
                  className="text-lg font-bold mb-2"
                  style={{ color: "black" }}
                >
                  {ch.title}
                </h3>
                <div className="mb-2">
                  <span className="font-semibold" style={{ color: "black" }}>
                    Learning Objectives:
                  </span>
                  <ul className="list-disc ml-6">
                    {ch.objectives?.map((obj, i) => (
                      <li key={i} className="text-black">
                        {obj}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mb-2">
                  <span className="font-semibold" style={{ color: "black" }}>
                    Key Concepts:
                  </span>
                  <ul className="list-disc ml-6">
                    {ch.keyConcepts?.map((kc, i) => (
                      <li key={i} className="text-black">
                        {kc}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="font-semibold" style={{ color: "black" }}>
                    Lessons & Resources:
                  </span>
                  <ul className="list-disc ml-6">
                    {ch.lessons?.map((lesson, i) => (
                      <li key={i} className="text-black">
                        <span className="font-medium">
                          {typeof lesson === "string" ? lesson : lesson.title}
                        </span>
                        {lesson.resources && lesson.resources.length > 0 && (
                          <ul className="list-disc ml-6">
                            {lesson.resources.map((res, j) => (
                              <li key={j} className="text-blue-700 underline">
                                <a
                                  href={res}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {res}
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
