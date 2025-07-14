package com.example.smartedu.controller;

import com.example.smartedu.entity.IndustryInfo;
import com.example.smartedu.service.IndustryInfoService;
import com.example.smartedu.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/industry-info")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class IndustryInfoController {
    
    @Autowired
    private IndustryInfoService industryInfoService;
    
    // 获取所有激活的信息
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<IndustryInfo>>> getAllActiveInfos() {
        try {
            List<IndustryInfo> infos = industryInfoService.getAllActiveInfos();
            return ResponseEntity.ok(new ApiResponse<>(true, "获取成功", infos));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, "获取失败: " + e.getMessage(), null));
        }
    }
    
    // 根据类型获取信息
    @GetMapping("/type/{type}")
    public ResponseEntity<ApiResponse<List<IndustryInfo>>> getInfosByType(@PathVariable String type) {
        try {
            List<IndustryInfo> infos = industryInfoService.getInfosByType(type);
            return ResponseEntity.ok(new ApiResponse<>(true, "获取成功", infos));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, "获取失败: " + e.getMessage(), null));
        }
    }
    
    // 根据学科分类获取信息
    @GetMapping("/subject/{subjectCategory}")
    public ResponseEntity<ApiResponse<List<IndustryInfo>>> getInfosBySubjectCategory(@PathVariable String subjectCategory) {
        try {
            List<IndustryInfo> infos = industryInfoService.getInfosBySubjectCategory(subjectCategory);
            return ResponseEntity.ok(new ApiResponse<>(true, "获取成功", infos));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, "获取失败: " + e.getMessage(), null));
        }
    }
    
    // 获取最新信息
    @GetMapping("/latest")
    public ResponseEntity<ApiResponse<List<IndustryInfo>>> getLatestInfos(@RequestParam(defaultValue = "10") int limit) {
        try {
            List<IndustryInfo> infos = industryInfoService.getLatestInfos(limit);
            return ResponseEntity.ok(new ApiResponse<>(true, "获取成功", infos));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, "获取失败: " + e.getMessage(), null));
        }
    }
    
    // 根据关键词搜索
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<IndustryInfo>>> searchInfosByKeyword(@RequestParam String keyword) {
        try {
            List<IndustryInfo> infos = industryInfoService.searchInfosByKeyword(keyword);
            return ResponseEntity.ok(new ApiResponse<>(true, "搜索成功", infos));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, "搜索失败: " + e.getMessage(), null));
        }
    }
    
    // 获取热门信息
    @GetMapping("/popular")
    public ResponseEntity<ApiResponse<List<IndustryInfo>>> getPopularInfos(@RequestParam(defaultValue = "10") int limit) {
        try {
            List<IndustryInfo> infos = industryInfoService.getPopularInfos(limit);
            return ResponseEntity.ok(new ApiResponse<>(true, "获取成功", infos));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, "获取失败: " + e.getMessage(), null));
        }
    }
    
    // 根据重要性级别获取信息
    @GetMapping("/importance/{level}")
    public ResponseEntity<ApiResponse<List<IndustryInfo>>> getInfosByImportanceLevel(@PathVariable Integer level) {
        try {
            List<IndustryInfo> infos = industryInfoService.getInfosByImportanceLevel(level);
            return ResponseEntity.ok(new ApiResponse<>(true, "获取成功", infos));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, "获取失败: " + e.getMessage(), null));
        }
    }
    
    // 根据ID获取信息详情
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<IndustryInfo>> getInfoById(@PathVariable Long id) {
        try {
            Optional<IndustryInfo> infoOpt = industryInfoService.getInfoById(id);
            if (infoOpt.isPresent()) {
                // 增加查看次数
                industryInfoService.incrementViewCount(id);
                return ResponseEntity.ok(new ApiResponse<>(true, "获取成功", infoOpt.get()));
            } else {
                return ResponseEntity.ok(new ApiResponse<>(false, "信息不存在", null));
            }
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, "获取失败: " + e.getMessage(), null));
        }
    }
    
    // 获取统计信息
    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStatistics() {
        try {
            List<Object[]> typeStats = industryInfoService.getStatistics();
            Map<String, Object> statistics = new HashMap<>();
            
            Map<String, Long> typeCount = new HashMap<>();
            for (Object[] stat : typeStats) {
                typeCount.put((String) stat[0], (Long) stat[1]);
            }
            
            statistics.put("typeCount", typeCount);
            statistics.put("totalCount", typeCount.values().stream().mapToLong(Long::longValue).sum());
            
            return ResponseEntity.ok(new ApiResponse<>(true, "获取成功", statistics));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, "获取失败: " + e.getMessage(), null));
        }
    }
    
    // 获取最近一周的信息
    @GetMapping("/recent")
    public ResponseEntity<ApiResponse<List<IndustryInfo>>> getRecentInfos() {
        try {
            List<IndustryInfo> infos = industryInfoService.getRecentInfos();
            return ResponseEntity.ok(new ApiResponse<>(true, "获取成功", infos));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, "获取失败: " + e.getMessage(), null));
        }
    }
    
    // 手动触发信息抓取
    @PostMapping("/crawl")
    public ResponseEntity<ApiResponse<String>> crawlExternalInfo() {
        try {
            industryInfoService.crawlAndProcessExternalInfo();
            return ResponseEntity.ok(new ApiResponse<>(true, "信息抓取成功", "已成功抓取和处理外部信息"));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, "信息抓取失败: " + e.getMessage(), null));
        }
    }
    
    // 创建新信息（管理员功能）
    @PostMapping("/create")
    public ResponseEntity<ApiResponse<IndustryInfo>> createInfo(@RequestBody IndustryInfo info) {
        try {
            IndustryInfo savedInfo = industryInfoService.saveInfo(info);
            return ResponseEntity.ok(new ApiResponse<>(true, "创建成功", savedInfo));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, "创建失败: " + e.getMessage(), null));
        }
    }
    
    // 更新信息（管理员功能）
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<IndustryInfo>> updateInfo(@PathVariable Long id, @RequestBody IndustryInfo info) {
        try {
            info.setId(id);
            IndustryInfo updatedInfo = industryInfoService.saveInfo(info);
            return ResponseEntity.ok(new ApiResponse<>(true, "更新成功", updatedInfo));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, "更新失败: " + e.getMessage(), null));
        }
    }
    
    // 删除信息（管理员功能）
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteInfo(@PathVariable Long id) {
        try {
            industryInfoService.deactivateInfo(id);
            return ResponseEntity.ok(new ApiResponse<>(true, "删除成功", "信息已成功删除"));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, "删除失败: " + e.getMessage(), null));
        }
    }
} 