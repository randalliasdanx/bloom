"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface CurriculumModule {
  id: string;
  title: string;
  curriculum: { chapters: any[] };
  textbookOrSubject?: string;
}

export default function TeacherUploadPage() {
  const [pdfjsLib, setPdfjsLib] = useState<any>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [useExtractedText, setUseExtractedText] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [curriculumGenerated, setCurriculumGenerated] = useState(false);
  const [modules, setModules] = useState<CurriculumModule[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [textbookOrSubject, setTextbookOrSubject] = useState("");
  const [openTextbook, setOpenTextbook] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmType, setDeleteConfirmType] = useState<
    "subject" | "curriculum" | "chapter" | null
  >(null);
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(
    null
  );
  const [editingChapter, setEditingChapter] = useState<{
    id: string;
    index: number;
  } | null>(null);
  const [editedChapterContent, setEditedChapterContent] = useState("");

  const router = useRouter();

  // Dynamically load pdfjs-dist and set workerSrc only on client
  useEffect(() => {
    import("pdfjs-dist/build/pdf.mjs").then((mod) => {
      mod.GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs";
      setPdfjsLib(mod);
    });
  }, []);

  // Fetch curriculums on mount
  useEffect(() => {
    fetch("/api/curriculums")
      .then((res) => res.json())
      .then((data) => {
        setModules(data.modules || []);
        if (data.modules?.length) setSelectedId(data.modules[0].id);
      });
  }, [curriculumGenerated]);

  const selected = modules.find((m) => m.id === selectedId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
      setExtractedText("");
      setUseExtractedText(false);
      setMessage(null);
    }
  };

  const handleExtractText = async () => {
    if (!pdfFile) {
      setMessage("Please select a PDF file first.");
      return;
    }
    if (!pdfjsLib) {
      setMessage("PDF.js is still loading, please wait.");
      return;
    }

    setLoading(true);
    setMessage(null);
    setExtractedText("");
    setUseExtractedText(false);

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
      }).promise;

      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map((item: any) => item.str).join(" ");
        fullText += strings + "\n";
      }

      setExtractedText(fullText.trim());
      setUseExtractedText(true);
      setMessage("Text extracted! You can review or edit before submitting.");
    } catch (error: any) {
      console.error("Extraction error:", error);
      setMessage("Failed to extract text from PDF: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!pdfFile && !useExtractedText) {
      setMessage("Please select a PDF or extract text first.");
      return;
    }

    setLoading(true);
    setMessage("Processing...");
    setProgress(0);
    setCurriculumGenerated(false);

    try {
      let body:
        | FormData
        | { text: string; textbookOrSubject?: string }
        | { textChunks: string[]; textbookOrSubject?: string };
      let chunkCount = 1;
      let useChunking = false;
      let chunks: string[] = [];

      if (useExtractedText && extractedText.trim().length > 0) {
        if (extractedText.length > 4000) {
          useChunking = true;
          chunks = chunkText(extractedText, 4000);
          body = { textChunks: chunks, textbookOrSubject };
          chunkCount = chunks.length;
        } else {
          body = { text: extractedText, textbookOrSubject };
        }
      } else if (pdfFile) {
        const formData = new FormData();
        formData.append("pdf", pdfFile);
        if (textbookOrSubject.trim()) {
          formData.append("textbookOrSubject", textbookOrSubject.trim());
        }
        body = formData;
      } else {
        setMessage("No valid input to submit.");
        setLoading(false);
        return;
      }

      // If chunking, send each chunk individually and update progress
      if (useChunking) {
        let allSuccess = true;
        for (let i = 0; i < chunks.length; i++) {
          const res = await fetch("/api/teacher-upload", {
            method: "POST",
            body: JSON.stringify({
              text: chunks[i],
              textbookOrSubject: textbookOrSubject.trim(),
            }),
            headers: { "Content-Type": "application/json" },
          });
          setProgress(Math.round(((i + 1) / chunkCount) * 100));
          if (!res.ok) {
            allSuccess = false;
            const data = await res.json();
            setMessage(
              data.error || "Failed to generate curriculum for chunk " + (i + 1)
            );
            break;
          }
        }
        if (allSuccess) {
          setMessage("Curriculum generated and saved!");
          setCurriculumGenerated(true);
        }
      } else {
        const res = await fetch("/api/teacher-upload", {
          method: "POST",
          body: body instanceof FormData ? body : JSON.stringify(body),
          headers:
            body instanceof FormData
              ? undefined
              : { "Content-Type": "application/json" },
        });
        const data = await res.json();
        if (res.ok) {
          setMessage("Curriculum generated and saved!");
          setCurriculumGenerated(true);
        } else {
          setMessage(data.error || "Failed to generate curriculum.");
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage("Upload failed.");
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  function chunkText(text: string, maxLength = 4000): string[] {
    const chunks: string[] = [];
    let start = 0;
    while (start < text.length) {
      chunks.push(text.slice(start, start + maxLength));
      start += maxLength;
    }
    return chunks;
  }

  // Group modules by textbookOrSubject
  const grouped = modules.reduce((acc, mod) => {
    const key = mod.textbookOrSubject || "Untitled Textbook/Subject";
    (acc[key] = acc[key] || []).push(mod);
    return acc;
  }, {} as Record<string, CurriculumModule[]>);

  // Add function to handle curriculum deletion
  const handleDeleteCurriculum = async (id: string) => {
    if (!confirm("Are you sure you want to delete this curriculum?")) return;

    try {
      const res = await fetch(`/api/curriculums/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setModules(modules.filter((m) => m.id !== id));
        setSelectedId(null);
        setMessage("Curriculum deleted successfully");
      } else {
        setMessage("Failed to delete curriculum");
      }
    } catch (error) {
      setMessage("Error deleting curriculum");
    }
  };

  // Add function to handle curriculum rename
  const handleRenameCurriculum = async (id: string) => {
    if (!newTitle.trim()) {
      setMessage("Title cannot be empty");
      return;
    }

    try {
      const res = await fetch(`/api/curriculums/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: newTitle }),
      });

      if (res.ok) {
        setModules(
          modules.map((m) => (m.id === id ? { ...m, title: newTitle } : m))
        );
        setEditingTitle(null);
        setNewTitle("");
        setMessage("Curriculum renamed successfully");
      } else {
        setMessage("Failed to rename curriculum");
      }
    } catch (error) {
      setMessage("Error renaming curriculum");
    }
  };

  // Add function to handle chapter deletion
  const handleDeleteChapter = async (
    curriculumId: string,
    chapterIndex: number
  ) => {
    if (!confirm("Are you sure you want to delete this chapter?")) return;

    try {
      const updatedModule = modules.find((m) => m.id === curriculumId);
      if (!updatedModule) return;

      const updatedChapters = [...updatedModule.curriculum.chapters];
      updatedChapters.splice(chapterIndex, 1);

      const res = await fetch(`/api/curriculums/${curriculumId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          curriculum: { chapters: updatedChapters },
        }),
      });

      if (res.ok) {
        setModules(
          modules.map((m) =>
            m.id === curriculumId
              ? { ...m, curriculum: { chapters: updatedChapters } }
              : m
          )
        );
        setMessage("Chapter deleted successfully");
      } else {
        setMessage("Failed to delete chapter");
      }
    } catch (error) {
      setMessage("Error deleting chapter");
    }
  };

  // Add function to handle subject deletion
  const handleDeleteSubject = async (subjectName: string) => {
    try {
      const modulesToDelete = modules.filter(
        (m) => m.textbookOrSubject === subjectName
      );
      const deletePromises = modulesToDelete.map((module) =>
        fetch(`/api/curriculums/${module.id}`, {
          method: "DELETE",
        })
      );

      const results = await Promise.all(deletePromises);
      const allSuccessful = results.every((res) => res.ok);

      if (allSuccessful) {
        setModules(modules.filter((m) => m.textbookOrSubject !== subjectName));
        setSelectedId(null);
        setMessage(
          `Successfully deleted subject "${subjectName}" and all its curriculums`
        );
      } else {
        setMessage("Failed to delete some curriculums");
      }
    } catch (error) {
      setMessage("Error deleting subject");
    } finally {
      setDeleteConfirmId(null);
      setDeleteConfirmType(null);
    }
  };

  // Add function to handle chapter content update
  const handleUpdateChapterContent = async (
    curriculumId: string,
    chapterIndex: number
  ) => {
    try {
      const updatedModule = modules.find((m) => m.id === curriculumId);
      if (!updatedModule) return;

      const updatedChapters = [...updatedModule.curriculum.chapters];
      updatedChapters[chapterIndex] = {
        ...updatedChapters[chapterIndex],
        content: editedChapterContent,
      };

      const res = await fetch(`/api/curriculums/${curriculumId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          curriculum: { chapters: updatedChapters },
        }),
      });

      if (res.ok) {
        setModules(
          modules.map((m) =>
            m.id === curriculumId
              ? { ...m, curriculum: { chapters: updatedChapters } }
              : m
          )
        );
        setMessage("Chapter content updated successfully");
        setEditingChapter(null);
        setEditedChapterContent("");
      } else {
        setMessage("Failed to update chapter content");
      }
    } catch (error) {
      setMessage("Error updating chapter content");
    }
  };

  const ConfirmationDialog = ({
    type,
    id,
    index,
    onConfirm,
    onCancel,
  }: {
    type: "subject" | "curriculum" | "chapter";
    id: string;
    index?: number;
    onConfirm: () => void;
    onCancel: () => void;
  }) => {
    const getMessage = () => {
      switch (type) {
        case "subject":
          return `Delete "${id}" and all its curriculums?`;
        case "curriculum":
          const curriculum = modules.find((m) => m.id === id);
          return `Delete curriculum "${curriculum?.title}"?`;
        case "chapter":
          const module = modules.find((m) => m.id === id);
          const chapter = module?.curriculum.chapters[index!];
          return `Delete chapter "${chapter?.title}"?`;
        default:
          return "Are you sure?";
      }
    };

    return (
      <div className="absolute bg-white border rounded-lg shadow-lg p-3 z-10">
        <p className="text-sm mb-2 text-black">{getMessage()}</p>
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
          >
            Yes
          </button>
          <button
            onClick={onCancel}
            className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
          >
            No
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#e6e6fa] to-[#b7eacb]">
      {/* Sidebar */}
      <aside className="w-64 bg-white/80 border-r border-green-200 p-4">
        <h2 className="text-lg font-bold mb-4 text-green-700">
          Your Curriculums
        </h2>
        {Object.entries(grouped).map(([textbook, mods]) => (
          <div key={textbook} className="relative">
            <div className="flex items-center justify-between group">
              <button
                onClick={() =>
                  setOpenTextbook(openTextbook === textbook ? null : textbook)
                }
                className="font-bold w-full text-left mb-1 px-2 py-1 rounded"
                style={{ color: "black" }}
              >
                {textbook}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirmId(textbook);
                  setDeleteConfirmType("subject");
                }}
                className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800 px-2"
                title="Delete entire subject"
              >
                🗑️
              </button>
              {deleteConfirmId === textbook &&
                deleteConfirmType === "subject" && (
                  <ConfirmationDialog
                    type="subject"
                    id={textbook}
                    onConfirm={() => handleDeleteSubject(textbook)}
                    onCancel={() => {
                      setDeleteConfirmId(null);
                      setDeleteConfirmType(null);
                    }}
                  />
                )}
            </div>
            {openTextbook === textbook && (
              <ul>
                {mods.map((mod) => (
                  <li
                    key={mod.id}
                    className="flex items-center justify-between group relative"
                  >
                    <button
                      className={`w-full text-left px-2 py-1 rounded mb-1 ${
                        selectedId === mod.id
                          ? "bg-green-200 font-bold"
                          : "hover:bg-green-100"
                      }`}
                      style={{ color: "black" }}
                      onClick={() =>
                        setSelectedId(selectedId === mod.id ? null : mod.id)
                      }
                    >
                      {mod.title}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(mod.id);
                        setDeleteConfirmType("curriculum");
                      }}
                      className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800 px-2"
                      title="Delete curriculum"
                    >
                      🗑️
                    </button>
                    {deleteConfirmId === mod.id &&
                      deleteConfirmType === "curriculum" && (
                        <ConfirmationDialog
                          type="curriculum"
                          id={mod.id}
                          onConfirm={() => handleDeleteCurriculum(mod.id)}
                          onCancel={() => {
                            setDeleteConfirmId(null);
                            setDeleteConfirmType(null);
                          }}
                        />
                      )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </aside>
      {/* Main content */}
      <main className="flex-1 p-8">
        <div className="max-w-2xl mx-auto p-8">
          <h1 className="text-3xl font-bold mb-6">
            <span style={{ color: "black" }}>Teacher Curriculum Builder</span>
          </h1>

          <div className="mb-6">
            <label
              className="block mb-2 font-semibold"
              style={{ color: "black" }}
            >
              Attach a Textbook PDF
            </label>
            <div className="flex flex-col gap-3">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="block w-full text-sm text-black
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-green-600 file:text-black
                  hover:file:bg-green-700
                  file:cursor-pointer
                  cursor-pointer"
              />
              {pdfFile && (
                <div className="text-green-700">Selected: {pdfFile.name}</div>
              )}
            </div>
            <button
              className="bg-green-600 text-black px-4 py-1 rounded hover:bg-green-700 transition mt-3"
              onClick={handleExtractText}
              disabled={loading || !pdfFile}
            >
              <span style={{ color: "black" }}>Extract Text from PDF</span>
            </button>
          </div>

          {useExtractedText && (
            <div className="mb-6">
              <label
                className="block mb-2 font-semibold"
                style={{ color: "black" }}
              >
                Extracted Text Preview
              </label>
              <textarea
                className="w-full border rounded p-2 text-black"
                rows={10}
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
              />
              <div className="text-sm mt-1" style={{ color: "black" }}>
                You can edit the text before submitting if needed.
              </div>
            </div>
          )}

          {progress > 0 && loading && (
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div
                className="bg-green-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}

          <div className="mb-6">
            <label
              className="block mb-2 font-semibold"
              style={{ color: "black" }}
            >
              Textbook or Subject Name
            </label>
            <input
              type="text"
              value={textbookOrSubject}
              onChange={(e) => setTextbookOrSubject(e.target.value)}
              placeholder="Enter textbook or subject name"
              className="mb-2 w-full border rounded p-2 text-black"
              style={{ color: "black" }}
            />
            {!textbookOrSubject.trim() && (
              <div className="text-red-600 text-sm mt-1">
                Please include a textbook or subject name
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={
              loading ||
              (!pdfFile && !useExtractedText) ||
              (useExtractedText && extractedText.trim().length === 0) ||
              !textbookOrSubject.trim()
            }
            className="bg-green-700 text-black px-6 py-2 rounded font-semibold hover:bg-green-800 transition mr-2"
          >
            {loading ? "Processing..." : "Generate Curriculum"}
          </button>

          {message && <div className="mt-4 text-green-700">{message}</div>}
        </div>
        {/* Curriculum display */}
        {selectedId && selected ? (
          <div className="max-w-2xl mx-auto p-8">
            <div className="flex items-center justify-between mb-4">
              {editingTitle === selected.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="text-2xl font-bold text-green-700 border rounded p-1"
                    placeholder="Enter new title"
                  />
                  <button
                    onClick={() => handleRenameCurriculum(selected.id)}
                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingTitle(null);
                      setNewTitle("");
                    }}
                    className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-green-700">
                    {selected.title}
                  </h1>
                  <button
                    onClick={() => {
                      setEditingTitle(selected.id);
                      setNewTitle(selected.title);
                    }}
                    className="text-gray-600 hover:text-gray-800"
                    title="Rename curriculum"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `Are you sure you want to delete the entire curriculum "${selected.title}"?`
                        )
                      ) {
                        handleDeleteCurriculum(selected.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-800"
                    title="Delete entire curriculum"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
            {selected.curriculum.chapters?.map((chapter, idx) => (
              <div
                key={idx}
                className="mb-6 border rounded-lg p-4 bg-white/50 relative"
              >
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold" style={{ color: "black" }}>
                    {chapter.title}
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingChapter({ id: selected.id, index: idx });
                        setEditedChapterContent(chapter.content);
                      }}
                      className="text-gray-600 hover:text-gray-800"
                      title="Edit chapter content"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => {
                        setDeleteConfirmId(selected.id);
                        setDeleteConfirmType("chapter");
                        setDeleteConfirmIndex(idx);
                      }}
                      className="text-red-600 hover:text-red-800"
                      title="Delete chapter"
                    >
                      🗑️
                    </button>
                    {deleteConfirmId === selected.id &&
                      deleteConfirmType === "chapter" &&
                      deleteConfirmIndex === idx && (
                        <ConfirmationDialog
                          type="chapter"
                          id={selected.id}
                          index={idx}
                          onConfirm={() =>
                            handleDeleteChapter(selected.id, idx)
                          }
                          onCancel={() => {
                            setDeleteConfirmId(null);
                            setDeleteConfirmType(null);
                            setDeleteConfirmIndex(null);
                          }}
                        />
                      )}
                  </div>
                </div>
                {editingChapter?.id === selected.id &&
                editingChapter?.index === idx ? (
                  <div className="mt-2">
                    <textarea
                      value={editedChapterContent}
                      onChange={(e) => setEditedChapterContent(e.target.value)}
                      className="w-full border rounded p-2 text-black min-h-[200px]"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() =>
                          handleUpdateChapterContent(selected.id, idx)
                        }
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingChapter(null);
                          setEditedChapterContent("");
                        }}
                        className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mb-2" style={{ color: "black" }}>
                    {chapter.content}
                  </p>
                )}
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
        ) : null}
      </main>
    </div>
  );
}
