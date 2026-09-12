// JARVS AI Bot - Main Application Logic
let recognition;
let isListening = false;
let isProcessing = false;
let messageCount = 0;
let conversationHistory = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeSpeechRecognition();
    setupEventListeners();
    loadSettings();
});

// Initialize Web Speech API
function initializeSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        console.error('Speech Recognition not supported');
        showMessage('bot', '⚠️ Speech Recognition not supported in your browser. Please use Chrome, Edge, or Safari.', true);
        return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        isListening = true;
        updateMicButton();
        updateStatus('Listening...', true);
        document.getElementById('voiceVisualizer').classList.remove('inactive');
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i].transcript.toLowerCase();

            if (event.results[i].isFinal) {
                finalTranscript += transcript + ' ';
            } else {
                interimTranscript += transcript;
            }
        }

        if (finalTranscript) {
            handleUserInput(finalTranscript.trim());
            recognition.stop();
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        updateStatus('Error: ' + event.error, false);
    };

    recognition.onend = () => {
        isListening = false;
        updateMicButton();
        updateStatus('Ready', false);
        document.getElementById('voiceVisualizer').classList.add('inactive');
    };
}

// Setup Event Listeners
function setupEventListeners() {
    const micButton = document.getElementById('micButton');
    const gameButton = document.getElementById('gameButton');
    const clearButton = document.getElementById('clearButton');
    const sendButton = document.getElementById('sendButton');
    const textInput = document.getElementById('textInput');
    const gamesModal = document.getElementById('gamesModal');
    const closeBtn = document.querySelector('.close');

    micButton.addEventListener('click', toggleMicrophone);
    gameButton.addEventListener('click', () => {
        gamesModal.style.display = 'flex';
    });
    clearButton.addEventListener('click', clearChat);
    sendButton.addEventListener('click', sendTextMessage);
    textInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendTextMessage();
    });

    closeBtn.addEventListener('click', () => {
        gamesModal.style.display = 'none';
    });

    gamesModal.addEventListener('click', (e) => {
        if (e.target === gamesModal) {
            gamesModal.style.display = 'none';
        }
    });

    // Settings
    document.getElementById('botColor').addEventListener('change', (e) => {
        document.documentElement.style.setProperty('--primary-color', e.target.value);
        localStorage.setItem('botColor', e.target.value);
    });

    document.getElementById('themeSelect').addEventListener('change', (e) => {
        document.body.className = '';
        if (e.target.value !== 'dark') {
            document.body.classList.add(e.target.value + '-theme');
        }
        localStorage.setItem('theme', e.target.value);
    });

    document.getElementById('voiceSelect').addEventListener('change', (e) => {
        localStorage.setItem('voiceType', e.target.value);
    });

    document.getElementById('resetSettings').addEventListener('click', resetSettings);
}

// Toggle Microphone
function toggleMicrophone() {
    if (isListening) {
        recognition.stop();
    } else {
        recognition.start();
    }
}

// Update Mic Button UI
function updateMicButton() {
    const micButton = document.getElementById('micButton');
    const micText = document.getElementById('micText');

    if (isListening) {
        micButton.classList.add('active');
        micText.textContent = 'Listening...';
    } else {
        micButton.classList.remove('active');
        micText.textContent = 'Start Listening';
    }
}

// Update Status
function updateStatus(text, isActive) {
    document.getElementById('statusText').textContent = text;
    const pulse = document.getElementById('statusPulse');
    if (isActive) {
        pulse.style.animation = 'pulse 2s infinite';
    } else {
        pulse.style.animation = 'none';
    }
}

// Handle User Input
function handleUserInput(text) {
    if (!text.trim() || isProcessing) return;

    showMessage('user', text);
    document.getElementById('textInput').value = '';

    // Check for wake word
    if (text.includes('hey jarvs') || text.includes('hi jarvs')) {
        text = text.replace('hey jarvs', '').replace('hi jarvs', '').trim();
        if (!text) {
            showMessage('bot', "👋 Hey there! What can I help you with?", true);
            return;
        }
    }

    // Auto-restart listening after 2 seconds
    setTimeout(() => {
        if (!isListening) {
            recognition.start();
        }
    }, 2000);

    // Process the command
    processCommand(text);
}

// Send Text Message
function sendTextMessage() {
    const textInput = document.getElementById('textInput');
    const text = textInput.value.trim();

    if (!text) return;

    handleUserInput(text);
}

