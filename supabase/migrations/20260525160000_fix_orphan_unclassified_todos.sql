-- Tasks com classificação incompleta ficavam invisíveis no Kanban.
UPDATE public.todos
SET
  needs_reclassification = true,
  updated_at = now()
WHERE completed = false
  AND status IN ('backlog', 'current_week', 'in_progress')
  AND (
    task_type IS NULL
    OR (task_type = 'STRATEGIC' AND status_classification IS NULL)
    OR (task_type = 'LIFE_ADMIN' AND life_admin_subtype IS NULL)
  )
  AND COALESCE(needs_reclassification, false) = false;
