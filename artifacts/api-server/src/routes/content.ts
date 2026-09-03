import { Router, type IRouter } from "express";
import { ReplitConnectors } from "@replit/connectors-sdk";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

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

const resumeAccentPalette = ["#c66d35", "#174f4a", "#8d5a9b", "#b36b21", "#1d4ed8", "#be185d", "#0f766e", "#6d28d9"];
const resumeTemplateNames = ["Signal", "Classic", "Studio", "Compact", "Ledger", "Editorial", "Grid", "Portfolio", "Focus", "Modern"];
const generatedResumeTemplates: ResumeTemplate[] = Array.from({ length: 60 }, (_, index) => {
  const family = resumeTemplateNames[index % resumeTemplateNames.length];
  const number = Math.floor(index / resumeTemplateNames.length) + 1;
  return {
    id: `resume-${index + 1}`,
    name: number === 1 ? family : `${family} ${number}`,
    description: number % 2 === 0 ? "Balanced hierarchy with a confident accent" : "Clear sections with an easy reading path",
    accent: resumeAccentPalette[index % resumeAccentPalette.length],
  };
});
const signatureFamilies = [
  ["Cursive", "cursive", "A fluid, handwritten feel"],
  ["Classic", "serif", "A confident formal line"],
  ["Modern", "display", "Clean and unmistakable"],
  ["Monogram", "mono", "Compact and distinctive"],
  ["Ledger", "serif", "Measured and professional"],
  ["Studio", "display", "Bold with a creative edge"],
];
const generatedSignatureTemplates: SignatureTemplate[] = Array.from({ length: 24 }, (_, index) => {
  const [family, font, description] = signatureFamilies[index % signatureFamilies.length];
  const number = Math.floor(index / signatureFamilies.length) + 1;
  return { id: `signature-${index + 1}`, name: number === 1 ? family : `${family} ${number}`, font, description };
});

export const defaultContent: OfficeToolkitContent = {
  blogPosts: [
    {
      id: "getting-paid-faster",
      slug: "getting-paid-faster",
      title: "A better invoice is a better handoff",
      excerpt:
        "Small details in your invoice can remove the uncertainty that slows down payment.",
      category: "Work habits",
      readTime: "5 min read",
      publishedAt: "2026-08-30",
      content:
        "A good invoice answers the next question before your client has to ask it.\n\nInclude a clear invoice number, a specific due date, plain-language line items, and the payment details your client needs. The goal is not to make a document look complicated. The goal is to make the next action obvious.\n\nStart with the context. Name the work, the date it was delivered, and who it is for. Then make the money easy to scan: quantity, rate, subtotal, tax, and total should have a clear rhythm.\n\nWhen the invoice feels considered, it quietly communicates that the work behind it is considered too. That does not replace a good relationship or agreed payment terms, but it does remove a surprising amount of friction from the last mile.",
    },
    {
      id: "resume-that-gets-read",
      slug: "resume-that-gets-read",
      title: "How to make a resume easier to read",
      excerpt:
        "Recruiters skim first. A thoughtful hierarchy helps the right details survive the first pass.",
      category: "Career",
      readTime: "6 min read",
      publishedAt: "2026-08-30",
      content:
        "A resume is not a full autobiography. It is a clear invitation to continue the conversation.\n\nUse familiar section labels, keep your strongest experience near the top, and make every bullet earn its space. A strong bullet usually starts with an action, names the work, and gives the reader a result or useful scale.\n\nKeep the formatting calm. One readable typeface, consistent dates, and generous line spacing will do more for comprehension than a crowded collection of decorative elements. Applicant tracking systems also tend to handle simple text structures more reliably.\n\nBefore you export, read the page as someone who has never met you. Can they understand what you do, what you changed, and what you want next in less than a minute? If yes, the format is doing its job.",
    },
    {
      id: "signing-with-confidence",
      slug: "signing-with-confidence",
      title: "The small details of a professional signature",
      excerpt:
        "A signature does not need to be elaborate. It needs to be legible, consistent, and easy to place.",
      category: "Documents",
      readTime: "4 min read",
      publishedAt: "2026-08-30",
      content:
        "The best digital signature is the one that works wherever you need it. Leave enough breathing room around the mark, choose a dark ink for light documents, and test it at the size it will actually appear.\n\nTyping your name can be a useful alternative when you need a repeatable sign-off. Choose a style that feels like you, keep the color consistent, and export with transparency so the image sits naturally on a contract, invoice, or letter.\n\nRemember that a signature image is not the same thing as a certified digital signature. For documents with specific legal or compliance requirements, follow the signing process required by your organization or jurisdiction.",
    },
  ],
  signatureTemplates: generatedSignatureTemplates,
  resumeTemplates: generatedResumeTemplates,
  currencies: [
    { code: "INR", symbol: "₹", name: "Indian Rupee" },
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  ],
};

