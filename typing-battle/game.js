class TypingGame {
  constructor() {
    // Game state
    this.points = 0;
    this.playerHealth = 10;
    this.bossHealth = 100;
    this.level = 1;
    this.attackPower = 1;
    this.gameStarted = false;
    this.failDamage = 1;
    this.currentWord = "";
    this.timerInterval = null;
    this.isPaused = false;
    this.savedTimerState = null;
    this.combo = 0;
    this.maxCombo = 0;
    this.criticalChance = 0.1;
    this.criticalMultiplier = 2;
    this.speedBonus = 0;
    this.lastAttackTime = 0;
    this.attackSpeedThreshold = 2000;

    // Word lists
    this.wordLists = {
      0: [
        "api",
        "air",
        "batu",
        "topi",
        "buku",
        "kaki",
        "mata",
        "kota",
        "awan",
        "bumi",
        "laut",
        "pena",
        "gaya",
        "susu",
        "tali",
      ],
      1: [
        "cahaya",
        "pisang",
        "rumput",
        "kucing",
        "burung",
        "pohon",
        "pintu",
        "mobil",
        "hujan",
        "angin",
        "bulan",
        "bintang",
      ],
      2: [
        "informatika",
        "matematika",
        "perpustakaan",
        "perjalanan",
        "perjuangan",
        "pertanyaan",
        "universitas",
        "pemerintah",
      ],
    };

    // DOM elements
    this.domElements = {
      gameContainer: document.querySelector(".game-container"),
      level: document.getElementById("level"),
      points: document.getElementById("points"),
      playerHealth: document.getElementById("player-health"),
      bossHealth: document.getElementById("boss-health"),
      playerHealthBar: document.getElementById("player-health-bar"),
      bossHealthBar: document.getElementById("boss-health-bar"),
      wordDisplay: document.getElementById("word-display"),
      timer: document.getElementById("timer"),
      attackBtn: document.getElementById("attack-btn"),
      pauseBtn: document.getElementById("pause-btn"),
      finalLevel: document.getElementById("final-level"),
      finalPoints: document.getElementById("final-points"),
      startModal: document.getElementById("start-modal"),
      currentLevel: document.getElementById("current-level"),
      currentPoints: document.getElementById("current-points"),
    };

    // Initialize event listeners
    this.initEventListeners();

    // Show start modal
    this.showModal("start-modal");
  }

  initEventListeners() {
    // Global keyboard handler
    document.addEventListener("keydown", (e) => {
      // If game hasn't started, only allow "Enter" to start the game
      if (!this.gameStarted) {
        if (e.key === "Enter") {
          e.preventDefault();
          this.hideModal("start-modal");
          this.domElements.gameContainer.style.display = "block";
          this.startGame();
        }
        return;
      }

      // If game is started, handle specific keys
      switch (e.key) {
        case "Escape":
          e.preventDefault();
          this.togglePause();
          break;
        case "1":
          e.preventDefault();
          if (!this.isPaused) {
            this.domElements.wordDisplay.textContent = "";
            this.attack();
          }
          break;
        default:
          // Only allow typing in the word display area
          if (document.activeElement !== this.domElements.wordDisplay) {
            e.preventDefault();
          }
          break;
      }
    });

    // Word display input handling
    this.domElements.wordDisplay.addEventListener("input", (e) => {
      const inputText = e.target.textContent.trim();

      // Always show the target word as placeholder
      this.domElements.wordDisplay.setAttribute(
        "data-placeholder",
        this.currentWord
      );

      if (inputText === this.currentWord) {
        e.target.textContent = "";
        this.processAttackResult(true);
      }
    });

    // Prevent default behavior for enter key and paste
    this.domElements.wordDisplay.addEventListener("keydown", (e) => {
      if (e.key === "Enter") e.preventDefault();
    });

    this.domElements.wordDisplay.addEventListener("paste", (e) => {
      e.preventDefault();
    });

    // Add focus and blur handlers to maintain placeholder
    this.domElements.wordDisplay.addEventListener("focus", () => {
      this.domElements.wordDisplay.setAttribute(
        "data-placeholder",
        this.currentWord
      );
    });

    this.domElements.wordDisplay.addEventListener("blur", () => {
      this.domElements.wordDisplay.setAttribute(
        "data-placeholder",
        this.currentWord
      );
    });

    // Resume game button
    document
      .getElementById("resume-game")
      .addEventListener("click", () => this.togglePause());

    // Exit to menu button
    document.getElementById("exit-to-menu").addEventListener("click", () => {
      this.hideModal("pause-modal");
      location.reload();
    });

    // Level up choice handlers
    document.getElementById("continue-game").addEventListener("click", () => {
      this.hideModal("levelup-modal");
      this.proceedToNextLevel();
    });

    document.getElementById("end-game").addEventListener("click", () => {
      this.hideModal("levelup-modal");
      this.gameOver();
    });

    // Global keyboard handler for level up choices
    document.addEventListener("keydown", (e) => {
      if (document.getElementById("levelup-modal").style.display === "flex") {
        if (e.key === "1") {
          e.preventDefault();
          this.hideModal("levelup-modal");
          this.proceedToNextLevel();
        } else if (e.key === "2") {
          e.preventDefault();
          this.hideModal("levelup-modal");
          this.gameOver();
        }
      }
    });
  }

  // Show/Hide modal helper functions
  showModal(modalId) {
    document.getElementById(modalId).style.display = "flex";
  }

  hideModal(modalId) {
    document.getElementById(modalId).style.display = "none";
  }

  startGame() {
    this.gameStarted = true;
    this.updateUI();

    // Auto focus the word display area
    requestAnimationFrame(() => {
      this.domElements.wordDisplay.focus();

      // Set cursor to the beginning of the input
      const range = document.createRange();
      const sel = window.getSelection();
      range.setStart(this.domElements.wordDisplay, 0);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    });
  }

  // UI update function
  updateUI() {
    this.domElements.level.textContent = this.level;
    this.domElements.points.textContent = this.points;
    this.domElements.playerHealth.textContent = this.playerHealth;
    this.domElements.bossHealth.textContent = this.bossHealth;

    const playerHealthPercent = (this.playerHealth / 10) * 100;
    this.domElements.playerHealthBar.style.width = `${playerHealthPercent}%`;

    const bossHealthPercent = (this.bossHealth / (this.level * 100)) * 100;
    this.domElements.bossHealthBar.style.width = `${bossHealthPercent}%`;
  }

  // Game core functions
  getRandomWord(difficulty) {
    let availableWords = [];

    if (difficulty <= 3) {
      availableWords = this.wordLists[0];
    } else if (difficulty <= 6) {
      availableWords = this.wordLists[1];
    } else {
      availableWords = this.wordLists[2];
    }

    return availableWords[Math.floor(Math.random() * availableWords.length)];
  }

  attack() {
    if (!this.gameStarted || this.isPaused) return;

    // Clear any existing timer
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Get a random word based on level
    const difficulty = Math.min(Math.floor(this.level / 3), 2);
    const wordList = this.wordLists[difficulty];
    this.currentWord = wordList[Math.floor(Math.random() * wordList.length)];

    // Display the word
    this.domElements.wordDisplay.setAttribute(
      "data-placeholder",
      this.currentWord
    );
    this.domElements.wordDisplay.textContent = "";

    // Start the timer
    this.startTimer();
  }

  startTimer() {
    if (this.isPaused) return;

    // Calculate time limit based on word length
    let timeLimit =
      this.savedTimerState?.timeLimit ||
      Math.max(1, this.currentWord.length * 0.5); // seconds
    let timeLeft = this.savedTimerState?.timeLeft || timeLimit;

    this.domElements.timer.style.width = `${(timeLeft / timeLimit) * 100}%`;
    this.domElements.timer.style.backgroundColor =
      timeLeft / timeLimit < 0.3 ? "#e94560" : "#4ade80";

    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      timeLeft -= 0.1;
      const percentLeft = (timeLeft / timeLimit) * 100;
      this.domElements.timer.style.width = `${percentLeft}%`;

      // Change color when time is running out
      if (percentLeft < 30) {
        this.domElements.timer.style.backgroundColor = "#e94560";
      } else {
        this.domElements.timer.style.backgroundColor = "#4ade80";
      }

      if (timeLeft <= 0) {
        clearInterval(this.timerInterval);
        this.processAttackResult(false);
      }
    }, 100);
  }

  processAttackResult(success) {
    if (this.isPaused) return;

    clearInterval(this.timerInterval);
    this.timerInterval = null;
    this.domElements.timer.style.width = "0%";

    if (success) {
      // Calculate attack speed bonus
      const currentTime = Date.now();
      if (this.lastAttackTime > 0) {
        const timeDiff = currentTime - this.lastAttackTime;
        if (timeDiff < this.attackSpeedThreshold) {
          this.speedBonus = Math.floor(
            (this.attackSpeedThreshold - timeDiff) / 100
          );
        } else {
          this.speedBonus = 0;
        }
      }
      this.lastAttackTime = currentTime;

      // Calculate damage with combo and critical hit
      let damage = this.attackPower;

      // Add combo bonus
      this.combo++;
      if (this.combo > this.maxCombo) {
        this.maxCombo = this.combo;
      }
      damage += Math.floor(this.combo / 5); // Every 5 combos adds 1 damage

      // Critical hit chance
      if (Math.random() < this.criticalChance) {
        damage = Math.floor(damage * this.criticalMultiplier);
        this.showCriticalEffect();
      }

      // Add speed bonus
      damage += this.speedBonus;

      this.bossHealth -= damage;
      this.points += damage;

      // Show damage number animation with combo
      this.showDamageNumber(damage, this.combo);

      // Clear current word after successful attack
      this.currentWord = "";

      // Check if boss defeated immediately after damage
      if (this.bossHealth <= 0) {
        setTimeout(() => this.levelUp(), 1000);
        return;
      }

      // Auto-generate new word after successful attack
      setTimeout(() => {
        this.attack();
      }, 500);
    } else {
      this.playerHealth -= this.failDamage;
      this.combo = 0; // Reset combo on failure
      if (this.playerHealth <= 0) {
        this.gameOver();
        return;
      }
      // Clear current word after failed attack
      this.currentWord = "";
      // Auto-generate new word after failed attempt
      setTimeout(() => {
        this.attack();
      }, 500);
    }

    this.updateUI();
  }

  showDamageNumber(damage, combo) {
    const damageElement = document.createElement("div");
    damageElement.className = "damage-number";
    damageElement.textContent = damage;

    // Add combo text if combo > 1
    if (combo > 1) {
      const comboElement = document.createElement("div");
      comboElement.className = "combo-text";
      comboElement.textContent = `${combo}x Combo!`;
      damageElement.appendChild(comboElement);
    }

    // Position the damage number
    const wordDisplayRect =
      this.domElements.wordDisplay.getBoundingClientRect();
    damageElement.style.left = `${
      wordDisplayRect.left + wordDisplayRect.width / 2
    }px`;
    damageElement.style.top = `${wordDisplayRect.top}px`;

    document.body.appendChild(damageElement);

    // Remove after animation
    setTimeout(() => damageElement.remove(), 1000);
  }

  showCriticalEffect() {
    const criticalElement = document.createElement("div");
    criticalElement.className = "critical-effect";
    criticalElement.textContent = "CRITICAL!";

    // Position the critical effect
    const wordDisplayRect =
      this.domElements.wordDisplay.getBoundingClientRect();
    criticalElement.style.left = `${
      wordDisplayRect.left + wordDisplayRect.width / 2
    }px`;
    criticalElement.style.top = `${wordDisplayRect.top - 50}px`;

    document.body.appendChild(criticalElement);

    // Remove after animation
    setTimeout(() => criticalElement.remove(), 1000);
  }

  levelUp() {
    // Clear any existing timer and word
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.domElements.timer.style.width = "0%";
    this.currentWord = "";
    this.domElements.wordDisplay.textContent = "";
    this.domElements.wordDisplay.setAttribute("data-placeholder", "");

    // Temporarily disable input
    this.domElements.wordDisplay.contentEditable = false;

    // Update level up modal content
    this.domElements.currentLevel.textContent = this.level + 1;
    this.domElements.currentPoints.textContent = this.points;

    // Show level up modal
    this.showModal("levelup-modal");
  }

  proceedToNextLevel() {
    this.level++;
    this.bossHealth = this.level * 100;
    this.failDamage = this.level;
    this.attackPower = Math.ceil(this.level / 3);
    this.combo = 0; // Reset combo on level up

    // Re-enable input
    this.domElements.wordDisplay.contentEditable = true;

    this.updateUI();
    this.attack();

    // Auto focus the word display area
    requestAnimationFrame(() => {
      this.domElements.wordDisplay.focus();

      // Set cursor to the beginning of the input
      const range = document.createRange();
      const sel = window.getSelection();
      range.setStart(this.domElements.wordDisplay, 0);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    });
  }

  gameOver() {
    this.domElements.finalLevel.textContent = this.level;
    this.domElements.finalPoints.textContent = this.points;
    this.showModal("gameover-modal");
  }

  togglePause() {
    if (!this.gameStarted) return;

    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      // Save current timer state
      if (this.timerInterval) {
        const currentWidth =
          parseFloat(this.domElements.timer.style.width) || 0;
        const timeLimit = Math.max(1, this.currentWord.length * 0.5);
        const timeLeft = (currentWidth / 100) * timeLimit;

        this.savedTimerState = {
          timeLimit: timeLimit,
          timeLeft: timeLeft,
          backgroundColor: this.domElements.timer.style.backgroundColor,
          currentWord: this.currentWord,
        };
        clearInterval(this.timerInterval);
      }

      // Disable input
      this.domElements.wordDisplay.contentEditable = false;

      // Show pause modal
      this.showModal("pause-modal");
    } else {
      // Restore timer state if it was active
      if (this.savedTimerState) {
        // Restore current word
        this.currentWord = this.savedTimerState.currentWord;
        this.domElements.wordDisplay.setAttribute(
          "data-placeholder",
          this.currentWord
        );

        this.startTimer();
        this.savedTimerState = null;
      }

      // Enable input
      this.domElements.wordDisplay.contentEditable = true;

      // Hide pause modal
      this.hideModal("pause-modal");

      // Focus word display
      this.domElements.wordDisplay.focus();
    }
  }
}

// Initialize game
window.onload = () => {
  new TypingGame();
};