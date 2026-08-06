package config

import (
	"errors"
	"fmt"
	"net/url"
	"strings"

	"github.com/spf13/viper"
)

type Config struct {
	Port      string
	DBURL     string
	JWTSecret string
}

// Load 配置优先级：环境变量 > config.yaml > 默认值。
// 数据库连接串由 database.* 字段组合；显式设置 database_url（环境变量或配置文件）时整体覆盖。
// 配置文件可选（backend/config.yaml，参考 config.example.yaml），缺失不报错。
func Load() (*Config, error) {
	v := viper.New()

	v.SetDefault("port", "8080")
	v.SetDefault("jwt_secret", "dev-secret-change-me")
	v.SetDefault("database_url", "")
	v.SetDefault("database.host", "localhost")
	v.SetDefault("database.port", 5432)
	v.SetDefault("database.user", "code_forge101")
	v.SetDefault("database.password", "abcd1234")
	v.SetDefault("database.name", "code_forge101")
	v.SetDefault("database.sslmode", "disable")

	v.SetConfigName("config")
	v.SetConfigType("yaml")
	v.AddConfigPath(".")
	if err := v.ReadInConfig(); err != nil {
		var notFound viper.ConfigFileNotFoundError
		if !errors.As(err, &notFound) {
			return nil, fmt.Errorf("读取配置文件失败: %w", err)
		}
	}

	// 环境变量覆盖：PORT / JWT_SECRET / DATABASE_URL / DATABASE_HOST / DATABASE_PORT / ...
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	v.AutomaticEnv()

	cfg := &Config{
		Port:      v.GetString("port"),
		JWTSecret: v.GetString("jwt_secret"),
	}
	cfg.DBURL = buildDSN(v)
	return cfg, nil
}

// buildDSN：database_url 非空时直接使用；否则由 database.* 组合
func buildDSN(v *viper.Viper) string {
	if u := v.GetString("database_url"); u != "" {
		return u
	}
	u := &url.URL{
		Scheme: "postgres",
		User:   url.UserPassword(v.GetString("database.user"), v.GetString("database.password")),
		Host:   fmt.Sprintf("%s:%d", v.GetString("database.host"), v.GetInt("database.port")),
		Path:   "/" + v.GetString("database.name"),
	}
	q := u.Query()
	q.Set("sslmode", v.GetString("database.sslmode"))
	u.RawQuery = q.Encode()
	return u.String()
}