const bucket = "office-toolkit";
const objectPath = "content.json";
const adminCookie = "office_toolkit_admin";

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not configured");
  return secret;
}

function signAdminToken(expiresAt: number) {
  const payload = Buffer.from(JSON.stringify({ expiresAt })).toString("base64url");
  const signature = createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function readCookie(request: { headers: { cookie?: string } }, name: string) {
  const value = request.headers.cookie?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return value ? decodeURIComponent(value.slice(name.length + 1)) : undefined;
}

function isAdmin(request: { headers: { cookie?: string } }) {
  const token = readCookie(request, adminCookie);
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  try {
    const expected = createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
    const validSignature = timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    if (!validSignature) return false;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { expiresAt?: number };
    return typeof data.expiresAt === "number" && data.expiresAt > Date.now();
  } catch {
    return false;
  }
}

function passwordsMatch(input: unknown) {
  const configured = process.env.ADMIN_PASSWORD;
  if (typeof input !== "string" || !configured) return false;
  const inputHash = createHash("sha256").update(input).digest();
  const configuredHash = createHash("sha256").update(configured).digest();
  return timingSafeEqual(inputHash, configuredHash);
}

async function storageRequest(
  path: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string },
) {
  const connectors = new ReplitConnectors();
  return connectors.proxy("supabase", path, init);
}

function mergeResumeTemplates(existing?: ResumeTemplate[]) {
  if (!existing || existing.length >= 50) return existing ?? generatedResumeTemplates;
  const ids = new Set(existing.map((item) => item.id));
  return [...existing, ...generatedResumeTemplates.filter((item) => !ids.has(item.id))];
}

function mergeSignatureTemplates(existing?: SignatureTemplate[]) {
  if (!existing || existing.length >= 20) return existing ?? generatedSignatureTemplates;
  const ids = new Set(existing.map((item) => item.id));
  return [...existing, ...generatedSignatureTemplates.filter((item) => !ids.has(item.id))];
}

async function readContent(): Promise<OfficeToolkitContent> {
  const response = await storageRequest(
    `/storage/v1/object/${bucket}/${objectPath}`,
  );
  if (response.ok) {
    const parsed = (await response.json()) as Partial<OfficeToolkitContent>;
    return {
      ...defaultContent,
      ...parsed,
      blogPosts: parsed.blogPosts ?? defaultContent.blogPosts,
      signatureTemplates: mergeSignatureTemplates(parsed.signatureTemplates),
      resumeTemplates: mergeResumeTemplates(parsed.resumeTemplates),
      currencies: parsed.currencies ?? defaultContent.currencies,
    };
  }

  await writeContent(defaultContent);
  return defaultContent;
}

async function writeContent(content: OfficeToolkitContent) {
  const response = await storageRequest(
    `/storage/v1/object/${bucket}/${objectPath}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-upsert": "true",
      },
      body: JSON.stringify(content),
    },
  );
  if (!response.ok) {
    throw new Error(`Supabase content storage returned ${response.status}`);
  }
}

const router: IRouter = Router();

router.get("/content", async (_req, res) => {
  try {
    res.json(await readContent());
  } catch (error) {
    res.status(502).json({
      error: "Could not read Office Toolkit content from Supabase.",
      detail: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.get("/admin/session", (req, res) => {
  res.json({ authenticated: isAdmin(req) });
});

router.post("/admin/login", (req, res) => {
  if (!process.env.ADMIN_PASSWORD) {
    res.status(503).json({ error: "Admin password is not configured." });
    return;
  }
  if (!passwordsMatch(req.body?.password)) {
    res.status(401).json({ error: "That password is not correct." });
    return;
  }
  res.cookie(adminCookie, signAdminToken(Date.now() + 8 * 60 * 60 * 1000), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 8 * 60 * 60 * 1000,
    path: "/",
  });
  res.json({ authenticated: true });
});

router.post("/admin/logout", (_req, res) => {
  res.clearCookie(adminCookie, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
  res.json({ authenticated: false });
});

router.put("/content", async (req, res) => {
  if (!isAdmin(req)) {
    res.status(401).json({ error: "Admin login required." });
    return;
  }
  try {
    const current = await readContent();
    const next = {
      ...current,
      ...req.body,
    } as OfficeToolkitContent;
    await writeContent(next);
    res.json(next);
  } catch (error) {
    res.status(502).json({
      error: "Could not save Office Toolkit content to Supabase.",
      detail: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;