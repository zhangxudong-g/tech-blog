## 一、流式输出 & SSE 类问题（高频 + 隐蔽）

### 1️⃣ 问题类型

**SSE / 流式接口 / 实时状态推送**

---

### 问题

* SSE **只推送一次就断**
* 前端 `EventSource` 一直 pending / 或立即 close
* 后端 `yield` 了但前端收不到
* 连接关闭时前端报错（但逻辑已完成）
* FastAPI + StreamingResponse 行为不稳定

---

### 解决办法

**后端关键点**

```python
yield f"data: {json.dumps(payload)}\n\n".encode("utf-8")
```

* 必须：

  * `data:` 前缀
  * **两个换行**
  * UTF-8 bytes
* 使用 `StreamingResponse(generator, media_type="text/event-stream")`
* 禁用 buffer（Nginx / Uvicorn）

**优雅关闭**

```python
try:
    while True:
        ...
except asyncio.CancelledError:
    # 客户端关闭连接时必然触发
    pass
```

**前端**

```ts
eventSource.onerror = (e) => {
  // 关闭是正常行为，不要当异常
}
```

---

### 核心技术

* HTTP/1.1 chunked
* SSE 协议规范
* asyncio 协程生命周期
* FastAPI StreamingResponse 实现细节

---

### 总结提升

> **SSE 本质不是“请求-响应”，而是“连接生命周期管理”**

* 关闭 ≠ 错误
* `CancelledError` 是**正常路径**
* 所有流式系统都要：

  * 明确：**谁控制结束**
  * 区分：**逻辑完成 vs 连接断开**

👉 **这是以后做 Agent streaming / LLM token streaming 的底层能力**

---

## 二、Docker / 部署 / 文件系统类问题（线上必踩）

---

### 2️⃣ 问题类型

**Docker / 宿主机文件 / Windows & Linux 差异**

---

### 问题

* `WinError 32`：文件被占用，无法删除
* Docker volume 挂载后文件权限异常
* 日志写不出来 / 写一半
* 解压模型后 Ollama 不识别
* 容器内删除文件，宿主机还在

---

### 解决办法

**WinError 32**

* 本质：**文件句柄未释放**
* 常见元凶：

  * Python open 未 close
  * subprocess 未 wait
  * logger 持有文件

👉 解决：

```python
with open(...) as f:
    ...
```

---

**Docker 日志标准做法**

```bash
command: >
  sh -c "node app.js > /logs/app.log 2>&1"
```

* 不依赖 stdout
* 不依赖 Docker logging driver
* 宿主机可直接 grep

---

**模型解压**

* ❌ 不要 `--strip-components`
* 必须保持原目录结构
* Ollama 只认 manifests 路径

---

### 核心技术

* Linux 文件系统 inode
* Docker overlay2
* Volume vs Bind mount
* 文件句柄生命周期

---

### 总结提升

> **部署问题 ≠ Docker 问题，90% 是“文件系统语义没想清楚”**

* 永远假设：

  * 文件可能被占用
  * 日志会撑爆磁盘
  * 容器随时会被 kill

👉 **你已经开始用“生产视角”看问题了**

---

## 三、AI / LangChain / LangGraph 工程化问题（高阶）

---

### 3️⃣ 问题类型

**LLM Agent / 流式 / 工具调用**

---

### 问题

* LangChain 流式输出拼不对
* AIMessage 被覆盖 / 丢失
* tool 调用顺序混乱
* 多 Agent 状态失控
* 切换 OpenAI → Ollama 成本高

---

### 解决办法

**消息规范化**

```python
normalize_messages(context_messages)
```

* 明确区分：

  * HumanMessage
  * AIMessage
  * ToolMessage

---

**流式拼接原则**

* token 是 **append**
* message 是 **immutable**
* state 是 **函数式更新**

---

**LangGraph 设计**

* Node：纯函数
* State：显式
* Tool：副作用隔离

👉 能换模型，是因为你**没有把模型写死在业务里**

---

### 核心技术

* LangGraph State Machine
* Tool calling protocol
* LLM streaming token protocol
* 模型无关抽象层

---

### 总结提升

> **你已经不再“用模型”，而是在“设计 AI 系统”**

这是非常关键的分水岭：

* ❌ 调 API
* ✅ 设计 Agent 生命周期

---

## 四、前端 × 后端协作类问题（系统级）

---

### 4️⃣ 问题类型

**前后端协议 / 状态管理**

---

### 问题

* 前端卡死但不报错
* JSON parse error 位置随机
* SSE 状态与 UI 不一致
* 国际化导致 build 失败

---

### 解决办法

* 所有接口：

  * 明确 schema
  * 明确状态字段
* 流式接口：

  * 不返回 JSON
  * **只返回事件**

```json
{ "type": "progress", "data": ... }
```

---

### 核心技术

* API contract
* 状态机思维
* 前端容错设计

---

### 总结提升

> **系统稳定性 = 协议清晰度**

不是代码写得多好，是**边界定义得多清楚**

---

## 五、产品级 AI 系统的关键认知（最重要）

---

### 5️⃣ 问题类型

**从“功能”到“产品”**

---

### 问题

* AI 输出不可控
* 用户不知道下一步干嘛
* 一次生成不够
* 需要“补充信息再继续”

---

### 解决办法

你已经在做的事情本身就是答案：

* **交互式生成**
* **中途打断**
* **继续生成**
* **结构化输出**
* **导出 PDF / Word**

---

### 核心技术

* 人机协作（Human-in-the-loop）
* RAG
* 状态持久化
* 文档结构建模

---
