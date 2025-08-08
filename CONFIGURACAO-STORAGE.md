# Configuração do Storage para Upload de Mídias

## Pré-requisitos

1. Ter um projeto Supabase configurado
2. Ter as variáveis de ambiente configuradas no `.env.local`

## Passo a Passo

### 1. Executar o Script SQL

1. Acesse o **SQL Editor** no seu projeto Supabase
2. Execute o script `setup-storage.sql` que está na raiz do projeto
3. Este script irá:
   - Criar o bucket `media` para armazenar fotos e vídeos
   - Configurar as políticas de segurança
   - Definir limites de tamanho (10MB) e tipos de arquivo permitidos

### 2. Verificar as Políticas de Segurança

O script cria as seguintes políticas:

- **Upload**: Usuários autenticados podem fazer upload
- **Visualização**: Usuários podem ver apenas suas próprias mídias
- **Atualização**: Usuários podem atualizar apenas suas próprias mídias
- **Exclusão**: Usuários podem deletar apenas suas próprias mídias

### 3. Tipos de Arquivo Suportados

- **Imagens**: JPG, PNG, GIF, WebP
- **Vídeos**: MP4, QuickTime, WebM
- **Tamanho máximo**: 10MB por arquivo

### 4. Estrutura de Pastas

Os arquivos são organizados da seguinte forma:
```
media/
├── memories/
│   ├── [memory-id]/
│   │   ├── foto1.jpg
│   │   ├── foto2.png
│   │   └── video1.mp4
│   └── [outro-memory-id]/
│       └── ...
```

### 5. Testando o Upload

1. Acesse a página de memórias
2. Clique em uma memória para abrir o modal
3. Tente fazer upload de uma foto ou vídeo
4. Verifique se o arquivo aparece na lista de mídias

### 6. Solução de Problemas

#### Erro de Permissão
Se receber erro de permissão, verifique:
- Se o usuário está autenticado
- Se as políticas de segurança foram criadas corretamente
- Se o bucket `media` existe

#### Erro de Upload
Se o upload falhar:
- Verifique o tamanho do arquivo (máximo 10MB)
- Verifique o tipo de arquivo (apenas imagens e vídeos)
- Verifique a conexão com a internet

#### Arquivos não aparecem
Se os arquivos não aparecem após o upload:
- Verifique se as URLs estão sendo salvas corretamente na tabela `memories`
- Verifique se o bucket está público
- Verifique as políticas de visualização

### 7. Limpeza de Arquivos

O script inclui uma função `cleanup_orphaned_media()` que pode ser executada para remover arquivos que não estão mais referenciados nas memórias.

### 8. Monitoramento

No painel do Supabase, você pode monitorar:
- **Storage**: Ver uso de espaço e arquivos
- **Logs**: Ver erros de upload e acesso
- **Database**: Ver registros na tabela `memories`

## Variáveis de Ambiente

Certifique-se de que estas variáveis estão configuradas no `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
```

## Próximos Passos

Após configurar o storage:
1. Teste o upload de diferentes tipos de arquivo
2. Verifique se as imagens aparecem corretamente na lista de memórias
3. Teste a funcionalidade de remoção de mídias
4. Monitore o uso de storage para otimizar custos 2