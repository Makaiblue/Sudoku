/**
 * sudoku.js
 * Lógica pura do Sudoku: geração, validação, resolução, verificação.
 * Não manipula DOM. Expõe objeto global Sudoku.
 */
const Sudoku = (() => {
  /**
   * Embaralha array in-place (Fisher-Yates).
   * @param {Array} arr
   * @returns {Array} mesmo array embaralhado
   */
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Cria tabuleiro 9x9 vazio (preenchido com zeros).
   * @returns {number[][]}
   */
  function emptyBoard() {
    return Array.from({ length: 9 }, () => Array(9).fill(0));
  }

  /**
   * Cópia profunda de tabuleiro 9x9.
   * @param {number[][]} board
   * @returns {number[][]}
   */
  function cloneBoard(board) {
    return board.map(row => [...row]);
  }

  /**
   * Verifica se um número pode ser colocado na posição (row, col).
   * @param {number[][]} board
   * @param {number} row
   * @param {number} col
   * @param {number} num
   * @returns {boolean}
   */
  function isValid(board, row, col, num) {
    // Verifica linha e coluna
    for (let i = 0; i < 9; i++) {
      if (board[row][i] === num) return false;
      if (board[i][col] === num) return false;
    }

    // Verifica bloco 3x3
    const blockRow = Math.floor(row / 3) * 3;
    const blockCol = Math.floor(col / 3) * 3;
    for (let r = blockRow; r < blockRow + 3; r++) {
      for (let c = blockCol; c < blockCol + 3; c++) {
        if (board[r][c] === num) return false;
      }
    }

    return true;
  }

  /**
   * Preenche o tabuleiro completo usando backtracking.
   * @param {number[][]} board - tabuleiro a ser preenchido (modificado in-place)
   * @returns {boolean} true se conseguiu preencher
   */
  function fillBoard(board) {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) {
          const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
          for (const num of numbers) {
            if (isValid(board, row, col, num)) {
              board[row][col] = num;
              if (fillBoard(board)) return true;
              board[row][col] = 0; // backtrack
            }
          }
          return false; // nenhum número válido
        }
      }
    }
    return true; // completamente preenchido
  }

  /**
   * Conta soluções de um tabuleiro parcial. Para ao encontrar 2.
   * @param {number[][]} board - tabuleiro parcial (será modificado)
   * @param {number} limit - máximo de soluções a contar (padrão 2)
   * @returns {number} número de soluções encontradas (0, 1 ou limit)
   */
  function countSolutions(board, limit = 2) {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) {
          let count = 0;
          for (let num = 1; num <= 9; num++) {
            if (isValid(board, row, col, num)) {
              board[row][col] = num;
              count += countSolutions(board, limit);
              board[row][col] = 0;
              if (count >= limit) return count; // poda
            }
          }
          return count;
        }
      }
    }
    return 1; // tabuleiro completo = 1 solução
  }

  /**
   * Gera tabuleiro completo válido.
   * @returns {number[][]} tabuleiro 9x9 completo
   */
  function generateComplete() {
    const board = emptyBoard();
    fillBoard(board);
    return board;
  }

  /**
   * Remove células do tabuleiro garantindo solução única.
   * @param {number[][]} complete - tabuleiro completo (gabarito)
   * @param {number} cellsToRemove - quantas células remover
   * @returns {number[][]} tabuleiro com lacunas (0 = vazio)
   */
  function removeCells(complete, cellsToRemove) {
    const puzzle = cloneBoard(complete);
    const positions = [];

    // Lista todas as posições
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        positions.push({ row: r, col: c });
      }
    }
    shuffle(positions);

    let removed = 0;
    for (const pos of positions) {
      if (removed >= cellsToRemove) break;

      const { row, col } = pos;
      const backup = puzzle[row][col];
      puzzle[row][col] = 0;

      // Verifica unicidade
      const testBoard = cloneBoard(puzzle);
      if (countSolutions(testBoard, 2) !== 1) {
        // Não é única, restaura
        puzzle[row][col] = backup;
      } else {
        removed++;
      }
    }

    return puzzle;
  }

  /**
   * Gera um novo jogo completo.
   * @param {string} difficulty - 'easy', 'medium' ou 'hard'
   * @returns {{ puzzle: number[][], solution: number[][] }}
   */
  function generate(difficulty) {
    const solution = generateComplete();

    let visible;
    switch (difficulty) {
      case 'easy':
        visible = randomInt(40, 45);
        break;
      case 'medium':
        visible = randomInt(32, 38);
        break;
      case 'hard':
        visible = randomInt(26, 31);
        break;
      default:
        visible = 40;
    }

    const cellsToRemove = 81 - visible;
    const puzzle = removeCells(solution, cellsToRemove);

    return { puzzle, solution };
  }

  /**
   * Número inteiro aleatório entre min e max (inclusivo).
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Verifica se o tabuleiro está completamente preenchido e correto.
   * @param {number[][]} board
   * @returns {boolean}
   */
  function checkComplete(board) {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0) return false;
      }
    }
    // Verifica validade completa
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const num = board[r][c];
        board[r][c] = 0; // remove temporariamente para testar isValid
        if (!isValid(board, r, c, num)) {
          board[r][c] = num;
          return false;
        }
        board[r][c] = num;
      }
    }
    return true;
  }

  /**
   * Resolve um tabuleiro (retorna solução ou null).
   * @param {number[][]} board
   * @returns {number[][]|null}
   */
  function solve(board) {
    const copy = cloneBoard(board);
    if (fillBoard(copy)) {
      return copy;
    }
    return null;
  }

  // API pública
  return {
    generate,
    isValid,
    checkComplete,
    solve
  };
})();