export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <p className="footer-text">
        Peluches Crochet &copy; {currentYear} — Desarrollado por{' '}
        <a href="https://github.com/ericklopezrs" target="_blank" rel="noopener noreferrer" className="footer-link">
          <i className="fa-brands fa-github" style={{ marginRight: '4px' }}></i>
          ericklopezrs
        </a>
      </p>
    </footer>
  );
}