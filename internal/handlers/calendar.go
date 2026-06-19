// internal/handlers/calendar.go
package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
	"typesprint/internal/store"
)

// CalendarHandler handles GET /api/results/by-day
// Returns all days that have test results for the logged-in user,
// plus the results for a specific date when ?date=YYYY-MM-DD is provided.
func CalendarHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	username, loggedIn := getSessionUser(r)
	if !loggedIn {
		http.Error(w, `{"error":"not authenticated"}`, http.StatusUnauthorized)
		return
	}

	store.Mu.RLock()
	defer store.Mu.RUnlock()

	// Build a map of date -> list of results for this user
	// client_time is an ISO8601 string like "2025-06-19T14:32:00.000Z"
	type DaySummary struct {
		Date     string  `json:"date"`
		Count    int     `json:"count"`
		BestWPM  int     `json:"best_wpm"`
		AvgWPM   float64 `json:"avg_wpm"`
		AvgAcc   float64 `json:"avg_acc"`
		TotalErr int     `json:"total_errors"`
	}

	dayMap := map[string]*DaySummary{}

	for _, res := range store.Results {
		if res.Username != username {
			continue
		}
		// Extract date portion (first 10 chars of ISO string)
		date := ""
		if len(res.ClientTime) >= 10 {
			date = res.ClientTime[:10]
		} else if len(res.ServerTime) >= 10 {
			date = res.ServerTime[:10]
		}
		if date == "" {
			continue
		}

		if _, ok := dayMap[date]; !ok {
			dayMap[date] = &DaySummary{Date: date}
		}
		d := dayMap[date]
		d.Count++
		if res.WPM > d.BestWPM {
			d.BestWPM = res.WPM
		}
		d.AvgWPM += float64(res.WPM)
		d.AvgAcc += res.Accuracy
		d.TotalErr += res.Errors
	}

	// Finalise averages
	for _, d := range dayMap {
		if d.Count > 0 {
			d.AvgWPM = round2(d.AvgWPM / float64(d.Count))
			d.AvgAcc = round2(d.AvgAcc / float64(d.Count))
		}
	}

	// If a specific date is requested, also return its results
	requestedDate := strings.TrimSpace(r.URL.Query().Get("date"))

	type Response struct {
		Days        []*DaySummary          `json:"days"`
		DayResults  interface{}            `json:"day_results,omitempty"`
		DaySummary  *DaySummary            `json:"day_summary,omitempty"`
	}

	days := make([]*DaySummary, 0, len(dayMap))
	for _, d := range dayMap {
		days = append(days, d)
	}

	resp := Response{Days: days}

	if requestedDate != "" {
		// Return individual results for that date
		type SlimResult struct {
			WPM        int     `json:"wpm"`
			RawWPM     float64 `json:"raw_wpm"`
			Accuracy   float64 `json:"accuracy"`
			Errors     int     `json:"errors"`
			Mode       string  `json:"mode"`
			Value      int     `json:"value"`
			ClientTime string  `json:"client_time"`
		}
		dayResults := []SlimResult{}
		for _, res := range store.Results {
			if res.Username != username {
				continue
			}
			date := ""
			if len(res.ClientTime) >= 10 {
				date = res.ClientTime[:10]
			} else if len(res.ServerTime) >= 10 {
				date = res.ServerTime[:10]
			}
			if date == requestedDate {
				dayResults = append(dayResults, SlimResult{
					WPM:        res.WPM,
					RawWPM:     res.RawWPM,
					Accuracy:   res.Accuracy,
					Errors:     res.Errors,
					Mode:       res.Mode,
					Value:      res.Value,
					ClientTime: res.ClientTime,
				})
			}
		}
		resp.DayResults = dayResults
		resp.DaySummary = dayMap[requestedDate]
	}

	json.NewEncoder(w).Encode(resp)
}

func round2(v float64) float64 {
	return float64(int(v*100+0.5)) / 100
}