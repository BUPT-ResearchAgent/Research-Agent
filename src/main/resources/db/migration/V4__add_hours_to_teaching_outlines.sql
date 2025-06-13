-- 添加学时字段到教学大纲表
ALTER TABLE teaching_outlines ADD COLUMN hours INT DEFAULT NULL COMMENT '教学学时';
 
-- 为现有记录设置默认学时（可选，这里设为45学时）
UPDATE teaching_outlines SET hours = 45 WHERE hours IS NULL; 