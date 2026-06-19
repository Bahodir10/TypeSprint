// internal/models/models.go
package models

import "time"

type User struct {
	Username     string `json:"username"`
	PasswordHash string `json:"password_hash"`
	Salt         string `json:"salt"`
	CreatedAt    string `json:"created_at"`
}

type Session struct {
	Username  string
	ExpiresAt time.Time
}

type TestResult struct {
	Username    string  `json:"username"`
	WPM         int     `json:"wpm"`
	RawWPM      float64 `json:"raw_wpm"`
	Accuracy    float64 `json:"accuracy"`
	Errors      int     `json:"errors"`
	Correct     int     `json:"correct"`
	Typed       int     `json:"typed"`
	Consistency float64 `json:"consistency"`
	Mode        string  `json:"mode"`
	Value       int     `json:"value"`
	Duration    float64 `json:"duration"`
	ClientTime  string  `json:"client_time"`
	ServerTime  string  `json:"server_time"`
}

type UserStats struct {
	TestsCompleted int          `json:"tests_completed"`
	BestWPM        int          `json:"best_wpm"`
	AvgWPM         float64      `json:"avg_wpm"`
	AvgAccuracy    float64      `json:"avg_accuracy"`
	TotalTime      float64      `json:"total_time_seconds"`
	BestAccuracy   float64      `json:"best_accuracy"`
	AvgErrors      float64      `json:"avg_errors"`
	Improvement    float64      `json:"improvement"`
	RecentResults  []TestResult `json:"recent_results"`
	WpmHistory     []int        `json:"wpm_history"`
	AccHistory     []float64    `json:"acc_history"`
}