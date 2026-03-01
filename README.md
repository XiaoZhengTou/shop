# StyleAI 智能电商平台

基于 Next.js 16 + Claude AI 构建的全栈电商系统，集成 AI 商品文案生成、智能客服、营销自动化等功能。

## 功能特性

**店铺前台**
- 商品浏览、搜索、分类筛选
- 购物车（Zustand + localStorage 持久化）
- 结账下单、收货地址填写
- 模拟支付（演示用）
- 订单详情与状态追踪（待支付 → 已支付 → 已发货 → 已签收）
- 心愿单、商品评价
- AI 智能客服悬浮窗（支持查询订单状态）

**管理后台**
- 商品管理（新增、编辑、上下架、图片上传）
- 订单管理（查看、变更状态）
- 数据分析（收入趋势、每日订单、分类占比、热销商品）
- AI 文案生成器（中英双语、合规检测）
- AI 内容审核（审批/拒绝 AI 生成文案）
- 知识库管理（客服 FAQ）
- 对话记录（查看用户与 AI 客服的对话）
- 营销自动化（废弃购物车召回邮件生成）

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS v4 |
| 数据库 | PostgreSQL + Prisma ORM |
| 认证 | NextAuth v5 (Auth.js) |
| AI | Anthropic Claude (claude-sonnet-4-6) |
| 图表 | Recharts |
| 邮件 | Resend |
| 状态管理 | Zustand |

## 快速开始

### 环境要求

- Node.js 18+
- PostgreSQL 14+
- Anthropic API Key

### 安装

```bash
# 克隆项目
git clone https://github.com/XiaoZhengTou/shop.git
cd shop

# 安装依赖
npm install

# 复制环境变量
cp .env.example .env.local
```

### 配置环境变量

编辑 `.env.local`：

```env
DATABASE_URL="postgresql://用户名:密码@localhost:5432/styleai_db"
ANTHROPIC_API_KEY="sk-ant-..."
AUTH_SECRET="运行 openssl rand -base64 32 生成"
NEXTAUTH_URL="http://localhost:3000"
```

### 初始化数据库

```bash
# 创建数据库表
npx prisma migrate dev

# 导入种子数据（商品、管理员账号）
npx prisma db seed
```

### 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 默认账号

种子数据会创建以下账号：

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@styleai.com | admin123 |
| 普通用户 | user@example.com | user123 |

管理后台地址：[http://localhost:3000/dashboard](http://localhost:3000/dashboard)

## 项目结构

```
src/
├── app/
│   ├── (admin)/dashboard/     # 管理后台页面
│   ├── (store)/               # 店铺前台页面
│   ├── (auth)/                # 登录/注册页面
│   └── api/                   # API 路由
│       ├── admin/             # 后台 API（需 ADMIN 角色）
│       ├── ai/                # AI 功能 API
│       ├── orders/            # 订单 API
│       └── cron/              # 定时任务
├── components/
│   ├── admin/                 # 后台组件
│   └── store/                 # 前台组件
├── lib/
│   ├── chains/                # AI 链（文案生成、客服、合规检测）
│   ├── tools/                 # AI 工具（订单查询等）
│   ├── services/              # 业务服务（营销、废弃购物车）
│   └── store/                 # Zustand 状态
└── proxy.ts                   # Next.js 中间件（路由保护）
```

## 部署

### Vercel（推荐）

1. 将代码推送到 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 配置环境变量（同 `.env.example`）
4. 部署完成后运行数据库迁移：

```bash
npx prisma migrate deploy
```

### 注意事项

- 生产环境请替换 `AUTH_SECRET` 为随机强密钥
- 模拟支付仅用于演示，生产环境需接入真实支付网关（支付宝/微信支付）
- `RESEND_API_KEY` 用于营销邮件，不配置则邮件功能不可用

## License

MIT
