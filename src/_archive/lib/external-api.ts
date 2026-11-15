import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'

export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'BAD_REQUEST'
  | 'NOT_FOUND'
  | 'CONFIG_ERROR'
  | 'INTERNAL_ERROR'

export function corsHeaders(_request?: Request): HeadersInit {
  const allowOrigin =
    process.env.TASK_ARCHITECT_CORS_ORIGIN?.trim() || '*'

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization',
    'Access-Control-Max-Age': '86400',
  }
}

export function jsonResponse(
  body: unknown,
  status: number,
  request?: Request
): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(request),
    },
  })
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number,
  request?: Request
): NextResponse {
  return jsonResponse({ error: { code, message } }, status, request)
}

export function verifyTaskArchitectApiKey(request: Request): boolean {
  const expected = process.env.TASK_ARCHITECT_API_KEY?.trim()
  if (!expected) {
    return false
  }
  const provided = request.headers.get('x-api-key')?.trim() ?? ''
  if (provided.length !== expected.length) {
    return false
  }
  try {
    const a = Buffer.from(provided, 'utf8')
    const b = Buffer.from(expected, 'utf8')
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export function requireApiKey(request: Request): NextResponse | null {
  if (!process.env.TASK_ARCHITECT_API_KEY?.trim()) {
    return apiError(
      'CONFIG_ERROR',
      'TASK_ARCHITECT_API_KEY is not configured on the server',
      503,
      request
    )
  }
  if (!verifyTaskArchitectApiKey(request)) {
    return apiError(
      'UNAUTHORIZED',
      'Invalid or missing x-api-key header',
      401,
      request
    )
  }
  return null
}

export function getTaskArchitectUserId(request: Request): string | NextResponse {
  const userId = process.env.TASK_ARCHITECT_USER_ID?.trim()
  if (!userId) {
    return apiError(
      'CONFIG_ERROR',
      'TASK_ARCHITECT_USER_ID is not configured on the server',
      503,
      request
    )
  }
  return userId
}

export function optionsResponse(request: Request): NextResponse {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) })
}
