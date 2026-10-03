import { n as __exportAll, t as createComponent } from "./compiler_DP-tUfSz.mjs";
import { i as renderComponent, u as renderTemplate } from "./server_Ms_2HFn4.mjs";
import { n as useAuthStore, t as useCartStore } from "./useCartStore_DwvtQDv2.mjs";
import { t as hacerLogin } from "./auth_Bkti9BtQ.mjs";
import { t as $$LoginLayout } from "./login_CpQNOOnU.mjs";
import { useEffect, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { AlertCircle, Eye, EyeOff, Loader2, Lock, LogIn, Mail } from "lucide-react";
//#region src/components/islands/LoginIsland.jsx
function LoginIsland() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const setSesion = useAuthStore((s) => s.setSesion);
	const access_token = useAuthStore((s) => s.access_token);
	useEffect(() => {
		if (access_token) window.location.href = "/";
	}, [access_token]);
	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!email.trim() || !password) {
			setError("Completa todos los campos.");
			return;
		}
		if (!email.includes("@")) {
			setError("Escribe un correo válido.");
			return;
		}
		setError("");
		setLoading(true);
		try {
			const resultado = await hacerLogin(email, password);
			setSesion(resultado.access_token, resultado.refresh_token, resultado.usuario);
			await useCartStore.persist.rehydrate();
			window.location.href = "/";
		} catch (err) {
			setError(err.message);
			setLoading(false);
		}
	};
	return /* @__PURE__ */ jsx("div", {
		className: "main-container",
		children: /* @__PURE__ */ jsx("main", {
			className: "content",
			children: /* @__PURE__ */ jsx("div", {
				className: "login-page",
				children: /* @__PURE__ */ jsxs("div", {
					className: "login-card",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "login-header",
							children: [
								/* @__PURE__ */ jsx("span", {
									className: "login-title-icon",
									children: /* @__PURE__ */ jsx(LogIn, { size: 22 })
								}),
								/* @__PURE__ */ jsx("h2", {
									className: "login-title",
									children: "Inicia Sesión"
								}),
								/* @__PURE__ */ jsx("p", {
									className: "login-subtitle",
									children: "Bienvenido de vuelta"
								})
							]
						}),
						error && /* @__PURE__ */ jsxs("div", {
							className: "login-error",
							children: [/* @__PURE__ */ jsx(AlertCircle, { size: 16 }), error]
						}),
						/* @__PURE__ */ jsxs("form", {
							onSubmit: handleSubmit,
							children: [
								/* @__PURE__ */ jsxs("div", {
									className: "login-field",
									children: [/* @__PURE__ */ jsx("label", {
										className: "login-label",
										htmlFor: "email",
										children: "Correo"
									}), /* @__PURE__ */ jsxs("div", {
										className: "login-input-wrapper",
										children: [/* @__PURE__ */ jsx("span", {
											className: "login-input-icon",
											children: /* @__PURE__ */ jsx(Mail, { size: 16 })
										}), /* @__PURE__ */ jsx("input", {
											id: "email",
											type: "email",
											className: "login-input",
											placeholder: "tucorreo@ejemplo.com",
											value: email,
											onChange: (e) => setEmail(e.target.value)
										})]
									})]
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "login-field",
									children: [/* @__PURE__ */ jsx("label", {
										className: "login-label",
										htmlFor: "password",
										children: "Contraseña"
									}), /* @__PURE__ */ jsxs("div", {
										className: "login-input-wrapper",
										children: [
											/* @__PURE__ */ jsx("span", {
												className: "login-input-icon",
												children: /* @__PURE__ */ jsx(Lock, { size: 16 })
											}),
											/* @__PURE__ */ jsx("input", {
												id: "password",
												type: showPassword ? "text" : "password",
												className: "login-input with-toggle",
												placeholder: "Tu contraseña",
												value: password,
												onChange: (e) => setPassword(e.target.value)
											}),
											/* @__PURE__ */ jsx("button", {
												type: "button",
												className: "login-toggle-password",
												onClick: () => setShowPassword(!showPassword),
												"aria-label": "Mostrar contraseña",
												children: showPassword ? /* @__PURE__ */ jsx(EyeOff, { size: 16 }) : /* @__PURE__ */ jsx(Eye, { size: 16 })
											})
										]
									})]
								}),
								/* @__PURE__ */ jsx("button", {
									type: "submit",
									className: "login-submit",
									disabled: loading,
									children: loading ? /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(Loader2, {
										size: 16,
										className: "login-spinner"
									}), "Ingresando..."] }) : /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(LogIn, { size: 16 }), "Iniciar Sesión"] })
								})
							]
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "login-footer",
							children: ["¿No tienes cuenta? ", /* @__PURE__ */ jsx("a", {
								href: "/registro",
								children: "Regístrate"
							})]
						})
					]
				})
			})
		})
	});
}
//#endregion
//#region src/pages/login.astro
var login_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Login,
	file: () => $$file,
	url: () => $$url
});
var $$Login = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "LoginLayout", $$LoginLayout, { "title": "Iniciar Sesión — Peluches Crochet" }, { "default": ($$result) => renderTemplate`${renderComponent($$result, "LoginIsland", LoginIsland, {
		"client:load": true,
		"client:component-hydration": "load",
		"client:component-path": "/home/erick/Documents/Practica 6/front/src/components/islands/LoginIsland.jsx",
		"client:component-export": "default"
	})}` })}`;
}, "/home/erick/Documents/Practica 6/front/src/pages/login.astro", void 0);
var $$file = "/home/erick/Documents/Practica 6/front/src/pages/login.astro";
var $$url = "/login";
//#endregion
//#region \0virtual:astro:page:src/pages/login@_@astro
var page = () => login_exports;
//#endregion
export { page };
