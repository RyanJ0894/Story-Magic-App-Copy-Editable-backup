-- Update current user to Master role
UPDATE profiles 
SET role = 'Master', updated_at = now() 
WHERE user_id = 'db7adafc-237b-4e2e-8698-bee2154c0127';