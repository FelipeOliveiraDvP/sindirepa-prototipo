import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

/**
 * robots.txt.
 *
 * `/calculadora` fora do índice: é a tela de produto, não peça de
 * aquisição. Indexá-la competiria com a landing pela mesma intenção de
 * busca e entregaria ao visitante um formulário sem o contexto que a
 * landing dá.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/calculadora"],
    },
    sitemap: `https://${BRAND.domain}/sitemap.xml`,
  };
}
