# ReadysetHire 项目面试问题答案

> 本文档提供面试问题的参考答案，帮助你准备面试。建议根据个人理解进行调整，不要死记硬背。

---

## 第一部分：项目概述与架构

### 1. 请用 2-3 分钟介绍一下这个项目的核心功能和技术栈？

**参考答案：**

> ReadysetHire 是一个**AI 驱动的招聘管理系统**，主要面向 HR/招聘人员和求职者两类用户。
>
> **核心功能：**
> - **职位管理**：HR 可以创建、发布、管理职位
> - **简历智能分析**：使用 AI (Ollama + DeepSeek) 对简历和 JD 进行匹配度分析，输出评分、技能矩阵、面试建议
> - **申请追踪**：支持 9 种申请状态流转（SUBMITTED → HIRED/REJECTED）
> - **多角色权限**：ADMIN、RECRUITER、EMPLOYEE 三种角色
> - **订阅系统**：集成 Stripe 支付
>
> **技术栈：**
> - **前端**：React 19 + TypeScript + Vite + Tailwind CSS
> - **后端**：Node.js + Express + TypeScript
> - **数据库**：PostgreSQL + Prisma ORM
> - **AI 服务**：OpenAI GPT-4o-mini（面试问题生成）、Ollama DeepSeek R1（简历分析）、Whisper（语音转文字）
> - **部署**：Docker + Docker Compose + GitHub Actions CI/CD

---

### 2. 这个项目解决了什么问题？目标用户是谁？

**参考答案：**

> **解决的问题：**
> 1. **招聘效率低**：传统人工筛选简历耗时耗力，我们用 AI 自动分析简历与 JD 的匹配度
> 2. **评估标准不一致**：AI 提供客观的评分和技能矩阵，减少主观偏差
> 3. **申请状态追踪困难**：提供完整的申请状态流转和追踪功能
>
> **目标用户：**
> - **HR/招聘人员（RECRUITER）**：发布职位、筛选简历、管理候选人
> - **求职者（EMPLOYEE）**：浏览职位、投递简历、追踪申请状态
> - **管理员（ADMIN）**：系统管理

---

### 3. 为什么选择这个技术栈？有考虑过其他方案吗？

**参考答案：**

| 技术选择 | 原因 | 替代方案 |
|---------|------|---------|
| **React 19** | 最新版本，支持 React Compiler 自动优化 | Vue 3, Svelte |
| **TypeScript** | 类型安全，减少运行时错误，提升开发体验 | JavaScript |
| **Express** | 轻量、灵活、生态丰富 | NestJS, Fastify, Koa |
| **PostgreSQL** | 成熟稳定、支持复杂查询、ACID 事务 | MySQL, MongoDB |
| **Prisma ORM** | 类型安全、自动生成 Client、Migration 工具强大 | TypeORM, Sequelize, Drizzle |
| **Ollama** | 本地部署、无 API 费用、数据隐私 | 纯 OpenAI（成本高） |

> **权衡思考**：选择 Express 而非 NestJS 是因为项目规模中等，Express 更轻量；选择 Ollama 而非纯 OpenAI 是为了降低 API 成本，同时保护用户简历数据隐私。

---

### 4. 请画一下系统的整体架构图？

**参考答案（文字描述）：**

```
┌──────────────────────────────────────────────────────────────────┐
│                         客户端 (Client)                          │
│  React 19 + TypeScript + Tailwind CSS + Vite                    │
│  - 组件: AuthContext, ProtectedRoute, JobForm, etc.             │
│  - 状态管理: Context API                                         │
│  - API 调用: fetch + Bearer Token                                │
└────────────────────────────┬─────────────────────────────────────┘
                             │ HTTPS / REST API
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                      后端 API (Backend)                          │
│  Node.js + Express + TypeScript                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Auth 中间件  │  │   Routes    │  │ Controllers │              │
│  │ (JWT验证)    │  │   (v2)      │  │             │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Services Layer                        │    │
│  │  UserService | JobService | ResumeService | LLMService  │    │
│  └─────────────────────────────────────────────────────────┘    │
└──────────┬─────────────────────────────────┬────────────────────┘
           │                                 │
           ▼                                 ▼
┌──────────────────────┐          ┌────────────────────────┐
│   PostgreSQL 15      │          │    AI Services         │
│   (Prisma ORM)       │          │  - OpenAI (问题生成)    │
│                      │          │  - Ollama (简历分析)    │
│   Tables:            │          │  - Whisper (语音转文字) │
│   - users            │          └────────────────────────┘
│   - jobs             │
│   - job_applications │
│   - resumes          │
│   - candidates       │
└──────────────────────┘
```

---

### 5. 前后端是如何通信的？API 设计遵循什么规范？

**参考答案：**

> **通信方式：**
> - 使用 **RESTful API** 通过 HTTP/HTTPS 通信
> - 请求格式：JSON
> - 认证方式：JWT Bearer Token 在 `Authorization` 头中传递
>
> **RESTful 规范：**
> - 使用正确的 HTTP 方法：GET（查询）、POST（创建）、PATCH（更新）、DELETE（删除）
> - 资源使用复数名词：`/jobs`、`/applications`、`/candidates`
> - 使用正确的状态码：200（成功）、201（创建成功）、400（参数错误）、401（未认证）、403（无权限）、404（未找到）
> - 嵌套资源：`/employees/:id/saved-jobs`
>
> **示例：**
> ```
> GET    /api/v2/jobs              # 获取职位列表
> POST   /api/v2/jobs              # 创建职位
> GET    /api/v2/jobs/:id          # 获取单个职位
> PATCH  /api/v2/jobs/:id          # 更新职位
> DELETE /api/v2/jobs/:id          # 删除职位
> ```

---

### 6. 如果用户量增长 10 倍，系统会有什么瓶颈？你会如何优化？

**参考答案：**

| 潜在瓶颈 | 优化方案 |
|---------|---------|
| **数据库查询变慢** | 添加索引（已有 `jobId+status`、`email` 等索引）、读写分离、分库分表 |
| **API 响应慢** | 添加 Redis 缓存热点数据（如职位列表）、CDN 缓存静态资源 |
| **AI 分析处理慢** | 使用消息队列（Bull/BullMQ）异步处理、增加 Ollama 实例做负载均衡 |
| **单点故障** | 后端服务做水平扩展（Kubernetes）、数据库主从复制 |
| **文件上传** | 使用 S3/OSS 存储简历文件，不存本地 |

---

## 第二部分：前端技术（React/TypeScript）

### 7. 为什么选择 React 19？React 19 有什么新特性？

**参考答案：**

