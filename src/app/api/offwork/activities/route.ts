import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryName = searchParams.get('category')

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

    let data, error

    if (categoryName) {
      const result = await supabase.rpc('get_offwork_activities_by_category', { category_name: categoryName })
      data = result.data
      error = result.error
    } else {
      const result = await supabase
        .from('offwork_activities')
        .select(`
          *,
          offwork_categories (
            id,
            name,
            color,
            icon
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      data = result.data
      error = result.error
    }

    if (error) {
      console.error('Error fetching activities:', error)
      return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
    }

    return NextResponse.json({ activities: data })
  } catch (error) {
    console.error('Error in activities API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { category_id, title, description, status, priority, estimated_duration, due_date, tags, metadata } = body

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

    const { data, error } = await supabase
      .from('offwork_activities')
      .insert({
        user_id: user.id,
        category_id,
        title,
        description,
        status: status || 'pending',
        priority: priority || 'medium',
        estimated_duration,
        due_date: due_date ? new Date(due_date).toISOString() : null,
        tags: tags || [],
        metadata: metadata || {}
      })
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

    if (error) {
      console.error('Error creating activity:', error)
      return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 })
    }

    return NextResponse.json({ activity: data }, { status: 201 })
  } catch (error) {
    console.error('Error in create activity API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
