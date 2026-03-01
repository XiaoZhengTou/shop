# StyleAI Design System — MASTER

> 全局设计规范，所有页面默认遵循此文件。
> 如有页面专属覆盖规则，参见 `design-system/pages/[page].md`

---

## 设计风格：Exaggerated Minimalism + Liquid Glass AI 点缀

**核心策略**：整体采用**夸张极简主义**（高性能、WCAG AA、时尚感强），
仅在 AI 交互时刻（文案生成面板、AI 聊天窗口、分析报告卡片）使用**Liquid Glass 效果**，
以视觉语言区分"普通内容"和"AI 魔法时刻"。

---

## 色彩系统

| Token | Tailwind | Hex | 用途 |
|-------|----------|-----|------|
| `primary` | `neutral-900` | `#171717` | 主文字、主按钮背景 |
| `secondary` | `neutral-600` | `#525252` | 副标题、辅助文字 |
| `accent` | — | `#D4AF37` | CTA 按钮、高亮、金色徽章 |
| `background` | `white` | `#FFFFFF` | 页面背景 |
| `surface` | `neutral-50` | `#FAFAFA` | 卡片背景 |
| `border` | `neutral-200` | `#E5E5E5` | 分割线、卡片边框 |
| `muted` | `neutral-400` | `#A3A3A3` | 占位文字（不可单独用作正文）|
| `success` | `emerald-600` | `#059669` | 合规通过、库存充足 |
| `warning` | `amber-500` | `#F59E0B` | 合规警告、库存预警 |
| `danger` | `red-600` | `#DC2626` | 合规错误、下架状态 |

### Tailwind CSS 自定义变量（tailwind.config.ts）
```ts
colors: {
  accent: {
    DEFAULT: '#D4AF37',
    light: '#E8C547',
    dark: '#B8960F',
  }
}
```

---

## 排版系统

**Heading**: Cormorant（奢华时尚，用于大标题）
**Body**: Montserrat（现代简洁，用于正文和 UI 标签）

```css
/* Google Fonts Import — 放入 layout.tsx */
@import url('https://fonts.googleapis.com/css2?family=Cormorant:wght@400;500;600;700&family=Montserrat:wght@300;400;500;600;700&display=swap');
```

| 用途 | 字体 | 大小 | 字重 | Tailwind |
|------|------|------|------|----------|
| 品牌主标题 | Cormorant | clamp(2.5rem, 6vw, 5rem) | 600 | `font-serif text-5xl font-semibold` |
| 页面标题 H1 | Cormorant | 2.25rem | 600 | `font-serif text-4xl font-semibold` |
| 区块标题 H2 | Cormorant | 1.875rem | 500 | `font-serif text-3xl font-medium` |
| 卡片标题 H3 | Montserrat | 1.125rem | 600 | `font-sans text-lg font-semibold` |
| 正文 | Montserrat | 1rem | 400 | `font-sans text-base` |
| 小字/标签 | Montserrat | 0.875rem | 400 | `font-sans text-sm` |
| 价格 | Montserrat | 1.5rem | 700 | `font-sans text-2xl font-bold` |

---

## 间距系统

使用 Tailwind 默认间距，关键约定：
- 页面横向 padding：`px-4 md:px-6 lg:px-8`
- 最大内容宽度：`max-w-7xl mx-auto`
- 区块间距（Section gap）：`py-16 md:py-24`
- 卡片内边距：`p-4 md:p-6`
- 元素间距：`gap-4`（紧凑）/ `gap-6`（标准）/ `gap-8`（宽松）

---

## 组件规范

### 按钮
```
主按钮（Primary）：    bg-neutral-900 text-white hover:bg-neutral-700
金色强调（Accent）：   bg-[#D4AF37] text-white hover:bg-[#B8960F]
轮廓按钮（Outline）：  border border-neutral-900 bg-white hover:bg-neutral-50
危险按钮（Danger）：   bg-red-600 text-white hover:bg-red-700

所有按钮：cursor-pointer transition-colors duration-200
```

### 商品卡片（ProductCard）
```
背景：bg-white border border-neutral-200 rounded-none（极简，无圆角）
图片：aspect-[3/4] object-cover，商品图占 3/4
hover：shadow-lg transition-shadow duration-200
价格：text-neutral-900 font-bold（非红色，高端感）
```

### AI 内容区域（Liquid Glass 效果）
```
AI 生成结果卡片、聊天气泡（AI回复）、AI运营中枢：
backdrop-filter: blur(20px) saturate(180%)
background: rgba(255,255,255,0.85)
border: 1px solid rgba(255,255,255,0.6)
box-shadow: 0 8px 32px rgba(0,0,0,0.08)
```

### 导航栏
```
消费者端 Nav：bg-white/95 backdrop-blur-sm border-b border-neutral-100 sticky top-0 z-50
后台 Sidebar：bg-neutral-900 text-white（深色，与商城形成对比）
```

---

## 动效规范

| 场景 | 时长 | 曲线 |
|------|------|------|
| 悬浮/微交互 | 150-200ms | ease-out |
| 页面过渡 | 200-300ms | ease-in-out |
| AI生成动画 | 400-600ms | cubic-bezier(0.4,0,0.2,1) |
| 弹窗/抽屉 | 250ms | ease-out |

**Skeleton 加载**：所有异步内容使用 `animate-pulse bg-neutral-100` 骨架屏

---

## 图标系统

统一使用 **Lucide React**（`import { X } from 'lucide-react'`）
- 所有图标 `size={16}` 或 `size={20}`，保持一致
- 禁止使用 emoji 作为图标
- icon-only 按钮必须加 `aria-label`

---

## 响应式断点

| 断点 | 宽度 | 商品网格 | 导航 |
|------|------|----------|------|
| mobile | 375px | 2列 | 汉堡菜单 |
| tablet | 768px | 3列 | 简化导航 |
| desktop | 1024px | 4列 | 完整导航 |
| wide | 1440px | 4-5列 | 完整导航 + 侧边筛选 |

---

## 电商需求对照（来自需求图）

| 需求 | 对应功能 | UI 位置 |
|------|----------|---------|
| AI 文案生成/批量上架 | WF-2 ListingGenerator | Admin > 商品管理 |
| RPA 自动化（影刀集成提示）| 发布审核界面 | Admin > 商品管理 |
| 竞品情报看板 | AnalyticsAgent 报告 | Admin > 数据分析 |
| 私有知识库 | KnowledgeBase + RAG | 智能客服后台 |
| 智能客服 | WF-4 AI聊天窗 | 消费者端右下角 |
| 数据决策看板 | WF-6 Analytics | Admin > 数据看板 |
| 视频脚本生成 | WF-3 TikTok脚本 | Admin > 营销中心 |

---

## Pre-Delivery Checklist

- [ ] 所有图标来自 Lucide React，无 emoji
- [ ] 所有可点击元素有 `cursor-pointer`
- [ ] hover 状态有 `transition-colors duration-200`
- [ ] 正文文字对比度 ≥ 4.5:1（#171717 on white = 16.1:1 ✓）
- [ ] 所有图片使用 `next/image`，有 alt 属性
- [ ] 表单输入有 label 关联
- [ ] AI 内容区域有 Liquid Glass 效果区分
- [ ] 骨架屏用于异步加载
- [ ] 响应式：375 / 768 / 1024 / 1440px 测试通过
