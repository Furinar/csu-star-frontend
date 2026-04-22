<div align="center">

# 🌟 中南星 · CSU Star 前端

[![Typing SVG](https://readme-typing-svg.herokuapp.com?font=Fira+Code&pause=1000&color=1E90FF&center=true&vCenter=true&width=435&lines=Welcome+to+CSU+Star+Frontend;中南大学生的内容共享与指南生态;Make+CSU+Great+Again)](https://git.io/typing-svg)

**中南星 (CSU Star) 官方 Web 前端项目**

_基于 Next.js 构建，致力于提供现代、流畅、美观的校园生活与学习共享体验_

[![Framework](https://img.shields.io/badge/框架-Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?style=flat-square&logo=typescript&logoColor=white)]()
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=nodedotjs&logoColor=white)]()
[![License](https://img.shields.io/badge/License-GPL_v3-blue.svg?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

</div>

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=1E90FF&height=80&section=header" />

## 目录

<div align="center">

[![简介](https://img.shields.io/badge/-简介-1E90FF?style=for-the-badge)](#简介)&nbsp;
[![特色功能](https://img.shields.io/badge/-特色功能-00BFFF?style=for-the-badge)](#特色功能)&nbsp;
[![技术栈](https://img.shields.io/badge/-技术栈-87CEFA?style=for-the-badge)](#技术栈)&nbsp;
[![项目结构](https://img.shields.io/badge/-项目结构-4682B4?style=for-the-badge)](#项目结构)

[![快速开始](https://img.shields.io/badge/-快速开始-1E90FF?style=for-the-badge)](#快速开始)&nbsp;
[![部署相关](https://img.shields.io/badge/-部署相关-00BFFF?style=for-the-badge)](#部署相关)&nbsp;
[![联系我们](https://img.shields.io/badge/-联系我们-87CEFA?style=for-the-badge)](#联系我们)

</div>

## 简介

本项目为 **CSU Star（中南星）** 的客户端前端代码库。项目全面拥抱前端前沿技术，采用 Next.js App Router 架构与 React 服务器组件 (RSC)，旨在打造一个包含专业点评、课程分享、学习指南在内的综合性校园知识共享圈。

## 特色功能

| 板块           | 说明                                                                   |
| -------------- | ---------------------------------------------------------------------- |
| **指南与百科** | 囊括入学基础、专业介绍、课程评测与维基内容展示，助力打破信息差         |
| **评价与互动** | 支持用户对丰富的校园资源（课程、社团等）进行评分和分享，提供真实的反馈 |
| **个性化主页** | 完善的个人中心，集成用户反馈、内容管理与定制化导航                     |
| **全端适配**   | 响应式设计与现代化 UI，对移动端与 PC 端皆有良好兼容                    |

## 技术栈

| 类别           | 技术                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **核心框架**   | ![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white) 15+ (App Router) |
| **UI 与样式**  | ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)     |
| **状态管理**   | ![Zustand](https://img.shields.io/badge/Zustand-4A4A55?style=flat-square) (结合 React Hooks)                              |
| **包管理器**   | ![pnpm](https://img.shields.io/badge/pnpm-F69220?style=flat-square&logo=pnpm&logoColor=white)                             |
| **部署与托管** | ![Tencent COS](https://img.shields.io/badge/腾讯云COS-0052D9?style=flat-square&logo=tencentqq&logoColor=white)            |

## 项目结构

<details>
<summary><b>点击展开核心目录结构</b></summary>

```text
csu-star-frontend/
├── app/               # Next.js App Router 路由与页面入口
│   ├── (features)/    # 各大核心功能模块 (compass, course, rank, me等)
│   ├── login/         # 认证与登录模块
│   └── styles/        # 全局样式与 CSS 变量设定
├── components/        # 可复用的 React 组件库 (UI件与业务组件)
├── data/              # 静态配置数据 (部门、导航配置等)
├── hooks/             # 自定义 React Hooks
├── lib/               # 核心工具类与基础设施 (请求封装、鉴权工具等)
├── store/             # 全局状态管理 (Zustand stores)
├── types/             # 全局 TypeScript 类型声明
├── scripts/           # 项目构建与部署脚本 (如腾讯云 COS 发布)
└── public/            # 静态资源 (图片、图标等)
```

</details>

## 快速开始

> [!TIP]
> 本项目使用 `pnpm` 作为包管理器，请确保已全局安装 `pnpm` (Node.js 建议 18.x 及以上)。

```bash
# 1. 安装依赖
pnpm install

# 2. 启动本地开发服务器
pnpm run dev

# 3. 访问本地预览
# 打开浏览器访问 http://localhost:3000
```

_提示：你可以通过修改 `app/page.tsx` 来开始你的开发，页面支持热更新 (HMR)。_

## 部署相关

项目包含了基于云对象存储的自动化部署能力。配置好相关环境变量后，项目可通过内置脚本快捷发版：

```bash
# 1. 配置部署环境变量
cp deploy.cos.env.example .env.local
# (随后在 .env.local 中填入腾讯云或对应云厂商提供的密钥)

# 2. 构建生产环境包
pnpm run build

# 3. 执行发布脚本推送至对象存储服务
node scripts/deploy-cos.mjs
```

## 联系我们

- **意见反馈 / 参与共建**：如果你有好的建议、遇到任何 Bug 或者希望加入我们，可以提交 Issue 或者通过 PR 贡献代码！
- 加入 CSUer 开发者阵营，一起打造好用的校园信息生态工具。

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=1E90FF&height=80&section=footer" />

<div align="center">

<sub>Made with ❤️ for all CSUers</sub>

<a href="#-中南星--csu-star-前端">
  <img src="https://img.shields.io/badge/Back_to_Top-1E90FF?style=for-the-badge" alt="Back to Top" />
</a>

</div>
