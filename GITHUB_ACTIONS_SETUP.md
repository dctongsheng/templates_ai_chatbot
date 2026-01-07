# GitHub Actions 配置指南

本项目有两个 GitHub Actions workflow：

1. **Lint** - 代码检查（在每次 push 时运行）
2. **Playwright Tests** - E2E 测试（在 main/master 分支的 push 和 PR 时运行）

## 配置步骤

### 1. 配置 GitHub Secrets

进入你的 GitHub 仓库：**Settings** → **Secrets and variables** → **Actions** → **New repository secret**

#### 必需的 Secrets

| Secret 名称 | 说明 | 获取方式 |
|------------|------|---------|
| `AUTH_SECRET` | NextAuth.js 认证密钥 | `openssl rand -base64 32` |
| `POSTGRES_URL` | PostgreSQL 数据库连接字符串 | 使用 GitHub 提供的测试数据库或自建 |

#### 可选的 Secrets（但建议配置以通过测试）

| Secret 名称 | 说明 | 获取方式 |
|------------|------|---------|
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob 存储令牌 | [Vercel Dashboard](https://vercel.com/account/tokens) |
| `REDIS_URL` | Redis 缓存连接 | [Redis Cloud](https://redis.com/try-free/) |

### 2. AUTH_SECRET 配置

**生成方法**：

```bash
# 方法 1: 使用 OpenSSL
openssl rand -base64 32

# 方法 2: 使用在线工具
# 访问：https://generate-secret.vercel.app/32
```

**添加到 GitHub**：
1. 复制生成的密钥
2. 在 GitHub 仓库中添加 Secret：名称为 `AUTH_SECRET`，值为生成的密钥

### 3. POSTGRES_URL 配置

你有三个选择：

#### 选项 A：使用 Supabase（推荐，免费）

1. 访问 [Supabase](https://supabase.com/) 并注册
2. 创建新项目
3. 获取 Project URL 和 anon key
4. 构建连接字符串：
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

#### 选项 B：使用 Neon（推荐，免费）

1. 访问 [Neon](https://neon.tech/) 并注册
2. 创建新项目
3. 在 Dashboard 中复制 Connection String
4. 格式类似：
   ```
   postgresql://[user]:[password]@[host]/[database]?sslmode=require
   ```

#### 选项 C：使用 Railway（简单，有免费额度）

1. 访问 [Railway](https://railway.app/) 并注册
2. 新建 PostgreSQL 数据库
3. 在 Variables 中复制连接 URL

**添加到 GitHub**：
1. 复制连接字符串
2. 在 GitHub 仓库中添加 Secret：名称为 `POSTGRES_URL`，值为连接字符串

**重要**：测试环境的数据库可以和生产环境不同，但需要相同的表结构。

### 4. 初始化测试数据库结构

GitHub Actions 运行时会自动执行测试，但数据库需要正确的表结构。

你需要在本地运行一次数据库迁移：

```bash
# 连接到你的测试数据库
psql $POSTGRES_URL

# 或者使用项目命令
pnpm db:push
```

**注意**：workflow 会在运行测试前自动设置数据库。

### 5. BLOB_READ_WRITE_TOKEN（可选）

如果测试涉及文件上传功能，需要配置：

1. 在 [Vercel](https://vercel.com/) 创建项目
2. 在 Storage 中添加 Blob Store
3. 生成读写令牌
4. 添加到 GitHub Secrets

### 6. REDIS_URL（可选）

如果要测试可恢复流功能，需要配置 Redis：

**使用 Redis Cloud（免费）**：
1. 访问 [Redis Cloud](https://redis.com/try-free/)
2. 创建免费数据库（30MB）
3. 获取连接字符串
4. 添加到 GitHub Secrets

格式类似：
```
rediss://default:[password]@[host]:[port]
```

## 快速配置模板

如果你没有这些服务，可以使用以下免费服务快速配置：

### 完整免费配置方案

```bash
# 1. AUTH_SECRET（本地生成）
AUTH_SECRET=$(openssl rand -base64 32)

# 2. POSTGRES_URL - 使用 Neon
# 访问 https://neon.tech/signup
# 创建项目后复制连接字符串

# 3. BLOB_READ_WRITE_TOKEN - 使用 Vercel
# 访问 https://vercel.com/blob
# 创建 Blob Store 后生成令牌

# 4. REDIS_URL - 使用 Redis Cloud
# 访问 https://redis.com/try-free/
# 创建数据库后复制连接字符串
```

## 修改 Workflow 以跳过某些测试

如果暂时不想配置某些服务，可以修改 workflow：

### 方法 1：注释掉环境变量

编辑 `.github/workflows/playwright.yml`：

```yaml
env:
  AUTH_SECRET: ${{ secrets.AUTH_SECRET }}
  POSTGRES_URL: ${{ secrets.POSTGRES_URL }}
  # BLOB_READ_WRITE_TOKEN: ${{ secrets.BLOB_READ_WRITE_TOKEN }}  # 暂时跳过
  # REDIS_URL: ${{ secrets.REDIS_URL }}  # 暂时跳过
```

### 方法 2：提供默认值

```yaml
env:
  AUTH_SECRET: ${{ secrets.AUTH_SECRET || 'test-secret-for-development' }}
  POSTGRES_URL: ${{ secrets.POSTGRES_URL || 'postgresql://localhost:5432/test' }}
```

### 方法 3：使用 GitHub 托管的服务

如果你部署在 Vercel 上，可以使用 **Vercel Environments**：

1. 在 Vercel 项目中配置环境变量
2. 在 Workflow 中使用 Vercel 的集成

## 验证配置

配置完成后，可以通过以下方式验证：

### 1. 手动触发 Workflow

1. 进入 GitHub 仓库的 **Actions** 标签
2. 选择 **Lint** 或 **Playwright Tests**
3. 点击 **Run workflow**

### 2. 检查 Workflow 日志

如果失败，查看日志中的错误信息：

```bash
# 常见错误：
# - "pnpm: command not found" → pnpm setup 问题（应该不会出现）
# - "Error: connect ECONNREFUSED" → 数据库连接失败
# - "AUTH_SECRET is not defined" → 缺少 AUTH_SECRET
# - "POSTGRES_URL is not defined" → 缺少 POSTGRES_URL
```

## 推荐配置顺序

1. **第一步**：配置 `AUTH_SECRET`（必需）
2. **第二步**：配置 `POSTGRES_URL`（必需，推荐使用 Neon）
3. **第三步**：运行 Lint workflow（应该立即通过）
4. **第四步**：配置 `BLOB_READ_WRITE_TOKEN` 和 `REDIS_URL`（可选）
5. **第五步**：运行 Playwright workflow

## 常见问题

### Q: Lint workflow 失败怎么办？

检查本地是否通过：
```bash
pnpm lint
```

### Q: Playwright workflow 失败怎么办？

1. 检查所有 Secrets 是否已配置
2. 查看 workflow 日志中的具体错误
3. 确保数据库已正确初始化

### Q: 可以在本地测试 workflow 吗？

可以使用 [act](https://github.com/nektos/act) 在本地运行 GitHub Actions：

```bash
# 安装 act（macOS/Linux）
brew install act

# 运行 workflow
act -j build
```

### Q: 测试数据库需要和生产数据库一样吗？

不需要。测试数据库可以是独立的，但需要相同的表结构。建议：
- 生产：使用 Vercel Postgres 或自建
- 测试：使用 Neon 或其他免费服务

## 联系支持

如果遇到问题：
- 检查 [GitHub Actions 文档](https://docs.github.com/en/actions)
- 查看 [Playwright 文档](https://playwright.dev/docs/ci)
- 查看项目的 `.github/workflows/` 目录中的配置
