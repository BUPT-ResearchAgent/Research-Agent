-- 为questions表添加能力维度相关字段
ALTER TABLE questions ADD COLUMN primary_capability VARCHAR(50);
ALTER TABLE questions ADD COLUMN secondary_capabilities TEXT;
ALTER TABLE questions ADD COLUMN difficulty_level INTEGER DEFAULT 3;
ALTER TABLE questions ADD COLUMN cognitive_level VARCHAR(20) DEFAULT 'application';

-- 创建学生能力评估表
CREATE TABLE student_capability_assessment (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    exam_id BIGINT,
    capability_dimension VARCHAR(50) NOT NULL,
    score DECIMAL(5,2) NOT NULL,
    level_achieved INTEGER NOT NULL,
    assessment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE SET NULL,
    
    INDEX idx_student_capability (student_id, capability_dimension),
    INDEX idx_course_capability (course_id, capability_dimension),
    INDEX idx_assessment_date (assessment_date)
);

-- 创建能力发展轨迹表
CREATE TABLE capability_development_track (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    capability_dimension VARCHAR(50) NOT NULL,
    initial_level INTEGER,
    current_level INTEGER,
    target_level INTEGER,
    progress_rate DECIMAL(5,2),
    improvement_suggestions TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_student_course_capability (student_id, course_id, capability_dimension),
    INDEX idx_development_track (student_id, course_id)
);

-- 创建能力改进建议表
CREATE TABLE capability_improvement_suggestions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    capability_dimension VARCHAR(50) NOT NULL,
    weakness_description TEXT,
    improvement_methods TEXT,
    recommended_resources TEXT,
    practice_exercises TEXT,
    priority_level INTEGER DEFAULT 3,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    
    INDEX idx_student_improvement (student_id, course_id),
    INDEX idx_capability_priority (capability_dimension, priority_level)
);

-- 添加索引优化查询性能
CREATE INDEX idx_questions_primary_capability ON questions(primary_capability);
CREATE INDEX idx_questions_difficulty_level ON questions(difficulty_level);
CREATE INDEX idx_questions_cognitive_level ON questions(cognitive_level);

-- 添加字段注释
COMMENT ON COLUMN questions.primary_capability IS '主要考核的能力维度';
COMMENT ON COLUMN questions.secondary_capabilities IS '次要考核的能力维度，JSON格式存储';
COMMENT ON COLUMN questions.difficulty_level IS '能力难度等级，1-5级';
COMMENT ON COLUMN questions.cognitive_level IS '认知层次：memory, understanding, application, analysis, synthesis, evaluation';

-- 初始化现有题目的能力维度（设置默认值）
UPDATE questions SET 
    primary_capability = 'knowledge',
    difficulty_level = 3,
    cognitive_level = 'application'
WHERE primary_capability IS NULL; 