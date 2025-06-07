package com.example.smartedu.repository;

import com.example.smartedu.entity.TeachingOutline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeachingOutlineRepository extends JpaRepository<TeachingOutline, Long> {
    Optional<TeachingOutline> findByCourseId(Long courseId);
    
    @Query("SELECT t FROM TeachingOutline t JOIN FETCH t.course WHERE t.course.id = :courseId ORDER BY t.createdAt DESC")
    List<TeachingOutline> findByCourseIdOrderByCreatedAtDesc(@Param("courseId") Long courseId);
    
    @Query("SELECT t FROM TeachingOutline t JOIN FETCH t.course ORDER BY t.createdAt DESC")
    List<TeachingOutline> findAllByOrderByCreatedAtDesc();
} 