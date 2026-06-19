/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ListPlus, Trash2, Languages, Plus } from "lucide-react";
import { GlossaryItem } from "../types";

export interface GlossaryManagerProps {
  glossary: GlossaryItem[];
  onAddGlossaryItem: (english: string, persian: string) => void;
  onDeleteGlossaryItem: (id: string) => void;
}

export default function GlossaryManager({
  glossary,
  onAddGlossaryItem,
  onDeleteGlossaryItem,
}: GlossaryManagerProps) {
  const [english, setEnglish] = useState("");
  const [persian, setPersian] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!english.trim() || !persian.trim()) return;
    onAddGlossaryItem(english.trim(), persian.trim());
    setEnglish("");
    setPersian("");
  };

  return (
    <div id="glossary-manager-container" className="bg-white rounded-2xl border border-slate-100 p-6 book-page-shadow">
      <div className="flex items-center gap-3 mb-4">
        <Languages className="w-5 h-5 text-indigo-600" />
        <div>
          <h3 className="text-md font-bold text-slate-800">واژه‌نامه و یکپارچه‌ساز اختصاصی اصطلاحات</h3>
          <p className="text-xs text-slate-400">عبارات کلیدی و اسامی را تعریف کنید تا در کل ترجمه هماهنگ بمانند.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          value={english}
          onChange={(e) => setEnglish(e.target.value)}
          placeholder="کلمه انگلیسی (یا مبدا)"
          className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-left placeholder:text-right"
          style={{ direction: "ltr" }}
          required
        />
        <input
          type="text"
          value={persian}
          onChange={(e) => setPersian(e.target.value)}
          placeholder="ترجمه ثابت فارسی"
          className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 placeholder:text-slate-400"
          required
        />
        <button
          type="submit"
          className="flex items-center gap-1 text-xs font-bold px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl transition-all"
        >
          <Plus className="w-4 h-4 ml-1" />
          افزودن کلمه
        </button>
      </form>

      {glossary.length === 0 ? (
        <div className="bg-slate-50 border border-slate-100/60 rounded-xl p-4 text-center text-xs text-slate-500">
          لیست واژه‌نامه خالی است. برای پیوستگی اسامی در سراسر کتاب، چند واژه تستی بیفزایید.
        </div>
      ) : (
        <div className="max-h-56 overflow-y-auto space-y-2 border border-slate-50 rounded-xl p-2 bg-slate-50/50">
          {glossary.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center bg-white border border-slate-100 p-2 rounded-xl text-xs hover:border-slate-200 transition-all"
            >
              <div className="flex items-center justify-between flex-1 px-2">
                <span className="font-mono font-bold text-slate-600" style={{ direction: "ltr" }}>
                  {item.english}
                </span>
                <span className="text-indigo-800 font-bold">{item.persian}</span>
              </div>
              <button
                type="button"
                onClick={() => onDeleteGlossaryItem(item.id)}
                className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
