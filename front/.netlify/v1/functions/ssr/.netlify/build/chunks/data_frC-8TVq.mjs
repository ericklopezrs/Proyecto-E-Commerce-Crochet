import { t as createComponent } from "./compiler_DP-tUfSz.mjs";
import { S as createAstro, f as renderHead, i as renderComponent, m as createRenderInstruction, p as addAttribute, s as renderSlot, u as renderTemplate } from "./server_Ms_2HFn4.mjs";
import { n as useAuthStore, t as useCartStore } from "./useCartStore_DwvtQDv2.mjs";
import { a as fetchGraphQL, n as hacerLogout } from "./auth_Bkti9BtQ.mjs";
import { useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { create } from "zustand";
//#region node_modules/astro/dist/runtime/server/render/script.js
async function renderScript(result, id) {
	const inlined = result.inlinedScripts.get(id);
	let content = "";
	if (inlined != null) {
		if (inlined) content = `<script type="module">${inlined}<\/script>`;
	} else {
		const resolved = await result.resolve(id);
		content = `<script type="module" src="${result.userAssetsBase ? (result.base === "/" ? "" : result.base) + result.userAssetsBase : ""}${resolved}"><\/script>`;
	}
	return createRenderInstruction({
		type: "script",
		id,
		content
	});
}
//#endregion
//#region node_modules/astro/components/ClientRouter.astro
createAstro("https://astro.build");
var $$ClientRouter = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$ClientRouter;
	const { fallback = "animate" } = Astro.props;
	return renderTemplate`<meta name="astro-view-transitions-enabled" content="true"><meta name="astro-view-transitions-fallback"${addAttribute(fallback, "content")}>${renderScript($$result, "/home/erick/Documents/Practica 6/front/node_modules/astro/components/ClientRouter.astro?astro&type=script&index=0&lang.ts")}`;
}, "/home/erick/Documents/Practica 6/front/node_modules/astro/components/ClientRouter.astro", void 0);
//#endregion
//#region src/assets/logo.png
var logo_default = new Proxy({
	"src": "/_astro/logo.D1MwBY4U.png",
	"width": 500,
	"height": 500,
	"format": "png"
}, { get(target, name, receiver) {
	if (name === "clone") return structuredClone(target);
	if (name === "fsPath") return "/home/erick/Documents/Practica 6/front/src/assets/logo.png";
	return target[name];
} });
//#endregion
//#region src/components/TopBar.jsx
function TopBar({ searchTerm, onSearchChange, totalItemsCount, onGoHome, onGoCart, categorias, selectedCategoria, onSelectCategoria, usuario, onLogout }) {
	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const inputRef = useRef(null);
	const toggleSearch = () => {
		if (isSearchOpen) {
			setIsSearchOpen(false);
			if (searchTerm) onSearchChange("");
		} else {
			setIsSearchOpen(true);
			setTimeout(() => inputRef.current?.focus(), 120);
		}
	};
	const handleKeyDown = (e) => {
		if (e.key === "Escape") toggleSearch();
	};
	return /* @__PURE__ */ jsxs("header", {
		className: "header",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "header-main",
			children: [
				/* @__PURE__ */ jsx("div", {
					className: "header-side header-side-left",
					children: /* @__PURE__ */ jsxs("div", {
						className: "brand",
						onClick: onGoHome,
						style: { cursor: "pointer" },
						children: [/* @__PURE__ */ jsx("img", {
							src: logo_default.src,
							alt: "Logo",
							className: "brand-logo-img"
						}), /* @__PURE__ */ jsx("h1", {
							className: "brand-title",
							children: "Peluches Crochet"
						})]
					})
				}),
				/* @__PURE__ */ jsxs("div", {
					className: `search-expand ${isSearchOpen ? "open" : ""}`,
					children: [/* @__PURE__ */ jsx("button", {
						className: "search-toggle",
						onClick: toggleSearch,
						title: "Buscar",
						children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-magnifying-glass" })
					}), /* @__PURE__ */ jsx("input", {
						ref: inputRef,
						type: "text",
						placeholder: "Buscar amigurumis, accesorios...",
						value: searchTerm,
						onChange: (e) => onSearchChange(e.target.value),
						onKeyDown: handleKeyDown,
						onBlur: () => {
							if (!searchTerm) setIsSearchOpen(false);
						},
						className: "search-input"
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "header-side header-side-right",
					children: [usuario ? /* @__PURE__ */ jsxs("div", {
						className: "header-user",
						children: [/* @__PURE__ */ jsxs("span", {
							className: "header-user-name",
							children: ["Hola, ", usuario.nombre.split(" ")[0]]
						}), /* @__PURE__ */ jsx("button", {
							className: "header-logout-btn",
							onClick: onLogout,
							title: "Cerrar sesión",
							children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-right-from-bracket" })
						})]
					}) : /* @__PURE__ */ jsxs("a", {
						href: "/login",
						className: "header-login-btn",
						children: [/* @__PURE__ */ jsx("i", {
							className: "fa-solid fa-right-to-bracket",
							style: { marginRight: "6px" }
						}), "Iniciar Sesión"]
					}), /* @__PURE__ */ jsxs("button", {
						className: "header-cart-button",
						onClick: onGoCart,
						children: [/* @__PURE__ */ jsx("i", { className: "fa-solid fa-cart-shopping" }), totalItemsCount > 0 && /* @__PURE__ */ jsx("span", {
							className: "floating-cart-badge",
							children: totalItemsCount
						})]
					})]
				})
			]
		}), /* @__PURE__ */ jsxs("nav", {
			className: "category-bar",
			children: [/* @__PURE__ */ jsxs("button", {
				className: `category-chip ${selectedCategoria === "TODAS" ? "active" : ""}`,
				onClick: () => onSelectCategoria("TODAS"),
				children: [/* @__PURE__ */ jsx("i", {
					className: "fa-solid fa-border-all",
					style: { marginRight: "6px" }
				}), "Todo"]
			}), categorias.map((cat) => /* @__PURE__ */ jsx("button", {
				className: `category-chip ${String(selectedCategoria) === String(cat.id) ? "active" : ""}`,
				onClick: () => onSelectCategoria(cat.id),
				children: cat.nombre
			}, cat.id))]
		})]
	});
}
//#endregion
//#region src/store/useUiStore.js
var useUiStore = create((set) => ({
	searchTerm: "",
	selectedCategoria: "TODAS",
	setSearchTerm: (term) => set({ searchTerm: term }),
	setSelectedCategoria: (id) => set({ selectedCategoria: id })
}));
//#endregion
//#region src/components/islands/TopBarIsland.jsx
function TopBarIsland({ categorias }) {
	const cart = useCartStore((s) => s.cart);
	const clearCart = useCartStore((s) => s.clearCart);
	const searchTerm = useUiStore((s) => s.searchTerm);
	const setSearchTerm = useUiStore((s) => s.setSearchTerm);
	const selectedCategoria = useUiStore((s) => s.selectedCategoria);
	const setSelectedCategoria = useUiStore((s) => s.setSelectedCategoria);
	const usuario = useAuthStore((s) => s.usuario);
	const refresh_token = useAuthStore((s) => s.refresh_token);
	const limpiarSesion = useAuthStore((s) => s.limpiarSesion);
	const totalItemsCount = cart.reduce((acc, item) => acc + item.cantidad, 0);
	const handleLogout = async () => {
		try {
			if (refresh_token) await hacerLogout(refresh_token);
		} catch {}
		limpiarSesion();
		clearCart();
		window.location.href = "/";
	};
	return /* @__PURE__ */ jsx(TopBar, {
		searchTerm,
		onSearchChange: setSearchTerm,
		totalItemsCount,
		onGoHome: () => {
			setSelectedCategoria("TODAS");
			if (window.location.pathname !== "/") window.location.href = "/";
		},
		onGoCart: () => window.location.href = "/carrito",
		categorias,
		selectedCategoria,
		onSelectCategoria: (catId) => {
			setSelectedCategoria(catId);
			if (window.location.pathname !== "/") window.location.href = "/";
		},
		usuario,
		onLogout: handleLogout
	});
}
//#endregion
//#region src/components/islands/FloatingCartIsland.jsx
function FloatingCartIsland() {
	const totalItemsCount = useCartStore((s) => s.cart).reduce((acc, i) => acc + i.cantidad, 0);
	return /* @__PURE__ */ jsxs("a", {
		className: "floating-cart-button",
		href: "/carrito",
		style: { textDecoration: "none" },
		"data-astro-reload": true,
		children: [/* @__PURE__ */ jsx("i", { className: "fa-solid fa-basket-shopping" }), totalItemsCount > 0 && /* @__PURE__ */ jsx("span", {
			className: "floating-cart-badge",
			children: totalItemsCount
		})]
	});
}
//#endregion
//#region src/components/Footer.jsx
function Footer() {
	const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
	return /* @__PURE__ */ jsx("footer", {
		className: "footer",
		children: /* @__PURE__ */ jsxs("p", {
			className: "footer-text",
			children: [
				"Peluches Crochet © ",
				currentYear,
				" — Desarrollado por",
				" ",
				/* @__PURE__ */ jsxs("a", {
					href: "https://github.com/ericklopezrs",
					target: "_blank",
					rel: "noopener noreferrer",
					className: "footer-link",
					children: [/* @__PURE__ */ jsx("i", {
						className: "fa-brands fa-github",
						style: { marginRight: "4px" }
					}), "ericklopezrs"]
				})
			]
		})
	});
}
//#endregion
//#region src/layouts/Layout.astro
createAstro("https://astro.build");
var $$Layout = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Layout;
	const { title = "Peluches Crochet", categorias = [] } = Astro.props;
	return renderTemplate`<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">${renderComponent($$result, "ClientRouter", $$ClientRouter, {})}${renderHead($$result)}</head><body><div class="app-wrapper">${renderComponent($$result, "TopBarIsland", TopBarIsland, {
		"client:load": true,
		"categorias": categorias,
		"client:component-hydration": "load",
		"client:component-path": "/home/erick/Documents/Practica 6/front/src/components/islands/TopBarIsland.jsx",
		"client:component-export": "default"
	})}${renderComponent($$result, "FloatingCartIsland", FloatingCartIsland, {
		"client:idle": true,
		"client:component-hydration": "idle",
		"client:component-path": "/home/erick/Documents/Practica 6/front/src/components/islands/FloatingCartIsland.jsx",
		"client:component-export": "default"
	})}${renderSlot($$result, $$slots["default"])}${renderComponent($$result, "Footer", Footer, {})}</div></body></html>`;
}, "/home/erick/Documents/Practica 6/front/src/layouts/Layout.astro", void 0);
//#endregion
//#region src/lib/data.js
var cache = {
	data: null,
	timestamp: 0
};
var CACHE_TTL = 6e4;
async function getCategorias() {
	const ahora = Date.now();
	if (cache.data && ahora - cache.timestamp < CACHE_TTL) return cache.data;
	cache = {
		data: (await fetchGraphQL(`
    query {
      categorias {
        id nombre descripcion
        productos { id nombre precio imagen descripcion stock }
      }
    }
  `))?.categorias ?? [],
		timestamp: ahora
	};
	return cache.data;
}
//#endregion
export { $$Layout as n, useUiStore as r, getCategorias as t };
