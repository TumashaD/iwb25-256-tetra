
'use client'

import React, { useState } from "react";
import dynamic from "next/dynamic";

// Editor component (dynamic import)
const Editor = dynamic(() => import("@/components/editor/editor"), {
  ssr: false,
});

// Example competition data (replace with real data as needed)
const COMPETITION_DATA = {
  title: "SLIOT Innovation Challenge",
  description: "Showcase your IoT solutions and compete with the best innovators in Sri Lanka.",
  banner: "https://icxxglazqizgjnscmdqj.storage.supabase.co/storage/v1/object/public/competitions/7/SLIOT.jpeg",
  organizer: "SLIOT Association",
  date: "September 20, 2025",
  location: "Colombo, Sri Lanka",
};

// Initial Editor Data
const INITIAL_DATA = {
  time: Date.now(),
  blocks: [
    {
      id: "TQeeE9tF4i",
      type: "header",
      data: { text: COMPETITION_DATA.title, level: 1 },
    },
    {
      id: "desc1",
      type: "paragraph",
      data: { text: COMPETITION_DATA.description },
    },
    {
      id: "svg1Lk0jNJ",
      type: "image",
      data: {
        caption: "Competition Banner",
        withBorder: false,
        withBackground: false,
        stretched: true,
        file: { url: COMPETITION_DATA.banner },
      },
    },
  ],
  version: "2.31.0-rc.7",
};

export default function CompetitionLandingPage() {
  const [data, setData] = useState(INITIAL_DATA);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center py-8">
      {/* Banner */}
      <div className="w-full max-w-3xl rounded-xl overflow-hidden shadow-lg mb-8">
        <img
          src={COMPETITION_DATA.banner}
          alt="Competition Banner"
          className="w-full h-64 object-cover"
        />
      </div>

      {/* Title & Details */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-extrabold text-indigo-800 mb-2">
          {COMPETITION_DATA.title}
        </h1>
        <p className="text-lg text-gray-700 mb-2">
          {COMPETITION_DATA.description}
        </p>
        <div className="flex justify-center gap-4 text-sm text-gray-500">
          <span className="bg-indigo-100 px-3 py-1 rounded-full">{COMPETITION_DATA.date}</span>
          <span className="bg-indigo-100 px-3 py-1 rounded-full">{COMPETITION_DATA.location}</span>
          <span className="bg-indigo-100 px-3 py-1 rounded-full">Organized by {COMPETITION_DATA.organizer}</span>
        </div>
      </div>

      {/* Editor for Organizers */}
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold text-indigo-700 mb-4">Customize Landing Page</h2>
        <Editor data={data} onChange={setData} editorblock="editorjs" />
        <button
          className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition"
          onClick={() => {
            alert(JSON.stringify(data));
          }}
        >
          Save Customizations
        </button>
      </div>
    </div>
  );
}