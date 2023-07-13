# e2e test

## 快速安装一个 Playwright

  pnpm dlx create-playwright

## 文件目录

```
e2e-auto
 ┣  node_modules
 ┣  tests
 ┃ ┗  example.spec.ts
 ┣  tests-examples
 ┃ ┗  demo-todo-app.spec.ts
 ┣  .gitignore
 ┣  package.json
 ┣  playwright.config.ts
 ┗  pnpm-lock.yaml
```

## 解决 playwright.config.ts 报错问题

  pnpm i -D @types/node
  创建tsconfig.json

```json
// tsconfig.json
{
  "compilerOptions": {
    "rootDir": ".",
    "baseUrl": ".",
    "outDir": "dist",
    "target": "es2018",
    "module": "esnext",
    "moduleResolution": "node",
    "sourceMap": false,
    "strict": true,
    "noUnusedLocals": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "removeComments": false,
    "isolatedModules": true,
    "types": ["node"]
  },
  "include": ["playwright.config.ts", "tests"],
}
```

## 安装浏览器

  npx playwright install

## 运行测试

  npx playwright test

## 

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // 测试目录
  testDir: './tests',
  // 是否并发运行测试
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  // 测试失败用例重试次数
  retries: process.env.CI ? 2 : 0,
  // 测试时使用的进程数，进程数越多可以同时执行的测试任务就越多。不设置则尽可能多地开启进程。
  workers: process.env.CI ? 1 : undefined,
  // 指定测试结果如何输出
  reporter: 'html',

  // 测试 project 的公共配置，会与与下面 projects 字段中的每个对象的 use 对象合并。
  use: {
    // 测试时各种请求的基础路径
    baseURL: 'http://127.0.0.1:3000',

    // 生成测试追踪信息的规则，on-first-retry 意为第一次重试时生成。
    trace: 'on-first-retry',
  },

  // 定义每个 project，示例中将不同的浏览器测试区分成了不同的项目
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
```

## 输出测试结果

```ts
// playwright.config.ts
export default defineConfig({
  // 指定测试产物(追踪信息、视频、截图)输出路径
  outputDir: 'test-results',
  //...
// reporter: 'html',
  reporter: [
    // 在命令行中同步打印每条用例的执行结果
    ['list'],
    // 输出 html 格式的报告，并将报告归档与指定路径
    ['html', {
      outputFolder: 'playwright-report',
    }],
  ],
  // ...
  use: {
    //...
    // 非 CI 环境下，第一次失败重试时生成追踪信息。非 CI 环境下，总是生成追踪信息
    trace: process.env.CI ? 'on-first-retry' : 'on',
    // 非 CI 环境下，第一次失败重试时生成视频。非 CI 环境下，总是生成视频
    video: process.env.CI ? 'on-first-retry' : 'on',
  },
});
```

## 区分环境

借鉴 Vite 的 环境变量 的解决方案，在测试工程目录中建立多个环境变量文件：

```
e2e-auto
 ┣ ...
 ┣  .env             # 所有情况下都会加载
 ┣  .env.dev         # 本地开发环境下加载
 ┣  .env.test        # 测试环境下加载
 ┣  .env.test.local  # 测试环境下加载，但是只在本地有效不会入仓，可以用于存放一些不该入仓的敏感配置。其他环境也可以有 .local 配置文件。
 ┗  .env.production  # 生产环境下加载
```

### 引入 cross-env 来设置环境变量

  pnpm i -D cross-env

  ```json
  {// ...
    "scripts": {
      "test:development": "cross-env TEST_MODE=development playwright test",
      "test:test": "cross-env TEST_MODE=test playwright test",
      "test:production": "cross-env TEST_MODE=production playwright test"
    }
  }
  ```

### 要使得测试执行时，环境变量能够切实地被读取

  pnpm i -D dotenv

  ```ts
    // playwright.config.ts
    import dotenv from 'dotenv';

    // TEST_MODE 的值决定了加载哪个环境的文件
    const modeExt = process.env.TEST_MODE || 'development';

    // 先加载入仓的配置文件，再加载本地的配置文件
    dotenv.config({ path: '.env' });
    dotenv.config({ path: `.env.${modeExt}`, override: true });
    dotenv.config({ path: '.env.local', override: true });
    dotenv.config({ path: `.env.${modeExt}.local`, override: true });

    export default defineConfig({ 
      // ... 
    });
  ```

我们可以验证一下效果，将 test 环境中的 url 设置为码云，将 production 环境中的 url 设置为 Github：

```
# .env.test
WEBSITE_URL = https://gitee.com/
# .env.production
WEBSITE_URL = https://github.com/
```

分别运行 pnpm run test:test --ui 和 pnpm run test:production --ui

TODO:

1. 测试登录鉴权问题 globalSetup storageState
   - 模拟登录操作
    ```
      # .env
      # 根据自己的情况修改
      TEST_USERNAME = username
      # .env.local
      # 根据自己情况修改
      # 明文密码不建议入库，因此最好写在 .local 的配置文件中
      TEST_PASSWORD = password
    ```

    - API 登录鉴权
