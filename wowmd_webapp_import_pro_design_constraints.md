# wowMD v0.3 插件到 Web App 导入开发指导 / 约束文档

## 0. 文档目的

本文档用于指导 wowMD v0.3 的插件与 Web App 衔接开发。

v0.3 只解决一个问题：

> 用户在 GitHub 使用 wowMD 插件阅读 README / `.md` 文件时，可以一键把当前 GitHub Markdown 通过 `rawUrl` 带到 wowMD Web App 中继续阅读。

本版本只定义：

- 插件如何生成并传递 GitHub Markdown metadata
- Web App 如何接收 `/app/import` 参数（应用内部逻辑路由为 `/import`）
- Web App 如何校验 `rawUrl`
- Web App 如何前端 fetch Markdown
- Web App 如何创建本地阅读副本并进入阅读界面
- Web App 与插件之间的参数契约和联调验收
- 开发前后的版本与发布文档更新要求
- 免费用户进入 Web App 后不被付费入口拦截
- 隐私与安全边界

本版本不开发、也不设计：

- 插件端 Pro 功能
- 插件端 License / 支付 / 登录
- Web App 高亮 / 附注
- Web App 导出
- Web App Health Check
- 云同步
- 账号系统
- Lemon Squeezy 或任何真实支付平台接入

---

## 1. 产品原则

### 1.1 插件保持轻量

插件只做：

- GitHub README / `.md` 阅读增强
- Outline / 阅读视图
- H2 折叠
- `Continue in Web App` 入口
- 传递当前文档的 source metadata

插件不做：

- 登录
- License 校验
- Pro 判断
- 支付
- 导出
- 高亮 / 附注
- 健康检查
- 云同步
- AI / 翻译

### 1.2 Web App 只新增导入能力

v0.3 中，Web App 唯一需要新增的是接收并处理插件传来的 GitHub Markdown `rawUrl`：

- 接收 `/app/import?source=github&rawUrl=...`
- 校验 `source` 和 `rawUrl`
- 前端直接 fetch `rawUrl`
- 创建浏览器本地文档副本
- 进入阅读界面

Web App 本次不新增高亮、附注、导出、Health Check、账号或支付能力。

### 1.3 不上传用户文档内容

默认不上传：

- Markdown 原文
- 本地文档副本
- 用户后续可能产生的笔记或阅读数据

v0.3 的 Markdown 获取应发生在浏览器前端，内容保存在用户浏览器本地。

### 1.4 免费用户不被入口拦截

用户从插件点击 `Continue in Web App` 后，应直接进入阅读界面。

不要在 `/app/import` 或首次进入阅读页时显示付费墙、登录墙或 Pro 提示。

---

## 2. v0.3 功能范围

### 2.1 插件端必须支持

- 插件阅读界面始终显示 `Continue in Web App` 按钮。
- 点击按钮后打开 Web App `/app/import` 页面。
- URL 只传 source metadata，不传完整 Markdown 内容。
- 必须传递 `source=github`、`rawUrl`、`pageUrl`。
- 推荐传递 `owner`、`repo`、`branch`、`path`、`title`。
- 插件不判断用户是否 Pro。
- 插件不处理 License、支付、导出、高亮、附注或 Health Check。

### 2.2 Web App 必须支持

- 新增或复用 `/import` 逻辑路由；线上部署路径为 `/app/import`。
- 解析 URL 参数。
- 校验 `source === 'github'`。
- 校验 `rawUrl` 只允许 `https://raw.githubusercontent.com/...`。
- 前端直接 fetch Markdown。
- 处理导入错误并展示友好提示。
- 创建本地文档副本。
- 跳转到阅读页，例如 `/app/reader/:docId`。
- 阅读页展示 Markdown 内容、标题和来源链接。
- 免费用户可直接阅读。

### 2.3 本版本明确不支持

- License 校验
- Pro 功能限制
- 导出 HTML / EPUB / PDF
- 高亮 / 附注
- 笔记备份导入导出
- Health Check
- Web App 后端代理 fetch
- 任意第三方 URL 导入
- GitHub 私有仓库导入
- 账号系统
- 云同步