> **React 19 新特性：**
> 1. **React Compiler（自动优化）**：自动进行 memoization，减少手动 `useMemo`/`useCallback`
> 2. **Actions**：简化表单提交和异步操作
> 3. **use() Hook**：在组件中直接读取 Promise 和 Context
> 4. **文档元数据支持**：直接在组件中管理 `<title>`、`<meta>` 等
>
> **项目中的使用：**
> ```json
> // package.json
> "babel-plugin-react-compiler": "^1.0.0"
> ```
> 项目启用了 React Compiler，自动优化组件渲染。

---

### 8. 项目中的状态管理是怎么做的？为什么用 Context API 而不是 Redux/Zustand？

**参考答案：**

> **状态管理方案：**
> - 使用 **React Context API** 管理全局状态
> - 主要 Context：`AuthContext`（用户认证）、`I18nContext`（国际化）
>
> **为什么不用 Redux/Zustand：**
> 1. **项目规模**：中小型项目，全局状态不复杂
> 2. **状态类型**：主要是用户信息和语言设置，不涉及复杂的状态变更
> 3. **减少依赖**：Context API 是 React 内置功能，无需额外依赖
>
> **什么时候应该用 Redux/Zustand：**
> - 状态频繁更新且需要细粒度订阅
> - 需要 DevTools 调试
> - 状态逻辑复杂，需要中间件（如异步处理、日志）

---

### 9. `AuthContext` 是如何实现的？Token 是如何管理的？

**参考答案：**

> **实现要点：**

```typescript
// AuthContext.tsx 核心实现
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. 初始化时从 localStorage 恢复登录状态
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // 2. 监听 401 认证失败事件
  useEffect(() => {
    const handleAuthFailure = () => {
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    };
    window.addEventListener('auth-failed', handleAuthFailure);
    return () => window.removeEventListener('auth-failed', handleAuthFailure);
  }, []);

  // 3. 登录：保存到 state 和 localStorage
  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };
}
```

> **Token 管理流程：**
> 1. 登录成功 → 保存 Token 到 `localStorage` 和 Context state
> 2. API 请求 → 从 `localStorage` 读取 Token，放入 `Authorization: Bearer <token>` 头
> 3. Token 过期/无效 → API 返回 401 → 触发 `auth-failed` 事件 → 清除 Token → 跳转登录页

---

### 10. 什么是 React Hooks？项目中用了哪些自定义 Hooks？

**参考答案：**

> **React Hooks 是什么：**
> Hooks 是 React 16.8 引入的特性，让函数组件可以使用 state 和生命周期等特性。
>
> **项目中使用的内置 Hooks：**
> - `useState`：管理组件状态
> - `useEffect`：处理副作用（API 调用、事件监听）
> - `useContext`：读取 Context
> - `useCallback`：缓存函数
>
> **项目中的自定义 Hooks：**

| Hook | 文件 | 用途 |
|------|------|------|
| `useAuth` | `AuthContext.tsx` | 获取认证状态和方法 |
| `useCandidates` | `useCandidates.ts` | 管理候选人数据 |
| `useConnection` | `useConnection.ts` | 监控 API 连接状态 |

```typescript
// 使用示例
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

---

### 11. React 中有哪些常见的性能问题？你在项目中是如何处理的？

**参考答案：**

| 性能问题 | 原因 | 解决方案 |
|---------|------|---------|
| **不必要的重渲染** | 父组件更新导致子组件重渲染 | 使用 `React.memo`、React 19 Compiler 自动优化 |
| **大列表渲染慢** | 一次渲染大量 DOM 节点 | 虚拟列表（react-window）、分页 |
| **频繁创建函数/对象** | 每次渲染都创建新引用 | `useCallback`、`useMemo` |
| **Context 更新影响范围大** | Context 变化导致所有消费者重渲染 | 拆分 Context、使用 selector |

> **项目中的实践：**
> - 启用 React 19 Compiler 自动优化
> - 职位列表使用分页，避免一次加载大量数据
> - `AuthContext` 只包含必要的认证信息

---

### 12. 什么时候应该使用 `useMemo` 和 `useCallback`？

**参考答案：**

> **`useMemo`**：缓存计算结果
> ```typescript
> // 当计算代价高时使用
> const expensiveValue = useMemo(() => {
>   return items.filter(item => item.status === 'active')
>               .sort((a, b) => a.score - b.score);
> }, [items]);
> ```
>
> **`useCallback`**：缓存函数引用
> ```typescript
> // 当函数作为 props 传递给 memo 组件时使用
> const handleClick = useCallback(() => {
>   setCount(c => c + 1);
> }, []);
> ```
>
> **注意**：React 19 的 Compiler 会自动处理大部分情况，减少手动优化的需要。

---

### 13. 如何避免不必要的重渲染？

**参考答案：**

> 1. **使用 `React.memo`** 包裹子组件
> 2. **稳定的 props 引用**：用 `useCallback`/`useMemo` 保持引用不变
> 3. **状态下沉**：将状态放到真正需要它的组件中
> 4. **拆分组件**：把频繁变化的部分独立出来
> 5. **Context 优化**：拆分 Context，避免无关数据变化触发更新

---

### 14. `ProtectedRoute` 组件是如何工作的？如何实现角色权限控制？

**参考答案：**

```typescript
// ProtectedRoute.tsx 核心逻辑
export default function ProtectedRoute({ children, requiredRole, requiredRoles }: Props) {
  const { user, isAuthenticated, isLoading } = useAuth();

  // 1. 加载中显示 Loading
  if (isLoading) return <Loading />;

  // 2. 未登录跳转到登录页
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. 单角色检查
  if (requiredRole && user?.role !== requiredRole) {
    return <AccessDenied />;
  }

  // 4. 多角色检查（满足其一即可）
  if (requiredRoles && !requiredRoles.includes(user?.role || '')) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}
