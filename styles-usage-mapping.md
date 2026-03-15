# CSS 定义与使用映射 — CSU STAR 前端项目

## 📋 概述

本文档记录了 `app/styles/` 目录中所有 CSS 定义（类、ID、动画、变量）及其在整个项目中的使用位置。

---

## 1️⃣ animations.css

### 梯度工具类

#### `.gradient-iceberg`

- **定义位置**: `app/styles/animations.css`
- **定义**: 冰山蓝色渐变 (从浅冰蓝 → 深冰蓝 → 深灰蓝)
- **使用**: 未在项目中直接使用

#### `.gradient-startrail`

- **定义位置**: `app/styles/animations.css`
- **定义**: 星轨渐变 (从深海 → 星紫600 → 流光金)
- **使用**: 未在项目中直接使用

#### `.gradient-ice-star`

- **定义位置**: `app/styles/animations.css`
- **定义**: 冰星混合渐变 (深海 → 冰蓝800 → 星紫700 → 冰蓝400 → 流光301)
- **使用**: 未在项目中直接使用

### 动画定义

#### `@keyframes twinkle`

- **定义位置**: `app/styles/animations.css`
- **定义**: 星星闪烁动画 (0%/100%: 不透明度0.2, 50%: 不透明度1)
- **关联类**: `.animate-twinkle`
- **使用**: 未在项目中直接使用

#### `.animate-twinkle`

- **定义位置**: `app/styles/animations.css`
- **定义**: 应用twinkle动画 (3秒循环)
- **使用**: 未在项目中直接使用

#### `@keyframes star-ani`

- **定义位置**: `app/styles/animations.css`
- **定义**: 流星动画 (缩放和移动轨迹)
- **关联类**: `.star`
- **使用**: `components/effects/ShootingStars.tsx`

### 玻璃与发光特效

#### `.glass-ice`

- **定义位置**: `app/styles/animations.css`
- **定义**: 冰质玻璃效果 (半透明蓝色背景 + 毛玻璃效果)
- **使用**: 未在项目中直接使用

#### `.glow-star`

- **定义位置**: `app/styles/animations.css`
- **定义**: 星光发光效果 (紫色阴影)
- **使用**: 未在项目中直接使用

#### `.glow-gold`

- **定义位置**: `app/styles/animations.css`
- **定义**: 金光发光效果 (金色阴影)
- **使用**: 未在项目中直接使用

### 流星特效

#### `.stars-space`

- **定义位置**: `app/styles/animations.css`
- **定义**: 流星容器 (绝对定位，覆盖整个区域，不可交互)
- **使用**:
  - `components/effects/ShootingStars.tsx`

#### `.star`

- **定义位置**: `app/styles/animations.css`
- **定义**: 单个流星元素 (1px宽，应用star-ani动画)
- **使用**:
  - `components/effects/ShootingStars.tsx` (类 `.star-a` 到 `.star-h`)

#### `.star-a`, `.star-b`, `.star-c`, `.star-d`, `.star-e`, `.star-f`, `.star-g`, `.star-h`

- **定义位置**: `app/styles/animations.css`
- **定义**: 各流星的独特位置和动画延迟
- **使用**:
  - `components/effects/ShootingStars.tsx` (各自对应一个 `.star` 元素)

### 渐变文本

#### `.hero-gradient-text`

- **定义位置**: `app/styles/animations.css`
- **定义**: 英雄级渐变文本 (浅色主题：主色 → 流光金，深色主题：冰蓝 → 流光301)
- **使用**:
  - `components/home/HomeSection.tsx` (包装 "CSU STAR" 文本)

#### `.dark-theme .hero-gradient-text`

- **定义位置**: `app/styles/animations.css`
- **定义**: 暗色主题下的渐变文本样式
- **使用**: 自动在暗色主题下应用到上述 `.hero-gradient-text`

---

## 2️⃣ base.css

### 滚动容器

#### `.snap-scroll-container`

- **定义位置**: `app/styles/base.css`
- **定义**: 可滚动容器 (完整视口高度，光滑滚动)
- **使用**:
  - `app/page.tsx` (主滚动容器)

