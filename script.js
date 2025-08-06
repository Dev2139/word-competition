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
    const printBtn = document.getElementById('print-btn');
    const endBtn = document.getElementById('end-btn');

    // Check if buttons exist and add error handling
    if (!printBtn) {
        console.error('Print button not found!');
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
    });
    team2LetterInput.addEventListener('input', () => {
        team2.letter = team2LetterInput.value;
        displayTeam2Letter.textContent = team2.letter || '?';
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
    
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            console.log('Print button clicked');
            try {
                printResults();
            } catch (error) {
                console.error('Print error:', error);
                alert('Print functionality failed. Please try again.');
            }
        });
    }
    
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
        
        if (currentTurn === 1) {
            team1Button.disabled = isListening;
            team2Button.disabled = true;
            team1Button.style.opacity = isListening ? '0.7' : '1';
            team2Button.style.opacity = '0.5';
            team1Button.style.cursor = isListening ? 'not-allowed' : 'pointer';
            team2Button.style.cursor = 'not-allowed';
        } else {
            team1Button.disabled = true;
            team2Button.disabled = isListening;
            team1Button.style.opacity = '0.5';
            team2Button.style.opacity = isListening ? '0.7' : '1';
            team1Button.style.cursor = 'not-allowed';
            team2Button.style.cursor = isListening ? 'not-allowed' : 'pointer';
        }
        
        // Update turn indicator
        updateTurnIndicator();
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

        // Strict validation: word must start with the exact letter
        if (!word.startsWith(teamData.letter)) {
            showRejectionMessage(teamNumber, word, `શબ્દ "${word}" એ "${teamData.letter}" થી શરૂ થતો નથી`);
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
        } else {
            // It's a new word
            teamData.score++;
            teamData.words.push(word);
            li.innerHTML = `${word} <span style="color: green; font-size: 0.8em;">(નવું)</span>`;
            showWordAcceptedMessage(teamNumber, word);
        }

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
        
        // Update turn display
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

    function printResults() {
        try {
            // Create a new window for printing
            const printWindow = window.open('', '_blank');
            
            if (!printWindow) {
                alert('પોપ-અપ બ્લોક કરેલું છે. કૃપા કરી પોપ-અપને મંજૂરી આપો અને ફરીથી પ્રયાસ કરો.');
                return;
            }
            
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
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="gu">
            <head>
                <meta charset="UTF-8">
                <title>શબ્દ સ્પર્ધા - પરિણામ</title>
                <style>
                    body { 
                        font-family: 'Arial', sans-serif; 
                        padding: 20px; 
                        margin: 0;
                        background-color: white;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                        padding: 20px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border-radius: 10px;
                    }
                    .school-name {
                        font-size: 24px;
                        font-weight: bold;
                        margin-bottom: 5px;
                    }
                    .school-location {
                        font-size: 16px;
                        opacity: 0.9;
                    }
                    h1 { 
                        color: #333; 
                        text-align: center; 
                        margin: 20px 0;
                        font-size: 28px;
                    }
                    .results-summary {
                        display: flex;
                        justify-content: space-around;
                        margin-bottom: 30px;
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 10px;
                        border: 2px solid #e9ecef;
                    }
                    .team-summary {
                        text-align: center;
                        padding: 15px;
                        border-radius: 8px;
                        min-width: 200px;
                    }
                    .team1-summary {
                        background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
                        color: white;
                    }
                    .team2-summary {
                        background: linear-gradient(135deg, #48dbfb, #6ee7ff);
                        color: white;
                    }
                    .team-letter {
                        font-size: 24px;
                        font-weight: bold;
                        margin-bottom: 10px;
                    }
                    .team-score {
                        font-size: 32px;
                        font-weight: bold;
                        margin-bottom: 5px;
                    }
                    .team-word-count {
                        font-size: 14px;
                        opacity: 0.9;
                    }
                    .winner-section {
                        text-align: center;
                        margin: 20px 0;
                        padding: 20px;
                        background: linear-gradient(135deg, ${winnerColor}, ${winnerColor}dd);
                        color: white;
                        border-radius: 10px;
                        font-size: 20px;
                        font-weight: bold;
                    }
                    .tables-container {
                        display: flex;
                        gap: 30px;
                        margin-top: 30px;
                    }
                    .team-table-section {
                        flex: 1;
                    }
                    .team-table-title {
                        text-align: center;
                        font-size: 20px;
                        font-weight: bold;
                        margin-bottom: 15px;
                        padding: 10px;
                        border-radius: 5px;
                    }
                    .team1-title {
                        background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
                        color: white;
                    }
                    .team2-title {
                        background: linear-gradient(135deg, #48dbfb, #6ee7ff);
                        color: white;
                    }
                    table { 
                        border-collapse: collapse; 
                        width: 100%; 
                        margin-bottom: 20px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    }
                    th, td { 
                        border: 1px solid #ddd; 
                        padding: 12px 8px; 
                        text-align: left; 
                    }
                    th { 
                        background-color: #f2f2f2; 
                        color: #333;
                        font-weight: bold;
                        text-align: center;
                    }
                    tr:nth-child(even) { 
                        background-color: #f9f9f9; 
                    }
                    tr:hover {
                        background-color: #f0f0f0;
                    }
                    .no-words {
                        text-align: center;
                        color: #666;
                        font-style: italic;
                        padding: 20px;
                    }
                    .footer {
                        margin-top: 30px;
                        text-align: center;
                        padding: 15px;
                        background: #f8f9fa;
                        border-radius: 5px;
                        font-size: 12px;
                        color: #666;
                    }
                    @media print {
                        body { margin: 0; }
                        .header, .results-summary, .winner-section, .tables-container { 
                            page-break-inside: avoid; 
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="school-name">જડિયાણા પ્રાથમિક શાળા</div>
                    <div class="school-location">તા/જી - છોટાઉદેપુર</div>
                </div>
                
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
                
                <div class="winner-section">
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
                
                <div class="footer">
                    <p>શબ્દ સ્પર્ધા પરિણામ - તારીખ: ${new Date().toLocaleDateString('gu-IN')}</p>
                    <p>By - દેવ પટેલ | Mo - 6354236105</p>
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        
        // Wait a bit for content to load, then print
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
        } catch (error) {
            console.error('Print error:', error);
            alert('પ્રિન્ટ કરવામાં ભૂલ આવી. કૃપા કરી ફરીથી પ્રયાસ કરો.');
        }
    }

    // Initialize turn display
    updateTurnDisplay();
    
    // Add visual feedback to confirm buttons are loaded
    console.log('DOM loaded successfully');
    console.log('Print button found:', !!printBtn);
    console.log('End button found:', !!endBtn);
    
    // Add a simple test to verify buttons are clickable
    if (printBtn) {
        printBtn.style.border = '2px solid #28a745';
    }
    if (endBtn) {
        endBtn.style.border = '2px solid #dc3545';
    }
});