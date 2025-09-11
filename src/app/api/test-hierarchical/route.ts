import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createClient();
    
    // Testar se as tabelas existem
    const { data: subcategories, error: subError } = await supabase
      .from('subcategory')
      .select('*')
      .limit(5);
    
    const { data: ideas, error: ideasError } = await supabase
      .from('idea')
      .select(`
        *,
        subcategory:subcategory_id (
          id,
          name,
          category,
          created_at
        )
      `)
      .limit(5);

    return NextResponse.json({
      success: true,
      subcategories: {
        data: subcategories,
        error: subError,
        count: subcategories?.length || 0
      },
      ideas: {
        data: ideas,
        error: ideasError,
        count: ideas?.length || 0
      }
    });
  } catch (error) {
    console.error('Erro no teste hierárquico:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

