package middleware

import (
	"fmt"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jingshouyan/CodeForge101/backend/internal/dto"
)

const (
	CtxUserID   = "userID"
	CtxUserRole = "userRole"
)

func UserID(c *gin.Context) uint64 {
	if v, ok := c.Get(CtxUserID); ok {
		return v.(uint64)
	}
	return 0
}

func UserRole(c *gin.Context) string {
	if v, ok := c.Get(CtxUserRole); ok {
		return v.(string)
	}
	return ""
}

// Auth JWT 校验中间件：Authorization: Bearer <token>
func Auth(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		tokenStr, ok := strings.CutPrefix(header, "Bearer ")
		if !ok || tokenStr == "" {
			c.AbortWithStatusJSON(401, dto.Err(401, "未登录"))
			return
		}
		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
			}
			return []byte(secret), nil
		})
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(401, dto.Err(401, "登录已失效"))
			return
		}
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(401, dto.Err(401, "登录已失效"))
			return
		}
		uid, ok := claims["uid"].(float64)
		role, _ := claims["role"].(string)
		if !ok || uid <= 0 {
			c.AbortWithStatusJSON(401, dto.Err(401, "登录已失效"))
			return
		}
		c.Set(CtxUserID, uint64(uid))
		c.Set(CtxUserRole, role)
		c.Next()
	}
}
