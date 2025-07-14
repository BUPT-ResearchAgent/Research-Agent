-- 创建站内消息表
CREATE TABLE IF NOT EXISTS messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sender_id BIGINT NOT NULL,
    sender_type VARCHAR(20) NOT NULL,
    sender_name VARCHAR(100) NOT NULL,
    receiver_id BIGINT NOT NULL,
    receiver_type VARCHAR(20) NOT NULL,
    receiver_name VARCHAR(100) NOT NULL,
    course_id BIGINT,
    content TEXT NOT NULL,
    message_type VARCHAR(20) NOT NULL DEFAULT 'text',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    
    -- 创建索引以提高查询性能
    INDEX idx_sender (sender_id, sender_type),
    INDEX idx_receiver (receiver_id, receiver_type),
    INDEX idx_conversation (sender_id, sender_type, receiver_id, receiver_type),
    INDEX idx_sent_at (sent_at),
    INDEX idx_unread (receiver_id, receiver_type, is_read),
    INDEX idx_course (course_id)
);

-- 如果需要，可以添加外键约束（可选）
-- ALTER TABLE messages ADD CONSTRAINT fk_messages_course 
--     FOREIGN KEY (course_id) REFERENCES course(id) ON DELETE SET NULL; 