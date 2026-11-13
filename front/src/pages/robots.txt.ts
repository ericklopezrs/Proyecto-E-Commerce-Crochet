const SITE = 'https://proyecto-e-commerce-crochet.vercel.app';

export const GET = () =>
  new Response(
    `User-agent: *
Allow: /
Disallow: /admin
Disallow: /checkout
Disallow: /mis-pedidos

Sitemap: ${SITE}/sitemap.xml
`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
  );