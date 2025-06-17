"use client";

import Image from "next/image";
import React from 'react';

interface SubjectProgress {
  name: string;
  progress: number;
}

interface Student {
  id: string;
  name: string;
  imageUrl?: string;
  enrolled: SubjectProgress[];
  preferences?: {
    learning?: string;
    mastery?: string;
  };
}

interface Props {
  student: Student;
}

export default function StudentCard({ student, onRemove }: Props) {
  return (
    <div className="bg-white/30 backdrop-blur-lg rounded-xl shadow-lg mt-2 p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#4a185a] mb-1">
            {student.name}
          </h2>
          {student.preferences && (
            <p className="text-lg text-gray-600 font-semibold mb-2">
              Learning Style: {student.preferences.learning || "N/A"}<br />
              Mastery Level: {student.preferences.mastery || "N/A"}
            </p>
          )}
        </div>
        <Image
          src={student.imageUrl || "/images/default.jpg"}
          alt={student.name}
          width={80}
          height={80}
          className="rounded-full object-cover border shadow"
        />
      </div>

      <div className="space-y-3">
        {student.enrolled?.map((subj) => (
          <div key={subj.name}>
            <div className="flex justify-between mb-1">
              <span className="text-lg font-semibold text-[#4a185a]">
                {subj.name}
              </span>
              <span
                onClick={() => alert(`Show roadmap for ${student.name}'s ${subj.name} progress`)}
                className="text-md text-purple-800"
              >
                {subj.progress}%
              </span>
            </div>
            <div 
              className="w-full bg-gray-200 rounded-full h-5 cursor-pointer group"
              onClick={() => alert(`Show roadmap for ${student.name}'s ${subj.name} progress`)}
            >
              <div
                className="bg-gradient-to-r from-purple-400 to-green-400 h-5 rounded-full transition-all duration-300 transform group-hover:scale-105 group-hover:shadow-lg"
                style={{ width: `${subj.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      {/* Remove Student Button */}
      <div className="mt-6 flex justify-center">
        <button
          className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded-lg shadow-md transition-colors"
          onClick={() => {
            if (confirm(`Remove ${student.name} from this teacher?`)) {
              onRemove?.(student.id);
            }
          }}
        >
          Remove Student
        </button>
      </div>
    </div>
  );
}