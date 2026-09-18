# 笔记仓库的 CI/CD 示例

这个目录里的文件是给**笔记仓库**（Obsidian vault 的 Git 仓库）用的，不是给本站点用的 —— 本站点不需要任何 CI 配置，Vercel 会在构建时自己拉取笔记仓库。

## 它解决什么问题

Vercel 只监听站点仓库，所以 push 笔记本身不会触发任何部署。补上这一环的链路是：

```
笔记仓库 push ─▶ 笔记仓库的 CI（本目录的配置）─▶ POST Vercel Deploy Hook
                                                      │
                                                      └─▶ Vercel 重新构建站点
                                                          （prebuild 重新拉取笔记仓库的最新提交）
```

## 前置：先在 Vercel 建一个 Deploy Hook

1. Vercel → 你的项目 → **Settings → Git → Deploy Hooks**
2. Name 随便填（例如 `notes`），Branch 选站点仓库的生产分支（通常是 `main`）
3. 生成后得到一个形如 `https://api.vercel.com/v1/integrations/deploy/prj_xxx/yyy` 的地址

这个地址等同于"可以触发部署"的凭据：**只放进笔记仓库的密钥/变量里，不要写进文件、不要提交**。

## 四个平台的对照

| 平台 | 文件放哪里（笔记仓库） | 需要配置的密钥 |
| --- | --- | --- |
| GitHub | `github/workflows/notify-blog.yml` → `.github/workflows/notify-blog.yml` | Actions secret `SKBLOG_DEPLOY_HOOK` |
| GitLab | `gitlab/.gitlab-ci.yml` → 根目录 `.gitlab-ci.yml` | CI/CD variable `SKBLOG_DEPLOY_HOOK`（勾 Masked） |
| GitCode | `gitcode/workflows/notify-blog.yml` → `.gitcode/workflows/notify-blog.yml` | 项目设置 → Action 秘钥与变量，新增 `SKBLOG_DEPLOY_HOOK` |
| Gitee | 不用 CI 文件，见 [gitee/README.md](./gitee/README.md) | WebHook 的密码（可选） |

示例都假设"推送默认分支就重新部署"。默认分支不是 `main` / `master` 时，改文件里的分支过滤（GitLab 那份用的是 `$CI_DEFAULT_BRANCH`，不用改）。

## 触发之后会发生什么

Vercel 这次部署会重新执行站点仓库的 `npm run build`，`prebuild` 钩子里的 `npm run notes:sync` 会重新浅克隆笔记仓库的最新提交 —— 所以站点内容就是刚 push 的那一版。**Deploy Hook 只是"让 Vercel 重新构建"，内容的新旧完全取决于构建时笔记仓库的远端状态**，这也是我们把同步放在构建期的原因。

## 平台注意

- **GitHub**：Actions 默认可用，私有仓库会消耗额度（这种一次 curl 的任务每月几秒钟，可以忽略）。
- **GitLab**：需要 Runner 可用（SaaS 新账号有时要先启用共享 Runner，或用自己的 Runner）。
- **GitCode**：代码化流水线（YAML）按官方文档需要在平台上开通「流水线」能力（文档里写的是联系客服申请）；没开通的话直接用仓库的 WebHook 也一样，见 [gitee/README.md](./gitee/README.md) 里的做法（任何平台都通用）。
- **Gitee**：官方文档里流水线是 UI 编排的，没有可直接提交的 YAML，所以走 WebHook。

## 排查

| 现象 | 先看这里 |
| --- | --- |
| CI 没跑 | 分支过滤是否匹配（默认分支名对不对）、CI 功能是否开启 |
| CI 跑了但 Vercel 没新部署 | `SKBLOG_DEPLOY_HOOK` 是否配错/含多余空格；curl 是否加了 `-f` 导致 4xx 静默失败 |
| Vercel 部署失败 | 部署日志里 `[notes]` 开头的行：拉取失败、目录不存在、slug 冲突都会在这里报出来 |
| 站点内容没更新 | 笔记是否 push 到了构建时读取的那个分支；frontmatter 是否写了 `publish: true` |
