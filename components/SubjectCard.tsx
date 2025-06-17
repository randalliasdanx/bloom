"use client";

import React from "react";
import { useState, useEffect } from "react";
import UploadMaterialModal from "./UploadMaterialModal";
import ViewMaterialModal from "./ViewMaterialModal";

interface Student {
  id: string;
  name: string;
  progress: number;
}

interface Subject {
  id: string;
  name: string;
  enrolled: Student[];
}

interface Material {
  name: string;
  link: string;
}

interface Props {
  subject: Subject;
}


export default function SubjectCard({ subject }: Props) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [mode, setMode] = useState<"add" | "remove" | null>(null);

  useEffect(() => {
    const fetchMaterials = async () => {
      const res = await fetch(`/api/materials?subjectId=${subject.id}`);
      const raw = await res.json();
      const mapped = raw.map((m: any) => ({
        title: m.title,
        link: m.contentUrl,
      }));
      setMaterials(mapped);
    };
    fetchMaterials();
  }, [subject.id]);

  useEffect(() => {
    const fetchAllStudents = async () => {
      const res = await fetch("/api/students"); 
      const data = await res.json();
      setAllStudents(data);
    };
    fetchAllStudents();
  }, []);
  
  const handleUpload = async (material: Material) => {
    setMaterials(prev => [...prev, material]);
    const res = await fetch(`/api/materials?subjectId=${subject.id}`);
    const data = await res.json();
    setMaterials(data);
  };

  return (
    <div className="bg-white/30 backdrop-blur-lg rounded-xl shadow-lg p-6 flex flex-col gap-4">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-[#4a185a]">{subject.name}</h2>
        <div className=" flex gap-5">
            <ViewMaterialModal subject={subject} materials={materials} setMaterials={setMaterials} />
            <UploadMaterialModal subject={subject} onUpload={handleUpload} />
        </div>
      </div>

      <div className="space-y-4">
        {subject.enrolled?.map((student) => (
          <div key={`${student.id}-${subject.id}`}>
            <div className="flex justify-between mb-1 mt-3">
              <span className="text-lg font-semibold text-[#4a185a]">
                {student.name}
              </span>
              <span className="text-md text-purple-800">{student.progress}%</span>
            </div>
            <div
              className="group w-full bg-gray-200 rounded-full h-5 cursor-pointer"
              onClick={() => alert(`Show roadmap for ${student.name}`)}
            >
              <div
                className="bg-gradient-to-r from-purple-400 to-green-400 h-5 rounded-full transition-transform duration-300 transform group-hover:scale-105 group-hover:shadow-md"
                style={{ width: `${student.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4 justify-center mt-6">
        <button
          onClick={() => {
            setMode("add");
            setSelectedStudentId("");
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          Add Student
        </button>
        <button
          onClick={() => {
            setMode("remove");
            setSelectedStudentId("");
          }}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
        >
          Remove Student
        </button>
      </div>
      {mode && (
      <div className="mt-4 flex flex-col sm:flex-row items-center gap-4 justify-center">
        <select
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
          className="px-4 py-2 border rounded-md w-64"
        >
          <option value="">
            {mode === "add" ? "Select student to add" : "Select student to remove"}
          </option>
          {(mode === "add"
            ? allStudents.filter((s) => !subject.enrolled.some((e) => e.id === s.id))
            : subject.enrolled
          ).map((student) => (
            <option key={student.id} value={student.id}>
              {student.name}
            </option>
          ))}
        </select>
        <button
          disabled={!selectedStudentId}
          onClick={async () => {
            const endpoint =
              mode === "add" ? "/api/subjects/enroll" : "/api/subjects/remove";
            const res = await fetch(endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                subjectId: subject.id,
                studentId: selectedStudentId,
              }),
            });

            if (res.ok) {
              window.location.reload();
            } else {
              alert(`${mode === "add" ? "Add" : "Remove"} failed`);
            }
          }}
          className={`${
            mode === "add" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
          } text-white px-4 py-2 rounded shadow`}
        >
          Confirm {mode === "add" ? "Add" : "Remove"}
        </button>

        <button
          onClick={() => {
            setMode(null);
            setSelectedStudentId("");
          }}
          className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded shadow"
        >
          Cancel
        </button>
      </div>
    )}
    </div>  
  );
}