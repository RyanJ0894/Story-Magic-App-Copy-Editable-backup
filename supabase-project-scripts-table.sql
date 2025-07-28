-- Create the project_scripts table for storing project script text
CREATE TABLE IF NOT EXISTS project_scripts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES user_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    script_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- Create an index for faster queries
CREATE INDEX IF NOT EXISTS idx_project_scripts_project_user ON project_scripts(project_id, user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE project_scripts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own project scripts" ON project_scripts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own project scripts" ON project_scripts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own project scripts" ON project_scripts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own project scripts" ON project_scripts
    FOR DELETE USING (auth.uid() = user_id);

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_project_scripts_updated_at 
    BEFORE UPDATE ON project_scripts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 