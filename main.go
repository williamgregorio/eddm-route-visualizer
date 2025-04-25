package main

import (
	"log"
	"net/http"
)

func main() {
	fs := http.FileServer(http.Dir("."))

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			http.ServeFile(w, r, "./map.html")
			return
		}
		fs.ServeHTTP(w, r)
	})

	log.Println("Serving on http://localhost:7070")
	err := http.ListenAndServe(":7070", nil)
	if err != nil {
		log.Fatal("Server failed:", err)
	}
}
