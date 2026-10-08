import { n as __exportAll, t as createComponent } from "./compiler_DP-tUfSz.mjs";
import { i as renderComponent, u as renderTemplate } from "./server_Ms_2HFn4.mjs";
import { n as $$Layout, t as getCategorias } from "./data_frC-8TVq.mjs";
import { t as useCartStore } from "./useCartStore_DwvtQDv2.mjs";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/islands/CartIsland.jsx
function CartIsland() {
	const { cart, getTotal, removeFromCart } = useCartStore();
	return /* @__PURE__ */ jsx("div", {
		className: "main-container",
		children: /* @__PURE__ */ jsx("main", {
			className: "content",
			children: /* @__PURE__ */ jsxs("div", {
				style: {
					maxWidth: "650px",
					margin: "0 auto"
				},
				children: [
					/* @__PURE__ */ jsxs("a", {
						href: "/",
						className: "back-button",
						style: { textDecoration: "none" },
						children: [/* @__PURE__ */ jsx("i", {
							className: "fa-solid fa-arrow-left",
							style: { marginRight: "6px" }
						}), "Volver al catálogo"]
					}),
					/* @__PURE__ */ jsxs("h3", {
						className: "section-title",
						children: [/* @__PURE__ */ jsx("i", {
							className: "fa-solid fa-basket-shopping",
							style: { marginRight: "8px" }
						}), "Tu Carrito"]
					}),
					cart.length === 0 ? /* @__PURE__ */ jsxs("div", {
						className: "empty-cart",
						children: [/* @__PURE__ */ jsx("i", {
							className: "fa-solid fa-cart-flatbed",
							style: {
								fontSize: "32px",
								display: "block",
								marginBottom: "12px"
							}
						}), "El carrito está vacío."]
					}) : /* @__PURE__ */ jsxs("div", {
						className: "cart-box",
						children: [
							cart.map((item) => /* @__PURE__ */ jsxs("div", {
								className: "cart-row",
								children: [/* @__PURE__ */ jsxs("div", {
									style: {
										minWidth: 0,
										flex: 1
									},
									children: [/* @__PURE__ */ jsx("strong", {
										style: { color: "#0f172a" },
										children: item.producto.nombre
									}), /* @__PURE__ */ jsxs("div", {
										style: {
											color: "#64748b",
											fontSize: "13px"
										},
										children: ["Cantidad: ", item.cantidad]
									})]
								}), /* @__PURE__ */ jsxs("div", {
									style: {
										display: "flex",
										alignItems: "center",
										gap: "10px",
										flexShrink: 0
									},
									children: [/* @__PURE__ */ jsxs("span", {
										className: "product-price",
										style: {
											fontSize: "16px",
											whiteSpace: "nowrap"
										},
										children: [
											"$",
											item.producto.precio * item.cantidad,
											" MXN"
										]
									}), /* @__PURE__ */ jsx("button", {
										className: "cart-remove-btn",
										title: "Quitar del carrito",
										onClick: () => removeFromCart(item.producto.id),
										children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-trash-can" })
									})]
								})]
							}, item.producto.id)),
							/* @__PURE__ */ jsxs("div", {
								className: "cart-total-row",
								children: [/* @__PURE__ */ jsx("span", { children: "Total Estimado:" }), /* @__PURE__ */ jsxs("span", {
									style: { fontSize: "22px" },
									children: [
										"$",
										getTotal(),
										" MXN"
									]
								})]
							}),
							/* @__PURE__ */ jsxs("a", {
								href: "/checkout",
								className: "primary-btn",
								style: {
									display: "inline-flex",
									alignItems: "center",
									justifyContent: "center",
									textDecoration: "none"
								},
								children: [/* @__PURE__ */ jsx("i", {
									className: "fa-solid fa-credit-card",
									style: { marginRight: "8px" }
								}), "Continuar al Checkout"]
							})
						]
					})
				]
			})
		})
	});
}
//#endregion
//#region src/pages/carrito.astro
var carrito_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Carrito,
	file: () => $$file,
	url: () => $$url
});
var $$Carrito = createComponent(async ($$result, $$props, $$slots) => {
	const categorias = await getCategorias();
	return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {
		"title": "Tu Carrito — Peluches Crochet",
		"categorias": categorias
	}, { "default": ($$result) => renderTemplate`${renderComponent($$result, "CartIsland", CartIsland, {
		"client:load": true,
		"client:component-hydration": "load",
		"client:component-path": "/home/erick/Documents/Practica 6/front/src/components/islands/CartIsland.jsx",
		"client:component-export": "default"
	})}` })}`;
}, "/home/erick/Documents/Practica 6/front/src/pages/carrito.astro", void 0);
var $$file = "/home/erick/Documents/Practica 6/front/src/pages/carrito.astro";
var $$url = "/carrito";
//#endregion
//#region \0virtual:astro:page:src/pages/carrito@_@astro
var page = () => carrito_exports;
//#endregion
export { page };
