package database

import (
	"log"

	"github.com/jingshouyan/CodeForge101/backend/internal/model"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Connect(dsn string) (*gorm.DB, error) {
	return gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
}

// Migrate 平台自身表（M1：users/apps/app_members/app_pages）
func Migrate(db *gorm.DB) error {
	return db.AutoMigrate(&model.User{}, &model.App{}, &model.AppMember{}, &model.AppPage{})
}

// SeedAdmin 首次启动创建 admin 账号（admin/admin123）
func SeedAdmin(db *gorm.DB) error {
	var count int64
	if err := db.Model(&model.User{}).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return nil
	}
	hash, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	admin := model.User{Username: "admin", PasswordHash: string(hash), Nickname: "管理员", Role: "admin"}
	if err := db.Create(&admin).Error; err != nil {
		return err
	}
	log.Println("[seed] admin 账号已创建 (admin/admin123)，请尽快修改")
	return nil
}
