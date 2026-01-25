# Ollama 集成说明

本项目使用 Ollama 提供 AI 简历评分功能，基于 `deepseek-r1:7b` 模型进行 JD 与简历的智能匹配分析。

## 架构说明

### 服务组件

1. **Ollama 服务** (`ollama` 容器)
   - 运行 Ollama 服务器
   - 端口：11434
   - 模型：deepseek-r1:7b
   - 自动下载并加载模型

2. **Backend 服务** (`backend` 容器)
   - 调用 Ollama API 进行简历分析
   - 通过 Docker 网络访问 Ollama：`http://ollama:11434/v1`

3. **网络**
   - 所有服务在 `readysethire-network` 网络中
   - 服务间通过容器名称通信

## 环境变量

### `.env.dev` / `.env.production`

```bash
# Ollama 配置
OLLAMA_BASE_URL=http://ollama:11434/v1
OLLAMA_MODEL=deepseek-r1:7b
```

## API 端点

### 分析 JD 和简历匹配度

**POST** `/api/resume-rating/analyze`

**权限：** ADMIN 或 EMPLOYEE

**请求体：**
```json
{
  "jdText": "岗位描述文本...",
  "resumeText": "简历文本...",
  "settings": {
    "level": "Mid",
    "mustHaveWeight": 60,
    "language": "中文",
    "anonymize": true
  }
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "score": 78,
    "conclusion": "HIRE",
    "topStrengths": [
      {
        "point": "5年以上React开发经验",
        "evidence": "候选人在简历中明确提到..."
      }
    ],
    "topGaps": [
      {
        "gap": "缺少云原生技术经验",
        "severity": "high"
      }
    ],
    "risks": ["简历描述过于笼统"],
    "hardRequirements": [...],
    "skillsMatrix": [...],
    "interviewQuestions": [...]
  }
}
```

## 部署指南

### 1. 本地开发环境

```bash
# 启动所有服务
cd server
docker compose up -d

# 查看 Ollama 日志，确认模型已下载
docker logs ollama

# 测试 Ollama 是否正常
curl http://localhost:11434/api/tags
```

### 2. 生产环境

确保 `.env.production` 配置正确，然后：

```bash
# 启动服务
docker compose -f docker-compose.yml up -d

# 检查服务状态
docker compose ps

# 查看日志
docker compose logs -f backend ollama
```

## 故障排查

### 问题：无法连接到 Ollama 服务

**症状：**
```
Error: 无法连接到 Ollama 服务。请确保 Ollama 服务正在运行。
```

**解决方案：**
1. 检查 Ollama 容器是否运行：
   ```bash
   docker ps | grep ollama
   ```

2. 检查 Ollama 日志：
   ```bash
   docker logs ollama
   ```

3. 检查网络连接：
   ```bash
   docker exec backend ping ollama
   ```

### 问题：模型未下载

**症状：**
```
Error: model not found
```

**解决方案：**
1. 进入 Ollama 容器手动下载：
   ```bash
   docker exec -it ollama ollama pull deepseek-r1:7b
   ```

2. 检查已下载的模型：
   ```bash
   docker exec -it ollama ollama list
   ```

### 问题：分析超时

**症状：**
```
Error: Request timeout
```

**解决方案：**
1. deepseek-r1:7b 模型较大，首次推理可能需要较长时间
2. 确保服务器有足够的内存（建议至少 8GB）
3. 可以考虑使用更小的模型（如 `deepseek-r1:1.5b`）

## 性能优化

### 1. 使用更小的模型

修改 `.env` 文件：
```bash
OLLAMA_MODEL=deepseek-r1:1.5b
```

然后重新启动服务：
```bash
docker compose down
docker compose up -d
```

### 2. 调整 Docker 资源限制

在 `docker-compose.yml` 中添加资源限制：
```yaml
ollama:
  deploy:
    resources:
      limits:
        memory: 8G
      reservations:
        memory: 4G
```

### 3. 启用 GPU 加速

如果服务器有 GPU：
```yaml
ollama:
  image: ollama/ollama
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            count: 1
            capabilities: [gpu]
```

## 监控和日志

### 查看实时日志

```bash
# Backend 日志
docker logs -f backend

# Ollama 日志
docker logs -f ollama
```

### 日志关键信息

**成功的分析请求：**
```
🔍 Analyzing resume against JD...
📤 Sending request to Ollama...
✅ Received response from Ollama in 3500ms
✅ Analysis completed successfully
```

**失败的请求：**
```
❌ Failed to analyze resume: ...
```

## 更换模型

如果需要使用其他模型（如 OpenAI、Anthropic）：

1. 修改 `src/services/ollama.ts`
2. 更新环境变量
3. 调整 Prompt 格式
4. 重新构建和部署

## 最佳实践

1. **定期清理日志**
   ```bash
   docker compose logs --tail=100 ollama > ollama.log
   ```

2. **监控资源使用**
   ```bash
   docker stats ollama backend
   ```

3. **备份模型数据**
   ```bash
   docker cp ollama:/root/.ollama ./ollama-backup
   ```

4. **测试新模型**
   在生产环境使用前，先在开发环境测试新模型的效果

## 相关资源

- [Ollama 官方文档](https://github.com/ollama/ollama)
- [DeepSeek 模型](https://huggingface.co/deepseek-ai)
- [OpenAI SDK for Node.js](https://github.com/openai/openai-node)
