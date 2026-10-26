import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-[#0b0b2b] border-t-4 border-[#111111] text-white py-3 px-4 text-xs font-mono">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[#33ff66]">●</span>
          <span>MAIL247 // SINGLE_INBOX_CONSOLE</span>
        </div>
        <div className="text-slate-400">
          FOCUSED MODE: 1 EMAIL AT A TIME
        </div>
      </div>
    </footer>
  );
}
