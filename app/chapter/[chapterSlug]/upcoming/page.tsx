"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../utils/supabaseClient";

export default function UpcomingChapterPage({ params }: { params: { chapterSlug: string } }) {
  const router = useRouter();
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate file type
      const allowedTypes = [".mp3", ".wav", ".flac", ".m4a", ".ogg"];
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
      
      if (!allowedTypes.includes(fileExtension)) {
        setMessage("Please select a valid audio file (MP3, WAV, FLAC, M4A, OGG)");
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setMessage("File size must be less than 10MB");
        return;
      }

      setVoiceFile(file);
      setMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!voiceFile) return;

    setUploading(true);
    setMessage(null);

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Upload to Supabase Storage
      const fileExt = voiceFile.name.split(".").pop();
      const fileName = `${user.id}/${params.chapterSlug}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("voice-samples")
        .upload(fileName, voiceFile);

      if (uploadError) throw uploadError;

      // Save reference in database
      const { error: dbError } = await supabase
        .from("voice_samples")
        .insert([
          {
            user_id: user.id,
            chapter_id: params.chapterSlug,
            file_path: fileName,
            status: "pending",
          },
        ]);

      if (dbError) throw dbError;

      setMessage("Voice sample uploaded successfully! Teachers will review it.");
      setVoiceFile(null);
    } catch (error: any) {
      setMessage(error.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e6e6fa] to-[#b7eacb]">
      <div className="max-w-3xl mx-auto p-8">
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.back()}
            className="mr-4 px-3 py-1 bg-green-800 hover:bg-green-900 text-white font-semibold rounded shadow transition"
          >
            <span className="text-2xl">&#8592;</span>
          </button>
          <h1 className="text-4xl font-bold text-green-700 capitalize">
            {params.chapterSlug.replace(/-/g, " ")}
          </h1>
        </div>

        <div className="bg-white/80 rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 text-green-800">
            Upload Your Voice Sample
          </h2>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Help teachers create engaging content by uploading a voice sample of your favorite character.
              This will be used to generate audio for upcoming lessons.
            </p>
            
            <div className="border-2 border-dashed border-green-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".mp3,.wav,.flac,.m4a,.ogg"
                onChange={handleFileChange}
                className="hidden"
                id="voice-upload"
              />
              <label
                htmlFor="voice-upload"
                className="cursor-pointer block"
              >
                {voiceFile ? (
                  <div>
                    <p className="text-lg font-medium text-green-700 mb-2">
                      Selected: {voiceFile.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {(voiceFile.size / 1024 / 1024).toFixed(1)}MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg font-medium text-green-700 mb-2">
                      Click to upload your voice sample
                    </p>
                    <p className="text-sm text-gray-500">
                      MP3, WAV, FLAC, M4A, OGG (max 10MB)
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <button
            onClick={handleUpload}
            disabled={!voiceFile || uploading}
            className={`w-full py-3 rounded-lg font-semibold text-white transition ${
              !voiceFile || uploading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {uploading ? "Uploading..." : "Upload Voice Sample"}
          </button>

          {message && (
            <div
              className={`mt-4 p-3 rounded ${
                message.includes("successfully")
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 