---

## 3. 插件端设计

### 3.1 Continue in Web App 按钮

插件阅读界面底部应始终显示：

```text
Continue in Web App →
```

或中文：

```text
在 Web App 中继续 →
```

显示策略：

- 始终显示
- 不根据是否 Pro 判断
- 不根据文档复杂度判断
- 不根据 Web App 是否打开判断

不要使用这些文案：

```text
Download and open
Export in Web App
Upgrade in Web App
Pro features
```

原因：用户此时要继续阅读，不是进入付费、导出或升级流程。

### 3.2 插件传递的数据

推荐 URL：

```text
https://wowmd-app.pages.dev/app/import?source=github&rawUrl=...&pageUrl=...&owner=...&repo=...&branch=...&path=...&title=...
```

必传参数：

```javascript
{
  source: 'github',
  rawUrl: 'https://raw.githubusercontent.com/...',
  pageUrl: 'https://github.com/...'
}
```

推荐参数：

```javascript
{
  owner: 'facebook',
  repo: 'react',
  branch: 'main',
  path: 'README.md',
  title: 'README.md'
}
```

禁止在 URL 中传递：

- 完整 Markdown 内容
- 用户高亮
- 用户附注
- License Key
- 用户邮箱
- 私密 token
- 任何账号或支付信息

### 3.3 插件打开 Web App 示例

```javascript
function openInWebApp(docMeta) {
  // Temporary v0.3 target while the Web App is deployed on Cloudflare Pages.
  // Switch to https://wowmd.app/app/import after the production domain is live.
  const url = new URL('https://wowmd-app.pages.dev/app/import');

  url.searchParams.set('source', 'github');
  url.searchParams.set('rawUrl', docMeta.rawUrl);
  url.searchParams.set('pageUrl', docMeta.pageUrl || location.href);

  if (docMeta.owner) url.searchParams.set('owner', docMeta.owner);
  if (docMeta.repo) url.searchParams.set('repo', docMeta.repo);
  if (docMeta.branch) url.searchParams.set('branch', docMeta.branch);
  if (docMeta.path) url.searchParams.set('path', docMeta.path);
  if (docMeta.title) url.searchParams.set('title', docMeta.title);

  window.open(url.toString(), '_blank', 'noopener,noreferrer');
}
```

---

## 4. Web App Import 设计

### 4.1 路由

推荐路由：

```text
/app/import
```

示例：

```text
/app/import?source=github&rawUrl=https%3A%2F%2Fraw.githubusercontent.com%2F...
```

### 4.2 Import 页面职责

Import 页面负责：

1. 解析 URL 参数。
2. 校验 `source`。
3. 校验 `rawUrl`。
4. 前端 fetch Markdown。
5. 创建本地文档副本。
6. 跳转到阅读界面。

Import 页面不负责：

- License 弹窗
- Pro 拦截
- 导出
- 高亮 / 附注
- Health Check
- 登录或账号创建

### 4.3 Web App 对接契约

Web App 应把插件传来的 URL 参数视为外部输入，先归一化，再校验，再执行导入。

推荐内部数据结构：

```javascript
{
  source: 'github',
  rawUrl: 'https://raw.githubusercontent.com/owner/repo/branch/path.md',
  pageUrl: 'https://github.com/owner/repo/blob/branch/path.md',
  owner: 'owner',
  repo: 'repo',
  branch: 'branch',
  path: 'path.md',
  title: 'path.md'
}
```

处理规则：

- `source` 必须是 `github`。
- `rawUrl` 必须存在且通过 allowlist 校验。
- `pageUrl` 可用于来源链接展示，但不要用于 fetch。
- `owner/repo/branch/path/title` 是展示和记录用途，不能替代 `rawUrl` 校验。
- `title` 缺失时可从 `path` 取文件名；仍缺失时使用 `README.md` 或 `GitHub Markdown`。
- 参数解析失败时停留在 Import 页面并显示友好错误。

### 4.4 推荐 Web App 模块边界

根据现有代码结构调整命名即可，但职责应清楚分开：

