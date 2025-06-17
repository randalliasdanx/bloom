"use client";

import React, { useEffect, useState } from "react";
import StudentCard from "./StudentCard";

interface Student {
    id: string;
    name: string;
    username: string;
    preferences?: {
        learning?: string;
        mastery?: string;
    };
    imageUrl?: string;
}

interface Teacher {
  id: string;
  name: string;
  username: string;
}

export default function StudentList() {
    const [teacher, setTeacher] = useState<Teacher | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [usernameInput, setUsernameInput] = useState("");
    const [addError, setAddError] = useState<string | null>(null);
    const [showAddInput, setShowAddInput] = useState(false);

    const fetchTeacherAndStudents = async () => {
        try {
            const res = await fetch("/api/teacher");
        if (!res.ok) {
            console.error("Failed to fetch teacher:", await res.text());
            return;
        }
        const data = await res.json();
        if (!data || !data.id) {
            console.warn("No teacher found.");
            return;
        }
        setTeacher(data);
        const studentRes = await fetch(`/api/students?teacherId=${data.id}`);
        const studentData = await studentRes.json();
        setStudents(studentData);
        } catch (err) {
            console.error("Failed to fetch teacher/students", err);
        }
    };

        useEffect(() => {
            fetchTeacherAndStudents();
    }, []);

    const handleRemoveStudent = async (studentId: string) => {
        const res = await fetch("/api/teacher/remove-student", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                teacherId: teacher?.id,
                studentId: selectedStudent.id
            }),
        });

        if (res.ok) {
            alert("Student removed.");
            setStudents((prev) => prev.filter((s) => s.id !== studentId));
            setSelectedStudent(null);
        } else {
            alert("Failed to remove student.");
        }
    };

    const handleAddStudent = async () => {
        if (!teacher) return;
        setAddError(null);

        const res = await fetch("/api/teacher/add-student", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
            teacherId: teacher.id,
            username: usernameInput.trim(),
            }),
        });

        if (res.ok) {
            setUsernameInput("");
            await fetchTeacherAndStudents(); // refresh list
        } else {
            const { error } = await res.json();
            setAddError(error || "Failed to add student");
        }
    };

    return (
        <section className="bg-white/20 backdrop-blur-lg rounded-xl shadow-xl p-6 m-4 border border-lilac-300/30">
            {selectedStudent ? (
                <div className="mb-4">
                    <button
                        className="text-lg text-green-800 hover:underline mb-2 px-4 py-2 rounded"
                        onClick={() => setSelectedStudent(null)}
                    >
                        Back to Student List
                    </button>
                    <StudentCard student={selectedStudent} onRemove={handleRemoveStudent} />
                </div>
            ) : (
                <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {students.map((student) => (
                        <div
                            key={student.id}
                            onClick={() => setSelectedStudent(student)}
                            className="cursor-pointer bg-white/30 backdrop-blur-sm p-4 rounded-lg hover:shadow-xl hover:scale-[1.02] transition-transform duration-200"
                        >
                            <h3 className="text-lg font-semibold text-[#4a185a]">{student.name}</h3>
                            {student.preferences && (
                                <p className="text-sm mt-1 text-gray-700/70">
                                    Learning: {student.preferences.learning || "N/A"} <br />
                                    Mastery: {student.preferences.mastery || "N/A"}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
                {/* Add Student button */}
                <div className="mt-6 flex flex-col sm:flex-row items-center gap-4 justify-center">
                    {!showAddInput ? (
                        <button
                            onClick={() => setShowAddInput(true)}
                            className="bg-[#a78bfa] hover:bg-[#8b5cf6] text-white font-semibold px-6 py-2 rounded-md shadow"
                        >
                            Add Student
                        </button>
                    ) : (
                        <>
                            <input
                                type="text"
                                placeholder="Enter student username"
                                value={usernameInput}
                                onChange={(e) => setUsernameInput(e.target.value)}
                                className="px-4 py-2 border rounded-md w-64"
                            />
                            <button
                                onClick={handleAddStudent}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow"
                            >
                                Confirm Add
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddInput(false);
                                    setUsernameInput("");
                                    setAddError(null);
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md shadow"
                            >
                                Cancel
                            </button>
                        </>
                    )}
                </div>
                {addError && (
                    <p className="text-red-600 text-center mt-2">{addError}</p>
                )}
                </>
            )}
        </section>  
    );
}