```

> **使用示例：**
> ```tsx
> <Route path="/dashboard" element={
>   <ProtectedRoute requiredRoles={['ADMIN', 'RECRUITER']}>
>     <Dashboard />
>   </ProtectedRoute>
> } />
> ```

---

### 15. 用户登录后，页面刷新时如何保持登录状态？

**参考答案：**

> **持久化机制：**
> 1. 登录时，Token 和用户信息同时保存到 `localStorage`
> 2. 页面刷新时，`AuthContext` 的 `useEffect` 从 `localStorage` 读取并恢复状态
> 3. Token 放在内存 (state) 和持久存储 (localStorage) 两处，确保刷新后可恢复
>
> **代码实现：**
> ```typescript
> useEffect(() => {
>   const storedToken = localStorage.getItem('token');
>   const storedUser = localStorage.getItem('user');
>   if (storedToken && storedUser) {
>     setToken(storedToken);
>     setUser(JSON.parse(storedUser));
>   }
>   setIsLoading(false);
> }, []);
> ```

---

### 16. TypeScript 相比 JavaScript 有什么优势？

**参考答案：**

| 优势 | 说明 |
|-----|------|
| **类型安全** | 编译时发现错误，减少运行时 bug |
| **更好的 IDE 支持** | 自动补全、重构、跳转定义 |
| **代码可读性** | 类型就是文档，接口定义清晰 |
| **大型项目维护** | 重构更安全，新人更容易理解代码 |
| **API 契约** | 前后端类型共享，减少沟通成本 |

---

### 17. 项目中的类型定义是如何组织的？

**参考答案：**

> **组织方式：**
> ```
> client/src/types/
> └── index.ts          # 集中定义所有类型
>
> client/src/api/
> └── api.ts            # API 相关类型定义在文件内
> ```
>
> **示例：**
> ```typescript
> // types/index.ts
> export interface User {
>   id: number;
>   username: string;
>   email: string;
>   role: 'ADMIN' | 'RECRUITER' | 'EMPLOYEE';
> }
>
> // api/api.ts
> export interface AnalysisResult {
>   score: number;
>   conclusion: 'STRONG_HIRE' | 'HIRE' | 'LEAN_HIRE' | 'LEAN_NO' | 'NO';
>   // ...
> }
> ```

---

## 第三部分：后端技术（Node.js/Express）

### 18. RESTful API 的设计原则是什么？你的 API 遵循了哪些原则？

**参考答案：**

> **RESTful 设计原则：**
> 1. **资源导向**：URL 表示资源，不是动作（用 `/jobs` 而非 `/getJobs`）
> 2. **使用 HTTP 方法**：GET/POST/PUT/PATCH/DELETE 表示操作
> 3. **无状态**：每个请求包含所有必要信息（Token 在 Header 中）
> 4. **统一接口**：一致的 URL 结构和响应格式
> 5. **合理的状态码**：200, 201, 400, 401, 403, 404, 500
>
> **项目遵循的原则：**
> - 资源使用复数名词：`/jobs`, `/applications`, `/candidates`
> - 嵌套资源：`/employees/:id/saved-jobs`
> - 统一响应格式：`{ data: [...], pagination: {...} }`
> - 正确使用状态码

---

### 19. HTTP 状态码 200, 201, 400, 401, 403, 404, 500 分别代表什么？

**参考答案：**

| 状态码 | 含义 | 项目中的使用场景 |
|-------|------|----------------|
| **200** | OK，请求成功 | GET 查询成功、PATCH 更新成功 |
| **201** | Created，创建成功 | POST 创建职位、注册用户 |
| **400** | Bad Request，参数错误 | 必填字段缺失、格式错误 |
| **401** | Unauthorized，未认证 | Token 缺失或无效 |
| **403** | Forbidden，无权限 | 角色权限不足 |
| **404** | Not Found，资源不存在 | 职位/用户不存在 |
| **500** | Internal Server Error | 服务器内部错误 |

---

### 20. 如何处理 API 的错误响应？项目中有统一的错误处理机制吗？

**参考答案：**

> **统一错误响应格式：**
> ```json
> {
>   "error": "错误描述信息"
> }
> ```
>
> **错误处理实践：**
> ```typescript
> // 控制器中的错误处理
> try {
>   // 业务逻辑
> } catch (error) {
>   console.error('Error:', error);
>   res.status(500).json({ error: 'Operation failed' });
> }
> ```
>
> **认证中间件的错误分类：**
> ```typescript
> if (error instanceof jwt.TokenExpiredError) {
>   res.status(401).json({ error: 'Token expired' });
> } else if (error instanceof jwt.JsonWebTokenError) {
>   res.status(401).json({ error: 'Invalid token' });
> }
> ```

---

### 21. JWT 是什么？它的工作原理是什么？

**参考答案：**

> **JWT (JSON Web Token) 是什么：**
> 一种自包含的 Token 格式，用于安全地在客户端和服务器之间传递信息。
>
> **JWT 组成（三部分用 `.` 分隔）：**
> 1. **Header**：算法和类型 `{"alg": "HS256", "typ": "JWT"}`
> 2. **Payload**：用户数据 `{"id": 1, "role": "RECRUITER", "exp": 1234567890}`
> 3. **Signature**：签名 `HMACSHA256(base64(header) + "." + base64(payload), secret)`
>
> **工作流程：**
> 1. 用户登录 → 服务器生成 JWT 返回
> 2. 客户端保存 JWT（localStorage）
> 3. 后续请求携带 `Authorization: Bearer <token>`
> 4. 服务器验证签名 → 提取用户信息

```typescript
// 项目中的实现
static generateToken(payload: any): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

static verifyToken(token: string): any {
  return jwt.verify(token, JWT_SECRET);
}
```

---

### 22. JWT 和 Session 认证的区别是什么？各有什么优缺点？

**参考答案：**

| 对比项 | JWT | Session |
|-------|-----|---------|
| **存储位置** | 客户端（localStorage/Cookie） | 服务器（内存/Redis） |
| **扩展性** | 天然支持分布式 | 需要共享 Session 存储 |
| **安全性** | Token 泄露风险 | Session ID 泄露风险 |
| **服务器负载** | 无状态，服务器不存储 | 需要存储和查询 |
| **可撤销性** | 难以主动撤销 | 可随时删除 Session |
| **大小** | Payload 大时 Token 大 | ID 固定小 |

> **项目选择 JWT 的原因：**
> - 无状态，便于水平扩展
> - 前后端分离架构友好
> - 减少服务器存储负担

---

### 23. Token 过期后如何处理？有实现 Refresh Token 机制吗？

**参考答案：**

> **当前项目的处理方式：**
> - Token 有效期 24 小时（`JWT_EXPIRES_IN: '24h'`）
> - Token 过期后返回 401，前端监听 `auth-failed` 事件
> - 清除本地 Token，重定向到登录页
>
> **Refresh Token 机制（项目未实现，但可以这样做）：**
> 1. 登录时返回 Access Token（短期）+ Refresh Token（长期）
> 2. Access Token 过期时，用 Refresh Token 换取新的 Access Token
> 3. Refresh Token 过期才需要重新登录
>
> **改进建议：**
> - 实现 Refresh Token 提升用户体验
> - 或使用 Silent Refresh（在 Token 即将过期时自动刷新）

---

### 24. 密码是如何存储的？为什么使用 bcrypt？

**参考答案：**

> **密码存储方式：**
> - 使用 **bcryptjs** 进行哈希加密
> - 不存储明文密码，只存储哈希值
> - Salt rounds = 12（在 UserService 中设置）
>
> **为什么用 bcrypt：**
> 1. **自动加盐**：每次生成不同的 Salt，相同密码哈希值不同
> 2. **慢哈希**：故意设计得慢，增加暴力破解成本
> 3. **可调节强度**：Salt rounds 越高越安全（但也越慢）
>
> **代码示例：**
> ```typescript
> // 注册时加密
> const hashedPassword = await bcrypt.hash(password, 12);
>
> // 登录时验证
> const isValid = await bcrypt.compare(inputPassword, storedHash);
> ```

---

### 25. 项目中的角色权限是如何实现的？RBAC 是什么？

**参考答案：**

> **RBAC (Role-Based Access Control) 基于角色的访问控制：**
> - 用户 → 角色 → 权限
> - 通过角色来管理权限，而非直接给用户分配权限
>
> **项目中的实现：**
> - 3 种角色：`ADMIN`、`RECRUITER`、`EMPLOYEE`
> - 用户注册时分配角色
> - 使用 `requireRole` 中间件检查权限

```typescript
// 中间件实现
export const requireRole = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
};

