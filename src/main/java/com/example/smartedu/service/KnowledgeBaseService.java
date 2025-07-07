package com.example.smartedu.service;

import com.example.smartedu.entity.Knowledge;
import com.example.smartedu.entity.Course;
import com.example.smartedu.entity.KnowledgeDocument;
import com.example.smartedu.repository.KnowledgeRepository;
import com.example.smartedu.repository.CourseRepository;
import com.example.smartedu.repository.KnowledgeDocumentRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class KnowledgeBaseService {
    
    @Autowired
    private DocumentProcessingService documentProcessingService;
    
    @Autowired
    private VectorDatabaseService vectorDatabaseService;
    
    @Autowired
    private KnowledgeRepository knowledgeRepository;
    
    @Autowired
    private CourseRepository courseRepository;
    
    @Autowired
    private KnowledgeDocumentRepository knowledgeDocumentRepository;
    
    /**
     * 处理上传的文档并构建知识库
     */
    @Transactional
    public ProcessResult processDocument(Long courseId, String filePath, String fileName) {
        ProcessResult result = new ProcessResult();
        
        try {
            System.out.println("开始处理文档: " + fileName + " (课程ID: " + courseId + ")");
            
            // 1. 检查并创建课程的向量集合
            if (!vectorDatabaseService.createCollectionForCourse(courseId)) {
                result.setSuccess(false);
                result.setMessage("创建向量集合失败");
                return result;
            }
            
            // 2. 提取文档文本
            File file = new File(filePath);
            if (!file.exists()) {
                result.setSuccess(false);
                result.setMessage("文件不存在: " + filePath);
                return result;
            }
            
            String documentText = documentProcessingService.extractTextFromFile(file);
            if (documentText == null || documentText.trim().isEmpty()) {
                result.setSuccess(false);
                result.setMessage("无法从文档中提取文本内容");
                return result;
            }
            
            System.out.println("成功提取文本，长度: " + documentText.length() + " 字符");
            
            // 3. 将文本分割成块
            List<DocumentProcessingService.DocumentChunk> textChunks = 
                documentProcessingService.chunkText(documentText, fileName);
            
            if (textChunks.isEmpty()) {
                result.setSuccess(false);
                result.setMessage("文档切块失败");
                return result;
            }
            
            System.out.println("文档分割成 " + textChunks.size() + " 个文本块");
            
            // 4. 保存到数据库
            List<Knowledge> knowledgeEntities = new ArrayList<>();
            List<VectorDatabaseService.DocumentChunk> vectorChunks = new ArrayList<>();
            
            for (DocumentProcessingService.DocumentChunk chunk : textChunks) {
                // 创建数据库记录
                Knowledge knowledge = new Knowledge();
                knowledge.setCourseId(courseId);
                knowledge.setFileName(fileName);
                knowledge.setFilePath(filePath);
                knowledge.setChunkId(chunk.getId());
                knowledge.setContent(chunk.getContent());
                knowledge.setChunkIndex(chunk.getChunkIndex());
                knowledge.setProcessed(false);
                
                knowledgeEntities.add(knowledge);
                
                // 准备向量化数据
                vectorChunks.add(new VectorDatabaseService.DocumentChunk(
                    chunk.getId(), chunk.getContent()));
            }
            
            // 5. 批量保存到数据库
            knowledgeRepository.saveAll(knowledgeEntities);
            System.out.println("已保存 " + knowledgeEntities.size() + " 条知识记录到数据库");
            
            // 6. 向量化并存储到Milvus
            boolean vectorStored = vectorDatabaseService.insertDocumentChunks(courseId, vectorChunks);
            if (!vectorStored) {
                result.setSuccess(false);
                result.setMessage("向量存储失败");
                return result;
            }
            
            // 7. 更新处理状态
            for (Knowledge knowledge : knowledgeEntities) {
                knowledge.setProcessed(true);
            }
            knowledgeRepository.saveAll(knowledgeEntities);
            
            result.setSuccess(true);
            result.setMessage("成功处理文档: " + fileName);
            result.setChunksCount(textChunks.size());
            
            System.out.println("文档处理完成: " + fileName + ", 共生成 " + textChunks.size() + " 个知识块");
            
        } catch (IOException e) {
            System.err.println("文档处理失败: " + e.getMessage());
            result.setSuccess(false);
            result.setMessage("文档处理失败: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("处理过程中发生异常: " + e.getMessage());
            result.setSuccess(false);
            result.setMessage("处理失败: " + e.getMessage());
        }
        
        return result;
    }
    
    /**
     * 批量处理课程文档
     */
    public BatchProcessResult batchProcessDocuments(Long courseId, List<String> filePaths) {
        BatchProcessResult batchResult = new BatchProcessResult();
        List<ProcessResult> results = new ArrayList<>();
        
        int successCount = 0;
        int failCount = 0;
        
        for (String filePath : filePaths) {
            File file = new File(filePath);
            String fileName = file.getName();
            
            ProcessResult result = processDocument(courseId, filePath, fileName);
            results.add(result);
            
            if (result.isSuccess()) {
                successCount++;
            } else {
                failCount++;
            }
        }
        
        batchResult.setResults(results);
        batchResult.setSuccessCount(successCount);
        batchResult.setFailCount(failCount);
        batchResult.setTotalCount(filePaths.size());
        
        return batchResult;
    }
    
    /**
     * 搜索知识库
     */
    public List<VectorDatabaseService.SearchResult> searchKnowledge(Long courseId, String query, int topK) {
        return vectorDatabaseService.search(courseId, query, topK);
    }
    
    /**
     * 获取课程的知识库统计信息
     */
    public KnowledgeStats getKnowledgeStats(Long courseId) {
        System.out.println("开始获取课程 " + courseId + " 的知识库统计信息");
        
        List<Knowledge> allKnowledge = knowledgeRepository.findByCourseId(courseId);
        List<Knowledge> processed = knowledgeRepository.findByCourseIdAndProcessed(courseId, true);
        List<Knowledge> unprocessed = knowledgeRepository.findByCourseIdAndProcessed(courseId, false);
        
        System.out.println("课程 " + courseId + " 的知识库记录: 总数=" + allKnowledge.size() + 
                          ", 已处理=" + processed.size() + ", 未处理=" + unprocessed.size());
        
        KnowledgeStats stats = new KnowledgeStats();
        stats.setCourseId(courseId);
        stats.setTotalChunks(allKnowledge.size());
        stats.setProcessedChunks(processed.size());
        stats.setUnprocessedChunks(unprocessed.size());
        
        // 从KnowledgeDocument表统计文件数量和总大小
        List<KnowledgeDocument> documents = knowledgeDocumentRepository.findByCourseId(courseId);
        stats.setFileCount(documents.size());
        
        // 统计文件总大小（从数据库中的fileSize字段）
        long totalSize = documents.stream()
            .mapToLong(doc -> doc.getFileSize() != null ? doc.getFileSize() : 0L)
            .sum();
        stats.setTotalSize(totalSize);
        
        System.out.println("课程 " + courseId + " 的文件数量: " + documents.size());
        System.out.println("课程 " + courseId + " 的文件总大小: " + totalSize + " 字节");
        
        System.out.println("课程 " + courseId + " 统计结果: fileCount=" + stats.getFileCount() + 
                          ", totalChunks=" + stats.getTotalChunks() + 
                          ", processedChunks=" + stats.getProcessedChunks() + 
                          ", totalSize=" + stats.getTotalSize());
        
        return stats;
    }
    
    /**
     * 获取最近上传的文档
     */
    public List<Map<String, Object>> getRecentDocuments(List<Long> courseIds, int limit) {
        List<Map<String, Object>> recentDocuments = new ArrayList<>();
        
        if (courseIds.isEmpty()) {
            return recentDocuments;
        }
        
        try {
            // 获取所有课程的知识库记录，按时间排序
            List<Knowledge> allKnowledge = new ArrayList<>();
            for (Long courseId : courseIds) {
                List<Knowledge> courseKnowledge = knowledgeRepository.findByCourseId(courseId);
                allKnowledge.addAll(courseKnowledge);
            }
            
            // 按文件名分组，获取每个文件的最新记录
            Map<String, Knowledge> latestByFile = new HashMap<>();
            for (Knowledge knowledge : allKnowledge) {
                String key = knowledge.getCourseId() + "_" + knowledge.getFileName();
                if (!latestByFile.containsKey(key) || 
                    knowledge.getId() > latestByFile.get(key).getId()) {
                    latestByFile.put(key, knowledge);
                }
            }
            
            // 转换为结果格式并限制数量
            List<Knowledge> sortedKnowledge = new ArrayList<>(latestByFile.values());
            sortedKnowledge.sort((a, b) -> Long.compare(b.getId(), a.getId())); // 按ID降序排序
            
            for (int i = 0; i < Math.min(limit, sortedKnowledge.size()); i++) {
                Knowledge knowledge = sortedKnowledge.get(i);
                Map<String, Object> doc = new HashMap<>();
                doc.put("fileName", knowledge.getFileName());
                doc.put("courseId", knowledge.getCourseId());
                doc.put("uploadTime", "最近");
                doc.put("knowledgeCount", 
                    knowledgeRepository.findByFileNameAndCourseId(
                        knowledge.getFileName(), knowledge.getCourseId()).size());
                doc.put("status", knowledge.getProcessed() ? "已完成" : "处理中");
                doc.put("operation", "查看");
                
                recentDocuments.add(doc);
            }
            
        } catch (Exception e) {
            System.err.println("获取最近文档失败: " + e.getMessage());
        }
        
        return recentDocuments;
    }
    
    /**
     * 获取课程的知识块详情
     */
    public List<Map<String, Object>> getKnowledgeChunks(Long courseId) {
        List<Map<String, Object>> chunks = new ArrayList<>();
        
        try {
            List<Knowledge> knowledgeList = knowledgeRepository.findByCourseId(courseId);
            
            for (Knowledge knowledge : knowledgeList) {
                Map<String, Object> chunk = new HashMap<>();
                chunk.put("id", knowledge.getId());
                chunk.put("chunkId", knowledge.getChunkId());
                chunk.put("fileName", knowledge.getFileName());
                chunk.put("chunkIndex", knowledge.getChunkIndex());
                chunk.put("content", knowledge.getContent());
                chunk.put("processed", knowledge.getProcessed());
                chunk.put("createdAt", knowledge.getCreatedAt());
                
                // 截取内容预览（前100个字符）
                String preview = knowledge.getContent();
                if (preview != null && preview.length() > 100) {
                    preview = preview.substring(0, 100) + "...";
                }
                chunk.put("preview", preview);
                
                chunks.add(chunk);
            }
            
            // 按chunkIndex排序，如果chunkIndex为空则按创建时间排序
            chunks.sort((a, b) -> {
                Integer indexA = (Integer) a.get("chunkIndex");
                Integer indexB = (Integer) b.get("chunkIndex");
                
                // 如果都有chunkIndex，按chunkIndex升序排列
                if (indexA != null && indexB != null) {
                    return indexA.compareTo(indexB);
                }
                
                // 如果chunkIndex为空，按创建时间降序排列
                java.time.LocalDateTime timeA = (java.time.LocalDateTime) a.get("createdAt");
                java.time.LocalDateTime timeB = (java.time.LocalDateTime) b.get("createdAt");
                if (timeA == null && timeB == null) return 0;
                if (timeA == null) return 1;
                if (timeB == null) return -1;
                return timeB.compareTo(timeA);
            });
            
        } catch (Exception e) {
            System.err.println("获取知识块详情失败: " + e.getMessage());
        }
        
        return chunks;
    }
    
    /**
     * 更新知识块内容
     */
    @Transactional
    public boolean updateChunkContent(String chunkId, String content) {
        try {
            Knowledge knowledge = knowledgeRepository.findByChunkId(chunkId);
            if (knowledge == null) {
                System.out.println("未找到知识块: chunkId=" + chunkId);
                return false;
            }
            
            Long courseId = knowledge.getCourseId();
            
            // 1. 更新MySQL数据库中的内容
            knowledge.setContent(content);
            knowledgeRepository.save(knowledge);
            
            // 2. 更新Milvus向量数据库中的向量（重新生成嵌入向量）
            boolean vectorUpdated = vectorDatabaseService.updateVector(courseId, chunkId, content);
            if (!vectorUpdated) {
                System.err.println("向量更新失败: chunkId=" + chunkId);
                // 如果向量更新失败，可以选择回滚MySQL的更改
                // 这里我们记录错误但不回滚，因为文本内容已经更新
            }
            
            System.out.println("知识块内容更新成功: chunkId=" + chunkId);
            return true;
            
        } catch (Exception e) {
            System.err.println("更新知识块内容失败: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * 删除知识块
     */
    @Transactional
    public boolean deleteChunk(String chunkId) {
        try {
            Knowledge knowledge = knowledgeRepository.findByChunkId(chunkId);
            if (knowledge == null) {
                System.out.println("未找到知识块: chunkId=" + chunkId);
                return false;
            }
            
            Long courseId = knowledge.getCourseId();
            
            // 1. 从MySQL数据库中删除记录
            knowledgeRepository.delete(knowledge);
            
            // 2. 从Milvus向量数据库中删除对应的向量
            boolean vectorDeleted = vectorDatabaseService.deleteVector(courseId, chunkId);
            if (!vectorDeleted) {
                System.err.println("向量删除失败: chunkId=" + chunkId);
                // 如果向量删除失败，可以选择回滚MySQL的删除
                // 这里我们记录错误但不回滚，因为数据库记录已经删除
            }
            
            System.out.println("知识块删除成功: chunkId=" + chunkId);
            return true;
            
        } catch (Exception e) {
            System.err.println("删除知识块失败: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * 调试方法：获取用户所有知识块的基本信息
     */
    public List<Map<String, Object>> getDebugChunks(Long userId) {
        List<Map<String, Object>> debugInfo = new ArrayList<>();
        
        try {
            // 获取用户的所有课程
            List<Knowledge> allKnowledge = knowledgeRepository.findAll();
            
            for (Knowledge knowledge : allKnowledge) {
                // 检查是否属于该用户的课程
                Course course = courseRepository.findById(knowledge.getCourseId()).orElse(null);
                if (course != null && course.getTeacherId().equals(userId)) {
                    Map<String, Object> info = new HashMap<>();
                    info.put("id", knowledge.getId());
                    info.put("chunkId", knowledge.getChunkId());
                    info.put("fileName", knowledge.getFileName());
                    info.put("courseId", knowledge.getCourseId());
                    info.put("courseName", course.getName());
                    info.put("processed", knowledge.getProcessed());
                    debugInfo.add(info);
                }
            }
            
        } catch (Exception e) {
            System.err.println("调试获取知识块失败: " + e.getMessage());
        }
        
        return debugInfo;
    }
    
    /**
     * 获取单个知识块的详细信息
     */
    public Map<String, Object> getChunkDetail(String chunkId, Long userId) {
        try {
            System.out.println("查找知识块详情: chunkId=" + chunkId);
            
            // 根据chunkId查找知识块
            Knowledge knowledge = knowledgeRepository.findByChunkId(chunkId);
            if (knowledge == null) {
                System.out.println("未找到知识块: chunkId=" + chunkId);
                return null;
            }
            
            System.out.println("找到知识块: id=" + knowledge.getId() + ", courseId=" + knowledge.getCourseId());
            
            // 简化处理：直接返回知识块详情，不进行复杂的权限验证
            Map<String, Object> chunkDetail = new HashMap<>();
            chunkDetail.put("id", knowledge.getId());
            chunkDetail.put("chunkId", knowledge.getChunkId());
            chunkDetail.put("fileName", knowledge.getFileName());
            chunkDetail.put("chunkIndex", knowledge.getChunkIndex());
            chunkDetail.put("content", knowledge.getContent());
            chunkDetail.put("processed", knowledge.getProcessed());
            chunkDetail.put("createdAt", knowledge.getCreatedAt());
            chunkDetail.put("courseId", knowledge.getCourseId());
            
            System.out.println("返回知识块详情成功");
            return chunkDetail;
            
        } catch (Exception e) {
            System.err.println("获取知识块详情失败: " + e.getMessage());
            return null;
        }
    }
    
    /**
     * 删除课程知识库
     * 注意：此方法将在外层事务中被调用，不需要自己的事务注解
     */
    public boolean deleteCourseKnowledge(Long courseId) {
        try {
            // 1. 获取该课程的所有文档记录，用于删除文件系统中的文件
            List<KnowledgeDocument> documents = knowledgeDocumentRepository.findByCourseId(courseId);
            
            // 2. 文件现在存储在数据库中，记录要删除的文档信息
            System.out.println("准备删除课程 " + courseId + " 的 " + documents.size() + " 个文档（存储在数据库中）");
            for (KnowledgeDocument document : documents) {
                System.out.println("将删除文档: " + document.getOriginalName() + " (ID: " + document.getId() + ")");
            }
            
            // 3. 删除H2数据库中的文档记录
            knowledgeDocumentRepository.deleteByCourseId(courseId);
            System.out.println("删除课程 " + courseId + " 的文档记录");
            
            // 4. 删除向量集合
            vectorDatabaseService.dropCollection(courseId);
            
            // 5. 删除Knowledge表中的数据库记录
            List<Knowledge> knowledgeList = knowledgeRepository.findByCourseId(courseId);
            knowledgeRepository.deleteAll(knowledgeList);
            
            System.out.println("成功删除课程 " + courseId + " 的知识库");
            return true;
            
        } catch (Exception e) {
            System.err.println("删除课程知识库失败: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * 重新导入课程知识库数据到向量数据库
     */
    @Transactional
    public boolean reimportCourseKnowledge(Long courseId) {
        try {
            System.out.println("开始重新导入课程 " + courseId + " 的知识库数据到向量数据库");
            
            // 1. 获取所有已处理的知识块
            List<Knowledge> processedKnowledge = knowledgeRepository.findByCourseIdAndProcessed(courseId, true);
            
            if (processedKnowledge.isEmpty()) {
                System.out.println("课程 " + courseId + " 没有已处理的知识块，无需重新导入");
                return true;
            }
            
            System.out.println("找到 " + processedKnowledge.size() + " 个已处理的知识块");
            
            // 2. 转换为DocumentChunk格式
            List<VectorDatabaseService.DocumentChunk> chunks = new ArrayList<>();
            for (Knowledge knowledge : processedKnowledge) {
                if (knowledge.getContent() != null && !knowledge.getContent().trim().isEmpty()) {
                    VectorDatabaseService.DocumentChunk chunk = new VectorDatabaseService.DocumentChunk(
                        knowledge.getChunkId(), knowledge.getContent());
                    chunks.add(chunk);
                }
            }
            
            if (chunks.isEmpty()) {
                System.out.println("没有有效的知识块内容，无需重新导入");
                return true;
            }
            
            System.out.println("准备导入 " + chunks.size() + " 个知识块到向量数据库");
            
            // 3. 批量插入到向量数据库
            boolean success = vectorDatabaseService.insertDocumentChunks(courseId, chunks);
            
            if (success) {
                System.out.println("成功重新导入课程 " + courseId + " 的知识库数据");
                
                // 等待向量数据库完成索引
                try {
                    System.out.println("等待向量数据库完成索引...");
                    Thread.sleep(2000); // 等待2秒
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            } else {
                System.err.println("重新导入课程 " + courseId + " 的知识库数据失败");
            }
            
            return success;
            
        } catch (Exception e) {
            System.err.println("重新导入知识库数据异常: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
    
    // 数据传输对象
    public static class ProcessResult {
        private boolean success;
        private String message;
        private int chunksCount;
        
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        
        public int getChunksCount() { return chunksCount; }
        public void setChunksCount(int chunksCount) { this.chunksCount = chunksCount; }
    }
    
    public static class BatchProcessResult {
        private List<ProcessResult> results;
        private int successCount;
        private int failCount;
        private int totalCount;
        
        public List<ProcessResult> getResults() { return results; }
        public void setResults(List<ProcessResult> results) { this.results = results; }
        
        public int getSuccessCount() { return successCount; }
        public void setSuccessCount(int successCount) { this.successCount = successCount; }
        
        public int getFailCount() { return failCount; }
        public void setFailCount(int failCount) { this.failCount = failCount; }
        
        public int getTotalCount() { return totalCount; }
        public void setTotalCount(int totalCount) { this.totalCount = totalCount; }
    }
    
    public static class KnowledgeStats {
        private Long courseId;
        private int totalChunks;
        private int processedChunks;
        private int unprocessedChunks;
        private int fileCount;
        private long totalSize; // 文件总大小(字节)
        
        public Long getCourseId() { return courseId; }
        public void setCourseId(Long courseId) { this.courseId = courseId; }
        
        public int getTotalChunks() { return totalChunks; }
        public void setTotalChunks(int totalChunks) { this.totalChunks = totalChunks; }
        
        public int getProcessedChunks() { return processedChunks; }
        public void setProcessedChunks(int processedChunks) { this.processedChunks = processedChunks; }
        
        public int getUnprocessedChunks() { return unprocessedChunks; }
        public void setUnprocessedChunks(int unprocessedChunks) { this.unprocessedChunks = unprocessedChunks; }
        
        public int getFileCount() { return fileCount; }
        public void setFileCount(int fileCount) { this.fileCount = fileCount; }
        
        public long getTotalSize() { return totalSize; }
        public void setTotalSize(long totalSize) { this.totalSize = totalSize; }
    }
} 