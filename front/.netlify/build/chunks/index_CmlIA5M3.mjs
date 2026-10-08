import { n as __exportAll, t as createComponent } from "./compiler_DP-tUfSz.mjs";
import { i as renderComponent, u as renderTemplate } from "./server_Ms_2HFn4.mjs";
import { n as $$Layout, r as useUiStore, t as getCategorias } from "./data_frC-8TVq.mjs";
import { t as useCartStore } from "./useCartStore_DwvtQDv2.mjs";
import { useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
//#region src/components/ContextPanel.jsx
function ContextPanel({ cart, getTotal, onGoCart }) {
	if (cart.length === 0) return /* @__PURE__ */ jsx("div", {
		className: "context-panel",
		children: /* @__PURE__ */ jsx("p", { children: "🧸 Aún no agregas nada a tu carrito. ¡Explora el catálogo!" })
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "context-panel",
		onClick: onGoCart,
		style: { cursor: "pointer" },
		role: "button",
		tabIndex: 0,
		onKeyDown: (e) => {
			if (e.key === "Enter" || e.key === " ") onGoCart();
		},
		children: [/* @__PURE__ */ jsxs("p", { children: [
			/* @__PURE__ */ jsx("strong", { children: cart.length }),
			" producto(s) en tu carrito — Total:",
			" ",
			/* @__PURE__ */ jsxs("strong", { children: [
				"$",
				getTotal(),
				" MXN"
			] })
		] }), /* @__PURE__ */ jsx("span", {
			className: "context-cta",
			children: "Ver carrito →"
		})]
	});
}
//#endregion
//#region src/components/ProductCard.jsx
function ProductCard({ producto, qty, availableStock, onView, onAdd }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "product-card",
		style: { cursor: "pointer" },
		onClick: () => onView(producto),
		children: [/* @__PURE__ */ jsx("img", {
			src: producto.imagen || "https://via.placeholder.com/250",
			alt: producto.nombre,
			className: "product-image"
		}), /* @__PURE__ */ jsxs("div", {
			className: "product-info",
			children: [/* @__PURE__ */ jsxs("div", { children: [
				/* @__PURE__ */ jsx("h4", {
					className: "product-name",
					children: producto.nombre
				}),
				/* @__PURE__ */ jsx("p", {
					className: "product-desc",
					children: producto.descripcion
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "product-stock",
					children: ["Stock: ", /* @__PURE__ */ jsxs("span", { children: [availableStock, " uds"] })]
				})
			] }), /* @__PURE__ */ jsxs("div", {
				className: "product-footer-col",
				onClick: (e) => e.stopPropagation(),
				children: [/* @__PURE__ */ jsxs("span", {
					className: "product-price",
					children: [
						"$",
						producto.precio,
						" MXN"
					]
				}), /* @__PURE__ */ jsxs("div", {
					className: "card-actions",
					children: [/* @__PURE__ */ jsx("button", {
						className: "action-btn",
						onClick: () => onView(producto),
						children: /* @__PURE__ */ jsx("i", { className: "fa-solid fa-eye" })
					}), /* @__PURE__ */ jsxs("button", {
						className: "primary-btn-sm",
						onClick: () => onAdd(producto, qty),
						disabled: availableStock === 0,
						children: [/* @__PURE__ */ jsx("i", { className: "fa-solid fa-cart-plus" }), " Agregar"]
					})]
				})]
			})]
		})]
	});
}
//#endregion
//#region src/components/Sidebar.jsx
function Sidebar({ filters, onFilterChange, onResetFilters }) {
	return /* @__PURE__ */ jsxs("aside", {
		className: "sidebar",
		children: [
			/* @__PURE__ */ jsxs("h3", {
				className: "sidebar-title",
				children: [/* @__PURE__ */ jsx("i", {
					className: "fa-solid fa-sliders",
					style: { marginRight: "8px" }
				}), "Filtros"]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "filter-group",
				children: [/* @__PURE__ */ jsx("h4", {
					className: "filter-subtitle",
					children: "Ordenar por"
				}), [
					{
						value: "default",
						label: "Destacados"
					},
					{
						value: "precio-asc",
						label: "Precio: menor a mayor"
					},
					{
						value: "precio-desc",
						label: "Precio: mayor a menor"
					},
					{
						value: "nombre-asc",
						label: "Nombre: A → Z"
					},
					{
						value: "nombre-desc",
						label: "Nombre: Z → A"
					}
				].map((opt) => /* @__PURE__ */ jsxs("label", {
					className: "sort-option",
					children: [/* @__PURE__ */ jsx("input", {
						type: "radio",
						name: "sortBy",
						checked: filters.sortBy === opt.value,
						onChange: () => onFilterChange("sortBy", opt.value)
					}), opt.label]
				}, opt.value))]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "filter-group",
				children: [/* @__PURE__ */ jsx("h4", {
					className: "filter-subtitle",
					children: "Precio (MXN)"
				}), /* @__PURE__ */ jsxs("div", {
					className: "price-inputs",
					children: [
						/* @__PURE__ */ jsx("input", {
							type: "number",
							placeholder: "Mín",
							min: "0",
							value: filters.precioMin,
							onChange: (e) => onFilterChange("precioMin", e.target.value)
						}),
						/* @__PURE__ */ jsx("span", {
							className: "price-sep",
							children: "–"
						}),
						/* @__PURE__ */ jsx("input", {
							type: "number",
							placeholder: "Máx",
							min: "0",
							value: filters.precioMax,
							onChange: (e) => onFilterChange("precioMax", e.target.value)
						})
					]
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "filter-group",
				children: [/* @__PURE__ */ jsx("h4", {
					className: "filter-subtitle",
					children: "Disponibilidad"
				}), /* @__PURE__ */ jsxs("label", {
					className: "filter-check",
					children: [/* @__PURE__ */ jsx("input", {
						type: "checkbox",
						checked: filters.onlyAvailable,
						onChange: (e) => onFilterChange("onlyAvailable", e.target.checked)
					}), "Solo productos con stock"]
				})]
			}),
			/* @__PURE__ */ jsxs("button", {
				className: "filter-reset-btn",
				onClick: onResetFilters,
				children: [/* @__PURE__ */ jsx("i", {
					className: "fa-solid fa-rotate-left",
					style: { marginRight: "8px" }
				}), "Limpiar filtros"]
			})
		]
	});
}
//#endregion
//#region src/utils/filters.js
var DEFAULT_FILTERS = {
	precioMin: "",
	precioMax: "",
	sortBy: "default",
	onlyAvailable: false
};
function filtrarProductos(productos, { searchTerm, filters }) {
	let result = [...productos];
	if (searchTerm) {
		const term = searchTerm.toLowerCase();
		result = result.filter((p) => p.nombre.toLowerCase().includes(term));
	}
	const min = parseFloat(filters.precioMin);
	const max = parseFloat(filters.precioMax);
	if (!isNaN(min)) result = result.filter((p) => parseFloat(p.precio) >= min);
	if (!isNaN(max)) result = result.filter((p) => parseFloat(p.precio) <= max);
	if (filters.onlyAvailable) result = result.filter((p) => (p.stock ?? 0) > 0);
	switch (filters.sortBy) {
		case "precio-asc":
			result.sort((a, b) => a.precio - b.precio);
			break;
		case "precio-desc":
			result.sort((a, b) => b.precio - a.precio);
			break;
		case "nombre-asc":
			result.sort((a, b) => a.nombre.localeCompare(b.nombre));
			break;
		case "nombre-desc": result.sort((a, b) => b.nombre.localeCompare(a.nombre));
	}
	return result;
}
//#endregion
//#region src/components/islands/CatalogoIsland.jsx
function CatalogoIsland({ categorias }) {
	const { cart, getTotal, addToCart } = useCartStore();
	const { searchTerm, setSearchTerm, selectedCategoria } = useUiStore();
	const [filters, setFilters] = useState(DEFAULT_FILTERS);
	const handleFilterChange = (name, value) => setFilters((prev) => ({
		...prev,
		[name]: value
	}));
	const handleResetFilters = () => setFilters(DEFAULT_FILTERS);
	const filteredProductos = filtrarProductos(selectedCategoria === "TODAS" ? categorias.flatMap((c) => c.productos || []) : categorias.find((c) => String(c.id) === String(selectedCategoria))?.productos || [], {
		searchTerm,
		filters
	});
	const tituloCatalogo = selectedCategoria === "TODAS" ? "Catálogo Completo" : categorias.find((c) => String(c.id) === String(selectedCategoria))?.nombre || "Categoría";
	return /* @__PURE__ */ jsxs("div", {
		className: "main-container",
		children: [/* @__PURE__ */ jsx(Sidebar, {
			filters,
			onFilterChange: handleFilterChange,
			onResetFilters: handleResetFilters
		}), /* @__PURE__ */ jsxs("main", {
			className: "content",
			children: [
				/* @__PURE__ */ jsx("div", {
					className: "ml-promo-banner-container",
					children: /* @__PURE__ */ jsx("img", {
						src: "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=1200&q=80",
						alt: "Banner Promocional",
						className: "ml-promo-banner-img"
					})
				}),
				/* @__PURE__ */ jsx(ContextPanel, {
					cart,
					getTotal,
					onGoCart: () => window.location.href = "/carrito"
				}),
				/* @__PURE__ */ jsxs("h3", {
					className: "section-title",
					children: [/* @__PURE__ */ jsx("i", {
						className: "fa-solid fa-store",
						style: { marginRight: "8px" }
					}), tituloCatalogo]
				}),
				filteredProductos.length === 0 ? /* @__PURE__ */ jsxs("div", {
					className: "empty-cart",
					children: [
						/* @__PURE__ */ jsx("i", {
							className: "fa-solid fa-magnifying-glass",
							style: {
								fontSize: "32px",
								display: "block",
								marginBottom: "12px"
							}
						}),
						"No se encontraron productos ",
						searchTerm && /* @__PURE__ */ jsxs(Fragment$1, { children: [
							" para \"",
							searchTerm,
							"\""
						] }),
						".",
						/* @__PURE__ */ jsxs("div", {
							style: {
								marginTop: "16px",
								display: "flex",
								gap: "8px",
								justifyContent: "center"
							},
							children: [/* @__PURE__ */ jsx("button", {
								className: "primary-btn-sm",
								onClick: handleResetFilters,
								children: "Limpiar filtros"
							}), searchTerm && /* @__PURE__ */ jsx("button", {
								className: "primary-btn-sm",
								onClick: () => setSearchTerm(""),
								children: "Limpiar búsqueda"
							})]
						})
					]
				}) : /* @__PURE__ */ jsx("div", {
					className: "grid-productos",
					children: filteredProductos.map((prod) => /* @__PURE__ */ jsx(ProductCard, {
						producto: prod,
						qty: 1,
						availableStock: prod.stock ?? 10,
						onView: (p) => window.location.href = `/producto/${p.id}`,
						onAdd: addToCart
					}, prod.id))
				})
			]
		})]
	});
}
//#endregion
//#region src/pages/index.astro
var pages_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Index,
	file: () => $$file,
	url: () => ""
});
var $$Index = createComponent(async ($$result, $$props, $$slots) => {
	const categorias = await getCategorias();
	return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {
		"title": "Peluches Crochet — Inicio",
		"categorias": categorias
	}, { "default": ($$result) => renderTemplate`${renderComponent($$result, "CatalogoIsland", CatalogoIsland, {
		"client:load": true,
		"categorias": categorias,
		"client:component-hydration": "load",
		"client:component-path": "/home/erick/Documents/Practica 6/front/src/components/islands/CatalogoIsland.jsx",
		"client:component-export": "default"
	})}` })}`;
}, "/home/erick/Documents/Practica 6/front/src/pages/index.astro", void 0);
var $$file = "/home/erick/Documents/Practica 6/front/src/pages/index.astro";
//#endregion
//#region \0virtual:astro:page:src/pages/index@_@astro
var page = () => pages_exports;
//#endregion
export { page };
