/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TextChunk, BookTrimSize, PrintConfig } from "./types";

/**
 * Splits a long raw text into manageable chunks of approximately `targetLength` characters.
 * It favors splitting at paragraph breaks (\n\n), then line breaks (\n), then sentence ends (.!?),
 * so that we don't break thoughts mid-sentence.
 */
export function splitTextIntoChunks(text: string, targetLength: number = 6000): Omit<TextChunk, "id">[] {
  if (!text) return [];

  const chunks: Omit<TextChunk, "id">[] = [];
  let currentIndex = 0;
  let chunkIndex = 1;

  // Let's first clean up carriage returns
  const normalizedText = text.replace(/\r\n/g, "\n");

  while (currentIndex < normalizedText.length) {
    if (normalizedText.length - currentIndex < targetLength) {
      // Small remaining part goes into the last chunk
      const slice = normalizedText.substring(currentIndex);
      chunks.push({
        index: chunkIndex++,
        title: `بخش ${chunkIndex - 1}`,
        originalText: slice,
        status: "original",
      });
      break;
    }

    let endPos = currentIndex + targetLength;
    const lookAheadBoundary = Math.min(normalizedText.length, endPos + 1000);
    const textSegmentToAnalyze = normalizedText.substring(currentIndex, lookAheadBoundary);

    // Let's search for paragraph ends (\n\n) near our target length (from endPos - 1500 to endPos + 1000)
    let splitPosInSegment = -1;

    // Search for double newline \n\n
    const idealStart = targetLength - 1500;
    const doubleNewlineIdx = textSegmentToAnalyze.lastIndexOf("\n\n", targetLength);
    if (doubleNewlineIdx > idealStart) {
      splitPosInSegment = doubleNewlineIdx + 2; // Split after double newline
    } else {
      // Search for single newline
      const singleNewlineIdx = textSegmentToAnalyze.lastIndexOf("\n", targetLength);
      if (singleNewlineIdx > idealStart) {
        splitPosInSegment = singleNewlineIdx + 1;
      } else {
        // Search for sentence ending punctuation
        const puncs = [". ", "! ", "? ", ". \n", "؟ "];
        let bestPuncIdx = -1;
        for (const punc of puncs) {
          const idx = textSegmentToAnalyze.lastIndexOf(punc, targetLength);
          if (idx > idealStart && idx > bestPuncIdx) {
            bestPuncIdx = idx + punc.length;
          }
        }
        if (bestPuncIdx !== -1) {
          splitPosInSegment = bestPuncIdx;
        } else {
          // Worst case: split on last space
          const spaceIdx = textSegmentToAnalyze.lastIndexOf(" ", targetLength);
          if (spaceIdx > 0) {
            splitPosInSegment = spaceIdx + 1;
          }
        }
      }
    }

    const splitLength = splitPosInSegment !== -1 ? splitPosInSegment : targetLength;
    const finalChunkText = normalizedText.substring(currentIndex, currentIndex + splitLength).trim();

    if (finalChunkText) {
      chunks.push({
        index: chunkIndex++,
        title: `بخش ${chunkIndex - 1}`,
        originalText: finalChunkText,
        status: "original",
      });
    }

    currentIndex += splitLength;
  }

  return chunks;
}

/**
 * Heuristically splits a Persian text into physical-like book pages based on print config parameters.
 * Higher font sizes, narrower dimensions (trimSize), higher line heights, and wider margins
 * reduce the amount of words that fit on a single page.
 */
export function paginateText(text: string, config: PrintConfig): string[] {
  if (!text) return [];

  // 1. Determine base word capacity per page depending on trim size
  let baseCapacity = 250; // default (A5 رقعی)
  if (config.trimSize === "A6") { // جیبی
    baseCapacity = 110;
  } else if (config.trimSize === "B5") { // وزیری
    baseCapacity = 320;
  } else if (config.trimSize === "A4") { // رحلی
    baseCapacity = 550;
  }

  // 2. Adjust capacity based on Font Size ratio (base is 12pt)
  const sizeFactor = 12 / config.fontSize;
  baseCapacity = Math.round(baseCapacity * sizeFactor);

  // 3. Adjust based on Line Height (base is 1.4)
  const lineHeightFactor = 1.4 / config.lineHeight;
  baseCapacity = Math.round(baseCapacity * lineHeightFactor);

  // 4. Adjust based on Margins
  if (config.margins === "wide") {
    baseCapacity = Math.round(baseCapacity * 0.8);
  } else if (config.margins === "narrow") {
    baseCapacity = Math.round(baseCapacity * 1.15);
  }

  // Split words
  const words = text.replace(/[\n\r]+/g, " \n ").split(/\s+/).filter(w => w.trim() !== "" || w === "\n");

  const pages: string[] = [];
  let currentPageWords: string[] = [];
  let currentWordCountOfRealWords = 0;

  for (const word of words) {
    if (word === "\n") {
      currentPageWords.push("<br/>");
      // Newlines occupy visual space, we can count it as roughly 10 words worth of vertical space
      currentWordCountOfRealWords += 8;
    } else {
      currentPageWords.push(word);
      currentWordCountOfRealWords++;
    }

    if (currentWordCountOfRealWords >= baseCapacity) {
      // Pack current page
      pages.push(reconstructPageHtml(currentPageWords));
      currentPageWords = [];
      currentWordCountOfRealWords = 0;
    }
  }

  if (currentPageWords.length > 0) {
    pages.push(reconstructPageHtml(currentPageWords));
  }

  return pages;
}

function reconstructPageHtml(words: string[]): string {
  let html = "";
  let paragraphOpen = false;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (word === "<br/>") {
      if (paragraphOpen) {
        html += "</p>";
        paragraphOpen = false;
      }
      // If consecutive, add empty line break
      if (words[i - 1] === "<br/>") {
        html += "<div class='h-4'></div>";
      }
    } else {
      if (!paragraphOpen) {
        html += "<p class='text-justify indent-6 mb-2 leading-relaxed'>";
        paragraphOpen = true;
      }
      html += word + " ";
    }
  }

  if (paragraphOpen) {
    html += "</p>";
  }

  return html;
}

/**
 * Returns standard physical aspect ratios and labels
 */
export function getTrimSizeDetails(size: BookTrimSize): { label: string; dimensions: string; cssSize: string } {
  switch (size) {
    case "A5":
      return { label: "رقعی (A5)", dimensions: "۱۴.۸ × ۲۱.۰ سانتی‌متر", cssSize: "aspect-[148/210] w-full max-w-[450px]" };
    case "B5":
      return { label: "وزیری (B5)", dimensions: "۱۷.۶ × ۲۵.۰ سانتی‌متر", cssSize: "aspect-[176/250] w-full max-w-[500px]" };
    case "A4":
      return { label: "رحلی (A4)", dimensions: "۲۱.۰ × ۲۹.۷ سانتی‌متر", cssSize: "aspect-[210/297] w-full max-w-[600px]" };
    case "A6":
      return { label: "جیبی (A6)", dimensions: "۱۰.۵ × ۱۴.۸ سانتی‌متر", cssSize: "aspect-[105/148] w-full max-w-[350px]" };
  }
}
