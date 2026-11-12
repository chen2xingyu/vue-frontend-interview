import type { Question } from '../types'

/**
 * Mock 题库数据
 * 放在 domain 层而不是 shared：这是"业务数据"不是"共享资产"
 * 未来接入真实 API 时，store 改为调用 api/ 层即可，数据定义无需移动
 */
export const questions: Question[] = [
  {
    id: 'v1',
    category: 'Vue 2→3',
    level: '核心原理',
    title: '从 Vue 2 迁移到 Vue 3，响应式系统发生了什么变化？',
    summary: '从 defineProperty 到 Proxy，兼顾迁移影响与兼容策略。',
    answer:
      'Vue 2 通过 Object.defineProperty 改写已有属性的 getter/setter，数组和新增属性需要额外处理；Vue 3 用 Proxy 拦截对象级操作，可覆盖新增、删除、in、ownKeys 与数组索引。依赖模型可以概括为 WeakMap<target, Map<key, Set<effect>>>：读取时 track，写入时 trigger。迁移时重点检查 this、过滤器、全局 API、插件安装、生命周期命名和第三方依赖兼容，不应把"换成 Proxy"误当作迁移全部。',
    followups: [
      '为什么依赖表外层使用 WeakMap？',
      '条件分支切换后如何清理旧依赖？',
      'Proxy 与原对象身份不一致如何处理？',
    ],
    scenario:
      '一个 Vue 2 后台项目准备分阶段升级。先盘点插件和组件库兼容性，建立 Vue 3 适配层与关键页面回归清单，再按路由或业务域渐进迁移。',
    tags: ['Proxy', '响应式', '迁移'],
  },
  {
    id: 'v2',
    category: 'Vue 2→3',
    level: '高频',
    title: 'Vue 3 的 computed、watch 与 watchEffect 如何选择？',
    summary: '依赖显式程度、惰性求值、清理副作用和调度时机。',
    answer:
      'computed 表示派生状态，惰性求值并缓存，依赖变化后标脏；watch 显式指定源，适合有副作用且需要新旧值的逻辑；watchEffect 自动收集同步执行期间读取的依赖，适合依赖集合自然且不需要旧值的副作用。请求类 watch 应注册清理逻辑取消过期请求，并明确 flush 时机，避免竞态。',
    followups: [
      'computed 为什么需要 dirty 标记？',
      'watch 的 flush: pre/post/sync 有何差异？',
      '异步回调里读取的属性会被收集吗？',
    ],
    scenario:
      '搜索框输入触发请求：用 watch 观察 keyword，防抖后请求；新输入到来时 AbortController 取消旧请求，并在卸载时清理定时器。',
    tags: ['computed', 'watch', '异步'],
  },
  {
    id: 'e1',
    category: '工程化',
    level: '系统设计',
    title: '如何设计一个可维护的前端工程化体系？',
    summary: '构建、代码质量、依赖治理、发布与反馈闭环。',
    answer:
      '从交付链路拆解：Vite/构建配置负责开发与产物；TypeScript、ESLint、格式化和提交检查保证一致性；按业务边界组织模块与共享包；CI 执行类型检查、测试、构建和依赖审计；产物通过环境配置、Source Map 管理、灰度发布和回滚进入线上；监控错误率、核心 Web Vitals 和发布版本建立反馈闭环。工程化不是工具堆叠，要用耗时、故障率和协作成本验证收益。',
    followups: ['什么时候引入 Monorepo？', '如何管理环境变量和密钥？', '构建变慢如何定位？'],
    scenario:
      '多个团队重复维护同一组件：先抽取稳定基础组件，采用 workspace 管理版本与依赖，定义变更日志、兼容策略和自动发布流程。',
    tags: ['Vite', 'CI/CD', 'Monorepo'],
  },
  {
    id: 'p1',
    category: '性能优化',
    level: '业务场景',
    title: '大型表格页面首屏和交互卡顿，如何系统排查？',
    summary: '先测量再分层优化，避免盲目加缓存。',
    answer:
      '先用 Performance、网络面板和业务埋点区分网络、脚本执行、渲染与长任务；确认瓶颈后针对性处理：接口分页/并行与缓存，表格虚拟滚动和列配置，昂贵计算移出渲染路径，稳定 props 减少子组件更新，路由和重型组件拆包。优化后对比同一设备和数据规模下的 LCP、INP、长任务、内存与错误率。',
    followups: [
      '虚拟列表的高度不固定怎么办？',
      '如何避免优化造成数据闪烁？',
      '如何验证低端设备收益？',
    ],
    scenario:
      '运营后台表格 2 万行滚动掉帧：保留服务端分页，虚拟化可视区，固定行高优先；筛选条件变化时取消过期请求，并记录关键交互耗时。',
    tags: ['虚拟列表', 'Web Vitals', '性能'],
  },
  {
    id: 'c1',
    category: '组件设计',
    level: '高频',
    title: '如何封装一个既灵活又不难维护的业务组件？',
    summary: '明确受控边界、插槽扩展点、事件契约和可访问性。',
    answer:
      '先识别重复的稳定交互与业务差异。输入/选择类组件采用 value/modelValue + update 事件形成受控模式，内部状态只服务交互；插槽用于结构级扩展，props 用于稳定配置，事件表达用户意图。定义类型、默认值、禁用/加载/空态、键盘可操作性和错误边界；文档给出最小示例与复杂用例。避免把多个业务流程塞进一个"万能组件"。',
    followups: [
      '何时使用插槽而不是大量 props？',
      '如何设计 v-model 参数？',
      '组件如何做无障碍支持？',
    ],
    scenario:
      '封装远程搜索 Select：组件负责输入、键盘操作、加载态和取消过期查询；业务通过 modelValue、选项加载器和插槽定制展示。',
    tags: ['v-model', '插槽', '可访问性'],
  },
  {
    id: 't1',
    category: 'TypeScript',
    level: '高频',
    title: '如何给复杂组件 API 设计可靠的 TypeScript 类型？',
    summary: '泛型、联合类型、窄化和运行时校验各司其职。',
    answer:
      '用 discriminated union 表达互斥模式，泛型关联输入与输出，unknown 作为外部数据边界并通过类型守卫收窄；避免滥用 any 和断言。TypeScript 类型在运行时会擦除，接口数据仍需 schema/校验函数验证。组件 props 和 emits 应推导出使用者友好的类型，同时保持错误信息可读。',
    followups: ['unknown 与 any 区别？', '条件类型何时会分发？', '类型安全如何与运行时校验结合？'],
    scenario:
      '表单字段根据 kind 决定 value 类型：用带 kind 的联合类型关联字段配置和提交值，接口返回后再做运行时校验，避免仅靠编译期类型。',
    tags: ['泛型', '类型守卫', '联合类型'],
  },
  {
    id: 'n1',
    category: 'Node.js',
    level: '系统设计',
    title: 'Node.js API 服务如何处理高并发和慢任务？',
    summary: '事件循环不是"单线程所以不能并发"，关注阻塞与隔离。',
    answer:
      'Node.js 用事件循环处理大量 I/O 等待，但 CPU 密集任务会阻塞主线程。通过超时、限流、连接池、缓存、分页和背压保护服务；CPU 重任务转 Worker Threads 或独立任务队列；服务做水平扩展并实现健康检查、优雅关闭、结构化日志和指标。数据库一致性、幂等和重试要一起设计，避免只谈进程数。',
    followups: ['Promise 并发控制怎么做？', '何时用 Worker Threads？', '重试为何可能放大故障？'],
    scenario:
      '导出百万行报表：API 返回任务 ID，后台队列分批生成文件，客户端轮询/订阅状态；限制并发、支持取消和过期清理。',
    tags: ['事件循环', '队列', '背压'],
  },
  {
    id: 'a1',
    category: '登录与安全',
    level: '业务场景',
    title: '设计一个安全且体验稳定的登录与权限方案。',
    summary: '认证、授权、会话续期、路由保护与服务端兜底。',
    answer:
      '明确身份认证与资源授权的边界。服务端验证凭据并签发合适生命周期的会话；浏览器存储方案结合威胁模型选择，敏感令牌避免暴露给脚本，Cookie 配置 Secure、HttpOnly、SameSite 并防 CSRF。前端路由守卫用于体验与导航，不是安全边界；每个后端接口仍要校验权限。处理续期并发、退出失效、跨标签同步和最小权限，避免把权限菜单隐藏当授权。',
    followups: ['JWT 如何撤销？', '如何防 CSRF 与 XSS？', '权限变化后如何刷新菜单和路由？'],
    scenario:
      '管理系统支持多租户：服务端以用户、租户、资源三元组校验权限，前端按授权结果生成导航；切换租户清理缓存并重新获取会话范围数据。',
    tags: ['认证', '授权', 'CSRF'],
  },
  {
    id: 's1',
    category: '架构场景',
    level: '综合设计',
    title: '从零设计一个可配置的动态表单系统。',
    summary: 'Schema、组件注册、校验、联动、版本与可观测性。',
    answer:
      '定义有版本的表单 Schema，字段类型映射到受控组件注册表；表达校验规则、可见/禁用条件和依赖关系，建立字段依赖图以增量更新；异步校验需防竞态。Schema 做运行时校验，提交时再次服务端校验。配置要支持迁移、预览、权限、审计和回滚；复杂表达式采用受限 DSL，不执行任意脚本。',
    followups: ['字段联动如何避免循环依赖？', '如何兼容旧版 Schema？', '超大表单如何优化渲染？'],
    scenario:
      '多业务线共用审批表单：平台提供稳定字段协议和组件注册机制，业务通过受控扩展接入；版本迁移工具和回滚机制保障线上配置可追踪。',
    tags: ['Schema', '低代码', '表单'],
  },
]