```text
parseImportParams(searchParams) -> importMeta
isAllowedRawUrl(rawUrl) -> boolean
fetchMarkdownFromRawUrl(rawUrl) -> markdown
createLocalDocument(importMeta, markdown) -> doc
navigateToReader(doc.id)
```

建议放置：

```text
ImportPage
  负责页面状态、错误展示、调用导入服务、成功后跳转

importService
  负责参数校验、fetch、组装本地文档

localDb
  负责 IndexedDB 读写

ReaderPage
  负责根据 docId 读取本地副本并渲染
```

不要把 URL 解析、fetch、IndexedDB 写入和 Markdown 渲染全部堆在同一个 UI 组件里。

### 4.5 Import 页面状态

Import 页面至少需要处理这些状态：

- `loading`：正在导入，显示轻量加载状态。
- `invalid`：参数不合法或 `rawUrl` 不被允许。
- `failed`：fetch 失败、超时或内容为空。
- `success`：本地副本创建成功，立即跳转阅读页。

Import 页面不需要复杂营销内容，也不需要解释 Pro 功能。它的任务是完成导入，或给出可恢复的错误提示。

### 4.6 Reader 衔接要求

Reader 页面应以本地 `docId` 为入口：

```text
/app/reader/:docId
```

Reader 页面读取本地文档副本，而不是重新 fetch `rawUrl`。

如果找不到本地副本，应显示友好错误，例如：

```text
We couldn't find this local document.
Please import it from GitHub again.
```

### 4.7 导入流程

```text
用户点击插件 Continue in Web App
  ↓
打开 /app/import?source=github&rawUrl=...
  ↓
Web App 校验 source/rawUrl
  ↓
前端 fetch rawUrl
  ↓
读取 Markdown 文本
  ↓
创建本地文档副本
  ↓
进入 /app/reader/:docId
```

---

## 5. rawUrl 安全校验

### 5.1 只允许 GitHub raw URL

v0.3 只允许：

```text
https://raw.githubusercontent.com/...
```

不建议 v0.3 接受普通 GitHub 页面 URL，例如：

```text
https://github.com/owner/repo/blob/branch/README.md
```

如果未来要支持 GitHub 页面 URL，应另行设计 URL 解析和转换逻辑。

### 5.2 推荐校验函数

```javascript
function isAllowedRawUrl(value) {
  try {
    const url = new URL(value);

    return (
      url.protocol === 'https:' &&
      url.hostname === 'raw.githubusercontent.com'
    );
  } catch {
    return false;
  }
}
```

### 5.3 必须拒绝

必须拒绝：

```text
http://
file://
chrome://
localhost
127.0.0.1
0.0.0.0
10.x.x.x
172.16.x.x - 172.31.x.x
192.168.x.x
任意非 raw.githubusercontent.com 域名
```

即使请求发生在浏览器前端，也必须限制输入来源，避免导入能力被滥用。

---

## 6. Web App fetch 策略

### 6.1 前端直接 fetch

v0.3 使用浏览器前端直接请求 `rawUrl`：

```javascript
async function fetchMarkdownFromRawUrl(rawUrl) {
  if (!isAllowedRawUrl(rawUrl)) {
    throw new Error('DISALLOWED_RAW_URL');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(rawUrl, {
      signal: controller.signal,
      cache: 'no-store'
    });

    if (!res.ok) {
      throw new Error(`FETCH_FAILED_${res.status}`);
    }

    const text = await res.text();

    if (!text.trim()) {
      throw new Error('EMPTY_MARKDOWN');
    }

    return text;
  } finally {
    clearTimeout(timer);
  }
}
```

### 6.2 不使用后端代理

v0.3 不允许：

```text
Web App backend fetch rawUrl
```

原因：

- 不需要服务器中转。
- 不上传 Markdown 内容。
- 避免 SSRF 风险。
- 降低维护成本。

---

## 7. 本地文档副本

### 7.1 为什么需要本地副本

导入成功后，Web App 应创建当前 Markdown 的本地阅读副本，而不是每次阅读都依赖远程 `rawUrl`。

原因：

