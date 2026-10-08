import { n as __exportAll, t as createComponent } from "./compiler_DP-tUfSz.mjs";
import { S as createAstro, d as maybeRenderHead, i as renderComponent, p as addAttribute, u as renderTemplate } from "./server_Ms_2HFn4.mjs";
import { n as $$Layout, t as getCategorias } from "./data_frC-8TVq.mjs";
import { t as useCartStore } from "./useCartStore_DwvtQDv2.mjs";
import { useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/islands/ProductActionsIsland.jsx
function ProductActionsIsland({ producto }) {
	const { addToCart } = useCartStore();
	const [qty, setQty] = useState(1);
	const maxStock = producto.stock ?? 10;
	const changeQty = (delta) => setQty((q) => Math.min(Math.max(1, q + delta), maxStock));
	return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("div", {
		style: {
			display: "flex",
			alignItems: "center",
			gap: "16px",
			marginBottom: "20px"
		},
		children: [/* @__PURE__ */ jsx("label", {
			style: {
				fontWeight: "bold",
				fontSize: "14px",
				color: "#0f172a"
			},
			children: "Cantidad:"
		}), /* @__PURE__ */ jsxs("div", {
			className: "qty-picker",
			children: [
				/* @__PURE__ */ jsx("button", {
					onClick: () => changeQty(-1),
					children: "-"
				}),
				/* @__PURE__ */ jsx("span", { children: qty }),
				/* @__PURE__ */ jsx("button", {
					onClick: () => changeQty(1),
					disabled: qty >= maxStock,
					children: "+"
				})
			]
		})]
	}), /* @__PURE__ */ jsxs("div", {
		style: {
			display: "flex",
			gap: "12px",
			alignItems: "center"
		},
		children: [/* @__PURE__ */ jsxs("button", {
			className: "primary-btn",
			style: {
				flex: 2,
				padding: "14px 20px",
				fontSize: "15px"
			},
			onClick: () => addToCart(producto, qty),
			children: [/* @__PURE__ */ jsx("i", {
				className: "fa-solid fa-cart-plus",
				style: { marginRight: "8px" }
			}), "Agregar al Carrito"]
		}), /* @__PURE__ */ jsxs("button", {
			className: "primary-btn-sm",
			style: {
				flex: 1,
				padding: "10px 14px",
				fontSize: "13px"
			},
			onClick: () => {
				addToCart(producto, qty);
				window.location.href = "/carrito";
			},
			children: [/* @__PURE__ */ jsx("i", {
				className: "fa-solid fa-credit-card",
				style: { marginRight: "6px" }
			}), "Comprar Ahora"]
		})]
	})] });
}
//#endregion
//#region src/pages/producto/[id].astro
var _id__exports = /* @__PURE__ */ __exportAll({
	default: () => $$Id,
	file: () => $$file,
	url: () => $$url
});
createAstro("https://astro.build");
var $$Id = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Id;
	const { id } = Astro.params;
	const categorias = await getCategorias();
	const producto = categorias.flatMap((c) => c.productos ?? []).find((p) => String(p.id) === String(id));
	if (!producto) return Astro.redirect("/");
	return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {
		"title": `${producto.nombre} — Peluches Crochet`,
		"categorias": categorias
	}, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<div class="main-container"><main class="content"><a href="/" class="back-button" style="text-decoration: none;"><i class="fa-solid fa-arrow-left" style="margin-right: 6px;"></i>Volver al catálogo</a><div class="detail-container"><img${addAttribute(producto.imagen || "https://via.placeholder.com/280", "src")}${addAttribute(producto.nombre, "alt")} class="detail-image"><div class="detail-body"><h2 style="margin: 0 0 10px 0; font-size: 26px; color: #0f172a;">${producto.nombre}</h2><p style="color: #64748b; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">${producto.descripcion}</p><div class="product-stock" style="font-size: 14px; margin-bottom: 16px;">Stock disponible: <span>${producto.stock ?? 10} piezas</span></div><div class="product-price" style="font-size: 28px; margin-bottom: 20px;">$${producto.precio} MXN</div>${renderComponent($$result, "ProductActionsIsland", ProductActionsIsland, {
		"client:visible": true,
		"producto": producto,
		"client:component-hydration": "visible",
		"client:component-path": "/home/erick/Documents/Practica 6/front/src/components/islands/ProductActionsIsland.jsx",
		"client:component-export": "default"
	})}</div></div></main></div>` })}`;
}, "/home/erick/Documents/Practica 6/front/src/pages/producto/[id].astro", void 0);
var $$file = "/home/erick/Documents/Practica 6/front/src/pages/producto/[id].astro";
var $$url = "/producto/[id]";
//#endregion
//#region \0virtual:astro:page:src/pages/producto/[id]@_@astro
var page = () => _id__exports;
//#endregion
export { page };
