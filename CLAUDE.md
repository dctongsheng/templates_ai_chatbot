# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个使用 Next.js 16 和 AI SDK v6 构建的现代化 AI 聊天应用，支持流式响应、多模型提供商、文档协作等高级功能。

**核心架构**：App Router + Server Components + AI SDK 流式 API

## 常用命令

### 开发
```bash
pnpm dev          # 启动开发服务器（Turbo 模式）
pnpm build        # 构建生产版本
pnpm start        # 启动生产服务器
```

### 数据库
```bash
pnpm db:generate  # 生成数据库迁移文件
pnpm db:migrate   # 运行数据库迁移
pnpm db:push      # 直接推送 schema 到数据库（开发环境）
pnpm db:studio    # 打开 Drizzle Studio（数据库可视化管理）
```

### 测试
```bash
pnpm test         # 运行 Playwright E2E 测试
# 或
export PLAYWRIGHT=True && pnpm exec playwright test
```

### 代码质量
```bash
pnpm lint         # 运行代码检查
pnpm format       # 自动格式化代码（使用 ultracite）
```

## 核心架构

### AI 集成流程

```
用户输入
  ↓
MultimodalInput 组件 (components/multimodal-input.tsx)
  ↓
useChat hook 发送消息到 /api/chat
  ↓
API 路由处理 (app/(chat)/api/chat/route.ts)
  ├─ 身份验证 (auth())
  ├─ 权限检查 (消息配额)
  ├─ 消息格式转换 (convertToModelMessages)
  ├─ AI 模型调用 (getLanguageModel + streamText)
  └─ 流式响应返回 (createUIMessageStream)
  ↓
前端实时显示 (components/messages.tsx)
  ↓
数据持久化 (PostgreSQL)
```

### 关键文件说明

**AI 配置层**
- `lib/ai/providers.ts` - AI 模型提供商配置（当前使用 OpenRouter）
- `lib/ai/models.ts` - 可用模型列表和分组
- `lib/ai/prompts.ts` - 系统提示词配置
- `lib/ai/tools/` - AI 工具函数（天气、文档、建议）

**数据层**
- `lib/db/schema.ts` - 数据库 schema 定义
- `lib/db/queries.ts` - 数据库查询函数
- `lib/db/migrate.ts` - 数据库迁移脚本

**API 层**
- `app/(chat)/api/chat/route.ts` - 核心聊天 API（流式响应）
- `app/(chat)/actions.ts` - Server Actions（标题生成等）

**UI 层**
- `components/chat.tsx` - 主聊天容器
- `components/multimodal-input.tsx` - 输入组件
- `components/messages.tsx` - 消息列表组件
- `hooks/use-auto-resume.ts` - 自动恢复流式连接

## 重要配置细节

### AI 模型提供商

项目使用 **OpenRouter** 作为默认提供商（通过 `@openrouter/ai-sdk-provider`）：

```typescript
// lib/ai/providers.ts
const openrouterClient = createOpenRouter({
  apiKey: process.env.OPENAI_API_KEY,
});

// 模型调用使用 .chat() 方法
export function getLanguageModel(modelId: string) {
  return openrouterClient.chat(modelName);
}
```

**切换提供商**：修改 `lib/ai/providers.ts`，可以使用 `@ai-sdk/openai`、`@ai-sdk/anthropic` 等。

### 推理模型支持

支持带 `-thinking` 后缀的推理模型（如 Claude 的 extended thinking）：

```typescript
const isReasoningModel = modelId.includes("reasoning") || modelId.endsWith("-thinking");

if (isReasoningModel) {
  return wrapLanguageModel({
    model: openrouterClient.chat(modelName),
    middleware: extractReasoningMiddleware({ tagName: "thinking" }),
  });
}
```

### 流式响应配置

项目使用 AI SDK v6 的流式 API，关键配置：

```typescript
// app/(chat)/api/chat/route.ts
const result = streamText({
  model: getLanguageModel(selectedChatModel),
  system: systemPrompt({ selectedChatModel, requestHints }),
  messages: convertedMessages,
  experimental_continue: true,  // 支持工具调用后继续
  experimental_telemetry: { isEnabled: isProductionEnvironment },
});

result.consumeStream();
dataStream.merge(result.toUIMessageStream({ sendReasoning: true }));
```

### 可恢复流（Resumable Streams）

使用 `resumable-stream` 库实现网络中断后恢复对话：

```typescript
// app/(chat)/api/chat/route.ts
const streamContext = getStreamContext();  // 全局单例
const resumableStream = await streamContext.resumableStream(streamId, () => stream);
```

**注意**：需要配置 `REDIS_URL` 环境变量，否则功能被禁用。

### 工具系统（Tools）

AI 可以调用预定义的工具：
- `getWeather` - 天气查询
- `createDocument` - 创建文档
- `updateDocument` - 更新文档
- `requestSuggestions` - 请求建议

工具配置在 `app/(chat)/api/chat/route.ts` 的 `tools` 参数中。

## 数据库 Schema

核心表结构：
- `chats` - 聊天会话
- `messages` - 消息记录（支持 parts 和 attachments）
- `votes` - 消息投票（用于反馈）
- `documents` - 文档协作
- `suggestions` - 建议记录

使用 **Drizzle ORM** 进行数据库操作，所有查询在 `lib/db/queries.ts` 中。

## 环境变量

**必需**：
- `AUTH_SECRET` - NextAuth.js 密钥
- `POSTGRES_URL` - PostgreSQL 连接字符串
- `OPENAI_API_KEY` - OpenRouter API 密钥（或其他提供商密钥）

**可选**：
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob 存储（文件上传）
- `REDIS_URL` - Redis 缓存（可恢复流）
- `PLAYWRIGHT` / `PLAYWRIGHT_TEST_BASE_URL` - 测试配置

## 已知问题和修复

### 1. 多轮对话状态问题

**问题**：AI 回复完成后，无法发送下一条消息（提示 "Please wait for the model to finish its response!"）

**修复**：确保 `hooks/use-auto-resume.ts` 的依赖数组正确：

```typescript
}, [autoResume, initialMessages, resumeStream]);  // 正确
// 不是 }, [autoResume, initialMessages.at, resumeStream]);  // 错误
```

### 2. 流式响应不工作

**问题**：消息一次性返回，不是流式

**修复**：使用官方 provider（如 `@openrouter/ai-sdk-provider`），而不是通用的 `@ai-sdk/openai` + 自定义 baseURL。

## 开发注意事项

### 添加新模型

在 `lib/ai/models.ts` 中添加：

```typescript
{
  id: "provider/model-name",
  name: "Display Name",
  provider: "provider",  // anthropic, openai, google, xai, reasoning
  description: "Description",
}
```

### 修改系统提示词

编辑 `lib/ai/prompts.ts` 中的 `systemPrompt` 函数。

### 调试流式响应

1. 检查浏览器 Network 面板的 SSE 连接
2. 查看 `components/chat.tsx` 中的 `useChat` 配置
3. 确认 API 返回的 Content-Type 是 `text/event-stream`

### 性能优化

- 组件缓存已启用（`cacheComponents: true`）
- 使用 `smoothStream({ chunking: "word" })` 进行分词
- Server Components 减少客户端 JavaScript

## 测试

E2E 测试使用 Playwright，测试文件在 `tests/` 目录。

运行单个测试：
```bash
pnpm exec playwright test tests/path/to/test.spec.ts
```

测试模式：
- UI 模式：`pnpm exec playwright test --ui`
- 调试模式：`pnpm exec playwright test --debug`
