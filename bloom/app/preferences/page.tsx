import React from "react";
import UserPreferences from "../../components/UserPreferences";

export default function PreferencesPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        backgroundImage:
          "url(https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=1500&q=80)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundColor: "#e6e6fa", // fallback lilac
      }}
    >
      <div className="backdrop-blur-md bg-white/70 rounded-xl shadow-lg p-8">
        <UserPreferences />
      </div>
    </div>
  );
}
