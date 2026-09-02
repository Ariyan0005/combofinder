import { useEffect } from "react";

interface SeoHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalPath?: string;
  ogType?: "website" | "article" | "product";
  ogImage?: string;
  schema?: Record<string, unknown>;
}

export function SeoHead({
  title = "PosCert ERP | Smart Cloud POS & Business Management System",
  description = "PosCert is an all-in-one Cloud POS & Business ERP system. Streamline multi-branch retail sales, inventory control, automated invoicing, customer CRM, supplier ledgers, and specialized repair workflows.",
  keywords = "PosCert, PosCert ERP, Cloud POS system, POS software, Business ERP software, retail point of sale, multi branch inventory management, invoicing software, supplier ledger, customer CRM, repair shop POS, phone repair management, hardware compatibility, retail store billing",
  canonicalPath = "/",
  ogType = "website",
  ogImage = "https://poscert.com/opengraph.jpg",
  schema,
}: SeoHeadProps) {
  useEffect(() => {
    // 1. Update Document Title
    const fullTitle = title.includes("PosCert") ? title : `${title} | PosCert ERP`;
    document.title = fullTitle;

    // 2. Helper to set or update meta tag
    const setMetaTag = (attrName: "name" | "property", attrValue: string, content: string) => {
      let element = document.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    // 3. Standard Meta
    setMetaTag("name", "description", description);
    setMetaTag("name", "keywords", keywords);

    // 4. OpenGraph
    const fullUrl = `https://poscert.com${canonicalPath.startsWith("/") ? canonicalPath : `/${canonicalPath}`}`;
    setMetaTag("property", "og:title", fullTitle);
    setMetaTag("property", "og:description", description);
    setMetaTag("property", "og:url", fullUrl);
    setMetaTag("property", "og:type", ogType);
    setMetaTag("property", "og:image", ogImage);

    // 5. Twitter
    setMetaTag("name", "twitter:title", fullTitle);
    setMetaTag("name", "twitter:description", description);
    setMetaTag("name", "twitter:image", ogImage);

    // 6. Canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", fullUrl);

    // 7. Optional dynamic JSON-LD injection
    let scriptTag: HTMLScriptElement | null = null;
    if (schema) {
      scriptTag = document.createElement("script");
      scriptTag.setAttribute("type", "application/ld+json");
      scriptTag.setAttribute("data-dynamic-seo", "true");
      scriptTag.textContent = JSON.stringify(schema);
      document.head.appendChild(scriptTag);
    }

    return () => {
      if (scriptTag && scriptTag.parentNode) {
        scriptTag.parentNode.removeChild(scriptTag);
      }
    };
  }, [title, description, keywords, canonicalPath, ogType, ogImage, schema]);

  return null;
}
