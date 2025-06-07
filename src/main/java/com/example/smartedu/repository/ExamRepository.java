package com.example.smartedu.repository;

import com.example.smartedu.entity.Exam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamRepository extends JpaRepository<Exam, Long> {
    List<Exam> findByCourseId(Long courseId);
    List<Exam> findByCourseIdOrderByCreatedAtDesc(Long courseId);
    List<Exam> findByIsPublishedTrue();
    List<Exam> findByCourseIdAndIsPublishedTrue(Long courseId);
    @Query("SELECT e FROM Exam e WHERE e.course.teacherId = :teacherId")
    List<Exam> findByTeacherId(@Param("teacherId") Long teacherId);
} 