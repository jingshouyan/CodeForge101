package dto

// Response 统一响应：{code, message, data}
type Response struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
}

func OK(data interface{}) Response {
	return Response{Code: 0, Message: "ok", Data: data}
}

func Err(code int, message string) Response {
	return Response{Code: code, Message: message}
}

type Page[T any] struct {
	List     []T   `json:"list"`
	Total    int64 `json:"total"`
	Page     int   `json:"page"`
	PageSize int   `json:"pageSize"`
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type User struct {
	ID       uint64 `json:"id"`
	Username string `json:"username"`
	Nickname string `json:"nickname"`
	Role     string `json:"role"`
}

type CreateAppRequest struct {
	Name        string `json:"name" binding:"required"`
	Icon        string `json:"icon"`
	Description string `json:"description"`
}

type UpdateAppRequest struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
}

type CreatePageRequest struct {
	Name   string `json:"name" binding:"required"`
	Path   string `json:"path" binding:"required"`
	Schema string `json:"schema" binding:"required"`
}

type UpdatePageRequest struct {
	Name    *string `json:"name"`
	Path    *string `json:"path"`
	Schema  *string `json:"schema"`
	Version *uint64 `json:"version" binding:"required"`
}
