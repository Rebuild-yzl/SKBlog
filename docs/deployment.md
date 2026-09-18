# 部署

站点是标准的 Next.js 应用，推荐部署到 [Vercel](https://vercel.com/new)（Next.js 官方平台，零配置）。仓库远端为 `git@github.com:Rebuild-yzl/SKBlog.git`。

## Vercel 配置

1. **环境变量**：加 `SKBLOG_NOTES_REPO`；笔记仓库是私有的再加 `SKBLOG_NOTES_TOKEN`（Fine-grained token，只给 **Contents: Read**），公开仓库不用配 token。
2. **构建命令保持默认**，不要改成直接跑 `next build`：Next.js 项目下 Vercel 会用 `package.json` 的 `build` 脚本，`prebuild` 才会执行、笔记才会被拉取。为了不依赖这个默认行为，`package.json` 里另有一条 `"vercel-build": "npm run build"` 兜底。拉取失败会直接让部署失败（而不是把空博客发上线），日志里以 `[notes]` 开头。
3. **push 笔记后自动重新部署**：Vercel 只监听站点仓库，这一步要在笔记仓库侧配置，见下节。

## 笔记仓库的 CI/CD

站点仓库本身**不需要任何 CI 配置**。要补齐"push 笔记 → 站点重新部署"，只有三步：

1. 在 Vercel 项目里建一个 Deploy Hook（**Settings → Git → Deploy Hooks**，分支选站点仓库的生产分支），得到一个 `https://api.vercel.com/v1/integrations/deploy/...` 地址。这个地址等同于部署凭据，只放在笔记仓库的密钥里。
2. 把 [cicd/](../cicd) 下对应平台的文件复制进笔记仓库，并配上名为 `SKBLOG_DEPLOY_HOOK` 的密钥：

   | 平台 | 复制到笔记仓库 | 密钥配在哪 |
   | --- | --- | --- |
   | GitHub | `cicd/github/workflows/notify-blog.yml` → `.github/workflows/notify-blog.yml` | Actions secrets |
   | GitLab | `cicd/gitlab/.gitlab-ci.yml` → 根目录 `.gitlab-ci.yml` | CI/CD variables（勾 Masked） |
   | GitCode | `cicd/gitcode/workflows/notify-blog.yml` → `.gitcode/workflows/notify-blog.yml` | 项目设置 → Action 秘钥与变量 |
   | Gitee | 不用 CI 文件，见 [cicd/gitee/README.md](../cicd/gitee/README.md)（用仓库 WebHook） | WebHook 密码（留空即可） |

3. 验证：改一篇笔记 push → 笔记仓库的 CI/WebHook 发出一条 POST → Vercel 出现新部署；构建日志里能看到 `[notes] 更新 … → .notes`。

> 触发逻辑与平台无关，就是一句 `curl -fsS -X POST "$SKBLOG_DEPLOY_HOOK"`，任何支持 WebHook 的 Git 平台都能接（Gitee 那份示例就是这么做的）。它只是"让 Vercel 重新构建"，**内容的新旧取决于构建那一刻笔记仓库的远端状态** —— 这正是把同步放在构建期的意义。
## 部署前自检

本地先跑 `npm run build` 和 `npm run lint` 确认无报错。部署后如果 `/blogs` 是空的，按这个顺序查：

1. 构建日志里有没有 `[notes]` 开头的行 —— 没有就说明同步脚本没被触发（构建命令被人改成直接跑 `next build` 了）
2. 有 `[notes]` 但提示"未配置笔记仓库" —— 环境变量没配或没生效
3. 拉取成功但没有文章 —— 笔记的 frontmatter 是否写了 `publish: true`，见[博客内容](./notes-sync.md)
