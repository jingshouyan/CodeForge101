package service

import (
	"errors"

	"github.com/jingshouyan/CodeForge101/backend/internal/dto"
	"github.com/jingshouyan/CodeForge101/backend/internal/model"
	"gorm.io/gorm"
)

type AppService struct {
	db *gorm.DB
}

func NewAppService(db *gorm.DB) *AppService {
	return &AppService{db: db}
}

// canManage：admin 全过；非 admin 仅 owner 可管理（M1 简化）
func (s *AppService) canManage(appID, userID uint64, role string) (bool, error) {
	if role == "admin" {
		return true, nil
	}
	var app model.App
	if err := s.db.Select("owner_id").First(&app, appID).Error; err != nil {
		return false, err
	}
	return app.OwnerID == userID, nil
}

func (s *AppService) List() ([]model.App, error) {
	var apps []model.App
	if err := s.db.Preload("Owner").Order("id DESC").Find(&apps).Error; err != nil {
		return nil, err
	}
	return apps, nil
}

func (s *AppService) Get(id uint64) (*model.App, error) {
	var app model.App
	if err := s.db.Preload("Owner").First(&app, id).Error; err != nil {
		return nil, err
	}
	return &app, nil
}

func (s *AppService) Create(req dto.CreateAppRequest, ownerID uint64) (*model.App, error) {
	app := model.App{Name: req.Name, Icon: req.Icon, Description: req.Description, OwnerID: ownerID}
	if err := s.db.Create(&app).Error; err != nil {
		return nil, err
	}
	return &app, nil
}

func (s *AppService) Update(id, userID uint64, role string, req dto.UpdateAppRequest) (*model.App, error) {
	ok, err := s.canManage(id, userID, role)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, errors.New("无权操作该应用")
	}
	updates := map[string]interface{}{}
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if len(updates) == 0 {
		return nil, errors.New("没有可更新的字段")
	}
	if err := s.db.Model(&model.App{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		return nil, err
	}
	return s.Get(id)
}
