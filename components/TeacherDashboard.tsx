"use client";

import { signOut } from "next-auth/react";
import StudentList from "./StudentList";
import SubjectList from "./SubjectList";

export default function TeacherDashboard() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f3e8ff] via-[#d8b4fe] to-[#c69af1] text-gray-900 flex flex-col">
            {/* Sparkle Overlay */}
            <div className="absolute inset-0 bg-[url('/sparkle.svg')] bg-repeat opacity-10 pointer-events-none mix-blend-screen animate-sparkle" />
            {/* Header */}
            <header className="px-6 py-4 shadow-md text-2xl font-bold">
                <h1 className="text-3xl font-bold text-center mt-5 mb-3">Welcome, Mr Paranjape</h1>
                <p className="text-center text-xl">Take a look at how your students have bloomed</p>
            </header>

            {/* Main Content */}
            <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                {/* Left: Student List */}
                <section className="bg-gradient-to-br from-[#d9f99d]/80 via-[#6ee7b7]/80 to-[#67d664]/80 backdrop-blur rounded-xl shadow-md p-4 overflow-y-auto max-h-[80vh]">
                    <h2 className="text-2xl text-center mt-4 font-semibold mb-6">Your Students</h2>
                    <StudentList />
                </section>
                {/* Right: Subjects */}
                <section className="bg-gradient-to-br from-[#d9f99d]/80 via-[#6ee7b7]/80 to-[#67d664]/80 backdrop-blur rounded-xl shadow-md p-4 overflow-y-auto max-h-[80vh]">
                    <h2 className="text-2xl text-center mt-4 font-semibold mb-6">Your Subjects</h2>
                    <SubjectList />
                </section>
            </main>

            {/* Logout Button */}
            <button
                className="bottom-4 left-4 bg-[#f87171] text-white px-4 py-2 rounded-md shadow-md hover:bg-[#ef4444] transition-colors duration-200 mx-auto mb-6"
                onClick={() => signOut()}
            >
                Logout
            </button>
        </div>
    );
}