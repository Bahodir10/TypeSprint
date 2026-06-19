import { state } from '../core/state.js';
import { unlockAudio, playKeySound } from '../utils/audio.js';
import { updateGuide, resetFingerPositions, setHomeRowPositions } from './keyboard.js';
import { updateCursor, updateStats, updateTimerDisplay, updateValueOptions } from './ui.js';
import { closeAuthModal } from './auth.js';

export function shuffleArray(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
}

export function populateWordStream() {
    const wordStream = document.getElementById('wordStream');
    const caret = document.getElementById('caret');
    wordStream.innerHTML = ''; 
    state.allLetterElements = [];
    shuffleArray(state.words);
    
    let toDisplay = state.testMode === 'words' ? state.words.slice(0, state.testValue) : state.words.slice(0, 200);
    toDisplay.forEach((wordStr, wordIndex) => {
        const wordDiv = document.createElement('div');
        wordDiv.classList.add('word');
        for (const char of wordStr) {
            const span = document.createElement('span');
            span.classList.add('letter');
            span.textContent = char;
            wordDiv.appendChild(span);
            state.allLetterElements.push(span);
        }
        if (wordIndex < toDisplay.length - 1) {
            const spaceSpan = document.createElement('span');
            spaceSpan.classList.add('letter');
            spaceSpan.innerHTML = '&nbsp;';
            spaceSpan.dataset.char = ' ';
            wordDiv.appendChild(spaceSpan);
            state.allLetterElements.push(spaceSpan);
        }
        wordStream.appendChild(wordDiv);
    });
    wordStream.appendChild(caret);
}

export function restartTest() { 
    unlockAudio(); 
    resetToMenu(); 
}

export function resetToMenu() {
    const wordStream = document.getElementById('wordStream');
    const caret = document.getElementById('caret');
    const typingTutor = document.getElementById('typingTutor');
    
    state.testOver = false;
    resetFingerPositions();
    state.gameActive = false;
    clearInterval(state.timer);
    clearTimeout(state.idleTimer);
    
    state.currentLetterIndex = 0; state.correctChars = 0; state.typedChars = 0; state.errors = 0;
    state.testStartTime = null; state.wpmSamples = []; state.lastSampleTime = null;
    
    populateWordStream();
    updateCursor();
    caret.classList.add('blinking');
    typingTutor.classList.add('visible');
    
    updateStats();
    calculateResults();
    
    if (state.testMode === 'time') { 
        updateTimerDisplay(state.testValue); 
    } else { 
        document.getElementById('time').textContent = '00:00'; 
    }
    
    const valueOptions = document.getElementById('valueOptions');
    [...valueOptions.children].forEach(btn => btn.classList.toggle('active', parseInt(btn.dataset.value, 10) === state.testValue));
    
    wordStream.classList.remove('unfocused');
    wordStream.focus();
}

export function startGameLogic() {
    if (state.gameActive) return;
    state.gameActive = true;
    state.testStartTime = new Date();
    state.lastSampleTime = new Date();
    state.wpmSamples = [];

    if (state.testMode === 'time') {
        let timeRemaining = state.testValue;
        updateTimerDisplay(timeRemaining);
        state.timer = setInterval(() => {
            timeRemaining--;
            updateTimerDisplay(timeRemaining);
            sampleWPM();
            if (timeRemaining <= 0) endGame();
        }, 1000);
    } else {
        document.getElementById('time').textContent = '00:00';
        state.timer = setInterval(() => {
            if (!state.gameActive) return;
            const elapsed = Math.floor((new Date() - state.testStartTime) / 1000);
            updateTimerDisplay(elapsed, true);
            sampleWPM();
        }, 1000);
    }
    setHomeRowPositions();
    updateGuide();
}

export function sampleWPM() {
    if (!state.testStartTime) return;
    const now = new Date();
    const elapsed = (now - state.testStartTime) / 60000;
    if (elapsed < 0.05) return;
    const currentWpm = Math.round((state.typedChars / 5) / elapsed);
    state.wpmSamples.push(currentWpm);
}

