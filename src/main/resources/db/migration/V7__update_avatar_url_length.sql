-- 更新avatar_url字段的长度限制以支持Base64编码的图片数据
ALTER TABLE users ALTER COLUMN avatar_url SET DATA TYPE TEXT; 