// components/InteractiveRoadmap.tsx
"use client";

import React, { useEffect, useState, MouseEvent, useRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
  OnConnect,
  NodeMouseHandler,
} from "reactflow";
import "reactflow/dist/style.css";
import { useRouter } from "next/navigation";
import { supabase } from "../utils/supabaseClient";

// Define roadmap structure types
type Lesson = { title: string };
type Chapter = { title: string; lessons: Lesson[] };
type Unit = { title: string; chapters: Chapter[] };
type Roadmap = { units: Unit[] };
type EditableNode = Node & { data: { label: string; isChapter: boolean } };

function slugify(str: string) {
  return str.toLowerCase().replace(/ /g, "-");
}

export default function InteractiveRoadmap({ roadmap }: { roadmap: Roadmap }) {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState<EditableNode[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  const [contextMenu, setContextMenu] = useState<{
    nodeId: string;
    x: number;
    y: number;
  } | null>(null);
  const [renamingNodeId, setRenamingNodeId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>("");
  const [renamePosition, setRenamePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const flowWrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const newNodes: EditableNode[] = [];
    const newEdges: Edge[] = [];
    let y = 0;
    let nodeId = 1;

    roadmap.units.forEach((unit, unitIndex) => {
      unit.chapters.forEach((chapter, chIndex) => {
        const chapterNodeId = `${nodeId++}`;
        newNodes.push({
          id: chapterNodeId,
          data: { label: chapter.title, isChapter: true },
          position: { x: 200 * chIndex + 50, y },
          type: "default",
        });

        chapter.lessons.forEach((lesson, lIndex) => {
          const lessonNodeId = `${nodeId++}`;
          newNodes.push({
            id: lessonNodeId,
            data: { label: lesson.title, isChapter: false },
            position: { x: 200 * chIndex + 50, y: y + 150 + lIndex * 100 },
            type: "default",
          });

          newEdges.push({
            id: `e${chapterNodeId}-${lessonNodeId}`,
            source: chapterNodeId,
            target: lessonNodeId,
          });
        });
      });
      y += 400;
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [roadmap]);

  const onConnect: OnConnect = (params: Connection) => {
    setEdges((eds) => addEdge(params, eds));
  };

  const addNode = () => {
    const id = `${nodes.length + 1}`;
    const newNode: EditableNode = {
      id,
      data: { label: `New Lesson ${id}`, isChapter: false },
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      type: "default",
    };
    setNodes((nds) => [...nds, newNode]);
  };

  // Single click: open lessons for chapter, or go to lesson page for lessons
  const handleNodeClick: NodeMouseHandler = (_, node) => {
    if (node.data.isChapter) {
      router.push(`/chapter/${slugify(node.data.label)}`);
    } else {
      router.push(`/lesson/${slugify(node.data.label)}`);
    }
  };

  // Right click: open context menu for chapter nodes
  const handleNodeContextMenu: NodeMouseHandler = (event, node) => {
    event.preventDefault();
    if (node.data.isChapter) {
      setContextMenu({ nodeId: node.id, x: event.clientX, y: event.clientY });
    }
  };

  // Rename logic
  const startRename = () => {
    if (contextMenu) {
      const node = nodes.find((n) => n.id === contextMenu.nodeId);
      if (node) {
        setRenamingNodeId(node.id);
        setRenameValue(node.data.label);
        setRenamePosition(node.position);
      }
      setContextMenu(null);
    }
  };
  const saveRename = () => {
    if (renamingNodeId) {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === renamingNodeId
            ? { ...n, data: { ...n.data, label: renameValue } }
            : n
        )
      );
      setRenamingNodeId(null);
    }
  };
  // Delete logic
  const deleteNode = () => {
    if (contextMenu) {
      setNodes((nds) => nds.filter((n) => n.id !== contextMenu.nodeId));
      setEdges((eds) =>
        eds.filter(
          (e) =>
            e.source !== contextMenu.nodeId && e.target !== contextMenu.nodeId
        )
      );
      setContextMenu(null);
    }
  };

  useEffect(() => {
    const persistChanges = async () => {
      await supabase.from("roadmap_state").upsert({
        id: 1,
        nodes,
        edges,
      });
    };
    persistChanges();
  }, [nodes, edges]);

  return (
    <div
      ref={flowWrapper}
      className="relative"
      style={{ width: "100%", height: "85vh" }}
    >
      <button
        onClick={addNode}
        className="absolute top-4 left-4 z-10 px-4 py-2 bg-green-300 hover:bg-green-400 text-black rounded shadow"
      >
        + Add Node
      </button>

      {/* Context Menu for Chapter Nodes */}
      {contextMenu && (
        <div
          className="absolute z-30 bg-white border rounded shadow-md py-1 px-2"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            className="block w-full text-left px-2 py-1 hover:bg-gray-100"
            onClick={startRename}
          >
            Rename
          </button>
          <button
            className="block w-full text-left px-2 py-1 hover:bg-gray-100 text-red-600"
            onClick={deleteNode}
          >
            Delete
          </button>
        </div>
      )}

      {/* Rename Modal/Input */}
      {renamingNodeId && renamePosition && (
        <div
          className="absolute z-40 bg-white border rounded shadow-md p-4 flex gap-2 items-center"
          style={{
            left: renamePosition.x,
            top: renamePosition.y - 50, // 50px above the node
            transform: "translate(-50%, -100%)",
          }}
        >
          <input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveRename()}
            className="border border-gray-400 rounded px-2 py-1 bg-white"
            autoFocus
          />
          <button
            onClick={saveRename}
            className="bg-green-300 hover:bg-green-400 px-3 py-1 rounded"
          >
            Save
          </button>
          <button
            onClick={() => setRenamingNodeId(null)}
            className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
          >
            Cancel
          </button>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onNodeContextMenu={handleNodeContextMenu}
        fitView
      >
        <MiniMap
          nodeColor={() => "#a3c9a8"}
          maskColor="rgba(230, 230, 250, 0.2)"
        />
        <Controls />
        <Background gap={16} color="#dcd6f7" />
      </ReactFlow>
    </div>
  );
}
