package com.example.demo.model.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Registration request DTO
 * 注册请求数据传输对象
 */
@Data
public class RegisterRequest {
    
    /**
     * 用户名
     * 不能为空，长度必须在3-50个字符之间
     */
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;
    
    /**
     * 邮箱地址
     * 不能为空，必须是有效的邮箱格式
     */
    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;
    
    /**
     * 密码
     * 不能为空，长度至少为6个字符
     */
    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters long")
    private String password;
}