- GitHub README 后续可能变化。
- 阅读页需要稳定内容。
- 后续能力如高亮、附注或导出如果出现，应基于导入时的副本，而不是重新抓取远程内容。

### 7.2 存储建议

推荐使用 IndexedDB。

数据库：

```text
wowmd_local
```

v0.3 至少需要一个文档存储：

```text
documents
```

### 7.3 document 数据结构

```javascript
{
  id: 'doc_xxx',
  sourceType: 'github',
  title: 'README.md',
  sourceUrl: 'https://github.com/facebook/react',
  rawUrl: 'https://raw.githubusercontent.com/facebook/react/main/README.md',
  owner: 'facebook',
  repo: 'react',
  branch: 'main',
  path: 'README.md',
  markdownSnapshot: '...',
  createdAt: '2026-05-25T00:00:00.000Z',
  updatedAt: '2026-05-25T00:00:00.000Z',
  lastOpenedAt: '2026-05-25T00:00:00.000Z'
}
```

### 7.4 docId 生成

推荐：

```javascript
function createDocId() {
  return `doc_${crypto.randomUUID()}`;
}
```

不要用 `rawUrl` 直接作为主键。

原因：

- 同一文档可能多次导入，形成不同快照。
- `rawUrl` 过长。
- 用户可能想保留多个版本。

---

## 8. 阅读界面行为

导入成功后跳转：

```text
/app/reader/:docId
```

阅读界面应展示：

- Markdown 阅读视图
- 文档标题
- Outline
- 来源链接

来源信息可以轻量展示：

```text
Source: GitHub · facebook/react · README.md
```

点击来源链接应在新标签页打开原 GitHub 页面。

不要在阅读页首次打开时弹出 Pro、登录或付费提示。

---

## 9. 错误处理

### 9.1 用户可见错误

`rawUrl` 不合法：

```text
This link is not supported yet.
Currently wowMD only imports public GitHub Markdown files.
```

fetch 失败：

```text
We couldn't open this Markdown file.
You can try again, or open the original GitHub page.
```

内容为空：

```text
This Markdown file seems to be empty.
```

### 9.2 不要显示技术报错

不要向用户显示：

```text
TypeError
Failed to fetch
CORS error
403
404
DOMException
stack trace
```

技术错误可以 `console.warn()`，但 UI 文案应保持用户友好。

---

## 10. 隐私与安全要求

v0.3 必须遵守：

- 不上传 Markdown 内容。
- 不把 Markdown 内容放进 URL。
- 不自动请求非 GitHub raw URL。
- 不在插件中存储 License 或账号信息。
- 不在 URL 中传递任何私密 token。
- 不使用 Web App 后端代理抓取用户提供的 URL。

禁止：

```text
/app/import?content=...
```

---

## 11. 版本与审核准备

v0.3 开发前后必须同步检查相关版本和发布文档，确保开发完成后可以顺利提交审核。

### 11.1 开发前确认

开发前应确认：

- 当前插件 manifest 版本号。
- 当前 Web App 版本标识，如果项目已有版本配置。
- v0.3 的功能范围只包含 GitHub Markdown `rawUrl` 导入衔接。
- 不把 Pro、高亮、附注、导出、Health Check、账号或支付写入 v0.3 发布说明。
- 审核需要的权限说明与实际权限一致。

### 11.2 开发完成后必须更新

开发完成后，根据项目现有文件结构更新相关文档和版本信息：

- 插件 manifest 版本号更新到 v0.3 对应版本。
- changelog / release notes 增加 v0.3 变更说明。
- README 或用户说明中补充 `Continue in Web App` 行为。
- 如有审核说明文档，补充本版本只传递 GitHub metadata，不上传 Markdown 内容。
- 如有隐私说明文档，确认“不上传 Markdown 内容、不传 License/token、不做后端代理 fetch”与实现一致。
- 如有测试清单，增加插件到 Web App 导入链路的验收项。

### 11.3 审核提交前检查

提交审核前至少确认：

