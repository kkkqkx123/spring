package com.example.demo.model.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

/**
 * Email request DTO for encapsulating email sending parameters
 * 包含单个收件人、多个收件人、主题、模板和模板变量的邮件请求数据传输对象
 */
@Data
public class EmailRequest {
    
    /**
     * 单个收件人邮箱地址
     * 必须是有效的邮箱格式
     */
    @Email(message = "Email should be valid")
    private String to;
    
    /**
     * 多个收件人邮箱地址列表
     * 所有邮箱地址都必须是有效的格式
     */
    private List<@Email String> recipients;
    
    /**
     * 邮件主题
     * 不能为空
     */
    @NotBlank(message = "Subject is required")
    private String subject;
    
    /**
     * 邮件模板名称
     * 不能为空
     */
    @NotBlank(message = "Template is required")
    private String template;
    
    /**
     * 模板变量映射
     * 用于替换模板中的占位符
     */
    private Map<String, Object> variables = new HashMap<>();
    
    /**
     * 默认构造函数
     */
    public EmailRequest() {
        this.variables = new HashMap<>();
    }
    
    /**
     * 带参数的构造函数
     * 
     * @param to 单个收件人邮箱地址
     * @param subject 邮件主题
     * @param template 邮件模板名称
     */
    public EmailRequest(String to, String subject, String template) {
        this.to = to;
        this.subject = subject;
        this.template = template;
        this.variables = new HashMap<>();
    }
    
    /**
     * 带参数的构造函数（用于测试兼容性）
     * 
     * @param to 单个收件人邮箱地址
     * @param subject 邮件主题
     * @param template 邮件模板名称
     * @param variables 模板变量映射
     */
    public EmailRequest(String to, String subject, String template, Map<String, Object> variables) {
        this.to = to;
        this.subject = subject;
        this.template = template;
        this.variables = variables != null ? variables : new HashMap<>();
    }
    
    /**
     * 添加模板变量
     * 
     * @param key 变量键名
     * @param value 变量值
     */
    public void addVariable(String key, Object value) {
        this.variables.put(key, value);
    }
    
    /**
     * 批量设置模板变量
     * 
     * @param variables 模板变量映射
     */
    public void setVariables(Map<String, Object> variables) {
        this.variables.clear();
        this.variables.putAll(variables);
    }
}