export function computeConsistency() {
    if (state.wpmSamples.length < 2) return null;
    const mean = state.wpmSamples.reduce((a, b) => a + b, 0) / state.wpmSamples.length;
    if (mean === 0) return null;
    const variance = state.wpmSamples.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / state.wpmSamples.length;
    const stdDev = Math.sqrt(variance);
    const cv = (stdDev / mean) * 100;
    return Math.max(0, Math.round(100 - cv));
}

export function endGame() {
    const caret = document.getElementById('caret');
    const typingTutor = document.getElementById('typingTutor');

    state.testOver = true;
    resetFingerPositions();
    clearInterval(state.timer);
    clearTimeout(state.idleTimer);
    state.gameActive = false;
    calculateResults();
    
    caret.style.opacity = '0';
    caret.classList.remove('blinking');
    typingTutor.classList.remove('visible');
}

export function calculateResults() {
    let minutes;
    if (state.testMode === 'time') {
        minutes = state.testValue / 60;
    } else {
        if (!state.testStartTime) { minutes = 0; }
        else { minutes = (new Date() - state.testStartTime) / 60000; }
    }
    
    const rawWpm = minutes > 0 ? (state.typedChars / 5) / minutes : 0;
    const netWpm = minutes > 0 ? (state.correctChars / 5) / minutes : 0;
    
    document.getElementById('wpm').textContent = Math.round(netWpm);
    document.getElementById('rawWpm').textContent = Math.round(rawWpm);
    
    const acc = state.typedChars > 0 ? (state.correctChars / state.typedChars) * 100 : 0;
    document.getElementById('accuracy').textContent = `${acc.toFixed(1)}%`;

    const consistency = computeConsistency();
    document.getElementById('consistency').textContent = consistency !== null ? consistency + '%' : '—';
}

export function initGameEngine() {
    document.addEventListener('keydown', (e) => {
        const activeTag = document.activeElement && document.activeElement.tagName;
        if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

        const authModal = document.getElementById('authModal');
        const statsModal = document.getElementById('statsModal');
        const caret = document.getElementById('caret');

        if (e.key === 'Escape') {
            if (!authModal.classList.contains('hidden')) { closeAuthModal(); return; }
            if (!statsModal.classList.contains('hidden')) { statsModal.classList.add('hidden'); return; }
            restartTest();
            return;
        }
        if (state.testOver) return;
        if (!state.gameActive && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            unlockAudio();
            startGameLogic();
        }
        if (!state.gameActive) return;

        const isTypingKey = e.key.length === 1 || e.key === 'Backspace';
        const isShortcut = e.ctrlKey || e.metaKey || e.altKey;
        if (isTypingKey && !isShortcut) { e.preventDefault(); if (e.key.length === 1) playKeySound(); }
        else if (!isTypingKey) return;

        const currentLetterEl = state.allLetterElements[state.currentLetterIndex];
        if (!currentLetterEl) return;

        if (e.key === 'Backspace') {
            if (state.currentLetterIndex > 0) {
                state.currentLetterIndex--;
                const prev = state.allLetterElements[state.currentLetterIndex];
                if (prev.classList.contains('correct') || prev.classList.contains('incorrect')) {
                    state.typedChars--;
                    if (prev.classList.contains('correct')) state.correctChars--;
                    if (prev.classList.contains('incorrect')) state.errors--;
                }
                prev.classList.remove('correct', 'incorrect');
                updateCursor(); updateStats(); updateGuide();
            }
            return;
        }
        if (e.key.length > 1) return;

        clearTimeout(state.idleTimer);
        caret.classList.remove('blinking');
        state.idleTimer = setTimeout(() => caret.classList.add('blinking'), 500);

        state.typedChars++;
        if (e.key === (currentLetterEl.dataset.char || currentLetterEl.textContent)) {
            state.correctChars++;
            currentLetterEl.classList.add('correct');
        } else {
            state.errors++;
            currentLetterEl.classList.add('incorrect');
        }
        state.currentLetterIndex++;

        if (state.testMode === 'words' && state.currentLetterIndex === state.allLetterElements.length) { endGame(); return; }
        updateCursor(); updateStats(); updateGuide();
    });

    document.getElementById('restartBtn').addEventListener('click', restartTest);
}