import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Obter dados do corpo da requisição
    const { cities } = await request.json()
    
    if (!cities || !Array.isArray(cities)) {
      return NextResponse.json(
        { error: 'Dados de cidades inválidos' },
        { status: 400 }
      )
    }

    console.log(`🔄 Sincronizando ${cities.length} cidades para usuário ${user.email}`)

    // Limpar cidades existentes do usuário
    const { error: deleteError } = await supabase
      .from('visited_cities')
      .delete()
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('❌ Erro ao limpar cidades existentes:', deleteError)
      return NextResponse.json(
        { error: 'Erro ao limpar cidades existentes' },
        { status: 500 }
      )
    }

    // Preparar dados para inserção
    const citiesToInsert = cities.map((city: { 
      name: string; 
      displayName?: string; 
      country: string; 
      state?: string; 
      coordinates: [number, number]; 
    }) => ({
      user_id: user.id,
      city_name: city.name,
      display_name: city.displayName || city.name,
      country: city.country,
      state: city.state,
      latitude: city.coordinates[0],
      longitude: city.coordinates[1]
    }))

    // Inserir novas cidades
    const { error: insertError } = await supabase
      .from('visited_cities')
      .insert(citiesToInsert)

    if (insertError) {
      console.error('❌ Erro ao inserir cidades:', insertError)
      return NextResponse.json(
        { error: 'Erro ao inserir cidades' },
        { status: 500 }
      )
    }

    // Calcular países únicos
    const uniqueCountries = new Set(cities.map((city: { country: string }) => city.country))
    const countriesCount = uniqueCountries.size

    console.log(`✅ Sincronização concluída: ${cities.length} cidades em ${countriesCount} países`)
    console.log(`🌍 Países: ${Array.from(uniqueCountries).join(', ')}`)

    return NextResponse.json({
      success: true,
      synced: cities.length,
      countries: countriesCount,
      countriesList: Array.from(uniqueCountries),
      message: `Sincronizadas ${cities.length} cidades em ${countriesCount} países`
    })

  } catch (error) {
    console.error('❌ Erro na sincronização:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Buscar cidades visitadas do usuário
    const { data: cities, error: fetchError } = await supabase
      .from('visited_cities')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('❌ Erro ao buscar cidades:', fetchError)
      return NextResponse.json(
        { error: 'Erro ao buscar cidades' },
        { status: 500 }
      )
    }

    // Calcular países únicos
    const uniqueCountries = new Set(cities.map(city => city.country))
    const countriesCount = uniqueCountries.size

    console.log(`📊 Usuário ${user.email}: ${cities.length} cidades em ${countriesCount} países`)

    return NextResponse.json({
      cities: cities.length,
      countries: countriesCount,
      countriesList: Array.from(uniqueCountries),
      data: cities
    })

  } catch (error) {
    console.error('❌ Erro ao buscar dados:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
