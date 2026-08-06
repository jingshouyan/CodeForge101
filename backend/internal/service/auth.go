package service

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jingshouyan/CodeForge101/backend/internal/dto"
	"github.com/jingshouyan/CodeForge101/backend/internal/model"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthService struct {
	db     *gorm.DB
	secret string
}

func NewAuthService(db *gorm.DB, secret string) *AuthService {
	return &AuthService{db: db, secret: secret}
}

func (s *AuthService) Login(req dto.LoginRequest) (*dto.LoginResponse, error) {
	var u model.User
	if err := s.db.Where("username = ? AND status = 'active'", req.Username).First(&u).Error; err != nil {
		return nil, errors.New("用户名或密码错误")
	}
	if bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(req.Password)) != nil {
		return nil, errors.New("用户名或密码错误")
	}
	claims := jwt.MapClaims{
		"uid":  u.ID,
		"role": u.Role,
		"exp":  time.Now().Add(24 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(s.secret))
	if err != nil {
		return nil, err
	}
	return &dto.LoginResponse{
		Token: signed,
		User:  toUserDTO(&u),
	}, nil
}

func (s *AuthService) GetUser(id uint64) (*dto.User, error) {
	var u model.User
	if err := s.db.First(&u, id).Error; err != nil {
		return nil, err
	}
	user := toUserDTO(&u)
	return &user, nil
}

func toUserDTO(u *model.User) dto.User {
	return dto.User{ID: u.ID, Username: u.Username, Nickname: u.Nickname, Role: u.Role}
}
