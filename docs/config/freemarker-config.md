# Freemarker配置文档 (FreemarkerConfig.java)

本文档详细说明了 `FreemarkerConfig.java` 文件，该文件负责为应用配置Freemarker模板引擎，主要用于动态生成邮件内容。

## 1. 概述

`FreemarkerConfig` 的核心任务是配置一个 `FreeMarkerConfigurationFactoryBean`，这是Spring框架提供的用于集成Freemarker的工厂Bean。通过配置这个Bean，应用能够知道去哪里加载模板文件，并使用何种编码来解析它们。

## 2. 核心组件

### 2.1. `freemarkerConfiguration` Bean

- **类型**: `org.springframework.ui.freemarker.FreeMarkerConfigurationFactoryBean`
- **描述**: 这是配置Freemarker环境的核心。它负责创建一个 `freemarker.template.Configuration` 实例，该实例是Freemarker引擎的中心枢纽。

## 3. 配置参数详解

| 参数                  | 配置值              | 描述                                                         |
| --------------------- | ------------------- | ------------------------------------------------------------ |
| `TemplateLoaderPath`  | `classpath:/ftl/`   | 设置模板文件的加载路径。`classpath:/ftl/` 表示模板文件（`.ftl`）存放在项目的 `src/main/resources/ftl/` 目录下。当服务需要渲染模板时，会从这个目录中查找对应的文件。 |
| `DefaultEncoding`     | `UTF-8`             | 设置模板文件的默认编码格式。使用 `UTF-8` 可以确保正确处理包括中文在内的多语言字符，避免乱码问题。 |

## 4. 使用场景

此配置主要服务于邮件发送功能。通过使用Freemarker模板，开发人员可以创建复杂且动态的HTML邮件内容，将业务数据（如用户名、订单详情等）填充到预先设计好的模板中，从而生成个性化的邮件。

---
文档生成时间: 2025-07-29T12:44:38.318Z
