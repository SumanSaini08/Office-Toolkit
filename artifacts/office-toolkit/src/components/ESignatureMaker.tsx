import { type PointerEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import {
  Calendar, Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Download, Move, PenLine, RotateCcw, ShieldCheck, Upload,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { useLocation } from 'wouter';
import { professionalSignatureFonts } from '@/lib/content';
import { applyPageMeta } from '@/lib/seo';
import { YouMightAlsoNeed, esignatureToolUseCases } from '@/components/RelatedTools';
import { JsonLd } from '@/components/JsonLd';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

type ExportFormat = 'png' | 'jpg' | 'pdf';

function PageMeta({ title, description, children, image, ogType }: { title: string; description: string; children: ReactNode; image?: string; ogType?: string }) {
  useEffect(() => { applyPageMeta({ title, description, image, ogType }); window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }); }, [title, description, image, ogType]);
  return <div className="page-in">{children}</div>;
}

function downloadBlob(blob: Blob, filename: string) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 500); }

function createImagePdf(canvases: HTMLCanvasElement[]) {
  const pageWidth = 612;
  const pageHeight = (canvas: HTMLCanvasElement) => Math.max(792, Math.round(pageWidth * canvas.height / canvas.width));
  const imageBytes = canvases.map((canvas) => {
    const jpeg = canvas.toDataURL('image/jpeg', 0.94).split(',')[1];
    return Uint8Array.from(atob(jpeg), (char) => char.charCodeAt(0));
  });
  const encoder = new TextEncoder();
  const objectBodies: Array<string | Uint8Array> = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${canvases.map((_, index) => `${3 + index * 3} 0 R`).join(' ')}] /Count ${canvases.length} >>`,
  ];
  canvases.forEach((canvasData, index) => {
    const content = `q\n${pageWidth} 0 0 ${pageHeight(canvasData)} 0 0 cm\n/Im${index} Do\nQ`;
    objectBodies.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight(canvasData)}] /Resources << /XObject << /Im${index} ${5 + index * 3} 0 R >> >> /Contents ${4 + index * 3} 0 R >>`,
      `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
      new Uint8Array([...encoder.encode(`<< /Type /XObject /Subtype /Image /Width ${canvasData.width} /Height ${canvasData.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes[index].length} >>\nstream\n`), ...imageBytes[index]]),
    );
  });
  const parts: Uint8Array[] = [encoder.encode('%PDF-1.4\n')];
  const offsets = [0];
  let length = parts[0].length;
  objectBodies.forEach((body, index) => {
    offsets.push(length);
    const opening = encoder.encode(`${index + 1} 0 obj\n`);
    parts.push(opening);
    length += opening.length;
    if (body instanceof Uint8Array) {
      parts.push(body);
      length += body.length;
      const closing = encoder.encode('\nendstream\nendobj\n');
      parts.push(closing);
      length += closing.length;
    } else {
      const bytes = encoder.encode(`${body}\nendobj\n`);
      parts.push(bytes);
      length += bytes.length;
    }
  });
  const xrefOffset = length;
  const xref = [`xref\n0 ${objectBodies.length + 1}`, '0000000000 65535 f '];
  offsets.slice(1).forEach((offset) => xref.push(`${String(offset).padStart(10, '0')} 00000 n `));
  xref.push(`trailer\n<< /Size ${objectBodies.length + 1} /Root 1 0 R >>`, `startxref\n${xrefOffset}`, '%%EOF');
  parts.push(encoder.encode(`${xref.join('\n')}\n`));
  return new Blob(parts as unknown as BlobPart[], { type: 'application/pdf' });
}

function saveCanvas(canvas: HTMLCanvasElement, name: string, format: ExportFormat) {
  if (format === 'pdf') { downloadBlob(createImagePdf([canvas]), `${name}.pdf`); return; }
  const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
  canvas.toBlob((blob) => blob && downloadBlob(blob, `${name}.${format}`), mime, 0.94);
}

function SignatureCanvas({ color, canvasRef: externalRef, sizeX = 100, sizeY = 100 }: { color: string; canvasRef?: React.RefObject<HTMLCanvasElement | null>; sizeX?: number; sizeY?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ref = externalRef ?? canvasRef;
  const drawing = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const clear = () => { const canvas = ref.current; if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height); };
  const point = (e: PointerEvent<HTMLCanvasElement>) => { const canvas = ref.current!; const rect = canvas.getBoundingClientRect(); return { x: (e.clientX - rect.left) * canvas.width / rect.width, y: (e.clientY - rect.top) * canvas.height / rect.height }; };
  const down = (e: PointerEvent<HTMLCanvasElement>) => { drawing.current = true; last.current = point(e); ref.current?.setPointerCapture(e.pointerId); };
  const move = (e: PointerEvent<HTMLCanvasElement>) => { if (!drawing.current) return; const canvas = ref.current!; const ctx = canvas.getContext('2d')!; const p = point(e); ctx.strokeStyle = color; ctx.lineWidth = 3.1; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y); ctx.lineTo(p.x, p.y); ctx.stroke(); last.current = p; };
  const up = () => { drawing.current = false; };
  return <div><div className="grid-paper relative overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]"><canvas ref={ref} width={900} height={340} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} className="signature-canvas block h-[220px] w-full" style={{ transform: `scale(${sizeX / 100}, ${sizeY / 100})`, transformOrigin: 'center' }} data-testid="canvas-signature" /></div><div className="mt-3"><Button variant="quiet" onClick={clear} testId="button-clear-signature"><RotateCcw size={15} /> Clear</Button></div></div>;
}

function Button({ children, onClick, variant = 'primary', testId, className = '' }: { children: ReactNode; onClick?: () => void; variant?: 'primary' | 'quiet' | 'outline' | 'accent'; testId?: string; className?: string }) {
  const styles = {
    primary: 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:brightness-110',
    quiet: 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]',
    outline: 'border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] hover:border-[hsl(var(--primary)/.5)] hover:bg-[hsl(var(--secondary)/.45)]',
    accent: 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:brightness-105',
  };
  return <button type="button" onClick={onClick} data-testid={testId} className={`btn-press inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold shadow-[0_2px_0_hsl(var(--shadow-color)/.12)] disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}>{children}</button>;
}

function Field({ label, value, onChange, placeholder, type = 'text', testId, className = '' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; testId: string; className?: string }) {
  return <label className={`block ${className}`}><span className="mb-1.5 block text-xs font-bold text-[hsl(var(--muted-foreground))]">{label}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} data-testid={testId} className="h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm outline-none transition-shadow placeholder:text-[hsl(var(--muted-foreground)/.65)] focus:ring-2 focus:ring-[hsl(var(--ring)/.25)]" /></label>;
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return <div className="max-w-2xl"><p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.18em] text-[hsl(var(--primary))]">{eyebrow}</p><h2 className="mt-3 font-display text-3xl font-bold leading-[1.05] tracking-[-.045em] md:text-4xl">{title}</h2>{description && <p className="mt-4 text-base leading-7 text-[hsl(var(--muted-foreground))]">{description}</p>}</div>;
}

