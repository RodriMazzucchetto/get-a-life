import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createClient();
    
    // Testar apenas a função listIdeas
    const { data: ideas, error } = await supabase
      .from('idea')
      .select('*')
      .limit(5);

    if (error) {
      return NextResponse.json({
        status: 'error',
        message: 'Erro ao buscar ideias',
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      status: 'success',
      message: 'Ideias carregadas com sucesso',
      ideas: ideas || []
    });

  } catch (error) {
    console.error('Erro no teste simples:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
