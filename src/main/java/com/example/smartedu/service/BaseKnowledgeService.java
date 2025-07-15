package com.example.smartedu.service;

import com.example.smartedu.entity.Knowledge;
import com.example.smartedu.entity.KnowledgeDocument;
import com.example.smartedu.repository.KnowledgeRepository;
import com.example.smartedu.repository.KnowledgeDocumentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

/**
 * 基础知识库服务
 * 管理政策文档等基础知识，这些知识对所有课程可用
 */
@Service
public class BaseKnowledgeService {
    
    private static final Long BASE_KNOWLEDGE_COURSE_ID = 0L; // 基础知识库的特殊课程ID
    private static final String POLICY_DOCUMENTS_PATH = "policy_documents";
    
    @Autowired
    private DocumentProcessingService documentProcessingService;
    
    @Autowired
    private VectorDatabaseService vectorDatabaseService;
    
    @Autowired
    private KnowledgeRepository knowledgeRepository;
    
    @Autowired
    private KnowledgeDocumentRepository knowledgeDocumentRepository;
    
    /**
     * 初始化基础知识库
     */
    @Transactional
    public void initializeBaseKnowledge() {
        try {
            System.out.println("开始初始化基础知识库...");
            
            // 创建基础知识库的向量集合
            if (!vectorDatabaseService.createCollectionForCourse(BASE_KNOWLEDGE_COURSE_ID)) {
                System.err.println("创建基础知识库向量集合失败");
                return;
            }
            
            // 检查是否已经初始化过
            List<KnowledgeDocument> existingDocs = knowledgeDocumentRepository.findByCourseId(BASE_KNOWLEDGE_COURSE_ID);
            if (!existingDocs.isEmpty()) {
                System.out.println("基础知识库已存在 " + existingDocs.size() + " 个文档，跳过初始化");
                return;
            }
            
            // 加载政策文档
            loadPolicyDocuments();
            
            System.out.println("基础知识库初始化完成");
            
        } catch (Exception e) {
            System.err.println("初始化基础知识库失败: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * 加载政策文档到基础知识库
     */
    @Transactional
    public void loadPolicyDocuments() {
        try {
            Path policyDir = Paths.get(POLICY_DOCUMENTS_PATH);
            if (!Files.exists(policyDir)) {
                System.out.println("政策文档目录不存在: " + POLICY_DOCUMENTS_PATH);
                return;
            }
            
            System.out.println("开始加载政策文档...");
            
            // 遍历政策文档目录
            Files.list(policyDir)
                .filter(Files::isRegularFile)
                .filter(path -> path.toString().toLowerCase().endsWith(".txt"))
                .forEach(this::processPolicyDocument);
            
            System.out.println("政策文档加载完成");
            
        } catch (IOException e) {
            System.err.println("加载政策文档失败: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * 处理单个政策文档
     */
    private void processPolicyDocument(Path filePath) {
        try {
            String fileName = filePath.getFileName().toString();
            File file = filePath.toFile();
            
            System.out.println("处理政策文档: " + fileName);
            
            // 检查文档是否已存在
            List<KnowledgeDocument> existing = knowledgeDocumentRepository.findByCourseId(BASE_KNOWLEDGE_COURSE_ID);
            boolean alreadyExists = existing.stream()
                .anyMatch(doc -> doc.getOriginalName().equals(fileName));
            
            if (alreadyExists) {
                System.out.println("政策文档已存在，跳过: " + fileName);
                return;
            }
            
            // 提取文档内容
            String documentText = documentProcessingService.extractTextFromFile(file);
            if (documentText == null || documentText.trim().isEmpty()) {
                System.err.println("无法从政策文档中提取文本: " + fileName);
                return;
            }
            
            // 分割文档
            List<DocumentProcessingService.DocumentChunk> textChunks = 
                documentProcessingService.chunkText(documentText, fileName);
            
            if (textChunks.isEmpty()) {
                System.err.println("政策文档分块失败: " + fileName);
                return;
            }
            
            System.out.println("政策文档 " + fileName + " 分割成 " + textChunks.size() + " 个文本块");
            
            // 保存知识块到数据库
            List<Knowledge> knowledgeEntities = new ArrayList<>();
            List<VectorDatabaseService.DocumentChunk> vectorChunks = new ArrayList<>();
            
            for (DocumentProcessingService.DocumentChunk chunk : textChunks) {
                // 创建知识库记录
                Knowledge knowledge = new Knowledge();
                knowledge.setCourseId(BASE_KNOWLEDGE_COURSE_ID);
                knowledge.setFileName(fileName);
                knowledge.setFilePath(filePath.toString());
                knowledge.setChunkId(chunk.getId());
                knowledge.setContent(chunk.getContent());
                knowledge.setChunkIndex(chunk.getChunkIndex());
                knowledge.setProcessed(false);
                
                knowledgeEntities.add(knowledge);
                
                // 准备向量化数据
                vectorChunks.add(new VectorDatabaseService.DocumentChunk(
                    chunk.getId(), chunk.getContent()));
            }
            
            // 批量保存到数据库
            knowledgeRepository.saveAll(knowledgeEntities);
            
            // 向量化并存储到向量数据库
            boolean vectorStored = vectorDatabaseService.insertDocumentChunks(BASE_KNOWLEDGE_COURSE_ID, vectorChunks);
            if (!vectorStored) {
                System.err.println("政策文档向量存储失败: " + fileName);
                return;
            }
            
            // 更新处理状态
            for (Knowledge knowledge : knowledgeEntities) {
                knowledge.setProcessed(true);
            }
            knowledgeRepository.saveAll(knowledgeEntities);
            
            // 保存文档信息
            KnowledgeDocument knowledgeDoc = new KnowledgeDocument();
            knowledgeDoc.setCourseId(BASE_KNOWLEDGE_COURSE_ID);
            knowledgeDoc.setOriginalName(fileName);
            knowledgeDoc.setStoredName(fileName);
            knowledgeDoc.setFilePath(filePath.toString());
            knowledgeDoc.setFileType("txt");
            knowledgeDoc.setFileSize(file.length());
            knowledgeDoc.setDescription("政策文档 - " + fileName.replace(".txt", ""));
            knowledgeDoc.setChunksCount(textChunks.size());
            knowledgeDoc.setProcessed(true);
            knowledgeDoc.setUploadedBy(0L); // 系统自动上传
            knowledgeDoc.setUploadTime(LocalDateTime.now());
            
            // 存储文件内容为Base64
            try {
                byte[] fileBytes = Files.readAllBytes(filePath);
                String fileContentBase64 = Base64.getEncoder().encodeToString(fileBytes);
                knowledgeDoc.setFileContent(fileContentBase64);
            } catch (IOException e) {
                System.err.println("读取政策文档内容失败: " + fileName);
            }
            
            knowledgeDocumentRepository.save(knowledgeDoc);
            
            System.out.println("政策文档处理完成: " + fileName + "，生成 " + textChunks.size() + " 个知识块");
            
        } catch (Exception e) {
            System.err.println("处理政策文档失败: " + filePath.getFileName() + ", 错误: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * 获取基础知识库统计信息
     */
    public BaseKnowledgeStats getBaseKnowledgeStats() {
        BaseKnowledgeStats stats = new BaseKnowledgeStats();
        
        // 文档数量
        long documentCount = knowledgeDocumentRepository.countByCourseId(BASE_KNOWLEDGE_COURSE_ID);
        stats.setDocumentCount(documentCount);
        
        // 知识块数量
        List<Knowledge> knowledgeBlocks = knowledgeRepository.findByCourseId(BASE_KNOWLEDGE_COURSE_ID);
        stats.setTotalChunks(knowledgeBlocks.size());
        
        // 已处理的知识块数量
        long processedChunks = knowledgeBlocks.stream()
            .mapToLong(k -> k.getProcessed() ? 1 : 0)
            .sum();
        stats.setProcessedChunks((int) processedChunks);
        
        return stats;
    }
    
    /**
     * 搜索基础知识库
     */
    public List<VectorDatabaseService.SearchResult> searchBaseKnowledge(String query, int topK) {
        return vectorDatabaseService.search(BASE_KNOWLEDGE_COURSE_ID, query, topK);
    }
    
    /**
     * 重新加载政策文档
     */
    @Transactional
    public boolean reloadPolicyDocuments() {
        try {
            System.out.println("开始重新加载政策文档...");
            
            // 清理现有的基础知识库数据
            clearBaseKnowledge();
            
            // 重新加载
            loadPolicyDocuments();
            
            System.out.println("政策文档重新加载完成");
            return true;
            
        } catch (Exception e) {
            System.err.println("重新加载政策文档失败: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
    
    /**
     * 清理基础知识库数据
     */
    @Transactional
    public void clearBaseKnowledge() {
        try {
            // 删除知识块
            knowledgeRepository.deleteByCourseId(BASE_KNOWLEDGE_COURSE_ID);
            
            // 删除文档记录
            knowledgeDocumentRepository.deleteByCourseId(BASE_KNOWLEDGE_COURSE_ID);
            
            // 重建向量集合
            vectorDatabaseService.rebuildCollectionForCourse(BASE_KNOWLEDGE_COURSE_ID);
            
            System.out.println("基础知识库数据清理完成");
            
        } catch (Exception e) {
            System.err.println("清理基础知识库失败: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * 基础知识库统计信息
     */
    public static class BaseKnowledgeStats {
        private long documentCount;
        private int totalChunks;
        private int processedChunks;
        
        // Getters and Setters
        public long getDocumentCount() { return documentCount; }
        public void setDocumentCount(long documentCount) { this.documentCount = documentCount; }
        
        public int getTotalChunks() { return totalChunks; }
        public void setTotalChunks(int totalChunks) { this.totalChunks = totalChunks; }
        
        public int getProcessedChunks() { return processedChunks; }
        public void setProcessedChunks(int processedChunks) { this.processedChunks = processedChunks; }
    }
} 