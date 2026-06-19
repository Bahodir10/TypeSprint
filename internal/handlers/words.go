// internal/handlers/words.go
package handlers

import (
	"encoding/json"
	"net/http"
)

func WordsHandler(w http.ResponseWriter, r *http.Request) {
	words := []string{
		"program", "developer", "keyboard", "random", "simple", "example", "function", "variable",
		"typing", "speed", "accuracy", "challenge", "time", "server", "client", "network",
		"go", "javascript", "html", "css", "design", "practice", "session", "performance",
		"monitor", "test", "result", "score", "fast", "focus", "goal", "start",
		"restart", "statistics", "input", "output", "array", "slice",
		"structure", "object", "method", "compute", "measure", "minute", "second", "word",
		"type", "sprint", "boost", "track", "learn", "skill", "flow", "sharp",
		"quick", "build", "write", "reach", "guide", "force", "press", "train",
	}
	json.NewEncoder(w).Encode(words)
}