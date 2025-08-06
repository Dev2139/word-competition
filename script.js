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
    const clearBtn = document.getElementById('clear-btn');

    // Check if buttons exist and add error handling
    if (!printBtn) {
        console.error('Print button not found!');
    }
    if (!clearBtn) {
        console.error('Clear button not found!');
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
                window.print();
            } catch (error) {
                console.error('Print error:', error);
                alert('Print functionality failed. Please try again.');
            }
        });
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            console.log('Clear button clicked');
            try {
                clearGame();
            } catch (error) {
                console.error('Clear error:', error);
                alert('Clear functionality failed. Please try again.');
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
            alert(`શબ્દ "${word}" એ "${teamData.letter}" થી શરૂ થતો નથી. કૃપા કરી "${teamData.letter}" થી શરૂ થતો શબ્દ બોલો.`);
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
        } else {
            // It's a new word
            teamData.score++;
            teamData.words.push(word);
            li.innerHTML = `${word} <span style="color: green; font-size: 0.8em;">(નવું)</span>`;
        }

        // Update UI
        scoreEl.textContent = teamData.score;
        wordListEl.appendChild(li);
        wordListEl.scrollTop = wordListEl.scrollHeight; // Auto-scroll to the bottom
        
        // Update word count display
        updateWordCount(teamNumber);
        
        // Show success message for new words
        if (!teamData.words.includes(word) || teamData.words.filter(w => w === word).length === 1) {
            showSuccessMessage(teamNumber, word);
        }
        
        // Switch turn after processing the word
        setTimeout(() => {
            switchTurn();
        }, 1000);
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
    
    function showSuccessMessage(teamNumber, word) {
        const teamColumn = document.getElementById(`team${teamNumber}`);
        const message = document.createElement('div');
        message.className = 'success-message';
        message.textContent = `✅ "${word}" ઉમેરાયું!`;
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            z-index: 1000;
            animation: slideIn 0.5s ease;
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.style.animation = 'slideOut 0.5s ease';
            setTimeout(() => {
                document.body.removeChild(message);
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

    function clearGame() {
        console.log('clearGame function called');
        const confirm = window.confirm("શબ્દ સ્પર્ધાને ખાલી કરવાનો નકારાયા છે? આ કાર્ય અનિવાર્ય છે.");
        if (confirm) {
            console.log('User confirmed clear action');
            
            // Reset team data
            team1.score = 0;
            team1.words = [];
            team2.score = 0;
            team2.words = [];
            
            // Update UI
            if (score1El) score1El.textContent = '0';
            if (score2El) score2El.textContent = '0';
            if (wordList1El) wordList1El.innerHTML = '';
            if (wordList2El) wordList2El.innerHTML = '';
            
            // Reset turn system
            currentTurn = 1;
            isListening = false;
            updateTurnDisplay();
            
            // Remove word count displays
            const countDisplays = document.querySelectorAll('.word-count');
            countDisplays.forEach(display => display.remove());
            
            // Remove turn indicator
            const turnIndicator = document.querySelector('.turn-indicator');
            if (turnIndicator) {
                turnIndicator.remove();
            }
            
            console.log('Game cleared successfully');
            alert("શબ્દ સ્પર્ધા ખાલી કરવામાં આવી છે!");
        } else {
            console.log('User cancelled clear action');
        }
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

    // Initialize turn display
    updateTurnDisplay();
    
    // Add visual feedback to confirm buttons are loaded
    console.log('DOM loaded successfully');
    console.log('Print button found:', !!printBtn);
    console.log('Clear button found:', !!clearBtn);
    
    // Add a simple test to verify buttons are clickable
    if (printBtn) {
        printBtn.style.border = '2px solid #28a745';
    }
    if (clearBtn) {
        clearBtn.style.border = '2px solid #dc3545';
    }
});