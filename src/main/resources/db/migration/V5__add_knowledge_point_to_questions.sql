-- 添加知识点字段到questions表
ALTER TABLE questions ADD COLUMN knowledge_point VARCHAR(100);
 
-- 为现有数据设置默认知识点
UPDATE questions SET knowledge_point = '未分类' WHERE knowledge_point IS NULL; 