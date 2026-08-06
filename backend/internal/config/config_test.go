package config

import (
	"testing"

	"github.com/spf13/viper"
)

func newTestViper() *viper.Viper {
	v := viper.New()
	v.SetDefault("database.host", "localhost")
	v.SetDefault("database.port", 5432)
	v.SetDefault("database.user", "code_forge101")
	v.SetDefault("database.password", "abcd1234")
	v.SetDefault("database.name", "code_forge101")
	v.SetDefault("database.sslmode", "disable")
	return v
}

func TestBuildDSN_FromParts(t *testing.T) {
	v := newTestViper()
	got := buildDSN(v)
	want := "postgres://code_forge101:abcd1234@localhost:5432/code_forge101?sslmode=disable"
	if got != want {
		t.Errorf("buildDSN() = %q, want %q", got, want)
	}
}

func TestBuildDSN_PasswordEscaping(t *testing.T) {
	v := newTestViper()
	v.Set("database.password", "p@ss:w/rd")
	got := buildDSN(v)
	want := "postgres://code_forge101:p%40ss%3Aw%2Frd@localhost:5432/code_forge101?sslmode=disable"
	if got != want {
		t.Errorf("buildDSN() = %q, want %q", got, want)
	}
}

func TestBuildDSN_OverrideWithURL(t *testing.T) {
	v := newTestViper()
	v.Set("database_url", "postgres://cloud:xxx@db.example.com:5433/app?sslmode=require")
	got := buildDSN(v)
	want := "postgres://cloud:xxx@db.example.com:5433/app?sslmode=require"
	if got != want {
		t.Errorf("buildDSN() = %q, want %q", got, want)
	}
}
