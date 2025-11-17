let guessedWords;
let availableSpace;
let isAnimating;
let isGameOver;
let word;
let guessedWordCount;
let currentNotification;
let notificationTimeout;
let keyButtons;

document.addEventListener("DOMContentLoaded", () => {
  function startGame() {
    createSquares();

    guessedWords = [[]];
    availableSpace = 1;
    isAnimating = false;
    isGameOver = false;

    const possibleAnswersList = possibleAnswers.trim().split(/\s+/);

    const RandomWord =
      possibleAnswersList[
        Math.floor(Math.random() * possibleAnswersList.length)
      ];

    word = RandomWord;

    console.log(word);
    guessedWordCount = 0;

    keyButtons = {};
    document.querySelectorAll(".keyboard-row button").forEach((btn) => {
      const key = btn.getAttribute("data-key");
      keyButtons[key] = btn;
    });

    keyButtons["backspace"] = keyButtons["del"];
    keyButtons["delete"] = keyButtons["del"];

    currentNotification = null;
    notificationTimeout = null;
  }

  function showNotification(message, type = "end") {
    let container = document.getElementById("notification-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "notification-container";
      document.body.appendChild(container);
    }

    if (currentNotification) {
      currentNotification.remove();
      clearTimeout(notificationTimeout);
    }

    const notif = document.createElement("div");
    notif.classList.add("notification");
    notif.textContent = message;
    container.appendChild(notif);
    currentNotification = notif;

    const duration = type === "error" ? 2000 : 5000;
    notif.style.animation = `slideInOut ${duration}ms forwards`;

    notificationTimeout = setTimeout(() => {
      notif.remove();
      currentNotification = null;
    }, duration);

    if (type === "error") {
      // Shake all tiles in the current row
      const row = guessedWords.length - 1;
      const firstId = row * 5 + 1;
      for (let i = 0; i < 5; i++) {
        const tile = document.getElementById(firstId + i);
        if (!tile) continue;

        tile.classList.remove("shake");
        void tile.offsetWidth; // force reflow
        tile.classList.add("shake");
      }
    }
  }

  function getCurrentWordArr() {
    return guessedWords[guessedWords.length - 1];
  }

  function updateGuessedWords(letter) {
    if (isAnimating || isGameOver) return;
    const arr = getCurrentWordArr();
    if (arr.length < 5) {
      arr.push(letter);
      const el = document.getElementById(String(availableSpace));
      el.textContent = letter;
      availableSpace++;
    }
  }

  function handleDeleteLetter() {
    if (isAnimating || isGameOver) return;
    const arr = getCurrentWordArr();
    if (!arr.length) return;

    arr.pop();
    const box = document.getElementById(String(availableSpace - 1));
    box.textContent = "";
    availableSpace--;
  }

  function handleSubmitWord() {
    const arr = getCurrentWordArr();
    if (arr.length !== 5) {
      showNotification("Not enough letters", "error");
      return;
    }

    const guess = arr.join("");

    if (!allowedGuesses.includes(guess)) {
      showNotification("Not in word list", "error");
      return;
    }

    isAnimating = true;
    const firstId = guessedWordCount * 5 + 1;

    let freq = {};
    for (let c of word) freq[c] = (freq[c] || 0) + 1;

    let colors = ["", "", "", "", ""];

    for (let i = 0; i < 5; i++) {
      if (guess[i] === word[i]) {
        colors[i] = "green";
        freq[guess[i]]--;
      }
    }

    for (let i = 0; i < 5; i++) {
      if (colors[i]) continue;
      if (!word.includes(guess[i])) colors[i] = "gray";
      else if (freq[guess[i]] > 0) {
        colors[i] = "yellow";
        freq[guess[i]]--;
      } else colors[i] = "gray";
    }

    let animationsCompleted = 0;
    arr.forEach((letter, index) => {
      setTimeout(() => {
        const tile = document.getElementById(firstId + index);
        tile.classList.add("animate__flipInX");

        let col =
          colors[index] === "green"
            ? "rgb(83,141,78)"
            : colors[index] === "yellow"
            ? "rgb(181,159,59)"
            : "rgb(58,58,60)";

        tile.style.backgroundColor = col;
        tile.style.borderColor = col;

        tile.classList.remove("glow-green", "glow-yellow", "glow-gray"); // remove old glows

        if (colors[index] === "green") tile.classList.add("glow-green");
        else if (colors[index] === "yellow") tile.classList.add("glow-yellow");
        else tile.classList.add("glow-gray");

        tile.addEventListener(
          "animationend",
          () => {
            animationsCompleted++;
            if (animationsCompleted === 3) {
              isAnimating = false;
              updateKeyColors(guess, colors);
              if (guess === word) {
                showNotification("Congratulations");
                isGameOver = true;
              } else if (guessedWords.length === 7) {
                showNotification(`${word.toUpperCase()}`);
                isGameOver = true;
              }
            }
          },
          { once: true }
        );
      }, 300 * index);
    });

    guessedWordCount++;
    guessedWords.push([]);
  }

  function createSquares() {
    const board = document.getElementById("board");
    for (let i = 0; i < 30; i++) {
      const sq = document.createElement("div");
      sq.classList.add("square", "animate__animated");
      sq.id = i + 1;
      board.appendChild(sq);
    }
  }

  function updateKeyColors(guess, colors) {
    for (let i = 0; i < 5; i++) {
      const letter = guess[i];
      const state = colors[i];
      const btn = keyButtons[letter];
      if (!btn) continue;

      if (btn.dataset.color === "green") continue;
      if (btn.dataset.color === "yellow" && state === "gray") continue;

      let col =
        state === "green"
          ? "rgb(83,141,78)"
          : state === "yellow"
          ? "rgb(181,159,59)"
          : "rgb(58,58,60)";

      btn.style.backgroundColor = col;
      btn.dataset.color = state;
    }
  }

  function pressKeyVisual(key) {
    const btn = keyButtons[key];
    if (!btn) return;
    btn.classList.add("pressed");
  }

  function releaseKeyVisual(key) {
    const btn = keyButtons[key];
    if (!btn) return;
    btn.classList.remove("pressed");
  }

  document.addEventListener("keydown", (e) => {
    if (isAnimating || isGameOver) return;
    if (e.repeat) return;
    const key = e.key.toLowerCase();
    pressKeyVisual(key);
  });

  document.addEventListener("keyup", (e) => {
    if (isAnimating || isGameOver) return;

    const key = e.key.toLowerCase();
    releaseKeyVisual(key);

    if (key === "enter") handleSubmitWord();
    else if (key === "backspace" || key === "delete") handleDeleteLetter();
    else if (/^[a-z]$/.test(key)) updateGuessedWords(key);
  });

  document.querySelectorAll(".keyboard-row button").forEach((btn) => {
    const key = btn.getAttribute("data-key");

    btn.addEventListener("mousedown", () => pressKeyVisual(key));
    btn.addEventListener("mouseup", () => releaseKeyVisual(key));

    btn.addEventListener("mouseup", () => {
      if (isAnimating || isGameOver) return;

      if (key === "enter") handleSubmitWord();
      else if (key === "del") handleDeleteLetter();
      else updateGuessedWords(key);
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Tab") e.preventDefault();
  });

  startGame();
});
