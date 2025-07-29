# 应用属性配置文档 (AppProperties.java)

本文档详细说明了 `AppProperties.java` 文件，该文件通过类型安全的方式定义了应用的所有自定义配置项。所有配置均可在 `application.yml` 或 `application.properties` 文件中以 `app` 为前缀进行设置。

## 1. 概述

`AppProperties` 类使用 `@ConfigurationProperties(prefix = "app")` 注解，将配置文件中的属性映射到类的字段中。这种方式提供了编译时检查和代码自动补全的便利。

## 2. 主配置项

| 属性名      | 类型   | 描述               | 默认值 |
| ----------- | ------ | ------------------ | ------ |
| `name`      | `String` | 应用名称。         | `null` |
| `version`   | `String` | 应用版本。         | `null` |
| `description` | `String` | 应用的简短描述。   | `null` |

## 3. 嵌套配置类

### 3.1. JWT 配置 (`app.jwt`)

此类负责与JSON Web Token相关的配置。

| 属性名                | 类型   | 描述                                   | 默认值 |
| --------------------- | ------ | -------------------------------------- | ------ |
| `secret`              | `String` | 用于签名JWT的密钥，必须足够复杂。      | `null` |
| `expirationMs`        | `long`   | Access Token的过期时间（毫秒）。       | `0`    |
| `refreshExpirationMs` | `long`   | Refresh Token的过期时间（毫秒）。      | `0`    |

### 3.2. 安全配置 (`app.security`)

通用安全相关的配置。

| 属性名             | 类型     | 描述                               | 默认值          |
| ------------------ | -------- | ---------------------------------- | --------------- |
| `jwtHeader`        | `String`   | 存放JWT的HTTP请求头名称。          | `"Authorization"` |
| `jwtPrefix`        | `String`   | JWT在请求头中的前缀。              | `"Bearer "`     |
| `passwordStrength` | `int`      | 密码要求的最小长度。               | `8`             |

### 3.3. WebSocket 配置 (`app.websocket`)

与WebSocket连接相关的配置。

| 属性名           | 类型       | 描述                       | 默认值   |
| ---------------- | ---------- | -------------------------- | -------- |
| `allowedOrigins` | `String[]` | 允许连接的来源域列表。     | `null`   |
| `endpoint`       | `String`   | WebSocket的连接端点。      | `"/ws"`  |

### 3.4. CORS 配置 (`app.cors`)

跨域资源共享（CORS）的详细配置。

| 属性名             | 类型       | 描述                               | 默认值    |
| ------------------ | ---------- | ---------------------------------- | --------- |
| `allowedOrigins`   | `String[]` | 允许跨域请求的来源域列表。         | `null`    |
| `allowedMethods`   | `String[]` | 允许的HTTP方法列表。               | `null`    |
| `allowedHeaders`   | `String[]` | 允许的HTTP请求头列表。             | `null`    |
| `allowCredentials` | `boolean`  | 是否允许发送凭证（如Cookie）。     | `true`    |

### 3.5. 功能开关 (`app.features`)

用于启用或禁用应用中的特定功能模块。

| 属性名                  | 类型        | 描述                   | 默认值 |
| ----------------------- | ----------- | ---------------------- | ------ |
| `chat.enabled`          | `boolean`   | 是否启用聊天功能。     | `true` |
| `email.enabled`         | `boolean`   | 是否启用邮件发送功能。 | `true` |
| `notifications.enabled` | `boolean`   | 是否启用通知功能。     | `true` |
| `payroll.enabled`       | `boolean`   | 是否启用薪资管理功能。 | `true` |
| `excelImport.enabled`   | `boolean`   | 是否启用Excel导入功能。| `true` |

### 3.6. 业务逻辑配置 (`app.business`)

与核心业务规则相关的参数配置。

| 属性名                       | 类型     | 描述                               | 默认值   |
| ---------------------------- | -------- | ---------------------------------- | -------- |
| `maxEmployeesPerDepartment`  | `int`      | 每个部门允许的最大员工数。         | `1000`   |
| `maxFileUploadSize`          | `String`   | 允许上传的单个文件最大尺寸。       | `"50MB"` |
| `sessionTimeout`             | `String`   | 用户会话超时时间。                 | `"30m"`  |
| `passwordExpiryDays`         | `int`      | 密码过期天数。                     | `90`     |

---
文档生成时间: 2025-07-29T12:43:17.582Z
