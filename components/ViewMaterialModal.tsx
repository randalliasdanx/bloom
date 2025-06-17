"use client";

import { useState } from "react";

interface Material {
  id: string;
  title: string;
  link: string;
}

interface Props {
  subject: {
    id: string;
    name: string;
  };
  materials: Material[];
  setMaterials: React.Dispatch<React.SetStateAction<Material[]>>;
}

export default function ViewMaterialModal({ subject, materials, setMaterials }: Props) {
  const [open, setOpen] = useState(false);
  const handleDelete = async (material: Material) => {
    const confirmed = confirm(`Are you sure you want to delete ${material.title}?`);
    if (!confirmed) return;

    const filePath = material.link.split("/storage/v1/object/public/materials/")[1];
    if (!filePath) {
      alert("Failed to parse file path.");
      return;
    }

    const res = await fetch("/api/materials", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: material.id, filePath }),
    });

    if (res.ok) {
      setMaterials(prev => prev.filter(m => m.id !== material.id));
    } else {
      alert("Failed to delete material.");
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-[#348c5f] hover:bg-[#4fa483] text-white font-medium px-4 py-2 rounded shadow transition-transform transform hover:scale-105"
      >
        View Materials
      </button>

      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-[90%] max-w-md">
            <h3 className="text-xl font-bold mb-4 text-[#4a185a]">
              Materials for {subject.name}
            </h3>

            {materials.length > 0 ? (
              <>
                <ul className="list-disc ml-5 space-y-2">
                  {materials.map((material, index) => (
                    <li key={`${material.title}-${index}`} className="flex items-center justify-between">
                      <a
                        href={material.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-700 hover:underline"
                      >
                        {material.title}
                      </a>
                      <button
                        onClick={() => handleDelete(material)}
                        className="ml-3 text-red-600 hover:underline text-sm"
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-col sm:flex-row gap-7 justify-center ">
                  <button
                    onClick={() => alert("Lesson plan generation logic goes here")}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow transition mr-4"
                  >
                    Generate Lesson Plan
                  </button>
                  <button
                    className="bg-[#a78bfa] hover:bg-[#8b5cf6] text-white px-4 py-2 mr-2 rounded-lg transition"
                    onClick={() => setOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-600 italic">No materials uploaded yet.</p>
                <div className="flex justify-center mt-6">
                  <button
                    className="bg-[#a78bfa] hover:bg-[#8b5cf6] text-white px-4 py-2 rounded-lg transition"
                    onClick={() => setOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
