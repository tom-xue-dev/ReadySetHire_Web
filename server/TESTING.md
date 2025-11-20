# 测试指南

本项目包含完整的测试套件，支持单元测试和集成测试，并具有自动化的 Docker 容器管理。

## 测试架构

### 单元测试
- **位置**: `src/__tests__/unit/`
- **特点**: 快速、隔离、Mock 所有外部依赖
- **数据库**: 使用 `jest-mock-extended` Mock Prisma Client
- **执行时间**: 毫秒级

### 集成测试
- **位置**: `src/__tests__/integration/`
- **特点**: 端到端测试、真实数据库连接
- **数据库**: 使用真实的 PostgreSQL 测试数据库
- **执行时间**: 秒级

## 🚀 快速开始

### 运行单元测试
```bash
npm run test:unit
```

### 运行集成测试（自动管理容器）
```bash
npm run test:integration:auto
```

### 运行集成测试（测试后关闭容器）
```bash
npm run test:integration:clean
```

### 运行所有测试
```bash
npm test
```

## 🐳 Docker 自动管理

集成测试现在具有智能的 Docker 容器管理功能：

### 自动启动容器
- 检测是否已有 PostgreSQL 容器运行
- 如果没有，自动启动 `docker-compose up -d postgres`
- 等待数据库准备就绪（健康检查）
- 自动创建测试数据库

### 自动清理
- 测试完成后自动清理测试数据
- 删除测试数据库
- 可选择性关闭 Docker 容器

## 📋 可用命令

```bash
# 单元测试
npm run test:unit                    # 运行单元测试
npm run test:watch:unit             # 监视模式单元测试

# 集成测试
npm run test:integration            # 基础集成测试
npm run test:integration:auto       # 自动管理容器（保持运行）
npm run test:integration:clean      # 自动管理容器（测试后关闭）
npm run test:watch:integration      # 监视模式集成测试

# 所有测试
npm test                            # 运行所有测试
npm run test:ci                     # CI 模式（无监视，生成覆盖率）

# 覆盖率测试
npm run test:coverage               # 所有测试覆盖率
npm run test:coverage:unit          # 单元测试覆盖率
npm run test:coverage:integration   # 集成测试覆盖率
```

## 🔧 环境配置

### 环境变量
测试会自动设置以下环境变量：
- `NODE_ENV=test`
- `DATABASE_URL` - 主数据库连接
- `TEST_DATABASE_URL` - 测试数据库连接

### Docker 容器控制
- `STOP_DOCKER_AFTER_TESTS=false` - 保持容器运行（默认）
- `STOP_DOCKER_AFTER_TESTS=true` - 测试后关闭容器

## 📊 测试结果示例

```
Test Suites: 5 passed, 5 total
Tests:       34 passed, 34 total
Time:        6.176 s

✅ 单元测试 (15个) - Mock 数据库
✅ 集成测试 (7个) - 真实数据库  
✅ 数据库连接测试 (12个) - 基础功能
```

## 🛠️ 故障排除

### 常见问题

1. **端口 5432 被占用**
   ```bash
   # 检查占用端口的进程
   netstat -an | findstr :5432
   
   # 停止旧容器
   docker stop postgres
   ```

2. **Prisma 客户端错误**
   ```bash
   # 重新生成客户端
   npx prisma generate
   ```

3. **数据库连接失败**
   ```bash
   # 检查容器状态
   docker-compose ps
   
   # 重启容器
   docker-compose restart postgres
   ```

### 手动容器管理

如果需要手动管理容器：

```bash
# 启动数据库
docker-compose up -d postgres

# 停止数据库
docker-compose stop postgres

# 完全清理
docker-compose down -v
```

## 🔄 CI/CD 集成

在 CI/CD 环境中，建议使用：

```bash
# GitHub Actions 或其他 CI 环境
npm run test:integration:clean
```

这将确保容器在测试完成后被正确清理。

## 📁 测试文件结构

```
src/__tests__/
├── unit/                          # 单元测试
│   ├── user.service.direct.test.ts
│   ├── interview.service.test.ts
│   └── interview.service.direct.test.ts
├── integration/                   # 集成测试
│   └── database.integration.test.ts
├── database-connection.test.ts    # 数据库连接测试
├── globalSetup.ts                # 全局测试设置
├── globalTeardown.ts             # 全局测试清理
└── setup.ts                      # 测试工具函数
```

## 🎯 最佳实践

1. **开发时**: 使用 `npm run test:unit` 快速反馈
2. **提交前**: 使用 `npm run test:integration:auto` 完整测试
3. **CI/CD**: 使用 `npm run test:integration:clean` 确保清理
4. **调试**: 使用监视模式 `npm run test:watch:unit`

---

现在你可以享受完全自动化的测试体验！🚀