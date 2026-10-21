const ENLACES = [
  { id: 'dashboard', href: '/admin', icono: 'fa-chart-line', texto: 'Gráficas' },
  { id: 'productos', href: '/admin/productos', icono: 'fa-box-open', texto: 'Productos' },
];

export default function AdminNav({ activa }) {
  return (
    <nav className="adm-nav" aria-label="Secciones de administración">
      {ENLACES.map((e) => (
        <a
          key={e.id}
          href={e.href}
          className={`adm-nav-link ${activa === e.id ? 'activo' : ''}`}
          aria-current={activa === e.id ? 'page' : undefined}
        >
          <i className={`fa-solid ${e.icono}`}></i>
          {e.texto}
        </a>
      ))}
    </nav>
  );
}