package com.example.smartedu.repository;

import com.example.smartedu.entity.KnowledgeDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface KnowledgeDocumentRepository extends JpaRepository<KnowledgeDocument, Long> {
    
    /**
     * 根据课程ID查找知识库文档
     */
    List<KnowledgeDocument> findByCourseId(Long courseId);
    
    /**
     * 根据课程ID查找知识库文档，按上传时间倒序
     */
    List<KnowledgeDocument> findByCourseIdOrderByUploadTimeDesc(Long courseId);
    
    /**
     * 根据多个课程ID查找知识库文档
     */
    List<KnowledgeDocument> findByCourseIdInOrderByUploadTimeDesc(List<Long> courseIds);
    
    /**
     * 根据文件路径查找文档
     */
    Optional<KnowledgeDocument> findByFilePath(String filePath);
    
    /**
     * 根据上传者查找文档
     */
    List<KnowledgeDocument> findByUploadedByOrderByUploadTimeDesc(Long uploadedBy);
    
    /**
     * 统计课程的知识库文档数量
     */
    long countByCourseId(Long courseId);
    
    /**
     * 统计已处理的文档数量
     */
    long countByCourseIdAndProcessed(Long courseId, Boolean processed);
    
    /**
     * 查找最近上传的文档
     */
    @Query("SELECT kd FROM KnowledgeDocument kd WHERE kd.uploadTime > :since ORDER BY kd.uploadTime DESC")
    List<KnowledgeDocument> findRecentDocuments(@Param("since") LocalDateTime since);
    
    /**
     * 根据课程ID删除知识库文档
     */
    void deleteByCourseId(Long courseId);
    
    /**
     * 检查是否存在包含指定文件名的文档
     */
    boolean existsByOriginalNameContaining(String fileName);
    
    /**
     * 检查指定课程是否已经存在相同的原始文件名
     */
    boolean existsByCourseIdAndOriginalName(Long courseId, String originalName);
} 