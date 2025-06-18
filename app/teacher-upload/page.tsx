"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";
import TTSSection from "./components/TTSSection";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function TeacherUploadPage() {
  const [pdfjsLib, setPdfjsLib] = useState<any>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [useExtractedText, setUseExtractedText] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [ttsProgress, setTtsProgress] = useState(0);
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const [selectedVoices, setSelectedVoices] = useState<string[]>([]);

  // Dynamically import pdfjs-dist only on client
  useEffect(() => {
    import("pdfjs-dist/build/pdf").then((pdfjs) => {
      // Set worker path to the ESM worker
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';
      setPdfjsLib(pdfjs);
    });
  }, []);

  // Fetch available voice samples
  useEffect(() => {
    const fetchVoices = async () => {
      const { data: voices, error } = await supabase
        .from("voice_samples")
        .select("*")
        .eq("status", "approved");

      if (!error && voices) {
        setAvailableVoices(voices);
      }
    };

    fetchVoices();
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
      const CHARACTER_LIMIT = 3000;

      // Only process pages until we reach the character limit
      for (let i = 1; i <= pdf.numPages; i++) {
        if (fullText.length >= CHARACTER_LIMIT) {
          break;
        }

        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str).join(" ");
        
        // Calculate remaining characters
        const remainingChars = CHARACTER_LIMIT - fullText.length;
        
        if (fullText.length + pageText.length <= CHARACTER_LIMIT) {
          // If adding entire page text doesn't exceed limit, add it all
          fullText += pageText + "\n";
        } else {
          // If adding page would exceed limit, only add up to the limit
          fullText += pageText.substring(0, remainingChars);
          break;
        }
      }

      // Ensure we don't exceed the limit (just in case)
      fullText = fullText.substring(0, CHARACTER_LIMIT);

      setExtractedText(fullText.trim());
      setUseExtractedText(true);
      setMessage(`Text extracted! Limited to ${CHARACTER_LIMIT} characters. You can review or edit before submitting.`);
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

  const handleVoiceToggle = (voiceId: string) => {
    setSelectedVoices(prev =>
      prev.includes(voiceId)
        ? prev.filter(id => id !== voiceId)
        : [...prev, voiceId]
    );
  };

  const generateTTS = async () => {
    if (!extractedText || selectedVoices.length === 0) {
      setMessage("Please provide text and select at least one voice.");
      return;
    }

    setLoading(true);
    setTtsProgress(0);
    setMessage("Generating audio files...");

    try {
      // Get the selected voice samples
      const selectedVoiceSamples = availableVoices.filter(v => selectedVoices.includes(v.id));
      
      // Generate TTS for each voice
      for (let i = 0; i < selectedVoiceSamples.length; i++) {
        const voice = selectedVoiceSamples[i];
        
        // Get the voice file from Supabase storage
        const { data: voiceData, error: voiceError } = await supabase.storage
          .from("voice-samples")
          .download(voice.file_path);

        if (voiceError) throw voiceError;

        // Create form data for the TTS API
        const formData = new FormData();
        formData.append("input", extractedText);
        formData.append("voice_file", new Blob([voiceData]), voice.file_path.split("/").pop());

        // Call the TTS API
        const response = await fetch("http://localhost:4123/v1/audio/speech/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error(`TTS generation failed for voice ${voice.id}`);

        // Get the generated audio
        const audioBlob = await response.blob();

        // Upload the generated audio to Supabase
        const audioFileName = `generated/${voice.id}/${Date.now()}.wav`;
        const { error: uploadError } = await supabase.storage
          .from("lesson-audio")
          .upload(audioFileName, audioBlob);

        if (uploadError) throw uploadError;

        // Update progress
        setTtsProgress(((i + 1) / selectedVoiceSamples.length) * 100);
      }

      setMessage("Audio generation complete!");
    } catch (error: any) {
      console.error("TTS generation error:", error);
      setMessage(error.message || "Failed to generate audio files.");
    } finally {
      setLoading(false);
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
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gradient-to-br from-[#e6e6fa] to-[#b7eacb] py-8">
        <div className="max-w-4xl mx-auto bg-white/90 rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-8 text-green-700" style={{ fontFamily: 'var(--font-arvo)' }}>
            Teacher Curriculum Builder
          </h1>

          {/* PDF Upload Section */}
          <div className="bg-white/80 rounded-lg p-6 mb-8 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-green-700" style={{ fontFamily: 'var(--font-arvo)' }}>
              Step 1: Upload Textbook
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Attach a Textbook PDF
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-green-50 file:text-green-700
                    hover:file:bg-green-100"
                />
              </div>
              {pdfFile && (
                <div>
                  <div className="text-green-700 mb-2">Selected: {pdfFile.name}</div>
                  <button
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition font-medium"
                    onClick={() => handleExtractText(pdfFile)}
                    disabled={loading}
                  >
                    Extract Text from PDF
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Text Preview Section */}
          {useExtractedText && (
            <TTSSection 
              extractedText={extractedText}
              onTextChange={setExtractedText}
            />
          )}

          {/* Voice Selection Section */}
          {useExtractedText && (
            <div className="bg-white/80 rounded-lg p-6 mb-8 shadow-sm">
              <h2 className="text-xl font-semibold mb-4 text-green-700" style={{ fontFamily: 'var(--font-arvo)' }}>
                Step 3: Select Voices for TTS Generation
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {availableVoices.map((voice) => (
                  <div
                    key={voice.id}
                    className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                      selectedVoices.includes(voice.id)
                        ? "border-green-500 bg-green-50 shadow-lg"
                        : "border-gray-200 hover:border-green-300 hover:shadow-md"
                    }`}
                    onClick={() => handleVoiceToggle(voice.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-lg text-green-700">
                          {voice.name || "Voice " + voice.id}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          Uploaded by: {voice.user_id}
                        </div>
                      </div>
                      {selectedVoices.includes(voice.id) && (
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleSubmit}
                  className="bg-green-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-800 transition text-lg flex-1"
                  disabled={loading || (!pdfFile && !useExtractedText) || (useExtractedText && extractedText.trim().length === 0)}
                >
                  {loading ? "Processing..." : "Generate Curriculum"}
                </button>

                <button
                  onClick={generateTTS}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition text-lg flex-1 flex items-center justify-center gap-2"
                  disabled={loading || selectedVoices.length === 0}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating Audio...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                      Generate Audio
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {ttsProgress > 0 && (
            <div className="bg-white/80 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-green-700" style={{ fontFamily: 'var(--font-arvo)' }}>
                  Generating Audio
                </h3>
                <span className="text-sm text-gray-600">{Math.round(ttsProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${ttsProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Status Message */}
          {message && (
            <div className={`mt-4 p-4 rounded-lg ${message.includes("failed") || message.includes("error") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </QueryClientProvider>
  );
}
