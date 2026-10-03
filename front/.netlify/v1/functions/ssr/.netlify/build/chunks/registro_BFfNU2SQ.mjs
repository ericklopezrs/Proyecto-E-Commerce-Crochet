import { n as __exportAll, t as createComponent } from "./compiler_DP-tUfSz.mjs";
import { i as renderComponent, u as renderTemplate } from "./server_Ms_2HFn4.mjs";
import { i as registrarUsuario } from "./auth_Bkti9BtQ.mjs";
import { t as $$LoginLayout } from "./login_CpQNOOnU.mjs";
import { useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail, User, UserPlus } from "lucide-react";
//#region src/components/islands/RegistroIsland.jsx
function RegistroIsland() {
	const [nombre, setNombre] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!nombre.trim() || !email.trim() || !password || !confirm) {
			setError("Completa todos los campos.");
			return;
		}
		if (!email.includes("@")) {
			setError("Escribe un correo válido.");
			return;
		}
		if (password.length < 6) {
			setError("La contraseña debe tener al menos 6 caracteres.");
			return;
		}
		if (password !== confirm) {
			setError("Las contraseñas no coinciden.");
			return;
		}
		setError("");
		setLoading(true);
		try {
			await registrarUsuario(nombre, email, password);
			alert("¡Cuenta creada! Ahora inicia sesión 🧸");
			window.location.href = "/login";
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
									children: /* @__PURE__ */ jsx(UserPlus, { size: 22 })
								}),
								/* @__PURE__ */ jsx("h2", {
									className: "login-title",
									children: "Crear Cuenta"
								}),
								/* @__PURE__ */ jsx("p", {
									className: "login-subtitle",
									children: "Únete a nuestra familia"
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
										htmlFor: "nombre",
										children: "Nombre"
									}), /* @__PURE__ */ jsxs("div", {
										className: "login-input-wrapper",
										children: [/* @__PURE__ */ jsx("span", {
											className: "login-input-icon",
											children: /* @__PURE__ */ jsx(User, { size: 16 })
										}), /* @__PURE__ */ jsx("input", {
											id: "nombre",
											type: "text",
											className: "login-input",
											placeholder: "Tu nombre",
											value: nombre,
											onChange: (e) => setNombre(e.target.value)
										})]
									})]
								}),
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
												placeholder: "Mínimo 6 caracteres",
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
								/* @__PURE__ */ jsxs("div", {
									className: "login-field",
									children: [/* @__PURE__ */ jsx("label", {
										className: "login-label",
										htmlFor: "confirm",
										children: "Confirmar contraseña"
									}), /* @__PURE__ */ jsxs("div", {
										className: "login-input-wrapper",
										children: [
											/* @__PURE__ */ jsx("span", {
												className: "login-input-icon",
												children: /* @__PURE__ */ jsx(Lock, { size: 16 })
											}),
											/* @__PURE__ */ jsx("input", {
												id: "confirm",
												type: showPassword ? "text" : "password",
												className: "login-input with-toggle",
												placeholder: "Repite la contraseña",
												value: confirm,
												onChange: (e) => setConfirm(e.target.value)
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
									}), "Creando cuenta..."] }) : /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(UserPlus, { size: 16 }), "Crear Cuenta"] })
								})
							]
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "login-footer",
							children: ["¿Ya tienes cuenta? ", /* @__PURE__ */ jsx("a", {
								href: "/login",
								children: "Inicia sesión"
							})]
						})
					]
				})
			})
		})
	});
}
//#endregion
//#region src/pages/registro.astro
var registro_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Registro,
	file: () => $$file,
	url: () => $$url
});
var $$Registro = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "LoginLayout", $$LoginLayout, { "title": "Crear Cuenta — Peluches Crochet" }, { "default": ($$result) => renderTemplate`${renderComponent($$result, "RegistroIsland", RegistroIsland, {
		"client:load": true,
		"client:component-hydration": "load",
		"client:component-path": "/home/erick/Documents/Practica 6/front/src/components/islands/RegistroIsland.jsx",
		"client:component-export": "default"
	})}` })}`;
}, "/home/erick/Documents/Practica 6/front/src/pages/registro.astro", void 0);
var $$file = "/home/erick/Documents/Practica 6/front/src/pages/registro.astro";
var $$url = "/registro";
//#endregion
//#region \0virtual:astro:page:src/pages/registro@_@astro
var page = () => registro_exports;
//#endregion
export { page };
