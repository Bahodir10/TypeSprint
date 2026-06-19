// internal/handlers/auth.go
package handlers

import (
	"encoding/json"
	"net/http"
	"time"
	"typesprint/internal/models"
	"typesprint/internal/store"
	"typesprint/internal/utils"
)

// getSessionUser is a shared helper for the handlers package
func getSessionUser(r *http.Request) (string, bool) {
	cookie, err := r.Cookie("session")
	if err != nil {
		return "", false
	}
	store.Mu.RLock()
	sess, ok := store.Sessions[cookie.Value]
	store.Mu.RUnlock()
	
	if !ok || time.Now().After(sess.ExpiresAt) {
		return "", false
	}
	return sess.Username, true
}

func SignupHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Username == "" || req.Password == "" {
		http.Error(w, `{"error":"username and password required"}`, http.StatusBadRequest)
		return
	}
	if len(req.Username) < 3 || len(req.Username) > 20 {
		http.Error(w, `{"error":"username must be 3-20 characters"}`, http.StatusBadRequest)
		return
	}
	if len(req.Password) < 4 {
		http.Error(w, `{"error":"password must be at least 4 characters"}`, http.StatusBadRequest)
		return
	}
	
	store.Mu.Lock()
	defer store.Mu.Unlock()
	
	if _, exists := store.Users[req.Username]; exists {
		http.Error(w, `{"error":"username already taken"}`, http.StatusConflict)
		return
	}
	
	salt := utils.GenerateSalt()
	store.Users[req.Username] = models.User{
		Username:     req.Username,
		PasswordHash: utils.HashPassword(req.Password, salt),
		Salt:         salt,
		CreatedAt:    time.Now().Format(time.RFC3339),
	}
	store.SaveUsers()

	token := utils.GenerateSessionToken()
	store.Sessions[token] = models.Session{Username: req.Username, ExpiresAt: time.Now().Add(30 * 24 * time.Hour)}
	http.SetCookie(w, &http.Cookie{Name: "session", Value: token, Path: "/", MaxAge: 30 * 24 * 3600, HttpOnly: true})
	json.NewEncoder(w).Encode(map[string]string{"username": req.Username})
}

func SigninHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request"}`, http.StatusBadRequest)
		return
	}
	
	store.Mu.Lock()
	defer store.Mu.Unlock()
	
	user, exists := store.Users[req.Username]
	if !exists || utils.HashPassword(req.Password, user.Salt) != user.PasswordHash {
		http.Error(w, `{"error":"invalid username or password"}`, http.StatusUnauthorized)
		return
	}
	
	token := utils.GenerateSessionToken()
	store.Sessions[token] = models.Session{Username: req.Username, ExpiresAt: time.Now().Add(30 * 24 * time.Hour)}
	http.SetCookie(w, &http.Cookie{Name: "session", Value: token, Path: "/", MaxAge: 30 * 24 * 3600, HttpOnly: true})
	json.NewEncoder(w).Encode(map[string]string{"username": req.Username})
}

func SignoutHandler(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session")
	if err == nil {
		store.Mu.Lock()
		delete(store.Sessions, cookie.Value)
		store.Mu.Unlock()
	}
	http.SetCookie(w, &http.Cookie{Name: "session", Value: "", Path: "/", MaxAge: -1})
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func MeHandler(w http.ResponseWriter, r *http.Request) {
	username, ok := getSessionUser(r)
	if !ok {
		http.Error(w, `{"error":"not authenticated"}`, http.StatusUnauthorized)
		return
	}
	json.NewEncoder(w).Encode(map[string]string{"username": username})
}