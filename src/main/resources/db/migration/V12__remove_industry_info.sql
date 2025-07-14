-- 删除教学产业信息相关的索引
DROP INDEX IF EXISTS idx_industry_info_type;
DROP INDEX IF EXISTS idx_industry_info_subject;
DROP INDEX IF EXISTS idx_industry_info_published;
DROP INDEX IF EXISTS idx_industry_info_active;

-- 删除教学产业信息表
DROP TABLE IF EXISTS industry_info; 