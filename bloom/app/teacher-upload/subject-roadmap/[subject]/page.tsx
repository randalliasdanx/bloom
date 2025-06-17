"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";

interface CurriculumModule {
  id: string;
  title: string;
  curriculum: { chapters: any[] };
  textbookOrSubject?: string;
}

// Custom node for inline editing
function EditableNode({ id, data, selected, setNodes }: any) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(data.label);

  useEffect(() => {
    setValue(data.label);
  }, [data.label]);

  const handleDoubleClick = () => setEditing(true);
  const handleChange = (e: any) => setValue(e.target.value);
  const handleBlur = () => {
    setEditing(false);
    setNodes((nds: Node[]) =>
      nds.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, label: value } }
          : node
      )
    );
  };
  const handleKeyDown = (e: any) => {
    if (e.key === "Enter") {
      handleBlur();
    }
  };
  return (
    <div
      style={{
        border: selected ? "2px solid #22c55e" : "1px solid #ccc",
        borderRadius: 8,
        padding: 8,
        background: "#fff",
        minWidth: 120,
        textAlign: "center",
        cursor: "pointer",
      }}
      onDoubleClick={handleDoubleClick}
    >
      {editing ? (
        <input
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          style={{ width: "100%", border: "1px solid #ccc", borderRadius: 4 }}
        />
      ) : (
        <span>{data.label}</span>
      )}
    </div>
  );
}

// Utility for localStorage
const ROADMAP_STORAGE_KEY = (subject: string) => `roadmap-${subject}`;

