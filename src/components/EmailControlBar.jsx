import React, { useState } from "react";
import { Copy, Check, Edit3, ArrowRight, Dices } from "lucide-react";

export default function EmailControlBar({
  activeEmail,
  onSwitchEmail,
  onRandomize,
  domains = [],
}) {
  const [inputEmail, setInputEmail] = useState("");
  const [selectedDomain, setSelectedDomain] = useState(
    domains[0] || "qoder.io.vn",
  );
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = () => {
    if (!activeEmail) return;
    navigator.clipboard.writeText(activeEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputEmail.trim()) {
      let email = inputEmail.trim().toLowerCase();
      if (!email.includes("@")) {
        email = `${email}@${selectedDomain}`;
      }
      onSwitchEmail(email);
      setInputEmail("");
      setIsChangingEmail(false);
    }
  };

  return (
    <section className="max-w-7xl mx-auto w-full px-4 md:px-6 pt-5 pb-3">
      <div className="bg-white border-4 border-[#111111] shadow-brutal p-4 space-y-3">
        {/* Thẻ hiển thị Email duy nhất đang đọc */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-[#0b0b2b] text-white p-3.5 border-3 border-[#111111] shadow-brutal-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <span className="font-heading text-2xl md:text-3xl text-white tracking-wide truncate block">
                {activeEmail}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center">
            <button
              type="button"
              onClick={handleCopyEmail}
              className="btn-brutal px-4 py-2 bg-[#ffc900] text-[#111111] font-heading text-sm tracking-wider uppercase border-2 border-[#111111] shadow-brutal-sm flex items-center gap-1.5 cursor-pointer"
            >
              {copiedEmail ? (
                <Check className="w-4 h-4 stroke-[3] text-emerald-800" />
              ) : (
                <Copy className="w-4 h-4 stroke-[2.5]" />
              )}
              <span>{copiedEmail ? "ĐÃ SAO CHÉP" : "SAO CHÉP EMAIL"}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsChangingEmail(!isChangingEmail)}
              className={`btn-brutal px-3.5 py-2 border-2 border-[#111111] font-heading text-sm uppercase tracking-wider shadow-brutal-sm flex items-center gap-1.5 cursor-pointer ${
                isChangingEmail
                  ? "bg-[#e63b2e] text-white"
                  : "bg-white text-[#111111] hover:bg-slate-100"
              }`}
            >
              <Edit3 className="w-4 h-4 stroke-[2.5]" />
              <span>{isChangingEmail ? "ĐÓNG" : "ĐỔI EMAIL KHÁC"}</span>
            </button>
          </div>
        </div>

        {/* Form đổi email */}
        {isChangingEmail && (
          <form
            onSubmit={handleSubmit}
            className="pt-2 border-t-2 border-[#111111] flex flex-col sm:flex-row items-stretch gap-2.5 animate-in fade-in"
          >
            <div className="flex-1 flex border-3 border-[#111111] bg-white overflow-hidden shadow-brutal-sm focus-within:shadow-brutal-orange transition-all">
              <div className="px-3 bg-[#0b0b2b] text-[#33ff66] flex items-center font-mono font-bold text-sm">
                $
              </div>
              <input
                type="text"
                placeholder="Nhập tiền tố hoặc email mới cần chuyển sang..."
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                className="flex-1 px-3.5 py-2 text-sm md:text-base font-bold bg-white text-[#111111] outline-none placeholder-slate-400 font-tech"
                autoFocus
              />
              <div className="flex items-center px-3 bg-[#b9b8f2] border-l-3 border-[#111111]">
                <span className="font-heading text-lg mr-1 text-[#111111]">
                  @
                </span>
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="bg-transparent text-sm font-bold text-[#111111] outline-none cursor-pointer uppercase font-tech"
                >
                  {domains.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="btn-brutal px-6 py-2 bg-[#ff8a1e] text-[#111111] font-heading text-base tracking-wider uppercase border-3 border-[#111111] shadow-brutal flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#ff9933]"
            >
              <span>CHUYỂN HÒM THƯ</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>

            <button
              type="button"
              onClick={() => {
                onRandomize();
                setIsChangingEmail(false);
              }}
              className="btn-brutal px-4 py-2 bg-[#ffc900] text-[#111111] font-heading text-base tracking-wider uppercase border-3 border-[#111111] shadow-brutal flex items-center justify-center gap-1 cursor-pointer hover:bg-[#ffd633]"
              title="Tạo ngẫu nhiên một email mới"
            >
              <Dices className="w-4 h-4 stroke-[2.5]" />
              <span>RANDOM</span>
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
