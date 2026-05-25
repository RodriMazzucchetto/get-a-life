-- Tasks pendentes de reclassificação que ficaram em semana atual / em progresso
-- após a migração Signal/Noise: concentrar no backlog sem perder dados.
UPDATE public.todos
SET
  status = 'backlog',
  updated_at = now()
WHERE needs_reclassification = true
  AND completed = false
  AND status IN ('current_week', 'in_progress');
