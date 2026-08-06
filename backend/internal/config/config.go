package config

import (
	"errors"
	"fmt"

	"github.com/spf13/viper"
)

type Config struct {
	Port      string
	DBURL     string
	JWTSecret string
}

// Load 配置优先级：环境变量 > config.yaml > 默认值。
// 配置文件可选（backend/config.yaml，参考 config.example.yaml），缺失不报错。
func Load() (*Config, error) {
	v := viper.New()

	v.SetDefault("port", "8080")
	v.SetDefault("database_url", "postgres://code_forge101:abcd1234@localhost:5432/code_forge101?sslmode=disable")
	v.SetDefault("jwt_secret", "dev-secret-change-me")

	v.SetConfigName("config")
	v.SetConfigType("yaml")
	v.AddConfigPath(".")
	if err := v.ReadInConfig(); err != nil {
		var notFound viper.ConfigFileNotFoundError
		if !errors.As(err, &notFound) {
			return nil, fmt.Errorf("读取配置文件失败: %w", err)
		}
	}

	v.AutomaticEnv() // 环境变量覆盖：PORT / DATABASE_URL / JWT_SECRET

	return &Config{
		Port:      v.GetString("port"),
		DBURL:     v.GetString("database_url"),
		JWTSecret: v.GetString("jwt_secret"),
	}, nil
}
