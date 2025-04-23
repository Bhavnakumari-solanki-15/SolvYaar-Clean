import React from "react";
import { Sidebar } from "../components/Sidebar";
import { ChatPanel } from "../components/ChatPanel";

export default function Home() {
  return (
    <div className="flex h-screen bg-[#343541] text-white overflow-hidden">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Chat Area */}
      <ChatPanel />
    </div>
  );
} 