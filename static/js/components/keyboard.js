import { KEYBOARD_LAYOUT, HOME_ROW_MAP, KEY_MAP } from '../core/config.js';
import { state } from '../core/state.js';

export function generateKeyboard() {
    const keyboardEl = document.getElementById('keyboard');
    keyboardEl.innerHTML = '';
    KEYBOARD_LAYOUT.forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.classList.add('keyboard-row');
        row.forEach(key => {
            const keyDiv = document.createElement('div');
            keyDiv.classList.add('key');
            keyDiv.textContent = key;
            keyDiv.dataset.key = key;
            if (key === 'space') keyDiv.classList.add('space');
            rowDiv.appendChild(keyDiv);
        });
        keyboardEl.appendChild(rowDiv);
    });
}

export function getFingerTargetCoords(fingerEl, keyEl) {
    const handsSvg = document.querySelector('#hands svg');
    const keyRect = keyEl.getBoundingClientRect();
    const svgRect = handsSvg.getBoundingClientRect();
    const fingerRect = fingerEl.getBBox();
    const targetX = (keyRect.left + keyRect.width / 2) - svgRect.left;
    const targetY = (keyRect.top + keyRect.height / 2) - svgRect.top;
    const originX = fingerRect.x + fingerRect.width / 2;
    const originY = fingerRect.y + 20;
    return { x: targetX - originX, y: targetY - originY };
}

export function setHomeRowPositions() {
    const keyboardEl = document.getElementById('keyboard');
    Object.keys(HOME_ROW_MAP).forEach(fingerId => {
        const fingerEl = document.getElementById(fingerId);
        const keyEl = keyboardEl.querySelector(`.key[data-key="${HOME_ROW_MAP[fingerId]}"]`);
        if (fingerEl && keyEl) {
            const coords = getFingerTargetCoords(fingerEl, keyEl);
            fingerEl._homePos = coords;
            gsap.to(fingerEl, { x: coords.x, y: coords.y, duration: 0.3, ease: "power2.out" });
        }
    });
}

export function resetFingerPositions() {
    gsap.killTweensOf(".hand g");
    Object.keys(HOME_ROW_MAP).forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.classList.remove('highlight'); gsap.to(el, { x: 0, y: 0, duration: 0.3, ease: "power2.out" }); }
    });
}

export function updateGuide() {
    const keyboardEl = document.getElementById('keyboard');

    if (state.activeGuide.key) {
        state.activeGuide.key.classList.remove('guide');
        state.activeGuide.key.textContent = state.activeGuide.key.dataset.key;
        if (state.activeGuide.key.dataset.key === 'space') state.activeGuide.key.innerHTML = 'space';
    }
    state.activeGuide.fingers.forEach(f => {
        f.classList.remove('highlight');
        if (f._homePos) gsap.to(f, { x: f._homePos.x, y: f._homePos.y, duration: 0.15, ease: "power2.out" });
    });
    state.activeGuide = { fingers: [], key: null };

    const nextLetterEl = state.allLetterElements[state.currentLetterIndex];
    if (!nextLetterEl) return;
    const char = nextLetterEl.dataset.char || nextLetterEl.textContent;
    const mapping = KEY_MAP[char];
    if (!mapping) return;
    
    const keyEl = keyboardEl.querySelector(`.key[data-key="${mapping.key}"]`);
    const fingerEls = Array.isArray(mapping.finger)
        ? mapping.finger.map(id => document.getElementById(id)).filter(Boolean)
        : [document.getElementById(mapping.finger)].filter(Boolean);
        
    if (!keyEl || fingerEls.length === 0) return;
    
    keyEl.classList.add('guide');
    keyEl.textContent = char;
    if (char === ' ') keyEl.innerHTML = '&nbsp;';
    
    fingerEls.forEach(f => {
        f.classList.add('highlight');
        const coords = getFingerTargetCoords(f, keyEl);
        gsap.to(f, { x: coords.x, y: coords.y, duration: 0.2, ease: "power2.out" });
    });
    
    state.activeGuide = { fingers: fingerEls, key: keyEl };
}