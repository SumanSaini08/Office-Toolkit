import { Router, type IRouter } from "express";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type BlogFaq = { question: string; answer: string };

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  publishedAt: string;
  content: string;
  author?: string;
  tags?: string[];
  imageUrl?: string;
  pdfUrl?: string;
  coverEnabled?: boolean;
  faq?: BlogFaq[];
  seo?: { metaTitle?: string; metaDescription?: string };
  published?: boolean;
};

export type SignatureTemplate = {
  id: string;
  name: string;
  font: string;
  description: string;
};

export type CurrencyOption = {
  code: string;
  symbol: string;
  name: string;
};

export type OfficeToolkitContent = {
  blogPosts: BlogPost[];
  signatureTemplates: SignatureTemplate[];
  currencies: CurrencyOption[];
};

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

// Local disk store: source of truth so saves survive restarts even when Supabase is unreachable.
const localDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../data");
const localPath = path.join(localDir, objectPath);

// After a network failure, skip remote calls for a short window so admin actions stay fast.
let supabaseUnavailableUntil = 0;

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

function passwordsMatch(configured: string | undefined, input: unknown) {
  if (typeof input !== "string" || !configured) return false;
  const inputHash = createHash("sha256").update(input).digest();
  const configuredHash = createHash("sha256").update(configured).digest();
  return timingSafeEqual(inputHash, configuredHash);
}

async function readStoredPassword(): Promise<string | undefined> {
  try {
    const response = await storageRequest(
      `/storage/v1/object/${bucket}/admin-password.json`,
    );
    if (!response.ok) return undefined;
    const parsed = (await response.json()) as { password?: unknown };
    return typeof parsed.password === "string" && parsed.password ? parsed.password : undefined;
  } catch {
    return undefined;
  }
}

async function resolveAdminPassword(): Promise<string | undefined> {
  const stored = await readStoredPassword();
  return stored || process.env.ADMIN_PASSWORD;
}

async function storeAdminPassword(password: string) {
  const response = await storageRequest(
    `/storage/v1/object/${bucket}/admin-password.json`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-upsert": "true",
      },
      body: JSON.stringify({ password }),
    },
  );
  if (!response.ok) {
    throw new Error(`Admin password storage returned ${response.status}`);
  }
}

function randomTempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(18);
  return Array.from(bytes, (byte) => chars[byte % chars.length]).join("");
}

async function storageRequest(
  path: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string | Uint8Array },
) {
  if (Date.now() < supabaseUnavailableUntil) {
    throw new Error("Supabase is temporarily unavailable (retry in a moment)");
  }
  const base = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!base || !key) throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY are not configured");
  try {
    const response = await fetch(`${base}${path}`, {
      method: init?.method ?? "GET",
      headers: {
        Authorization: `Bearer ${key}`,
        apikey: key,
        ...init?.headers,
      },
      body: init?.body,
      signal: AbortSignal.timeout(init?.body ? 8000 : 5000),
    });
    return response;
  } catch (error) {
    supabaseUnavailableUntil = Date.now() + 30_000;
    throw error;
  }
}

function mergeSignatureTemplates(existing?: SignatureTemplate[]) {
  if (!existing || existing.length >= 20) return existing ?? generatedSignatureTemplates;
  const ids = new Set(existing.map((item) => item.id));
  return [...existing, ...generatedSignatureTemplates.filter((item) => !ids.has(item.id))];
}

function isValidPost(value: unknown): value is BlogPost {
  return Boolean(value && typeof value === "object" && typeof (value as BlogPost).id === "string" && typeof (value as BlogPost).title === "string");
}

function normalizeContent(parsed: Partial<OfficeToolkitContent>): OfficeToolkitContent {
  return {
    ...defaultContent,
    ...parsed,
    blogPosts: (Array.isArray(parsed.blogPosts) ? parsed.blogPosts : defaultContent.blogPosts).filter(isValidPost),
    signatureTemplates: mergeSignatureTemplates(parsed.signatureTemplates),
    currencies: parsed.currencies ?? defaultContent.currencies,
  };
}

