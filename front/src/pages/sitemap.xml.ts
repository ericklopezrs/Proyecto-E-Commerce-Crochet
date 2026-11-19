import { getCategorias } from '../lib/data';

const SITE = 'https://proyecto-e-commerce-crochet.vercel.app';

export const GET = async () => {
  const categorias = (await getCategorias()) ?? [];
  const productos = categorias.flatMap((c: any) => c.productos ?? []);

  const urls = [
    `${SITE}/`,
    `${SITE}/ubicacion`,
    ...productos.map((p: any) => `${SITE}/producto/${p.id}`),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};