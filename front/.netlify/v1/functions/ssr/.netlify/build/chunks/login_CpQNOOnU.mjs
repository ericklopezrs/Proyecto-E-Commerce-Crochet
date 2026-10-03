import { t as createComponent } from "./compiler_DP-tUfSz.mjs";
import { S as createAstro, f as renderHead, s as renderSlot, u as renderTemplate } from "./server_Ms_2HFn4.mjs";
//#region src/layouts/LoginLayout.astro
createAstro("https://astro.build");
var $$LoginLayout = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$LoginLayout;
	const { title = "Peluches Crochet" } = Astro.props;
	return renderTemplate`<html lang="en"><head><meta charset="UTF-8"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap" rel="stylesheet"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&display=swap" rel="stylesheet"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title>${renderHead($$result)}</head><body class="login-img">${renderSlot($$result, $$slots["default"], renderTemplate``)}</body></html>`;
}, "/home/erick/Documents/Practica 6/front/src/layouts/LoginLayout.astro", void 0);
//#endregion
export { $$LoginLayout as t };
