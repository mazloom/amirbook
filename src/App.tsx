/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Languages,
  Layers,
  Sparkles,
  Info,
  ChevronLeft,
  X,
  FileText,
  Bookmark,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import ProjectList from "./components/ProjectList";
import BookImport from "./components/BookImport";
import GlossaryManager from "./components/GlossaryManager";
import TranslationStudio from "./components/TranslationStudio";
import BookPublisherLayout from "./components/BookPublisherLayout";
import AIStudioInsight from "./components/AIStudioInsight";
import { TranslationProject, TextChunk, GlossaryItem, PrintConfig, BookAnalysis } from "./types";

const LOCAL_STORAGE_KEY = "persian_book_translator_projects";

const SAMPLE_PROJECT: Omit<TranslationProject, "id" | "createdAt"> = {
  title: "A Brief Guide to Habits & Focus",
  author: "Sarah Jenkins",
  context: "یک کتاب کوتاه در مورد سیستم شکل‌گیری تمرکز و تغییر عادت‌های روزمره با استفاده از مکانیسم‌های ساده پاداش.",
  originalLanguage: "English",
  targetTone: "fluent",
  chunks: [
    {
      id: "sample-c1",
      index: 1,
      title: "بخش ۱: قدرت تمرکز",
      originalText: `CHAPTER 1: THE POWER OF DEEP HABITS.
Every single day, we perform hundreds of micro-actions without thinking. These of course, are what we commonly refer to as habits. Research shows that more than forty percent of our daily activities are purely automatic.

If you want to alter the direction of your life, you cannot solve it purely with willpower. Willpower is like a limited mental battery; it runs down rapidly when faced with stress, noise, and digital notifications. Instead, you must build robust systems. James once wrote that we do not rise to the level of our goals, but we fall to the level of our systems. 

This means making your desired focus triggers visual and visible. If you intend to read a physical book before going to sleep tonight, place that book directly on your pillow early in the morning. When bedtime arrives, the action becomes obvious and effortless.`,
      status: "original"
    },
    {
      id: "sample-c2",
      index: 2,
      title: "بخش ۲: سیگنال و پاداش",
      originalText: `CHAPTER 2: THE REWARD CYCLE.
The habit loop consists of three main elements: the cue, the routine, and the reward. To understand why we check our social feeds seventy times a day, we must isolate the reward. The reward is rarely the content itself; rather, it is the small shot of dopamine that temporarily relieves boredom or isolation.

To redesign the cycle, keep the cue and the reward, but change the physical routine. For instance, if you feel the cue of afternoon fatigue and want to grab a sugary coffee, change the routine to a five-minute stretch in fresh air. It satisfies the similar craving of mental break without the harmful crash.`,
      status: "original"
    }
  ],
  glossary: [
    { id: "g1", english: "Cue", persian: "نشانه رفتاری" },
    { id: "g2", english: "Reward", persian: "پاداش" },
    { id: "g3", english: "Willpower", persian: "اراده ذاتی" }
  ],
  printConfig: {
    trimSize: "A5",
    fontFamily: "vazir",
    fontSize: 12,
    lineHeight: 1.5,
    margins: "normal",
    includePageNumbers: true,
    includeRunningHeaders: true,
    runningHeaderTitle: "قدرت عادت‌های عمیق",
    runningHeaderAuthor: "سارا جنکینز",
    bindingSide: "right"
  }
};

