package com.example.smartedu.repository;

import com.example.smartedu.entity.Knowledge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KnowledgeRepository extends JpaRepository<Knowledge, Long> {
    
    List<Knowledge> findByCourseId(Long courseId);
    
    List<Knowledge> findByCourseIdAndProcessed(Long courseId, Boolean processed);
    
    List<Knowledge> findByFileNameAndCourseId(String fileName, Long courseId);
    
    @Query("SELECT k FROM Knowledge k WHERE k.courseId = :courseId AND k.processed = false")
    List<Knowledge> findUnprocessedByCourseId(@Param("courseId") Long courseId);
    
    void deleteByCourseIdAndFileName(Long courseId, String fileName);
    
    Knowledge findByChunkId(String chunkId);
} 