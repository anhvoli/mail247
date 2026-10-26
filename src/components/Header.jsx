import React from "react";

export default function Header() {
  return (
    <header className="dot-pattern border-b-4 border-[#111111] px-4 md:px-6 py-3.5 sticky top-0 z-30 shadow-brutal">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Logo Tag */}
        <div className="flex items-center gap-3">
          <div className="bg-[#e63b2e] text-white px-3.5 py-1 border-3 border-[#111111] shadow-brutal-sm font-heading text-xl tracking-wider uppercase transform -rotate-1">
            MAIL MIUSE
          </div>
        </div>

        {/* System status */}
      </div>
    </header>
  );
}