#### `.snap-section`

- **定义位置**: `app/styles/base.css`
- **定义**: 页面分段 (最小100dvh高度)
- **使用**:
  - `app/page.tsx`
  - `components/home/HomeSection.tsx`
  - `components/home/SkillsAccordion.tsx`
  - `components/home/PortfolioGrid.tsx`
  - `components/home/AboutSection.tsx`
  - `components/home/ContactSection.tsx`

### 根元素样式

#### 全局样式 (html, body, h1-h4, ul, a, img)

- **定义位置**: `app/styles/base.css`
- **定义**: 基础重置和全局样式
- **使用**: 全局应用到所有页面元素

---

## 3️⃣ theme.css

### Tailwind 主题注册

本文件不定义 CSS 类，而是为 Tailwind CSS 注册自定义主题变量。

#### 颜色映射

- **定义位置**: `app/styles/theme.css`
- **内容**: 将 CSS 变量映射为 Tailwind 颜色类
- **使用**: Tailwind 工具类在组件中访问这些颜色（如 `bg-[--color-first]`, `text-[--color-title]` 等）

---

## 4️⃣ utilities.css

### 分段标题

#### `.section`

- **定义位置**: `app/styles/utilities.css`
- **使用**: 未直接在项目中使用 (通常与其他类组合)

#### `.section__title`

- **定义位置**: `app/styles/utilities.css`
- **使用**: 在多个分段的标题中

#### `.section__subtitle`

- **定义位置**: `app/styles/utilities.css`
- **使用**: 在多个分段的副标题中

### 容器与网格

#### `.container`

- **定义位置**: `app/styles/utilities.css`
- **使用**:
  - `app/(features)/teacher/page.tsx`
  - `components/home/HomeSection.tsx`
  - `components/home/SkillsAccordion.tsx`
  - `components/layout/BaseNav.tsx`
  - `components/home/PortfolioGrid.tsx`
  - `components/home/AboutSection.tsx`
  - `components/home/ContactSection.tsx`
  - `components/home/FooterSection.tsx`

#### `.grid`

- **定义位置**: `app/styles/utilities.css`
- **使用**:
  - `app/(features)/teacher/page.tsx`
  - `components/home/HomeSection.tsx`
  - `components/home/SkillsAccordion.tsx`
  - `components/home/PortfolioGrid.tsx`
  - `components/home/AboutSection.tsx`
  - `components/home/ContactSection.tsx`

### 按钮样式

#### `.button` (及其悬停、变体类: `.button:hover`, `.button__icon`, `.button--flex`, `.button--link`, `.button--small`)

- **定义位置**: `app/styles/utilities.css`
- **使用**:
  - `components/home/HomeSection.tsx`
  - `components/home/ContactSection.tsx`
  - (注：`.button--small` 未在项目中直接使用)

### 滚动条样式 (::-webkit-scrollbar 等)

- **定义位置**: `app/styles/utilities.css`
- **使用**: 全局应用到整个项目

---

## 5️⃣ variables.css

### CSS 变量 (Light Theme - :root & Dark Theme - .dark-theme)

定义了项目的色系、语义颜色（如 `--first-color`, `--body-color` 等）、字体系列和大小、间距以及层级 (z-index) 变量。

- **定义位置**: `app/styles/variables.css`
- **主要使用点**:
  - 通过 Tailwind CSS 自定义颜色配置
  - 组件样式中如 `components/ui/SearchBar.tsx`, `components/ui/CollegeLoop.tsx` 等。
  - 全局重置如 `app/styles/base.css`, `app/styles/utilities.css` 等。
  - 主题切换逻辑中 (`components/ui/ThemeToggle.tsx`, `components/layout/BaseNav.tsx`) 动态响应 `.dark-theme`。

---

## 📊 统计与总结

目前项目中大部分的布局类、变量和主流效类都得到了充分的使用。但有少许定义（如 `.gradient-iceberg` 等多个渐变类、`.animate-twinkle`、`.glass-ice` 和 `.button--small` 定位为预留类）暂时未在项目中直接体现对应的使用。
