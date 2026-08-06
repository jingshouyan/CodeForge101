package main

import (
	"log"

	"github.com/jingshouyan/CodeForge101/backend/internal/config"
	"github.com/jingshouyan/CodeForge101/backend/internal/database"
	"github.com/jingshouyan/CodeForge101/backend/internal/router"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("配置加载失败: %v", err)
	}

	db, err := database.Connect(cfg.DBURL)
	if err != nil {
		log.Fatalf("数据库连接失败: %v", err)
	}
	if err := database.Migrate(db); err != nil {
		log.Fatalf("数据库迁移失败: %v", err)
	}
	if err := database.SeedAdmin(db); err != nil {
		log.Fatalf("种子数据失败: %v", err)
	}

	r := router.New(db, *cfg)
	log.Printf("服务启动: http://localhost:%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("服务启动失败: %v", err)
	}
}
