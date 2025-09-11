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
      const result = await supabase.rpc('get_offwork_ideas_by_category', { category_name: categoryName })
      data = result.data
      error = result.error
    } else {
      const result = await supabase
        .from('offwork_ideas')
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
      console.error('Error fetching ideas:', error)
      return NextResponse.json({ error: 'Failed to fetch ideas' }, { status: 500 })
    }

    return NextResponse.json({ ideas: data })
  } catch (error) {
    console.error('Error in ideas API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { category_id, title, description, status, priority, estimated_duration, tags, metadata, source } = body

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
      .from('offwork_ideas')
      .insert({
        user_id: user.id,
        category_id,
        title,
        description,
        status: status || 'idea',
        priority: priority || 'medium',
        estimated_duration,
        tags: tags || [],
        metadata: metadata || {},
        source: source || 'manual'
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
      console.error('Error creating idea:', error)
      return NextResponse.json({ error: 'Failed to create idea' }, { status: 500 })
    }

    return NextResponse.json({ idea: data }, { status: 201 })
  } catch (error) {
    console.error('Error in create idea API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
