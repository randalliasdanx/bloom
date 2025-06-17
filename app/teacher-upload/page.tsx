"use client";

import React, { useState, useEffect } from "react";

export default function TeacherUploadPage() {
  const [pdfjsLib, setPdfjsLib] = useState<any>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [useExtractedText, setUseExtractedText] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Dynamically import pdfjs-dist only on client
  useEffect(() => {
    import("pdfjs-dist/build/pdf").then((mod) => {
      mod.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${mod.version}/pdf.worker.min.js`;
      setPdfjsLib(mod);
    });
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(search)}`
      );
      const data = await res.json();
      setSearchResults(data.docs.slice(0, 5));
    } catch {
      setMessage("Search failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleExtractText = async (file: File) => {
    if (!pdfjsLib) {
      alert("PDF.js is still loading, please try again shortly.");
      return;
    }

    setLoading(true);
    setMessage(null);
    setExtractedText("");

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
      }).promise;

      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map((item: any) => item.str).join(" ");
        fullText += strings + "\n";
      }

      setExtractedText(fullText.trim());
      setUseExtractedText(true);
      setMessage("Text extracted! You can review or edit before submitting.");
    } catch (error) {
      console.error("PDF text extraction error:", error);
      setMessage("Failed to extract text from PDF.");
      setUseExtractedText(false);
      setExtractedText("");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
      setExtractedText("");
      setUseExtractedText(false);
      setMessage(null);
    }
  };

  const handleSubmit = async () => {
    if (!pdfFile) return;

    setLoading(true);
    setMessage("Processing textbook...");
    try {
      let body: FormData | { text: string };

      if (useExtractedText && extractedText.length > 0) {
        // Send extracted text as JSON
        body = { text: extractedText };
      } else {
        // Send raw PDF as form data
        const formData = new FormData();
        formData.append("pdf", pdfFile);
        body = formData;
      }

      const res = await fetch("/api/teacher-upload", {
        method: "POST",
        body: body instanceof FormData ? body : JSON.stringify(body),
        headers:
          body instanceof FormData
            ? undefined
            : { "Content-Type": "application/json" },
      });

      const data = await res.json();
      setMessage(res.ok ? "Curriculum generated and saved!" : data.error);
    } catch (error) {
      console.error("Upload error:", error);
      setMessage("Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6 text-green-700">
        Teacher Curriculum Builder
      </h1>

      <div className="mb-6">
        <label className="block mb-2 font-semibold">
          Attach a Textbook PDF
        </label>
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="mb-2"
        />
        {pdfFile && (
          <div className="text-green-700 mb-2">Selected: {pdfFile.name}</div>
        )}
        {pdfFile && (
          <button
            className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 transition"
            onClick={() => handleExtractText(pdfFile)}
            disabled={loading}
          >
            Extract Text from PDF
          </button>
        )}
      </div>

      {useExtractedText && (
        <div className="mb-6">
          <label className="block mb-2 font-semibold">
            Extracted Text Preview
          </label>
          <textarea
            className="w-full border rounded p-2"
            rows={10}
            value={extractedText}
            onChange={(e) => setExtractedText(e.target.value)}
          />
          <div className="text-sm text-gray-600 mt-1">
            You can edit the text before submitting if needed.
          </div>
        </div>
      )}

      <div className="mb-6">
        <label className="block mb-2 font-semibold">
          Or Search for a Textbook
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="e.g. Chemistry, Calculus, etc."
            className="border rounded px-3 py-1 flex-1"
          />
          <button
            onClick={handleSearch}
            className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 transition"
            disabled={loading || search.trim().length === 0}
          >
            Search
          </button>
        </div>
        {loading && <div className="text-green-700 mt-2">Searching...</div>}
        <ul className="mt-2">
          {searchResults.map((book, i) => (
            <li key={i} className="mb-1">
              <span className="font-semibold">{book.title}</span>{" "}
              {book.author_name && `by ${book.author_name[0]}`}
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={handleSubmit}
        className="bg-green-700 text-white px-6 py-2 rounded font-semibold hover:bg-green-800 transition"
        disabled={
          loading ||
          (!pdfFile && !useExtractedText) ||
          (useExtractedText && extractedText.trim().length === 0)
        }
      >
        {loading ? "Processing..." : "Generate Curriculum"}
      </button>

      {message && <div className="mt-4 text-green-700">{message}</div>}
    </div>
  );
}
