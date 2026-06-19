import { setupAuthModal, checkSession } from './components/auth.js';
import { setupStatsModal } from './components/stats.js';
import { generateKeyboard, setHomeRowPositions, updateGuide } from './components/keyboard.js';
import { setupUI, updateValueOptions, updateCursor } from './components/ui.js';
import { initGameEngine, resetToMenu } from './components/game.js';
import { api } from './api/client.js';
import { state } from './core/state.js';

async function bootstrap() {
    // 1. Klaviaturani va asosiy UIni chizish
    generateKeyboard();
    setupUI();

    // 2. Modallar (Auth va Stats) va sessiya
    setupAuthModal();
    setupStatsModal();
    await checkSession();

    // 3. So'zlarni serverdan tortish va o'yinni yuklash
    state.words = await api.fetchWords();
    updateValueOptions();
    resetToMenu();

    // 4. Tugma va mantiqlarni ulash (keydown va h.k.)
    initGameEngine();

    // 5. Ekran o'lchami o'zgarganda kursor va barmoqlarni joyiga tushirish
    window.addEventListener('resize', () => { 
        if (state.gameActive) { 
            updateCursor(); 
            setHomeRowPositions(); 
            updateGuide(); 
        } 
    });
}

// Sahifa to'liq yuklangach dasturni ishga tushirish
document.addEventListener('DOMContentLoaded', bootstrap);