/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import {
  Printer,
  ChevronLeft,
  ChevronRight,
  Settings,
  BookOpen,
  Eye,
  Type,
  Maximize2,
  BookOpenCheck,
  Download,
  Info,
  Copy,
  Check
} from "lucide-react";
import { TranslationProject, PrintConfig, BookTrimSize } from "../types";
import { paginateText, getTrimSizeDetails } from "../utils";

export interface BookPublisherLayoutProps {
  project: TranslationProject;
  onUpdatePrintConfig: (config: PrintConfig) => void;
}

export default function BookPublisherLayout({ project, onUpdatePrintConfig }: BookPublisherLayoutProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const [copied, setCopied] = useState(false);

  const getFontFamilyValue = (font: string) => {
    switch (font) {
      case "vazir": return "var(--font-vazir)";
      case "shabnam": return "var(--font-shabnam)";
      case "sahel": return "var(--font-sahel)";
      case "samim": return "var(--font-samim)";
      case "lalezar": return "var(--font-lalezar)";
      case "amiri": return "var(--font-amiri)";
      case "serif": return "var(--font-serif-fa)";
      default: return "var(--font-vazir)";
    }
  };

  const printConfig = project.printConfig;

  // Compile all completed / edited texts of the book chunks
  const compiledText = useMemo(() => {
    return project.chunks
      .map((chunk) => chunk.editedText || chunk.translatedText || "")
      .join("\n\n");
  }, [project.chunks]);

  const handleCopyToClipboard = () => {
    if (!compiledText) return;
    navigator.clipboard.writeText(compiledText)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error("خطا در کپی متن کتاب:", err);
      });
  };

  // Paginate pages dynamically based on current print configuration
  const pages = useMemo(() => {
    return paginateText(compiledText, printConfig);
  }, [compiledText, printConfig]);

  // Ensure current page remains in bounds when paginated results change
  const safePageIndex = Math.min(currentPageIndex, Math.max(0, pages.length - 1));

  const updateConfig = <K extends keyof PrintConfig>(key: K, value: PrintConfig[K]) => {
    onUpdatePrintConfig({
      ...printConfig,
      [key]: value,
    });
  };

  const activeTrimDetails = getTrimSizeDetails(printConfig.trimSize);

  // Function to trigger system printer to print book sheets beautifully
  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="book-publisher-layout" className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Print settings & controls sidebar */}
      <div className="lg:col-span-1 bg-white border border-slate-100 rounded-2xl p-5 book-page-shadow h-fit space-y-5">
        <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-2">
          <Settings className="w-4 h-4 text-emerald-600" />
          جعبه‌ابزار ویراستاری و صفحه‌بندی کتاب
        </h3>

        {/* Trim size selector */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-600">قطع کتاب چاپی</label>
          <select
            value={printConfig.trimSize}
            onChange={(e) => updateConfig("trimSize", e.target.value as BookTrimSize)}
            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white"
          >
            <option value="A5">رقعی (A5) - مناسب کتاب‌های عمومی و رمان</option>
            <option value="B5">وزیری (B5) - مناسب کتاب‌های دانشگاهی و تخصصی</option>
            <option value="A4">رحلی (A4) - مناسب مجلات، کتب درسی و مصور</option>
            <option value="A6">جیبی (A6) - مناسب کتب کم‌حجم و اشعار</option>
          </select>
          <span className="text-[10px] text-slate-400 block h-4">ابعاد استاندارد: {activeTrimDetails.dimensions}</span>
        </div>

        {/* Font Family Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-600">قلم و دست‌خط چاپی (پشتیبانی کامل فونت فارسی)</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
            {[
              { id: "vazir", label: "وزیر متن (آموزشی)" },
              { id: "shabnam", label: "شبنم (املا و ساختار)" },
              { id: "sahel", label: "ساحل (متقارن مدرن)" },
              { id: "samim", label: "صمیم (ساده و روان)" },
              { id: "lalezar", label: "لاله‌زار (ضخیم و ویژه)" },
              { id: "amiri", label: "قلم سنتی امیری" },
              { id: "serif", label: "سریف چاپی فاخر" },
            ].map((font) => (
              <button
                key={font.id}
                type="button"
                onClick={() => updateConfig("fontFamily", font.id as PrintConfig["fontFamily"])}
                className={`py-1.5 px-1.5 rounded-lg border text-[10px] md:text-xs text-center transition-all font-bold ${
                  printConfig.fontFamily === font.id
                    ? "bg-emerald-600 border-emerald-600 text-white font-black"
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
                style={{ fontFamily: getFontFamilyValue(font.id) }}
              >
                {font.label}
              </button>
            ))}
          </div>
        </div>

        {/* Font Size & Line Height */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-slate-600">
              <span>اندازه فونت چاپی ({printConfig.fontSize}pt)</span>
            </div>
            <input
              type="range"
              min="10"
              max="18"
              step="0.5"
              value={printConfig.fontSize}
              onChange={(e) => updateConfig("fontSize", parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-slate-600">
              <span>فاصله خطوط ({printConfig.lineHeight})</span>
            </div>
            <input
              type="range"
              min="1.1"
              max="2.0"
              step="0.1"
              value={printConfig.lineHeight}
              onChange={(e) => updateConfig("lineHeight", parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
          </div>
        </div>

        {/* Book Margins */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-600">حاشیه کاغذ برش کتاب</label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: "narrow", label: "باریک" },
              { id: "normal", label: "استاندارد" },
              { id: "wide", label: "عریض و بزرگ" },
            ].map((margin) => (
              <button
                key={margin.id}
                type="button"
                onClick={() => updateConfig("margins", margin.id as PrintConfig["margins"])}
                className={`py-1 px-1 rounded-lg border text-[10px] text-center transition-all font-semibold ${
                  printConfig.margins === margin.id
                    ? "bg-emerald-600 border-emerald-600 text-white"
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {margin.label}
              </button>
            ))}
          </div>
        </div>

        {/* Header Elements */}
        <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-600">نمایش شماره صفحات</span>
            <input
              type="checkbox"
              checked={printConfig.includePageNumbers}
              onChange={(e) => updateConfig("includePageNumbers", e.target.checked)}
              className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 accent-emerald-600"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-600">سربرگ چرخشی بالای صفحه</span>
            <input
              type="checkbox"
              checked={printConfig.includeRunningHeaders}
              onChange={(e) => updateConfig("includeRunningHeaders", e.target.checked)}
              className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 accent-emerald-600"
            />
          </div>

          {printConfig.includeRunningHeaders && (
            <div className="space-y-2 pt-2 animate-fade-in">
              <input
                type="text"
                placeholder="عنوان بالای صفحات فرد (مثلاً نام کتاب)"
                value={printConfig.runningHeaderTitle}
                onChange={(e) => updateConfig("runningHeaderTitle", e.target.value)}
                className="w-full text-[10px] px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
              />
              <input
                type="text"
                placeholder="عنوان بالای صفحات زوج (مثلاً نویسنده)"
                value={printConfig.runningHeaderAuthor}
                onChange={(e) => updateConfig("runningHeaderAuthor", e.target.value)}
                className="w-full text-[10px] px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}
        </div>

        <div className="space-y-2 pt-1 border-t border-slate-100">
          <button
            onClick={handleCopyToClipboard}
            type="button"
            disabled={!compiledText}
            className={`w-full flex items-center justify-center gap-2 py-2.5 border text-xs font-bold rounded-xl transition-all ${
              copied
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-emerald-600 border-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:pointer-events-none shadow-xs"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 ml-1 text-emerald-600 animate-pulse" />
                کل متن با موفقیت کپی شد!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 ml-1" />
                کپی یکجای تمام متن‌های ترجمه شده
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            type="button"
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 border border-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all"
          >
            <Printer className="w-4 h-4 ml-1" />
            چاپ مستقیم کتاب / خروجی PDF واقعی
          </button>
        </div>
      </div>

      {/* Book design preview sheet container */}
      <div className="lg:col-span-3 flex flex-col justify-between">
        {showInstructions && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-xs text-emerald-900 mb-4 flex gap-3 items-start animate-fade-in">
            <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-1">راهنمای صفحه‌بندی چاپ کتاب بالای ۱۰۰ صفحه:</p>
              <ul className="list-disc pr-4 space-y-1">
                <li>هوش مصنوعی ترجمه را بر قطعات ۶۰۰۰ کاراکتری تقسیم کرد. در این بخش می‌توانید نتیجه را به صورت ورق‌خورده و هافتون‌های صفحه کتابفروشی‌ها ببینید.</li>
                <li>هرگاه دکمه <strong>«چاپ مستقیم کتاب / خروجی PDF واقعی»</strong> را بزنید، قالب‌ها خودکار به برگه چاپی استاندارد تبدیل شده و سیستم لایوت مرورگر آماده پرینت آماده‌سازی می‌شود.</li>
                <li>تغییر قطع کتاب (به عنوان مثال جیبی یا وزیری) اتوماتیک تعداد صفحات چاپی مورد نیاز را مجدداً تخمین می‌زند.</li>
              </ul>
              <button
                type="button"
                onClick={() => setShowInstructions(false)}
                className="mt-2 font-bold hover:underline"
              >
                متوجه شدم (بستن این کادر)
              </button>
            </div>
          </div>
        )}

        {/* The book mock pages visual spread */}
        {pages.length === 0 ? (
          <div className="flex-1 bg-white border border-slate-100 rounded-2xl p-12 text-center book-page-shadow flex flex-col justify-center items-center">
            <BookOpen className="w-16 h-16 text-slate-300 mb-3" />
            <p className="text-slate-500 font-bold mb-1">کتاب شما هنوز متنی چاپی ندارد.</p>
            <p className="text-slate-400 text-xs text-center max-w-[400px]">لطفاً ابتدا از زبانه قبل قطعاتی را ترجمه کنید تا بلافاصله لایه‌بندی مکتوب کتابفروشی در اینجا شکل بگیرد.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center">
            {/* Top navigator header */}
            <div className="w-full flex justify-between items-center mb-4 bg-slate-100 px-4 py-2 rounded-xl text-xs font-medium text-slate-600">
              <span className="flex items-center gap-1.5">
                <BookOpenCheck className="w-4 h-4 text-emerald-600" />
                تعداد کل صفحات برآورد شده: <strong className="text-slate-800">{pages.length} صفحه چاپی</strong>
              </span>
              <span>
                نمایش صفحات چاپی: <strong className="text-emerald-700">{safePageIndex + 1}</strong> از <strong className="text-slate-800">{pages.length}</strong>
              </span>
            </div>

            {/* Simulated Printed Page Spread */}
            <div className={`w-full flex justify-center py-6 px-1.5 md:px-6 bg-slate-100 rounded-3xl border border-slate-200/60 overflow-hidden`}>
              <div
                id="printed-book-sheet"
                className={`bg-white border text-justify transition-all p-8 md:p-12 book-page-shadow relative select-text ${activeTrimDetails.cssSize}`}
                style={{
                  fontFamily: getFontFamilyValue(printConfig.fontFamily),
                  fontSize: `${printConfig.fontSize}px`,
                  lineHeight: printConfig.lineHeight,
                  paddingRight: printConfig.margins === "wide" ? "3rem" : printConfig.margins === "narrow" ? "1.25rem" : "2rem",
                  paddingLeft: printConfig.margins === "wide" ? "3rem" : printConfig.margins === "narrow" ? "1.25rem" : "2rem",
                }}
              >
                {/* Simulated running header */}
                {printConfig.includeRunningHeaders && (
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-6 text-[10px] text-slate-400 font-semibold" style={{ direction: "rtl" }}>
                    <span>{(safePageIndex + 1) % 2 === 0 ? (printConfig.runningHeaderAuthor || "نویسنده همکار") : (printConfig.runningHeaderTitle || "مترجم و ناشر کتاب")}</span>
                    <span className="font-mono">صفحه {safePageIndex + 1}</span>
                  </div>
                )}

                {/* Substantive dynamic page HTML block */}
                <div
                  className="prose max-w-none text-slate-800 min-h-[400px] text-justify"
                  style={{ fontFamily: getFontFamilyValue(printConfig.fontFamily) }}
                  dangerouslySetInnerHTML={{ __html: pages[safePageIndex] }}
                />

                {/* Simulated running footer (Page Indicator if running header is disabled) */}
                {printConfig.includePageNumbers && (
                  <div className="absolute bottom-4 left-0 right-0 text-center font-mono text-[11px] text-slate-400 font-bold border-t border-slate-100 pt-2 w-[calc(100%-4rem)] mx-auto">
                    {safePageIndex + 1}
                  </div>
                )}
              </div>
            </div>

            {/* Quick paging navigator buttons */}
            <div className="flex justify-center items-center gap-4 mt-4 w-full">
              <button
                type="button"
                onClick={() => setCurrentPageIndex((index) => Math.max(0, index - 1))}
                disabled={safePageIndex === 0}
                className="p-2 border border-slate-200 rounded-full hover:bg-slate-50 disabled:opacity-40 transition-all text-slate-600"
                title="صفحه قبل"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              <span className="text-xs font-bold text-slate-500">جابه جایی در صفحات کتاب چاپی</span>
              <button
                type="button"
                onClick={() => setCurrentPageIndex((index) => Math.min(pages.length - 1, index + 1))}
                disabled={safePageIndex === pages.length - 1}
                className="p-2 border border-slate-200 rounded-full hover:bg-slate-50 disabled:opacity-40 transition-all text-slate-600"
                title="صفحه بعد"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden container specifically for system printing via @media print stylesheet */}
      <div className="hidden print:block print:bg-white bg-white w-full pr-0 text-slate-900" style={{ direction: "rtl", textAlign: "justify" }}>
        {pages.map((pageHtml, index) => (
          <div
            key={index}
            className="print-page bg-white p-12 relative border-b border-dashed border-slate-200 mb-12"
            style={{
              pageBreakAfter: "always",
              fontFamily: getFontFamilyValue(printConfig.fontFamily),
              fontSize: `${printConfig.fontSize}px`,
              lineHeight: printConfig.lineHeight,
              paddingRight: printConfig.margins === "wide" ? "3rem" : printConfig.margins === "narrow" ? "1.5rem" : "2rem",
              paddingLeft: printConfig.margins === "wide" ? "3rem" : printConfig.margins === "narrow" ? "1.5rem" : "2rem",
            }}
          >
            {printConfig.includeRunningHeaders && (
              <div className="flex justify-between items-center border-b border-black pb-1 mb-4 text-[11px] text-slate-700">
                <span>{(index + 1) % 2 === 0 ? (printConfig.runningHeaderAuthor || "نویسنده") : (printConfig.runningHeaderTitle || "مترجم کتاب")}</span>
                <span>صفحه {index + 1}</span>
              </div>
            )}
            <div dangerouslySetInnerHTML={{ __html: pageHtml }} className="text-slate-900 leading-relaxed" style={{ fontFamily: getFontFamilyValue(printConfig.fontFamily) }} />
            {printConfig.includePageNumbers && (
              <div className="absolute bottom-6 left-0 right-0 text-center text-[11px] text-slate-900 font-bold border-t border-slate-200 pt-2 w-[calc(100%-4rem)] mx-auto">
                {index + 1}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
