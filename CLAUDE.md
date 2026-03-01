# Project: StyleAI Shop

Next.js 16 电商项目，集成 AI 功能（Anthropic SDK + LangChain），使用 Prisma ORM。

## Tech Stack
- Framework: Next.js 16 (App Router)
- Language: TypeScript (strict mode)
- Styling: Tailwind CSS + shadcn/ui (Radix UI)
- ORM: Prisma + PostgreSQL
- Auth: NextAuth v5
- AI: @anthropic-ai/sdk, @langchain/anthropic
- State: Zustand
- Email: Resend

## Language & Style
- 所有新文件使用 TypeScript，禁止 `any` 类型
- 组件放在 `src/components/`，页面放在 `src/app/`
- 使用 `@/` 路径别名代替相对路径
- 遵循现有文件的命名和格式约定，不要重新格式化未修改的代码

## Workflow
- 修改代码后运行 `npx tsc --noEmit` 确认无类型错误
- 运行 `npm run lint` 确认无 lint 错误
- 每完成一个独立功能立即 commit，不要积累大量未提交改动
- commit 格式：`feat:` / `fix:` / `chore:` / `docs:`

## Key Commands
- 开发服务器：`npm run dev`（让用户手动运行，不要自动启动）
- 类型检查：`npx tsc --noEmit`
- Lint：`npm run lint`
- 数据库迁移：`npx prisma migrate dev`
- 数据库种子：`npx tsx prisma/seed.ts`

## Important Files
- `src/app/` - Next.js App Router 页面和 API routes
- `src/components/` - React 组件
- `prisma/schema.prisma` - 数据库 schema
- `src/lib/` - 工具函数和配置
- `.env.local` - 本地环境变量（不要提交）

## Token 节省策略
- 查询库文档时在问题末尾加 `use context7`，直接获取最新文档而不是读本地文件
- session 变长时用 `/compact` 压缩上下文
- 每次 session 开头说明目标和相关文件路径，避免 Claude 自行探索
- 用 `/cost` 查看当前 session 消耗

## Available Skills
- `/commit` — 类型检查 → lint → 提交
- `/review` — 审查改动，找安全/类型/性能问题
- `/prisma` — 标准化数据库迁移流程
- `/api` — 创建新 API route

## Constraints
- 不要启动开发服务器，告知用户手动运行 `npm run dev`
- 不要修改 `.env` 或 `.env.local`，除非明确要求
- Prisma schema 变更后必须运行 `npx prisma generate`