function InfoSection({ title, intro, bullets, faq }: { title: string; intro: string; bullets: string[]; faq: [string, string][] }) {
  const [active, setActive] = useState<number | null>(null);
  return <section className="mx-auto mt-16 max-w-6xl border-t border-[hsl(var(--border))] px-5 py-16 lg:px-8"><div className="grid gap-12 lg:grid-cols-[.72fr_1.28fr]"><div><SectionHeading eyebrow="A little context" title={title} description={intro} /><ul className="mt-7 space-y-4">{bullets.map((b) => <li key={b} className="flex gap-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]"><Check size={16} className="mt-1 shrink-0 text-[hsl(var(--primary))]" />{b}</li>)}</ul></div><div><div className="mb-4 flex items-center gap-2 text-[hsl(var(--primary))]"><CircleHelp size={17} /><span className="font-mono-ui text-[10px] font-bold uppercase tracking-[.16em]">Questions, answered</span></div><div className="divide-y divide-[hsl(var(--border))] border-y border-[hsl(var(--border))]">{faq.map(([q, a], i) => <div key={q}><button type="button" onClick={() => setActive(active === i ? null : i)} className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-bold"><span>{q}</span><ChevronDown size={16} className={`shrink-0 text-[hsl(var(--primary))] transition-transform ${active === i ? 'rotate-180' : ''}`} /></button>{active === i && <p className="pb-4 pr-8 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{a}</p>}</div>)}</div></div></div></section>;
}

function ToolIntro({ id, children }: { id: string; children?: ReactNode }) {
  const meta: Record<string, { eyebrow: string; title: string; description: string }> = {
    signature: { eyebrow: 'Sign it, send it, done', title: 'Make a free e-signature online', description: 'Sign PDFs in three steps with a free e-signature online tool: upload your document, create a signature, drag it into place, and download. Create one-off signature images too.' },
  };
  const tool = meta[id] ?? meta.signature;
  return <div className="mx-auto max-w-6xl px-5 pb-8 pt-12 lg:px-8 lg:pt-16"><nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5"><a href="/" className="inline-flex min-h-11 items-center font-mono-ui text-[10px] font-bold uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--primary))]">Home</a><ChevronRight size={13} className="text-[hsl(var(--muted-foreground))] opacity-60" /><span aria-current="page" className="inline-flex min-h-11 items-center font-mono-ui text-[10px] font-bold uppercase tracking-[.16em] text-[hsl(var(--primary))]">{tool.title}</span></nav><div className="flex items-center gap-3 text-[hsl(var(--primary))]"><span className="grid size-10 place-items-center rounded-xl bg-[hsl(var(--secondary))]"><PenLine size={19} /></span><span className="font-mono-ui text-[10px] font-bold uppercase tracking-[.16em]">{tool.eyebrow}</span></div><div className="mt-5 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><h1 className="font-display text-4xl font-bold tracking-[-.055em] md:text-6xl">{tool.title}</h1><p className="mt-4 max-w-3xl text-base leading-7 text-[hsl(var(--muted-foreground))]">{tool.description}</p><p className="mt-3 max-w-3xl text-base leading-7 text-[hsl(var(--muted-foreground))]">Everything runs locally in your browser tab. There is no account to create, no file to upload, and no server round-trip, so your work stays on your device until you choose to export a finished file.</p><p className="mt-3 max-w-3xl text-base leading-7 text-[hsl(var(--muted-foreground))]">You will not find a paywall, a watermark, or a nagging upgrade prompt on the finish line. The maker is there to do one thing well, and when it is done the file is yours — no account required, no marketing email required, no calendar invitation required.</p><p className="mt-3 max-w-3xl text-base leading-7 text-[hsl(var(--muted-foreground))]">Everything you type, draw, or upload for this task is processed right here in this tab. That makes the tool fast, offline-friendly, and private. Refreshing the page starts you fresh, so export the file you want to keep before you close the window.</p></div>{children}</div></div>;
}

function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

const INK_STYLES: Record<string, string> = {
  '#174f4a': 'Deep teal', '#1d4ed8': 'Blue', '#6d28d9': 'Purple', '#be185d': 'Berry', '#b45309': 'Amber', '#111827': 'Black', '#b91c1c': 'Red', '#047857': 'Emerald',
  '#0f766e': 'Teal', '#8d5a9b': 'Mauve', '#c66d35': 'Ember', '#0891b2': 'Cyan', '#ca8a04': 'Gold', '#db2777': 'Pink', '#4f46e5': 'Indigo', '#dc2626': 'Crimson',
  '#16a34a': 'Green', '#ea580c': 'Orange', '#e11d48': 'Rose', '#9333ea': 'Violet', '#2563eb': 'Royal blue', '#f59e0b': 'Yellow', '#0d9488': 'Turquoise', '#7c3aed': 'Deep purple',
  '#2d9cdb': 'Sky blue', '#eb5757': 'Light red', '#27ae60': 'Leaf green', '#f2c94c': 'Lemon', '#9b51e0': 'Orchid', '#eb2f96': 'Magenta', '#13c2c2': 'Aqua', '#f5222d': 'Scarlet',
  '#fa8c16': 'Sunset', '#722ed1': 'Grape', '#a0d911': 'Lime', '#f759ab': 'Flamingo', '#2f54eb': 'Navy blue', '#faad14': 'Honey', '#ad6800': 'Bronze', '#006d75': 'Sea green',
  '#531dab': 'Plum', '#d4380d': 'Burnt orange', '#c41d7f': 'Raspberry', '#096dd9': 'Azure', '#389e0d': 'Forest', '#d46b08': 'Caramel', '#a8071a': 'Wine', '#1f8a70': 'Jade',
  '#5c6bc0': 'Periwinkle', '#f4511e': 'Mandarin', '#00897b': 'Pine', '#7cb342': 'Pear', '#fb8c00': 'Pumpkin', '#3949ab': 'Cobalt', '#d81b60': 'Cerise', '#00838f': 'Teal blue',
  '#43a047': 'Apple', '#e53935': 'Coral', '#6d4c41': 'Brown', '#4527a0': 'Deep violet', '#0277bd': 'Ocean', '#ef6c00': 'Tangerine', '#c0ca33': 'Olive', '#00acc1': 'Cobalt blue',
  '#c2185b': 'Plum rose', '#00796b': 'Emerald teal', '#f06292': 'Peony', '#5e35b1': 'Royal purple', '#8e24aa': 'Fuchsia', '#ad1457': 'Mulberry', '#1e88e5': 'Bright blue',
  '#00bcd4': 'Cyan blue', '#7e57c2': 'Deep orchid', '#ff7043': 'Salmon', '#26a69a': 'Peacock', '#ab47bc': 'Amethyst', '#ef5350': 'Tomato', '#42a5f5': 'Periwinkle blue',
};

