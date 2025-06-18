import React from "react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-green-100">
      <header className="mb-12 text-center">
        <h1
          className="text-6xl font-extrabold text-green-700 mb-2 tracking-tight"
          style={{ fontFamily: 'var(--font-arvo)' }}
        >
          bloom
        </h1>
        <p className="text-xl text-gray-700 font-medium">
          Personalized AI-powered learning for everyone
        </p>
      </header>
      <section className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8 mb-10">
        <h2 className="text-2xl font-bold mb-4 text-blue-800">Features</h2>
        <ul className="list-disc list-inside text-lg text-gray-700 space-y-2">
          <li>Personalized student onboarding & learning preferences</li>
          <li>AI-generated roadmaps for every module</li>
          <li>Adaptive assessments with mastery-based progression</li>
          <li>Auditory, visual, and kinesthetic learning support</li>
          <li>Teacher and student dashboards</li>
          <li>
            Text-to-speech and video lessons with your favorite characters
          </li>
          <li>Progress tracking and feedback</li>
        </ul>
      </section>
      <div className="flex space-x-6">
        <Link href="/signin" legacyBehavior>
          <a className="px-8 py-3 bg-blue-600 text-white rounded-lg text-lg font-semibold shadow hover:bg-blue-700 transition">
            Sign In
          </a>
        </Link>
        <Link href="/signup" legacyBehavior>
          <a className="px-8 py-3 bg-green-600 text-white rounded-lg text-lg font-semibold shadow hover:bg-green-700 transition">
            Sign Up
          </a>
        </Link>
      </div>
      <footer className="mt-16 text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} bloom. All rights reserved.
      </footer>
    </div>
  );
}
