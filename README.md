# Peluches Crochet — PWA instalable (P3-2)

Tienda en línea de peluches tejidos a mano, convertida en PWA instalable con `@vite-pwa/astro`.

## Cómo probarla

1. **Prende el backend en Render:** entra a https://proyecto-e-commerce-crochet.onrender.com/ y espera a que cargue (en el plan gratuito puede tardar un minuto en despertar).
2. **Entra a la tienda:** abre https://proyecto-e-commerce-crochet.vercel.app/

## Cómo instalar la app

- **Escritorio (Chrome/Edge):** en la barra de direcciones aparece el icono de "Instalar"; también en el menú ⋮ → *Instalar Peluches Crochet*.
- **Android (Chrome):** menú ⋮ → *Instalar aplicación* / *Agregar a la pantalla principal*.
- **iPhone (Safari):** botón Compartir → *Agregar a pantalla de inicio*.

## Dónde está la configuración de la PWA

- `front/astro.config.mjs`: integración `AstroPWA` y manifiesto (name, short_name, start_url, scope, display `standalone`, theme_color, background_color, icons).
- `front/src/components/PwaHead.astro`: enlaza el manifiesto y registra el Service Worker.
- `front/src/styles/App.css` (`:root`): tokens de color usados en el manifiesto.
- `front/public/icons/`: iconos 192×192, 512×512 y maskable 512 (logo en el 80% central).
