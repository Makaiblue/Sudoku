/**
 * main.js
 * Orquestrador da aplicação.
 * Conecta todos os módulos: Board, Sudoku, Timer, Storage, Theme.
 * Gerencia fluxo do jogo, eventos e estado global.
 * Expõe objeto global App.
 */
const App = (() => {
  // Estado atual do jogo
  let puzzle = null;       // tabuleiro inicial (com zeros)
  let solution = null;     // gabarito completo
  let difficulty = 'easy'; // dificuldade atual
  let gameActive = false;  // jogo em andamento

  // Elementos DOM
  let newGameBtn = null;
  let continueBtn = null;
  let hintBtn = null;
  let clearBtn = null;
  let themeBtn = null;
  let checkBtn = null;
  let timerEl = null;
  let modalOverlay = null;
  let modalContent = null;

  /**
   * Inicializa a aplicação.
   */
  function init() {
    // Inicializa tema
    Theme.init();

    // Cache de elementos DOM
    timerEl = document.getElementById('timer');
    newGameBtn = document.getElementById('btn-new-game');
    continueBtn = document.getElementById('btn-continue');
    hintBtn = document.getElementById('btn-hint');
    clearBtn = document.getElementById('btn-clear');
    themeBtn = document.getElementById('btn-theme');
    checkBtn = document.getElementById('btn-check');
    modalOverlay = document.getElementById('modal-overlay');
    modalContent = document.getElementById('modal-content');

    // Inicializa Timer
    Timer.init(timerEl);

    // Inicializa Board com callbacks
    Board.init('#board', '#keypad', onCellClick, onNumberInput);

    // Configura listeners de botões
    setupEventListeners();

    // Verifica se há jogo salvo
    if (Storage.hasSave()) {
      continueBtn.classList.remove('hidden');
    } else {
      continueBtn.classList.add('hidden');
    }

    // Tenta continuar partida automaticamente se houver save (opcional, mas não forçamos)
    // Apenas deixa o botão visível.
  }

  /**
   * Configura listeners de eventos nos botões.
   */
  function setupEventListeners() {
    newGameBtn.addEventListener('click', () => {
      if (gameActive) {
        showConfirmModal('Tem certeza? O progresso atual será perdido.', () => {
          showDifficultyModal();
        });
      } else {
        showDifficultyModal();
      }
    });

    continueBtn.addEventListener('click', () => {
      loadGame();
    });

    hintBtn.addEventListener('click', () => {
      if (!gameActive) return;
      giveHint();
    });

    clearBtn.addEventListener('click', () => {
      if (!gameActive) return;
      clearSelectedCell();
    });

    themeBtn.addEventListener('click', () => {
      Theme.toggle();
    });

    checkBtn.addEventListener('click', () => {
      if (!gameActive) return;
      if (Sudoku.checkComplete(Board.getCurrentBoard())) {
        onVictory();
      } else {
        showToast('Ainda não está completo ou há erros.');
      }
    });

    // Fecha modal ao clicar fora do conteúdo
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        hideModal();
      }
    });
  }

  /**
   * Callback: clique em célula do tabuleiro.
   */
  function onCellClick(row, col) {
    Board.selectCell(row, col);
  }

  /**
   * Callback: entrada de número pelo teclado.
   * @param {number} num - 1-9 para inserir, 0 para apagar
   */
  function onNumberInput(num) {
    if (!gameActive) return;

    const currentBoard = Board.getCurrentBoard();
    let row = -1;
    let col = -1;

    // Encontra a célula selecionada
    // (Poderia ser passado pelo Board, mas faremos via getCurrentBoard+selecionada)
    // Vamos adicionar um método em Board para retornar a seleção, mas por simplicidade
    // iteramos sobre as células do DOM e vemos qual tem 'selected'
    const cells = document.querySelectorAll('.cell');
    for (const cell of cells) {
      if (cell.classList.contains('selected')) {
        row = parseInt(cell.dataset.row);
        col = parseInt(cell.dataset.col);
        break;
      }
    }

    if (row === -1 || col === -1) return; // nenhuma célula selecionada
    if (Board.isGiven(row, col)) return; // célula fixa

    if (num === 0) {
      // Apagar
      Board.setCellValue(row, col, 0);
    } else {
      // Inserir número
      const correct = (num === solution[row][col]);
      Board.setCellValue(row, col, num);

      if (correct) {
        Board.animateCorrect(row, col);
      } else {
        Board.animateError(row, col);
      }
    }

    // Atualiza highlights (números iguais)
    Board.selectCell(row, col);

    // Salva estado automaticamente
    saveGame();

    // Verifica vitória
    if (Sudoku.checkComplete(Board.getCurrentBoard())) {
      onVictory();
    }
  }

  /**
   * Inicia um novo jogo com a dificuldade escolhida.
   * @param {string} diff - 'easy', 'medium', 'hard'
   */
  function startNewGame(diff) {
    difficulty = diff;
    const generated = Sudoku.generate(difficulty);
    puzzle = generated.puzzle;
    solution = generated.solution;

    Board.render(puzzle);
    Timer.reset();
    Timer.start();
    gameActive = true;

    // Atualiza UI
    hintBtn.classList.remove('hidden');
    clearBtn.classList.remove('hidden');
    checkBtn.classList.remove('hidden');
    continueBtn.classList.add('hidden');

    // Limpa save antigo
    Storage.clear();

    // Salva estado inicial
    saveGame();
  }

  /**
   * Salva o estado atual do jogo.
   */
  function saveGame() {
    if (!gameActive || !puzzle || !solution) return;

    const state = {
      puzzle: puzzle,
      current: Board.getCurrentBoard(),
      solution: solution,
      difficulty: difficulty,
      elapsedTime: Timer.getElapsed()
    };
    Storage.save(state);
  }

  /**
   * Carrega jogo salvo.
   */
  function loadGame() {
    const state = Storage.load();
    if (!state) return;

    puzzle = state.puzzle;
    solution = state.solution;
    difficulty = state.difficulty;

    // Renderiza o estado atual salvo (não o puzzle inicial vazio)
    // Precisamos renderizar o "current" (progresso do jogador)
    Board.render(state.current);

    // Atualiza máscara de dados: o puzzle original define quais são fixas
    // Board.render já cuida disso usando puzzle? 
    // Não, Board.render usa o array passado para definir givenMask.
    // Mas queremos renderizar o current (com números inseridos) e marcar como given
    // apenas as células do puzzle original.
    // Solução: modificar Board para aceitar puzzle (máscara) e current separados.
    // Como não fizemos isso, vamos contornar: chamamos Board.render(puzzle) 
    // e depois setamos os valores do current.
    // Mas isso é ineficiente. Melhor: criar um novo método Board.renderState(puzzle, current).
    // Para não alterar a API já definida, farei o seguinte:
    // 1. Board.render(puzzle) -> define givenMask e valores iniciais.
    // 2. Depois percorremos e atualizamos com current.
    // Não é o ideal, mas funciona. Vou otimizar no Board depois.
    // Por enquanto, faremos isso aqui:
    reloadBoardFromCurrent(state.current);

    Timer.setElapsed(state.elapsedTime);
    Timer.start();
    gameActive = true;

    hintBtn.classList.remove('hidden');
    clearBtn.classList.remove('hidden');
    checkBtn.classList.remove('hidden');
    continueBtn.classList.add('hidden');
  }

  /**
   * Atualiza o tabuleiro renderizado com os valores do current.
   * @param {number[][]} current
   */
  function reloadBoardFromCurrent(current) {
    // Renderiza o puzzle primeiro para ter givenMask correto
    Board.render(puzzle);
    // Agora sobrescreve com os valores de current, mas respeitando givenMask
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (!Board.isGiven(r, c)) {
          Board.setCellValue(r, c, current[r][c]);
        }
      }
    }
  }

  /**
   * Dá uma dica: revela um número aleatório vazio.
   */
  function giveHint() {
    const current = Board.getCurrentBoard();
    const emptyCells = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (current[r][c] === 0) {
          emptyCells.push({ row: r, col: c });
        }
      }
    }

    if (emptyCells.length === 0) return;

    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    const { row, col } = emptyCells[randomIndex];
    const correctNum = solution[row][col];

    Board.setCellValue(row, col, correctNum);
    Board.selectCell(row, col);
    Board.animateCorrect(row, col);

    saveGame();

    if (Sudoku.checkComplete(Board.getCurrentBoard())) {
      onVictory();
    }
  }

  /**
   * Limpa a célula selecionada.
   */
  function clearSelectedCell() {
    const cells = document.querySelectorAll('.cell');
    for (const cell of cells) {
      if (cell.classList.contains('selected')) {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        if (!Board.isGiven(row, col)) {
          Board.setCellValue(row, col, 0);
          Board.selectCell(row, col);
          saveGame();
        }
        break;
      }
    }
  }

  /**
   * Chamado quando o jogador completa o tabuleiro corretamente.
   */
  function onVictory() {
    Timer.pause();
    gameActive = false;
    Storage.clear(); // remove save para não continuar jogo concluído
    continueBtn.classList.add('hidden');

    const time = Timer.getFormatted();
    showVictoryModal(time);
  }

  /**
   * Exibe modal de vitória.
   */
  function showVictoryModal(time) {
    const html = `
      <h2>🎉 Parabéns!</h2>
      <p>Você completou o Sudoku em <strong>${time}</strong> na dificuldade <strong>${translateDifficulty(difficulty)}</strong>.</p>
      <div class="modal-actions">
        <button class="action-btn primary" id="btn-new-game-modal">Novo Jogo</button>
      </div>
    `;
    showModal(html);
    document.getElementById('btn-new-game-modal').addEventListener('click', () => {
      hideModal();
      showDifficultyModal();
    });
  }

  /**
   * Exibe modal de seleção de dificuldade.
   */
  function showDifficultyModal() {
    const html = `
      <h2>Novo Jogo</h2>
      <p>Escolha a dificuldade:</p>
      <div class="difficulty-options">
        <button class="difficulty-btn selected" data-diff="easy">Fácil</button>
        <button class="difficulty-btn" data-diff="medium">Médio</button>
        <button class="difficulty-btn" data-diff="hard">Difícil</button>
      </div>
      <div class="modal-actions">
        <button class="action-btn" id="btn-cancel-modal">Cancelar</button>
        <button class="action-btn primary" id="btn-start-modal">Começar</button>
      </div>
    `;
    showModal(html);

    let selectedDiff = 'easy';

    // Listener para botões de dificuldade
    const diffBtns = document.querySelectorAll('.difficulty-btn');
    diffBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        diffBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedDiff = btn.dataset.diff;
      });
    });

    // Botão Cancelar
    document.getElementById('btn-cancel-modal').addEventListener('click', hideModal);

    // Botão Começar
    document.getElementById('btn-start-modal').addEventListener('click', () => {
      hideModal();
      startNewGame(selectedDiff);
    });
  }

  /**
   * Exibe modal de confirmação com callback.
   */
  function showConfirmModal(message, onConfirm) {
    const html = `
      <h2>Confirmação</h2>
      <p>${message}</p>
      <div class="modal-actions">
        <button class="action-btn" id="btn-cancel-confirm">Cancelar</button>
        <button class="action-btn primary" id="btn-confirm">Sim</button>
      </div>
    `;
    showModal(html);
    document.getElementById('btn-cancel-confirm').addEventListener('click', hideModal);
    document.getElementById('btn-confirm').addEventListener('click', () => {
      hideModal();
      if (onConfirm) onConfirm();
    });
  }

  /**
   * Exibe um modal genérico com HTML.
   */
  function showModal(html) {
    modalContent.innerHTML = html;
    modalOverlay.classList.remove('hidden');
  }

  /**
   * Esconde o modal.
   */
  function hideModal() {
    modalOverlay.classList.add('hidden');
  }

  /**
   * Exibe um toast temporário (simples, sem biblioteca).
   */
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    // Estilo inline básico (pode ser movido para CSS)
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = 'var(--text-primary)';
    toast.style.color = 'var(--bg)';
    toast.style.padding = '0.75rem 1.5rem';
    toast.style.borderRadius = '2rem';
    toast.style.fontWeight = '500';
    toast.style.zIndex = '200';
    toast.style.animation = 'fadeIn 0.3s ease';

    setTimeout(() => {
      toast.remove();
    }, 2000);
  }

  /**
   * Traduz dificuldade para exibição.
   */
  function translateDifficulty(diff) {
    switch (diff) {
      case 'easy': return 'Fácil';
      case 'medium': return 'Médio';
      case 'hard': return 'Difícil';
      default: return diff;
    }
  }

  // Inicialização ao carregar o script
  document.addEventListener('DOMContentLoaded', init);

  // API pública (útil se necessário)
  return {
    init
  };
})();