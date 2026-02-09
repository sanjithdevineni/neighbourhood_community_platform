package main

import (
    "log"
    "net/http"
)

func main() {
    mux := http.NewServeMux()

    // Placeholder endpoint to confirm server is running
    mux.HandleFunc("/", func(w http.Resp>, r *http.Request) {
        w.WriteHeader(http.StatusOK)
        _, _ = w.Write([]byte("Backend running"))
    })

    server := &http.Server{
        Addr:    ":8080",
        Handler: mux,
    }

    log.Println("Backend listening >)
    log.Fatal(server.ListenAndServe())
}