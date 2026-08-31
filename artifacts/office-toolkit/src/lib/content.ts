export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  publishedAt: string;
  content: string;
};

export type SignatureTemplate = {
  id: string;
  name: string;
  font: string;
  description: string;
};

export type ResumeTemplate = {
  id: string;
  name: string;
  description: string;
  accent: string;
};

export type CurrencyOption = {
  code: string;
  symbol: string;
  name: string;
};

export type OfficeToolkitContent = {
  blogPosts: BlogPost[];
  signatureTemplates: SignatureTemplate[];
  resumeTemplates: ResumeTemplate[];
  currencies: CurrencyOption[];
};

import { useEffect, useState } from "react";

export const fallbackContent: OfficeToolkitContent = {
  blogPosts: [
    {
      id: "getting-paid-faster",
      slug: "getting-paid-faster",
      title: "A better invoice is a better handoff",
      excerpt: "Small details in your invoice can remove the uncertainty that slows down payment.",
      category: "Work habits",
      readTime: "5 min read",
      publishedAt: "2026-08-30",
      content: "A good invoice answers the next question before your client has to ask it.\n\nInclude a clear invoice number, a specific due date, plain-language line items, and the payment details your client needs. The goal is not to make a document look complicated. The goal is to make the next action obvious.\n\nWhen the invoice feels considered, it quietly communicates that the work behind it is considered too.",
    },
    {
      id: "resume-that-gets-read",
      slug: "resume-that-gets-read",
      title: "How to make a resume easier to read",
      excerpt: "Recruiters skim first. A thoughtful hierarchy helps the right details survive the first pass.",
      category: "Career",
      readTime: "6 min read",
      publishedAt: "2026-08-30",
      content: "A resume is not a full autobiography. It is a clear invitation to continue the conversation.\n\nUse familiar section labels, keep your strongest experience near the top, and make every bullet earn its space. A strong bullet usually starts with an action, names the work, and gives the reader a result or useful scale.\n\nKeep the formatting calm. One readable typeface, consistent dates, and generous line spacing will do more for comprehension than a crowded collection of decorative elements.",
    },
    {
      id: "signing-with-confidence",
      slug: "signing-with-confidence",
      title: "The small details of a professional signature",
      excerpt: "A signature does not need to be elaborate. It needs to be legible, consistent, and easy to place.",
      category: "Documents",
      readTime: "4 min read",
      publishedAt: "2026-08-30",
      content: "The best digital signature is the one that works wherever you need it. Leave enough breathing room around the mark, choose a dark ink for light documents, and test it at the size it will actually appear.\n\nTyping your name can be a useful alternative when you need a repeatable sign-off. Choose a style that feels like you, keep the color consistent, and export with transparency so the image sits naturally on a contract, invoice, or letter.",
    },
  ],
  signatureTemplates: [
    { id: "editorial", name: "Editorial", font: "cursive", description: "A fluid, handwritten feel" },
    { id: "classic", name: "Classic", font: "serif", description: "A confident formal line" },
    { id: "modern", name: "Modern", font: "display", description: "Clean and unmistakable" },
    { id: "monogram", name: "Monogram", font: "mono", description: "Compact and distinctive" },
  ],
  resumeTemplates: [
    { id: "signal", name: "Signal", description: "High contrast with a clear reading path", accent: "#c66d35" },
    { id: "classic", name: "Classic", description: "Quiet, traditional, and recruiter-friendly", accent: "#174f4a" },
    { id: "studio", name: "Studio", description: "A little more personality for creative roles", accent: "#8d5a9b" },
    { id: "compact", name: "Compact", description: "Dense and tidy for a one-page resume", accent: "#b36b21" },
  ],
  currencies: [
    { code: "INR", symbol: "₹", name: "Indian Rupee" },
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  ],
};

export function useOfficeToolkitContent() {
  const [content, setContent] = useState<OfficeToolkitContent>(fallbackContent);

  useEffect(() => {
    let active = true;
    fetch("/api/content")
      .then((response) => {
        if (!response.ok) throw new Error("Content API unavailable");
        return response.json() as Promise<OfficeToolkitContent>;
      })
      .then((remote) => {
        if (active) setContent({
          ...fallbackContent,
          ...remote,
          blogPosts: remote.blogPosts ?? fallbackContent.blogPosts,
          signatureTemplates: remote.signatureTemplates ?? fallbackContent.signatureTemplates,
          resumeTemplates: remote.resumeTemplates ?? fallbackContent.resumeTemplates,
          currencies: remote.currencies ?? fallbackContent.currencies,
        });
      })
      .catch(() => {
        // Client-side defaults keep the tools usable if the content service is offline.
      });
    return () => {
      active = false;
    };
  }, []);

  return content;
}

export async function fetchOfficeToolkitContent() {
  const response = await fetch("/api/content");
  if (!response.ok) throw new Error("Content API unavailable");
  return (await response.json()) as OfficeToolkitContent;
}

export async function saveOfficeToolkitContent(content: OfficeToolkitContent) {
  const response = await fetch("/api/content", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(content),
  });
  if (!response.ok) throw new Error("Content could not be saved");
  return (await response.json()) as OfficeToolkitContent;
}