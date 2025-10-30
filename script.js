document.addEventListener("DOMContentLoaded", () => {
  // --- Global Variables ---
  let socket;
  let currentRoomID = null;
  let isMultiplayer = false;
  
  // Local (single-player) game state
  let localGame = {
    team1: { score: 0, words: [], letter: "" },
    team2: { score: 0, words: [], letter: "" },
    currentTurn: 1
  };
  let isListening = false;

  // --- Speech Recognition Setup ---
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("તમારો બ્રાઉઝર Speech Recognition સપોર્ટ નથી કરતો. કૃપા કરીને Chrome વાપરો.");
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = "gu-IN";
  recognition.continuous = false;
  recognition.interimResults = false;

  // --- Element Cache ---
  const gameModeSelection = document.getElementById("game-mode-selection");
  const roomSetup = document.getElementById("room-setup");
  const gameContainer = document.getElementById("game-container");

  const singlePlayerBtn = document.getElementById("single-player-btn");
  const multiplayerBtn = document.getElementById("multiplayer-btn");
  const createRoomBtn = document.getElementById("create-room-btn");
  const joinRoomBtn = document.getElementById("join-room-btn");
  const roomIDInput = document.getElementById("room-id");
  const roomMessage = document.getElementById("room-message");

  const team1LetterInput = document.getElementById("team1-letter");
  const team2LetterInput = document.getElementById("team2-letter");
  const displayTeam1Letter = document.getElementById("display-team1-letter");
  const displayTeam2Letter = document.getElementById("display-team2-letter");
  const score1El = document.getElementById("score1");
  const score2El = document.getElementById("score2");
  const wordList1El = document.getElementById("word-list1");
  const wordList2El = document.getElementById("word-list2");
  const speakButtons = document.querySelectorAll(".speak-btn");
  const endBtn = document.getElementById("end-btn");
  const printBtn = document.getElementById("print-btn");
  const winnerModal = document.getElementById("winner-modal");

  // --- Game Mode Selection ---
  singlePlayerBtn.addEventListener("click", () => {
    isMultiplayer = false;
    gameModeSelection.style.display = "none";
    gameContainer.style.display = "block";
  });

  multiplayerBtn.addEventListener("click", () => {
    isMultiplayer = true;
    gameModeSelection.style.display = "none";
    roomSetup.style.display = "block";
    connectSocket(); // Connect to the server
  });

  // --- Letter Inputs ---
  team1LetterInput.addEventListener("input", handleLetterChange);
  team2LetterInput.addEventListener("input", handleLetterChange);

  function handleLetterChange() {
    const t1Letter = team1LetterInput.value.trim();
    const t2Letter = team2LetterInput.value.trim();
    
    if (isMultiplayer && socket && currentRoomID) {
      // Send letter state to server
      socket.emit('setLetters', {
        roomID: currentRoomID,
        team1Letter: t1Letter,
        team2Letter: t2Letter
      });
    } else {
      // Update local game state
      localGame.team1.letter = t1Letter;
      localGame.team2.letter = t2Letter;
      updateUI(localGame); // Update UI locally
    }
  }

  // --- Socket.io Connection & Events ---
  function connectSocket() {
    socket = io(); // Connects to the server that served the page

    createRoomBtn.addEventListener("click", () => {
      console.log("CLIENT: 'Create Room' button clicked. Sending 'createRoom' to server..."); 
      socket.emit("createRoom");
    });

    joinRoomBtn.addEventListener("click", () => {
      const roomID = roomIDInput.value.trim();
      if (roomID) {
        socket.emit("joinRoom", roomID);
      }
    });

    // --- Listen for Server Events ---
    
    // *** UPDATED THIS FUNCTION ***
    socket.on('roomCreated', (roomID) => {
      console.log('CLIENT: Received "roomCreated" event from server with ID:', roomID);
      currentRoomID = roomID;
      
      // Update the message
      roomMessage.textContent = `Game Code: ${roomID}`;
      
      // Get the copy button (which is in index.html)
      const copyBtn = document.getElementById('copy-room-btn');
      copyBtn.style.display = 'inline-block'; // Make the button visible

      // Add click event to copy the code
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(roomID).then(() => {
          // Success!
          copyBtn.textContent = 'Copied!';
          copyBtn.style.backgroundColor = '#28a745'; // Green
          setTimeout(() => {
            copyBtn.textContent = 'Copy';
            copyBtn.style.backgroundColor = '#6c757d'; // Grey
          }, 2000); // Reset after 2 seconds
        }).catch(err => {
          // Error
          console.error('Failed to copy text: ', err);
          alert('Failed to copy. Please copy the code manually.');
        });
      });

      // Hide the room setup and show the game
      roomSetup.style.display = "none";
      gameContainer.style.display = "block";
    });

    socket.on('userJoined', (msg) => {
      // This is received by the person ALREADY in the room
      roomMessage.textContent = msg;
    });

    socket.on('gameStateUpdate', (gameState) => {
      // This is the MAIN update function. The server sends the new state.
      // Both players (and local state) are updated from this.
      if (isMultiplayer) {
         localGame = gameState; // Sync local state with server state
         roomSetup.style.display = "none";
         gameContainer.style.display = "block";
         updateUI(localGame);
      }
    });

    socket.on('showMessage', (data) => {
      showMessage(data.msg, data.type);
    });

    socket.on('errorMsg', (msg) => {
      roomMessage.textContent = `Error: ${msg}`;
    });
  }

  // --- Main UI Update Function ---
  function updateUI(state) {
    displayTeam1Letter.textContent = state.team1.letter || "?";
    displayTeam2Letter.textContent = state.team2.letter || "?";
    score1El.textContent = state.team1.score;
    score2El.textContent = state.team2.score;

    // Re-render word lists (to ensure sync)
    wordList1El.innerHTML = "";
    state.team1.words.forEach(word => {
        const li = document.createElement("li");
        li.textContent = word;
        li.classList.add("word-accepted"); // Assume server only sends valid words
        wordList1El.appendChild(li);
    });

    wordList2El.innerHTML = "";
    state.team2.words.forEach(word => {
        const li = document.createElement("li");
        li.textContent = word;
        li.classList.add("word-accepted");
        wordList2El.appendChild(li);
    });
    
    // Update input fields if they don't match (e.g., for user joining)
    if (team1LetterInput.value !== state.team1.letter) {
      team1LetterInput.value = state.team1.letter;
    }
    if (team2LetterInput.value !== state.team2.letter) {
      team2LetterInput.value = state.team2.letter;
    }

    updateTurnDisplay(state.currentTurn, state.team1.letter, state.team2.letter);
  }

  // --- Speech Recognition Logic ---
  speakButtons.forEach((btn) => {
    btn.addEventListener("click", () => startListening(btn.dataset.team));
  });

  function startListening(teamNumber) {
    const currentTeamLetter = (teamNumber === "1") ? localGame.team1.letter : localGame.team2.letter;
    
    if (parseInt(teamNumber) !== localGame.currentTurn) {
      alert(`આ ટીમ ${teamNumber} નો વારો નથી.`);
      return;
    }
    if (!currentTeamLetter) {
      alert(`કૃપા કરીને ટીમ ${teamNumber} માટે અક્ષર નાખો!`);
      return;
    }

    isListening = true;
    updateTurnDisplay(localGame.currentTurn, localGame.team1.letter, localGame.team2.letter);
    recognition.start();

    recognition.onresult = (event) => {
      const spokenWord = event.results[0][0].transcript.trim();
      
      if (isMultiplayer) {
        // Send word to server for validation
        socket.emit('speakWord', {
          roomID: currentRoomID,
          word: spokenWord,
          teamNumber: teamNumber
        });
      } else {
        // Process word locally
        processWordLocally(spokenWord, teamNumber);
      }
    };
    
    recognition.onend = () => {
      isListening = false;
      updateTurnDisplay(localGame.currentTurn, localGame.team1.letter, localGame.team2.letter);
    };
  }

  // --- Turn & Button Display ---
  function updateTurnDisplay(currentTurn, letter1, letter2) {
    const team1Button = document.querySelector('.speak-btn[data-team="1"]');
    const team2Button = document.querySelector('.speak-btn[data-team="2"]');
    const bothLettersSet = letter1 && letter2;

    team1Button.disabled = currentTurn !== 1 || !bothLettersSet || isListening;
    team2Button.disabled = currentTurn !== 2 || !bothLettersSet || isListening;
  }

  function switchLocalTurn() {
    localGame.currentTurn = localGame.currentTurn === 1 ? 2 : 1;
    updateTurnDisplay(localGame.currentTurn, localGame.team1.letter, localGame.team2.letter);
  }
  
  // --- SINGLE PLAYER: Local Word Processing ---
  function processWordLocally(word, teamNumber) {
    const teamData = teamNumber === "1" ? localGame.team1 : localGame.team2;
    const otherTeamData = teamNumber === "1" ? localGame.team2 : localGame.team1;
    const scoreEl = teamNumber === "1" ? score1El : score2El;
    const wordListEl = teamNumber === "1" ? wordList1El : wordList2El;

    if (!word.startsWith(teamData.letter)) {
      teamData.score--;
      showMessage(`❌ "${word}" ખોટો છે, "${teamData.letter}" થી શરૂ થતો નથી!`, "error");
      scoreEl.textContent = teamData.score;
      switchLocalTurn();
      return;
    }
    
    const li = document.createElement("li");

    if (teamData.words.includes(word) || otherTeamData.words.includes(word)) {
      li.textContent = word;
      li.classList.add("word-repeated");
      wordListEl.appendChild(li);

      teamData.score--;
      showMessage(`⚠️ "${word}" પહેલાથી બોલાયું છે!`, "warning");
      scoreEl.textContent = teamData.score;
      switchLocalTurn();
      return;
    }

    teamData.score++;
    teamData.words.push(word);
    li.textContent = word;
    li.classList.add("word-accepted");
    wordListEl.appendChild(li);

    scoreEl.textContent = teamData.score;
    showMessage(`🎉 અભિનંદન! "${word}" સ્વીકારવામાં આવ્યું ✅`, "success");
    switchLocalTurn();
  }

  // --- Utility Functions (Unchanged) ---
  function showMessage(msg, type) {
    const messageBox = document.createElement("div");
    messageBox.classList.add("message", type);
    messageBox.textContent = msg;
    document.body.appendChild(messageBox);

    setTimeout(() => {
      messageBox.classList.add("fade-out");
      setTimeout(() => messageBox.remove(), 500);
    }, 2000);
  }
  
  function startConfetti() {
    const container = document.getElementById("confetti-container");
    container.innerHTML = "";
    for (let i = 0; i < 100; i++) {
      const confetti = document.createElement("div");
      confetti.classList.add("confetti");
      confetti.style.left = Math.random() * 100 + "vw";
      confetti.style.backgroundColor = `hsl(${Math.random() * 360},70%,50%)`;
      confetti.style.animationDuration = 2 + Math.random() * 3 + "s";
      container.appendChild(confetti);
    }
  }

  endBtn.addEventListener("click", () => {
    // This logic works for both modes as localGame is always in sync
    const team1Score = localGame.team1.score;
    const team2Score = localGame.team2.score;

    let winnerText = "";
    if (team1Score > team2Score) {
      winnerText = "🏆 ટીમ 1 જીત્યું!";
    } else if (team2Score > team1Score) {
      winnerText = "🏆 ટીમ 2 જીત્યું!";
    } else {
      winnerText = "🤝 મેચ ડ્રો!";
    }

    document.getElementById("winner-team").textContent = winnerText;
    document.getElementById("final-score1").textContent = team1Score;
    document.getElementById("final-score2").textContent = team2Score;
    winnerModal.style.display = "flex";
    startConfetti();
  });

  printBtn.addEventListener("click", () => {
    // This also works for both modes
    const team1Words = localGame.team1.words.join(", ");
    const team2Words = localGame.team2.words.join(", ");

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head><title>Word List Print</title>
          <style>
            body { font-family: 'Noto Sans Gujarati', Arial, sans-serif; padding: 20px; }
            h1 { color: #0056b3; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #333; padding: 10px; text-align: left; }
            th { background: #f2f2f2; }
          </style>
        </AD>
        <body>
          <h1>શબ્દ સ્પર્ધા - બોલાયેલા શબ્દો</h1>
          <table>
            <tr><th>ટીમ</th><th>શબ્દો</th></tr>
            <tr><td>ટીમ 1</td><td>${team1Words || "કોઈ શબ્દ બોલાયો નથી"}</td></tr>
            <tr><td>ટીમ 2</td><td>${team2Words || "કોઈ શબ્દ બોલાયો નથી"}</td></tr>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  });
  
  // Initial UI state (disabled buttons)
  updateTurnDisplay(localGame.currentTurn, localGame.team1.letter, localGame.team2.letter);
});