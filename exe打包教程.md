# AI Novel Writing Assistant - Windows `.exe` 安装包打包教程

本教程详细介绍了如何将 **AI Novel Writing Assistant** 项目打包为 Windows 平台的 `.exe` 安装包或单文件绿色版（Portable）。

---

## 目录
1. [环境准备](#1-环境准备)
2. [网络与镜像源配置（解决超时报错）](#2-网络与镜像源配置解决超时报错)
3. [依赖安装](#3-依赖安装)
4. [打包构建步骤](#4-打包构建步骤)
   - [方法 A：生成 `.exe` 标准安装包（NSIS）](#方法-a生成-exe-标准安装包nsis推荐)
   - [方法 B：生成 `.exe` 便携免安装版（Portable）](#方法-b生成-exe-便携免安装版portable)
   - [方法 C：仅产出打包产物目录（解压即用/测试）](#方法-c仅产出打包产物目录解压即用测试)
5. [产出文件目录位置](#5-产出文件目录位置)
6. [常见报错与排查指南](#6-常见报错与排查指南)

---

## 1. 环境准备

在开始打包之前，请确保你的开发环境满足以下要求：

* **操作系统**：Windows 10 / 11 64位
* **Node.js**：`^20.19.0` 或 `^22.12.0`（推荐使用 Node.js 20.19.x LTS）
* **pnpm**：`>= 10.6.0`（建议通过 `npm i -g pnpm` 安装）
* **C++ 构建环境（可选但推荐）**：由于项目依赖 `better-sqlite3` 等原生 C++ 模块，建议系统已安装 Visual Studio Build Tools（包含 C++ 桌面开发工作集）或 Python 环境。

---

## 2. 网络与镜像源配置（解决超时报错）

在打包过程中，pnpm 需要下载依赖，`electron-builder` 需要下载 Electron 运行时与 `nsis` 打包工具工具链。若出现 `ETIMEDOUT` 或 `ECONNRESET`，请做如下配置：

### 2.1 设置 NPM 镜像源
在 PowerShell 或 CMD 中运行：

```bash
# 设置 pnpm/npm 使用官方源或淘宝最新镜像源
pnpm config set registry https://registry.npmmirror.com/

# 如果你开启了 VPN 代理且代理出现冲突，清除 npm 代理设置：
pnpm config delete proxy
pnpm config delete https-proxy
```

### 2.2 设置 Electron / Builder 镜像源（关键）
在打包打包 Electron 应用程序时，`electron-builder` 会从 GitHub Releases 下载工具链。在中国大陆网络环境下，建议配置镜像环境变量：

在 PowerShell 中执行：
```powershell
$env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
$env:ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/"
```

---

## 3. 依赖安装

进入项目根目录：

```bash
# 1. 检查或安装 pnpm
npm install -g pnpm

# 2. 安装项目依赖
pnpm install

# 3. (可选) 提前拉取桌面端 Electron 运行时
pnpm run prepare:desktop-runtime
```

---

## 4. 打包构建步骤

项目内部已高度集成了统一打包脚本，会自动完成：
1. `@ai-novel/shared` 共享库构建
2. `@ai-novel/server` Prisma ORM 客户端生成与服务端打包
3. `@ai-novel/client` 前端 UI 构建
4. 资源阶段化暂存（`stage-desktop`）
5. Electron-Builder 封装为安装包

### 方法 A：生成 `.exe` 标准安装包（NSIS）【推荐】

如果你想打包出一个带安装向导、桌面快捷方式的常规 `.exe` 安装程序：

```bash
pnpm run dist:desktop:nsis
```

> **提示**：如果之前已经成功执行过构建暂存，仅想快速重新打包 Electron，可使用复用暂存命令：
> ```bash
> pnpm run dist:desktop:nsis:reuse-stage
> ```

---

### 方法 B：生成 `.exe` 便携免安装版（Portable）

如果你想生成一个双击直接运行、无需安装的单文件 `.exe`：

```bash
pnpm run dist:desktop:portable
```

---

### 方法 C：仅打包并验证目录结构

如果你想调试打包后的文件，验证 Electron 安装包结构而不压缩生成 `.exe`：

```bash
pnpm run verify:desktop-package
```

---

## 5. 产出文件目录位置

打包完成后，所有的最终产物（包含 `.exe` 安装包）都会保存在项目根目录下的 **`dist-desktop/`** 目录中：

* **标准安装包**：`dist-desktop/AI-Novel-Writing-Assistant-Setup-x.y.z.exe`
* **便携免安装版**：`dist-desktop/AI-Novel-Writing-Assistant-x.y.z.exe`

---

## 6. 常见报错与排查指南

| 报错现象 | 原因分析 | 解决方案 |
| :--- | :--- | :--- |
| `ETIMEDOUT` / `connect ETIMEDOUT` | 代理软件冲突或网络连通超时 | 参考第 2 节，清理 proxy 配置，并设置国内镜像源。 |
| `pnpm : 无法将“pnpm”项识别...` | 未全局安装 pnpm 或环境变量未添加 | 运行 `npm i -g pnpm` 安装，或使用 `npx pnpm <command>` 命令。 |
| `better-sqlite3` 编译报错 | 缺少 Python 或 MSVC 编译器 | 确保运行 Node 20/22 环境，或安装 `npm i -g node-gyp` 和 VS Build Tools。 |
| `Downloading nsis-3.x.x failed` | GitHub Releases 下载网络卡住 | 设置 `$env:ELECTRON_BUILDER_BINARIES_MIRROR` 环境变量后重试。 |

