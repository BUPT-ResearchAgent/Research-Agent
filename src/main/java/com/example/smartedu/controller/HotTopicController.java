package com.example.smartedu.controller;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.smartedu.entity.HotTopic;
import com.example.smartedu.service.HotTopicService;

@RestController
@RequestMapping("/api/hot-topics")
public class HotTopicController {
    
    private static final Logger logger = LoggerFactory.getLogger(HotTopicController.class);
    
    @Autowired
    private HotTopicService hotTopicService;
    
    /**
     * 获取最新热点列表
     */
    @GetMapping("/latest")
    public ResponseEntity<Map<String, Object>> getLatestHotTopics(
            @RequestParam(defaultValue = "10") int limit) {
        try {
            List<HotTopic> topics = hotTopicService.getLatestHotTopics(limit);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", topics);
            response.put("count", topics.size());
            response.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("获取最新热点失败", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "获取热点数据失败");
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    /**
     * 分页获取热点
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getHotTopics(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            Page<HotTopic> topicsPage = hotTopicService.getHotTopicsPage(page, size);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", topicsPage.getContent());
            response.put("totalElements", topicsPage.getTotalElements());
            response.put("totalPages", topicsPage.getTotalPages());
            response.put("currentPage", page);
            response.put("size", size);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("分页获取热点失败", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "获取热点数据失败");
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    /**
     * 根据分类获取热点
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<Map<String, Object>> getHotTopicsByCategory(@PathVariable String category) {
        try {
            List<HotTopic> topics = hotTopicService.getHotTopicsByCategory(category);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", topics);
            response.put("category", category);
            response.put("count", topics.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("根据分类获取热点失败", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "获取分类热点失败");
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    /**
     * 获取热门热点
     */
    @GetMapping("/popular")
    public ResponseEntity<Map<String, Object>> getPopularHotTopics(
            @RequestParam(defaultValue = "10") int limit) {
        try {
            List<HotTopic> topics = hotTopicService.getPopularHotTopics(limit);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", topics);
            response.put("count", topics.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("获取热门热点失败", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "获取热门热点失败");
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    /**
     * 搜索热点
     */
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchHotTopics(@RequestParam String keyword) {
        try {
            List<HotTopic> topics = hotTopicService.searchHotTopics(keyword);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", topics);
            response.put("keyword", keyword);
            response.put("count", topics.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("搜索热点失败", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "搜索热点失败");
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    /**
     * 获取热点详情
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getHotTopicDetail(@PathVariable Long id) {
        try {
            Optional<HotTopic> optionalTopic = hotTopicService.getHotTopicById(id);
            
            if (optionalTopic.isPresent()) {
                HotTopic topic = optionalTopic.get();
                // 增加浏览次数
                hotTopicService.incrementViewCount(id);
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("data", topic);
                
                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "热点不存在");
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            logger.error("获取热点详情失败", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "获取热点详情失败");
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    /**
     * 获取热点统计信息
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getHotTopicStats() {
        try {
            HotTopicService.HotTopicStats stats = hotTopicService.getHotTopicStats();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", stats);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("获取热点统计失败", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "获取统计信息失败");
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    /**
     * 手动刷新热点数据
     */
    @PostMapping("/refresh")
    public ResponseEntity<Map<String, Object>> refreshHotTopics() {
        try {
            hotTopicService.refreshHotTopics();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "热点数据刷新已启动");
            response.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("刷新热点数据失败", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "刷新热点数据失败");
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    /**
     * 初始化示例数据
     */
    @PostMapping("/init")
    public ResponseEntity<Map<String, Object>> initializeSampleData() {
        try {
            hotTopicService.initializeSampleData();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "示例数据初始化完成");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("初始化示例数据失败", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "初始化数据失败");
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
}
