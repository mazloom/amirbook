/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TextChunk {
  id: string;
  index: number;
  title: string;
  originalText: string;
  translatedText?: string;
  editedText?: string;
  status: "original" | "translating" | "translated" | "editing" | "completed";
  error?: string;
}

export interface GlossaryItem {
  id: string;
  english: string;
  persian: string;
}

export type BookTrimSize = "A5" | "B5" | "A4" | "A6"; // رقعی، وزیری، رحلی، جیبی

export interface PrintConfig {
  trimSize: BookTrimSize;
  fontFamily: "vazir" | "shabnam" | "sahel" | "samim" | "lalezar" | "amiri" | "serif";
  fontSize: number; // in points
  lineHeight: number; // e.g. 1.2, 1.4, 1.6, 1.8
  margins: "narrow" | "normal" | "wide"; // narrow = h-12 v-12, normal = h-20 v-16, wide = h-28 v-24
  includePageNumbers: boolean;
  includeRunningHeaders: boolean;
  runningHeaderTitle: string;
  runningHeaderAuthor: string;
  bindingSide: "right" | "left"; // Persian books are usually right-bound
}

export interface BookAnalysis {
  blurb?: string;
  DeweyDec?: string;
  keywords?: string[];
  suggestedPersianTitle?: string;
  toc?: string[];
}

export interface TranslationProject {
  id: string;
  title: string;
  author: string;
  context: string;
  originalLanguage: string;
  targetTone: "formal" | "fluent" | "colloquial" | "academic" | "literal";
  chunks: TextChunk[];
  glossary: GlossaryItem[];
  printConfig: PrintConfig;
  analysis?: BookAnalysis;
  coverImageUrl?: string;
  createdAt: number;
}
