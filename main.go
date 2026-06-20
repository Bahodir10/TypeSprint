// main.go
package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"typesprint/internal/handlers"
	"typesprint/internal/middleware"
	"typesprint/internal/store"
)

func main() {
	// Initialize data folders and memory maps
	os.MkdirAll("./data", 0755)
	store.LoadData()

	// Static file serving
	fs := http.FileServer(http.Dir("./static"))
	http.Handle("/static/", http.StripPrefix("/static/", fs))
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "./static/index.html")
	})

	// API Routing
	http.HandleFunc("/api/words", middleware.WithMiddleware(handlers.WordsHandler))
	http.HandleFunc("/api/results", middleware.WithMiddleware(handlers.ResultsHandler))
	http.HandleFunc("/api/results/by-day", middleware.WithMiddleware(handlers.CalendarHandler))
	http.HandleFunc("/api/auth/signup", middleware.WithMiddleware(handlers.SignupHandler))
	http.HandleFunc("/api/auth/signin", middleware.WithMiddleware(handlers.SigninHandler))
	http.HandleFunc("/api/auth/signout", middleware.WithMiddleware(handlers.SignoutHandler))
	http.HandleFunc("/api/auth/me", middleware.WithMiddleware(handlers.MeHandler))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8082" // Dasturlash uchun standart port
	}

	fmt.Printf("TypeSprint running on port %s\n", port)
    
	// SHU YERNI O'ZGARTIRING: ":" o'rniga "0.0.0.0:" qiling
	log.Fatal(http.ListenAndServe("0.0.0.0:"+port, nil))
}
