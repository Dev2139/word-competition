document.addEventListener('DOMContentLoaded', () => {

    // Check if the browser supports Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Sorry, your browser does not support Speech Recognition. Please try Google Chrome.");
        return;
    }
    const recognition = new SpeechRecognition();

    // --- Element References ---
    const team1LetterInput = document.getElementById('team1-letter');
    const team2LetterInput = document.getElementById('team2-letter');
    const displayTeam1Letter = document.getElementById('display-team1-letter');
    const displayTeam2Letter = document.getElementById('display-team2-letter');
    const score1El = document.getElementById('score1');
    const score2El = document.getElementById('score2');
    const wordList1El = document.getElementById('word-list1');
    const wordList2El = document.getElementById('word-list2');
    const speakButtons = document.querySelectorAll('.speak-btn');
    const saveBtn = document.getElementById('save-btn');
    const photoBtn = document.getElementById('photo-btn');
    const endBtn = document.getElementById('end-btn');

    // Check if buttons exist and add error handling
    if (!photoBtn) {
        console.error('Photo button not found!');
    }
    if (!endBtn) {
        console.error('End button not found!');
    }

    // --- Game State ---
    let team1 = {
        score: 0,
        words: [],
        letter: ''
    };
    let team2 = {
        score: 0,
        words: [],
        letter: ''
    };

    // --- Turn System ---
    let currentTurn = 1; // 1 for team 1, 2 for team 2
    let isListening = false;

    // --- Speech Recognition Settings ---
    recognition.lang = 'gu-IN'; // Set language to Gujarati (India)
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    // --- Event Listeners ---

    // Update display letter when user types in the input box
    team1LetterInput.addEventListener('input', () => {
        team1.letter = team1LetterInput.value;
        displayTeam1Letter.textContent = team1.letter || '?';
        updateTurnDisplay(); // Update turn display when letter changes
    });
    team2LetterInput.addEventListener('input', () => {
        team2.letter = team2LetterInput.value;
        displayTeam2Letter.textContent = team2.letter || '?';
        updateTurnDisplay(); // Update turn display when letter changes
    });
    
    // Add click listener to both "Speak" buttons
    speakButtons.forEach(button => {
        button.addEventListener('click', () => {
            const teamNumber = button.dataset.team;
            startListening(teamNumber);
        });
    });

    if (saveBtn) {
        saveBtn.addEventListener('click', saveResults);
    }
    
    // Photo functionality commented out for now
    /*
    if (photoBtn) {
        photoBtn.addEventListener('click', () => {
            console.log('Photo button clicked');
            try {
                takePhoto();
            } catch (error) {
                console.error('Photo error:', error);
                alert('Photo functionality failed. Please try again.');
            }
        });
    }
    */
    
    if (endBtn) {
        endBtn.addEventListener('click', () => {
            console.log('End button clicked');
            try {
                endGame();
            } catch (error) {
                console.error('End error:', error);
                alert('End functionality failed. Please try again.');
            }
        });
    }
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (event) => {
        if (event.ctrlKey && event.key === 's') {
            event.preventDefault();
            showTotalStats();
        }
    });

    // --- Functions ---

    function updateTurnDisplay() {
        // Update button states based on current turn
        const team1Button = document.querySelector('.speak-btn[data-team="1"]');
        const team2Button = document.querySelector('.speak-btn[data-team="2"]');
        
        // Check if both teams have letters set
        const bothLettersSet = team1.letter && team2.letter;
        
        if (currentTurn === 1) {
            team1Button.disabled = isListening || !bothLettersSet;
            team2Button.disabled = true;
            team1Button.style.opacity = isListening ? '0.7' : (bothLettersSet ? '1' : '0.5');
            team2Button.style.opacity = '0.5';
            team1Button.style.cursor = isListening ? 'not-allowed' : (bothLettersSet ? 'pointer' : 'not-allowed');
            team2Button.style.cursor = 'not-allowed';
        } else {
            team1Button.disabled = true;
            team2Button.disabled = isListening || !bothLettersSet;
            team1Button.style.opacity = '0.5';
            team2Button.style.opacity = isListening ? '0.7' : (bothLettersSet ? '1' : '0.5');
            team1Button.style.cursor = 'not-allowed';
            team2Button.style.cursor = isListening ? 'not-allowed' : (bothLettersSet ? 'pointer' : 'not-allowed');
        }
        
        // Update turn indicator only if both letters are set
        if (bothLettersSet) {
            updateTurnIndicator();
        } else {
            // Remove turn indicator if letters are not set
            const existingIndicator = document.querySelector('.turn-indicator');
            if (existingIndicator) {
                existingIndicator.remove();
            }
        }
    }

    function updateTurnIndicator() {
        // Remove existing turn indicator
        let existingIndicator = document.querySelector('.turn-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        // Create new turn indicator
        const indicator = document.createElement('div');
        indicator.className = 'turn-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${currentTurn === 1 ? '#ff6b6b' : '#48dbfb'};
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            font-weight: bold;
            font-size: 18px;
            z-index: 1000;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            animation: pulse 2s infinite;
        `;
        
        indicator.textContent = `ટીમ ${currentTurn} નો વારો ${isListening ? ' (બોલી રહ્યા છે...)' : ''}`;
        
        // Add pulse animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { transform: translateX(-50%) scale(1); }
                50% { transform: translateX(-50%) scale(1.05); }
                100% { transform: translateX(-50%) scale(1); }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(indicator);
    }

    function switchTurn() {
        currentTurn = currentTurn === 1 ? 2 : 1;
        updateTurnDisplay();
    }

    function startListening(teamNumber) {
        // Check if it's the correct team's turn
        if (parseInt(teamNumber) !== currentTurn) {
            alert(`આ ટીમ ${teamNumber} નો વારો નથી. કૃપા કરી ટીમ ${currentTurn} નો વારો પૂરો કરો.`);
            return;
        }

        const currentTeam = teamNumber === '1' ? team1 : team2;
        if (!currentTeam.letter) {
            alert(`કૃપા કરી ટીમ ${teamNumber} માટે પહેલા બારાક્ષરી સેટ કરો!`);
            return;
        }
        
        isListening = true;
        updateTurnDisplay();
        
        // Change button text to show it's listening
        const button = document.querySelector(`.speak-btn[data-team="${teamNumber}"]`);
        button.textContent = "Listening...";

        recognition.start();

        recognition.onresult = (event) => {
            const spokenWord = event.results[0][0].transcript.trim();
            processWord(spokenWord, teamNumber);
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            alert(`Error in recognition: ${event.error}`);
            isListening = false;
            updateTurnDisplay();
        };
        
        recognition.onend = () => {
            isListening = false;
            // Revert button text and state when listening stops
            button.textContent = "શબ્દ બોલો";
            updateTurnDisplay();
        };
    }

    function processWord(word, teamNumber) {
        const teamData = (teamNumber === '1') ? team1 : team2;
        const scoreEl = (teamNumber === '1') ? score1El : score2El;
        const wordListEl = (teamNumber === '1') ? wordList1El : wordList2El;
        const button = document.querySelector(`.speak-btn[data-team="${teamNumber}"]`);

        // Strict validation: word must start with the exact letter
        if (!word.startsWith(teamData.letter)) {
            showRejectionMessage(teamNumber, word, `શબ્દ "${word}" એ "${teamData.letter}" થી શરૂ થતો નથી`);
            blockButton(teamNumber, 3000); // Block button for 3 seconds
            // Switch turn immediately for invalid word
            setTimeout(() => {
                switchTurn();
            }, 1500);
            return;
        }

        const li = document.createElement('li');
        li.textContent = word;

        // Check for repeats
        if (teamData.words.includes(word)) {
            // It's a repeat word
            teamData.score--;
            li.classList.add('repeated-word');
            li.innerHTML = `${word} <span style="color: red; font-size: 0.8em;">(જૂનું)</span>`;
            showRepeatedWordMessage(teamNumber, word);
            blockButton(teamNumber, 2000); // Block button for 2 seconds for repeated words
            // Switch turn immediately for repeated word
            setTimeout(() => {
                switchTurn();
            }, 1500);
        } else {
            // It's a new word
            teamData.score++;
            teamData.words.push(word);
            li.innerHTML = `${word} <span style="color: green; font-size: 0.8em;">(નવું)</span>`;
            showWordAcceptedMessage(teamNumber, word);
            
            // Update UI
            scoreEl.textContent = teamData.score;
            wordListEl.appendChild(li);
            wordListEl.scrollTop = wordListEl.scrollHeight; // Auto-scroll to the bottom
            
            // Update word count display
            updateWordCount(teamNumber);
            
            // Switch turn after processing the word
            setTimeout(() => {
                switchTurn();
            }, 1500);
        }
    }
    
    function blockButton(teamNumber, duration) {
        const button = document.querySelector(`.speak-btn[data-team="${teamNumber}"]`);
        if (!button) return;
        
        // Store original button state
        const originalText = button.textContent;
        const originalDisabled = button.disabled;
        const originalOpacity = button.style.opacity;
        const originalCursor = button.style.cursor;
        
        // Block the button
        button.disabled = true;
        button.style.opacity = '0.5';
        button.style.cursor = 'not-allowed';
        
        // Show blocking message
        showButtonBlockedMessage(teamNumber, duration);
        
        // Start countdown timer
        let timeLeft = Math.ceil(duration / 1000);
        const countdownInterval = setInterval(() => {
            if (button && timeLeft > 0) {
                button.textContent = `બ્લોક કરેલું (${timeLeft}s)`;
                timeLeft--;
            } else {
                clearInterval(countdownInterval);
                if (button) {
                    // Only restore if it's still this team's turn
                    if (parseInt(teamNumber) === currentTurn && !isListening) {
                        button.disabled = false;
                        button.style.opacity = '1';
                        button.style.cursor = 'pointer';
                        button.textContent = 'શબ્દ બોલો';
                    } else {
                        // If it's not their turn, keep it disabled but restore text
                        button.disabled = true;
                        button.style.opacity = '0.5';
                        button.style.cursor = 'not-allowed';
                        button.textContent = 'શબ્દ બોલો';
                    }
                }
            }
        }, 1000);
        
        // Initial countdown display
        button.textContent = `બ્લોક કરેલું (${timeLeft}s)`;
    }
    
    function showButtonBlockedMessage(teamNumber, duration) {
        const message = document.createElement('div');
        message.className = 'button-blocked-message';
        
        // Determine the reason for blocking
        let reason = '';
        if (duration === 3000) {
            reason = 'અયોગ્ય શબ્દ બોલવાને કારણે';
        } else if (duration === 2000) {
            reason = 'જૂનો શબ્દ બોલવાને કારણે';
        }
        
        message.innerHTML = `
            <div class="message-content">
                <div class="block-icon">🚫</div>
                <div class="message-text">
                    <div class="block-title">બટન બ્લોક કરેલું!</div>
                    <div class="block-subtitle">ટીમ ${teamNumber} નો બટન ${duration/1000} સેકન્ડ માટે બ્લોક કરેલું છે</div>
                    <div class="block-reason">${reason}</div>
                </div>
            </div>
        `;
        
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #dc3545, #c82333);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            z-index: 1000;
            box-shadow: 0 5px 15px rgba(220, 53, 69, 0.3);
            animation: buttonBlockedIn 0.5s ease-out;
            font-weight: bold;
            font-size: 14px;
            max-width: 300px;
        `;
        
        document.body.appendChild(message);
        
        // Auto-remove after duration
        setTimeout(() => {
            message.style.animation = 'buttonBlockedOut 0.5s ease-in';
            setTimeout(() => {
                if (document.body.contains(message)) {
                    document.body.removeChild(message);
                }
            }, 500);
        }, duration);
    }
    
    function updateWordCount(teamNumber) {
        const teamData = (teamNumber === '1') ? team1 : team2;
        const wordListEl = (teamNumber === '1') ? wordList1El : wordList2El;
        
        // Add word count display if it doesn't exist
        let countDisplay = wordListEl.parentElement.querySelector('.word-count');
        if (!countDisplay) {
            countDisplay = document.createElement('div');
            countDisplay.className = 'word-count';
            countDisplay.style.cssText = 'font-size: 0.9em; color: #666; margin-top: 5px; font-weight: bold;';
            wordListEl.parentElement.appendChild(countDisplay);
        }
        
        const uniqueWords = teamData.words.length;
        const totalWords = teamData.words.length + (teamData.words.length - uniqueWords);
        countDisplay.textContent = `કુલ શબ્દો: ${uniqueWords} | સ્કોર: ${teamData.score}`;
    }
    
    function showWordAcceptedMessage(teamNumber, word) {
        const message = document.createElement('div');
        message.className = 'word-accepted-message';
        message.innerHTML = `
            <div class="message-content">
                <div class="checkmark">✅</div>
                <div class="message-text">
                    <div class="word-text">"${word}"</div>
                    <div class="status-text">શબ્દ સ્વીકારાયું!</div>
                </div>
            </div>
        `;
        
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #28a745, #20c997);
            color: white;
            padding: 20px 30px;
            border-radius: 15px;
            z-index: 1000;
            box-shadow: 0 10px 30px rgba(40, 167, 69, 0.3);
            animation: wordAcceptedIn 0.6s ease-out;
            font-weight: bold;
            font-size: 18px;
            text-align: center;
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.style.animation = 'wordAcceptedOut 0.5s ease-in';
            setTimeout(() => {
                if (document.body.contains(message)) {
                    document.body.removeChild(message);
                }
            }, 500);
        }, 2000);
    }
    
    function showRepeatedWordMessage(teamNumber, word) {
        const message = document.createElement('div');
        message.className = 'repeated-word-message';
        message.innerHTML = `
            <div class="message-content">
                <div class="warning">⚠️</div>
                <div class="message-text">
                    <div class="word-text">"${word}"</div>
                    <div class="status-text">શબ્દ પહેલાથી છે!</div>
                </div>
            </div>
        `;
        
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #ffc107, #fd7e14);
            color: white;
            padding: 20px 30px;
            border-radius: 15px;
            z-index: 1000;
            box-shadow: 0 10px 30px rgba(255, 193, 7, 0.3);
            animation: repeatedWordIn 0.6s ease-out;
            font-weight: bold;
            font-size: 18px;
            text-align: center;
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.style.animation = 'repeatedWordOut 0.5s ease-in';
            setTimeout(() => {
                if (document.body.contains(message)) {
                    document.body.removeChild(message);
                }
            }, 500);
        }, 2000);
    }
    
    function showRejectionMessage(teamNumber, word, reason) {
        const message = document.createElement('div');
        message.className = 'rejection-message';
        message.innerHTML = `
            <div class="message-content">
                <div class="cross">❌</div>
                <div class="message-text">
                    <div class="word-text">"${word}"</div>
                    <div class="status-text">${reason}</div>
                </div>
            </div>
        `;
        
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #dc3545, #e74c3c);
            color: white;
            padding: 20px 30px;
            border-radius: 15px;
            z-index: 1000;
            box-shadow: 0 10px 30px rgba(220, 53, 69, 0.3);
            animation: rejectionIn 0.6s ease-out;
            font-weight: bold;
            font-size: 18px;
            text-align: center;
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.style.animation = 'rejectionOut 0.5s ease-in';
            setTimeout(() => {
                if (document.body.contains(message)) {
                    document.body.removeChild(message);
                }
            }, 500);
        }, 2000);
    }
    
    function saveResults() {
        let content = "શબ્દ સ્પર્ધા - પરિણામ\n\n";
        content += "=====================\n";
        content += `ટીમ 1 (અક્ષર: ${team1.letter})\n`;
        content += `કુલ સ્કોર: ${team1.score}\n`;
        content += `કુલ શબ્દો: ${team1.words.length}\n`;
        content += "શબ્દો:\n";
        team1.words.forEach((word, index) => content += `${index + 1}. ${word}\n`);
        content += "\n=====================\n\n";
        
        content += `ટીમ 2 (અક્ષર: ${team2.letter})\n`;
        content += `કુલ સ્કોર: ${team2.score}\n`;
        content += `કુલ શબ્દો: ${team2.words.length}\n`;
        content += "શબ્દો:\n";
        team2.words.forEach((word, index) => content += `${index + 1}. ${word}\n`);

        // Create a blob and trigger a download
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'shabd-spardha-results.txt';
        link.click();
    }

    function endGame() {
        console.log('endGame function called');
        const confirm = window.confirm("શબ્દ સ્પર્ધા સમાપ્ત કરવાનો નકારાયા છે? આ કાર્ય અનિવાર્ય છે.");
        if (confirm) {
            console.log('User confirmed end action');
            showWinnerAnimation();
            // Refresh data after showing winner animation
            setTimeout(() => {
                refreshGameData();
            }, 6000); // Wait for winner animation to complete (5s) + 1s buffer
        } else {
            console.log('User cancelled end action');
        }
    }
    
    function refreshGameData() {
        // Reset game state
        team1 = {
            score: 0,
            words: [],
            letter: ''
        };
        team2 = {
            score: 0,
            words: [],
            letter: ''
        };
        
        // Reset current turn
        currentTurn = 1;
        isListening = false;
        
        // Clear UI
        score1El.textContent = '0';
        score2El.textContent = '0';
        wordList1El.innerHTML = '';
        wordList2El.innerHTML = '';
        
        // Clear letter inputs
        team1LetterInput.value = '';
        team2LetterInput.value = '';
        displayTeam1Letter.textContent = '?';
        displayTeam2Letter.textContent = '?';
        
        // Remove any existing turn indicators
        const existingIndicator = document.querySelector('.turn-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        // Remove word count displays
        const wordCountDisplays = document.querySelectorAll('.word-count');
        wordCountDisplays.forEach(display => display.remove());
        
        // Update turn display (but don't show indicator until letters are set)
        updateTurnDisplay();
        
        // Show refresh confirmation message
        showRefreshMessage();
    }
    
    function showRefreshMessage() {
        const message = document.createElement('div');
        message.className = 'refresh-message';
        message.innerHTML = `
            <div class="message-content">
                <div class="refresh-icon">🔄</div>
                <div class="message-text">
                    <div class="refresh-title">ડેટા રિફ્રેશ થયું!</div>
                    <div class="refresh-subtitle">નવી સ્પર્ધા શરૂ કરી શકાય છે</div>
                </div>
            </div>
        `;
        
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #17a2b8, #20c997);
            color: white;
            padding: 20px 30px;
            border-radius: 15px;
            z-index: 1000;
            box-shadow: 0 10px 30px rgba(23, 162, 184, 0.3);
            animation: refreshMessageIn 0.6s ease-out;
            font-weight: bold;
            font-size: 18px;
            text-align: center;
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.style.animation = 'refreshMessageOut 0.5s ease-in';
            setTimeout(() => {
                if (document.body.contains(message)) {
                    document.body.removeChild(message);
                }
            }, 500);
        }, 3000);
    }
    
    function showWinnerAnimation() {
        // Determine winner
        let winner = '';
        let winnerScore = 0;
        let winnerColor = '';
        
        if (team1.score > team2.score) {
            winner = 'ટીમ 1';
            winnerScore = team1.score;
            winnerColor = '#ff6b6b';
        } else if (team2.score > team1.score) {
            winner = 'ટીમ 2';
            winnerScore = team2.score;
            winnerColor = '#48dbfb';
        } else {
            winner = 'બંને ટીમ';
            winnerScore = team1.score;
            winnerColor = '#feca57';
        }
        
        // Create winner announcement
        const winnerDiv = document.createElement('div');
        winnerDiv.className = 'winner-announcement';
        winnerDiv.innerHTML = `
            <div class="winner-content">
                <div class="trophy">🏆</div>
                <div class="winner-text">
                    <div class="winner-title">વિજેતા</div>
                    <div class="winner-name">${winner}</div>
                    <div class="winner-score">સ્કોર: ${winnerScore}</div>
                </div>
                <div class="confetti-container">
                    <div class="confetti"></div>
                    <div class="confetti"></div>
                    <div class="confetti"></div>
                    <div class="confetti"></div>
                    <div class="confetti"></div>
                    <div class="confetti"></div>
                    <div class="confetti"></div>
                    <div class="confetti"></div>
                </div>
            </div>
        `;
        
        winnerDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            animation: winnerFadeIn 0.8s ease-out;
        `;
        
        document.body.appendChild(winnerDiv);
        
        // Add winner content styles
        const winnerContent = winnerDiv.querySelector('.winner-content');
        winnerContent.style.cssText = `
            background: linear-gradient(135deg, ${winnerColor}, ${winnerColor}dd);
            color: white;
            padding: 40px 60px;
            border-radius: 20px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            animation: winnerScaleIn 1s ease-out 0.3s both;
            position: relative;
            overflow: hidden;
        `;
        
        // Add trophy animation
        const trophy = winnerDiv.querySelector('.trophy');
        trophy.style.cssText = `
            font-size: 80px;
            margin-bottom: 20px;
            animation: trophyBounce 2s ease-in-out infinite;
        `;
        
        // Add winner text styles
        const winnerTitle = winnerDiv.querySelector('.winner-title');
        winnerTitle.style.cssText = `
            font-size: 24px;
            margin-bottom: 10px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 2px;
        `;
        
        const winnerName = winnerDiv.querySelector('.winner-name');
        winnerName.style.cssText = `
            font-size: 48px;
            margin-bottom: 15px;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        `;
        
        const winnerScoreEl = winnerDiv.querySelector('.winner-score');
        winnerScoreEl.style.cssText = `
            font-size: 20px;
            opacity: 0.9;
        `;
        
        // Add confetti animation
        const confettiElements = winnerDiv.querySelectorAll('.confetti');
        confettiElements.forEach((confetti, index) => {
            confetti.style.cssText = `
                position: absolute;
                width: 10px;
                height: 10px;
                background: ${['#ff6b6b', '#48dbfb', '#feca57', '#ff9ff3', '#54a0ff'][index % 5]};
                animation: confettiFall 3s ease-in infinite;
                animation-delay: ${index * 0.2}s;
                top: -10px;
                left: ${Math.random() * 100}%;
            `;
        });
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            winnerDiv.style.animation = 'winnerFadeOut 0.8s ease-in';
            setTimeout(() => {
                if (document.body.contains(winnerDiv)) {
                    document.body.removeChild(winnerDiv);
                }
            }, 800);
        }, 5000);
    }
    
    function showTotalStats() {
        const totalWords = team1.words.length + team2.words.length;
        const totalScore = team1.score + team2.score;
        
        const statsMessage = `
કુલ આંકડા:
ટીમ 1: ${team1.words.length} શબ્દો, સ્કોર: ${team1.score}
ટીમ 2: ${team2.words.length} શબ્દો, સ્કોર: ${team2.score}
કુલ શબ્દો: ${totalWords}
કુલ સ્કોર: ${totalScore}
        `;
        
        alert(statsMessage);
    }

    // Photo functionality commented out for now
    /*
    function takePhoto() {
        try {
            // Create a modal overlay for the photo
            const photoModal = document.createElement('div');
            photoModal.className = 'photo-modal';
            photoModal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                animation: photoModalIn 0.3s ease-out;
            `;
            
            // Determine winner for styling
            let winner = '';
            let winnerColor = '#feca57';
            if (team1.score > team2.score) {
                winner = 'ટીમ 1';
                winnerColor = '#ff6b6b';
            } else if (team2.score > team1.score) {
                winner = 'ટીમ 2';
                winnerColor = '#48dbfb';
            } else {
                winner = 'બંને ટીમ';
            }
            
            // Create table content for both teams
            let team1WordsHtml = '';
            team1.words.forEach((word, index) => {
                team1WordsHtml += `<tr><td>${index + 1}</td><td>${word}</td></tr>`;
            });
            
            let team2WordsHtml = '';
            team2.words.forEach((word, index) => {
                team2WordsHtml += `<tr><td>${index + 1}</td><td>${word}</td></tr>`;
            });
            
            // Create the photo content
            const photoContent = document.createElement('div');
            photoContent.className = 'photo-content';
            photoContent.innerHTML = `
                <div class="photo-header">
                    <div class="school-name">જડિયાણા પ્રાથમિક શાળા</div>
                    <div class="school-location">તા/જી - છોટાઉદેપુર</div>
                </div>
                
                <div style="padding: 20px;">
                    <h1>શબ્દ સ્પર્ધા - પરિણામ</h1>
                    
                    <div class="results-summary">
                        <div class="team-summary team1-summary">
                            <div class="team-letter">ટીમ 1 (${team1.letter})</div>
                            <div class="team-score">${team1.score}</div>
                            <div class="team-word-count">${team1.words.length} શબ્દો</div>
                        </div>
                        <div class="team-summary team2-summary">
                            <div class="team-letter">ટીમ 2 (${team2.letter})</div>
                            <div class="team-score">${team2.score}</div>
                            <div class="team-word-count">${team2.words.length} શબ્દો</div>
                        </div>
                    </div>
                    
                    <div class="winner-section" style="background: linear-gradient(135deg, ${winnerColor}, ${winnerColor}dd); color: white;">
                        🏆 વિજેતા: ${winner} 🏆
                    </div>
                    
                    <div class="tables-container">
                        <div class="team-table-section">
                            <div class="team-table-title team1-title">ટીમ 1 ના શબ્દો</div>
                            <table>
                                <thead>
                                    <tr>
                                        <th>ક્રમ</th>
                                        <th>શબ્દ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${team1.words.length > 0 ? team1WordsHtml : '<tr><td colspan="2" class="no-words">કોઈ શબ્દો નથી</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                        
                        <div class="team-table-section">
                            <div class="team-table-title team2-title">ટીમ 2 ના શબ્દો</div>
                            <table>
                                <thead>
                                    <tr>
                                        <th>ક્રમ</th>
                                        <th>શબ્દ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${team2.words.length > 0 ? team2WordsHtml : '<tr><td colspan="2" class="no-words">કોઈ શબ્દો નથી</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div class="photo-footer">
                        <p>શબ્દ સ્પર્ધા પરિણામ - તારીખ: ${new Date().toLocaleDateString('gu-IN')}</p>
                        <p>By - દેવ પટેલ | Mo - 6354236105</p>
                    </div>
                </div>
                
                <div class="photo-controls">
                    <button class="download-btn" onclick="downloadPhoto()">📥 ડાઉનલોડ કરો</button>
                    <button class="close-btn" onclick="closePhotoModal()">❌ બંધ કરો</button>
                </div>
            `;
            
            photoContent.style.cssText = `
                background: white;
                padding: 30px;
                border-radius: 15px;
                max-width: 90%;
                max-height: 90%;
                overflow-y: auto;
                position: relative;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                animation: photoContentIn 0.5s ease-out;
            `;
            
            photoModal.appendChild(photoContent);
            document.body.appendChild(photoModal);
            
            // Add global functions for the buttons
            window.downloadPhoto = function() {
                html2canvas(photoContent, {
                    backgroundColor: 'white',
                    scale: 2,
                    useCORS: true,
                    allowTaint: true
                }).then(canvas => {
                    const link = document.createElement('a');
                    link.download = `shabd-spardha-result-${new Date().toISOString().slice(0,10)}.png`;
                    link.href = canvas.toDataURL();
                    link.click();
                }).catch(error => {
                    console.error('Photo download error:', error);
                    alert('ફોટો ડાઉનલોડ કરવામાં ભૂલ આવી. કૃપા કરી ફરીથી પ્રયાસ કરો.');
                });
            };
            
            window.closePhotoModal = function() {
                photoModal.style.animation = 'photoModalOut 0.3s ease-in';
                setTimeout(() => {
                    if (document.body.contains(photoModal)) {
                        document.body.removeChild(photoModal);
                    }
                }, 300);
            };
            
            // Close modal on background click
            photoModal.addEventListener('click', (e) => {
                if (e.target === photoModal) {
                    window.closePhotoModal();
                }
            });
            
            // Close modal on Escape key
            document.addEventListener('keydown', function closeOnEscape(e) {
                if (e.key === 'Escape') {
                    window.closePhotoModal();
                    document.removeEventListener('keydown', closeOnEscape);
                }
            });
            
        } catch (error) {
            console.error('Photo error:', error);
            alert('ફોટો બનાવવામાં ભૂલ આવી. કૃપા કરી ફરીથી પ્રયાસ કરો.');
        }
    }
    */

    // Initialize turn display (but don't show indicator until letters are set)
    updateTurnDisplay();
    
    // Add visual feedback to confirm buttons are loaded
    console.log('DOM loaded successfully');
    console.log('Photo button found:', !!photoBtn);
    console.log('End button found:', !!endBtn);
    
    // Add a simple test to verify buttons are clickable
    if (photoBtn) {
        photoBtn.style.border = '2px solid #28a745';
    }
    if (endBtn) {
        endBtn.style.border = '2px solid #dc3545';
    }
});