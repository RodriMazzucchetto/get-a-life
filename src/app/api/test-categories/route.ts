import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createClient();
    
    // Testar se as categorias estão funcionando
    const { data: ideas, error } = await supabase
      .from('idea')
      .select('id, title, category')
      .limit(10);

    if (error) {
      return NextResponse.json({
        status: 'error',
        message: 'Erro ao buscar ideias',
        error: error.message
      }, { status: 500 });
    }

    // Agrupar por categoria
    const categories = ideas?.reduce((acc: any, idea) => {
      if (!acc[idea.category]) {
        acc[idea.category] = [];
      }
      acc[idea.category].push(idea.title);
      return acc;
    }, {}) || {};

    return NextResponse.json({
      status: 'success',
      message: 'Categorias carregadas com sucesso',
      totalIdeas: ideas?.length || 0,
      categories,
      allIdeas: ideas
    });

  } catch (error) {
    console.error('Erro no teste de categorias:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
