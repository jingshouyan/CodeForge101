package service

import (
	"encoding/json"
	"errors"

	"github.com/jingshouyan/CodeForge101/backend/internal/dto"
	"github.com/jingshouyan/CodeForge101/backend/internal/model"
	"gorm.io/gorm"
)

type PageService struct {
	db *gorm.DB
}

func NewPageService(db *gorm.DB) *PageService {
	return &PageService{db: db}
}

// canManage：admin 或 app owner（M1 简化）
func (s *PageService) canManage(appID, userID uint64, role string) (bool, error) {
	if role == "admin" {
		return true, nil
	}
	var app model.App
	if err := s.db.Select("owner_id").First(&app, appID).Error; err != nil {
		return false, err
	}
	return app.OwnerID == userID, nil
}

// ValidateSchema 最小校验：合法 JSON 且 root.type 非空
func ValidateSchema(raw string) error {
	var doc struct {
		Root struct {
			Type string `json:"type"`
		} `json:"root"`
	}
	if err := json.Unmarshal([]byte(raw), &doc); err != nil {
		return errors.New("schema 不是合法 JSON")
	}
	if doc.Root.Type == "" {
		return errors.New("schema 缺少 root.type")
	}
	return nil
}

func (s *PageService) List(appID uint64) ([]model.AppPage, error) {
	var pages []model.AppPage
	if err := s.db.Where("app_id = ?", appID).Order("id ASC").Find(&pages).Error; err != nil {
		return nil, err
	}
	return pages, nil
}

func (s *PageService) Get(appID, pageID uint64) (*model.AppPage, error) {
	var page model.AppPage
	if err := s.db.Where("id = ? AND app_id = ?", pageID, appID).First(&page).Error; err != nil {
		return nil, err
	}
	return &page, nil
}

func (s *PageService) Create(appID, userID uint64, req dto.CreatePageRequest) (*model.AppPage, error) {
	if err := ValidateSchema(req.Schema); err != nil {
		return nil, err
	}
	page := model.AppPage{AppID: appID, Name: req.Name, Path: req.Path, Schema: req.Schema, CreatedBy: userID}
	if err := s.db.Create(&page).Error; err != nil {
		if isUniqueViolation(err) {
			return nil, errors.New("页面路径已存在")
		}
		return nil, err
	}
	return &page, nil
}

func (s *PageService) Update(appID, pageID, userID uint64, role string, req dto.UpdatePageRequest) (*model.AppPage, error) {
	ok, err := s.canManage(appID, userID, role)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, errors.New("无权操作该应用")
	}
	page, err := s.Get(appID, pageID)
	if err != nil {
		return nil, err
	}
	if req.Version == nil || *req.Version != page.Version {
		return nil, errors.New("页面已被他人修改，请刷新后重试")
	}
	updates := map[string]interface{}{"version": page.Version + 1}
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Path != nil {
		updates["path"] = *req.Path
	}
	if req.Schema != nil {
		if err := ValidateSchema(*req.Schema); err != nil {
			return nil, err
		}
		updates["schema"] = *req.Schema
	}
	if err := s.db.Model(&model.AppPage{}).Where("id = ? AND version = ?", pageID, page.Version).Updates(updates).Error; err != nil {
		return nil, err
	}
	return s.Get(appID, pageID)
}

func (s *PageService) Delete(appID, pageID, userID uint64, role string) error {
	ok, err := s.canManage(appID, userID, role)
	if err != nil {
		return err
	}
	if !ok {
		return errors.New("无权操作该应用")
	}
	return s.db.Where("id = ? AND app_id = ?", pageID, appID).Delete(&model.AppPage{}).Error
}

// isUniqueViolation：PostgreSQL 23505 唯一约束冲突
func isUniqueViolation(err error) bool {
	var pgErr interface{ SQLState() string }
	if errors.As(err, &pgErr) {
		return pgErr.SQLState() == "23505"
	}
	return false
}
