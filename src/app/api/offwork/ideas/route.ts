import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
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

    const { data, error } = await supabase
      .from('offwork_ideas')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

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
    console.log('🔄 POST /api/offwork/ideas - Starting')
    const body = await request.json()
    console.log('🔄 Request body:', body)
    const { title, description, tags, estimated_duration } = body

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
    console.log('🔄 Auth check - User:', user?.id, 'Error:', authError)
    
    if (authError || !user) {
      console.log('❌ Unauthorized access')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔄 Inserting idea into database')
    // Criar dados mínimos para inserção - apenas campos obrigatórios
    const insertData = {
      user_id: user.id,
      title: title.trim(),
      description: description?.trim() || null,
      tags: tags || [],
      estimated_duration: estimated_duration || null,
      is_prioritized: false
    }
    
    console.log('🔄 Insert data:', insertData)
    
    const { data, error } = await supabase
      .from('offwork_ideas')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating idea:', error)
      return NextResponse.json({ error: 'Failed to create idea', details: error.message }, { status: 500 })
    }

    console.log('✅ Idea created successfully:', data)
    return NextResponse.json({ idea: data }, { status: 201 })
  } catch (error) {
    console.error('❌ Error in create idea API:', error)
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}