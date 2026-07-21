/**
 * theme.js
 * Gerencia tema claro/escuro.
 * Aplica atributo data-theme no <html>.
 * Salva preferência no localStorage.
 * Expõe objeto global Theme.
 */
const Theme = (() => {
  const THEME_KEY = 'sudoku_theme';

  // Carrega tema salvo ou preferência do sistema
  function load() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
    // Se não houver preferência salva, usa preferência do sistema
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  // Aplica o tema ao documento
  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  // Inicializa o tema (chamar uma vez ao carregar a página)
  function init() {
    const theme = load();
    apply(theme);
  }

  // Alterna entre claro e escuro
  function toggle() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    apply(next);
    localStorage.setItem(THEME_KEY, next);
    return next;
  }

  // Retorna o tema atual
  function get() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  }

  // API pública
  return {
    init,
    toggle,
    get
  };
})();