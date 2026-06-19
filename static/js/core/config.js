export const CONFIG = { time: [15, 30, 60, 120], words: [10, 25, 50, 100] };

export const KEY_MAP = {
    '`': { key: '`', finger: 'left-pinky' }, '~': { key: '`', finger: 'left-pinky' }, '1': { key: '1', finger: 'left-pinky' }, '!': { key: '1', finger: 'left-pinky' },
    '2': { key: '2', finger: 'left-ring' }, '@': { key: '2', finger: 'left-ring' }, '3': { key: '3', finger: 'left-middle' }, '#': { key: '3', finger: 'left-middle' },
    '4': { key: '4', finger: 'left-index' }, '$': { key: '4', finger: 'left-index' }, '5': { key: '5', finger: 'left-index' }, '%': { key: '5', finger: 'left-index' },
    '6': { key: '6', finger: 'right-index' }, '^': { key: '6', finger: 'right-index' }, '7': { key: '7', finger: 'right-index' }, '&': { key: '7', finger: 'right-index' },
    '8': { key: '8', finger: 'right-middle' }, '*': { key: '8', finger: 'right-middle' }, '9': { key: '9', finger: 'right-ring' }, '(': { key: '9', finger: 'right-ring' },
    '0': { key: '0', finger: 'right-pinky' }, ')': { key: '0', finger: 'right-pinky' }, '-': { key: '-', finger: 'right-pinky' }, '_': { key: '-', finger: 'right-pinky' },
    '=': { key: '=', finger: 'right-pinky' }, '+': { key: '=', finger: 'right-pinky' }, 'q': { key: 'q', finger: 'left-pinky' }, 'Q': { key: 'q', finger: 'left-pinky' },
    'w': { key: 'w', finger: 'left-ring' }, 'W': { key: 'w', finger: 'left-ring' }, 'e': { key: 'e', finger: 'left-middle' }, 'E': { key: 'e', finger: 'left-middle' },
    'r': { key: 'r', finger: 'left-index' }, 'R': { key: 'r', finger: 'left-index' }, 't': { key: 't', finger: 'left-index' }, 'T': { key: 't', finger: 'left-index' },
    'y': { key: 'y', finger: 'right-index' }, 'Y': { key: 'y', finger: 'right-index' }, 'u': { key: 'u', finger: 'right-index' }, 'U': { key: 'u', finger: 'right-index' },
    'i': { key: 'i', finger: 'right-middle' }, 'I': { key: 'i', finger: 'right-middle' }, 'o': { key: 'o', finger: 'right-ring' }, 'O': { key: 'o', finger: 'right-ring' },
    'p': { key: 'p', finger: 'right-pinky' }, 'P': { key: 'p', finger: 'right-pinky' }, '[': { key: '[', finger: 'right-pinky' }, '{': { key: '[', finger: 'right-pinky' },
    ']': { key: ']', finger: 'right-pinky' }, '}': { key: ']', finger: 'right-pinky' }, '\\': { key: '\\', finger: 'right-pinky' }, '|': { key: '\\', finger: 'right-pinky' },
    'a': { key: 'a', finger: 'left-pinky' }, 'A': { key: 'a', finger: 'left-pinky' }, 's': { key: 's', finger: 'left-ring' }, 'S': { key: 's', finger: 'left-ring' },
    'd': { key: 'd', finger: 'left-middle' }, 'D': { key: 'd', finger: 'left-middle' }, 'f': { key: 'f', finger: 'left-index' }, 'F': { key: 'f', finger: 'left-index' },
    'g': { key: 'g', finger: 'left-index' }, 'G': { key: 'g', finger: 'left-index' }, 'h': { key: 'h', finger: 'right-index' }, 'H': { key: 'h', finger: 'right-index' },
    'j': { key: 'j', finger: 'right-index' }, 'J': { key: 'j', finger: 'right-index' }, 'k': { key: 'k', finger: 'right-middle' }, 'K': { key: 'k', finger: 'right-middle' },
    'l': { key: 'l', finger: 'right-ring' }, 'L': { key: 'l', finger: 'right-ring' }, ';': { key: ';', finger: 'right-pinky' }, ':': { key: ';', finger: 'right-pinky' },
    '\'': { key: '\'', finger: 'right-pinky' }, '"': { key: '\'', finger: 'right-pinky' }, 'z': { key: 'z', finger: 'left-pinky' }, 'Z': { key: 'z', finger: 'left-pinky' },
    'x': { key: 'x', finger: 'left-ring' }, 'X': { key: 'x', finger: 'left-ring' }, 'c': { key: 'c', finger: 'left-middle' }, 'C': { key: 'c', finger: 'left-middle' },
    'v': { key: 'v', finger: 'left-index' }, 'V': { key: 'v', finger: 'left-index' }, 'b': { key: 'b', finger: 'left-index' }, 'B': { key: 'b', finger: 'left-index' },
    'n': { key: 'n', finger: 'right-index' }, 'N': { key: 'n', finger: 'right-index' }, 'm': { key: 'm', finger: 'right-index' }, 'M': { key: 'm', finger: 'right-index' },
    ',': { key: ',', finger: 'right-middle' }, '<': { key: ',', finger: 'right-middle' }, '.': { key: '.', finger: 'right-ring' }, '>': { key: '.', finger: 'right-ring' },
    '/': { key: '/', finger: 'right-pinky' }, '?': { key: '/', finger: 'right-pinky' }, ' ': { key: 'space', finger: ['left-thumb', 'right-thumb'] }
};

export const KEYBOARD_LAYOUT = [
    ['`','1','2','3','4','5','6','7','8','9','0','-','='],
    ['q','w','e','r','t','y','u','i','o','p','[',']','\\'],
    ['a','s','d','f','g','h','j','k','l',';','\''],
    ['z','x','c','v','b','n','m',',','.','/'],
    ['space']
];

export const HOME_ROW_MAP = {
    'left-pinky': 'a', 'left-ring': 's', 'left-middle': 'd', 'left-index': 'f',
    'right-index': 'j', 'right-middle': 'k', 'right-ring': 'l', 'right-pinky': ';',
    'left-thumb': 'space', 'right-thumb': 'space'
};

export const TRANSLATIONS = {
    en: {
        mode: 'Mode:', count: 'Count:', wpm: 'WPM', accuracy: 'Accuracy',
        time: 'Time', correct: 'Correct', typed: 'Typed', errors: 'Errors',
        saveResult: 'Save Result', restartTitle: 'Restart Test (Esc)',
        restartFooter: 'Press <kbd>Esc</kbd> to restart', muteTitle: 'Mute/Unmute Sound',
        modeTime: 'time', modeWords: 'words'
    },
    uz: {
        mode: 'Rejim:', count: 'Soni:', wpm: 'Tezlik', accuracy: 'Aniqlik',
        time: 'Vaqt', correct: "To'g'ri", typed: 'Yozildi', errors: 'Xatolar',
        saveResult: 'Natijani Saqlash', restartTitle: "Qayta Boshlash (Esc)",
        restartFooter: "Qayta boshlash uchun <kbd>Esc</kbd> bosing", muteTitle: "Ovozsiz/Ovozli",
        modeTime: 'vaqt', modeWords: "so'zlar"
    }
};