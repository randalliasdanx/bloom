"use client";

import React, { useEffect, useState } from "react";

interface CurriculumModule {
  id: string;
  title: string;
  curriculum: { chapters: any[] };
}

export default function CurriculumsPage() {
  const [modules, setModules] = useState<CurriculumModule[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/curriculums")
      .then((res) => res.json())
      .then((data) => {
        setModules(data.modules || []);
        if (data.modules?.length) setSelectedId(data.modules[0].id);
      });
  }, []);

  const selected = modules.find((m) => m.id === selectedId);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#e6e6fa] to-[#b7eacb]">
      {/* Sidebar */}
      <aside className="w-64 bg-white/80 border-r border-green-200 p-4">
        <h2 className="text-lg font-bold mb-4 text-green-700">
          Your Curriculums
        </h2>
        <ul>
          {modules.map((mod) => (
            <li key={mod.id}>
              <button
                className={`w-full text-left px-2 py-1 rounded mb-1 ${
                  selectedId === mod.id
                    ? "bg-green-200 font-bold"
                    : "hover:bg-green-100"
                }`}
                style={{ color: "black" }}
                onClick={() => setSelectedId(mod.id)}
              >
                {mod.title}
              </button>
            </li>
          ))}
        </ul>
      </aside>
      {/* Main content */}
      <main className="flex-1 p-8">
        {selected ? (
          <div>
            <h1 className="text-2xl font-bold mb-4 text-green-700">
              {selected.title}
            </h1>
            {selected.curriculum.chapters?.map((chapter, idx) => (
              <div key={idx} className="mb-6">
                <h2
                  className="text-xl font-bold mb-1"
                  style={{ color: "black" }}
                >
                  {chapter.title}
                </h2>
                <p className="mb-2" style={{ color: "black" }}>
                  {chapter.content}
                </p>
                {chapter.lessons && (
                  <div className="ml-4 mb-2">
                    <h4 className="font-semibold" style={{ color: "black" }}>
                      Lessons:
                    </h4>
                    <ul className="list-disc list-inside">
                      {chapter.lessons.map((lesson: any, lidx: number) => (
                        <li
                          key={lidx}
                          className="mb-1"
                          style={{ color: "black" }}
                        >
                          <span className="font-medium">{lesson.title}:</span>{" "}
                          {lesson.content}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {chapter.quiz && (
                  <div className="ml-4">
                    <h4 className="font-semibold" style={{ color: "black" }}>
                      Quiz:
                    </h4>
                    <ul className="list-decimal list-inside">
                      {chapter.quiz.map((q: any, qidx: number) => (
                        <li
                          key={qidx}
                          className="mb-1"
                          style={{ color: "black" }}
                        >
                          <span className="font-medium">Q:</span> {q.question}
                          <ul className="ml-4 list-disc">
                            {q.options?.map((opt: string, oidx: number) => (
                              <li key={oidx} style={{ color: "black" }}>
                                {opt}
                              </li>
                            ))}
                          </ul>
                          <span className="text-green-700">
                            Answer: {q.answer}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: "black" }}>
            Select a curriculum to view details.
          </div>
        )}
      </main>
    </div>
  );
}
