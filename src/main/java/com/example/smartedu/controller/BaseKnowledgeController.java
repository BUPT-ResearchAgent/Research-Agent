package com.example.smartedu.controller;

import com.example.smartedu.dto.ApiResponse;
import com.example.smartedu.entity.KnowledgeDocument;
import com.example.smartedu.repository.KnowledgeDocumentRepository;
import com.example.smartedu.service.BaseKnowledgeService;
import com.example.smartedu.service.VectorDatabaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/base-knowledge")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class BaseKnowledgeController {
    
    private static final Long BASE_KNOWLEDGE_COURSE_ID = 0L;
    
    @Autowired
    private BaseKnowledgeService baseKnowledgeService;
    
    @Autowired
    private KnowledgeDocumentRepository knowledgeDocumentRepository;
    
    /**
     * 获取基础知识库统计信息
     */
    @GetMapping("/stats")
    public ApiResponse<Map<String, Object>> getBaseKnowledgeStats() {
        try {
            BaseKnowledgeService.BaseKnowledgeStats stats = baseKnowledgeService.getBaseKnowledgeStats();
            
            Map<String, Object> response = new HashMap<>();
            response.put("documentCount", stats.getDocumentCount());
            response.put("totalChunks", stats.getTotalChunks());
            response.put("processedChunks", stats.getProcessedChunks());
            response.put("processingRate", 
                stats.getTotalChunks() > 0 ? 
                    (double) stats.getProcessedChunks() / stats.getTotalChunks() * 100 : 0);
            
            return ApiResponse.success("获取基础知识库统计信息成功", response);
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("获取统计信息失败：" + e.getMessage());
        }
    }
    
    /**
     * 获取基础知识库文档列表
     */
    @GetMapping("/documents")
    public ApiResponse<List<Map<String, Object>>> getBaseKnowledgeDocuments() {
        try {
            List<KnowledgeDocument> documents = knowledgeDocumentRepository.findByCourseIdOrderByUploadTimeDesc(BASE_KNOWLEDGE_COURSE_ID);
            
            List<Map<String, Object>> documentList = documents.stream().map(doc -> {
                Map<String, Object> docInfo = new HashMap<>();
                docInfo.put("id", doc.getId());
                docInfo.put("originalName", doc.getOriginalName());
                docInfo.put("fileType", doc.getFileType());
                docInfo.put("fileSize", doc.getFileSize());
                docInfo.put("description", doc.getDescription());
                docInfo.put("chunksCount", doc.getChunksCount());
                docInfo.put("uploadTime", doc.getUploadTime());
                docInfo.put("processed", doc.getProcessed());
                docInfo.put("filePath", doc.getFilePath());
                return docInfo;
            }).collect(java.util.stream.Collectors.toList());
            
            return ApiResponse.success("获取基础知识库文档成功", documentList);
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("获取文档列表失败：" + e.getMessage());
        }
    }
    
    /**
     * 重新加载政策文档
     */
    @PostMapping("/reload")
    public ApiResponse<String> reloadPolicyDocuments() {
        try {
            boolean success = baseKnowledgeService.reloadPolicyDocuments();
            
            if (success) {
                return ApiResponse.success("政策文档重新加载成功", "所有政策文档已重新处理并加载到基础知识库");
            } else {
                return ApiResponse.error("政策文档重新加载失败");
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("重新加载失败：" + e.getMessage());
        }
    }
    
    /**
     * 清理基础知识库
     */
    @DeleteMapping("/clear")
    public ApiResponse<String> clearBaseKnowledge() {
        try {
            baseKnowledgeService.clearBaseKnowledge();
            return ApiResponse.success("基础知识库清理成功", "所有基础知识库数据已清理");
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("清理基础知识库失败：" + e.getMessage());
        }
    }
    
    /**
     * 初始化基础知识库
     */
    @PostMapping("/initialize")
    public ApiResponse<String> initializeBaseKnowledge() {
        try {
            baseKnowledgeService.initializeBaseKnowledge();
            return ApiResponse.success("基础知识库初始化成功", "政策文档已加载到基础知识库");
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("初始化基础知识库失败：" + e.getMessage());
        }
    }
    
    /**
     * 测试基础知识库搜索
     */
    @PostMapping("/search")
    public ApiResponse<Map<String, Object>> testBaseKnowledgeSearch(@RequestBody Map<String, Object> request) {
        try {
            String query = (String) request.get("query");
            Integer topK = request.get("topK") != null ? 
                Integer.valueOf(request.get("topK").toString()) : 5;
            
            if (query == null || query.trim().isEmpty()) {
                return ApiResponse.error("查询内容不能为空");
            }
            
            List<VectorDatabaseService.SearchResult> searchResults = 
                baseKnowledgeService.searchBaseKnowledge(query, topK);
            
            List<Map<String, Object>> resultList = searchResults.stream().map(result -> {
                Map<String, Object> item = new HashMap<>();
                item.put("chunkId", result.getChunkId());
                item.put("content", result.getContent());
                item.put("score", result.getScore());
                item.put("courseId", result.getCourseId());
                return item;
            }).collect(java.util.stream.Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("query", query);
            response.put("results", resultList);
            response.put("totalCount", resultList.size());
            
            return ApiResponse.success("基础知识库搜索成功", response);
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("搜索失败：" + e.getMessage());
        }
    }
    
    /**
     * 获取基础知识库健康状态
     */
    @GetMapping("/health")
    public ApiResponse<Map<String, Object>> getBaseKnowledgeHealth() {
        try {
            Map<String, Object> health = new HashMap<>();
            
            // 统计信息
            BaseKnowledgeService.BaseKnowledgeStats stats = baseKnowledgeService.getBaseKnowledgeStats();
            health.put("documentCount", stats.getDocumentCount());
            health.put("totalChunks", stats.getTotalChunks());
            health.put("processedChunks", stats.getProcessedChunks());
            
            // 健康状态
            boolean isHealthy = stats.getDocumentCount() > 0 && 
                               stats.getProcessedChunks() > 0 && 
                               stats.getProcessedChunks() == stats.getTotalChunks();
            health.put("healthy", isHealthy);
            
            // 状态描述
            String status;
            if (stats.getDocumentCount() == 0) {
                status = "未初始化：没有找到政策文档";
            } else if (stats.getProcessedChunks() == 0) {
                status = "处理中：文档正在处理";
            } else if (stats.getProcessedChunks() < stats.getTotalChunks()) {
                status = "部分完成：" + stats.getProcessedChunks() + "/" + stats.getTotalChunks() + " 已处理";
            } else {
                status = "正常：所有文档已处理完成";
            }
            health.put("status", status);
            
            // 建议操作
            String recommendation = "";
            if (!isHealthy) {
                if (stats.getDocumentCount() == 0) {
                    recommendation = "请点击'初始化基础知识库'来加载政策文档";
                } else if (stats.getProcessedChunks() < stats.getTotalChunks()) {
                    recommendation = "部分文档处理失败，建议重新加载政策文档";
                }
            } else {
                recommendation = "基础知识库运行正常，可以为所有课程提供政策文档支持";
            }
            health.put("recommendation", recommendation);
            
            return ApiResponse.success("获取基础知识库健康状态成功", health);
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("获取健康状态失败：" + e.getMessage());
        }
    }
} 