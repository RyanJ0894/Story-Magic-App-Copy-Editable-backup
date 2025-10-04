-- Update the first created user to be Master (owner)
-- This ensures at least one user can invite team members

UPDATE profiles 
SET role = 'Master'
WHERE user_id = (
  SELECT user_id 
  FROM profiles 
  ORDER BY created_at ASC 
  LIMIT 1
);