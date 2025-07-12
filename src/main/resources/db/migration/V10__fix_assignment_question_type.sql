-- 修复大作业题目类型识别问题
-- 将包含大作业关键词的题目类型标准化为'assignment'

-- 更新题目类型，将各种大作业相关的类型统一为'assignment'
UPDATE questions 
SET type = 'assignment' 
WHERE type IN ('大作业', '作业', 'homework', 'assignment_upload', 'file_upload')
   OR type LIKE '%作业%' 
   OR type LIKE '%assignment%'
   OR content LIKE '%上传%文档%'
   OR content LIKE '%提交%作业%'
   OR content LIKE '%上传%文件%'
   OR content LIKE '%附件%';

-- 为大作业题目设置默认分数（如果分数为空或过低）
UPDATE questions 
SET score = 50 
WHERE type = 'assignment' 
  AND (score IS NULL OR score < 20);

-- 添加索引以提高查询效率
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);
CREATE INDEX IF NOT EXISTS idx_questions_content ON questions(content); 