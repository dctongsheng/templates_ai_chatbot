<a href="https://chat.vercel.ai/">
  <img alt="Next.js 16 和 App Router AI 聊天机器人" src="app/(chat)/opengraph-image.png">
  <h1 align="center">Chat SDK</h1>
</a>

<p align="center">
    Chat SDK 是一个免费、开源的模板，使用 Next.js 和 AI SDK 构建，帮助你快速构建强大的聊天机器人应用程序。
</p>

<p align="center">
  <a href="#功能特性"><strong>功能特性</strong></a> ·
  <a href="#模型提供商"><strong>模型提供商</strong></a> ·
  <a href="#本地运行"><strong>本地运行</strong></a> ·
  <a href="#项目配置"><strong>项目配置</strong></a>
</p>
<br/>

## 功能特性

- **[Next.js](https://nextjs.org) App Router**
  - 高级路由，实现无缝导航和卓越性能
  - React Server Components (RSCs) 和 Server Actions 用于服务端渲染和性能提升
- **[AI SDK](https://ai-sdk.dev/docs/introduction)**
  - 统一 API，支持大语言模型的文本生成、结构化对象和工具调用
  - Hooks 用于构建动态聊天和生成式用户界面
  - 支持 OpenAI、Anthropic、Google、xAI 等多个模型提供商
- **[shadcn/ui](https://ui.shadcn.com)**
  - 使用 [Tailwind CSS](https://tailwindcss.com) 进行样式设计
  - 基于 [Radix UI](https://radix-ui.com) 的组件原语，确保可访问性和灵活性
- **数据持久化**
  - [PostgreSQL](https://www.postgresql.org/) 用于保存聊天历史和用户数据
  - [Vercel Blob](https://vercel.com/storage/blob) 用于高效的文件存储
- **[Auth.js](https://authjs.dev)**
  - 简单安全的身份认证

## 模型提供商

本项目使用 **[OpenRouter](https://openrouter.ai)** 作为 AI 模型提供商，通过统一的接口访问多个 AI 模型。

### 为什么选择 OpenRouter？

- **统一接口**：一个 API 密钥即可访问数百个来自不同提供商的模型
- **成本效益**：按使用付费，无月费或承诺
- **价格透明**：所有模型的 token 成本清晰透明
- **高可用性**：企业级基础设施，自动故障转移
- **最新模型**：即时获取新发布的模型

### 配置 OpenRouter

本项目已配置使用 OpenRouter 官方 AI SDK Provider（`@openrouter/ai-sdk-provider`），针对流式响应进行了优化。

在 `.env.local` 文件中配置以下环境变量：

```bash
# OpenRouter API 配置
OPENAI_API_KEY=sk-or-v1-your-openrouter-api-key-here
```

获取 OpenRouter API 密钥：https://openrouter.ai/keys

### 切换到其他提供商

使用 [AI SDK](https://ai-sdk.dev/docs/introduction)，你可以轻松切换到其他 LLM 提供商，如 [OpenAI](https://openai.com)、[Anthropic](https://anthropic.com)、[Cohere](https://cohere.com) 等，只需修改几行代码。

详见 `lib/ai/providers.ts` 文件。

## 本地运行

### 环境要求

- Node.js 18+
- pnpm 9+

### 配置步骤

1. **安装依赖**
   ```bash
   pnpm install
   ```

2. **配置环境变量**

   复制环境变量模板：
   ```bash
   cp .env.example .env.local
   ```

   编辑 `.env.local` 文件，配置以下必需的环境变量：

   ```bash
   # 认证密钥（生成方法：openssl rand -base64 32）
   AUTH_SECRET=your-random-secret-here

   # OpenRouter API Key（从 https://openrouter.ai/keys 获取）
   OPENAI_API_KEY=sk-or-v1-your-api-key-here

   # PostgreSQL 数据库连接字符串
   POSTGRES_URL=postgresql://user:password@localhost:5432/chatdb

   # Vercel Blob 存储令牌（可选，用于文件上传功能）
   BLOB_READ_WRITE_TOKEN=vercel_blob_token_here

   # Redis 缓存（可选，用于可恢复流）
   REDIS_URL=redis://localhost:6379
   ```

3. **初始化数据库**
   ```bash
   pnpm db:migrate
   ```

4. **启动开发服务器**
   ```bash
   pnpm dev
   ```

5. **访问应用**

   打开浏览器访问 [http://localhost:3000](http://localhost:3000)

### 数据库设置

本项目使用 PostgreSQL 和 [Drizzle ORM](https://orm.drizzle.team/)。

**使用 Docker 快速启动 PostgreSQL：**
```bash
docker run -d \
  --name postgres-chatbot \
  -e POSTGRES_PASSWORD=changethis \
  -e POSTGRES_DB=postgres \
  -p 5432:5432 \
  postgres:16
```

**运行数据库迁移：**
```bash
# 创建数据库表结构
pnpm db:push

# 或使用 migrate 命令（推荐生产环境）
pnpm db:migrate
```

## 项目配置

### 核心配置文件

| 文件 | 说明 |
|------|------|
| `lib/ai/providers.ts` | AI 模型提供商配置 |
| `lib/ai/models.ts` | 可用的 AI 模型列表 |
| `.env.local` | 环境变量配置（本地） |
| `drizzle.config.ts` | 数据库配置 |

### 添加新的 AI 模型

在 `lib/ai/models.ts` 中添加新模型：

```typescript
{
  id: "openai/gpt-4-turbo",
  name: "GPT-4 Turbo",
  provider: "openai",
  description: "最新的 GPT-4 模型",
}
```

### 切换 AI 提供商

修改 `lib/ai/providers.ts`，例如切换回直接使用 OpenAI：

```typescript
import { createOpenAI } from "@ai-sdk/openai";

const openaiClient = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export function getLanguageModel(modelId: string) {
  return openaiClient(modelId);
}
```

## 部署

### Vercel 部署（推荐）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fai-chatbot&env=AUTH_SECRET,OPENAI_API_KEY,POSTGRES_URL&envDescription=Required%20environment%20variables%20for%20the%20AI%20chatbot&envLink=https%3A%2F%2Fgithub.com%2Fvercel%2Fai-chatbot%23environment-variables&project-name=ai-chatbot&repository-name=ai-chatbot&demo-title=AI%20Chatbot&demo-description=An%20open-source%20chatbot%20built%20with%20Next.js%20and%20the%20AI%20SDK&demo-url=https%3A%2F%2Fchat.vercel.ai&integration-ids=oac_V1Y6RqgnFbD2cLtm7ZYmfiXfE5h)

1. 点击上方按钮部署到 Vercel
2. 配置环境变量
3. 连接 PostgreSQL 数据库（推荐使用 [Vercel Postgres](https://vercel.com/postgres)）
4. 部署完成！

## 常见问题

### 1. 如何启用流式响应？

本项目已默认启用流式响应。如果响应不是流式的，请检查：
- 确认使用的是官方 provider（如 `@openrouter/ai-sdk-provider`）
- 检查 API 密钥是否有效
- 查看浏览器控制台是否有错误

### 2. 多轮对话无法发送新消息？

确保 `hooks/use-auto-resume.ts` 中的依赖数组正确：
```typescript
}, [autoResume, initialMessages, resumeStream]);
```

### 3. 如何添加文件上传功能？

配置 `BLOB_READ_WRITE_TOKEN` 环境变量以启用文件上传功能。

### 4. Redis 是必需的吗？

不是必需的。Redis 用于"可恢复流"功能（resumable streams），可以在网络中断后恢复对话。不配置 Redis 不会影响基本聊天功能。

## 技术栈

- **框架**: [Next.js](https://nextjs.org) 16
- **AI SDK**: [Vercel AI SDK](https://ai-sdk.dev) v6
- **UI 组件**: [shadcn/ui](https://ui.shadcn.com)
- **样式**: [Tailwind CSS](https://tailwindcss.com)
- **数据库**: [PostgreSQL](https://www.postgresql.org/) + [Drizzle ORM](https://orm.drizzle.team/)
- **缓存**: [Redis](https://redis.io/)（可选）
- **存储**: [Vercel Blob](https://vercel.com/storage/blob)（可选）
- **认证**: [NextAuth.js](https://authjs.dev) v5

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 贡献

欢迎贡献！请随时提交 Pull Request。

## 支持

- 📖 [AI SDK 文档](https://ai-sdk.dev/docs/introduction)
- 📖 [Next.js 文档](https://nextjs.org/docs)
- 📖 [OpenRouter 文档](https://openrouter.ai/docs)
- 💬 [GitHub Issues](https://github.com/vercel/ai-chatbot/issues)

---

Made with ❤️ using [Next.js](https://nextjs.org) and [AI SDK](https://ai-sdk.dev)
