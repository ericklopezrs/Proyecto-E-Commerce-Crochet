import { useState } from 'react';
import { Lock } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore.js';
import { useAuthStore } from '../../store/useAuthStore.js';
import { registrarPedido } from '../../services/pedidos.js';

export default function CheckoutIsland() {
  const { cart, clearCart, getTotal } = useCartStore();
  const { access_token, usuario } = useAuthStore();
  const [saving, setSaving] = useState(false);

  // 🔒 EL GUARD — sin sesión, no hay checkout
  if (!access_token) {
    return (
      <div className="main-container">
        <main className="content">
          <div
            className="empty-cart"
            style={{
              maxWidth: '480px',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <Lock size={32} color="#64748b" />
            <p style={{ margin: 0 }}>Necesitas iniciar sesión para completar tu pedido.</p>
            <a
              href="/login"
              className="primary-btn-sm"
              style={{ textDecoration: 'none', display: 'inline-block' }}
            >
              Iniciar Sesión
            </a>
          </div>
        </main>
      </div>
    );
  }

  const handleConfirm = async () => {
    setSaving(true);
    try {
      const items = cart.map((item) => ({
        producto_id: String(item.producto.id),
        cantidad: parseInt(item.cantidad, 10),
        precio_unitario: parseFloat(item.producto.precio),
      }));

      await registrarPedido({
        total: parseFloat(getTotal()),
        items,
      });

      alert('¡Pedido guardado exitosamente!');
      clearCart();
      window.location.href = '/';
    } catch (err) {
      alert('Error al registrar pedido: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="main-container">
      <main className="content">
        <div style={{ maxWidth: '550px', margin: '0 auto' }}>
          <a href="/carrito" className="back-button" style={{ textDecoration: 'none' }}>
            <i className="fa-solid fa-arrow-left" style={{ marginRight: '6px' }}></i>
            Volver al carrito
          </a>

          <h3 className="section-title">
            <i className="fa-solid fa-clipboard-check" style={{ marginRight: '8px' }}></i>
            Confirmar Pedido
          </h3>

          <div className="cart-box">
            <h4 style={{ margin: '0 0 16px 0', color: '#64748b' }}>Resumen del Pedido</h4>

            {cart.map((item) => (
              <div
                key={item.producto.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                  fontSize: '14px',
                }}
              >
                <span>{item.producto.nombre} (x{item.cantidad})</span>
                <span style={{ fontWeight: 'bold' }}>
                  ${item.producto.precio * item.cantidad} MXN
                </span>
              </div>
            ))}

            <hr style={{ border: 'none', borderTop: '1px solid #cbd5e1', margin: '16px 0' }} />

            <div className="cart-total-row" style={{ paddingTop: '0' }}>
              <span>Total a Pagar:</span>
              <span style={{ fontSize: '22px' }}>${getTotal()} MXN</span>
            </div>

            <button className="success-btn" onClick={handleConfirm} disabled={saving}>
              <i className="fa-solid fa-database" style={{ marginRight: '8px' }}></i>
              {saving ? 'Guardando...' : 'Confirmar y Guardar en BD'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}