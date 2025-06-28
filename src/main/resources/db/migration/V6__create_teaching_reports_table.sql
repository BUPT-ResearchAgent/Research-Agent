-- 创建教学改进建议报告表
CREATE TABLE teaching_reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(500) NOT NULL COMMENT '报告标题',
    file_name VARCHAR(255) COMMENT 'PDF文件名',
    content TEXT NOT NULL COMMENT '报告内容（Markdown格式）',
    analysis_scope VARCHAR(50) COMMENT '分析范围：COURSE, CHAPTER等',
    scope_text VARCHAR(200) COMMENT '分析范围显示文本',
    teacher_id BIGINT NOT NULL COMMENT '生成报告的教师ID',
    course_id BIGINT COMMENT '关联的课程ID（可选）',
    course_text VARCHAR(200) COMMENT '课程显示文本',
    generated_at DATETIME COMMENT 'AI生成时间',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录更新时间',
    file_size BIGINT COMMENT 'PDF文件大小（字节）',
    download_count INT DEFAULT 0 COMMENT '下载次数',
    is_deleted BOOLEAN DEFAULT FALSE COMMENT '软删除标记',
    
    -- 外键约束
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
    
    -- 索引
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_course_id (course_id),
    INDEX idx_created_at (created_at),
    INDEX idx_analysis_scope (analysis_scope),
    INDEX idx_is_deleted (is_deleted),
    INDEX idx_teacher_deleted (teacher_id, is_deleted, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='教学改进建议报告表'; 