import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    console.log('🔍 API UPDATE - Body received:', body)
    const { title, description, status, priority, is_recurring, estimated_duration, actual_duration, due_date, completed_at, tags, metadata } = body
    console.log('🔍 API UPDATE - is_recurring value:', is_recurring)

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (status !== undefined) updateData.status = status
    if (priority !== undefined) updateData.priority = priority
    if (is_recurring !== undefined) {
      updateData.is_recurring = is_recurring
      console.log('🔍 API UPDATE - Adding is_recurring to updateData:', updateData.is_recurring)
    }
    if (estimated_duration !== undefined) updateData.estimated_duration = estimated_duration
    if (actual_duration !== undefined) updateData.actual_duration = actual_duration
    if (due_date !== undefined) updateData.due_date = due_date ? new Date(due_date).toISOString() : null
    if (completed_at !== undefined) updateData.completed_at = completed_at ? new Date(completed_at).toISOString() : null
    if (tags !== undefined) updateData.tags = tags
    if (metadata !== undefined) updateData.metadata = metadata

    console.log('🔍 API UPDATE - Final updateData:', updateData)
    const { data, error } = await supabase
      .from('offwork_activities')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select(`
        *,
        offwork_categories (
          id,
          name,
          color,
          icon
        )
      `)
      .single()
    
    console.log('🔍 API UPDATE - Supabase response data:', data)
    console.log('🔍 API UPDATE - Supabase response error:', error)

    if (error) {
      console.error('Error updating activity:', error)
      return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    return NextResponse.json({ activity: data })
  } catch (error) {
    console.error('Error in update activity API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { error } = await supabase
      .from('offwork_activities')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting activity:', error)
      return NextResponse.json({ error: 'Failed to delete activity' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in delete activity API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
