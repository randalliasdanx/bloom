"use client";

import React, { useEffect, useState } from "react";
import SubjectCard from "./SubjectCard";

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

interface Teacher {
  id: string;
  name: string;
  username: string;
}

export default function SubjectList() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [showAddInput, setShowAddInput] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [teacher, setTeacher] = useState<Teacher | null>(null);

  const handleAddSubject = async () => {
    if (!newSubjectName || !teacher) return;

    console.log("Adding subject:", newSubjectName, "for teacher:", teacher);

    try {
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSubjectName, teacherId: teacher.id }),
      });

      console.log("POST /api/subjects response:", res.status);

      if (res.ok) {
        const newSubj = await res.json();
        setSubjects((prev) => [...prev, { ...newSubj, enrolled: [] }]);
        setShowAddInput(false);
        setNewSubjectName("");
      } else {
        const error = await res.text();
        console.error("Failed to add subject:", error);
      }
    } catch (err) {
      console.error("ERROR during subject creation:", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const teacherRes = await fetch("/api/teacher");
        const teacherData = await teacherRes.json();
        setTeacher(teacherData);

        const subjectRes = await fetch("/api/subjects?teacherId=" + teacherData.id);
        const subjectData = await subjectRes.json();
        setSubjects(subjectData);
      } catch (err) {
        console.error("Failed to load teacher or subjects", err);
      }
    };

    fetchData();
  }, []);

  return (
    <section className="bg-white/20 backdrop-blur-lg rounded-xl shadow-xl p-6 m-4 border border-lilac-300/30">
      {selectedSubject ? (
        <div className="mb-4">
          <button
            className="text-lg text-green-800 hover:underline mb-4 px-4 py-2 rounded"
            onClick={() => setSelectedSubject(null)}
          >
            Back to Subject List
          </button>
          <SubjectCard subject={selectedSubject} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subject) => (
              <button
                key={subject.id}
                onClick={() => setSelectedSubject(subject)}
                className="text-left bg-white/30 backdrop-blur-sm p-4 rounded-lg hover:shadow-xl hover:scale-[1.02] transition-transform duration-200"
              >
                <h3 className="text-lg font-semibold text-[#4a185a]">{subject.name}</h3>
                <p className="text-sm mt-1 text-gray-700/70">
                  Enrolled Students: {subject.enrolled.length}
                </p>
              </button>
            ))}
          </div>

          {/* Add Subject button */}
          {showAddInput ? (
            <div className="mt-4 flex flex-col sm:flex-row items-center gap-4 justify-center">
              <input
                type="text"
                placeholder="Enter subject name"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                className="px-4 py-2 border rounded-md w-64"
              />
              <button
                onClick={handleAddSubject}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow"
              >
                Confirm Add
              </button>
              <button
                onClick={() => {
                  setShowAddInput(false);
                  setNewSubjectName("");
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md shadow"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="mt-6 flex justify-center">
              <button
                className="bg-[#a78bfa] hover:bg-[#8b5cf6] text-white font-semibold px-6 py-2 rounded-lg shadow-md transition-colors"
                onClick={() => setShowAddInput(true)}
              >
                Add Subject
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

