// internal/handlers/results.go
package handlers

import (
	"encoding/json"
	"math"
	"net/http"
	"sort"
	"time"
	"typesprint/internal/models"
	"typesprint/internal/store"
)

func ResultsHandler(w http.ResponseWriter, r *http.Request) {
	username, loggedIn := getSessionUser(r)

	if r.Method == http.MethodPost {
		var raw map[string]interface{}
		if err := json.NewDecoder(r.Body).Decode(&raw); err != nil {
			http.Error(w, `{"error":"invalid json"}`, http.StatusBadRequest)
			return
		}
		
		toFloat := func(v interface{}) float64 {
			if v == nil { return 0 }
			switch n := v.(type) {
			case float64: return n
			case int: return float64(n)
			}
			return 0
		}
		toInt := func(v interface{}) int { return int(toFloat(v)) }
		toString := func(v interface{}) string {
			if v == nil { return "" }
			if s, ok := v.(string); ok { return s }
			return ""
		}
		
		payload := models.TestResult{
			WPM:         toInt(raw["wpm"]),
			RawWPM:      toFloat(raw["raw_wpm"]),
			Accuracy:    toFloat(raw["accuracy"]),
			Errors:      toInt(raw["errors"]),
			Correct:     toInt(raw["correct"]),
			Typed:       toInt(raw["typed"]),
			Consistency: toFloat(raw["consistency"]),
			Mode:        toString(raw["mode"]),
			Value:       toInt(raw["value"]),
			Duration:    toFloat(raw["duration"]),
			ClientTime:  toString(raw["client_time"]),
		}
		
		if loggedIn {
			payload.Username = username
		} else {
			payload.Username = ""
		}
		payload.ServerTime = time.Now().Format(time.RFC3339)

		store.Mu.Lock()
		store.Results = append(store.Results, payload)
		store.SaveResults()
		store.Mu.Unlock()

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
		return
	}

	if r.Method == http.MethodGet {
		if !loggedIn {
			http.Error(w, `{"error":"not authenticated"}`, http.StatusUnauthorized)
			return
		}
		
		store.Mu.RLock()
		userResults := []models.TestResult{}
		for _, res := range store.Results {
			if res.Username == username {
				userResults = append(userResults, res)
			}
		}
		store.Mu.RUnlock()

		stats := computeStats(userResults)
		json.NewEncoder(w).Encode(stats)
		return
	}
	
	w.WriteHeader(http.StatusMethodNotAllowed)
}

func computeStats(res []models.TestResult) models.UserStats {
	if len(res) == 0 {
		return models.UserStats{}
	}
	sort.Slice(res, func(i, j int) bool { return res[i].ClientTime < res[j].ClientTime })

	stats := models.UserStats{}
	stats.TestsCompleted = len(res)

	totalWPM := 0
	totalAcc := 0.0
	totalErr := 0.0
	totalTime := 0.0

	for _, r := range res {
		if r.WPM > stats.BestWPM {
			stats.BestWPM = r.WPM
		}
		if r.Accuracy > stats.BestAccuracy {
			stats.BestAccuracy = r.Accuracy
		}
		totalWPM += r.WPM
		totalAcc += r.Accuracy
		totalErr += float64(r.Errors)
		totalTime += r.Duration
		stats.WpmHistory = append(stats.WpmHistory, r.WPM)
		stats.AccHistory = append(stats.AccHistory, r.Accuracy)
	}

	n := float64(len(res))
	stats.AvgWPM = math.Round(float64(totalWPM)/n*10) / 10
	stats.AvgAccuracy = math.Round(totalAcc/n*10) / 10
	stats.AvgErrors = math.Round(totalErr/n*10) / 10
	stats.TotalTime = totalTime

	if len(res) >= 10 {
		firstAvg := 0.0
		lastAvg := 0.0
		for i := 0; i < 5; i++ {
			firstAvg += float64(res[i].WPM)
			lastAvg += float64(res[len(res)-5+i].WPM)
		}
		stats.Improvement = math.Round((lastAvg/5-firstAvg/5)*10) / 10
	}

	recent := res
	if len(recent) > 20 {
		recent = recent[len(recent)-20:]
	}
	for i, j := 0, len(recent)-1; i < j; i, j = i+1, j-1 {
		recent[i], recent[j] = recent[j], recent[i]
	}
	stats.RecentResults = recent

	if len(stats.WpmHistory) > 50 {
		stats.WpmHistory = stats.WpmHistory[len(stats.WpmHistory)-50:]
		stats.AccHistory = stats.AccHistory[len(stats.AccHistory)-50:]
	}

	return stats
}