// Show Message in Chat
function showMessage(sender, message, isBot = false) {
    const chatDisplay = document.getElementById('chatDisplay');

    // Remove welcome message on first message
    if (messageCount === 0) {
        chatDisplay.innerHTML = '';
    }
    messageCount++;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    messageDiv.textContent = message;

    chatDisplay.appendChild(messageDiv);
    chatDisplay.scrollTop = chatDisplay.scrollHeight;

    if (isBot) {
        conversationHistory.push({ role: 'assistant', content: message });
    } else {
        conversationHistory.push({ role: 'user', content: message });
    }
}

// Process Commands
async function processCommand(text) {
    isProcessing = true;
    showWaiting(true);

    // Simulate 2-second thinking time with entertaining message
    await sleep(2000);

    // Process different command types
    let response = '';

    if (text.match(/what is|tell me|explain|who is/i)) {
        response = await handleQuestion(text);
    } else if (text.match(/plan|schedule|organize/i)) {
        response = handlePlanning(text);
    } else if (text.match(/code|program|write|debug/i)) {
        response = handleCoding(text);
    } else if (text.match(/app|application|build/i)) {
        response = handleApp(text);
    } else if (text.match(/joke|funny|laugh/i)) {
        response = getFunnyResponse(text);
    } else if (text.match(/help|how do|guide/i)) {
        response = getHelpResponse(text);
    } else {
        response = getSmartResponse(text);
    }

    showWaiting(false);
    showMessage('bot', response, true);

    // Speak the response
    speakResponse(response);

    isProcessing = false;
}

