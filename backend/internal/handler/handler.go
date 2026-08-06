package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/jingshouyan/CodeForge101/backend/internal/dto"
	"github.com/jingshouyan/CodeForge101/backend/internal/middleware"
	"github.com/jingshouyan/CodeForge101/backend/internal/service"
)

func Login(svc *service.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req dto.LoginRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, dto.Err(400, "参数错误"))
			return
		}
		resp, err := svc.Login(req)
		if err != nil {
			c.JSON(401, dto.Err(401, err.Error()))
			return
		}
		c.JSON(200, dto.OK(resp))
	}
}

func Me(svc *service.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		u, err := svc.GetUser(middleware.UserID(c))
		if err != nil {
			c.JSON(404, dto.Err(404, "用户不存在"))
			return
		}
		c.JSON(200, dto.OK(u))
	}
}

// ---- 应用 ----

func ListApps(svc *service.AppService) gin.HandlerFunc {
	return func(c *gin.Context) {
		apps, err := svc.List()
		if err != nil {
			c.JSON(500, dto.Err(500, "查询失败"))
			return
		}
		c.JSON(200, dto.OK(apps))
	}
}

func GetApp(svc *service.AppService) gin.HandlerFunc {
	return func(c *gin.Context) {
		app, err := svc.Get(parseID(c.Param("id")))
		if err != nil {
			c.JSON(404, dto.Err(404, "应用不存在"))
			return
		}
		c.JSON(200, dto.OK(app))
	}
}

func CreateApp(svc *service.AppService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req dto.CreateAppRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, dto.Err(400, "参数错误"))
			return
		}
		app, err := svc.Create(req, middleware.UserID(c))
		if err != nil {
			c.JSON(500, dto.Err(500, "创建失败"))
			return
		}
		c.JSON(200, dto.OK(app))
	}
}

func UpdateApp(svc *service.AppService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req dto.UpdateAppRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, dto.Err(400, "参数错误"))
			return
		}
		app, err := svc.Update(parseID(c.Param("id")), middleware.UserID(c), middleware.UserRole(c), req)
		if err != nil {
			if err.Error() == "无权操作该应用" {
				c.JSON(403, dto.Err(403, err.Error()))
				return
			}
			c.JSON(404, dto.Err(404, "应用不存在"))
			return
		}
		c.JSON(200, dto.OK(app))
	}
}

// ---- 页面 ----

func ListPages(svc *service.PageService) gin.HandlerFunc {
	return func(c *gin.Context) {
		pages, err := svc.List(parseID(c.Param("id")))
		if err != nil {
			c.JSON(500, dto.Err(500, "查询失败"))
			return
		}
		c.JSON(200, dto.OK(pages))
	}
}

func GetPage(svc *service.PageService) gin.HandlerFunc {
	return func(c *gin.Context) {
		page, err := svc.Get(parseID(c.Param("id")), parseID(c.Param("pageId")))
		if err != nil {
			c.JSON(404, dto.Err(404, "页面不存在"))
			return
		}
		c.JSON(200, dto.OK(page))
	}
}

func CreatePage(svc *service.PageService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req dto.CreatePageRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, dto.Err(400, "参数错误"))
			return
		}
		page, err := svc.Create(parseID(c.Param("id")), middleware.UserID(c), req)
		if err != nil {
			c.JSON(400, dto.Err(400, err.Error()))
			return
		}
		c.JSON(200, dto.OK(page))
	}
}

func UpdatePage(svc *service.PageService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req dto.UpdatePageRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, dto.Err(400, "参数错误"))
			return
		}
		page, err := svc.Update(parseID(c.Param("id")), parseID(c.Param("pageId")), middleware.UserID(c), middleware.UserRole(c), req)
		if err != nil {
			switch {
			case err.Error() == "无权操作该应用", err.Error() == "页面已被他人修改，请刷新后重试", err.Error() == "schema 不是合法 JSON", err.Error() == "schema 缺少 root.type":
				c.JSON(400, dto.Err(400, err.Error()))
			default:
				c.JSON(404, dto.Err(404, "页面不存在"))
			}
			return
		}
		c.JSON(200, dto.OK(page))
	}
}

func DeletePage(svc *service.PageService) gin.HandlerFunc {
	return func(c *gin.Context) {
		err := svc.Delete(parseID(c.Param("id")), parseID(c.Param("pageId")), middleware.UserID(c), middleware.UserRole(c))
		if err != nil {
			if err.Error() == "无权操作该应用" {
				c.JSON(403, dto.Err(403, err.Error()))
				return
			}
			c.JSON(404, dto.Err(404, "页面不存在"))
			return
		}
		c.JSON(200, dto.OK(nil))
	}
}

func parseID(s string) uint64 {
	id, _ := strconv.ParseUint(s, 10, 64)
	return id
}
