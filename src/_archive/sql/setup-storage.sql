-- Script para configurar o bucket de storage no Supabase
-- Execute este script no SQL Editor do Supabase

-- 1. Criar o bucket 'media' para armazenar fotos e vídeos das memórias
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  10485760, -- 10MB em bytes
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Configurar políticas de segurança para o bucket 'media'
-- Permitir que usuários autenticados façam upload de arquivos
CREATE POLICY "Usuários autenticados podem fazer upload de mídia" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'media' 
  AND auth.role() = 'authenticated'
);

-- Permitir que usuários autenticados vejam suas próprias mídias
CREATE POLICY "Usuários podem ver suas próprias mídias" ON storage.objects
FOR SELECT USING (
  bucket_id = 'media' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir que usuários autenticados atualizem suas próprias mídias
CREATE POLICY "Usuários podem atualizar suas próprias mídias" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'media' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir que usuários autenticados deletem suas próprias mídias
CREATE POLICY "Usuários podem deletar suas próprias mídias" ON storage.objects
FOR DELETE USING (
  bucket_id = 'media' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Função para limpar mídias órfãs (opcional)
CREATE OR REPLACE FUNCTION cleanup_orphaned_media()
RETURNS void AS $$
BEGIN
  -- Deletar arquivos que não estão referenciados na tabela memories
  DELETE FROM storage.objects 
  WHERE bucket_id = 'media'
  AND NOT EXISTS (
    SELECT 1 FROM memories 
    WHERE media::text LIKE '%' || name || '%'
  );
END;
$$ LANGUAGE plpgsql;

-- 4. Comentários sobre o uso
COMMENT ON TABLE storage.objects IS 'Tabela que armazena metadados dos arquivos no storage';
COMMENT ON FUNCTION cleanup_orphaned_media() IS 'Função para limpar arquivos de mídia que não estão mais referenciados nas memórias'; 