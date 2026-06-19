import { api } from '../api/client.js';
import { state } from '../core/state.js';

const loggedOutBtns = document.getElementById('loggedOutBtns');
const loggedInBtns = document.getElementById('loggedInBtns');
const userBadge = document.getElementById('userBadge');
const authModal = document.getElementById('authModal');
const authModalClose = document.getElementById('authModalClose');

export async function checkSession() {
    try {
        const data = await api.checkSession();
        setLoggedIn(data.username);
    } catch { 
        setLoggedOut(); 
    }
}

export function setLoggedIn(username) {
    state.currentUser = username;
    userBadge.textContent = username;
    loggedOutBtns.classList.add('hidden');
    loggedInBtns.classList.remove('hidden');
}

export function setLoggedOut() {
    state.currentUser = null;
    loggedOutBtns.classList.remove('hidden');
    loggedInBtns.classList.add('hidden');
}

export function openAuthModal(tab = 'signin') {
    authModal.classList.remove('hidden');
    document.querySelectorAll('.modal-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    document.querySelectorAll('.modal-pane').forEach(p => p.classList.toggle('active', p.id === `tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`));
    const input = tab === 'signin' ? document.getElementById('siUsername') : document.getElementById('suUsername');
    setTimeout(() => input && input.focus(), 50);
}

export function closeAuthModal() { 
    authModal.classList.add('hidden'); 
}

export function setupAuthModal() {
    document.getElementById('signUpBtn').addEventListener('click', () => openAuthModal('signup'));
    document.getElementById('signInBtn').addEventListener('click', () => openAuthModal('signin'));
    authModalClose.addEventListener('click', closeAuthModal);
    authModal.addEventListener('click', e => { if (e.target === authModal) closeAuthModal(); });

    document.querySelectorAll('.modal-tab').forEach(tab => {
        tab.addEventListener('click', () => openAuthModal(tab.dataset.tab));
    });

    // Sign In submit
    document.getElementById('siSubmit').addEventListener('click', async () => {
        const username = document.getElementById('siUsername').value.trim();
        const password = document.getElementById('siPassword').value;
        const errEl = document.getElementById('siError');
        errEl.classList.add('hidden');
        try {
            const data = await api.signIn(username, password);
            setLoggedIn(data.username);
            closeAuthModal();
        } catch (error) { 
            errEl.textContent = error.message; 
            errEl.classList.remove('hidden'); 
        }
    });

    // Sign Up submit
    document.getElementById('suSubmit').addEventListener('click', async () => {
        const username = document.getElementById('suUsername').value.trim();
        const password = document.getElementById('suPassword').value;
        const errEl = document.getElementById('suError');
        errEl.classList.add('hidden');
        try {
            const data = await api.signUp(username, password);
            setLoggedIn(data.username);
            closeAuthModal();
        } catch (error) { 
            errEl.textContent = error.message; 
            errEl.classList.remove('hidden'); 
        }
    });

    // Enter key in auth fields
    ['siUsername', 'siPassword'].forEach(id => {
        document.getElementById(id).addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('siSubmit').click(); });
    });
    ['suUsername', 'suPassword'].forEach(id => {
        document.getElementById(id).addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('suSubmit').click(); });
    });

    document.getElementById('signOutBtn').addEventListener('click', async () => {
        await api.signOut();
        setLoggedOut();
    });
}