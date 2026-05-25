import { corsHeaders, jsonResponse } from '@/lib/external-api'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() })
}

export async function GET() {
  return jsonResponse(
    {
      ok: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
    },
    200
  )
}
