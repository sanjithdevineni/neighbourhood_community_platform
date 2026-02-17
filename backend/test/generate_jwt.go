package main

import (
	"flag"
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load("../.env")

	sub := flag.String("sub", "user123", "subject (user id) to put in token sub claim")
	exp := flag.String("exp", "24h", "token expiry duration (e.g. 24h or 60m)")
	secretFlag := flag.String("secret", "", "JWT secret (overrides env JWT_SECRET)")
	flag.Parse()

	secret := *secretFlag
	if secret == "" {
		secret = os.Getenv("JWT_SECRET")
	}
	if secret == "" {
		fmt.Fprintln(os.Stderr, "JWT_SECRET not set in env or -secret flag")
		os.Exit(2)
	}

	dur, err := time.ParseDuration(*exp)
	if err != nil {
		// try parse as hours integer
		fmt.Fprintln(os.Stderr, "invalid expiry format; use e.g. 24h or 60m")
		os.Exit(2)
	}

	claims := jwt.RegisteredClaims{
		Subject:   *sub,
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(dur)),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(secret))
	if err != nil {
		fmt.Fprintln(os.Stderr, "failed to sign token:", err)
		os.Exit(1)
	}

	fmt.Println(signed)
}
