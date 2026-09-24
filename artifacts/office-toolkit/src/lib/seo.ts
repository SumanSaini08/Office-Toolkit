const BRAND = "Office Toolkit";

export type PageSeoArticle = {
  publishedTime: string;
  modifiedTime?: string;
  author?: string;
};

export type PageMetaInput = {
  title: string;
  description: string;
  canonical?: string;
  robots?: string;
  ogType?: string;
  includeBrand?: boolean;
  image?: string;
  article?: PageSeoArticle;
  prevUrl?: string;
  nextUrl?: string;
};

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

export function applyPageMeta(input: PageMetaInput) {
  const title =
    input.includeBrand === false
      ? input.title
      : `${input.title} — ${BRAND}`;
  const path = input.canonical ?? window.location.pathname;
  const url = `${window.location.origin}${path}`;
  const image =
    input.image && !/^https?:\/\//i.test(input.image)
      ? `${window.location.origin}${input.image}`
      : input.image;

  document.title = title;

  const setMeta = (selector: string, attr: string, value: string) => {
    let el = document.querySelector(selector);
    if (!el) {
      el = document.createElement("meta");
      const match = selector.match(/\["?([a-z]+)"?\]/i);
      el.setAttribute(attr, match ? match[1] : "name");
      document.head.appendChild(el);
    }
    el.setAttribute("content", value);
  };

  const setMetaIfValue = (selector: string, attr: string, value?: string) => {
    if (!value) return;
    let el = document.querySelector(selector);
    if (!el) {
      el = document.createElement("meta");
      const match = selector.match(/\["?([a-z]+)"?\]/i);
      el.setAttribute(attr, match ? match[1] : "name");
      document.head.appendChild(el);
    }
    el.setAttribute("content", value);
  };

  setMeta('meta[name="description"]', "name", input.description);
  setMeta('meta[name="robots"]', "name", input.robots ?? "index, follow");
  setMeta('meta[property="og:site_name"]', "property", BRAND);
  setMeta('meta[property="og:locale"]', "property", "en_US");
  setMeta('meta[property="og:title"]', "property", title);
  setMeta('meta[property="og:description"]', "property", input.description);
  setMeta('meta[property="og:type"]', "property", input.ogType ?? "website");
  setMeta('meta[property="og:url"]', "property", url);
  setMetaIfValue('meta[property="og:image"]', "property", image);
  if (image) {
    setMeta('meta[property="og:image:secure_url"]', "property", image);
    setMeta('meta[property="og:image:width"]', "property", String(OG_IMAGE_WIDTH));
    setMeta('meta[property="og:image:height"]', "property", String(OG_IMAGE_HEIGHT));
    setMeta('meta[property="og:image:alt"]', "property", title);
  }
  setMeta('meta[name="twitter:card"]', "name", "summary_large_image");
  setMeta('meta[name="twitter:title"]', "name", title);
  setMeta('meta[name="twitter:description"]', "name", input.description);
  setMetaIfValue('meta[name="twitter:image"]', "name", image);

  if (input.article) {
    setMeta('meta[property="article:published_time"]', "property", input.article.publishedTime);
    setMetaIfValue('meta[property="article:modified_time"]', "property", input.article.modifiedTime ?? input.article.publishedTime);
    setMetaIfValue('meta[property="article:author"]', "property", input.article.author ?? "Office Toolkit");
  } else {
    const articleExtra = ["article:published_time", "article:modified_time", "article:author"];
    articleExtra.forEach((prop) => {
      const el = document.querySelector(`meta[property="${prop}"]`);
      if (el) el.remove();
    });
  }

  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }
  canonical.setAttribute("href", url);

  const relLinks: Array<[string, string | undefined]> = [
    ["prev", input.prevUrl],
    ["next", input.nextUrl],
  ];
  for (const [rel, href] of relLinks) {
    const selector = `link[rel="${rel}"]`;
    const existing = document.querySelector<HTMLLinkElement>(selector);
    if (href) {
      const link = existing ?? document.createElement("link");
      link.setAttribute("rel", rel);
      link.setAttribute("href", `${window.location.origin}${href}`);
      if (!existing) document.head.appendChild(link);
    } else if (existing) {
      existing.remove();
    }
  }
}