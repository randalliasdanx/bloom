"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../utils/supabaseClient";

const learningStyles = ["Visual", "Auditory", "Kinesthetic"];
const levels = ["Beginner", "Intermediate", "Advanced"];
const masteryGoals = ["Basic Understanding", "Proficient", "Expert"];
const classTypes = ["Teacher Class", "Self Learner"];

const UserPreferences: React.FC = () => {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    learning_style: "",
    level: "",
    mastery_goal: "",
    class_type: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleNext = () => {
    setError(null);
    if (step === 0 && !form.learning_style)
      setError("Select a learning style.");
    else if (step === 1 && !form.level) setError("Select your level.");
    else if (step === 2 && !form.mastery_goal)
      setError("Select your mastery goal.");
    else if (step === 3 && !form.class_type) setError("Select a class type.");
    else setStep(step + 1);
  };

  const handleBack = () => setStep(step - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      setError("User not authenticated.");
      setLoading(false);
      return;
    }
    const { error } = await supabase
      .from("student_preferences")
      .insert([{ user_id: user.id, ...form }]);
    setLoading(false);
    if (error) setError(error.message);
    else router.push("/dashboard");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white/80 p-8 rounded shadow-md w-96"
      >
        <h2 className="text-2xl font-bold mb-6 text-center bloom-green">
          User Preferences
        </h2>
        {step === 0 && (
          <div>
            <label className="block mb-2">Learning Style</label>
            <select
              name="learning_style"
              value={form.learning_style}
              onChange={handleChange}
              className="w-full mb-4 p-2 border rounded"
            >
              <option value="">Select...</option>
              {learningStyles.map((style) => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </select>
          </div>
        )}
        {step === 1 && (
          <div>
            <label className="block mb-2">Current Level</label>
            <select
              name="level"
              value={form.level}
              onChange={handleChange}
              className="w-full mb-4 p-2 border rounded"
            >
              <option value="">Select...</option>
              {levels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
        )}
        {step === 2 && (
          <div>
            <label className="block mb-2">Aspired Mastery Level</label>
            <select
              name="mastery_goal"
              value={form.mastery_goal}
              onChange={handleChange}
              className="w-full mb-4 p-2 border rounded"
            >
              <option value="">Select...</option>
              {masteryGoals.map((goal) => (
                <option key={goal} value={goal}>
                  {goal}
                </option>
              ))}
            </select>
          </div>
        )}
        {step === 3 && (
          <div>
            <label className="block mb-2">Class Type</label>
            <select
              name="class_type"
              value={form.class_type}
              onChange={handleChange}
              className="w-full mb-4 p-2 border rounded"
            >
              <option value="">Select...</option>
              {classTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        )}
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <div className="flex justify-between">
          {step > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="bg-lime-300 px-4 py-2 rounded"
            >
              Back
            </button>
          )}
          {step < 3 && (
            <button
              type="button"
              onClick={handleNext}
              className="bloom-green text-white px-4 py-2 rounded"
              style={{ backgroundColor: "#3cb371" }}
            >
              Next
            </button>
          )}
          {step === 3 && (
            <button
              type="submit"
              className="bloom-green text-white px-4 py-2 rounded"
              style={{ backgroundColor: "#3cb371" }}
              disabled={loading}
            >
              {loading ? "Saving..." : "Submit"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default UserPreferences;