export default function App() {
  const [projects, setProjects] = useState<TranslationProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"workspace" | "publish" | "ai-studio">("workspace");
  const [isImporting, setIsImporting] = useState(false);
  const [activeChunkId, setActiveChunkId] = useState<string | null>(null);

  // AI progress state trackers
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Custom persistent Toast notifications
  const [notification, setNotification] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    // Sync local storage projects
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        setProjects(JSON.parse(stored));
      } catch (e) {
        console.error("Error parsing stored translation project state", e);
      }
    }
  }, []);

  const saveToStorage = (updatedProjects: TranslationProject[]) => {
    setProjects(updatedProjects);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedProjects));
  };

  const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setNotification({ msg, type });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const handleCreateProject = (title: string, author: string, context: string, tone: TranslationProject["targetTone"]) => {
    const newProj: TranslationProject = {
      id: "p_" + Date.now(),
      title,
      author,
      context,
      originalLanguage: "English",
      targetTone: tone,
      chunks: [],
      glossary: [],
      printConfig: {
        trimSize: "A5",
        fontFamily: "vazir",
        fontSize: 12,
        lineHeight: 1.5,
        margins: "normal",
        includePageNumbers: true,
        includeRunningHeaders: true,
        runningHeaderTitle: title,
        runningHeaderAuthor: author || "نویسنده اصلی",
        bindingSide: "right"
      },
      createdAt: Date.now()
    };

    saveToStorage([newProj, ...projects]);
    setActiveProjectId(newProj.id);
    setIsImporting(true); // Launch book importer immediately of course!
    showToast(`پروژه کتاب "${title}" ایجاد شد. آماده دریافت فصل‌ها است.`, "success");
  };

  const handleDeleteProject = (id: string) => {
    if (confirm("آیا مایل به حذف کامل این پروژه و ترجمه‌های آن هستید؟ این عمل غیرقابل بازگشت است.")) {
      const filtered = projects.filter((p) => p.id !== id);
      saveToStorage(filtered);
      if (activeProjectId === id) {
        setActiveProjectId(null);
      }
      showToast("پروژه مورد نظر حذف شد.", "info");
    }
  };

  const handlePreloadSampleProject = () => {
    const newProj: TranslationProject = {
      ...SAMPLE_PROJECT,
      id: "p_sample_" + Date.now(),
      createdAt: Date.now()
    };
    saveToStorage([newProj, ...projects]);
    setActiveProjectId(newProj.id);
    setIsImporting(false);
    showToast("کتاب نمونه انگلیسی با ۲ بخش تستی و واژه‌نامه تخصصی با موفقیت بارگذاری شد!", "success");
  };

  const activeProject = projects.find((p) => p.id === activeProjectId) || null;

  // Glossary updates
  const handleAddGlossaryItem = (english: string, persian: string) => {
    if (!activeProject) return;
    const item: GlossaryItem = {
      id: "g_" + Date.now(),
      english,
      persian
    };
    const updated = projects.map((proj) => {
      if (proj.id === activeProject.id) {
        return {
          ...proj,
          glossary: [...proj.glossary, item]
        };
      }
      return proj;
    });
    saveToStorage(updated);
    showToast("کلمه جدید به واژه‌نامه یکپارچه کتاب الصاق شد.");
  };

  const handleDeleteGlossaryItem = (itemId: string) => {
    if (!activeProject) return;
    const updated = projects.map((proj) => {
      if (proj.id === activeProject.id) {
        return {
          ...proj,
          glossary: proj.glossary.filter((gi) => gi.id !== itemId)
        };
      }
      return proj;
    });
    saveToStorage(updated);
    showToast("واژه از لغت‌نامه حذف گردید.", "info");
  };

  // Convert imported chunks into target product
  const handleImportChunks = (chunksList: Omit<TextChunk, "id">[]) => {
    if (!activeProject) return;
    const populated = chunksList.map((c, idx) => ({
      ...c,
      id: `c_${idx}_${Date.now()}`
    })) as TextChunk[];

    const updated = projects.map((proj) => {
      if (proj.id === activeProject.id) {
        return {
          ...proj,
          chunks: populated
        };
      }
      return proj;
    });

    saveToStorage(updated);
    setIsImporting(false);
    if (populated.length > 0) {
      setActiveChunkId(populated[0].id);
    }
    showToast(`کتاب شما با موفقیت به ${populated.length} بخش چاپی تفکیک و بارگذاری شد.`);
  };

  // Run Gemini translation via server API
  const handleTranslateChunk = async (chunkId: string, tone: TranslationProject["targetTone"]) => {
    if (!activeProject) return;
    const targetChunk = activeProject.chunks.find((c) => c.id === chunkId);
    if (!targetChunk) return;

    // Build simple glossary map
    const glossaryMap: Record<string, string> = {};
    activeProject.glossary.forEach((item) => {
      glossaryMap[item.english] = item.persian;
    });

    setIsProcessing(true);
    setProcessingId(chunkId);

    // Optimistically update status
    const initialUpdate = projects.map((p) => {
      if (p.id === activeProject.id) {
        return {
          ...p,
          chunks: p.chunks.map((c) => (c.id === chunkId ? { ...c, status: "translating" as const, error: undefined } : c))
        };
      }
      return p;
    });
    setProjects(initialUpdate);

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: targetChunk.originalText,
          tone,
          glossary: glossaryMap,
          context: activeProject.context
        })
      });

      if (!response.ok) {
        const errDetails = await response.json();
        throw new Error(errDetails.error || "موتور جمینای خطایی صادر کرد");
      }

      const info = await response.json();

      const finalUpdate = projects.map((p) => {
        if (p.id === activeProject.id) {
          return {
            ...p,
            chunks: p.chunks.map((c) => (c.id === chunkId ? { ...c, translatedText: info.translatedText, status: "translated" as const } : c))
          };
        }
        return p;
      });
      saveToStorage(finalUpdate);
      showToast("ترجمه اولیه این بخش با موفقیت حاصل شد.", "success");
    } catch (e: any) {
      console.error(e);
      const finalUpdate = projects.map((p) => {
        if (p.id === activeProject.id) {
          return {
            ...p,
            chunks: p.chunks.map((c) => (c.id === chunkId ? { ...c, status: "original" as const, error: e.message } : c))
          };
        }
        return p;
      });
      saveToStorage(finalUpdate);
      showToast(e.message || "ترجمه قطعه ناموفق بود.", "error");
    } finally {
      setIsProcessing(false);
      setProcessingId(null);
    }
  };

  // Run Persian publishing Editorial & proofreader API
  const handleEditChunk = async (chunkId: string, type: "halfspace" | "grammar" | "full") => {
    if (!activeProject) return;
    const targetChunk = activeProject.chunks.find((c) => c.id === chunkId);
    if (!targetChunk) return;

    // Use editedText as base if exists, otherwise fallback to translatedText
    const baseText = targetChunk.editedText || targetChunk.translatedText || "";
    if (!baseText) {
      showToast("ابتدا این بخش را ترجمه کنید تا متنی برای ویراستاری ادبی وجود داشته باشد.", "info");
      return;
    }

    setIsProcessing(true);
    setProcessingId(chunkId);

    // Optimistically update status
    const initialUpdate = projects.map((p) => {
      if (p.id === activeProject.id) {
        return {
          ...p,
          chunks: p.chunks.map((c) => (c.id === chunkId ? { ...c, status: "editing" as const } : c))
        };
      }
      return p;
    });
    setProjects(initialUpdate);

    try {
      const response = await fetch("/api/edit-proofread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: baseText,
          type
        })
      });

      if (!response.ok) {
        throw new Error("سرور ویراستار خطایی صادر کرد");
      }

      const info = await response.json();

      const finalUpdate = projects.map((p) => {
        if (p.id === activeProject.id) {
          return {
            ...p,
            chunks: p.chunks.map((c) => (c.id === chunkId ? { ...c, editedText: info.editedText, status: "completed" as const } : c))
          };
        }
        return p;
      });
      saveToStorage(finalUpdate);
      showToast("ویراستاری، آرایش نیم‌فاصله‌ها و جریان‌سازی چاپی متن انجام شد.", "success");
    } catch (e: any) {
      console.error(e);
      const finalUpdate = projects.map((p) => {
        if (p.id === activeProject.id) {
          return {
            ...p,
            chunks: p.chunks.map((c) => (c.id === chunkId ? { ...c, status: "translated" as const, error: e.message } : c))
          };
        }
        return p;
      });
      saveToStorage(finalUpdate);
      showToast("عملیات ویراستاری و قلم‌زنی با موفقیت صورت نگرفت.", "error");
    } finally {
      setIsProcessing(false);
      setProcessingId(null);
    }
  };

  // User made direct manual edit to the translated target textbox
  const handleUpdateChunkManualText = (chunkId: string, text: string) => {
    if (!activeProject) return;
    const updated = projects.map((p) => {
      if (p.id === activeProject.id) {
        return {
          ...p,
          chunks: p.chunks.map((c) => (c.id === chunkId ? { ...c, editedText: text } : c))
        };
      }
      return p;
    });
    saveToStorage(updated);
  };

  const handleMarkCompleted = (chunkId: string) => {
    if (!activeProject) return;
    const updated = projects.map((p) => {
      if (p.id === activeProject.id) {
        return {
          ...p,
          chunks: p.chunks.map((c) => (c.id === chunkId ? { ...c, status: "completed" as const } : c))
        };
      }
      return p;
    });
    saveToStorage(updated);
    showToast("این بخش تایید و نهایی شد! اکنون در لایه‌بندی کتاب آماده پرینت قرار گرفت.");
  };

  const handleUpdatePrintConfig = (config: PrintConfig) => {
    if (!activeProject) return;
    const updated = projects.map((p) => {
      if (p.id === activeProject.id) {
        return {
          ...p,
          printConfig: config
        };
      }
      return p;
    });
    saveToStorage(updated);
  };

  const handleUpdateAnalysis = (analysis: BookAnalysis) => {
    if (!activeProject) return;
    const updated = projects.map((p) => {
      if (p.id === activeProject.id) {
        return { ...p, analysis };
      }
      return p;
    });
    saveToStorage(updated);
  };

  const handleUpdateCoverImage = (url: string) => {
    if (!activeProject) return;
    const updated = projects.map((p) => {
      if (p.id === activeProject.id) {
        return { ...p, coverImageUrl: url };
      }
      return p;
    });
    saveToStorage(updated);
  };

  return (
    <div id="app-root-wrapper" className="min-h-screen flex flex-col justify-between font-vazir print:bg-white bg-slate-50 print:p-0 p-4 md:p-8">
      {/* Toast Notification */}
      {notification && (
        <div
          id="system-toast"
          className={`fixed top-4 left-4 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl book-page-shadow animate-fade-in text-xs font-bold ${
            notification.type === "success"
              ? "bg-emerald-600 text-white"
              : notification.type === "error"
              ? "bg-rose-600 text-white"
              : "bg-indigo-600 text-white"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-4" />
          ) : (
            <AlertCircle className="w-4" />
          )}
          <span>{notification.msg}</span>
          <button onClick={() => setNotification(null)} className="ml-0.5 opacity-80 hover:opacity-100">
            <X className="w-3" />
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-7xl mx-auto space-y-6 print:space-y-0 print:max-w-none">
        {/* Header - Hidden in Print */}
        <header className="flex flex-wrap justify-between items-center bg-white border border-slate-100 rounded-3xl p-6 book-page-shadow text-slate-800 gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-sm">
              <Languages className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900">مترجم و ناشر کتاب‌های بالای ۱۰۰ صفحه</h1>
              <p className="text-xs text-slate-500 font-medium">مجهز به سامانه هوشمند تصحیح دستور ادبی، املای رایانه‌ای نیم‌فاصله و تنظیم فیبای چاپ کتاب</p>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-bold bg-slate-50 border border-slate-100 px-4 py-2 rounded-2xl flex items-center gap-1.5 text-left">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping ml-1" />
            مصلح زبان فارسی: فعال
          </div>
        </header>

        {/* Project List / Welcome Hub - Hidden if importing or project loaded */}
        {!activeProjectId && !isImporting && (
          <div className="print:hidden">
            <ProjectList
              projects={projects}
              activeProjectId={activeProjectId}
              onSelectProject={(id) => {
                setActiveProjectId(id);
                // default chunk initialization if available
                const proj = projects.find((p) => p.id === id);
                if (proj && proj.chunks.length > 0) {
                  setActiveChunkId(proj.chunks[0].id);
                }
              }}
              onDeleteProject={handleDeleteProject}
              onCreateProject={handleCreateProject}
              onLoadSample={handlePreloadSampleProject}
            />
          </div>
        )}

        {/* Active Project Dashboard Workspace */}
        {activeProject && (
          <div className="space-y-6 print:space-y-0 print:border-none">
            {/* Top Toolbar actions - Hidden in Print */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-100 rounded-2xl p-4 book-page-shadow print:hidden">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setActiveProjectId(null);
                    setIsImporting(false);
                  }}
                  type="button"
                  className="px-3.5 py-2 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-xl text-xs font-bold transition-all"
                >
                  بازگشت به پیشخوان کتب
                </button>
                <div className="h-6 w-[1px] bg-slate-200" />
                <div>
                  <h2 className="text-sm font-black text-slate-800">{activeProject.title}</h2>
                  <p className="text-[10px] text-slate-400">نویسنده: <span className="font-semibold text-slate-600" style={{ direction: "ltr" }}>{activeProject.author || "فاقد نویسنده"}</span></p>
                </div>
              </div>

              {/* Tab Navigation selectors */}
              {!isImporting && (
                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setActiveTab("workspace")}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      activeTab === "workspace" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    میز کار و ترجمه
                  </button>
                  <button
                    onClick={() => setActiveTab("publish")}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      activeTab === "publish" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    صفحه‌بندی و چاپ نسخه فیزیکی
                  </button>
                  <button
                    onClick={() => setActiveTab("ai-studio")}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      activeTab === "ai-studio" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    طراحی جلد و شناسنامه فیپا
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setIsImporting(!isImporting)}
                  className="px-3.5 py-1.5 text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl transition-all"
                >
                  {isImporting ? "اتمام بارگذاری" : "بارگذاری مجدد متن جدید کتاب"}
                </button>
              </div>
            </div>

            {/* Sub-view: Book import and slice workspace */}
            {isImporting ? (
              <div className="print:hidden">
                <BookImport
                  onImportChunks={handleImportChunks}
                  onCancel={() => setIsImporting(false)}
                  projectTitle={activeProject.title}
                />
              </div>
            ) : (
              <div className="print:hidden">
                {activeTab === "workspace" && (
                  <div className="space-y-6">
                    {/* Tiny stats banner */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white border border-slate-100 rounded-xl p-4 flex justify-between items-center">
                        <span className="text-xs text-slate-500 font-semibold">تعداد قطعات کتاب</span>
                        <span className="text-base font-black text-slate-800">{activeProject.chunks.length} فایل</span>
                      </div>
                      <div className="bg-white border border-slate-100 rounded-xl p-4 flex justify-between items-center">
                        <span className="text-xs text-slate-500 font-semibold">بخش‌های آماده چاپ</span>
                        <span className="text-base font-black text-emerald-700">
                          {activeProject.chunks.filter((c) => c.status === "completed").length} بخش
                        </span>
                      </div>
                      <div className="bg-white border border-slate-100 rounded-xl p-4 flex justify-between items-center">
                        <span className="text-xs text-slate-500 font-semibold">لحن نگارش</span>
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
                          {activeProject.targetTone === "fluent"
                            ? "روان رمان ادبی"
                            : activeProject.targetTone === "formal"
                            ? "رسمی فاخر"
                            : activeProject.targetTone === "academic"
                            ? "آکادمیک و علمی"
                            : activeProject.targetTone === "colloquial"
                            ? "شکسته و محاوره"
                            : "کلمه به کلمه"}
                        </span>
                      </div>
                    </div>

                    {/* Integrated Glossary dictionary */}
                    <GlossaryManager
                      glossary={activeProject.glossary}
                      onAddGlossaryItem={handleAddGlossaryItem}
                      onDeleteGlossaryItem={handleDeleteGlossaryItem}
                    />

                    {/* Translation Core Studio */}
                    {activeProject.chunks.length === 0 ? (
                      <div className="text-center py-12 bg-white border rounded-2xl">
                        <p className="text-sm font-bold text-slate-500">متن فصلی وارد نشده است. بر روی ردیف بالا کلیک کنید و متن مبدا را پیست کنید.</p>
                      </div>
                    ) : (
                      <TranslationStudio
                        project={activeProject}
                        activeChunkId={activeChunkId}
                        onSelectChunk={setActiveChunkId}
                        onTranslateChunk={handleTranslateChunk}
                        onEditChunk={handleEditChunk}
                        onUpdateChunkManualText={handleUpdateChunkManualText}
                        onMarkCompleted={handleMarkCompleted}
                        isProcessing={isProcessing}
                        processingId={processingId}
                      />
                    )}
                  </div>
                )}

                {activeTab === "publish" && (
                  <BookPublisherLayout
                    project={activeProject}
                    onUpdatePrintConfig={handleUpdatePrintConfig}
                  />
                )}

                {activeTab === "ai-studio" && (
                  <AIStudioInsight
                    project={activeProject}
                    onUpdateAnalysis={handleUpdateAnalysis}
                    onUpdateCoverImage={handleUpdateCoverImage}
                    isProcessing={isProcessing}
                    onShowNotification={showToast}
                  />
                )}
              </div>
            )}

            {/* Print Mode visual container - visible ONLY when system print window is triggered */}
            {!isImporting && activeTab === "publish" && (
              <div className="hidden print:block w-full bg-white text-black p-0">
                <BookPublisherLayout
                  project={activeProject}
                  onUpdatePrintConfig={handleUpdatePrintConfig}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer - Hidden in Print */}
      <footer className="mt-12 text-center text-xs text-slate-400 py-6 border-t border-slate-200/50 print:hidden">
        <p className="font-semibold mb-1">نسخه ۱.۱۵ - نرم‌افزار حرفه‌ای ترجمه کتب فرامرزی و صفحه‌آرایی خودکار</p>
        <p>مصنف زبان ملی مجهز به قلم‌های وب فارسی استاندارد فونت و هماهنگ با چاپگرهای عمومی</p>
      </footer>
    </div>
  );
}
