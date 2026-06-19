// internal/store/store.go
package store

import (
	"encoding/json"
	"log"
	"os"
	"sync"
	"typesprint/internal/models"
)

var (
	Users    = map[string]models.User{}
	Sessions = map[string]models.Session{}
	Results  = []models.TestResult{}
	Mu       sync.RWMutex
)

const (
	usersFile   = "./data/users.json"
	resultsFile = "./data/results.json"
)

func LoadData() {
	if b, err := os.ReadFile(usersFile); err == nil {
		json.Unmarshal(b, &Users)
	}
	if b, err := os.ReadFile(resultsFile); err == nil {
		json.Unmarshal(b, &Results)
	}
	log.Printf("Loaded %d users, %d results", len(Users), len(Results))
}

func SaveUsers() {
	os.MkdirAll("./data", 0755)
	b, _ := json.MarshalIndent(Users, "", "  ")
	os.WriteFile(usersFile, b, 0644)
}

func SaveResults() {
	os.MkdirAll("./data", 0755)
	b, _ := json.MarshalIndent(Results, "", "  ")
	os.WriteFile(resultsFile, b, 0644)
}