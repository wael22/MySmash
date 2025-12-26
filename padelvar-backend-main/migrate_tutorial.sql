-- Migration pour ajouter les champs de tutoriel
ALTER TABLE user ADD COLUMN tutorial_completed BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE user ADD COLUMN tutorial_step INTEGER DEFAULT NULL;

-- Marquer tous les utilisateurs existants comme ayant complété le tutoriel  
UPDATE user SET tutorial_completed = 1 WHERE id > 0;
