-- Life-Admin passa a usar colunas normais do Kanban (backlog), não status life_admin.
UPDATE public.todos
SET
  status = 'backlog',
  updated_at = now()
WHERE status = 'life_admin'
  AND completed = false;
