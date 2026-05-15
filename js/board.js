(function () {
  const { COLUMN_COUNT } = window.PuzzleGame;

  function renderBoard({
    board,
    cards,
    focusIndex,
    onOpenCard,
    onMoveFocus,
    getCardLabel,
    isVisible,
  }) {
    board.innerHTML = "";

    cards.forEach((card, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = getCardClassName(card);
      button.dataset.index = index;
      button.tabIndex = index === focusIndex ? 0 : -1;
      button.disabled = card.isMatched;
      button.setAttribute("aria-label", getCardLabel(card));
      button.setAttribute("aria-pressed", String(isVisible(card)));
      button.innerHTML = `
        <span class="card-inner">
          <span class="card-face card-back"></span>
          <span class="card-face card-front">
            ${getCardVisual(card)}
          </span>
        </span>
      `;

      button.addEventListener("click", () => onOpenCard(index));
      button.addEventListener("keydown", (event) => onMoveFocus(event, index));
      board.appendChild(button);
    });
  }

  function focusCard(board, state, preferredIndex) {
    state.focusIndex = getFocusableIndex(state.cards, preferredIndex);
    board.querySelectorAll(".card").forEach((button) => {
      button.tabIndex = Number(button.dataset.index) === state.focusIndex ? 0 : -1;
    });

    const nextButton = board.querySelector(`[data-index="${state.focusIndex}"]`);

    if (nextButton) {
      nextButton.focus();
    }
  }

  function getFocusableIndex(cards, preferredIndex) {
    if (!cards[preferredIndex]?.isMatched) {
      return preferredIndex;
    }

    const nextOpenIndex = cards.findIndex((card) => !card.isMatched);

    return nextOpenIndex === -1 ? 0 : nextOpenIndex;
  }

  function getNextFocusableIndex(cards, index, key) {
    const rowCount = Math.ceil(cards.length / COLUMN_COUNT);
    let row = Math.floor(index / COLUMN_COUNT);
    let column = index % COLUMN_COUNT;

    if (key === "ArrowUp") {
      row = Math.max(0, row - 1);
    }

    if (key === "ArrowDown") {
      row = Math.min(rowCount - 1, row + 1);
    }

    if (key === "ArrowLeft") {
      column = Math.max(0, column - 1);
    }

    if (key === "ArrowRight") {
      column = Math.min(COLUMN_COUNT - 1, column + 1);
    }

    const nextIndex = row * COLUMN_COUNT + column;

    if (cards[nextIndex]?.isMatched) {
      return findNearestFocusableIndex(cards, nextIndex, key, index);
    }

    return nextIndex;
  }

  function getCardClassName(card) {
    const classes = ["card"];

    if (card.isOpen || card.isHinted) {
      classes.push("is-open");
    }

    if (card.isMatched) {
      classes.push("is-matched");
    }

    if (card.isWrong) {
      classes.push("is-wrong");
    }

    return classes.join(" ");
  }

  function getCardVisual(card) {
    if (card.image) {
      return `<img class="animal animal-image" src="${card.image}" alt="" aria-hidden="true">`;
    }

    return `<span class="animal" aria-hidden="true">${card.icon}</span>`;
  }

  function findNearestFocusableIndex(cards, index, key, fallbackIndex) {
    const stepByKey = {
      ArrowUp: -COLUMN_COUNT,
      ArrowDown: COLUMN_COUNT,
      ArrowLeft: -1,
      ArrowRight: 1,
    };
    const step = stepByKey[key];
    let nextIndex = index;

    while (nextIndex >= 0 && nextIndex < cards.length) {
      if (!cards[nextIndex].isMatched) {
        return nextIndex;
      }

      nextIndex += step;
    }

    return fallbackIndex;
  }

  Object.assign(window.PuzzleGame, {
    renderBoard,
    focusCard,
    getFocusableIndex,
    getNextFocusableIndex,
  });
})();
