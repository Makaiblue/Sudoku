/**
 * board.js
 * Renderização do tabuleiro, interação com células, highlights visuais,
 * teclado numérico e feedback de erro/acerto.
 * Expõe objeto global Board.
 */
const Board = (() => {
  // Elementos DOM principais
  let boardEl = null;
  let keypadEl = null;
  let cells = [];          // matriz 9x9 de elementos <div>
  let selectedRow = -1;
  let selectedCol = -1;

  // Callbacks definidos pelo App
  let onCellClick = null;    // (row, col) => void
  let onNumberInput = null;  // (num) => void (1-9) ou 0 para apagar

  // Referência ao estado inicial (quais células são fixas)
  let givenMask = [];        // boolean[][]

  /**
   * Cria o grid 9x9 dentro do elemento boardEl.
   */
  function createGrid() {
    cells = [];
    boardEl.innerHTML = '';

    for (let r = 0; r < 9; r++) {
      cells[r] = [];
      for (let c = 0; c < 9; c++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.row = r;
        cell.dataset.col = c;

        cell.addEventListener('click', () => handleCellClick(r, c));

        boardEl.appendChild(cell);
        cells[r][c] = cell;
      }
    }
  }

  /**
   * Cria os botões do teclado numérico dentro de keypadEl.
   */
  function createKeypad() {
    keypadEl.innerHTML = '';

    for (let i = 1; i <= 9; i++) {
      const btn = document.createElement('button');
      btn.classList.add('keypad-btn');
      btn.textContent = i;
      btn.dataset.num = i;
      btn.addEventListener('click', () => {
        if (onNumberInput) onNumberInput(i);
      });
      keypadEl.appendChild(btn);
    }

    // Botão de apagar
    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('keypad-btn', 'delete');
    deleteBtn.textContent = '⌫';
    deleteBtn.addEventListener('click', () => {
      if (onNumberInput) onNumberInput(0);
    });
    keypadEl.appendChild(deleteBtn);
  }

  /**
   * Manipulador de clique na célula.
   */
  function handleCellClick(row, col) {
    selectCell(row, col);
    if (onCellClick) onCellClick(row, col);
  }

  /**
   * Seleciona visualmente uma célula e aplica highlights.
   */
  function selectCell(row, col) {
    clearHighlights();
    selectedRow = row;
    selectedCol = col;

    if (row === -1 || col === -1) return;

    const selectedCell = cells[row][col];
    selectedCell.classList.add('selected');

    // Destaca linha, coluna e bloco
    const blockRow = Math.floor(row / 3) * 3;
    const blockCol = Math.floor(col / 3) * 3;
    const selectedNum = getCellValue(row, col);

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = cells[r][c];
        if (r === row) cell.classList.add('same-row');
        if (c === col) cell.classList.add('same-col');
        if (r >= blockRow && r < blockRow + 3 && c >= blockCol && c < blockCol + 3) {
          cell.classList.add('same-block');
        }
        // Destaca números iguais
        if (selectedNum !== 0 && getCellValue(r, c) === selectedNum) {
          cell.classList.add('same-number');
        }
      }
    }
  }

  /**
   * Remove todas as classes de highlight.
   */
  function clearHighlights() {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = cells[r][c];
        cell.classList.remove(
          'selected',
          'same-row',
          'same-col',
          'same-block',
          'same-number'
        );
      }
    }
  }

  /**
   * Renderiza o tabuleiro com os valores fornecidos.
   * @param {number[][]} puzzle - tabuleiro inicial (0 = vazio)
   */
  function render(puzzle) {
    givenMask = puzzle.map(row => row.map(val => val !== 0));

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const val = puzzle[r][c];
        const cell = cells[r][c];

        // Limpa classes anteriores
        cell.className = 'cell';
        cell.textContent = val !== 0 ? val : '';

        if (val !== 0) {
          cell.classList.add('given');
        } else {
          cell.classList.add('user');
        }
      }
    }

    selectedRow = -1;
    selectedCol = -1;
    clearHighlights();
  }

  /**
   * Atualiza o valor de uma célula no DOM.
   * @param {number} row
   * @param {number} col
   * @param {number} value - 0 para limpar
   */
  function setCellValue(row, col, value) {
    const cell = cells[row][col];
    if (givenMask[row][col]) return; // não permite alterar células fixas

    cell.textContent = value !== 0 ? value : '';
    cell.classList.remove('given');
    if (value !== 0) {
      cell.classList.add('user');
    }
  }

  /**
   * Retorna o valor numérico de uma célula (0 se vazia).
   */
  function getCellValue(row, col) {
    const text = cells[row][col].textContent.trim();
    return text === '' ? 0 : parseInt(text, 10);
  }

  /**
   * Anima erro na célula selecionada.
   */
  function animateError(row, col) {
    const cell = cells[row][col];
    cell.classList.add('error');
    cell.addEventListener('animationend', () => {
      cell.classList.remove('error');
    }, { once: true });
  }

  /**
   * Anima acerto na célula selecionada.
   */
  function animateCorrect(row, col) {
    const cell = cells[row][col];
    cell.classList.add('correct');
    cell.addEventListener('animationend', () => {
      cell.classList.remove('correct');
    }, { once: true });
  }

  /**
   * Remove destaque da seleção atual.
   */
  function clearSelection() {
    selectedRow = -1;
    selectedCol = -1;
    clearHighlights();
  }

  /**
   * Inicializa o módulo.
   * @param {string} boardSelector - seletor CSS do elemento do tabuleiro
   * @param {string} keypadSelector - seletor CSS do elemento do teclado
   * @param {Function} cellClickCallback - (row, col) => void
   * @param {Function} numberInputCallback - (num) => void
   */
  function init(boardSelector, keypadSelector, cellClickCallback, numberInputCallback) {
    boardEl = document.querySelector(boardSelector);
    keypadEl = document.querySelector(keypadSelector);

    if (!boardEl || !keypadEl) {
      console.error('Board: elementos não encontrados no DOM');
      return;
    }

    onCellClick = cellClickCallback;
    onNumberInput = numberInputCallback;

    createGrid();
    createKeypad();
  }

  /**
   * Retorna se a célula faz parte do tabuleiro inicial (fixa).
   */
  function isGiven(row, col) {
    return givenMask[row]?.[col] === true;
  }

  /**
   * Coleta o estado atual do tabuleiro como matriz 9x9.
   */
  function getCurrentBoard() {
    const board = [];
    for (let r = 0; r < 9; r++) {
      board[r] = [];
      for (let c = 0; c < 9; c++) {
        board[r][c] = getCellValue(r, c);
      }
    }
    return board;
  }

  // API pública
  return {
    init,
    render,
    setCellValue,
    getCellValue,
    selectCell,
    clearSelection,
    animateError,
    animateCorrect,
    isGiven,
    getCurrentBoard
  };
})();