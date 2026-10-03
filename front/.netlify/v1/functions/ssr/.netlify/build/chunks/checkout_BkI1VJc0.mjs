import { n as __exportAll, t as createComponent } from "./compiler_DP-tUfSz.mjs";
import { i as renderComponent, u as renderTemplate } from "./server_Ms_2HFn4.mjs";
import { n as $$Layout, t as getCategorias } from "./data_frC-8TVq.mjs";
import { n as useAuthStore, t as useCartStore } from "./useCartStore_DwvtQDv2.mjs";
import { r as refrescarToken } from "./auth_Bkti9BtQ.mjs";
import { useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Lock } from "lucide-react";
//#region src/graphql/clienteAuth.js
var GRAPHQL_URL = "http://localhost:4000/graphql";
async function hacerPeticion(query, variables, token) {
	const headers = { "Content-Type": "application/json" };
	if (token) headers.Authorization = `Bearer ${token}`;
	return (await fetch(GRAPHQL_URL, {
		method: "POST",
		headers,
		body: JSON.stringify({
			query,
			variables
		})
	})).json();
}
async function fetchAuth(query, variables = {}) {
	const { access_token, refresh_token } = useAuthStore.getState();
	let { data, errors } = await hacerPeticion(query, variables, access_token);
	if (errors?.some((e) => e.message === "TOKEN_EXPIRADO") && refresh_token) try {
		const nuevos = await refrescarToken(refresh_token);
		useAuthStore.getState().setTokens(nuevos.access_token, nuevos.refresh_token);
		({data, errors} = await hacerPeticion(query, variables, nuevos.access_token));
	} catch {
		useAuthStore.getState().limpiarSesion();
		throw new Error("Tu sesión expiró. Inicia sesión de nuevo.");
	}
	if (errors) throw new Error(errors[0].message);
	return data;
}
//#endregion
//#region src/services/pedidos.js
async function registrarPedido({ usuarioId, total, items }) {
	return fetchAuth(`
    mutation Registrar(
      $usuario_id: ID!,
      $total: Float!,
      $items: [ItemPedidoInput!]!
    ) {
      registrarPedido(
        usuario_id: $usuario_id,
        total: $total,
        items: $items
      ) {
        id
        total
      }
    }
    `, {
		usuario_id: usuarioId,
		total,
		items
	});
}
//#endregion
//#region src/components/islands/CheckoutIsland.jsx
function CheckoutIsland() {
	const { cart, clearCart, getTotal } = useCartStore();
	const { access_token, usuario } = useAuthStore();
	const [saving, setSaving] = useState(false);
	if (!access_token) return /* @__PURE__ */ jsx("div", {
		className: "main-container",
		children: /* @__PURE__ */ jsx("main", {
			className: "content",
			children: /* @__PURE__ */ jsxs("div", {
				className: "empty-cart",
				style: {
					maxWidth: "480px",
					margin: "0 auto",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: "12px"
				},
				children: [
					/* @__PURE__ */ jsx(Lock, {
						size: 32,
						color: "#64748b"
					}),
					/* @__PURE__ */ jsx("p", {
						style: { margin: 0 },
						children: "Necesitas iniciar sesión para completar tu pedido."
					}),
					/* @__PURE__ */ jsx("a", {
						href: "/login",
						className: "primary-btn-sm",
						style: {
							textDecoration: "none",
							display: "inline-block"
						},
						children: "Iniciar Sesión"
					})
				]
			})
		})
	});
	const handleConfirm = async () => {
		setSaving(true);
		try {
			const items = cart.map((item) => ({
				producto_id: String(item.producto.id),
				cantidad: parseInt(item.cantidad, 10),
				precio_unitario: parseFloat(item.producto.precio)
			}));
			await registrarPedido({
				usuarioId: usuario.id,
				total: parseFloat(getTotal()),
				items
			});
			alert("¡Pedido guardado exitosamente!");
			clearCart();
			window.location.href = "/";
		} catch (err) {
			alert("Error al registrar pedido: " + err.message);
		} finally {
			setSaving(false);
		}
	};
	return /* @__PURE__ */ jsx("div", {
		className: "main-container",
		children: /* @__PURE__ */ jsx("main", {
			className: "content",
			children: /* @__PURE__ */ jsxs("div", {
				style: {
					maxWidth: "550px",
					margin: "0 auto"
				},
				children: [
					/* @__PURE__ */ jsxs("a", {
						href: "/carrito",
						className: "back-button",
						style: { textDecoration: "none" },
						children: [/* @__PURE__ */ jsx("i", {
							className: "fa-solid fa-arrow-left",
							style: { marginRight: "6px" }
						}), "Volver al carrito"]
					}),
					/* @__PURE__ */ jsxs("h3", {
						className: "section-title",
						children: [/* @__PURE__ */ jsx("i", {
							className: "fa-solid fa-clipboard-check",
							style: { marginRight: "8px" }
						}), "Confirmar Pedido"]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "cart-box",
						children: [
							/* @__PURE__ */ jsx("h4", {
								style: {
									margin: "0 0 16px 0",
									color: "#64748b"
								},
								children: "Resumen del Pedido"
							}),
							cart.map((item) => /* @__PURE__ */ jsxs("div", {
								style: {
									display: "flex",
									justifyContent: "space-between",
									marginBottom: "10px",
									fontSize: "14px"
								},
								children: [/* @__PURE__ */ jsxs("span", { children: [
									item.producto.nombre,
									" (x",
									item.cantidad,
									")"
								] }), /* @__PURE__ */ jsxs("span", {
									style: { fontWeight: "bold" },
									children: [
										"$",
										item.producto.precio * item.cantidad,
										" MXN"
									]
								})]
							}, item.producto.id)),
							/* @__PURE__ */ jsx("hr", { style: {
								border: "none",
								borderTop: "1px solid #cbd5e1",
								margin: "16px 0"
							} }),
							/* @__PURE__ */ jsxs("div", {
								className: "cart-total-row",
								style: { paddingTop: "0" },
								children: [/* @__PURE__ */ jsx("span", { children: "Total a Pagar:" }), /* @__PURE__ */ jsxs("span", {
									style: { fontSize: "22px" },
									children: [
										"$",
										getTotal(),
										" MXN"
									]
								})]
							}),
							/* @__PURE__ */ jsxs("button", {
								className: "success-btn",
								onClick: handleConfirm,
								disabled: saving,
								children: [/* @__PURE__ */ jsx("i", {
									className: "fa-solid fa-database",
									style: { marginRight: "8px" }
								}), saving ? "Guardando..." : "Confirmar y Guardar en BD"]
							})
						]
					})
				]
			})
		})
	});
}
//#endregion
//#region src/pages/checkout.astro
var checkout_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Checkout,
	file: () => $$file,
	url: () => $$url
});
var $$Checkout = createComponent(async ($$result, $$props, $$slots) => {
	const categorias = await getCategorias();
	return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {
		"title": "Checkout — Peluches Crochet",
		"categorias": categorias
	}, { "default": ($$result) => renderTemplate`${renderComponent($$result, "CheckoutIsland", CheckoutIsland, {
		"client:load": true,
		"client:component-hydration": "load",
		"client:component-path": "/home/erick/Documents/Practica 6/front/src/components/islands/CheckoutIsland.jsx",
		"client:component-export": "default"
	})}` })}`;
}, "/home/erick/Documents/Practica 6/front/src/pages/checkout.astro", void 0);
var $$file = "/home/erick/Documents/Practica 6/front/src/pages/checkout.astro";
var $$url = "/checkout";
//#endregion
//#region \0virtual:astro:page:src/pages/checkout@_@astro
var page = () => checkout_exports;
//#endregion
export { page };
