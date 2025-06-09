package com.example.smartedu.repository;

import com.example.smartedu.entity.CourseMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseMaterialRepository extends JpaRepository<CourseMaterial, Long> {
    List<CourseMaterial> findByCourseId(Long courseId);
    List<CourseMaterial> findByCourseIdOrderByUploadedAtDesc(Long courseId);
    List<CourseMaterial> findByCourseIdInOrderByUploadedAtDesc(List<Long> courseIds);
    
    void deleteByCourseId(Long courseId);
} 