// Node with handles for connecting and black font, double-click anywhere to edit
function HandleNode({ id, data, selected, setNodes }: any) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(data.label);

  useEffect(() => {
    setValue(data.label);
  }, [data.label]);

  const handleDoubleClick = () => setEditing(true);
  const handleChange = (e: any) => setValue(e.target.value);
  const handleBlur = () => {
    setEditing(false);
    setNodes((nds: Node[]) =>
      nds.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, label: value } }
          : node
      )
    );
  };
  const handleKeyDown = (e: any) => {
    if (e.key === "Enter") {
      handleBlur();
    }
  };
  return (
    <div
      style={{
        border: selected ? "2px solid #22c55e" : "1px solid #ccc",
        borderRadius: 8,
        padding: 8,
        background: "#fff",
        minWidth: 120,
        textAlign: "center",
        cursor: "pointer",
        position: "relative",
        color: "black",
        fontWeight: 500,
      }}
      onDoubleClick={handleDoubleClick}
    >
      <Handle type="target" position={Position.Top} />
      {editing ? (
        <input
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          style={{
            width: "100%",
            border: "1px solid #ccc",
            borderRadius: 4,
            color: "black",
          }}
        />
      ) : (
        <span>{value}</span>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

function curriculumToFlow(module: CurriculumModule) {
  if (!module?.curriculum?.chapters) return { nodes: [], edges: [] };
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const chapterMap: Record<string, { idxs: number[]; lessons: any[] }> = {};
  module.curriculum.chapters.forEach((ch, i) => {
    if (!chapterMap[ch.title]) {
      chapterMap[ch.title] = { idxs: [], lessons: [] };
    }
    chapterMap[ch.title].idxs.push(i);
    if (ch.lessons) {
      chapterMap[ch.title].lessons.push(...ch.lessons);
    }
  });
  let x = 100;
  Object.entries(chapterMap).forEach(
    ([chapterTitle, { idxs, lessons }], chapterIdx) => {
      const chapterId = `chapter-${chapterTitle.replace(/\s+/g, "-")}`;
      nodes.push({
        id: chapterId,
        type: "handleNode",
        position: { x, y: 100 },
        data: { label: chapterTitle },
      });
      if (lessons && lessons.length > 0) {
        lessons.forEach((lesson: any, j: number) => {
          const lessonId = `${chapterId}-lesson-${j}`;
          nodes.push({
            id: lessonId,
            type: "handleNode",
            position: { x, y: 250 + j * 120 },
            data: { label: lesson.title },
          });
          edges.push({
            id: `${chapterId}-${lessonId}`,
            source: chapterId,
            target: lessonId,
          });
        });
      }
      x += 250;
    }
  );
  return { nodes, edges };
}

export default function SubjectRoadmapPage({
  params,
}: {
  params: { subject: string };
}) {
  const [module, setModule] = useState<CurriculumModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"visual" | "verbose">("visual");
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedElements, setSelectedElements] = useState<any[]>([]);

  const [description, setDescription] = useState<string>("");
  const [editingDescription, setEditingDescription] = useState(false);
  const [lessonDetails, setLessonDetails] = useState<
    Record<string, { objectives: string; coreConcepts: string }>
  >({});
  const [editingLesson, setEditingLesson] = useState<{
    key: string;
    field: "objectives" | "coreConcepts";
  } | null>(null);
  const [lessonLoading, setLessonLoading] = useState<Record<string, boolean>>(
    {}
  );

  // Fetch the curriculum for the subject
  useEffect(() => {
    async function fetchCurriculum() {
      setLoading(true);
      setMessage(null);
      try {
        const res = await fetch("/api/curriculums");
        const data = await res.json();
        // Find the module for this subject
        const found = data.modules.find(
          (m: CurriculumModule) =>
            m.textbookOrSubject === decodeURIComponent(params.subject)
        );
        setModule(found || null);
        setDescription(found?.title || "");
        if (!found) setMessage("No curriculum found for this subject.");
        else {
          const { nodes, edges } = curriculumToFlow(found);
          setNodes(nodes);
          setEdges(edges);
        }
      } catch (error) {
        setMessage("Failed to load curriculum");
      } finally {
        setLoading(false);
      }
    }
    fetchCurriculum();
    // eslint-disable-next-line
  }, [params.subject]);

  // Auto-fetch all lesson details for verbose view
  useEffect(() => {
    if (!module || !module.curriculum?.chapters) return;
    const allLessons: string[] = [];
    module.curriculum.chapters.forEach((ch: any) => {
      if (ch.lessons) {
        ch.lessons.forEach((lesson: any) => {
          if (lesson.title && !lessonDetails[lesson.title]) {
            allLessons.push(lesson.title);
          }
        });
      }
    });
    if (allLessons.length === 0) return;
    allLessons.forEach(async (lessonName) => {
      setLessonLoading((prev) => ({ ...prev, [lessonName]: true }));
      try {
        const res = await fetch("/api/lesson-details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lessonName }),
        });
        const data = await res.json();
        setLessonDetails((prev) => ({
          ...prev,
          [lessonName]: {
            objectives: data.objectives || "",
            coreConcepts: data.coreConcepts || "",
          },
        }));
      } catch (e) {
        setLessonDetails((prev) => ({
          ...prev,
          [lessonName]: {
            objectives: "Failed to fetch objectives.",
            coreConcepts: "Failed to fetch core concepts.",
          },
        }));
      } finally {
        setLessonLoading((prev) => ({ ...prev, [lessonName]: false }));
      }
    });
    // eslint-disable-next-line
  }, [module]);

  // Add edge handler
  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Add node handler (simple: adds a new node below the last one)
  const handleAddNode = () => {
    const newId = `custom-${nodes.length + 1}`;
    setNodes((nds) => [
      ...nds,
      {
        id: newId,
        type: "handleNode",
        position: { x: 200, y: 100 + nds.length * 100 },
        data: { label: "New Node" },
      },
    ]);
  };

  // Node/edge deletion
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Backspace" || event.key === "Delete") {
        setNodes((nds) =>
          nds.filter((n) => !selectedElements.some((el) => el.id === n.id))
        );
        setEdges((eds) =>
          eds.filter((e) => !selectedElements.some((el) => el.id === e.id))
        );
      }
    },
    [selectedElements, setNodes, setEdges]
  );

  useEffect(() => {
    if (view === "visual") {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [view, handleKeyDown]);

  // On load, restore roadmap from localStorage if present
  useEffect(() => {
    const key = ROADMAP_STORAGE_KEY(params.subject);
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const { nodes: savedNodes, edges: savedEdges } = JSON.parse(saved);
        setNodes(savedNodes);
        setEdges(savedEdges);
      } catch {}
    }
  }, [params.subject, setNodes, setEdges]);

  // Save handler (persist to localStorage)
  const handleSave = () => {
    const key = ROADMAP_STORAGE_KEY(params.subject);
    localStorage.setItem(key, JSON.stringify({ nodes, edges }));
    console.log("Saved nodes:", nodes);
    console.log("Saved edges:", edges);
  };

  // NodeTypes for React Flow
  const nodeTypes = {
    handleNode: (props: any) => <HandleNode {...props} setNodes={setNodes} />,
    default: (props: any) => <HandleNode {...props} setNodes={setNodes} />,
  };

  // React Flow selection handler
  const handleSelectionChange = useCallback((params: any) => {
    // params.nodes and params.edges are arrays of selected nodes/edges
    setSelectedElements([...(params.nodes || []), ...(params.edges || [])]);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#e6e6fa] to-[#b7eacb] p-8">
        <div className="max-w-4xl mx-auto text-center">Loading roadmap...</div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#e6e6fa] to-[#b7eacb] p-8">
        <div className="max-w-4xl mx-auto text-center text-red-600">
          {message || "No curriculum found for this subject."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e6e6fa] to-[#b7eacb] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex flex-col w-full">
            <h1 className="text-4xl font-bold text-black mb-2">
              {module.textbookOrSubject} Roadmap
            </h1>
            <div
              onDoubleClick={() => setEditingDescription(true)}
              style={{ cursor: "pointer", minHeight: 32 }}
            >
              {editingDescription ? (
                <input
                  className="text-lg border rounded p-1 w-full"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() => setEditingDescription(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setEditingDescription(false);
                  }}
                  autoFocus
                />
              ) : (
                <span className="text-lg text-black">
                  {description || (
                    <span className="text-gray-400">
                      Double-click to add a description
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2 bg-white/80 rounded-lg p-1 shadow">
            <button
              className={`px-4 py-2 rounded-l ${
                view === "visual"
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-black"
              }`}
              onClick={() => setView("visual")}
            >
              🗺️ Visual Roadmap
            </button>
            <button
              className={`px-4 py-2 rounded-r ${
                view === "verbose"
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-black"
              }`}
              onClick={() => setView("verbose")}
            >
              📋 Verbose Details
            </button>
          </div>
        </div>
        {view === "visual" ? (
          <ReactFlowProvider>
            <div
              className="mb-8"
              style={{ height: 600, background: "#fff", borderRadius: 12 }}
            >
              <div className="flex gap-2 mb-2">
                <button
                  className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
                  onClick={handleAddNode}
                >
                  + Add Node
                </button>
                <button
                  className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
                  onClick={handleSave}
                >
                  Save
                </button>
              </div>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                onSelectionChange={handleSelectionChange}
              >
                <MiniMap />
                <Controls />
                <Background />
              </ReactFlow>
            </div>
          </ReactFlowProvider>
        ) : (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4" style={{ color: "black" }}>
              Verbose Roadmap
            </h2>
            {module.curriculum.chapters.map((ch: any, idx: number) => (
              <div key={idx} className="mb-6 p-4 bg-white/80 rounded shadow">
                <h3
                  className="text-lg font-bold mb-2"
                  style={{ color: "black" }}
                >
                  {ch.title}
                </h3>
                {ch.lessons && ch.lessons.length > 0 && (
                  <div className="mb-2">
                    <span className="font-semibold" style={{ color: "black" }}>
                      Lessons:
                    </span>
                    <ul className="list-disc ml-6">
                      {ch.lessons.map((lesson: any, i: number) => {
                        const details = lessonDetails[lesson.title] || {};
                        return (
                          <li key={i} className="mb-2 text-black">
                            <span className="font-medium">{lesson.title}</span>
                            <div className="ml-4 mt-1">
                              <div>
                                <span className="font-semibold">
                                  Objectives:
                                </span>
                                <span className="ml-2">
                                  {details.objectives || (
                                    <span className="text-gray-400">
                                      (Loading...)
                                    </span>
                                  )}
                                </span>
                              </div>
                              <div className="mt-1">
                                <span className="font-semibold">
                                  Core Concepts:
                                </span>
                                <span className="ml-2">
                                  {details.coreConcepts || (
                                    <span className="text-gray-400">
                                      (Loading...)
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