// Handle Questions
async function handleQuestion(text) {
    const responses = [
        "🤔 That's an interesting question! Based on what I know, " + text.substring(0, 30) + "... is quite complex. Here's what I can tell you: It involves multiple concepts working together. Would you like me to dive deeper into any specific aspect?",
        "💭 Great question! " + text.substring(0, 40) + " involves several key points. Let me break it down for you...",
        "🧠 Ah, a thoughtful inquiry! This relates to " + text.substring(0, 35) + ". The answer depends on context, but generally..."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
}

// Handle Planning
function handlePlanning(text) {
    const responses = [
        "📋 Perfect! Let me help you organize this. For " + text.substring(0, 30) + ", I suggest: 1) Start with the end goal, 2) Break it into smaller tasks, 3) Prioritize by importance and deadline. When would you like to begin?",
        "🗓️ Great planning ahead! Here's my suggestion: Break this into phases - short-term (this week), mid-term (this month), long-term (this quarter). This will help you stay focused.",
        "📌 Smart thinking! To organize " + text.substring(0, 25) + ", consider: Priority → Timeline → Resources → Checkpoints. What's your deadline?"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
}

// Handle Coding
function handleCoding(text) {
    const responses = [
        "💻 Coding challenge! Let me think... For " + text.substring(0, 25) + ", here's a solid approach:\n\n```javascript\n// Pseudocode structure\nfunction solution() {\n  // Step 1: Understand the problem\n  // Step 2: Plan the algorithm\n  // Step 3: Implement\n  // Step 4: Test\n}\n```\n\nWould you like me to elaborate on any specific part?",
        "🔧 Got it! For " + text.substring(0, 20) + " in code, I'd recommend:\n1. Choose your language/framework\n2. Plan the architecture\n3. Write clean, modular code\n4. Test thoroughly\n\nWhat language do you prefer?",
        "⚙️ Excellent coding question! This requires a structured approach. Let's break it down step by step. What's your current skill level with this technology?"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
}

// Handle App Building
function handleApp(text) {
    const responses = [
        "🚀 Building an app? Awesome! Here's my app development roadmap:\n\n1. **Ideation** - Define the problem & solution\n2. **Design** - Create wireframes & UI/UX\n3. **Development** - Build the MVP\n4. **Testing** - QA and bug fixes\n5. **Launch** - Deploy and market\n\nWhich phase are you in?",
        "📱 App development is exciting! For " + text.substring(0, 25) + ", consider:\n- Target platform (web/mobile/both)\n- Tech stack selection\n- Team structure\n- Timeline & budget\n\nLet's plan this together!",
        "💡 Great idea! Building an app requires: Concept → Design → Development → Testing → Launch. What's your app idea?"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
}

// Get Funny Response
function getFunnyResponse(text) {
    const jokes = [
        "😂 Why did the programmer quit his job? Because he didn't get arrays!",
        "🤣 Why do Java developers wear glasses? Because they don't C#!",
        "😆 How many programmers does it take to change a lightbulb? None, that's a hardware problem!",
        "🤪 Why is coding like writing? Because you debug when there's a problem!",
        "😄 A SQL query walks into a bar, walks up to two tables and asks... 'Can I join you?'",
        "😁 Why do programmers prefer dark mode? Because light attracts bugs!",
        "🤩 I would tell you a UDP joke, but you might not get it!",
        "😸 Why did the developer go broke? Because they used up all their cache!"
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
}

// Get Help Response
function getHelpResponse(text) {
    const responses = [
        "🆘 I'm here to help! I can assist you with:\n✅ Answering questions on any topic\n✅ Planning and organization\n✅ Problem-solving strategies\n✅ Coding help and debugging\n✅ App development guidance\n✅ Entertainment and games\n\nWhat do you need help with?",
        "💪 No problem! I can help with almost anything. Just ask me about:\n📚 Questions & research\n🗺️ Planning & strategy\n🐛 Problem-solving\n💻 Coding & programming\n🎮 Fun games and jokes\n\nWhat's on your mind?",
        "🎯 I'm ready to assist! Tell me what you need and I'll do my best to help. I'm good with questions, planning, coding, and keeping things fun!"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
}

// Get Smart Generic Response
function getSmartResponse(text) {
    const responses = [
        "🤖 Interesting! Let me think about that... " + text.substring(0, 30) + ". This is a nuanced topic that deserves a thoughtful answer. Can you give me more context?",
        "💬 Great point! You're talking about " + text.substring(0, 25) + ". There are several angles to consider here. What aspect interests you most?",
        "🎯 I see what you mean! " + text.substring(0, 35) + " is definitely worth discussing. Let's explore this further - what's your main concern?",
        "✨ That's a fascinating topic! I notice you mentioned " + text.substring(0, 30) + ". To give you the best answer, could you clarify what you're looking for?"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
}

// Show/Hide Waiting Animation
function showWaiting(show) {
    const waitingDisplay = document.getElementById('waitingDisplay');
    waitingDisplay.style.display = show ? 'flex' : 'none';
}

// Text to Speech
function speakResponse(text) {
    if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        const voiceType = localStorage.getItem('voiceType') || 'google';

        utterance.rate = 1;
        utterance.pitch = voiceType === 'robotic' ? 0.8 : 1;
        utterance.volume = 1;

        speechSynthesis.speak(utterance);
    }
}

// Clear Chat
function clearChat() {
    document.getElementById('chatDisplay').innerHTML = `
        <div class="welcome-message">
            <h2>Welcome to J.A.R.V.S 🤖</h2>
            <p>Your AI Assistant for Questions, Planning, Problem-Solving, Coding & App Creation</p>
            <p style="font-size: 12px; margin-top: 20px;">💡 Tip: Just say "Hey JARVS" and start talking!</p>
        </div>
    `;
    messageCount = 0;
    conversationHistory = [];
}

// Load Settings
function loadSettings() {
    const savedColor = localStorage.getItem('botColor');
    const savedTheme = localStorage.getItem('theme');
    const savedVoice = localStorage.getItem('voiceType');

    if (savedColor) {
        document.getElementById('botColor').value = savedColor;
        document.documentElement.style.setProperty('--primary-color', savedColor);
    }

    if (savedTheme) {
        document.getElementById('themeSelect').value = savedTheme;
        if (savedTheme !== 'dark') {
            document.body.classList.add(savedTheme + '-theme');
        }
    }

    if (savedVoice) {
        document.getElementById('voiceSelect').value = savedVoice;
    }
}

// Reset Settings
function resetSettings() {
    localStorage.clear();
    document.getElementById('botColor').value = '#00d4ff';
    document.getElementById('themeSelect').value = 'dark';
    document.getElementById('voiceSelect').value = 'google';
    document.body.className = '';
    document.documentElement.style.setProperty('--primary-color', '#00d4ff');
    alert('✅ Settings reset to default!');
}

// Utility Functions
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Game Starter
function startGame(gameType) {
    document.getElementById('gamesModal').style.display = 'none';
    document.getElementById('gamePlayArea').style.display = 'flex';
    
    // Import game logic from games.js
    initializeGame(gameType);
}

function exitGame() {
    document.getElementById('gamePlayArea').style.display = 'none';
    document.getElementById('gameContent').innerHTML = '';
}
