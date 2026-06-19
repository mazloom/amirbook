/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { UploadCloud, FileText, ArrowLeft, Layers, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { splitTextIntoChunks } from "../utils";
import { TextChunk } from "../types";

export interface BookImportProps {
  onImportChunks: (chunks: Omit<TextChunk, "id">[]) => void;
  onCancel: () => void;
  projectTitle: string;
}

export default function BookImport({ onImportChunks, onCancel, projectTitle }: BookImportProps) {
  const [inputText, setInputText] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number } | null>(null);
  const [chunkSize, setChunkSize] = useState<number>(6000); // 6000 chars is ideal (~1500 words, ~4 book pages)
  const [previewChunks, setPreviewChunks] = useState<Omit<TextChunk, "id">[]>([]);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file) return;
    setFileMeta({ name: file.name, size: Math.round(file.size / 1024) });
    setPdfError(null);

    const isPdf = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";

    if (isPdf) {
      setIsExtractingPdf(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const result = e.target?.result as string;
          const base64Pdf = result.substring(result.indexOf(",") + 1);

          const response = await fetch("/api/extract-pdf", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ base64Pdf })
          });

          if (!response.ok) {
            const errDetails = await response.json();
            throw new Error(errDetails.error || "سرور از استخراج متن پی‌دی‌اف بازماند.");
          }

          const info = await response.json();
          const cleanText = info.text || "";
          
          setInputText(cleanText);
          if (cleanText.trim()) {
            const generated = splitTextIntoChunks(cleanText, chunkSize);
            setPreviewChunks(generated);
          } else {
            setPreviewChunks([]);
            setPdfError("متنی در این فابل PDF یافت نشد. این PDF ممکن است یک فایل اسکن‌شده تصویری باشد.");
          }
        } catch (err: any) {
          console.error("PDF extraction error:", err);
          setPdfError(err.message || "خطا در پردازش فایل پی‌دی‌اف.");
        } finally {
          setIsExtractingPdf(false);
        }
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setInputText(text || "");
        if (text?.trim()) {
          const generated = splitTextIntoChunks(text, chunkSize);
          setPreviewChunks(generated);
        } else {
          setPreviewChunks([]);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleTextChange = (text: string) => {
    setInputText(text);
    if (text.trim()) {
      const generated = splitTextIntoChunks(text, chunkSize);
      setPreviewChunks(generated);
    } else {
      setPreviewChunks([]);
    }
  };

  const handleChunkSizeChange = (size: number) => {
    setChunkSize(size);
    if (inputText.trim()) {
      const generated = splitTextIntoChunks(inputText, size);
      setPreviewChunks(generated);
    }
  };

  const handleConfirmImport = () => {
    if (previewChunks.length === 0) return;
    onImportChunks(previewChunks);
  };

  return (
    <div id="book-import-container" className="bg-white rounded-2xl border border-slate-100 p-6 book-page-shadow animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <UploadCloud className="w-6 h-6 text-indigo-600" />
        <div>
          <h2 className="text-xl font-bold text-slate-800">بارگذاری متن کتاب بالای ۱۰۰ صفحه</h2>
          <p className="text-xs text-slate-500">برای پروژه فعلی: <span className="font-bold text-indigo-700">{projectTitle}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left pane: File drag and drop + settings */}
        <div className="lg:col-span-2 space-y-4">
          <div
            onDragEnter={isExtractingPdf ? undefined : handleDrag}
            onDragOver={isExtractingPdf ? undefined : handleDrag}
            onDragLeave={isExtractingPdf ? undefined : handleDrag}
            onDrop={isExtractingPdf ? undefined : handleDrop}
            onClick={isExtractingPdf ? undefined : () => fileInputRef.current?.click()}
            className={`relative overflow-hidden cursor-pointer border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
              isExtractingPdf
                ? "border-amber-400 bg-amber-50/20 cursor-wait"
                : isDragActive
                ? "border-indigo-600 bg-indigo-50/40"
                : "border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".txt,.md,.json,.html,.pdf"
              disabled={isExtractingPdf}
              className="hidden"
            />
            {isExtractingPdf ? (
              <div className="py-6 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-10 h-10 text-amber-600 animate-spin" />
                <p className="text-sm font-bold text-slate-800">در حال استخراج خودکار متن از کتاب PDF شما...</p>
                <p className="text-xs text-slate-500">متن استخراج شده بلافاصله جهت تنظیم قطعه‌بندی بارگذاری خواهد شد.</p>
              </div>
            ) : (
              <>
                <UploadCloud className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-700 mb-1">فایل کتاب مالتان (PDF، متنی و...) را اینجا رها کنید یا کلیک کنید</p>
                <p className="text-xs text-slate-400 mb-4">فرمت‌های سازگار: PDF, TXT, MD, JSON, HTML (حسگر خودکار هوشمند)</p>
                
                {fileMeta && (
                  <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full text-xs text-indigo-800 font-semibold" onClick={(e) => e.stopPropagation()}>
                    <FileText className="w-3.5 h-3.5 ml-1" />
                    {fileMeta.name} ({fileMeta.size} کیلوبایت)
                  </div>
                )}
              </>
            )}
          </div>

          {pdfError && (
            <div className="bg-rose-50 border border-rose-100 text-rose-800 p-4 rounded-xl flex items-start gap-2.5 text-xs font-semibold animate-shake">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-0.5">خطایی در استخراج فایل پی‌دی‌اف رخ داد:</p>
                <p className="opacity-90">{pdfError}</p>
              </div>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-slate-600">یا متن کتاب مالتان را مستقیماً کپی و در زیر پیست کنید:</label>
              {inputText.length > 0 && (
                <span className="text-xs text-slate-500 font-semibold">تعداد کاراکتر: {inputText.length.toLocaleString()}</span>
              )}
            </div>
            <textarea
              value={inputText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="فصل‌های کتاب مبدا مالتان را در اینجا کپی و جای‌گذاری (Paste) کنید تا اتوماتیک بخش‌بندی و دسته‌بندی شود..."
              className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl focus:outline-none transition-all h-60 resize-none text-left font-mono"
              style={{ direction: "ltr" }}
            />
          </div>
        </div>

        {/* Right pane: Chunking configuration and preview statistics */}
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              تنظیمات قطعه‌بندی برای کتاب طولانی
            </h3>
            
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-2">اندازه بهینه هر بخش ترجمه (کاراکتر)</label>
                <div className="grid grid-cols-3 gap-2">
                  {[3000, 6000, 10000].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => handleChunkSizeChange(size)}
                      className={`py-2 px-3 rounded-lg border font-semibold text-center transition-all ${
                        chunkSize === size
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {size === 3000 ? "کوتاه (۳۰۰۰)" : size === 6000 ? "متوسط (۶۰۰۰)" : "بلند (۱۰۰۰۰)"}
                    </button>
                  ))}
                </div>
                <p className="text-slate-400 mt-2 leading-relaxed">
                  نکته: قطعه‌های متوسط (حدود ۱۵۰۰ کلمه) بهترین بالانس را میان سرعت، دقت و جلوگیری از خستگی هوش مصنوعی برای کتاب‌های بالای ۱۰۰ صفحه ایجاد می‌کند.
                </p>
              </div>

              {previewChunks.length > 0 && (
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex justify-between items-center text-slate-700 font-semibold">
                    <span>تعداد قطعه‌های حاصل شده:</span>
                    <span className="text-sm text-indigo-800 font-black">{previewChunks.length} قطعه</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700">
                    <span>میانگین کلمه در هر قطعه:</span>
                    <span className="font-bold text-slate-800">حدود {Math.round((inputText.split(/\s+/).length) / previewChunks.length)} کلمه</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700">
                    <span>پیش‌بینی ظرفیت چاپ کتاب:</span>
                    <span className="font-bold text-slate-800">حدود {Math.round(inputText.split(/\s+/).length / 250)} صفحه چاپی</span>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3 rounded-xl flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      کتاب با موفقیت تقسیم شد! هوش مصنوعی قادر خواهد بود هر قطعه را بدون تداخل یا پریدن رم به مرور ترجمه کند.
                    </p>
                  </div>
                </div>
              )}

              {previewChunks.length === 0 && (
                <div className="bg-amber-50 border border-amber-100 text-amber-800 p-3 rounded-xl flex gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    لطفاً متنی بنویسید یا فایلی آپلود کنید تا قطعه‌بندی تایید شود.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <button
          onClick={onCancel}
          type="button"
          className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 hover:bg-slate-100 text-slate-500 rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          پیشخوان پروژه‌ها
        </button>
        <button
          onClick={handleConfirmImport}
          disabled={previewChunks.length === 0}
          type="button"
          className="px-6 py-2.5 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all"
        >
          قطعه‌بندی، تقسیم و ایجاد قطعات کار
        </button>
      </div>
    </div>
  );
}
