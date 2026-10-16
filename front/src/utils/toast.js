import '../styles/toast.css';

const ICONS = { success: '✓', error: '✕', warning: '!', info: 'i' };
const STORAGE_KEY = 'pending-toast';

function getContainer() {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }
  return container;
}

export function showToast(message, type = 'info', duration = 3500) {
  if (typeof document === 'undefined') return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

  const icon = document.createElement('span');
  icon.className = 'toast-icon';
  icon.textContent = ICONS[type] ?? ICONS.info;

  const text = document.createElement('span');
  text.className = 'toast-message';
  text.textContent = message;

  const close = document.createElement('button');
  close.className = 'toast-close';
  close.setAttribute('aria-label', 'Cerrar notificación');
  close.textContent = '×';

  const bar = document.createElement('div');
  bar.className = 'toast-progress';
  bar.style.animationDuration = `${duration}ms`;

  toast.append(icon, text, close, bar);
  getContainer().appendChild(toast);

  let removed = false;
  const remove = () => {
    if (removed) return;
    removed = true;
    toast.classList.add('toast-hide');
    setTimeout(() => toast.remove(), 300);
  };

  close.addEventListener('click', remove);
  setTimeout(remove, duration);
}

// Para cuando vas a redirigir justo después: el toast se muestra en la página siguiente
export function showToastAfterRedirect(message, type = 'success') {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ message, type }));
  } catch {
    /* si sessionStorage no está disponible, simplemente no se muestra */
  }
}

// Al cargar cualquier página, revisa si quedó un toast pendiente
if (typeof window !== 'undefined') {
  try {
    const pending = sessionStorage.getItem(STORAGE_KEY);
    if (pending) {
      sessionStorage.removeItem(STORAGE_KEY);
      const { message, type } = JSON.parse(pending);
      showToast(message, type);
    }
  } catch {
    /* ignorar */
  }
}