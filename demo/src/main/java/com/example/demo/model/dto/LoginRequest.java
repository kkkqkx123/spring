package com.example.demo.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Login request DTO
 * 登录请求数据传输对象
 */
@Data
public class LoginRequest {
    
    /**
     * 用户名
     * 不能为空
     */
    @NotBlank(message = "Username is required")
    private String username;
    
    /**
     * 密码
     * 不能为空
     */
    @NotBlank(message = "Password is required")
    private String password;
}