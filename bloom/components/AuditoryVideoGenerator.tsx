import React, { useState } from "react";

const characters = [
  "Rick (Rick and Morty)",
  "Morty (Rick and Morty)",
  "Peter Griffin (Family Guy)",
  "Stewie Griffin (Family Guy)",
  "Morgan Freeman",
  "Barack Obama",
];

const mockVideoUrl = "https://www.w3schools.com/html/mov_bbb.mp4"; // Placeholder video

const AuditoryVideoGenerator: React.FC = () => {
  const [text, setText] = useState("");
  const [character, setCharacter] = useState(characters[0]);
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setVideoUrl(null);
    // Placeholder for TTS + video API call
    await new Promise((res) => setTimeout(res, 3000));
    setVideoUrl(mockVideoUrl);
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-8 rounded shadow-md mt-8">
      <h2 className="text-2xl font-bold mb-4">
        Generate Auditory Lesson Video
      </h2>
      <form onSubmit={handleGenerate}>
        <label className="block mb-2">Lesson Content</label>
        <textarea
          className="w-full mb-4 p-2 border rounded"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
        />
        <label className="block mb-2">Character/Celebrity Voice</label>
        <select
          className="w-full mb-4 p-2 border rounded"
          value={character}
          onChange={(e) => setCharacter(e.target.value)}
        >
          {characters.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Video"}
        </button>
      </form>
      {videoUrl && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Your Video</h3>
          <video src={videoUrl} controls className="w-full rounded" />
        </div>
      )}
    </div>
  );
};

export default AuditoryVideoGenerator;
