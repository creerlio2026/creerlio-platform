-- Create saved_templates table for storing named template configurations
-- Allows users to save multiple configurations of the same template

CREATE TABLE IF NOT EXISTS public.saved_templates (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  name TEXT NOT NULL,
  template_state JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure unique names per user and template combination
  CONSTRAINT saved_templates_user_template_name_unique UNIQUE (user_id, template_id, name)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_saved_templates_user_template ON public.saved_templates(user_id, template_id);
CREATE INDEX IF NOT EXISTS idx_saved_templates_user_id ON public.saved_templates(user_id);

-- Enable RLS
ALTER TABLE public.saved_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own saved templates
CREATE POLICY "Users can view their own saved templates"
  ON public.saved_templates
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own saved templates
CREATE POLICY "Users can insert their own saved templates"
  ON public.saved_templates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own saved templates
CREATE POLICY "Users can update their own saved templates"
  ON public.saved_templates
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own saved templates
CREATE POLICY "Users can delete their own saved templates"
  ON public.saved_templates
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_saved_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_saved_templates_updated_at
  BEFORE UPDATE ON public.saved_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_saved_templates_updated_at();
