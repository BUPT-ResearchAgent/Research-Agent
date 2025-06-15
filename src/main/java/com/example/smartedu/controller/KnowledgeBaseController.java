package com.example.smartedu.controller;

import com.example.smartedu.service.KnowledgeBaseService;
import com.example.smartedu.service.VectorDatabaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/knowledge")
@CrossOrigin(origins = "*")
public class KnowledgeBaseController {
    
    @Autowired
    private KnowledgeBaseService knowledgeBaseService;
    
    /**
     * 处理单个文档
     */
    @PostMapping("/process")
    public ResponseEntity<Map<String, Object>> processDocument(
            @RequestParam Long courseId,
            @RequestParam String filePath,
            @RequestParam String fileName) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            KnowledgeBaseService.ProcessResult result = 
                knowledgeBaseService.processDocument(courseId, filePath, fileName);
            
            response.put("success", result.isSuccess());
            response.put("message", result.getMessage());
            response.put("chunksCount", result.getChunksCount());
            
            if (result.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "处理文档时发生异常: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 批量处理文档
     */
    @PostMapping("/batch-process")
    public ResponseEntity<Map<String, Object>> batchProcessDocuments(
            @RequestParam Long courseId,
            @RequestBody List<String> filePaths) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            KnowledgeBaseService.BatchProcessResult result = 
                knowledgeBaseService.batchProcessDocuments(courseId, filePaths);
            
            response.put("success", result.getFailCount() == 0);
            response.put("totalCount", result.getTotalCount());
            response.put("successCount", result.getSuccessCount());
            response.put("failCount", result.getFailCount());
            response.put("results", result.getResults());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "批量处理文档时发生异常: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 搜索知识库
     */
    @PostMapping("/search")
    public ResponseEntity<Map<String, Object>> searchKnowledge(
            @RequestParam Long courseId,
            @RequestParam String query,
            @RequestParam(defaultValue = "5") int topK) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<VectorDatabaseService.SearchResult> results = 
                knowledgeBaseService.searchKnowledge(courseId, query, topK);
            
            response.put("success", true);
            response.put("query", query);
            response.put("resultCount", results.size());
            response.put("results", results);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "搜索知识库时发生异常: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 获取课程知识库统计信息
     */
    @GetMapping("/stats/{courseId}")
    public ResponseEntity<Map<String, Object>> getKnowledgeStats(@PathVariable Long courseId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            KnowledgeBaseService.KnowledgeStats stats = 
                knowledgeBaseService.getKnowledgeStats(courseId);
            
            response.put("success", true);
            response.put("stats", stats);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "获取统计信息时发生异常: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 删除课程知识库
     */
    @DeleteMapping("/course/{courseId}")
    public ResponseEntity<Map<String, Object>> deleteCourseKnowledge(@PathVariable Long courseId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            boolean success = knowledgeBaseService.deleteCourseKnowledge(courseId);
            
            response.put("success", success);
            response.put("message", success ? "知识库删除成功" : "知识库删除失败");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "删除知识库时发生异常: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 健康检查接口
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "Knowledge Base Service");
        response.put("timestamp", System.currentTimeMillis());
        
        return ResponseEntity.ok(response);
    }
} 