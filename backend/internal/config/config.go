package config

import "os"

type Config struct {
	Port      string
	DBURL     string
	JWTSecret string
}

func Load() Config {
	return Config{
		Port:      getEnv("PORT", "8080"),
		DBURL:     getEnv("DATABASE_URL", "postgres://code_forge101:abcd1234@localhost:5432/code_forge101?sslmode=disable"),
		JWTSecret: getEnv("JWT_SECRET", "dev-secret-change-me"),
	}
}

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