// 使用示例
router.delete('/jobs/:id', authenticateToken, requireRole(['ADMIN', 'RECRUITER']), deleteJob);
```

---

### 26. Express 中间件是什么？执行顺序是怎样的？

**参考答案：**

> **中间件定义：**
> 中间件是在请求和响应之间执行的函数，可以访问 `req`、`res` 和 `next`。
>
> **执行顺序：**
> 按照注册顺序依次执行，调用 `next()` 传递给下一个中间件。
>
> **项目中的中间件链：**
> ```
> 请求 → CORS → JSON Parser → Logger → authenticateToken → requireRole → 控制器 → 响应
> ```
>
> **示例：**
> ```typescript
> app.use(cors());                    // 1. CORS
> app.use(express.json());            // 2. 解析 JSON
> app.use('/api', authenticateToken); // 3. 认证
> app.use('/api', routes);            // 4. 路由
> ```

---

### 27. `authenticateToken` 中间件做了什么？

**参考答案：**

```typescript
export const authenticateToken = async (req, res, next) => {
  // 1. 从 Header 提取 Token
  const token = JWTUtils.extractTokenFromHeader(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // 2. 验证 Token 签名和有效期
  const decoded = JWTUtils.verifyToken(token);

  // 3. 验证用户是否存在
  const user = await userService.findUnique({ id: decoded.id });
  if (!user) {
    return res.status(401).json({ error: 'Invalid token - user not found' });
  }

  // 4. 附加用户信息到 req 对象
  req.user = user;
  next();
};
```

> **关键点：**
> - 不仅验证 Token，还确认用户在数据库中存在
> - 将用户信息附加到 `req.user`，后续中间件/控制器可以使用

---

## 第四部分：数据库（PostgreSQL/Prisma）

### 28. 请解释一下项目的数据库 Schema 设计？有哪些核心表？

**参考答案：**

> **核心表及关系：**

```
┌──────────┐       ┌──────────┐       ┌──────────────────┐
│  User    │ 1───N │   Job    │ 1───N │  JobApplication  │
│----------│       │----------│       │------------------|
│ id       │       │ id       │       │ id               │
│ role     │       │ title    │       │ status           │
│ companyId│       │ userId   │       │ jobId            │
└──────────┘       └──────────┘       │ candidateId      │
     │                                │ resumeId         │
     │                                └──────────────────┘
     │                                        │
     │  ┌───────────┐                         │
     └──│ Candidate │─────────────────────────┘
        │-----------│
        │ id        │
        │ userId    │
        │ email     │
        └───────────┘
```

| 表名 | 用途 |
|-----|------|
| **User** | 用户（ADMIN/RECRUITER/EMPLOYEE） |
| **Job** | 职位（DRAFT/PUBLISHED/CLOSED） |
| **JobApplication** | 求职申请（9 种状态） |
| **Candidate** | 候选人（属于某个 Recruiter） |
| **Resume** | 简历（PDF 文件信息和解析内容） |
| **Company** | 公司（多租户） |
| **SavedJob** | 收藏的职位 |

---

### 29. `JobApplication` 和 `Candidate` 为什么是两个独立的表？

**参考答案：**

> **分离的原因：**
> 1. **一对多关系**：一个候选人可以投递多个职位
> 2. **数据复用**：候选人信息不用重复存储
> 3. **便于管理**：HR 可以独立管理候选人池
>
> **关系：**
> - `Candidate` 存储候选人基本信息（姓名、邮箱、电话）
> - `JobApplication` 存储每次申请的具体信息（状态、简历、投递时间）
>
> ```prisma
> model JobApplication {
>   candidateId Int
>   candidate   Candidate @relation(fields: [candidateId], references: [id])
> }
> ```

---

### 30. 外键约束有什么作用？`onDelete: Cascade` 和 `onDelete: SetNull` 的区别？

**参考答案：**

> **外键约束的作用：**
> - 保证数据完整性（引用完整性）
> - 防止出现孤儿记录
>
> **删除行为对比：**

| 行为 | 说明 | 项目中的使用 |
|-----|------|-------------|
| `Cascade` | 级联删除，父记录删除时子记录一起删除 | 删除用户时，其创建的职位也删除 |
| `SetNull` | 设为 NULL，父记录删除时外键设为 NULL | 删除公司时，用户的 companyId 设为 NULL |
| `Restrict` | 禁止删除，有子记录时不允许删除父记录 | - |

```prisma
// 项目示例
model Job {
  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  company Company? @relation(fields: [companyId], references: [id], onDelete: SetNull)
}
```

---

### 31. 项目中添加了哪些数据库索引？为什么？

**参考答案：**

```prisma
model JobApplication {
  @@index([jobId, status])    // 查询某职位的特定状态申请
  @@index([email])            // 按邮箱查询申请
  @@index([trackingToken])    // 按追踪码快速定位
  @@index([candidateId])      // 查询候选人的所有申请
}

model SavedJob {
  @@index([userId])           // 查询用户收藏的职位
  @@index([jobId])            // 查询收藏了某职位的用户
}
```

> **索引设计原则：**
> - 为高频查询的字段建索引
> - 为 WHERE 和 JOIN 条件建索引
> - 复合索引顺序：等值查询字段在前，范围查询在后

---

### 32. 什么是 N+1 查询问题？如何避免？

**参考答案：**

> **N+1 问题示例：**
> ```typescript
> // 错误：查询 N 个职位后，再发 N 次查询获取每个职位的申请
> const jobs = await prisma.job.findMany();
> for (const job of jobs) {
>   job.applications = await prisma.jobApplication.findMany({ where: { jobId: job.id } });
> }
> // 总查询：1 + N 次
> ```
>
> **解决方案 - 使用 Prisma include（Eager Loading）：**
> ```typescript
> // 正确：1 次查询搞定
> const jobs = await prisma.job.findMany({
>   include: {
>     applications: true
>   }
> });
> // 总查询：1 次（或 2 次，取决于 ORM 实现）
> ```

---

### 33. 如果 `job_applications` 表有 100 万条数据，查询会变慢吗？如何优化？

**参考答案：**

> **优化策略：**
>
> 1. **索引优化**：确保查询条件字段有索引
> 2. **分页查询**：避免一次加载全部数据
>    ```typescript
>    prisma.jobApplication.findMany({
>      skip: 0,
>      take: 20,
>      orderBy: { createdAt: 'desc' }
>    });
>    ```
> 3. **只查需要的字段**：使用 `select` 减少数据传输
> 4. **缓存热点数据**：Redis 缓存统计数据
> 5. **读写分离**：主库写入，从库查询
> 6. **分表**：按时间或租户分表

---

### 34. 为什么选择 Prisma？相比其他 ORM 有什么优势？

**参考答案：**

| 特性 | Prisma | TypeORM | Sequelize |
|-----|--------|---------|-----------|
| **类型安全** | 自动生成类型 | 需要手动定义 | 弱 |
| **Migration** | 声明式，自动生成 | 需要手写 | 需要手写 |
| **学习曲线** | 低 | 中 | 中 |
| **性能** | 优秀（Rust 引擎） | 良好 | 良好 |
| **Studio** | 自带可视化工具 | 无 | 无 |

> **选择 Prisma 的原因：**
> - TypeScript 开发体验最好
> - Schema 即文档
> - Migration 工具强大
> - Prisma Studio 方便调试

---

### 35. Prisma 的 Migration 是如何工作的？

**参考答案：**

> **Migration 流程：**
>
> 1. **修改 Schema**：编辑 `schema.prisma`
> 2. **生成 Migration**：
>    ```bash
>    npx prisma migrate dev --name add_user_table
>    ```
> 3. **应用到数据库**：自动执行 SQL
> 4. **生成 Client**：更新 Prisma Client 类型
>
> **Migration 文件结构：**
> ```
> prisma/migrations/
> ├── 20260129000018_init/
> │   └── migration.sql
> └── migration_lock.toml
> ```
>
> **生产环境部署：**
> ```bash
> npx prisma migrate deploy  # 只执行，不生成新 Migration
> ```

---

### 36. 如何处理数据库事务？

**参考答案：**

> **Prisma 事务两种方式：**
>
> **1. 顺序事务（简单场景）：**
> ```typescript
> const [user, job] = await prisma.$transaction([
>   prisma.user.create({ data: userData }),
>   prisma.job.create({ data: jobData }),
> ]);
> ```
>
> **2. 交互式事务（复杂逻辑）：**
> ```typescript
> await prisma.$transaction(async (tx) => {
>   const user = await tx.user.findUnique({ where: { id: 1 } });
>   if (!user) throw new Error('User not found');
>   
>   await tx.job.create({ data: { userId: user.id, ... } });
> });
> ```
>
> **事务保证 ACID：**
> - **A**tomicity：原子性，全部成功或全部回滚
> - **C**onsistency：一致性
> - **I**solation：隔离性
> - **D**urability：持久性

---

## 第五部分：AI/LLM 集成

### 37. 项目中集成了哪些 AI 服务？各自的用途是什么？

**参考答案：**

| AI 服务 | 模型 | 用途 |
|--------|------|------|
| **OpenAI** | GPT-4o-mini | 生成面试问题（基于 JD） |
| **Ollama** | DeepSeek R1:7b | 简历-JD 匹配分析、评分、面试建议 |
| **Whisper** | whisper-tiny.en | 语音转文字（面试录音转写） |

> **架构设计考量：**
> - OpenAI：响应快，适合实时生成
> - Ollama：本地部署，数据不出境，适合处理敏感的简历数据

---

### 38. OpenAI API 是如何集成的？如何处理 API 调用失败？

**参考答案：**

```typescript
// llm.ts
export class LLMService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateQuestions(jobDescription: string, jobTitle: string) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an expert technical recruiter..." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      return this.parseQuestionsResponse(completion.choices[0]?.message?.content);
    } catch (error) {
      // 错误处理：记录日志 + 抛出友好错误
      console.error('Failed to generate questions:', error);
      throw new Error(`Question generation failed: ${error.message}`);
    }
  }
}
```

> **错误处理策略：**
> - 捕获异常并记录日志
> - 返回友好的错误信息
> - 可选：实现重试机制和降级方案

---

### 39. 为什么同时使用 OpenAI 和 Ollama？有什么区别？

**参考答案：**

| 对比项 | OpenAI | Ollama |
|-------|--------|--------|
| **部署** | 云端 API | 本地/私有部署 |
| **成本** | 按 Token 收费 | 免费（需要 GPU） |
| **延迟** | 网络延迟 | 本地无网络延迟 |
| **数据隐私** | 数据发送到 OpenAI | 数据不出本地 |
| **质量** | GPT-4 质量最高 | DeepSeek 质量也不错 |

> **项目策略：**
> - **OpenAI (GPT-4o-mini)**：生成面试问题，不涉及敏感数据
> - **Ollama (DeepSeek)**：分析简历，简历是敏感数据，本地处理更安全

---

### 40. LLM 的响应是不确定的，如何确保返回格式的一致性？

**参考答案：**

> **策略 1：明确的 Prompt 格式要求**
> ```
> **输出格式（严格按照 JSON 格式）：**
> ```json
> {
>   "score": 78,
>   "conclusion": "HIRE",
>   ...
> }
> ```
> ```
>
> **策略 2：解析时的降级处理**
> ```typescript
> private parseAnalysisResponse(response: string): ResumeAnalysisResult {
>   try {
>     // 提取 JSON（处理 markdown 代码块）
>     const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
>     const jsonString = jsonMatch ? jsonMatch[1] : response;
>     return JSON.parse(jsonString.trim());
>   } catch (error) {
>     // 解析失败时返回降级结果
>     return this.getFallbackResult();
>   }
> }
> ```
>
> **策略 3：数据规范化**
> ```typescript
> // 规范化评分（确保 0-100）
> score: Math.min(100, Math.max(0, parsed.score)),
> // 规范化结论（映射到枚举值）
> conclusion: this.normalizeConclusion(parsed.conclusion),
> ```

---

### 41. 简历匹配分析是如何实现的？评分逻辑是什么？

**参考答案：**

> **实现流程：**
> 1. 接收 JD 文本和简历文本
> 2. 构建 Prompt，包含分析要求
> 3. 调用 Ollama API（DeepSeek 模型）
> 4. 解析返回的 JSON 结果
>
> **评分维度（由 AI 综合判断）：**
> - 技能匹配度
> - 经验年限匹配
> - 教育背景
> - 行业相关性
> - 硬性条件（Must-have）满足程度
>
> **输出内容：**
> - `score`: 0-100 分
> - `conclusion`: STRONG_HIRE / HIRE / LEAN_HIRE / LEAN_NO / NO
> - `topStrengths`: 最强匹配点
> - `topGaps`: 最大缺口
> - `skillsMatrix`: 技能矩阵
> - `interviewQuestions`: 建议的面试问题

---

### 42. PDF 简历是如何解析的？解析失败如何处理？

**参考答案：**

> **PDF 解析流程：**
> ```typescript
> // 使用 pdf-parse 库
> import pdf from 'pdf-parse';
>
> async function extractTextFromPDF(filePath: string): Promise<string> {
>   const dataBuffer = fs.readFileSync(filePath);
>   const data = await pdf(dataBuffer);
>   return data.text;
> }
> ```
>
> **文件上传配置（Multer）：**
> - 文件大小限制：10MB
> - 文件类型：PDF
> - 文件名：UUID 生成，避免冲突
>
> **解析失败处理：**
> - 返回友好错误信息
> - 记录日志便于排查
> - 允许用户手动输入简历文本

---

### 43. Whisper 是什么？如何实现语音转文字？

**参考答案：**

> **Whisper 简介：**
> OpenAI 开源的语音识别模型，支持多语言转写。
>
> **项目中的实现：**
> ```typescript
> // 使用 HuggingFace Transformers 库
> import { pipeline } from '@huggingface/transformers';
>
> const transcriber = await pipeline(
>   'automatic-speech-recognition',
>   'Xenova/whisper-tiny.en'
> );
>
> const result = await transcriber(audioBuffer);
> console.log(result.text);
> ```
>
> **用途：**
> - 面试录音转文字
> - 语音留言转写

---

## 第六部分：DevOps 与部署

### 44. 为什么使用 Docker？容器化有什么好处？

**参考答案：**

| 好处 | 说明 |
|-----|------|
| **环境一致性** | 开发、测试、生产环境完全相同 |
| **隔离性** | 应用之间互不影响 |
| **可移植性** | 一次构建，到处运行 |
| **快速部署** | 秒级启动容器 |
| **版本控制** | 镜像版本化，支持回滚 |
| **资源效率** | 比虚拟机更轻量 |

---

### 45. `docker-compose.yml` 中定义了哪些服务？它们如何通信？

**参考答案：**

> **定义的服务：**
> 1. **postgres**：PostgreSQL 15 数据库
> 2. **backend**：Node.js API 服务
> 3. **ollama**：Ollama AI 服务
>
> **服务间通信：**
> - 使用自定义网络 `readysethire-network`
> - 容器通过服务名通信（如 `postgres:5432`、`ollama:11434`）
>
> **依赖关系：**
> ```yaml
> backend:
>   depends_on:
>     postgres:
>       condition: service_healthy  # 等待健康检查通过
>     ollama:
>       condition: service_started
> ```

---

### 46. 什么是多阶段构建？为什么使用它？

**参考答案：**

> **多阶段构建：**
> 在一个 Dockerfile 中使用多个 `FROM` 指令，最终只保留需要的内容。
>
> **项目中的实现：**
> ```dockerfile
> # 阶段 1：构建
> FROM node:20-slim AS builder
> RUN npm ci
> RUN npm run build
>
> # 阶段 2：运行
> FROM node:20-slim AS runtime
> COPY --from=builder /app/dist ./dist
> COPY --from=builder /app/node_modules ./node_modules
> ```
>
> **好处：**
> - 最终镜像更小（不包含编译工具、dev 依赖）
> - 构建产物干净
> - 安全性更高（减少攻击面）

---

### 47. 容器的健康检查是如何配置的？

**参考答案：**

```yaml
# PostgreSQL 健康检查
postgres:
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U readysethire_user -d readysethire"]
    interval: 10s
    timeout: 5s
    retries: 5

