# Gitee：用仓库 WebHook 触发部署

Gitee 的流水线（Gitee Go）是在网页上编排的，没有可以直接提交到仓库的配置文件，所以这里不需要 CI 文件 —— 用仓库自带的 WebHook 反而更简单。**这个做法在其他平台也通用**，如果你懒得配 CI，GitHub / GitLab / GitCode 都可以照这个来。

## 配置步骤

1. 在 Vercel 生成 Deploy Hook 地址（Vercel 项目 → Settings → Git → Deploy Hooks）。
2. 打开笔记仓库 → **管理 → WebHooks → 添加**。
3. 填写：
   - **URL**：Vercel 的 Deploy Hook 地址
   - **密码**：留空（Vercel 的 Deploy Hook 不校验这个）
   - **Hook 类型/触发事件**：勾选 **Push**（其余可不勾）
4. 保存后，用 Gitee 的「测试」按钮发一次请求，确认 Vercel 那边出现了新的部署。

## 用 Gitee 流水线的话

如果你的账号能用 Gitee 流水线（企业版），那就等效于在流水线里加一个执行 shell 的任务：

```bash
curl -fsS -X POST "$SKBLOG_DEPLOY_HOOK"
```

并把 `SKBLOG_DEPLOY_HOOK` 配成流水线的**私密变量**（流水线 → 变量），触发条件设为"指定分支的代码提交"。效果和 WebHook 完全一样，只是多了一层流水线。

## 注意

- Deploy Hook 地址就是凭据，别提交到仓库里。
- WebHook 触发的是"重新构建"，内容取的是构建那一刻笔记仓库的最新提交，所以不用管 webhook 的 payload。
