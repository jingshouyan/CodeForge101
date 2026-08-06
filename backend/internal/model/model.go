package model

import "time"

type User struct {
	ID           uint64    `gorm:"primaryKey" json:"id"`
	Username     string    `gorm:"size:64;uniqueIndex;not null" json:"username"`
	PasswordHash string    `gorm:"size:255;not null" json:"-"`
	Nickname     string    `gorm:"size:64;not null;default:''" json:"nickname"`
	Role         string    `gorm:"size:16;not null;default:'viewer'" json:"role"` // admin | designer | viewer
	Status       string    `gorm:"size:16;not null;default:'active'" json:"status"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

type App struct {
	ID          uint64    `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"size:128;not null" json:"name"`
	Icon        string    `gorm:"size:255;not null;default:''" json:"icon"`
	Description string    `gorm:"type:text;not null;default:''" json:"description"`
	OwnerID     uint64    `gorm:"not null" json:"ownerId"`
	Menu        string    `gorm:"type:jsonb;not null;default:'[]'" json:"-"`
	Status      string    `gorm:"size:16;not null;default:'active'" json:"status"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
	Owner       *User     `gorm:"foreignKey:OwnerID" json:"owner,omitempty"`
}

type AppMember struct {
	ID     uint64 `gorm:"primaryKey" json:"id"`
	AppID  uint64 `gorm:"uniqueIndex:uk_app_user;not null" json:"appId"`
	UserID uint64 `gorm:"uniqueIndex:uk_app_user;not null" json:"userId"`
	Role   string `gorm:"size:16;not null;default:'viewer'" json:"role"`
}

type AppPage struct {
	ID        uint64    `gorm:"primaryKey" json:"id"`
	AppID     uint64    `gorm:"uniqueIndex:uk_app_path;not null" json:"appId"`
	Name      string    `gorm:"size:128;not null" json:"name"`
	Path      string    `gorm:"size:128;not null" json:"path"`
	Schema    string    `gorm:"type:jsonb;not null" json:"schema"`
	Version   uint64    `gorm:"not null;default:1" json:"version"`
	CreatedBy uint64    `json:"createdBy"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
