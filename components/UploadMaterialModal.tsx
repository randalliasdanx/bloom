"use client";

import { supabase } from "@/lib/supabaseClient";
import { useState } from "react";

interface Material {
  id: string;
  title: string;
  link: string;
}

export default function UploadMaterialModal({ subject, onUpload }: { subject: { id: string, name: string }, onUpload: (material: Material) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !file) {
      alert("Please provide a title and select a file to upload.");
      return;
    }

    const fileExt = file.name.split('.').pop();
    const filePath = `${subject.id}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('materials')
      .upload(filePath, file);

    if (error) {
      alert("Upload failed");
      console.error(error);
      return;
    }

    const { data: publicUrl } = supabase.storage
      .from('materials')
      .getPublicUrl(filePath);
    
    const materialData = {
      title,
      contentUrl: publicUrl.publicUrl,
      subjectId: subject.id,
    };

    const res = await fetch("/api/materials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(materialData),
    });

    if (!res.ok) {
      alert("Failed to save to database.");
      return;
    }

    const saved = await res.json();

    onUpload({ id: saved.id, title: saved.title, link: saved.contentUrl });
    setTitle("");
    setFile(null);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-[#51685c] hover:bg-[#6ea68a] text-white font-medium px-4 py-2 rounded shadow transition-transform transform hover:scale-105"
      >
        Upload Materials
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-[90%] max-w-md">
            <h3 className="text-xl font-bold mb-4 text-[#4a185a]">Upload Material for {subject.name}</h3>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Material Title"
                className="w-full border border-gray-300 px-3 py-2 rounded"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full border px-3 py-2 rounded"
              />

              <div className="flex justify-end gap-2 mt-4">
                <button
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded bg-[#a78bfa] hover:bg-[#8b5cf6] text-white"
                  onClick={handleFileUpload}
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
