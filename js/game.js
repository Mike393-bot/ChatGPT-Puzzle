(function () {
  const {
    animals,
    formatTime,
    focusCard,
    getBestRecord,
    getFocusableIndex,
    getNextFocusableIndex,
    HINT_DURATION,
    MAX_HINTS,
    MISMATCH_DELAY,
    PAIR_COUNT,
    pop,
    renderBoard,
    saveBestRecord,
    shuffle,
  } = window.PuzzleGame;

  function setupGame(elements) {
    const state = createInitialState();

    function startGame() {
      stopTimer();
      Object.assign(state, createInitialState(), { cards: createDeck() });
      elements.message.className = "message";
      elements.message.textContent = "카드 두 장을 열어 같은 동물을 찾아보세요.";
      elements.hintButton.disabled = false;
      drawBoard();
      updateHud();
    }

    function openCard(index) {
      const card = state.cards[index];

      if (state.locked || state.finished || card.isOpen || card.isMatched || card.isHinted) {
        return;
      }

      state.focusIndex = index;
      startTimer();
      card.isOpen = true;
      state.opened.push(index);
      drawBoard();
      focusCard(elements.board, state, index);

      if (state.opened.length === 2) {
        evaluatePair();
      }
    }

    function revealHint() {
      if (state.locked || state.finished || state.hintsLeft <= 0) {
        return;
      }

      const hiddenCards = state.cards.filter((card) => !card.isOpen && !card.isMatched);

      if (hiddenCards.length === 0) {
        return;
      }

      startTimer();
      state.locked = true;
      state.hintsLeft -= 1;
      state.score = Math.max(0, state.score - 120);
      hiddenCards.forEach((card) => {
        card.isHinted = true;
      });
      elements.message.className = "message";
      elements.message.textContent = `힌트를 사용했습니다. 남은 힌트 ${state.hintsLeft}회.`;
      elements.hintButton.disabled = state.hintsLeft === 0;
      drawBoard();
      updateHud(true);

      window.setTimeout(() => {
        hiddenCards.forEach((card) => {
          card.isHinted = false;
        });
        state.locked = false;
        drawBoard();
      }, HINT_DURATION);
    }

    function drawBoard() {
      state.focusIndex = getFocusableIndex(state.cards, state.focusIndex);
      renderBoard({
        board: elements.board,
        cards: state.cards,
        focusIndex: state.focusIndex,
        onOpenCard: openCard,
        onMoveFocus: moveFocus,
        getCardLabel,
        isVisible,
      });
    }

    function moveFocus(event, index) {
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        return;
      }

      event.preventDefault();
      const nextIndex = getNextFocusableIndex(state.cards, index, event.key);

      if (nextIndex !== index) {
        focusCard(elements.board, state, nextIndex);
      }
    }

    function evaluatePair() {
      state.locked = true;
      state.attempts += 1;

      const [firstIndex, secondIndex] = state.opened;
      const firstCard = state.cards[firstIndex];
      const secondCard = state.cards[secondIndex];

      if (firstCard.id === secondCard.id) {
        resolveMatch(firstCard, secondCard);
        return;
      }

      resolveMiss(firstCard, secondCard);
    }

    function resolveMatch(firstCard, secondCard) {
      firstCard.isMatched = true;
      secondCard.isMatched = true;
      state.matchedPairs += 1;
      state.combo += 1;
      state.score += getMatchScore();
      state.opened = [];
      state.locked = false;
      elements.message.className = "message";
      elements.message.textContent = `${firstCard.label} 한 쌍을 찾았습니다. 콤보 ${state.combo}!`;
      drawBoard();
      focusCard(elements.board, state, state.focusIndex);
      updateHud(true);

      if (state.matchedPairs === PAIR_COUNT) {
        finishGame();
      }
    }

    function resolveMiss(firstCard, secondCard) {
      firstCard.isWrong = true;
      secondCard.isWrong = true;
      state.misses += 1;
      state.combo = 0;
      state.score = Math.max(0, state.score - 45);
      elements.message.className = "message warning";
      elements.message.textContent = "다른 동물입니다. 위치를 기억하고 다시 도전하세요.";
      drawBoard();
      updateHud(true);

      window.setTimeout(() => {
        firstCard.isOpen = false;
        secondCard.isOpen = false;
        firstCard.isWrong = false;
        secondCard.isWrong = false;
        state.opened = [];
        state.locked = false;
        drawBoard();
        focusCard(elements.board, state, state.cards.indexOf(firstCard));
      }, MISMATCH_DELAY);
    }

    function getMatchScore() {
      const speedBonus = Math.max(0, 150 - state.seconds) * 2;
      const efficiencyBonus = Math.max(0, 24 - state.attempts) * 8;
      const comboBonus = state.combo * 60;
      const accuracyBonus = getAccuracyValue() >= 80 ? 120 : 0;

      return 500 + speedBonus + efficiencyBonus + comboBonus + accuracyBonus;
    }

    function finishGame() {
      stopTimer();
      state.finished = true;
      const finalBonus = Math.max(0, 260 - state.seconds) * 5;
      const perfectBonus = state.misses === 0 ? 1000 : 0;
      state.score += finalBonus + perfectBonus;
      saveBestRecord({
        score: state.score,
        seconds: state.seconds,
        attempts: state.attempts,
        misses: state.misses,
        rank: getRank(),
      });
      updateHud(true);
      elements.message.className = "message success";
      elements.message.textContent = `완성! ${formatTime(state.seconds)}, ${state.attempts}번 시도, 최종 ${state.score.toLocaleString("ko-KR")}점입니다.`;
    }

    function updateHud(animate = false) {
      elements.tryCount.textContent = state.attempts;
      elements.missCount.textContent = state.misses;
      elements.timer.textContent = formatTime(state.seconds);
      elements.matchCount.textContent = state.matchedPairs;
      elements.accuracy.textContent = `${getAccuracyValue()}%`;
      elements.combo.textContent = state.combo;
      elements.rank.textContent = getRank();
      elements.score.textContent = state.score.toLocaleString("ko-KR");
      elements.bestScore.textContent = getBestRecord().score.toLocaleString("ko-KR");
      elements.progressBar.style.width = `${(state.matchedPairs / PAIR_COUNT) * 100}%`;
      elements.hintButton.textContent = `힌트 ${state.hintsLeft}`;

      if (animate) {
        [
          elements.tryCount,
          elements.missCount,
          elements.matchCount,
          elements.accuracy,
          elements.combo,
          elements.rank,
          elements.score,
        ].forEach(pop);
      }
    }

    function startTimer() {
      if (state.started) {
        return;
      }

      state.started = true;
      state.timerId = window.setInterval(() => {
        state.seconds += 1;
        updateHud();
      }, 1000);
    }

    function stopTimer() {
      window.clearInterval(state.timerId);
      state.timerId = null;
    }

    function getAccuracyValue() {
      if (state.attempts === 0) {
        return 100;
      }

      return Math.round((state.matchedPairs / state.attempts) * 100);
    }

    function getRank() {
      const accuracyValue = getAccuracyValue();

      if (state.misses === 0 && state.seconds <= 45 && accuracyValue === 100) {
        return "S+";
      }

      if (accuracyValue >= 85 && state.seconds <= 90) {
        return "S";
      }

      if (accuracyValue >= 70) {
        return "A";
      }

      if (accuracyValue >= 50) {
        return "B";
      }

      return "C";
    }

    function getCardLabel(card) {
      if (card.isMatched) {
        return `맞춘 ${card.label} 카드`;
      }

      if (isVisible(card)) {
        return `${card.label} 카드`;
      }

      return "닫힌 카드";
    }

    function isVisible(card) {
      return card.isOpen || card.isMatched || card.isHinted;
    }

    elements.restartButton.addEventListener("click", startGame);
    elements.hintButton.addEventListener("click", revealHint);
    startGame();
  }

  function createInitialState() {
    return {
      cards: [],
      opened: [],
      matchedPairs: 0,
      attempts: 0,
      misses: 0,
      seconds: 0,
      score: 0,
      combo: 0,
      hintsLeft: MAX_HINTS,
      focusIndex: 0,
      started: false,
      finished: false,
      locked: false,
      timerId: null,
    };
  }

  function createDeck() {
    return shuffle([...animals, ...animals].map((animal, index) => ({
      ...animal,
      uid: `${animal.id}-${index}`,
      isOpen: false,
      isMatched: false,
      isWrong: false,
      isHinted: false,
    })));
  }

  window.PuzzleGame.setupGame = setupGame;
})();
