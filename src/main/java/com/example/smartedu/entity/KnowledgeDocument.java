package com.example.smartedu.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "knowledge_documents")
@Data
public class KnowledgeDocument {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "course_id", nullable = false)
    private Long courseId;
    
    @Column(name = "original_name", nullable = false)
    private String originalName;
    
    @Column(name = "stored_name", nullable = false) 
    private String storedName;
    
    @Column(name = "file_path", nullable = false)
    private String filePath;
    
    @Column(name = "file_type", nullable = false)
    private String fileType;
    
    @Column(name = "file_size")
    private Long fileSize;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "chunks_count")
    private Integer chunksCount;
    
    @Column(name = "processed", nullable = false)
    private Boolean processed = false;
    
    @Column(name = "uploaded_by")
    private Long uploadedBy; // 上传者的用户ID
    
    @Column(name = "upload_time")
    private LocalDateTime uploadTime;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(columnDefinition = "LONGTEXT")
    private String fileContent; // Base64编码的文件内容
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (uploadTime == null) {
            uploadTime = LocalDateTime.now();
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public String getFileContent() {
        return fileContent;
    }

    public void setFileContent(String fileContent) {
        this.fileContent = fileContent;
    }
} 