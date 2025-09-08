import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createClient();
    
    // Testar tabela idea
    const { data: ideas, error: ideasError } = await supabase
      .from('idea')
      .select('*')
      .limit(1);

    if (ideasError) {
      return NextResponse.json({
        status: 'error',
        message: 'Erro ao acessar tabela idea',
        error: ideasError.message,
        details: 'Tabela idea não existe ou não tem permissão'
      }, { status: 500 });
    }

    // Testar tabela week_selection
    const { data: selections, error: selectionsError } = await supabase
      .from('week_selection')
      .select('*')
      .limit(1);

    if (selectionsError) {
      return NextResponse.json({
        status: 'error',
        message: 'Erro ao acessar tabela week_selection',
        error: selectionsError.message,
        details: 'Tabela week_selection não existe ou não tem permissão'
      }, { status: 500 });
    }

    // Testar tabela day_assignment
    const { data: assignments, error: assignmentsError } = await supabase
      .from('day_assignment')
      .select('*')
      .limit(1);

    if (assignmentsError) {
      return NextResponse.json({
        status: 'error',
        message: 'Erro ao acessar tabela day_assignment',
        error: assignmentsError.message,
        details: 'Tabela day_assignment não existe ou não tem permissão'
      }, { status: 500 });
    }

    return NextResponse.json({
      status: 'success',
      message: 'Todas as tabelas do Off Work estão funcionando',
      results: {
        idea: { success: true, count: ideas?.length || 0 },
        week_selection: { success: true, count: selections?.length || 0 },
        day_assignment: { success: true, count: assignments?.length || 0 }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro no teste Off Work:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
