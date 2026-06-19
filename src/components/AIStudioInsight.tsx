/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Sparkles,
  Award,
  BookMarked,
  Tags,
  Image,
  Globe2,
  RefreshCw,
  Lightbulb,
  FileSpreadsheet,
  CheckCircle,
  HelpCircle
} from "lucide-react";
import { TranslationProject, BookAnalysis } from "../types";

export interface AIStudioInsightProps {
  project: TranslationProject;
  onUpdateAnalysis: (analysis: BookAnalysis) => void;
  onUpdateCoverImage: (url: string) => void;
  isProcessing: boolean;
  onShowNotification: (msg: string, type: "success" | "error" | "info") => void;
}

export default function AIStudioInsight({
  project,
  onUpdateAnalysis,
  onUpdateCoverImage,
  isProcessing,
  onShowNotification,
}: AIStudioInsightProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [generatingCover, setGeneratingCover] = useState(false);
  const [stylePrompt, setStylePrompt] = useState("Minimalist, professional, warm earth-toned shapes, elegant modern Persian calligraphy layout");
  const [subtitle, setSubtitle] = useState("");

  const handleAnalyzeBook = async () => {
    // Collect text sample
    const sampleText = project.chunks
      .slice(0, 3)
      .map((c) => c.editedText || c.translatedText || c.originalText)
      .join("\n\n");

    if (!sampleText.trim()) {
      onShowNotification("لطفاً ابتدا متنی را برای ترجمه یا قطعه‌بندی وارد کنید تا نمونه مناسب جهت تحلیل موجود باشد.", "info");
      return;
    }

    setAnalyzing(true);
    try {
      const res = await fetch("/api/analyze-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullTextSample: sampleText,
          originalTitle: project.title,
        }),
      });

      if (!res.ok) {
        throw new Error("خطا در تحلیل سمت سرور");
      }

      const data = await res.json();
      onUpdateAnalysis(data);
      onShowNotification("تحلیل هوشمند کتاب و تدوین شناسنامه فیپا با موفقیت انجام شد!", "success");
    } catch (e: any) {
      console.error(e);
      onShowNotification("خطایی در اتصال یا اجرای تحلیل کتاب رخ داد.", "error");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateCover = async () => {
    setGeneratingCover(true);
    try {
      const res = await fetch("/api/generate-cover-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: project.analysis?.suggestedPersianTitle || project.title,
          subtitle,
          stylePrompt,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "خطا در ساخت جلد");
      }

      const data = await res.json();
      if (data.imageUrl) {
        onUpdateCoverImage(data.imageUrl);
        onShowNotification("طراحی هنری و هوشمندانه جلد کتاب با موفقیت به پایان رسید!", "success");
      } else {
        throw new Error("عکسی دریافت نشد");
      }
    } catch (e: any) {
      console.error(e);
      onShowNotification("ساخت هوشمند تصویر به علت عدم تکمیل یا تراکم کوئری ناموفق بود. مجدداً تلاش کنید.", "error");
    } finally {
      setGeneratingCover(false);
    }
  };

  return (
    <div id="ai-insight-container" className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-100 p-6 book-page-shadow">
        <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Award className="w-6 h-6 text-emerald-600 animate-bounce" />
            <div>
              <h2 className="text-xl font-bold text-slate-800">هوش استودیویی: شناسنامه کتاب، ویترینی و جلد هوشمند</h2>
              <p className="text-xs text-slate-500">طراحی طرح جلد هنری چاپی و استخراج خودکار فیپا فرضی و پشت‌نویس کتاب توسط مدل‌های هوشمند جمینای</p>
            </div>
          </div>

          <button
            onClick={handleAnalyzeBook}
            disabled={analyzing || isProcessing}
            type="button"
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
          >
            {analyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin ml-1" />
                در حال استخراج شناسنامه و فیپا...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 ml-1" />
                تحلیل خودکار بافت کتاب و تنظیم فیپا
              </>
            )}
          </button>
        </div>

        {/* Content displays layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Analysis Data */}
          <div className="lg:col-span-2 space-y-4">
            {project.analysis ? (
              <div className="space-y-4">
                {/* Title Suggestion */}
                <div className="bg-emerald-50/40 border border-emerald-100/60 rounded-2xl p-4">
                  <h4 className="text-xs font-bold text-emerald-800 mb-1 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    عنوان پیشنهادی تجاری فارسی:
                  </h4>
                  <p className="font-extrabold text-slate-800 text-lg">{project.analysis.suggestedPersianTitle}</p>
                </div>

                {/* Backcover blurb */}
                <div className="border border-slate-100 bg-slate-50/50 rounded-2xl p-4">
                  <h4 className="text-xs font-bold text-indigo-800 mb-2">معرفی پشت جلد کتاب (خلاصه جذاب و ترغیب‌کننده خریدار)</h4>
                  <p className="text-xs text-slate-600 leading-relaxed text-justify">{project.analysis.blurb}</p>
                </div>

                {/* Classification info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-slate-100 rounded-2xl p-4">
                    <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                      <BookMarked className="w-4 h-4 text-slate-500" />
                      پیشنهاد دیویی فرضی فیپا:
                    </h4>
                    <span className="font-mono bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-xl text-xs inline-block" style={{ direction: "ltr" }}>
                      {project.analysis.DeweyDec || "موجود نیست"}
                    </span>
                  </div>

                  <div className="border border-slate-100 rounded-2xl p-4">
                    <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                      <Tags className="w-4 h-4 text-slate-500" />
                      کلمات کلیدی نمایه کتاب:
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {project.analysis.keywords?.map((keyword, i) => (
                        <span key={i} className="bg-indigo-50 text-indigo-700 text-[10px] px-2 py-1 rounded-md font-semibold">
                          #{keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Proposed Table of Contents */}
                {project.analysis.toc && project.analysis.toc.length > 0 && (
                  <div className="border border-slate-100 rounded-2xl p-4">
                    <h4 className="text-xs font-bold text-slate-700 mb-2">پیشنهاد فهرست مطالب و ساختار ترغیب‌کننده فصول:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {project.analysis.toc.map((chapter, idx) => (
                        <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2 rounded-xl text-slate-700">
                          <span className="font-bold text-indigo-700">{(idx + 1).toLocaleString("fa-IR")}.</span>
                          <span className="truncate">{chapter}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col justify-center items-center h-full">
                <FileSpreadsheet className="w-12 h-12 text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-500 mb-1">شناسنامه هوشمند کتاب صادر نشده است.</p>
                <p className="text-[11px] text-slate-400">دکمه تحلیل بالای صفحه را بزنید تا هوش مصنوعی با خواندن محتوای کتاب، فیپا، عنوان و اهداف را تولید کند.</p>
              </div>
            )}
          </div>

          {/* AI Cover generator Column */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between h-fit space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Image className="w-4 h-4 text-emerald-600" />
              طراحی پوستر و طرح جلد کتاب
            </h3>

            {project.coverImageUrl ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden aspect-[2/3] relative group shadow-sm">
                <img
                  src={project.coverImageUrl}
                  alt="AIGeneratedBookCover"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-end p-3 text-white">
                  <p className="text-[10px] leading-relaxed">طرح جلد ساخته‌شده با ابعاد واقعی چاپی</p>
                  <button
                    onClick={() => onUpdateCoverImage("")}
                    type="button"
                    className="mt-2 text-[10px] bg-rose-600 hover:bg-rose-700 py-1 text-center font-bold rounded-lg"
                  >
                    حذف و طراحی مجدد
                  </button>
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-slate-200 rounded-xl aspect-[2/3] flex flex-col justify-center items-center p-6 text-center text-xs text-slate-500 bg-white">
                <HelpCircle className="w-10 h-10 text-slate-300 mb-2" />
                <p className="font-bold text-xs text-slate-600">هنوز طرح جلدی ساخته نشده است.</p>
                <p className="text-[10px] text-slate-400 mt-1 lines-clamp-2">با زدن دکمه زیر بر روی تنظیمات دلخواه، برای کتاب خود یک پس‌زمینه و کاور بسیار شیک بسازید.</p>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">عنوان فرعی (زیرعنوان پشت جلد)</label>
                <input
                  type="text"
                  placeholder="مثال: چگونه عادات بد را بشکنیم و خوب را خلق کنیم"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">پرامپت و سبک طراحی جلد هوشمند</label>
                <textarea
                  value={stylePrompt}
                  onChange={(e) => setStylePrompt(e.target.value)}
                  placeholder="توصیفات گرافیکی جلد..."
                  className="w-full text-[10px] px-3 py-2 border border-slate-200 rounded-lg h-16 resize-none focus:outline-none focus:border-indigo-500 bg-white"
                />
              </div>

              <button
                type="button"
                onClick={handleGenerateCover}
                disabled={generatingCover || isProcessing}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all"
              >
                {generatingCover ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin ml-1" />
                    درحال تصویرسازی طرح...
                  </>
                ) : (
                  <>
                    <Image className="w-4 h-4 ml-1" />
                    ساخت و تصویرسازی جلد کتاب چاپی
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Persian Application Ideas and Expansion Strategies */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 book-page-shadow">
        <div className="flex items-center gap-3 mb-4">
          <Lightbulb className="w-5 h-5 text-indigo-600" />
          <h3 className="text-md font-bold text-slate-800">ایده‌ها و پیشنهادات برای توسعه ثانویه (درخواست کاربر)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="border border-slate-50 bg-slate-50/40 p-4 rounded-2xl leading-relaxed space-y-1.5">
            <h4 className="font-extrabold text-slate-800 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
              ۱. افزودن خروجی فایل EPUB استاندارد
            </h4>
            <p className="text-slate-500">
              می‌توان کتاب‌های بالای ۱۰۰ صفحه ترجمه شده را بر اساس استانداردهای ساخت کتاب‌های صوتی و دیجیتال (مانند فیدیبو و طاقچه) به فرمت EPUB ۳ نیز بسته‌بندی کرد تا نویسنده نیاز به هیچ پلتفرم جانبی نداشته باشد.
            </p>
          </div>

          <div className="border border-slate-50 bg-slate-50/40 p-4 rounded-2xl leading-relaxed space-y-1.5">
            <h4 className="font-extrabold text-slate-800 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
              ۲. واژه‌نامه تخصصی ترجمه مشارکتی
            </h4>
            <p className="text-slate-500">
              قابلیت ایمپورت و اکسپورت فایل‌های واژه‌نامه فنی کتب مرجع با قابلیت رأی‌گیری آنلاین که به مترجم‌های گوناگون شانس تصحیح و روان‌سازی کارهای بزرگتر را می‌دهد.
            </p>
          </div>

          <div className="border border-slate-50 bg-slate-50/40 p-4 rounded-2xl leading-relaxed space-y-1.5">
            <h4 className="font-extrabold text-slate-800 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
              ۳. درگاه مستقیم چاپ خودگردان (Self-Publishing)
            </h4>
            <p className="text-slate-500">
              قراردادن درگاه‌های چاپ دیجیتال فوری کتاب‌ها با اتصال مستقیم به چاپخانه‌های محلی جهت انتشار نسخه‌های تک‌بسته و گالینگور در تیراژ بسیار کم با کمترین قیمت ممکن.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
