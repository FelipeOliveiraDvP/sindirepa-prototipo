import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

/**
 * Sitemap. Uma rota indexável: a única landing, que apresenta o produto
 * e é a entrada de tudo.
 *
 * `/calculadora` fica de fora de propósito — é produto, não peça de
 * aquisição, e não tem conteúdo para indexar.
 *
 * URL absoluta montada a partir de BRAND.domain: o sitemap exige
 * absoluto e não herda o `metadataBase` do layout raiz.
 */
const base = `https://${BRAND.domain}`;

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: base, changeFrequency: "monthly", priority: 1 }];
}
