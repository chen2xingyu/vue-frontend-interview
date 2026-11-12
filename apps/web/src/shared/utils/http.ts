import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'

/**
 * HTTP 客户端封装（三层设计）
 *
 * Layer 1 — 纯 HTTP 客户端（本文件）
 *   职责：基础请求、拦截器链、Token 续期、错误统一、取消请求、重试
 *
 * Layer 2 — 业务 API 函数（各 domain/api/*.ts）
 *   职责：每个函数对应一个接口，带完整 TS 类型，返回业务数据而非 AxiosResponse
 *
 * Layer 3 — 组合式函数（各 domain/composables/useXxx.ts）
 *   职责：自动处理 loading/error/缓存/取消副作用
 *
 * P9 面试点：为什么分三层？
 *   让网络层、接口层、视图层各司其职。
 *   换 HTTP 库（如 fetch + undici）只改 Layer 1；
 *   接口字段变化只改 Layer 2；
 *   视图里直接用 useXxx() 拿数据和状态。
 */

// ---------- 类型 ----------

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

export interface PaginationParams {
  page?: number
  pageSize?: number
}

export interface PaginationResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export type HttpErrorCode =
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'SERVER_ERROR'
  | 'CANCELLED'
  | 'UNKNOWN'
  | `BUSINESS_${number}`

export interface HttpError extends Error {
  code: HttpErrorCode
  status?: number
  data?: unknown
  isCanceled: boolean
}

/** 扩展 AxiosRequestConfig，增加重试和取消能力 */
export interface RequestOptions extends AxiosRequestConfig {
  /** 重试次数（仅对幂等 GET/HEAD 生效） */
  retries?: number
  /** 重试间隔（ms） */
  retryDelay?: number
  /** 业务层取消信号 */
  signal?: AbortSignal
}

// ---------- 错误归一化 ----------

function normalizeError(err: AxiosError): HttpError {
  const code = mapErrorCode(err)
  const status = err.response?.status
  const isCanceled = axios.isCancel(err) || err.code === 'ERR_CANCELED'

  // 后端统一响应体里的 message 是给用户看的（中文、可读）；
  // err.message 是 axios 的英文技术错误（"Request failed with status code 401"），
  // 直接透出到 UI 既不可读也丢失了业务语义，所以优先取 body.message
  const body = err.response?.data as { message?: string } | undefined

  return {
    name: 'HttpError',
    message: body?.message || err.message,
    code,
    status,
    data: err.response?.data,
    isCanceled,
    cause: err,
  }
}

function mapErrorCode(err: AxiosError): HttpErrorCode {
  if (axios.isCancel(err) || err.code === 'ERR_CANCELED') return 'CANCELLED'
  if (err.code === 'ERR_NETWORK') return 'NETWORK_ERROR'
  if (err.code === 'ECONNABORTED') return 'TIMEOUT'
  const status = err.response?.status
  if (!status) return 'UNKNOWN'
  if (status === 401) return 'UNAUTHORIZED'
  if (status === 403) return 'FORBIDDEN'
  if (status === 404) return 'NOT_FOUND'
  if (status >= 500) return 'SERVER_ERROR'
  return 'UNKNOWN'
}

// ---------- Token 管理 ----------

const TOKEN_KEY = 'feis.token'
const REFRESH_TOKEN_KEY = 'feis.refreshToken'
let tokenRefreshPromise: Promise<string | null> | null = null

/** 认证失效事件：http 层拿不到 router，用事件解耦 */
export const AUTH_EXPIRED_EVENT = 'feis:auth-expired'

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* quota / 隐私模式 */
  }
}

