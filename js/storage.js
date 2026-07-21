/**
 * storage.js
 * Gerencia salvamento e carregamento do estado do jogo no localStorage.
 * Expõe objeto global Storage.
 */
const Storage = (() => {
  const SAVE_KEY = 'sudoku_save';

  /**
   * Salva o estado completo do jogo.
   * @param {Object} state - { puzzle, current, solution, difficulty, elapsedTime, theme }
   * @returns {boolean} true se salvou com sucesso
   */
  function save(state) {
    try {
      const serialized = JSON.stringify(state);
      localStorage.setItem(SAVE_KEY, serialized);
      return true;
    } catch (error) {
      console.warn('Falha ao salvar o jogo:', error);
      return false;
    }
  }

  /**
   * Carrega o estado salvo.
   * @returns {Object|null} estado ou null se não houver save válido
   */
  function load() {
    try {
      const serialized = localStorage.getItem(SAVE_KEY);
      if (!serialized) return null;

      const state = JSON.parse(serialized);

      // Validacao minima: propriedades essenciais
      if (!state.puzzle || !state.current || !state.solution || !state.difficulty) {
        return null;
      }

      return state;
    } catch (error) {
      console.warn('Erro ao carregar jogo salvo:', error);
      return null;
    }
  }

  /**
   * Verifica se existe um jogo salvo.
   * @returns {boolean}
   */
  function hasSave() {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  /**
   * Remove o jogo salvo.
   */
  function clear() {
    localStorage.removeItem(SAVE_KEY);
  }

  // API pública
  return {
    save,
    load,
    hasSave,
    clear
  };
})();