- 插件权限没有因 v0.3 引入不必要的新增权限。
- `Continue in Web App` 按钮在 GitHub Markdown 阅读场景可见。
- 打开的 Web App URL 不包含 Markdown 全文、License、邮箱或 token。
- Web App 只允许 `https://raw.githubusercontent.com/...`。
- Web App 不通过后端代理抓取用户提供的 URL。
- 免费用户进入 Web App 后可直接阅读。
- 发布说明没有承诺本版本不包含的 Pro、导出、高亮、附注或 Health Check 功能。

---

## 12. 推荐目录结构

根据现有代码结构调整命名即可，不要求强制一致。

```text
webapp/
  src/
    routes/
      ImportPage.jsx
      ReaderPage.jsx
    services/
      importService.js
      localDb.js
    utils/
      importParams.js
      urlAllowlist.js
      markdownRender.js
      docId.js
    components/
      Reader/
      Outline/
      SourceBadge.jsx
```

---

## 13. Codex 执行顺序

1. 在插件中添加或确认 `Continue in Web App` 按钮。
2. 确保按钮始终显示。
3. 插件点击后打开 Web App `/app/import`。
4. URL 只传 `source/rawUrl/pageUrl` 和可选 metadata。
5. Web App 新增或复用 `/import` 逻辑页面，线上路径为 `/app/import`。
6. Web App 实现 `parseImportParams()`，归一化插件传来的参数。
7. 实现 `isAllowedRawUrl()`。
8. Web App 前端 fetch Markdown。
9. 创建本地文档副本。
10. 跳转 `/app/reader/:docId`。
11. Reader 页面读取本地副本并渲染。
12. 联调插件按钮到 Web App 阅读页的完整链路。
13. 确认免费用户不会被入口拦截。
14. 更新版本号、changelog、README、隐私说明或审核说明等相关文档。
15. 对照审核提交前检查项确认范围和权限没有偏离。

---

## 14. 验收标准

v0.3 完成时应满足：

- 插件里能看到 `Continue in Web App`。
- 点击后打开 Web App `/app/import`。
- URL 不包含完整 Markdown 内容。
- URL 不包含 License、账号、邮箱或 token。
- Web App 校验 `source`。
- Web App 校验 `rawUrl`。
- 非 `raw.githubusercontent.com` URL 被拒绝。
- Web App 不使用 `pageUrl` 发起内容 fetch。
- 缺失可选 metadata 时，Web App 仍能用合理标题完成导入。
- Web App 前端 fetch Markdown。
- Web App 创建本地文档副本。
- Web App 进入阅读界面。
- 阅读页展示文档标题、内容和来源链接。
- 阅读页从本地 `docId` 读取副本，不重新 fetch `rawUrl`。
- 刷新阅读页后仍可读取已导入的本地副本。
- 免费用户可直接阅读。
- 不显示入口付费墙。
- 插件不做 License 或 Pro 判断。
- Markdown 内容不上传到服务器。
- Web App 不通过后端代理抓取 `rawUrl`。
- 版本号和发布说明已更新。
- 审核说明与实际实现一致。

---

## 15. 不允许的实现

禁止：

- 插件直接做支付验证。
- 插件直接做 Pro 功能判断。
- 插件实现高亮、附注、导出或 Health Check。
- Web App import 时先弹付费墙。
- 把 Markdown 全文塞进 URL。
- Web App 后端代理 fetch `rawUrl`。
- 接受任意第三方 URL。
- 自动上传 Markdown 内容。
- 自动上传用户阅读数据。
- v0.3 接入 Lemon Squeezy 或其他真实支付 API。
- v0.3 引入账号系统。
- v0.3 引入云同步。

---

## 16. 给 Codex 的一句话任务

实现 wowMD v0.3 插件到 Web App 的 GitHub Markdown 导入工作流：插件只传 `rawUrl` 和 source metadata；Web App 校验 `rawUrl` 后由前端 fetch Markdown，创建浏览器本地文档副本，并直接进入阅读界面；免费用户不被入口拦截；本版本不开发 Pro、高亮、附注、导出、Health Check、账号、云同步或真实支付接入；开发完成后同步更新版本号、发布说明、隐私/审核说明和测试清单，确保可以顺利提交审核。
