# 安全配置文档 (SecurityConfig.java)

本文档详细说明了 `SecurityConfig.java` 文件中的安全配置，该文件是整个应用权限管理和安全控制的核心。

## 1. 概述

`SecurityConfig` 负责配置Spring Security，定义了应用的认证（Authentication）和授权（Authorization）规则。它启用了基于方法的安全注解（`@EnableMethodSecurity`），并配置了JWT（JSON Web Token）作为无状态会话（Stateless Session）的认证机制。

## 2. 核心组件

### 2.1. 密码编码器 (`PasswordEncoder`)

- **实现**: `BCryptPasswordEncoder`
- **强度**: 12
- **描述**: 使用BCrypt算法对用户密码进行哈希处理，强度设置为12，提供了强大的防破解能力。所有存储在数据库中的密码都应经过此编码器处理。

### 2.2. 认证提供者 (`DaoAuthenticationProvider`)

- **功能**: 负责从数据库中获取用户信息（通过 `UserDetailsServiceImpl`），并与用户提交的凭证进行比较。
- **配置**:
  - 关联了 `UserDetailsServiceImpl` 来加载用户数据。
  - 关联了 `passwordEncoder()` 来进行密码校验。
  - `setHideUserNotFoundExceptions(true)`: 为了安全，不向客户端暴露“用户不存在”的明确信息。

### 2.3. JWT认证过滤器 (`AuthTokenFilter`)

- **功能**: 这是一个自定义过滤器，在每个请求到达时被触发。它会从请求头中解析JWT，验证其有效性，并加载用户信息到Spring Security的上下文中，从而实现无状态认证。
- **位置**: 在标准的 `UsernamePasswordAuthenticationFilter` 之前执行。

### 2.4. 跨域资源共享 (CORS)

- **配置**: 允许来自任何源 (`*`) 的跨域请求。
- **允许的方法**: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`。
- **允许的头部**: `authorization`, `content-type`, `x-auth-token`。
- **暴露的头部**: `x-auth-token`。

## 3. 安全过滤器链 (`SecurityFilterChain`)

这是安全配置的核心，定义了针对不同URL端点的访问规则。

### 3.1. CSRF (跨站请求伪造) 防护

- **策略**: 默认启用，但对无状态的API端点（如 `/api/auth/**`, `/h2-console/**`, `/actuator/**`）禁用。
- **令牌仓库**: `CookieCsrfTokenRepository`，将CSRF令牌存储在cookie中。

### 3.2. 会话管理

- **策略**: `SessionCreationPolicy.STATELESS`
- **描述**: 应用不创建或使用HTTP会话来存储安全上下文，完全依赖JWT进行认证，适用于RESTful API。

### 3.3. 端点授权规则

| URL 路径模式                      | 所需角色/权限                                        | 描述                                           |
| --------------------------------- | ---------------------------------------------------- | ---------------------------------------------- |
| `/api/auth/**`                    | `permitAll()` (公开访问)                             | 用户认证、注册等公开接口。                     |
| `/h2-console/**`                  | `permitAll()` (公开访问)                             | H2数据库控制台，仅限开发环境。                 |
| `/actuator/**`                    | `permitAll()` (公开访问)                             | Spring Boot Actuator监控端点。                 |
| `/api/public/**`                  | `permitAll()` (公开访问)                             | 其他所有公开接口。                             |
| `/api/admin/**`                   | `hasRole('ADMIN')`                                   | 仅限管理员访问。                               |
| `/api/hr/**`                      | `hasAnyRole('ADMIN', 'HR_MANAGER')`                  | 仅限管理员或HR经理访问。                       |
| `/api/departments/**`             | `hasAnyRole('ADMIN', 'HR_MANAGER', 'USER', 'DEPARTMENT_MANAGER')` | 部门相关接口，多个角色可访问。                 |
| `/api/employees/**`               | `authenticated()`                                    | 员工接口，需要认证。具体权限在方法级别控制。   |
| `/api/positions/**`               | `hasAnyRole('ADMIN', 'HR_MANAGER')`                  | 职位接口，仅限管理员或HR经理。                 |
| `/api/payroll/**`                 | `hasAnyRole('ADMIN', 'PAYROLL_MANAGER', 'HR_MANAGER')` 或 `hasAnyAuthority(...)` | 薪资接口，要求用户拥有指定角色或指定权限之一。 |
| `anyRequest()`                    | `authenticated()`                                    | 所有其他未明确指定的请求都需要用户认证。       |

**注意**: 对于 `/api/employees/**` 和 `/api/payroll/**` 等端点，除了在 `SecurityFilterChain` 中定义的全局规则外，还在各自的Controller方法上使用了 `@PreAuthorize` 注解，实现了更细粒度的权限控制。

## 4. 异常处理

- **未授权入口点 (`AuthEntryPointJwt`)**: 当一个未经认证的用户尝试访问受保护资源时，该组件会捕获异常并返回 `401 Unauthorized` 错误，而不是重定向到登录页面。

---
文档生成时间: 2025-07-29T12:51:04.007Z
