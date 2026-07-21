/**
 * timer.js
 * Cronômetro do jogo.
 * Conta segundos, atualiza elemento DOM a cada segundo.
 * Expõe objeto global Timer.
 */
const Timer = (() => {
  let elapsed = 0;          // segundos decorridos
  let intervalId = null;    // id do setInterval
  let display = null;       // elemento DOM onde exibir o tempo

  /**
   * Formata segundos para MM:SS.
   * @param {number} seconds
   * @returns {string}
   */
  function format(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
  }

  /**
   * Atualiza o texto do elemento de exibição.
   */
  function updateDisplay() {
    if (display) {
      display.textContent = format(elapsed);
    }
  }

  /**
   * Define o elemento DOM que mostrará o tempo.
   * @param {HTMLElement} el
   */
  function init(el) {
    display = el;
    updateDisplay();
  }

  /**
   * Inicia o cronômetro. Se já estiver rodando, ignora.
   */
  function start() {
    if (intervalId) return; // já está rodando
    intervalId = setInterval(() => {
      elapsed++;
      updateDisplay();
    }, 1000);
  }

  /**
   * Pausa o cronômetro.
   */
  function pause() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  /**
   * Zera o cronômetro e atualiza display.
   */
  function reset() {
    pause();
    elapsed = 0;
    updateDisplay();
  }

  /**
   * Retorna os segundos decorridos.
   * @returns {number}
   */
  function getElapsed() {
    return elapsed;
  }

  /**
   * Define os segundos decorridos (para restaurar save).
   * @param {number} seconds
   */
  function setElapsed(seconds) {
    elapsed = seconds;
    updateDisplay();
  }

  /**
   * Retorna o tempo formatado como MM:SS.
   * @returns {string}
   */
  function getFormatted() {
    return format(elapsed);
  }

  // API pública
  return {
    init,
    start,
    pause,
    reset,
    getElapsed,
    setElapsed,
    getFormatted
  };
})();