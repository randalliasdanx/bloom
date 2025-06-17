import React from "react";
import SignUp from "../../components/SignUp";

export default function SignUpPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        backgroundImage:
          "url(https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=1500&q=80)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundColor: "#e6e6fa", // fallback lilac
      }}
    >
      <div className="backdrop-blur-md bg-white/70 rounded-xl shadow-lg p-8">
        <SignUp />
      </div>
    </div>
  );
}