# Backend 健康检查
backend:
  healthcheck:
    test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/health', ...)"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 40s  # 启动时的宽限期
```

> **健康检查的作用：**
> - 确保服务真正可用
> - 编排依赖（depends_on + condition）
> - 自动重启不健康的容器

---

### 48. 项目的 CI/CD 流程是怎样的？

**参考答案：**

```
┌─────────────────────────────────────────────────────────┐
│                    GitHub Actions                        │
│                                                         │
│  ┌───────────┐     ┌─────────────────┐     ┌─────────┐ │
│  │ Unit Test │ ──► │ Integration Test │ ──► │  Build  │ │
│  │ (Node 22) │     │ (with Postgres)  │     │         │ │
│  └───────────┘     └─────────────────┘     └─────────┘ │
│        │                   │                     │      │
│        └───────────────────┴─────────────────────┘      │
│                           │                             │
│                           ▼                             │
│                     Build Success                       │
│                           │                             │
│                           ▼                             │
│                 Upload Build Artifacts                  │
└─────────────────────────────────────────────────────────┘
```

> **触发条件：**
> - Push 到任意分支
> - Pull Request
>
> **Job 说明：**
> - `unit`：运行单元测试
> - `integration`：启动 PostgreSQL，运行集成测试
> - `build`：编译 TypeScript，上传构建产物

---

### 49. GitHub Actions 中的 Job 是如何配置的？

**参考答案：**

```yaml
jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22.x
          cache: npm
      - run: npm ci
      - run: npm run test:unit

  integration:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15-alpine
        # ... 配置
    steps:
      - run: npm run test:integration

  build:
    needs: [unit, integration]  # 依赖前两个 Job 成功
    steps:
      - run: npm run build
