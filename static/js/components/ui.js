import { state } from '../core/state.js';
import { CONFIG, TRANSLATIONS } from '../core/config.js';
import { unlockAudio, setMuteState } from '../utils/audio.js';
import { restartTest, resetToMenu, calculateResults, computeConsistency } from './game.js';
import { api } from '../api/client.js';

export function updateCursor() {
    const caret = document.getElementById('caret');
    const wordStream = document.getElementById('wordStream');
    const letterEl = state.allLetterElements[state.currentLetterIndex];
    if (letterEl) {
        const rect = letterEl.getBoundingClientRect();
        const parentRect = wordStream.getBoundingClientRect();
        caret.style.height = `${rect.height}px`;
        caret.style.left = `${rect.left - parentRect.left - 1}px`;
        caret.style.top = `${rect.top - parentRect.top}px`;
        caret.style.opacity = '1';
    } else { 
        caret.style.opacity = '0'; 
    }
}

export function updateTimerDisplay(time, countUp = false) {
    const timeEl = document.getElementById('time');
    const s = time % 60;
    const m = Math.floor(time / 60);
    timeEl.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function updateStats() {
    document.getElementById('correctCount').textContent = Math.floor(state.correctChars / 5);
    document.getElementById('typedCount').textContent = Math.floor(state.typedChars / 5);
    document.getElementById('errors').textContent = state.errors;

    const total = state.allLetterElements.length;
    const pct = total > 0 ? Math.round((state.currentLetterIndex / total) * 100) : 0;
    document.getElementById('progress').textContent = pct + '%';
}

export function updateValueOptions() {
    const valueOptions = document.getElementById('valueOptions');
    const modeOptions = document.getElementById('modeOptions');
    valueOptions.innerHTML = '';
    
    CONFIG[state.testMode].forEach(val => {
        const b = document.createElement('button');
        b.dataset.value = val; b.textContent = val;
        valueOptions.appendChild(b);
    });
    
    state.testValue = CONFIG[state.testMode][0];
    valueOptions.children[0].classList.add('active');
    [...modeOptions.children].forEach(b => b.classList.toggle('active', b.dataset.mode === state.testMode));
}

function setupControls() {
    document.getElementById('modeOptions').addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') { 
            unlockAudio(); 
            state.testMode = e.target.dataset.mode; 
            updateValueOptions(); 
            resetToMenu(); 
        }
    });
    document.getElementById('valueOptions').addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') { 
            unlockAudio(); 
            state.testValue = parseInt(e.target.dataset.value, 10); 
            resetToMenu(); 
        }
    });
}

function applyTheme(name) { 
    document.body.className = `theme-${name}`; 
    localStorage.setItem('typingTestTheme', name); 
}

function setupThemeSwitcher() {
    const saved = localStorage.getItem('typingTestTheme') || 'default';
    applyTheme(saved);
    document.getElementById('themeSwitcher').addEventListener('click', (e) => { 
        if (e.target.tagName === 'BUTTON') { 
            unlockAudio(); 
            applyTheme(e.target.dataset.theme); 
        } 
    });
}

async function saveResult() {
    const saveResultBtn = document.getElementById('saveResult');

    if (state.saveResetTimer) {
        clearTimeout(state.saveResetTimer);
        state.saveResetTimer = null;
    }

    calculateResults();
    let duration = 0;
    if (state.testStartTime) duration = (new Date() - state.testStartTime) / 1000;

    function safe(v) { return isFinite(v) ? v : 0; }

    const result = {
        wpm: safe(parseInt(document.getElementById('wpm').textContent, 10)),
        raw_wpm: safe(parseFloat(document.getElementById('rawWpm').textContent)),
        accuracy: safe(parseFloat(document.getElementById('accuracy').textContent)),
        errors: safe(parseInt(document.getElementById('errors').textContent, 10)),
        correct: safe(state.correctChars),
        typed: safe(state.typedChars),
        consistency: safe(computeConsistency() || 0),
        mode: state.testMode,
        value: state.testValue,
        duration: safe(duration),
        client_time: new Date().toISOString()
    };

    saveResultBtn.disabled = true;
    saveResultBtn.textContent = 'Saving…';

    try {
        await api.saveResult(result);
        saveResultBtn.textContent = '✓ Saved!';
        saveResultBtn.style.background = 'var(--accent)';
    } catch (err) {
        console.error('Save network error:', err);
        saveResultBtn.textContent = err.message || 'Network error';
        saveResultBtn.style.background = 'var(--error)';
    } finally {
        saveResultBtn.disabled = false;
        state.saveResetTimer = setTimeout(() => {
            saveResultBtn.textContent = 'Save Result';
            saveResultBtn.style.background = '';
            state.saveResetTimer = null;
        }, 2500);
    }
}

export function applyLanguage(lang) {
    state.currentLang = lang;
    localStorage.setItem('typingTestLang', lang);
    const dict = TRANSLATIONS[lang];
    if (!dict) return;
    document.querySelectorAll('#langOptions button').forEach(btn => btn.classList.toggle('active', btn.dataset.lang === lang));
    document.querySelectorAll('[data-translate-key]').forEach(el => { const k = el.dataset.translateKey; if (dict[k]) el.textContent = dict[k]; });
    document.querySelectorAll('[data-translate-html]').forEach(el => { const k = el.dataset.translateHtml; if (dict[k]) el.innerHTML = dict[k]; });
    document.querySelectorAll('[data-translate-title-key]').forEach(el => { const k = el.dataset.translateTitleKey; if (dict[k]) el.title = dict[k]; });
    const timeModeBtn = document.querySelector('#modeOptions button[data-mode="time"]');
    if (timeModeBtn) timeModeBtn.textContent = dict.modeTime;
    const wordsModeBtn = document.querySelector('#modeOptions button[data-mode="words"]');
    if (wordsModeBtn) wordsModeBtn.textContent = dict.modeWords;
    document.getElementById('muteBtn').title = dict.muteTitle;
}

function setupLanguageSwitcher() {
    document.getElementById('langOptions').addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') { 
            const lang = e.target.dataset.lang; 
            if (lang) applyLanguage(lang); 
        }
    });
}

function setupMuteButton() {
    document.getElementById('muteBtn').addEventListener('click', () => { 
        unlockAudio(); 
        setMuteState(!state.isMuted); 
    });
}

export function setupUI() {
    setupThemeSwitcher();
    setupMuteButton();
    setupLanguageSwitcher();
    setupControls();

    const savedMuted = localStorage.getItem('typingTestMuted') === 'true';
    setMuteState(savedMuted);
    const savedLang = localStorage.getItem('typingTestLang') || 'en';
    applyLanguage(savedLang);

    document.getElementById('saveResult').addEventListener('click', saveResult);
}