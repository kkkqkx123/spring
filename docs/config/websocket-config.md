# WebSocket配置文档 (WebSocketConfig.java)

本文档详细说明了 `WebSocketConfig.java` 文件，该文件负责为应用配置实时消息传递功能。

## 1. 概述

`WebSocketConfig` 通过实现 `WebSocketMessageBrokerConfigurer` 接口并启用 `@EnableWebSocketMessageBroker`，为应用集成了基于STOMP（Simple Text Oriented Messaging Protocol）协议的WebSocket消息代理（Message Broker）。这使得客户端（如Web浏览器）和服务器之间可以建立持久的双向通信连接，用于实现实时通知、在线聊天等功能。

## 2. 核心注解

### 2.1. `@EnableWebSocketMessageBroker`

- **描述**: 启用WebSocket消息代理功能。这个注解会自动配置一个消息代理，用于处理来自客户端的STOMP消息。

## 3. 核心配置方法

### 3.1. `configureMessageBroker(MessageBrokerRegistry registry)`

此方法用于配置消息代理本身，定义了消息的路由规则。

| 配置项                          | 值                  | 描述                                                                                                                               |
| ------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `enableSimpleBroker`            | `"/topic"`, `"/queue"` | 启用一个简单的、基于内存的消息代理。所有目的地前缀为 `/topic` 或 `/queue` 的消息将直接路由到此代理，并广播给订阅了相应目的地的客户端。 |
| `setApplicationDestinationPrefixes` | `"/app"`            | 定义了应用处理消息的目的地前缀。客户端发送给服务器进行处理的消息，其目的地应以 `/app` 开头（例如 `/app/chat.sendMessage`）。     |
| `setUserDestinationPrefix`      | `"/user"`           | 定义了用户专属目的地的-前缀。与 `@SendToUser` 注解结合使用，可以方便地将消息发送给特定的用户。例如，服务器可以向 `/user/queue/errors` 发送消息，只有特定用户会收到。 |

### 3.2. `registerStompEndpoints(StompEndpointRegistry registry)`

此方法用于注册STOMP端点，这是客户端建立WebSocket连接的入口。

- **端点**: `/ws`
  - **描述**: 客户端将通过 `ws://<host>:<port>/ws` 这个URL来发起WebSocket连接。
- **允许的来源**: `setAllowedOriginPatterns("*")`
  - **描述**: 允许来自任何域的跨域连接。在生产环境中，为了安全起见，应将其限制为前端应用的实际域名。
- **备用方案**: `withSockJS()`
  - **描述**: 启用SockJS作为备用选项。如果客户端的浏览器不支持原生的WebSocket，SockJS会尝试使用其他可用的技术（如HTTP长轮询）来模拟WebSocket连接，从而提供了更好的浏览器兼容性。

## 4. 消息流转示例

1. **客户端连接**: 客户端连接到服务器的 `/ws` 端点。
2. **客户端订阅**: 客户端订阅一个或多个目的地，例如 `/topic/public-chat`。
3. **客户端发送消息**: 客户端向一个应用目的地发送消息，例如 `/app/chat.sendMessage`，并附带消息体。
4. **服务器处理**: 服务器上由 `@MessageMapping("/chat.sendMessage")` 注解的方法接收并处理该消息。
5. **服务器广播消息**: 处理方法通过 `@SendTo("/topic/public-chat")` 注解或直接使用消息模板，将结果或新消息发送到 `/topic/public-chat` 目的地。
6. **客户端接收消息**: 所有订阅了 `/topic/public-chat` 的客户端都会收到该消息。

---
文档生成时间: 2025-07-29T12:46:16.175Z
