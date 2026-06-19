export const api = {
    async checkSession() {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
            return await res.json();
        }
        throw new Error('Not logged in');
    },

    async signIn(username, password) {
        const res = await fetch('/api/auth/signin', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Sign in failed');
        return data;
    },

    async signUp(username, password) {
        const res = await fetch('/api/auth/signup', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Sign up failed');
        return data;
    },

    async signOut() {
        await fetch('/api/auth/signout', { method: 'POST' });
    },

    async getStats() {
        const res = await fetch('/api/results');
        if (!res.ok) throw new Error('Could not load stats');
        return await res.json();
    },

    async getCalendarDays() {
        const res = await fetch('/api/results/by-day');
        if (!res.ok) throw new Error('Could not load calendar');
        return await res.json();
    },

    async getDayStats(date) {
        const res = await fetch(`/api/results/by-day?date=${encodeURIComponent(date)}`);
        if (!res.ok) throw new Error('Could not load day stats');
        return await res.json();
    },

    async saveResult(result) {
        const res = await fetch('/api/results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result)
        });
        if (!res.ok) {
            let msg = 'Save failed (' + res.status + ')';
            try { 
                const d = await res.json(); 
                if (d.error) msg = d.error; 
            } catch {}
            throw new Error(msg);
        }
        return true;
    },

    async fetchWords() {
        try { 
            const r = await fetch('/api/words'); 
            return await r.json(); 
        } catch { 
            return ["error", "loading", "words"]; 
        }
    }
};