function InkPicker({ colors, color, onChange, testIdPrefix }: { colors: string[]; color: string; onChange: (c: string) => void; testIdPrefix: string }) {
  const [open, setOpen] = useState(false);
  return <div className="relative mt-1.5">
    <button type="button" onClick={() => setOpen((value) => !value)} className="flex h-9 w-full items-center justify-between gap-2 rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-xs font-bold text-[hsl(var(--foreground))] transition-shadow focus:ring-2 focus:ring-[hsl(var(--ring)/.25)]" data-testid={`${testIdPrefix}-open`}>
      <span className="flex items-center gap-2"><span className="size-4 shrink-0 rounded-full border border-[hsl(var(--input))]" style={{ backgroundColor: color }} /><span>Colour</span></span>
      <ChevronDown size={14} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && <div className="absolute left-0 z-50 mt-1.5 w-[320px] rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 shadow-2xl">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[.12em] text-[hsl(var(--muted-foreground))]">Colour chart</p>
      <div className="grid max-h-64 grid-cols-2 gap-1 overflow-y-auto pr-1">{colors.map((item) => <button key={item} type="button" onClick={() => { onChange(item); setOpen(false); }} className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-[11px] font-bold ${color === item ? 'border-[hsl(var(--primary))] bg-[hsl(var(--secondary))]' : 'border-transparent hover:bg-[hsl(var(--muted))]'}`} data-testid={`${testIdPrefix}-${item.slice(1)}`}><span className="size-5 shrink-0 rounded-full border border-[hsl(var(--input))]" style={{ backgroundColor: item }} /><span className="truncate">{INK_STYLES[item] ?? item}</span></button>)}</div>
      <div className="mt-2.5 flex items-center gap-2 border-t border-[hsl(var(--border))] pt-2.5">
        <span className="text-[10px] font-bold uppercase tracking-[.08em] text-[hsl(var(--muted-foreground))]">Custom</span>
        <input type="color" value={color} onChange={(e) => onChange(e.target.value)} aria-label="Pick a custom ink colour" title="Pick any colour" className="size-7 cursor-pointer rounded border border-[hsl(var(--input))] bg-transparent p-0" data-testid={`${testIdPrefix}-custom`} />
      </div>
    </div>}
  </div>;
}

function SizeControl({ value, onChange, testId, label = 'Signature size' }: { value: number; onChange: (v: number) => void; testId: string; label?: string }) {
  return <label className="block">
    <span className="mb-1.5 flex items-center justify-between text-xs font-bold text-[hsl(var(--muted-foreground))]"><span>{label}</span><span className="rounded-md bg-[hsl(var(--muted))] px-1.5 py-0.5 font-mono-ui text-[11px] text-[hsl(var(--foreground))]" data-testid={`${testId}-value`}>{value}</span></span>
    <div className="flex items-center gap-2">
      <input type="range" min={1} max={500} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full" data-testid={testId} />
      <input type="number" min={1} max={500} value={value} onChange={(e) => onChange(Math.max(1, Math.min(500, Number(e.target.value) || 1)))} className="h-9 w-16 shrink-0 rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-1 text-center text-xs font-bold outline-none focus:ring-2 focus:ring-[hsl(var(--ring)/.25)]" data-testid={`${testId}-number`} />
    </div>
  </label>;
}

function cropCanvasInk(source: HTMLCanvasElement) {
  const ctx = source.getContext('2d');
  if (!ctx) return source;
  const w = source.width;
  const h = source.height;
  const data = ctx.getImageData(0, 0, w, h).data;
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (data[(y * w + x) * 4 + 3] > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX || maxY < minY) return source;
  const pad = 14;
  const sx = Math.max(0, minX - pad);
  const sy = Math.max(0, minY - pad);
  const sw = Math.min(w - sx, maxX - minX + 1 + pad * 2);
  const sh = Math.min(h - sy, maxY - minY + 1 + pad * 2);
  const out = document.createElement('canvas');
  out.width = Math.max(1, sw);
  out.height = Math.max(1, sh);
  out.getContext('2d')!.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);
  return out;
}

function recolorCanvasInk(canvas: HTMLCanvasElement, target: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.save();
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = target;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

function recolorDataUrl(dataUrl: string, target: string) {
  return loadImage(dataUrl).then((img) => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = target;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  });
}

export function ESignatureMaker() {
  const [, setLocation] = useLocation();
  const [color, setColor] = useState('#174f4a');
  const [name, setName] = useState('Alex Morgan');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf');
  const [proFont, setProFont] = useState<string>(professionalSignatureFonts[0][1]);
  const [sigTab, setSigTab] = useState<'draw' | 'type' | 'upload'>('draw');
  const composerDrawRef = useRef<HTMLCanvasElement>(null);
  const [composerUpload, setComposerUpload] = useState('');
  const [composerUploadError, setComposerUploadError] = useState('');
  const fontStack = proFont;
  const colors = ['#174f4a', '#1d4ed8', '#6d28d9', '#be185d', '#b45309', '#111827', '#b91c1c', '#047857', '#0f766e', '#8d5a9b', '#c66d35', '#0891b2', '#ca8a04', '#db2777', '#4f46e5', '#dc2626', '#16a34a', '#ea580c', '#e11d48', '#9333ea', '#2563eb', '#f59e0b', '#0d9488', '#7c3aed', '#ea7d23', '#2d9cdb', '#eb5757', '#27ae60', '#f2c94c', '#9b51e0', '#eb2f96', '#13c2c2', '#f5222d', '#fa8c16', '#722ed1', '#a0d911', '#f759ab', '#2f54eb', '#faad14', '#ad6800', '#006d75', '#531dab', '#d4380d', '#c41d7f', '#096dd9', '#389e0d', '#d46b08', '#a8071a', '#1f8a70', '#5c6bc0', '#f4511e', '#00897b', '#7cb342', '#fb8c00', '#3949ab', '#d81b60', '#00838f', '#43a047', '#e53935', '#6d4c41', '#4527a0', '#0277bd', '#ef6c00', '#c0ca33', '#00acc1', '#c2185b', '#00796b', '#f06292', '#5e35b1', '#8e24aa', '#ad1457', '#1e88e5', '#00897b', '#d81b60', '#00bcd4', '#7e57c2', '#ff7043', '#26a69a', '#ab47bc', '#ef5350', '#42a5f5'];

  // --- Document signing state ---
  const [docData, setDocData] = useState('');
  const [docName, setDocName] = useState('signed-document');
  const [docError, setDocError] = useState('');
  const [docLink, setDocLink] = useState('');
  const [docLinkError, setDocLinkError] = useState('');
  const [sign, setSign] = useState<{ pageIndex: number; xPct: number; yPct: number; widthPct: number } | null>(null);
  const [signPos, setSignPos] = useState({ x: 25, y: 75 });
  const [signScaleX, setSignScaleX] = useState(0.23);
  const [signScaleY, setSignScaleY] = useState(0.23);
  const [signatureData, setSignatureData] = useState('');
  const [docIsPdf, setDocIsPdf] = useState(false);
  const [docPages, setDocPages] = useState<string[]>([]);
  const [docPageIndex, setDocPageIndex] = useState(0);
  const [docPageCount, setDocPageCount] = useState(1);
  const [docLoading, setDocLoading] = useState(false);
  const [sigSelected, setSigSelected] = useState(false);
  const pdfPagesRef = useRef<HTMLCanvasElement[]>([]);
  const docWrapRef = useRef<HTMLDivElement>(null);
  const positioning = useRef(false);
  const cornerResizing = useRef(false);
  const cornerStart = useRef({ x: 0, y: 0, scaleX: 0, scaleY: 0 });
  const signDragging = useRef(false);
  const signDragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const signMoved = useRef(false);

  useEffect(() => {
    try {
      const dataUrl = sessionStorage.getItem('esign_home_file');
      const fname = sessionStorage.getItem('esign_home_filename') || '';
      const ftype = sessionStorage.getItem('esign_home_filetype') || '';
      if (dataUrl) {
        sessionStorage.removeItem('esign_home_file');
        sessionStorage.removeItem('esign_home_filename');
        sessionStorage.removeItem('esign_home_filetype');
        setDocError('');
        setDocName(fname.replace(/\.[^.]+$/, '') || 'signed-document');
        setDocIsPdf(false);
        setDocPages([]);
        setDocPageIndex(0);
        setDocPageCount(1);
        pdfPagesRef.current = [];
        const isPdf = ftype === 'application/pdf' || /\.pdf$/i.test(fname);
        if (isPdf) {
          fetch(dataUrl)
            .then((r) => r.blob())
            .then((blob) => {
              const file = new File([blob], fname || 'document.pdf', { type: ftype || 'application/pdf' });
              loadPdf(file);
            })
            .catch(() => setDocError('Could not load the document.'));
        } else {
          setDocData(dataUrl);
        }
      }
    } catch {}
  }, []);

  const startCornerResize = (e: PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    cornerResizing.current = true;
    cornerStart.current = { x: e.clientX, y: e.clientY, scaleX: signScaleX, scaleY: signScaleY };
    (e.currentTarget).setPointerCapture(e.pointerId);
  };

  const cornerResizeMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!cornerResizing.current) return;
    const dx = e.clientX - cornerStart.current.x;
    const dy = e.clientY - cornerStart.current.y;
    setSignScaleX(Math.max(0.2, Math.min(3.5, cornerStart.current.scaleX + dx / 60)));
    setSignScaleY(Math.max(0.2, Math.min(3.5, cornerStart.current.scaleY + dy / 60)));
  };

  const startSignDrag = (e: React.PointerEvent) => {
    if (!signatureData || !docWrapRef.current) return;
    e.stopPropagation();
    signDragging.current = true;
    signMoved.current = false;
    const sx = sign?.xPct ?? signPos.x;
    const sy = sign?.yPct ?? signPos.y;
    signDragStart.current = { x: e.clientX, y: e.clientY, posX: sx, posY: sy };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onSignDragMove = (e: React.PointerEvent) => {
    if (!signDragging.current || !docWrapRef.current) return;
    const rect = docWrapRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const dx = e.clientX - signDragStart.current.x;
    const dy = e.clientY - signDragStart.current.y;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) signMoved.current = true;
    const sw = (sign?.widthPct ?? (signScaleX * 20));
    const nx = signDragStart.current.posX + (dx / rect.width) * 100;
    const ny = signDragStart.current.posY + (dy / rect.height) * 100;
    const clampedX = Math.max(sw / 2, Math.min(100 - sw / 2, nx));
    const clampedY = Math.max(sw / 4, Math.min(100 - sw / 4, ny));
    const newPos = { x: clampedX, y: clampedY };
    setSignPos(newPos);
    setSign({ pageIndex: docPageIndex, xPct: clampedX, yPct: clampedY, widthPct: sw });
  };

  const stopSignDrag = () => {
    signDragging.current = false;
  };

  const placeSignOnClick = (e: React.PointerEvent) => {
    if (!signatureData || !docWrapRef.current) return;
    if (signMoved.current) { signMoved.current = false; return; }
    const rect = docWrapRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const sw = sign?.widthPct ?? 20;
    const clampedX = Math.max(sw / 2, Math.min(100 - sw / 2, x));
    const clampedY = Math.max(sw / 4, Math.min(100 - sw / 4, y));
    setSignPos({ x: clampedX, y: clampedY });
    setSign({ pageIndex: docPageIndex, xPct: clampedX, yPct: clampedY, widthPct: sw });
    setSigSelected(true);
  };

  const applyComposerDraw = () => {
    const source = composerDrawRef.current;
    if (source) setSignatureData(cropCanvasInk(source).toDataURL('image/png'));
  };

  const applyComposerType = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 420;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = color;
    ctx.font = `bold 150px ${fontStack}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name || 'Your name', 600, 215);
    setSignatureData(cropCanvasInk(canvas).toDataURL('image/png'));
  };

  const applyComposerUpload = () => {
    if (composerUpload) setSignatureData(composerUpload);
  };

  useEffect(() => {
    if (!signatureData) { setSign(null); setSigSelected(false); return; }
    if (!sign) {
      const defaultSign = { pageIndex: docPageIndex, xPct: 75, yPct: 75, widthPct: 22 };
      setSign(defaultSign);
      setSignPos({ x: defaultSign.xPct, y: defaultSign.yPct });
      setSignScaleX(defaultSign.widthPct / 20);
      setSignScaleY(defaultSign.widthPct / 20);
      setSigSelected(true);
    }
  }, [signatureData]);

  const pickComposerUpload = (file?: File) => {
    if (!file) return;
    setComposerUploadError('');
    const reader = new FileReader();
    reader.onload = () => setComposerUpload(String(reader.result));
    reader.onerror = () => setComposerUploadError('That image could not be read. Try a PNG, JPG, or WebP file.');
    reader.readAsDataURL(file);
  };

  const pickDocFile = (file?: File) => {
    if (!file) return;
    setDocError('');
    setDocName(file.name.replace(/\.[^.]+$/, '') || 'signed-document');
    setDocIsPdf(false);
    setDocPages([]);
    setDocPageIndex(0);
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    if (isPdf) { loadPdf(file); } else { readFile(file, setDocData); }
  };

  const readFile = (file: File, cb: (dataUrl: string) => void) => {
    const reader = new FileReader();
    reader.onload = () => cb(String(reader.result));
    reader.readAsDataURL(file);
  };

  const clearDoc = () => {
    setDocData('');
    setDocName('signed-document');
    setDocIsPdf(false);
    setDocPages([]);
    setDocPageIndex(0);
    setDocPageCount(1);
    pdfPagesRef.current = [];
    setSignatureData('');
    setDocLink('');
    setDocLinkError('');
  };

  const loadDocFromLink = async () => {
    const url = docLink.trim();
    if (!url) return;
    try {
      setDocLinkError('');
      setDocLoading(true);
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) throw new Error('Could not fetch that link.');
      const blob = await response.blob();
      const name = decodeURIComponent(url.split('/').pop()?.split('?')[0] ?? 'linked-document') || 'linked-document';
      const lower = name.toLowerCase();
      const isPdf = /\.pdf$/i.test(lower) || blob.type === 'application/pdf';
      const isImage = /\.(png|jpe?g|webp)$/i.test(lower) || blob.type.startsWith('image/');
      if (!isPdf && !isImage) throw new Error('Link must point to a PDF, PNG, JPG, or WebP file.');
      const file = new File([blob], name, { type: blob.type });
      setDocName(name.replace(/\.[^.]+$/, '') || 'signed-document');
      setDocIsPdf(false);
      setDocPages([]);
      setDocPageIndex(0);
      if (isPdf) { await loadPdf(file); } else { readFile(file, setDocData); }
      setDocLink('');
      setDocLoading(false);
    } catch {
      setDocLoading(false);
      setDocLinkError('Could not load that link. Make sure it points directly to a PDF, PNG, JPG, or WebP file and allows browser access (CORS).');
    }
  };

  const signDocPosition = (e: PointerEvent<HTMLDivElement>) => {
    if (!positioning.current || !docWrapRef.current) return;
    const rect = docWrapRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setSignPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  const loadPdf = async (file: File) => {
    try {
      setDocError('');
      setDocLoading(true);
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      const scale = 2;
      const canvases: HTMLCanvasElement[] = [];
      const dataUrls: string[] = [];
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.getContext('2d');
        await page.render({ canvas, viewport }).promise;
        canvases.push(canvas);
        dataUrls.push(canvas.toDataURL('image/jpeg', 0.92));
      }
      pdfPagesRef.current = canvases;
      setDocPages(dataUrls);
      setDocIsPdf(true);
      setDocPageCount(pdf.numPages);
      setDocPageIndex(0);
      setDocData(dataUrls[0] ?? '');
      setSignPos({ x: 45, y: 88 });
      setSignScaleX(1);
      setSignScaleY(1);
      setDocLoading(false);
    } catch {
      setDocLoading(false);
      setDocError('This PDF could not be opened. It may be password-protected or damaged. Please try another PDF, or save the page as a PNG, JPG, or WebP image and upload that instead.');
    }
  };

  const goToPage = (delta: number) => {
    const next = Math.max(0, Math.min(docPages.length - 1, docPageIndex + delta));
    setDocPageIndex(next);
    setDocData(docPages[next] ?? '');
  };

  const downloadSignedDoc = async () => {
    if (!docData || !signatureData) return;
    const sigImage = await loadImage(signatureData);

    const stampOnPage = (ctx: CanvasRenderingContext2D, pageWidth: number, pageHeight: number) => {
      const wrap = docWrapRef.current;
      const wrapWidth = wrap?.getBoundingClientRect().width || pageWidth;
      const s = sign;
      const widthPct = s?.widthPct ?? 20;
      const previewWidthPct = widthPct;
      const sigW = (pageWidth * previewWidthPct) / 100;
      const sigH = sigImage.height * (sigW / sigImage.width || 1);
      const posX = ((s?.xPct ?? signPos.x) * pageWidth) / 100;
      const posY = ((s?.yPct ?? signPos.y) * pageHeight) / 100;
      const padX = Math.max(0, Math.min(posX - sigW / 2, pageWidth - sigW));
      const padY = Math.max(0, Math.min(posY - sigH / 2, pageHeight - sigH));
      ctx.drawImage(sigImage, padX, padY, sigW, sigH);
    };

    if (docIsPdf && pdfPagesRef.current.length > 0) {
      const stamped = pdfPagesRef.current.map((pageCanvas, index) => {
        const output = document.createElement('canvas');
        output.width = pageCanvas.width;
        output.height = pageCanvas.height;
        const ctx = output.getContext('2d')!;
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, output.width, output.height);
        ctx.drawImage(pageCanvas, 0, 0, output.width, output.height);
        if (index === docPageIndex) {
          stampOnPage(ctx, output.width, output.height);
        }
        return output;
      });
      if (exportFormat === 'pdf') {
        downloadBlob(createImagePdf(stamped), `${docName || 'signed-document'}.pdf`);
        return;
      }
      saveCanvas(stamped[docPageIndex], docName || 'signed-document', exportFormat);
      return;
    }

    const img = await loadImage(docData);
    const output = document.createElement('canvas');
    output.width = 1500;
    output.height = Math.round(1500 * img.height / img.width);
    const ctx = output.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, output.width, output.height);
    ctx.drawImage(img, 0, 0, output.width, output.height);
    stampOnPage(ctx, output.width, output.height);
    saveCanvas(output, docName || 'signed-document', exportFormat);
  };

  const sigTabs: { id: 'draw' | 'type' | 'upload'; label: string }[] = [
    { id: 'draw', label: 'Draw' },
    { id: 'type', label: 'Type' },
    { id: 'upload', label: 'Upload' },
  ];

  return <PageMeta title="Free Online Signature Maker - Draw or Type E-Sign" description="Draw or type your signature online and download it as a transparent PNG. 100% free, no signup, private and instant." image="/og/e-signature.png"><main><JsonLd id="tool-software-main" data={{
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "E-signature Maker",
    description: "A free e-signature online tool — upload a document, draw or type your signature, drag it anywhere on the page, and download. Private — nothing leaves your browser.",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web browser",
    url: `${typeof window !== "undefined" ? window.location.origin : ""}/e-signature-maker`,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  }} />
    <div className="mx-auto grid max-w-6xl gap-6 px-5 lg:grid-cols-[1.2fr_.8fr] lg:px-8">
      <section className="rounded-[1.35rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-sm md:p-6 col-span-full">
        <>
          {!docData ? (
            <div className="flex flex-col items-center justify-center rounded-[1.35rem] border-2 border-dashed border-[hsl(var(--primary)/.35)] bg-[hsl(var(--background))] px-6 py-14 text-center">
              <div className="flex items-center gap-2 text-xs font-bold text-[hsl(var(--primary))]"><ShieldCheck size={14} /> Works entirely in your browser</div>
              <h2 className="mt-4 font-display text-3xl font-bold tracking-[-.04em] md:text-4xl">Sign a PDF online</h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-[hsl(var(--muted-foreground))]">Upload your document, create your signature, drag it anywhere on the page, and download. Free and private.</p>
              <div className="mt-7 w-full max-w-md rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
                <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[hsl(var(--primary)/.4)] bg-[hsl(var(--secondary)/.25)] px-6 py-10 text-center transition-colors hover:bg-[hsl(var(--secondary)/.4)]">
                  <Upload size={30} className="text-[hsl(var(--primary))]" />
                  <span className="text-sm font-bold">Drop a file here or <span className="text-[hsl(var(--primary))] underline decoration-2 underline-offset-4">choose a document</span></span>
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">PDF, PNG, JPG, or WebP</span>
                  <input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" className="sr-only" onChange={(e) => pickDocFile(e.target.files?.[0])} data-testid="input-signature-document" />
                </label>
                <div className="mt-4 flex items-center gap-2">
                  <span className="h-px flex-1 bg-[hsl(var(--border))]" />
                  <span className="text-[10px] font-bold uppercase tracking-[.14em] text-[hsl(var(--muted-foreground))]">or paste a link</span>
                  <span className="h-px flex-1 bg-[hsl(var(--border))]" />
                </div>
                <div className="mt-4 flex w-full items-center gap-2">
                  <input value={docLink} onChange={(e) => setDocLink(e.target.value)} placeholder="https://…" data-testid="input-signature-doc-link" className="h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm outline-none transition-shadow placeholder:text-[hsl(var(--muted-foreground)/.65)] focus:ring-2 focus:ring-[hsl(var(--ring)/.25)]" />
                  <button type="button" onClick={loadDocFromLink} data-testid="button-signature-doc-link" className="btn-press h-11 shrink-0 rounded-xl bg-[hsl(var(--secondary))] px-4 text-sm font-bold">Load link</button>
                </div>
                {docLinkError && <p className="mt-2 text-xs text-[hsl(var(--destructive))]" role="alert">{docLinkError}</p>}
                {docError && <p className="mt-2 text-xs text-[hsl(var(--destructive))]" role="alert">{docError}</p>}
                {docLoading && <p className="mt-2 text-xs font-bold text-[hsl(var(--muted-foreground))]">Reading PDF… your document is being prepared in your browser.</p>}
              </div>
              <div className="mt-6 grid w-full max-w-md gap-3 sm:grid-cols-3">
                {[['1 · Upload', 'Your contract, form, or letter'], ['2 · Create signature', 'Draw, type, or upload it'], ['3 · Download', 'Signed and ready to send']].map(([n, d]) => <div key={n} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-left"><p className="font-display text-sm font-bold">{n}</p><p className="mt-1 text-xs leading-5 text-[hsl(var(--muted-foreground))]">{d}</p></div>)}
              </div>
            </div>
          ) : (
            <div>
              <h1 className="sr-only">Free Online Signature Maker</h1>
              <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
                <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.3)] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.16em] text-[hsl(var(--primary))]">Step 1 · Create your signature</p>
                    {signatureData && <button type="button" onClick={() => setSignatureData('')} className="text-xs font-bold text-[hsl(var(--muted-foreground))]" data-testid="button-signature-clear">Remove</button>}
                  </div>
                  <div className="mt-3 flex rounded-xl bg-[hsl(var(--card))] p-1">
                    {sigTabs.map((t) => <button key={t.id} type="button" onClick={() => setSigTab(t.id)} className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-bold ${sigTab === t.id ? 'bg-[hsl(var(--muted))] shadow-sm' : 'text-[hsl(var(--muted-foreground))]'}`} data-testid={`button-doc-sign-${t.id}`}>{t.label}</button>)}
                  </div>
                  <div className="mt-3">
                    {sigTab === 'draw' && <SignatureCanvas color={color} canvasRef={composerDrawRef} />}
                    {sigTab === 'type' && <div>
                      <div className="flex min-h-[140px] items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[hsl(var(--primary)/.35)] bg-[hsl(var(--card))] px-4"><span style={{ color, fontFamily: proFont, fontSize: '40px' }} className="font-bold tracking-[-.06em]">{name || 'Your name'}</span></div>
                      <div className="mt-3"><Field label="Your name" value={name} onChange={setName} placeholder="Type your name" testId="input-doc-sign-name" /></div>
                      <div className="mt-3"><label className="block"><span className="mb-1.5 block text-xs font-bold text-[hsl(var(--muted-foreground))]">Signature font</span><select value={proFont} onChange={(e) => setProFont(e.target.value)} className="h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm" data-testid="select-doc-sign-font">{professionalSignatureFonts.map(([fontName, fontStackValue]) => <option key={fontStackValue} value={fontStackValue}>{fontName}</option>)}</select></label></div>
                    </div>}
                    {sigTab === 'upload' && <div>
                      <div onClick={() => document.getElementById('composer-sign-upload-input')?.click()} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); document.getElementById('composer-sign-upload-input')?.click(); } }} className="flex min-h-[140px] cursor-pointer items-center justify-center rounded-2xl border border-dashed border-[hsl(var(--primary)/.35)] bg-[hsl(var(--card))] px-4 transition-colors hover:bg-[hsl(var(--secondary)/.25)]" data-testid="upload-doc-sign-dropzone">{composerUpload ? <img src={composerUpload} alt="Preview of your uploaded signature image" className="max-h-28 max-w-full object-contain" /> : <div className="text-center"><Upload className="mx-auto text-[hsl(var(--primary))]" size={22} /><p className="mt-2 text-xs font-bold">Upload a signature image</p><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">PNG, JPG, or WebP. Transparent PNG works best.</p></div>}</div>
                      <input id="composer-sign-upload-input" type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => pickComposerUpload(e.target.files?.[0])} data-testid="input-doc-sign-upload" />
                      {composerUpload && <button type="button" onClick={() => setComposerUpload('')} className="mt-2 text-xs font-bold text-[hsl(var(--muted-foreground))]">Remove image</button>}
                      {composerUploadError && <p className="mt-2 text-xs text-[hsl(var(--destructive))]" role="alert">{composerUploadError}</p>}
                    </div>}
                    {sigTab !== 'upload' && <div className="mt-3"><InkPicker colors={colors} color={color} onChange={setColor} testIdPrefix="button-doc-color" /></div>}
                  </div>
                  <Button onClick={sigTab === 'draw' ? applyComposerDraw : sigTab === 'type' ? applyComposerType : applyComposerUpload} className="mt-4 w-full" testId="button-doc-signature-apply"><Check size={15} /> {signatureData ? 'Update signature' : 'Create signature'}</Button>
                  {signatureData && <div className="mt-3 flex items-center gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3"><img src={signatureData} alt="Your signature made in the free e-signature online tool" className="h-10 w-auto object-contain" data-testid="img-doc-signature-preview" /><span className="text-xs font-bold text-[hsl(var(--primary))]">Ready — drag it onto the page</span></div>}
                </div>
                </div>
                <div>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="max-w-[50%] truncate text-xs font-bold text-[hsl(var(--muted-foreground))]">{docName || 'document'}</span>
                    <div className="flex items-center gap-2">
                      <Button variant="quiet" onClick={clearDoc} testId="button-doc-replace">Change document</Button>
                      <button type="button" onClick={clearDoc} data-testid="button-doc-remove" className="btn-press inline-flex min-h-10 items-center gap-2 rounded-xl bg-[hsl(var(--destructive))] px-4 py-2 text-sm font-bold text-white">Remove</button>
                    </div>
                  </div>
                  <div className="overflow-x-auto rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.4)] p-3">
                    <div
                      ref={docWrapRef}
                      className="relative mx-auto w-full max-w-[560px] select-none"
                      onPointerDown={(e) => { placeSignOnClick(e); if (!signatureData) { positioning.current = true; (e.currentTarget).setPointerCapture(e.pointerId); } }}
                      onPointerMove={signDocPosition}
                      onPointerUp={() => { positioning.current = false; }}
                      onPointerLeave={() => { positioning.current = false; }}
                      onClick={(e) => { e.stopPropagation(); setSigSelected(false); }}
                    >
                      <img src={docData} alt="Your uploaded document being signed" className="w-full rounded-md" data-testid="img-document" />
                      {signatureData && <div
                        className="absolute"
                        style={{ left: `${sign?.xPct ?? signPos.x}%`, top: `${sign?.yPct ?? signPos.y}%`, width: `${(sign?.widthPct ?? 20)}%`, maxWidth: '80%', transform: 'translate(-50%, -50%)', touchAction: 'none' }}
                        data-testid="sign-overlay"
                        onPointerDown={(e) => { e.stopPropagation(); setSigSelected(true); startSignDrag(e); }}
                        onPointerMove={onSignDragMove}
                        onPointerUp={(e) => { e.stopPropagation(); stopSignDrag(); }}
                        onPointerCancel={(e) => { e.stopPropagation(); stopSignDrag(); }}
                      >
                        <img
                          src={signatureData}
                          alt="Your signature placed on the document"
                          className={`w-full drop-shadow-sm ${sigSelected ? 'outline outline-2 outline-[hsl(var(--primary))] outline-offset-1' : ''}`}
                          data-testid="img-doc-sign-placed"
                          style={{ touchAction: 'none', cursor: signDragging.current ? 'grabbing' : 'grab', pointerEvents: 'auto' }}
                          draggable={false}
                        />
                        {sigSelected && <>
                          <div
                            onPointerDown={(e) => { e.stopPropagation(); startCornerResize(e); }}
                            onPointerMove={(e) => { e.stopPropagation(); cornerResizeMove(e); }}
                            onPointerUp={(e) => { e.stopPropagation(); stopCornerResize(); }}
                            onPointerLeave={(e) => { e.stopPropagation(); stopCornerResize(); }}
                            className="absolute -right-1 -bottom-1 size-4 cursor-nwse-resize rounded-full border-2 border-white bg-[hsl(var(--primary))] shadow"
                            title="Drag corner to resize"
                            data-testid="handle-doc-resize"
                          />
                          <div
                            onPointerDown={(e) => { e.stopPropagation(); startCornerResize(e); }}
                            onPointerMove={(e) => { e.stopPropagation(); cornerResizeMove(e); }}
                            onPointerUp={(e) => { e.stopPropagation(); stopCornerResize(); }}
                            onPointerLeave={(e) => { e.stopPropagation(); stopCornerResize(); }}
                            className="absolute -left-1 -bottom-1 size-4 cursor-nesw-resize rounded-full border-2 border-white bg-[hsl(var(--primary))] shadow"
                            title="Drag corner to resize"
                          />
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-md bg-[hsl(var(--card))] border border-[hsl(var(--border))] px-1 py-0.5 shadow">
                            <button type="button" className="px-1 text-xs" onClick={(e) => { e.stopPropagation(); const w = Math.max(5, Math.min(80, (sign?.widthPct ?? 20) - 2)); const ns={ pageIndex:docPageIndex, xPct:sign?.xPct??signPos.x, yPct:sign?.yPct??signPos.y, widthPct:w }; setSign(ns); setSignPos({x:ns.xPct,y:ns.yPct}); setSignScaleX(w/20); setSignScaleY(w/20); }}>-</button>
                            <button type="button" className="px-1 text-xs" onClick={(e) => { e.stopPropagation(); const w = Math.max(5, Math.min(80, (sign?.widthPct ?? 20) + 2)); const ns={ pageIndex:docPageIndex, xPct:sign?.xPct??signPos.x, yPct:sign?.yPct??signPos.y, widthPct:w }; setSign(ns); setSignPos({x:ns.xPct,y:ns.yPct}); setSignScaleX(w/20); setSignScaleY(w/20); }}>+</button>
                            <button type="button" className="px-1 text-xs" onClick={(e) => { e.stopPropagation(); setSignatureData(''); setSign(null); setSigSelected(false); }}>x</button>
                          </div>
                        </>}
                      </div>}
                    </div>
                  </div>
                  {docIsPdf && docPageCount > 1 && <div className="mt-3 flex items-center justify-center gap-3 text-xs font-bold">
                    <button type="button" disabled={docPageIndex === 0} onClick={() => goToPage(-1)} className="btn-press inline-flex min-h-11 items-center gap-1 rounded-lg bg-[hsl(var(--card))] px-3 text-[hsl(var(--muted-foreground))] shadow-sm disabled:cursor-not-allowed disabled:opacity-40" data-testid="button-doc-page-prev"><ChevronLeft size={14} /> Prev</button>
                    <span className="text-[hsl(var(--muted-foreground))]">Page {docPageIndex + 1} of {docPageCount}</span>
                    <button type="button" disabled={docPageIndex === docPageCount - 1} onClick={() => goToPage(1)} className="btn-press inline-flex min-h-11 items-center gap-1 rounded-lg bg-[hsl(var(--card))] px-3 text-[hsl(var(--muted-foreground))] shadow-sm disabled:cursor-not-allowed disabled:opacity-40" data-testid="button-doc-page-next">Next <ChevronRight size={14} /></button>
                  </div>}
                  {docIsPdf && <div className="mt-2 text-center text-xs text-[hsl(var(--muted-foreground))]">Your signature is added to the page shown here. When you download as PDF, every page is kept and the signature is stamped on this page.</div>}
                  {signatureData && <div className="mt-3 space-y-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.3)] p-4">
                    <label className="block"><span className="mb-1.5 block text-xs font-bold text-[hsl(var(--muted-foreground))]">Signature size</span><input type="range" min={5} max={80} value={Math.round((sign?.widthPct ?? 20))} onChange={(e) => { const w = Number(e.target.value); const ns={ pageIndex:docPageIndex, xPct:sign?.xPct??signPos.x, yPct:sign?.yPct??signPos.y, widthPct:w }; setSign(ns); setSignPos({x:ns.xPct,y:ns.yPct}); setSignScaleX(w/20); setSignScaleY(w/20); }} className="w-full" data-testid="input-sign-size-x" /></label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block"><span className="mb-1.5 block text-xs font-bold text-[hsl(var(--muted-foreground))]">Position left</span><input type="range" min={0} max={100} value={Math.round(sign?.xPct ?? signPos.x)} onChange={(e) => { const x = Number(e.target.value); const ns={ pageIndex:docPageIndex, xPct:x, yPct:sign?.yPct??signPos.y, widthPct:sign?.widthPct??20 }; setSign(ns); setSignPos({x,y}); }} className="w-full" data-testid="input-sign-pos-x" /></label>
                      <label className="block"><span className="mb-1.5 block text-xs font-bold text-[hsl(var(--muted-foreground))]">Position top</span><input type="range" min={0} max={100} value={Math.round(sign?.yPct ?? signPos.y)} onChange={(e) => { const y = Number(e.target.value); const ns={ pageIndex:docPageIndex, xPct:sign?.xPct??signPos.x, yPct:y, widthPct:sign?.widthPct??20 }; setSign(ns); setSignPos({x:ns.xPct,y}); }} className="w-full" data-testid="input-sign-pos-y" /></label>
                    </div>
                    <p className="text-xs leading-5 text-[hsl(var(--muted-foreground))]">Drag anywhere on the page to position your signature, or use the sliders above to fine-tune size and position.</p>
                  </div>}
                </div>
              </div>
            </div>
          )}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[hsl(var(--border))] pt-4">
            <label className="flex items-center gap-2 text-xs font-bold text-[hsl(var(--muted-foreground))]">Download as <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value as ExportFormat)} className="h-9 rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-2 text-xs" data-testid="select-signature-export-format"><option value="png">PNG</option><option value="jpg">JPG</option><option value="pdf">PDF</option></select></label>
            <Button onClick={downloadSignedDoc} className="w-full sm:w-auto" testId="button-download-signature"><Download size={15} /> Download signed document</Button>
          </div>
        </>
      </section>

      {!docData && <aside className="rounded-[1.35rem] border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/.32)] p-6">
        <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.16em] text-[hsl(var(--primary))]">Good to know</p>
        <h2 className="mt-3 font-display text-2xl font-bold tracking-[-.035em]">An online signature maker that travels well</h2>
        <div className="mt-6 space-y-5">
          {[['Transparent by default', 'Drop your PNG onto a PDF, contract, or email without a white box around it.'], ['Yours in a moment', 'Use a stylus, mouse, trackpad, or type a name. The result is yours to keep.'], ['Professional by design', 'Upload a rough image and we clean its background, ink, and color on this device. You can even draw a new signature on top.'], ['Sign any document', 'Upload a PDF, contract, or form image, draw or type a signature, and place it exactly where you need it — on any page.']].map(([h, p]) => <div key={h} className="flex gap-3"><span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"><Check size={14} /></span><div><h3 className="text-sm font-bold">{h}</h3><p className="mt-1 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{p}</p></div></div>)}
        </div>
      </aside>}
    </div>
    {!docData && <ToolIntro id="signature"><span className="hidden items-center gap-2 text-xs text-[hsl(var(--muted-foreground))] md:flex"><ShieldCheck size={15} className="text-[hsl(var(--primary))]" /> Nothing leaves your browser</span></ToolIntro>}
    {!docData && <InfoSection title="Digital signatures, without the ceremony" intro="A signature image is useful when you need to approve a document quickly, add a sign-off to a proposal, or make a form feel finished. Office Toolkit keeps that small job small." bullets={['Use a dark ink color for the clearest result on light documents.', 'Leave generous space around a drawn signature so it stays legible when resized.', 'Upload a signature image and use it exactly as it is — the original colour and quality are preserved.', 'Place a drawn or typed signature directly onto an uploaded PDF, contract, or form — no account needed.', 'Drawn signatures keep the smooth, natural look of a pen and can be reused over and over for approvals, agreements, and sign-offs.', 'Typed signatures are a fast, clean choice when the document is digital and the recipient expects a consistent, legible name block.', 'Sign a PDF, contract, or form, then download the final document with the signature placed exactly where you need it.', 'Everything you draw, upload, type, or sign stays in your browser — no servers, no account, no signature stored online.']} faq={[['How to sign a PDF online free?', 'Upload the PDF, draw or type your signature, drag it onto the page, and download the signed copy — all in your browser, with no account and no charge.'], ['Is my signature uploaded?', 'No. The drawing canvas, upload processing, and document signing run locally in your browser.'], ['Can I use the signature on a contract?', 'This tool creates an image of your signature. Whether that image meets a particular legal or company requirement depends on the document and jurisdiction.'], ['Which documents can I sign?', 'You can upload a PDF, PNG, JPG, or WebP document and place your signature on any page. Multi-page PDFs keep every page when you download as PDF.'],             ['Which formats can I download?', 'You can download a signature or signed document as PNG, JPG, or PDF. PNG is best when you need a transparent background.'],
             ['Are my documents private?', 'Yes. Every document, signature, and draft is processed locally in your browser and never uploaded to a server. Close the tab and nothing is left behind.'], ['Can I sign a PDF with both a drawn and a typed signature?', 'Yes. Draw one signature, type another, or upload an image — then place each one anywhere on a PDF, PNG, JPG, or WebP document before you export. That flexibility makes it easy to add everything a signing party expects: a written mark plus a clearly printed name line.']]} />}
    <YouMightAlsoNeed href="/invoice-generator" title="Invoice Generator" category="invoice" tools={esignatureToolUseCases} />

    <section className="mx-auto max-w-4xl px-5 py-12 lg:px-8">
      <h2 className="font-display text-3xl font-bold tracking-[-.04em] text-[hsl(var(--foreground))]">What is the E-Signature Maker?</h2>
      <p className="mt-4 max-w-3xl text-base leading-7 text-[hsl(var(--foreground))]">A free browser tool that lets you create an electronic signature by drawing, typing, or uploading an image — then place it on any PDF, Word, or Excel document and download a signed PDF. No account, no uploads to servers, runs entirely in your browser.</p>

      <div className="mt-8 max-w-3xl space-y-4">
        <h3 className="font-semibold text-[hsl(var(--foreground))]">Why use this tool?</h3>
        <ul className="list-disc pl-5 space-y-2 text-base leading-7 text-[hsl(var(--muted-foreground))]">
          <li>Completely free — no subscription, no trial limits</li>
          <li>Runs entirely in your browser; your documents never leave your device</li>
          <li>Draw, type with 12 professional fonts, or upload a signature image</li>
          <li>Place signatures on PDFs, Word docs, Excel files, contracts, offer letters</li>
          <li>Export transparent PNG (signature only) or signed PDF (signature on document)</li>
          <li>Works offline after first visit</li>
        </ul>
      </div>

      <div className="mt-8 max-w-3xl space-y-4">
        <h3 className="font-semibold text-[hsl(var(--foreground))]">Free vs paid signature tools</h3>
        <p className="text-base leading-7 text-[hsl(var(--muted-foreground))]">Paid tools (DocuSign, Adobe Sign) charge $10–40/month and require accounts with cloud storage. Office Toolkit is free forever, local-first, and gives you the signed file instantly. For high-volume workflows needing certified audit trails or regulatory compliance (eIDAS qualified, FDA 21 CFR Part 11), paid services offer compliance certifications not available here.</p>
      </div>

      <div className="mt-8 max-w-3xl space-y-4">
        <h3 className="font-semibold text-[hsl(var(--foreground))]">Questions people ask AI assistants</h3>
        <dl className="space-y-4 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
          <div><dt className="font-semibold text-[hsl(var(--foreground))]">What is the best free online signature maker without signup?</dt><dd className="mt-1">Office Toolkit's E-Signature Maker — draw, type, or upload a signature, place it on any document, download as PNG or PDF. No account needed.</dd></div>
          <div><dt className="font-semibold text-[hsl(var(--foreground))]">Can I sign a PDF online for free without an account?</dt><dd className="mt-1">Yes. Upload the PDF, add your signature, download the signed copy. No signup, no server upload.</dd></div>
          <div><dt className="font-semibold text-[hsl(var(--foreground))]">Is an electronic signature legally valid?</dt><dd className="mt-1">For most everyday commercial agreements, yes. Meets ESIGN (US) and eIDAS (EU) standards. For high-stakes matters, consult a lawyer.</dd></div>
        </dl>
      </div>

      <div className="mt-8 flex items-center gap-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]"><Calendar size={16} /></span>
        <p className="text-sm font-medium text-[hsl(var(--foreground))]">Last updated: 2026-10-11</p>
      </div>
    </section>

  </main></PageMeta>;
}