function removeStorage(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

function getToken(): string | null {
  return readStorage(TOKEN_KEY)
}

function setToken(token: string) {
  writeStorage(TOKEN_KEY, token)
}

function getRefreshToken(): string | null {
  return readStorage(REFRESH_TOKEN_KEY)
}

/** 一次性写入 token 对（登录 / 续期成功后调用） */
function setTokens(pair: { accessToken: string; refreshToken: string }) {
  setToken(pair.accessToken)
  writeStorage(REFRESH_TOKEN_KEY, pair.refreshToken)
}

function clearToken() {
  removeStorage(TOKEN_KEY)
  removeStorage(REFRESH_TOKEN_KEY)
}

/**
 * Token 续期（并发时只发一次请求）
 *
 * P9 面试点：为什么用 Promise 做"续期合并"？
 *   多个请求同时收到 401 时，只有一个去续期，其他等待同一份 Promise 结果。
 *   否则 10 个并发请求会触发 10 次 refresh，且后面的 refresh 会用到已经被轮换掉的旧 token。
 *
 * 注意：这里用**裸 axios**而不是本文件创建的实例。
 *   走实例的话，refresh 请求本身 401 又会进入同一个拦截器 → 无限递归。
 */
function refreshAccessToken(): Promise<string | null> {
  if (tokenRefreshPromise) return tokenRefreshPromise

  const promise = (async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) return null

    try {
      const response = await axios.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
        `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
        { refreshToken },
        { timeout: 10_000 },
      )
      const body = response.data
      if (body?.code !== 0 || !body.data?.accessToken) return null

      setTokens(body.data)
      return body.data.accessToken
    } catch {
      // refresh token 也失效了 —— 只能重新登录
      return null
    } finally {
      tokenRefreshPromise = null
    }
  })()

  tokenRefreshPromise = promise
  return promise
}

// ---------- 实例创建 ----------

function createHttp(baseURL?: string): AxiosInstance {
  const instance = axios.create({
    baseURL: baseURL ?? import.meta.env.VITE_API_BASE_URL,
    timeout: 15_000,
  })

  // 请求拦截器：注入 Token
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = getToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      config.headers['X-Request-ID'] = crypto.randomUUID()
      return config
    },
    (err) => Promise.reject(err),
  )

  // 响应拦截器：业务码统一 + Token 续期
  instance.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
      const body = response.data
      // 如果后端返回的是统一格式 { code, message, data }
      if (body && typeof body === 'object' && 'code' in body) {
        if (body.code === 0) return response
        // 业务错误也走 rejected，由调用方 catch 处理
        return Promise.reject({
          name: 'BusinessError',
          message: body.message || '请求失败',
          code: `BUSINESS_${body.code}`,
          status: response.status,
          data: body,
          isCanceled: false,
        } satisfies HttpError)
      }
      return response
    },
    async (err: AxiosError) => {
      if (err.response?.status === 401) {
        const isRefreshRequest = err.config?.url?.includes('/auth/refresh')
        // 登录接口本身就是 401 的来源（密码错误），不能触发续期
        const isLoginRequest = err.config?.url?.includes('/auth/login')

        if (!isRefreshRequest && !isLoginRequest && err.config) {
          const newToken = await refreshAccessToken()
          if (newToken) {
            err.config.headers.Authorization = `Bearer ${newToken}`
            return instance.request(err.config)
          }
        }

        // 续期失败（或无 refresh token）—— 清理并广播，由上层跳转登录页
        if (!isLoginRequest) {
          clearToken()
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT))
          }
        }
      }
      return Promise.reject(normalizeError(err))
    },
  )

  return instance
}

// ---------- 请求执行器（带重试） ----------

const http = createHttp()

async function execute<T>(config: RequestOptions): Promise<T> {
  const { retries = 0, retryDelay = 1000, ...axiosConfig } = config

  let lastError: unknown

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // 将 AbortSignal 桥接到 axios cancel token
      let cancelSource: ReturnType<typeof axios.CancelToken.source> | null = null
      if (config.signal) {
        cancelSource = axios.CancelToken.source()
        if (config.signal.aborted) cancelSource.cancel()
        else config.signal.addEventListener('abort', () => cancelSource?.cancel())
      }

      const response = await http.request<AxiosResponse<ApiResponse<T>>>({
        ...axiosConfig,
        cancelToken: cancelSource?.token,
      })

      // 如果后端是统一格式，返回 data；否则直接返回 response.data
      const body = response.data as unknown
      if (body && typeof body === 'object' && 'data' in (body as object)) {
        return (body as ApiResponse<T>).data
      }
      return body as T
    } catch (err) {
      lastError = err
      const httpErr = err as HttpError

      // 取消请求不重试
      if (httpErr.isCanceled || httpErr.code === 'CANCELLED') throw err

      // 仅对幂等方法重试
      const isIdempotent = ['GET', 'HEAD', 'OPTIONS'].includes(
        (config.method ?? 'GET').toUpperCase(),
      )

      if (attempt < retries && isIdempotent) {
        await new Promise((r) => setTimeout(r, retryDelay * (attempt + 1)))
        continue
      }
      throw err
    }
  }
  throw lastError
}

// ---------- 便捷方法 ----------

export const request = {
  get<T>(url: string, config?: RequestOptions): Promise<T> {
    return execute<T>({ ...config, method: 'GET', url })
  },
  post<T>(url: string, data?: unknown, config?: RequestOptions): Promise<T> {
    return execute<T>({ ...config, method: 'POST', url, data })
  },
  put<T>(url: string, data?: unknown, config?: RequestOptions): Promise<T> {
    return execute<T>({ ...config, method: 'PUT', url, data })
  },
  patch<T>(url: string, data?: unknown, config?: RequestOptions): Promise<T> {
    return execute<T>({ ...config, method: 'PATCH', url, data })
  },
  delete<T>(url: string, config?: RequestOptions): Promise<T> {
    return execute<T>({ ...config, method: 'DELETE', url })
  },
}

// 暴露给外部使用的类型和常量
export { http, getToken, getRefreshToken, setToken, setTokens, clearToken }
export type { AxiosResponse }
