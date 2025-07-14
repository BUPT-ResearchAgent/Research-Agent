package com.example.smartedu.repository;

import com.example.smartedu.entity.ClassroomSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ClassroomSessionRepository extends JpaRepository<ClassroomSession, Long> {
    
    // 根据会话代码查找会话
    Optional<ClassroomSession> findBySessionCode(String sessionCode);
    
    // 根据教师ID查找激活的会话
    List<ClassroomSession> findByTeacherIdAndIsActiveOrderByCreatedAtDesc(Long teacherId, Boolean isActive);
    
    // 根据课程ID查找会话
    List<ClassroomSession> findByCourseIdOrderByCreatedAtDesc(Long courseId);
    
    // 根据会话类型查找激活的会话
    List<ClassroomSession> findBySessionTypeAndIsActiveOrderByCreatedAtDesc(String sessionType, Boolean isActive);
    
    // 查找指定时间范围内的会话
    List<ClassroomSession> findByStartTimeBetweenOrderByStartTimeDesc(LocalDateTime start, LocalDateTime end);
    
    // 查找当前激活的会话
    List<ClassroomSession> findByIsActiveOrderByCreatedAtDesc(Boolean isActive);
    
    // 根据教师ID和课程ID查找会话
    List<ClassroomSession> findByTeacherIdAndCourseIdOrderByCreatedAtDesc(Long teacherId, Long courseId);
    
    // 统计教师的会话数量
    @Query("SELECT COUNT(s) FROM ClassroomSession s WHERE s.teacher.id = :teacherId")
    Long countByTeacherId(@Param("teacherId") Long teacherId);
    
    // 统计激活的会话数量
    Long countByIsActive(Boolean isActive);
    
    // 查找超过指定时间未更新的会话
    List<ClassroomSession> findByUpdatedAtBeforeAndIsActive(LocalDateTime dateTime, Boolean isActive);
} 