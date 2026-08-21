(() => {
  "use strict";

  const STORAGE_KEY = "deckbox.decks.v1";

  function loadDecks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("Failed to load decks", e);
      return [];
    }
  }

  function saveDecks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.decks));
  }

  function uid() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  const state = {
    decks: loadDecks(),          
    activeDeckId: null,
    editingCardId: null,          
    study: {
      order: [],                  
      index: 0,
      flipped: false,
      known: new Set(),
      stillLearning: new Set(),
      roundSource: "all",        
    },
  };

  const views = {
    library: document.getElementById("view-library"),
    editor: document.getElementById("view-editor"),
    study: document.getElementById("view-study"),
    complete: document.getElementById("view-complete"),
  };

  const deckGrid = document.getElementById("deck-grid");
  const libraryEmpty = document.getElementById("library-empty");

  const editorBack = document.getElementById("editor-back");
  const editorDeleteDeck = document.getElementById("editor-delete-deck");
  const editorTitleInput = document.getElementById("editor-deck-title");
  const cardForm = document.getElementById("card-form");
  const inputFront = document.getElementById("input-front");
  const inputBack = document.getElementById("input-back");
  const cardFormSubmit = document.getElementById("card-form-submit");
  const cardFormCancel = document.getElementById("card-form-cancel");
  const cardList = document.getElementById("card-list");
  const editorEmpty = document.getElementById("editor-empty");
  const editorCount = document.getElementById("editor-count");
  const editorStudyBtn = document.getElementById("editor-study-btn");

  const studyBack = document.getElementById("study-back");
  const studyDeckName = document.getElementById("study-deck-name");
  const studyProgressLabel = document.getElementById("study-progress-label");
  const studyShuffle = document.getElementById("study-shuffle");
  const progressFill = document.getElementById("progress-fill");
  const flipCard = document.getElementById("flip-card");
  const flipCardInner = document.getElementById("flip-card-inner");
  const faceFrontText = document.getElementById("face-front-text");
  const faceBackText = document.getElementById("face-back-text");
  const btnStillLearning = document.getElementById("btn-still-learning");
  const btnKnowIt = document.getElementById("btn-know-it");
  const btnPrev = document.getElementById("btn-prev");
  const btnNext = document.getElementById("btn-next");

  const completeHeading = document.getElementById("complete-heading");
  const completeKnownNum = document.getElementById("complete-known-num");
  const completeLearningNum = document.getElementById("complete-learning-num");
  const completeRetryLearning = document.getElementById("complete-retry-learning");
  const completeRestart = document.getElementById("complete-restart");
  const completeExit = document.getElementById("complete-exit");

  function showView(name) {
    Object.entries(views).forEach(([key, el]) => {
      el.classList.toggle("hidden", key !== name);
    });
  }

  function getActiveDeck() {
    return state.decks.find((d) => d.id === state.activeDeckId) || null;
  }

  function renderLibrary() {
    deckGrid.innerHTML = "";
    libraryEmpty.classList.toggle("hidden", state.decks.length > 0);

    state.decks.forEach((deck) => {
      const card = document.createElement("button");
      card.className = "deck-card";
      card.type = "button";
      card.addEventListener("click", () => openEditor(deck.id));

      const name = document.createElement("p");
      name.className = "deck-card-name";
      name.textContent = deck.name || "Untitled deck";

      const meta = document.createElement("span");
      meta.className = "deck-card-meta";
      meta.textContent = `${deck.cards.length} card${deck.cards.length === 1 ? "" : "s"}`;

      card.append(name, meta);
      deckGrid.appendChild(card);
    });

    const newTile = document.createElement("button");
    newTile.type = "button";
    newTile.className = "deck-card-new";
    newTile.innerHTML = `<span class="deck-card-new-plus">+</span><span>New deck</span>`;
    newTile.addEventListener("click", createDeck);
    deckGrid.appendChild(newTile);
  }

  function createDeck() {
    const deck = { id: uid(), name: "Untitled deck", cards: [] };
    state.decks.unshift(deck);
    saveDecks();
    openEditor(deck.id);
    requestAnimationFrame(() => {
      editorTitleInput.focus();
      editorTitleInput.select();
    });
  }

  function openEditor(deckId) {
    state.activeDeckId = deckID;
    state.editingCardId = null;
    resetCardForm();
    renderEditor();
    showView("editor");
  }

  function renderEditor() {
    const deck = getActiveDeck();
    if (!deck) return;

    editorTitleInput.value = deck.name;

    cardList.innerHTML = "";
    editorEmpty.classList.toggle("hidden", deck.cards.length > 0);
    editorCount.textContent = `${deck.cards.length} card${deck.cards.length === 1 ? "" : "s"}`;
    editorStudyBtn.disabled = deck.cards.length === 0;

    deck.cards.forEach((card) => {
      const li = document.createElement("li");
      li.className = "card-list-item";

      const text = document.createElement("div");
      text.className = "card-list-text";
      const front = document.createElement("p");
      front.className = "card-list-front";
      front.textContent = card.front;
      const back = document.createElement("p");
      back.className = "card-list-back";
      back.textContent = card.back;
      text.append(front, back);

      const actions = document.createElement("div");
      actions.className = "card-list-actions";

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.setAttribute("aria-label", "Edit card");
      editBtn.textContent = "✎";
      editBtn.addEventListener("click", () => startEditCard(card.id));

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.setAttribute("aria-label", "Delete card");
      delBtn.textContent = "✕";
      delBtn.addEventListener("click", () => deleteCard(card.id));

      actions.append(editBtn, delBtn);
      li.append(text, actions);
      cardList.appendChild(li);
    });
  }

  function resetCardForm() {
    cardForm.reset();
    state.editingCardId = null;
    cardFormSubmit.textContent = "Add card";
    cardFormCancel.classList.add("hidden");
    inputFront.focus();
  }

  function startEditCard(cardId) {
    const deck = getActiveDeck();
    const card = deck.cards.find((c) => c.id === cardId);
    if (!card) return;
    state.editingCardId = cardId;
    inputFront.value = card.front;
    inputBack.value = card.back;
    cardFormSubmit.textContent = "Save changes";
    cardFormCancel.classList.remove("hidden");
    inputFront.focus();
  }

  function deleteCard(cardId) {
    const deck = getActiveDeck();
    deck.cards = deck.cards.filter((c) => c.id !== cardId);
    if (state.editingCardId === cardId) resetCardForm();
    saveDecks();
    renderEditor();
  }

  function deleteActiveDeck() {
    const deck = getActiveDeck();
    if (!deck) return;
    const label = deck.name || "this deck";
    if (!confirm(`Delete "${label}"? This can't be undone.`)) return;
    state.decks = state.decks.filter((d) => d.id !== deck.id);
    saveDecks();
    state.activeDeckId = null;
    renderLibrary();
    showView("library");
  }

  editorBack.addEventListener("click", () => {
    renderLibrary();
    showView("library");
  });

  editorDeleteDeck.addEventListener("click", deleteActiveDeck);

  editorTitleInput.addEventListener("input", () => {
    const deck = getActiveDeck();
    if (!deck) return;
    deck.name = editorTitleInput.value;
    saveDecks();
  });

  editorTitleInput.addEventListener("blur", () => {
    const deck = getActiveDeck();
    if (!deck) return;
    if (!deck.name.trim()) {
      deck.name = "Untitled deck";
      editorTitleInput.value = deck.name;
      saveDecks();
    }
    renderLibrary();
  });

  cardForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const deck = getActiveDeck();
    if (!deck) return;
    const front = inputFront.value.trim();
    const back = inputBack.value.trim();
    if (!front || !back) return;

    if (state.editingCardId) {
      const card = deck.cards.find((c) => c.id === state.editingCardId);
      if (card) { card.front = front; card.back = back; }
    } else {
      deck.cards.push({ id: uid(), front, back });
    }
    saveDecks();
    resetCardForm();
    renderEditor();
  });

  cardFormCancel.addEventListener("click", resetCardForm);

  editorStudyBtn.addEventListener("click", () => {
    const deck = getActiveDeck();
    if (!deck || deck.cards.length === 0) return;
    startStudySession(deck.cards.map((c) => c.id), "all");
  });

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function startStudySession(cardIds, source) {
    state.study.order = shuffle(cardIds);
    state.study.index = 0;
    state.study.flipped = false;
    state.study.known = new Set();
    state.study.stillLearning = new Set();
    state.study.roundSource = source;
    showView("study");
    renderStudyCard();
  }

  function currentDeckCards() {
    const deck = getActiveDeck();
    return deck ? deck.cards : [];
  }

  function cardById(id) {
    return currentDeckCards().find((c) => c.id === id);
  }

  function renderStudyCard() {
    const deck = getActiveDeck();
    if (!deck) return;
    const { order, index } = state.study;
    const card = cardById(order[index]);
    if (!card) return;

    studyDeckName.textContent = deck.name;
    studyProgressLabel.textContent = `${index + 1} / ${order.length}`;
    progressFill.style.width = `${((index) / order.length) * 100}%`;

    faceFrontText.textContent = card.front;
    faceBackText.textContent = card.back;

    state.study.flipped = false;
    flipCard.classList.remove("is-flipped");

    btnPrev.disabled = index === 0;
    btnPrev.style.visibility = index === 0 ? "hidden" : "visible";
  }

  function toggleFlip() {
    state.study.flipped = !state.study.flipped;
    flipCard.classList.toggle("is-flipped", state.study.flipped);
  }

  function advanceCard() {
    const { order, index } = state.study;
    if (index + 1 >= order.length) {
      finishRound();
    } else {
      state.study.index += 1;
      renderStudyCard();
    }
  }

  function markCard(bucket) {
    const currentId = state.study.order[state.study.index];
    state.study.known.delete(currentId);
    state.study.stillLearning.delete(currentId);
    if (bucket === "known") state.study.known.add(currentId);
    if (bucket === "learning") state.study.stillLearning.add(currentId);
    advanceCard();
  }

  function finishRound() {
    progressFill.style.width = "100%";
    const knownCount = state.study.known.size;
    const learningCount = state.study.stillLearning.size;

    completeKnownNum.textContent = String(knownCount);
    completeLearningNum.textContent = String(learningCount);
    completeHeading.textContent =
      learningCount === 0 ? "Deck mastered." : "Nice work.";
    completeRetryLearning.classList.toggle("hidden", learningCount === 0);

    showView("complete");
  }

  studyBack.addEventListener("click", () => {
    renderLibrary();
    showView("library");
  });

  studyShuffle.addEventListener("click", () => {
    state.study.order = shuffle(state.study.order);
    state.study.index = 0;
    renderStudyCard();
  });

  flipCard.addEventListener("click", toggleFlip);
  flipCard.addEventListener("keydown", (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      toggleFlip();
    }
  });

  btnKnowIt.addEventListener("click", () => markCard("known"));
  btnStillLearning.addEventListener("click", () => markCard("learning"));
  btnNext.addEventListener("click", advanceCard);
  btnPrev.addEventListener("click", () => {
    if (state.study.index === 0) return;
    state.study.index -= 1;
    renderStudyCard();
  });

  document.addEventListener("keydown", (e) => {
    if (views.study.classList.contains("hidden")) return;
    if (document.activeElement === flipCard) return; // handled above
    if (e.key === "ArrowRight") advanceCard();
    if (e.key === "ArrowLeft" && state.study.index > 0) {
      state.study.index -= 1;
      renderStudyCard();
    }
  });


  completeRetryLearning.addEventListener("click", () => {
    const ids = Array.from(state.study.stillLearning);
    if (ids.length === 0) return;
    startStudySession(ids, "relearn");
  });

  completeRestart.addEventListener("click", () => {
    const deck = getActiveDeck();
    if (!deck) return;
    startStudySession(deck.cards.map((c) => c.id), "all");
  });

  completeExit.addEventListener("click", () => {
    renderLibrary();
    showView("library");
  });

  renderLibrary();
  showView("library");
})();
