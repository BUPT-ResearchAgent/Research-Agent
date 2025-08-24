package com.example.smartedu.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.smartedu.entity.Notice;

@Repository
public interface NoticeRepository extends JpaRepository<Notice, Long> {
    List<Notice> findByCourseId(Long courseId);
    List<Notice> findByCourseIdOrderByCreatedAtDesc(Long courseId);

    // 根据教师ID获取通知列表
    List<Notice> findByTeacherIdOrderByCreatedAtDesc(Long teacherId);

    // 根据教师ID和目标类型获取通知列表
    List<Notice> findByTeacherIdAndTargetTypeOrderByCreatedAtDesc(Long teacherId, String targetType);

    // 获取全体学生通知（所有教师发布的全体通知）
    List<Notice> findByTargetTypeOrderByCreatedAtDesc(String targetType);

    // 新增：根据目标用户ID获取通知
    List<Notice> findByTargetUserIdOrderByCreatedAtDesc(Long targetUserId);

    // 获取学生相关的通知（包括全体通知和学生选课的课程通知）
    @Query("SELECT n FROM Notice n WHERE n.targetType = 'ALL' OR n.courseId IN :courseIds ORDER BY n.createdAt DESC")
    List<Notice> findStudentNotices(@Param("courseIds") List<Long> courseIds);

    void deleteByCourseId(Long courseId);
}