```

> **关键配置：**
> - `needs`：定义 Job 依赖
> - `services`：启动辅助服务（如数据库）
> - `cache`：缓存 npm 依赖加速构建

---

### 50. 测试失败时，部署会发生什么？

**参考答案：**

> **CI 流程控制：**
> - `build` Job 依赖 `unit` 和 `integration`
> - 任何测试失败，后续 Job 不会执行
> - PR 无法合并（如果配置了分支保护规则）
>
> **这就是"质量门禁"**：
> - 确保只有通过所有测试的代码才能部署
> - 防止问题代码进入生产环境

---

### 51. 前端是如何部署到 S3 的？

**参考答案：**

```yaml
# deploy.yml
jobs:
  deploy:
    steps:
      - run: npm run build
      - name: Deploy to S3
        run: |
          aws s3 sync dist/ s3://${{ secrets.S3_BUCKET }} --delete
```

> **S3 静态网站托管：**
> - 构建后的静态文件上传到 S3
> - 配置 CloudFront CDN 加速
> - 使用 `--delete` 同步删除旧文件

---

### 52. 后端部署在哪里？如何处理数据库迁移？

**参考答案：**

> **部署流程：**
> 1. 构建 Docker 镜像
> 2. 推送到镜像仓库
> 3. 在服务器上拉取并运行
>
> **数据库迁移（自动执行）：**
> ```dockerfile
> CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
> ```
>
> **迁移策略：**
> - 容器启动时自动执行 `prisma migrate deploy`
> - 只执行未执行过的迁移
> - 生产环境不会自动创建迁移文件

---

## 第七部分：测试

### 53. 项目中有哪些类型的测试？

**参考答案：**

| 测试类型 | 配置文件 | 说明 |
|---------|---------|------|
| **单元测试** | `jest.unit.config.js` | 测试单个函数/类，Mock 外部依赖 |
| **集成测试** | `jest.integration.config.js` | 测试组件协作，使用真实数据库 |
| **E2E 测试** | `e2e.min.test.ts` | 端到端流程测试 |

---

### 54. 单元测试和集成测试的区别是什么？

**参考答案：**

| 对比项 | 单元测试 | 集成测试 |
|-------|---------|---------|
| **范围** | 单个函数/类 | 多个组件协作 |
| **外部依赖** | Mock | 真实服务 |
| **速度** | 快（毫秒级） | 慢（秒级） |
| **数据库** | Mock Prisma Client | 真实 PostgreSQL |
| **目的** | 验证逻辑正确性 | 验证组件协作 |

---

### 55. 如何 Mock 数据库进行单元测试？

**参考答案：**

```typescript
// 使用 jest-mock-extended
import { mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

const prismaMock = mockDeep<PrismaClient>();

// Mock 查询
prismaMock.user.findUnique.mockResolvedValue({
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  // ...
});

// 测试
const user = await userService.findById(1);
expect(user.username).toBe('testuser');
```

---

### 56. 测试覆盖率是多少？如何提高？

**参考答案：**

> **查看覆盖率：**
> ```bash
> npm run test:coverage
> ```
>
> **提高覆盖率的方法：**
> 1. 为未测试的函数添加测试用例
> 2. 测试边界条件和错误路径
> 3. 增加 E2E 测试覆盖主要流程
>
> **覆盖率指标：**
> - 行覆盖率（Line Coverage）
> - 分支覆盖率（Branch Coverage）
> - 函数覆盖率（Function Coverage）

---

## 第八部分：安全

### 57. 项目中有哪些安全措施？

**参考答案：**

| 安全措施 | 实现方式 |
|---------|---------|
| **密码加密** | bcrypt 哈希（12 rounds） |
| **认证** | JWT Token |
| **授权** | 角色权限控制（RBAC） |
| **SQL 注入防护** | Prisma 参数化查询 |
| **CORS 配置** | 限制允许的来源 |
| **文件上传验证** | Multer 类型和大小限制 |
| **HTTPS** | 生产环境强制 HTTPS |

---

### 58. 如何防止 SQL 注入？

**参考答案：**

> **Prisma 自动防护：**
> Prisma 使用参数化查询，用户输入不会直接拼接到 SQL。
>
> ```typescript
> // 安全：Prisma 参数化查询
> const user = await prisma.user.findUnique({
>   where: { email: userInput }  // userInput 被自动转义
> });
>
> // 危险：原生 SQL 拼接（不要这样做）
> const query = `SELECT * FROM users WHERE email = '${userInput}'`;
> ```

---

### 59. 如何防止 XSS 攻击？

**参考答案：**

> **React 自动转义：**
> - React 默认对 JSX 中的变量进行转义
> - 避免使用 `dangerouslySetInnerHTML`
>
> **后端输入验证：**
> - 验证和清理用户输入
> - 返回数据时避免包含脚本
>
> **Content Security Policy（CSP）：**
> - 限制脚本来源

---

### 60. CORS 是什么？为什么需要配置 CORS？

**参考答案：**

> **CORS (Cross-Origin Resource Sharing)：**
> 浏览器的安全策略，限制网页向不同源的服务器发送请求。
>
> **为什么需要：**
> - 前端运行在 `localhost:5173`
> - 后端运行在 `localhost:3000`
> - 不同端口 = 不同源 = 被浏览器阻止
>
> **配置方式：**
> ```typescript
> app.use(cors({
>   origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
>   credentials: true
> }));
> ```

---

### 61. API Key 和敏感信息是如何管理的？

**参考答案：**

> **正确做法：**
> - 使用环境变量 (`process.env.OPENAI_API_KEY`)
> - `.env` 文件不提交到 Git（`.gitignore`）
> - 生产环境通过 CI/CD 或云平台注入
>
> **⚠️ 项目中的问题：**
> `server/src/services/llm.ts` 第 14 行有硬编码的 API Key，这是安全隐患，需要修复：
> ```typescript
> // 修复前（不安全）
> apiKey: process.env.OPENAI_API_KEY || 'sk-proj-xxx...',
>
> // 修复后（安全）
> apiKey: process.env.OPENAI_API_KEY,
> ```

---

## 第九部分：代码质量与工程实践

### 62. 项目的代码规范是怎样的？使用了哪些工具？

**参考答案：**

| 工具 | 用途 |
|-----|------|
| **ESLint** | JavaScript/TypeScript 代码检查 |
| **Prettier** | 代码格式化 |
| **TypeScript** | 类型检查 |

> **配置文件：**
> - `.eslintrc.js` / `eslint.config.js`
> - `.prettierrc`
>
> **常用命令：**
> ```bash
> npm run lint        # 检查代码
> npm run lint:fix    # 自动修复
> npm run format      # 格式化代码
> ```

---

### 63. TypeScript 的严格模式有什么作用？

**参考答案：**

> **严格模式选项（tsconfig.json）：**
> ```json
> {
>   "compilerOptions": {
>     "strict": true,           // 启用所有严格检查
>     "noImplicitAny": true,    // 禁止隐式 any
>     "strictNullChecks": true, // 严格空值检查
>     "strictFunctionTypes": true
>   }
> }
> ```
>
> **好处：**
> - 捕获更多潜在错误
> - 强制编写更安全的代码
> - 提升代码可维护性

---

### 64. 如何组织项目的文件结构？

**参考答案：**

> **前端结构（按功能/特性）：**
> ```
> client/src/
> ├── api/           # API 调用
> ├── components/    # 可复用组件
> │   ├── common/    # 通用组件
> │   ├── form/      # 表单组件
> │   ├── layout/    # 布局组件
> │   └── ui/        # UI 基础组件
> ├── pages/         # 页面组件
> ├── hooks/         # 自定义 Hooks
> ├── contexts/      # Context
> ├── routes/        # 路由配置
> └── types/         # 类型定义
> ```
>
> **后端结构（分层架构）：**
> ```
> server/src/
> ├── controllers/   # 控制器层
> ├── routes/        # 路由定义
> ├── services/      # 服务层（业务逻辑）
> ├── middleware/    # 中间件
> └── models/        # 数据模型
> ```

---

### 65. 如何处理技术债务？

**参考答案：**

> **识别技术债务：**
> - 代码注释中的 TODO
> - 重复代码
> - 过时的依赖
> - 缺少测试的模块
>
> **处理策略：**
> 1. 记录到 Issue/任务列表
> 2. 定期安排时间处理
> 3. 新功能开发时顺便重构
> 4. 升级依赖版本
>
> **项目中的技术债务示例：**
> - 硬编码的 API Key
> - 测试覆盖不完整
> - 缺少 API 文档

---

## 第十部分：系统设计与扩展

### 66. 如果要支持多租户（Multi-tenant），你会如何设计？

**参考答案：**

> **项目已有基础：**
> - `Company` 模型作为租户
> - `User` 和 `Job` 关联 `companyId`
>
> **完善多租户的方案：**
> 1. **数据隔离**：所有查询自动加上 `companyId` 过滤
> 2. **中间件实现**：
>    ```typescript
>    const tenantMiddleware = (req, res, next) => {
>      req.tenantId = req.user.companyId;
>      next();
>    };
>    ```
> 3. **Prisma 中间件**：自动注入租户条件

---

### 67. 如果需要实时通知功能，你会如何实现？

**参考答案：**

> **方案：WebSocket + 消息队列**
>
> ```
> 用户操作 → API → 消息队列 (Redis Pub/Sub) → WebSocket Server → 客户端
> ```
>
> **技术选型：**
> - **Socket.io**：简单易用，支持回退
> - **ws**：原生 WebSocket，性能更好
>
> **通知场景：**
> - 申请状态变更通知
> - 新申请提醒
> - 面试安排通知

---

### 68. 如何实现简历解析的异步处理？

**参考答案：**

> **问题：** 简历解析（PDF + AI 分析）耗时长，同步处理影响用户体验
>
> **解决方案：消息队列 + 后台 Worker**
>
> ```
> 用户上传简历 → API 保存文件 → 发送消息到队列 → 立即返回响应
>                                    │
>                                    ▼
>                            Worker 处理任务
>                                    │
>                                    ▼
>                            更新数据库 + 通知用户
> ```
>
> **技术选型：**
> - **Bull/BullMQ**：基于 Redis 的任务队列
> - **RabbitMQ**：功能更强大的消息中间件

---

### 69. 如果要添加搜索功能，你会如何设计？

**参考答案：**

> **简单场景：数据库 LIKE 查询**
> ```typescript
> prisma.job.findMany({
>   where: {
>     OR: [
>       { title: { contains: keyword, mode: 'insensitive' } },
>       { description: { contains: keyword, mode: 'insensitive' } }
>     ]
>   }
> });
> ```
>
> **复杂场景：Elasticsearch**
> - 全文搜索
> - 分词、高亮
> - 聚合分析
> - 性能更好
>
> **同步策略：**
> - 数据变更时同步到 ES
> - 或使用 Debezium 监听数据库变更

---

### 70. 如何实现 API 限流？

**参考答案：**

> **方案 1：Express Rate Limit 中间件**
> ```typescript
> import rateLimit from 'express-rate-limit';
>
> const limiter = rateLimit({
>   windowMs: 15 * 60 * 1000, // 15 分钟
>   max: 100,                  // 最多 100 次请求
>   message: 'Too many requests'
> });
>
> app.use('/api', limiter);
> ```
>
> **方案 2：Redis + 滑动窗口**
> - 更精确的限流
> - 支持分布式
>
> **限流策略：**
> - 按 IP
> - 按用户 ID
> - 按 API 端点

---

## 行为面试问题参考

### 71. 在开发这个项目时遇到的最大挑战是什么？

> **示例答案：**
> 集成 Ollama 进行简历分析时，遇到了 LLM 响应格式不稳定的问题。有时返回的 JSON 格式不标准，导致解析失败。
>
> **解决方案：**
> 1. 优化 Prompt，明确要求 JSON 格式
> 2. 增加解析时的容错处理
> 3. 实现降级方案（返回默认结果）

### 72. 有没有做过技术决策后来发现是错误的？

> **示例答案：**
> 最初使用纯 localStorage 存储 Token，后来发现存在 XSS 风险。虽然项目规模不大，但这提醒我在安全方面要更加谨慎。
>
> **改进措施：**
> 考虑使用 HttpOnly Cookie 存储 Token

### 73. 如果让你重新做这个项目，你会有什么不同的做法？

> **示例答案：**
> 1. 从一开始就添加完善的测试
> 2. 使用 Redis 做缓存层
> 3. 考虑使用 NestJS 获得更好的架构支持
> 4. 添加监控和日志聚合

### 74. 你是如何学习新技术的？

> **示例答案：**
> 1. 阅读官方文档（最权威）
> 2. 做小型 Demo 验证理解
> 3. 在实际项目中应用
> 4. 遇到问题查 GitHub Issues / Stack Overflow

### 75. 这个项目中你最自豪的部分是什么？

> **示例答案：**
> AI 简历分析功能。它整合了多个技术：
> - PDF 解析
> - LLM Prompt 工程
> - 结果解析和降级处理
> - 异步超时处理
>
> 这个功能展示了如何将 AI 能力集成到实际业务中。

---

## 快速复习清单

面试前快速过一遍：

- [ ] JWT 的三部分：Header、Payload、Signature
- [ ] REST 原则：资源导向、HTTP 方法、状态码
- [ ] React Hooks：useState、useEffect、useContext、useCallback
- [ ] 密码存储：bcrypt 哈希，不存明文
- [ ] 索引作用：加速查询，索引字段选择
- [ ] Docker 好处：环境一致、隔离、可移植
- [ ] N+1 问题：用 include/join 解决
- [ ] XSS 防护：React 自动转义、不用 dangerouslySetInnerHTML
- [ ] CORS：跨域资源共享，配置 origin

---

*答案文档生成时间：2026-01-29*
