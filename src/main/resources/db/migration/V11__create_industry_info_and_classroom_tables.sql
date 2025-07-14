

-- 创建课堂会话表
CREATE TABLE IF NOT EXISTS classroom_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_name VARCHAR(255) NOT NULL,
    session_code VARCHAR(8) NOT NULL UNIQUE,
    course_id BIGINT NOT NULL,
    teacher_id BIGINT NOT NULL,
    start_time DATETIME,
    end_time DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    max_participants INTEGER DEFAULT 100,
    current_participants INTEGER DEFAULT 0,
    session_type VARCHAR(50),
    description TEXT,
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

-- 创建课堂消息表
CREATE TABLE IF NOT EXISTS classroom_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    sender_name VARCHAR(255) NOT NULL,
    sender_type VARCHAR(20) NOT NULL,
    message_type VARCHAR(20) NOT NULL,
    content TEXT,
    file_url VARCHAR(500),
    file_name VARCHAR(255),
    is_system_message BOOLEAN DEFAULT FALSE,
    reply_to_id BIGINT,
    created_at DATETIME,
    updated_at DATETIME,
    is_deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (session_id) REFERENCES classroom_sessions(id)
);

-- 创建课堂参与者表
CREATE TABLE IF NOT EXISTS classroom_participants (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) NOT NULL,
    join_time DATETIME,
    leave_time DATETIME,
    is_online BOOLEAN DEFAULT TRUE,
    is_muted BOOLEAN DEFAULT FALSE,
    is_hand_raised BOOLEAN DEFAULT FALSE,
    permission_level VARCHAR(20) DEFAULT 'participant',
    last_activity DATETIME,
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (session_id) REFERENCES classroom_sessions(id),
    UNIQUE KEY unique_session_user (session_id, user_id)
);

-- 创建索引
CREATE INDEX idx_classroom_sessions_teacher ON classroom_sessions(teacher_id);
CREATE INDEX idx_classroom_sessions_course ON classroom_sessions(course_id);
CREATE INDEX idx_classroom_sessions_active ON classroom_sessions(is_active);
CREATE INDEX idx_classroom_sessions_code ON classroom_sessions(session_code);

CREATE INDEX idx_classroom_messages_session ON classroom_messages(session_id);
CREATE INDEX idx_classroom_messages_sender ON classroom_messages(sender_id);
CREATE INDEX idx_classroom_messages_created ON classroom_messages(created_at);

CREATE INDEX idx_classroom_participants_session ON classroom_participants(session_id);
CREATE INDEX idx_classroom_participants_user ON classroom_participants(user_id);
CREATE INDEX idx_classroom_participants_online ON classroom_participants(is_online); 