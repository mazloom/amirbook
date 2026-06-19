/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Sparkles,
  FileCheck2,
  AlertCircle,
  Play,
  CheckCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Clipboard,
  Eraser,
  ListRestart
} from "lucide-react";
import { TextChunk, TranslationProject } from "../types";

export interface TranslationStudioProps {
  project: TranslationProject;
  activeChunkId: string | null;
  onSelectChunk: (id: string) => void;
  onTranslateChunk: (id: string, tone: TranslationProject["targetTone"]) => Promise<void>;
  onEditChunk: (id: string, type: "halfspace" | "grammar" | "full") => Promise<void>;
  onUpdateChunkManualText: (id: string, text: string) => void;
  onMarkCompleted: (id: string) => void;
  isProcessing: boolean;
  processingId: string | null;
}

export default function TranslationStudio({
  project,
  activeChunkId,
  onSelectChunk,
  onTranslateChunk,
  onEditChunk,
  onUpdateChunkManualText,
  onMarkCompleted,
  isProcessing,
  processingId,
}: TranslationStudioProps) {
  const activeChunk = project.chunks.find((c) => c.id === activeChunkId) || project.chunks[0];
  const [localText, setLocalText] = useState("");
  const [lastLoadedId, setLastLoadedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"translate" | "proofread">("translate");

  // Keep local manual text synced when chunk selection changes
  if (activeChunk && activeChunk.id !== lastLoadedId) {
    setLocalText(activeChunk.editedText || activeChunk.translatedText || "");
    setLastLoadedId(activeChunk.id);
  }

  if (!activeChunk) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
        <p className="text-slate-500 font-bold">بخش معتبری برای ترجمه پیدا نشد.</p>
      </div>
    );
  }

  const handleTranslateClick = async () => {
    await onTranslateChunk(activeChunk.id, project.targetTone);
    const updated = project.chunks.find((c) => c.id === activeChunk.id);
    if (updated) {
      setLocalText(updated.translatedText || "");
    }
  };

  const handleEditClick = async (type: "halfspace" | "grammar" | "full") => {
    // Save current manual edit changes before performing AI-over-edit action
    onUpdateChunkManualText(activeChunk.id, localText);
    await onEditChunk(activeChunk.id, type);
    const updated = project.chunks.find((c) => c.id === activeChunk.id);
    if (updated) {
      setLocalText(updated.editedText || "");
    }
  };

  const handleManualSave = () => {
    onUpdateChunkManualText(activeChunk.id, localText);
  };

  const currentIndex = project.chunks.findIndex((c) => c.id === activeChunk.id);
  const handleNext = () => {
    if (currentIndex < project.chunks.length - 1) {
      // Save current changes
      onUpdateChunkManualText(activeChunk.id, localText);
      onSelectChunk(project.chunks[currentIndex + 1].id);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      // Save current changes
      onUpdateChunkManualText(activeChunk.id, localText);
      onSelectChunk(project.chunks[currentIndex - 1].id);
    }
  };

  const getStatusBadge = (status: TextChunk["status"]) => {
    switch (status) {
      case "original":
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-[11px] font-bold">اصلی (ترجمه نشده)</span>;
      case "translating":
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full text-[11px] font-bold animate-pulse">در حال ترجمه...</span>;
      case "translated":
        return <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[11px] font-bold">ترجمه خام شد</span>;
      case "editing":
        return <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full text-[11px] font-bold animate-pulse">در حال ویراستاری...</span>;
      case "completed":
        return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-bold">ویراستاری و نهایی شد</span>;
    }
  };

  return (
    <div id="translation-studio-container" className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Chunk Sidebar Selection list */}
      <div className="lg:col-span-1 bg-white border border-slate-100 rounded-2xl p-4 book-page-shadow h-[620px] flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2 pb-2 border-b border-slate-50">
            <Bookmark className="w-4 h-4 text-emerald-600" />
            فصل‌ها و بخش‌های کتاب ({project.chunks.length})
          </h3>
          <div className="space-y-1.5 overflow-y-auto max-h-[480px] pl-1 h-[480px]">
            {project.chunks.map((chunk, index) => {
              const worksOnMe = processingId === chunk.id;
              const isSelected = activeChunkId === chunk.id;
              return (
                <div
                  key={chunk.id}
                  onClick={() => {
                    onUpdateChunkManualText(activeChunk.id, localText);
                    onSelectChunk(chunk.id);
                  }}
                  className={`p-3 rounded-xl cursor-pointer text-right border transition-all text-xs flex justify-between items-center ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50/30 text-emerald-900 font-semibold shadow-xs"
                      : "border-slate-50 bg-slate-50/50 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <div className="flex flex-col gap-0.5 max-w-[70%]">
                    <span className="font-bold">بخش {index + 1}</span>
                    <span className="text-[10px] text-slate-400 truncate text-left font-mono block w-full" style={{ direction: "ltr" }}>
                      {chunk.originalText.substring(0, 30)}...
                    </span>
                  </div>
                  <div>
                    {chunk.status === "completed" ? (
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full block" title="تمام چاپ شد"></span>
                    ) : chunk.status === "translated" ? (
                      <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full block" title="فقط ترجمه شده"></span>
                    ) : chunk.status === "translating" || chunk.status === "editing" ? (
                      <span className="w-2.5 h-2.5 bg-amber-500 rounded-full block animate-ping" title="در حال پردازش"></span>
                    ) : (
                      <span className="w-2.5 h-2.5 bg-slate-200 rounded-full block"></span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-50 text-center text-[10px] text-slate-400">
          برای تعویض بین بخش‌ها کلیک کنید
        </div>
      </div>

      {/* Main Studio Working Space */}
      <div className="lg:col-span-3 bg-white border border-slate-100 rounded-2xl p-6 book-page-shadow min-h-[620px] flex flex-col justify-between">
        {/* Header toolbar */}
        <div className="flex flex-wrap justify-between items-center pb-4 border-b border-slate-100 gap-2 mb-4">
          <div className="flex items-center gap-3">
            <h3 className="font-extrabold text-slate-800 text-base">دپارتمان کار روی بخش {currentIndex + 1}</h3>
            {getStatusBadge(activeChunk.status)}
          </div>

          <div className="flex gap-2 text-xs">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="px-3 py-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-all flex items-center gap-1 font-semibold"
            >
              <ChevronRight className="w-4 h-4" />
              بخش قبلی
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === project.chunks.length - 1}
              className="px-3 py-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-all flex items-center gap-1 font-semibold"
            >
              بخش بعدی
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Studio Workspace Layout: Side-by-side text block */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 mb-4">
          {/* Left panel: Source text (English metadata) */}
          <div className="border border-slate-100 bg-slate-50/50 rounded-2xl p-4 flex flex-col justify-between">
            <div className="mb-2 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500">متن مبدا (انگلیسی یا زبان خارجی)</span>
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-mono">
                کاراکتر: {activeChunk.originalText.length}
              </span>
            </div>
            <textarea
              readOnly
              className="w-full text-sm leading-relaxed text-slate-600 bg-transparent focus:outline-none resize-none flex-1 font-mono text-left select-all"
              style={{ direction: "ltr" }}
              value={activeChunk.originalText}
            />
          </div>

          {/* Right panel: Target Translation & Editing panel */}
          <div className="border border-slate-100 bg-white rounded-2xl p-4 flex flex-col justify-between">
            <div className="mb-2 flex justify-between items-center">
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                متن مقصد با پشتیبانی هوش مصنوعی و ویراستار
              </span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-mono">
                کاراکتر: {localText.length}
              </span>
            </div>

            <textarea
              value={localText}
              onChange={(e) => setLocalText(e.target.value)}
              placeholder="متن ترجمه شده در اینجا نمایش داده می‌شود و می‌توانید به صورت دستی نیز آن را تغییر داده یا ویراستاری نهایی کنید..."
              className="w-full text-sm leading-relaxed text-slate-800 bg-transparent focus:outline-none resize-none flex-1 font-vazir min-h-[300px]"
            />

            <div className="flex justify-between items-center pt-2 border-t border-slate-50 mt-2">
              <button
                type="button"
                onClick={handleManualSave}
                className="text-xs font-bold px-3 py-1 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all text-slate-600"
              >
                ذخیره موقت تغییرات دستی
              </button>
              {activeChunk.error && (
                <span className="flex items-center text-[10px] text-rose-500 font-semibold gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  بروز خطا: {activeChunk.error}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* AI Processing and control panel */}
        <div className="bg-slate-50 border border-slate-100/60 rounded-2xl p-4 space-y-3">
          <div className="flex gap-2 border-b border-slate-200/55 pb-2">
            <button
              onClick={() => setActiveTab("translate")}
              type="button"
              className={`text-xs font-bold px-4 py-1.5 rounded-lg transition-all ${
                activeTab === "translate"
                  ? "bg-slate-800 text-white"
                  : "text-slate-500 hover:bg-slate-200/50"
              }`}
            >
              موتور ترجمه هوشمند
            </button>
            <button
              onClick={() => setActiveTab("proofread")}
              type="button"
              className={`text-xs font-bold px-4 py-1.5 rounded-lg transition-all ${
                activeTab === "proofread"
                  ? "bg-slate-800 text-white"
                  : "text-slate-500 hover:bg-slate-200/50"
              }`}
            >
              موتور ویراستاری و صفحه‌بندی کتاب
            </button>
          </div>

          {activeTab === "translate" && (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
              <div className="text-xs text-slate-500">
                <p className="font-bold text-slate-700 mb-1">ترجمه به زبان فارسی توسط موتور هوشمند Gemini 3.5 Flash</p>
                <p>این موتور به صورت هوشمند واژه‌نامه تخصصی و لحن انتخابی شما (<span className="font-semibold text-emerald-700">{project.targetTone}</span>) را به همراه علائم نگارشی فارسی اعمال می‌کند.</p>
              </div>
              <button
                onClick={handleTranslateClick}
                disabled={isProcessing}
                type="button"
                className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl shrink-0 transition-all disabled:opacity-50"
              >
                {isProcessing && processingId === activeChunk.id ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin ml-1" />
                    در حال دریافت ترجمه تراز اول...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 ml-1 fill-white" />
                    شروع ترجمه هوشمند این بخش
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === "proofread" && (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
              <div className="text-xs text-slate-500">
                <p className="font-bold text-slate-700 mb-1">ویراستاری، تصحیح املای نیم‌فاصله و روان‌سازی ساختاری جهت چاپ کتاب</p>
                <p>انتخاب کنید چطور هوش مصنوعی متن پیست شده یا ترجمه شده را بازبینی و ویراستاری کند.</p>
              </div>
              <div className="flex gap-2 flex-wrap md:flex-nowrap">
                <button
                  type="button"
                  onClick={() => handleEditClick("halfspace")}
                  disabled={isProcessing || !localText}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-[11px] rounded-xl transition-all disabled:opacity-40"
                >
                  صرفاً تصحیح نیم‌فاصله‌ها
                </button>
                <button
                  type="button"
                  onClick={() => handleEditClick("grammar")}
                  disabled={isProcessing || !localText}
                  className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-[11px] rounded-xl transition-all disabled:opacity-40"
                >
                  دستور زبان و روان‌سازی
                </button>
                <button
                  type="button"
                  onClick={() => handleEditClick("full")}
                  disabled={isProcessing || !localText}
                  className="flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] rounded-xl transition-all disabled:opacity-40"
                >
                  <Sparkles className="w-3.5 h-3.5 ml-1" />
                  ویراستاری تمام‌عیار ادبی چاپی
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4 bg-white">
          <button
            type="button"
            onClick={() => {
              setLocalText(activeChunk.originalText);
              handleManualSave();
            }}
            className="px-4 py-2 text-xs font-semibold hover:bg-slate-100 text-slate-500 rounded-xl transition-all"
          >
            کپی کردن متن مرجع به خروجی
          </button>
          <button
            onClick={() => {
              onUpdateChunkManualText(activeChunk.id, localText);
              onMarkCompleted(activeChunk.id);
            }}
            disabled={!localText}
            type="button"
            className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-all"
          >
            <CheckCircle className="w-4 h-4 ml-1" />
            تایید نهایی و آماده‌سازی برای صفحه‌بندی چاپی
          </button>
        </div>
      </div>
    </div>
  );
}
