package router

import (
	"github.com/gin-gonic/gin"
	"github.com/jingshouyan/CodeForge101/backend/internal/config"
	"github.com/jingshouyan/CodeForge101/backend/internal/handler"
	"github.com/jingshouyan/CodeForge101/backend/internal/middleware"
	"github.com/jingshouyan/CodeForge101/backend/internal/service"
	"gorm.io/gorm"
)

func New(db *gorm.DB, cfg config.Config) *gin.Engine {
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())

	authSvc := service.NewAuthService(db, cfg.JWTSecret)
	appSvc := service.NewAppService(db)
	pageSvc := service.NewPageService(db)

	api := r.Group("/api")
	api.POST("/auth/login", handler.Login(authSvc))

	auth := api.Group("", middleware.Auth(cfg.JWTSecret))
	auth.GET("/auth/me", handler.Me(authSvc))
	auth.GET("/apps", handler.ListApps(appSvc))
	auth.POST("/apps", handler.CreateApp(appSvc))
	auth.GET("/apps/:id", handler.GetApp(appSvc))
	auth.PUT("/apps/:id", handler.UpdateApp(appSvc))
	auth.GET("/apps/:id/pages", handler.ListPages(pageSvc))
	auth.POST("/apps/:id/pages", handler.CreatePage(pageSvc))
	auth.GET("/apps/:id/pages/:pageId", handler.GetPage(pageSvc))
	auth.PUT("/apps/:id/pages/:pageId", handler.UpdatePage(pageSvc))
	auth.DELETE("/apps/:id/pages/:pageId", handler.DeletePage(pageSvc))

	return r
}
