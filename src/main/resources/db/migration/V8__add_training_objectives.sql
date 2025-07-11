-- 为courses表添加培养目标字段
ALTER TABLE courses ADD COLUMN training_objectives TEXT;

-- 为questions表添加培养目标字段
ALTER TABLE questions ADD COLUMN training_objective VARCHAR(500);

-- 添加索引以提高查询性能
CREATE INDEX idx_questions_training_objective ON questions(training_objective);

-- 更新现有数据的注释
COMMENT ON COLUMN courses.training_objectives IS '课程培养目标，JSON格式存储多个培养目标';
COMMENT ON COLUMN questions.training_objective IS '题目关联的培养目标'; 