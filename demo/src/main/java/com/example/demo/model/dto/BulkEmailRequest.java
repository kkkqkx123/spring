package com.example.demo.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Data Transfer Object for bulk email requests.
 * 批量邮件请求的数据传输对象，包含收件人列表、主题、模板和模板变量
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkEmailRequest {

    /**
     * List of recipient email addresses.
     * 收件人邮箱地址列表，不能为空
     */
    @NotEmpty(message = "Recipients list cannot be empty")
    private List<String> recipients;

    /**
     * Email subject.
     * 邮件主题，不能为空
     */
    @NotBlank(message = "Subject is required")
    private String subject;

    /**
     * Template name (relative to the template root directory).
     * 邮件模板名称（相对于模板根目录），不能为空
     */
    @NotBlank(message = "Template is required")
    private String template;

    /**
     * Variables to be used in the template.
     * 用于模板中的变量映射，不能为空
     */
    @NotNull(message = "Variables map is required")
    private Map<String, Object> variables = new HashMap<>();
    
    /**
     * 添加模板变量
     * 
     * @param key 变量键名
     * @param value 变量值
     */
    public void addVariable(String key, Object value) {
        if (this.variables == null) {
            this.variables = new HashMap<>();
        }
        this.variables.put(key, value);
    }
    
    /**
     * 批量设置模板变量
     * 
     * @param variables 模板变量映射
     */
    public void setVariables(Map<String, Object> variables) {
        this.variables = variables != null ? new HashMap<>(variables) : new HashMap<>();
    }
}