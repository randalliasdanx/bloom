"use client";

import React from "react";
import SignIn from "../../components/SignIn";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1500&q=80')] bg-cover bg-center bg-no-repeat">
      <SignIn />
    </div>
  );
}
