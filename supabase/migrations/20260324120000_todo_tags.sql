-- Ligação N:N entre tarefas e tags (base para evolução da UI de tags)
CREATE TABLE IF NOT EXISTS public.todo_tags (
  todo_id uuid NOT NULL REFERENCES public.todos (id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (todo_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_todo_tags_tag ON public.todo_tags (tag_id);

ALTER TABLE public.todo_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "todo_tags_own" ON public.todo_tags
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.todos t
      WHERE t.id = todo_tags.todo_id AND t.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.todos t
      WHERE t.id = todo_tags.todo_id AND t.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.tags g
      WHERE g.id = todo_tags.tag_id AND g.user_id = auth.uid()
    )
  );