async function writeLocalContent(content: OfficeToolkitContent) {
  await fs.mkdir(localDir, { recursive: true });
  const tmpPath = `${localPath}.${process.pid}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(content), "utf8");
  await fs.rename(tmpPath, localPath);
}

async function tryImportFromSupabase(): Promise<OfficeToolkitContent | undefined> {
  try {
    const response = await storageRequest(
      `/storage/v1/object/${bucket}/${objectPath}`,
    );
    if (!response.ok) {
      supabaseUnavailableUntil = Date.now() + 30_000;
      return undefined;
    }
    const parsed = (await response.json()) as Partial<OfficeToolkitContent>;
    const merged = normalizeContent(parsed);
    await writeLocalContent(merged);
    return merged;
  } catch {
    return undefined;
  }
}

async function readContent(): Promise<OfficeToolkitContent> {
  try {
    const raw = await fs.readFile(localPath, "utf8");
    return normalizeContent(JSON.parse(raw) as Partial<OfficeToolkitContent>);
  } catch {
    // Local store missing (first run or reset) - fall through to import, then defaults.
  }

  const online = await tryImportFromSupabase();
  if (online) return online;
  const seeded = normalizeContent({});
  await writeLocalContent(seeded).catch(() => undefined);
  return seeded;
}

async function syncBackupToSupabase(content: OfficeToolkitContent) {
  try {
    await storageRequest(
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
  } catch {
    // Backup is best-effort: local disk save already succeeded.
  }
}

async function writeContent(content: OfficeToolkitContent) {
  const safe = {
    ...content,
    blogPosts: (Array.isArray(content.blogPosts) ? content.blogPosts : []).filter(isValidPost),
  };
  await writeLocalContent(safe);
  void syncBackupToSupabase(safe);
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

router.post("/admin/login", async (req, res) => {
  const configured = await resolveAdminPassword();
  if (!configured) {
    res.status(503).json({ error: "Admin password is not configured." });
    return;
  }
  if (!passwordsMatch(configured, req.body?.password)) {
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

router.post("/admin/password", async (req, res) => {
  if (!isAdmin(req)) {
    res.status(401).json({ error: "Admin login required." });
    return;
  }
  const configured = await resolveAdminPassword();
  if (!configured) {
    res.status(503).json({ error: "Admin password is not configured." });
    return;
  }
  const { current, next } = req.body ?? {};
  if (!passwordsMatch(configured, current)) {
    res.status(401).json({ error: "The current password is not correct." });
    return;
  }
  if (typeof next !== "string" || next.length < 6) {
    res.status(400).json({ error: "New password must be at least 6 characters." });
    return;
  }
  if (passwordsMatch(configured, next)) {
    res.status(400).json({ error: "New password must be different from the current one." });
    return;
  }
  try {
    await storeAdminPassword(next);
    res.json({ ok: true });
  } catch (error) {
    res.status(502).json({
      error: "Could not save the new password.",
      detail: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.post("/admin/reset", async (_req, res) => {
  const temp = randomTempPassword();
  try {
    await storeAdminPassword(temp);
    res.json({ ok: true, tempPassword: temp });
  } catch (error) {
    res.status(502).json({
      error: "Could not reset the password.",
      detail: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.post("/admin/upload", async (req, res) => {
  if (!isAdmin(req)) {
    res.status(401).json({ error: "Admin login required." });
    return;
  }
  try {
    const bytes = req.body;
    if (!Buffer.isBuffer(bytes) || bytes.length === 0) {
      res.status(400).json({ error: "No file data received." });
      return;
    }
    const base = process.env.SUPABASE_URL?.replace(/\/+$/, "") ?? "";
    const rawName = req.headers["x-file-name"] ? decodeURIComponent(String(req.headers["x-file-name"])) : "upload";
    const safeName = (rawName || "upload").replace(/[^A-Za-z0-9._-]+/g, "-").slice(-80);
    const path = `uploads/${Date.now()}-${safeName}`;
    await storageRequest("/storage/v1/bucket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "uploads", name: "uploads", public: true }),
    }).catch(() => undefined);
    const response = await storageRequest(`/storage/v1/object/uploads/${path}`, {
      method: "PUT",
      headers: {
        "Content-Type": req.headers["content-type"] ?? "application/octet-stream",
        "x-upsert": "true",
      },
      body: bytes,
    });
    if (!response.ok) {
      throw new Error(`Supabase upload returned ${response.status}`);
    }
    res.json({ url: `${base}/storage/v1/object/public/uploads/${path}` });
  } catch (error) {
    res.status(502).json({
      error: "Upload failed.",
      detail: error instanceof Error ? error.message : "Unknown error",
    });
  }
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