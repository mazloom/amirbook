/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Plus, BookOpen, Trash2, Calendar, BookText, Settings2, FileCheck2, Lightbulb } from "lucide-react";
import { TranslationProject } from "../types";

export interface ProjectListProps {
  projects: TranslationProject[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onCreateProject: (title: string, author: string, context: string, tone: TranslationProject["targetTone"]) => void;
  onLoadSample: () => void;
}

export default function ProjectList({
  projects,
  activeProjectId,
  onSelectProject,
  onDeleteProject,
  onCreateProject,
  onLoadSample,
}: ProjectListProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [context, setContext] = useState("");
  const [tone, setTone] = useState<TranslationProject["targetTone"]>("fluent");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreateProject(title, author, context, tone);
    // Reset form
    setTitle("");
    setAuthor("");
    setContext("");
    setTone("fluent");
    setShowForm(false);
  };

  return (
    <div id="project-list-container" className="bg-white rounded-2xl border border-slate-100 p-6 book-page-shadow">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-emerald-600" />
          <h2 className="text-xl font-bold text-slate-800">پروژه‌های ترجمه و انتشار</h2>
        </div>
        <div className="flex gap-2">
          {projects.length === 0 && (
            <button
              onClick={onLoadSample}
              type="button"
              className="flex items-center gap-2 text-xs font-semibold px-3 py-2 text-indigo-700 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 rounded-xl transition-all"
            >
              <Lightbulb className="w-4 h-4 ml-1" />
              بارگذاری نمونه تستی کتاب
            </button>
          )}
          <button
            onClick={() => setShowForm(!showForm)}
            type="button"
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl transition-all"
          >
            <Plus className="w-4 h-4 ml-1" />
            پروژه جدید
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-6 animate-fade-in">
          <h3 className="text-md font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-emerald-600" />
            تنظیم مشخصات و مشخصه‌های کتاب جدید
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">عنوان اصلی کتاب (انگلیسی یا زبان مبدا)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: Atomic Habits"
                required
                className="w-full text-sm px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-all text-left"
                style={{ direction: "ltr" }}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">نام نویسنده اصلی</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="مثال: James Clear"
                className="w-full text-sm px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-all text-left"
                style={{ direction: "ltr" }}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-600 mb-2">لحن ترجمه هوشمند مکتوب کتاب</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as TranslationProject["targetTone"])}
              className="w-full text-sm px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-all"
            >
              <option value="fluent">روان و خوش‌خوان رمان ادبی (مناسب برای کتاب‌های عمومی، خودیاری، رمان و توسعه فردی)</option>
              <option value="formal">رسمی و فاخر کتابخانه‌ای (مناسب کتاب‌های تاریخی، حقوقی، اقتصادی و فلسفی جدی)</option>
              <option value="academic">علمی، دقیق و فنی آکادمیک (مناسب مقالات پژوهشی، مستندات ریاضی و کتب دانشگاهی)</option>
              <option value="colloquial">شکسته و عامیانه و عامه‌پسند (مناسب برای نقل‌قول‌ها، نمایشنامه و دیالوگ‌ها)</option>
              <option value="literal">ترجمه لغت به لغت وفادار به دستور زبان و ترتیب واژگان مبدا</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-600 mb-2">زمینه‌سازی و دستورالعمل موضوعی کتاب (به هوش مصنوعی جهت پیوستگی واژگان کمک می‌کند)</label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="مثال: این کتاب یک اثر خودیاری در حوزه توسعه فردی و شکل‌گیری عادت‌های رفتاری خرد است. لطفاً اصطلاحاتی مانند Cue را به «نشانه» و Reward را به «پاداش» ترجمه کنید."
              className="w-full text-sm px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-all h-20 resize-none"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all"
            >
              ایجاد پروژه جدید
            </button>
          </div>
        </form>
      )}

      {projects.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
          <BookText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium mb-1">هنوز هیچ پروژه‌ای تعریف نکرده‌اید.</p>
          <p className="text-slate-400 text-xs mb-3">یک پروژه ترجمه جدید بسازید یا کتاب تستی نمونه را برای بررسی کلید بزنید.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const translatedCount = project.chunks.filter((c) => c.status === "completed" || c.status === "translated").length;
            const percentage = project.chunks.length > 0 ? Math.round((translatedCount / project.chunks.length) * 100) : 0;

            const isSelected = activeProjectId === project.id;

            return (
              <div
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className={`relative border-2 rounded-2xl p-5 cursor-pointer transition-all hover:scale-[1.01] ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-50/20 shadow-sm"
                    : "border-slate-100 bg-white hover:border-slate-200"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="max-w-[80%]">
                    <h4 className="font-bold text-slate-800 text-base truncate" title={project.title}>
                      {project.title}
                    </h4>
                    <p className="text-xs text-slate-500 truncate" style={{ direction: "ltr", textAlign: "right" }}>
                      بنویسنده: {project.author || "نامشخص"}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteProject(project.id);
                    }}
                    type="button"
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all"
                    title="حذف پروژه"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 ml-1" />
                      {new Date(project.createdAt).toLocaleDateString("fa-IR")}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-emerald-700">
                      <FileCheck2 className="w-3.5 h-3.5 ml-1" />
                      {project.chunks.length} بخش تفکیک‌شده
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                      <span>پیشرفت ترجمه کتاب</span>
                      <span>{percentage}٪</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    فعال
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
