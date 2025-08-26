package com.example.smartedu.controller;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.smartedu.dto.ApiResponse;
import com.example.smartedu.service.DeepSeekService;
import com.example.smartedu.service.LinkValidationService;

import jakarta.servlet.http.HttpSession;

/**
 * 内容分析控制器
 * 提供基于DeepSeek的内容搜索、链接验证和审查功能
 */
@RestController
@RequestMapping("/api/content-analysis")
@CrossOrigin(origins = "http://localhost:8080", allowCredentials = "true")
public class ContentAnalysisController {

    @Autowired
    private LinkValidationService linkValidationService;

    @Autowired
    private DeepSeekService deepSeekService;

    /**
     * 执行内容分析
     */
    @PostMapping("/analyze")
    public ApiResponse<Map<String, Object>> analyzeContent(@RequestBody Map<String, Object> request, 
                                                          HttpSession session) {
        try {
            // 验证用户权限
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("用户未登录，请重新登录");
            }

            String role = (String) session.getAttribute("role");
            if (!"teacher".equals(role) && !"admin".equals(role)) {
                return ApiResponse.error("权限不足，仅教师和管理员可使用此功能");
            }

            String searchQuery = (String) request.get("searchQuery");
            if (searchQuery == null || searchQuery.trim().isEmpty()) {
                return ApiResponse.error("搜索查询不能为空");
            }

            System.out.println("开始内容分析，查询: " + searchQuery);

            // 执行内容分析，传入AI响应提供者
            LinkValidationService.ContentAnalysisResult result =
                linkValidationService.analyzeContent(searchQuery,
                    prompt -> deepSeekService.generateLearningAssistantResponse(prompt));

            // 构建响应数据
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("searchQuery", searchQuery);
            responseData.put("searchResponse", result.getSearchResponse());
            responseData.put("reliableLinks", result.getReliableLinks());
            responseData.put("unavailableLinks", result.getUnavailableLinks());
            responseData.put("reviewResponse", result.getReviewResponse());
            responseData.put("timestamp", System.currentTimeMillis());

            // 统计信息
            Map<String, Object> statistics = new HashMap<>();
            statistics.put("totalLinksFound", 
                (result.getReliableLinks() != null ? result.getReliableLinks().size() : 0) +
                (result.getUnavailableLinks() != null ? result.getUnavailableLinks().size() : 0));
            statistics.put("reliableLinksCount", 
                result.getReliableLinks() != null ? result.getReliableLinks().size() : 0);
            statistics.put("unavailableLinksCount", 
                result.getUnavailableLinks() != null ? result.getUnavailableLinks().size() : 0);
            responseData.put("statistics", statistics);

            return ApiResponse.success("内容分析完成", responseData);

        } catch (Exception e) {
            System.err.println("内容分析失败: " + e.getMessage());
            e.printStackTrace();
            return ApiResponse.error("内容分析失败: " + e.getMessage());
        }
    }

    /**
     * 仅提取链接（不进行验证）
     */
    @PostMapping("/extract-links")
    public ApiResponse<Map<String, Object>> extractLinks(@RequestBody Map<String, Object> request,
                                                        HttpSession session) {
        try {
            // 验证用户权限
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("用户未登录，请重新登录");
            }

            String text = (String) request.get("text");
            if (text == null || text.trim().isEmpty()) {
                return ApiResponse.error("文本内容不能为空");
            }

            // 提取链接
            List<String> links = linkValidationService.extractLinks(text);

            Map<String, Object> responseData = new HashMap<>();
            responseData.put("text", text);
            responseData.put("links", links);
            responseData.put("linkCount", links.size());
            responseData.put("timestamp", System.currentTimeMillis());

            return ApiResponse.success("链接提取完成", responseData);

        } catch (Exception e) {
            System.err.println("链接提取失败: " + e.getMessage());
            return ApiResponse.error("链接提取失败: " + e.getMessage());
        }
    }

    /**
     * 验证单个链接
     */
    @PostMapping("/check-link")
    public ApiResponse<Map<String, Object>> checkLink(@RequestBody Map<String, Object> request,
                                                     HttpSession session) {
        try {
            // 验证用户权限
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("用户未登录，请重新登录");
            }

            String url = (String) request.get("url");
            if (url == null || url.trim().isEmpty()) {
                return ApiResponse.error("URL不能为空");
            }

            // 检查链接
            LinkValidationService.LinkCheckResult result = 
                linkValidationService.checkLinkAvailability(url);
            result.setUrl(url);

            Map<String, Object> responseData = new HashMap<>();
            responseData.put("url", url);
            responseData.put("available", result.isAvailable());
            responseData.put("statusCode", result.getStatusCode());
            responseData.put("message", result.getMessage());
            responseData.put("timestamp", System.currentTimeMillis());

            return ApiResponse.success("链接检查完成", responseData);

        } catch (Exception e) {
            System.err.println("链接检查失败: " + e.getMessage());
            return ApiResponse.error("链接检查失败: " + e.getMessage());
        }
    }

    /**
     * 批量验证链接
     */
    @PostMapping("/filter-links")
    public ApiResponse<Map<String, Object>> filterLinks(@RequestBody Map<String, Object> request,
                                                       HttpSession session) {
        try {
            // 验证用户权限
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("用户未登录，请重新登录");
            }

            @SuppressWarnings("unchecked")
            List<String> links = (List<String>) request.get("links");
            if (links == null || links.isEmpty()) {
                return ApiResponse.error("链接列表不能为空");
            }

            // 过滤链接
            LinkValidationService.FilterResult result = 
                linkValidationService.filterUnreliableSources(links);

            Map<String, Object> responseData = new HashMap<>();
            responseData.put("originalLinks", links);
            responseData.put("reliableLinks", result.getReliableLinks());
            responseData.put("unavailableLinks", result.getUnavailableLinks());
            responseData.put("timestamp", System.currentTimeMillis());

            // 统计信息
            Map<String, Object> statistics = new HashMap<>();
            statistics.put("totalLinks", links.size());
            statistics.put("reliableCount", result.getReliableLinks().size());
            statistics.put("unavailableCount", result.getUnavailableLinks().size());
            statistics.put("filteredCount", links.size() - result.getReliableLinks().size() - result.getUnavailableLinks().size());
            responseData.put("statistics", statistics);

            return ApiResponse.success("链接过滤完成", responseData);

        } catch (Exception e) {
            System.err.println("链接过滤失败: " + e.getMessage());
            return ApiResponse.error("链接过滤失败: " + e.getMessage());
        }
    }

    /**
     * 生成内容审查报告
     */
    @PostMapping("/review-content")
    public ApiResponse<Map<String, Object>> reviewContent(@RequestBody Map<String, Object> request,
                                                         HttpSession session) {
        try {
            // 验证用户权限
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("用户未登录，请重新登录");
            }

            String role = (String) session.getAttribute("role");
            if (!"teacher".equals(role) && !"admin".equals(role)) {
                return ApiResponse.error("权限不足，仅教师和管理员可使用此功能");
            }

            @SuppressWarnings("unchecked")
            List<String> reliableLinks = (List<String>) request.get("reliableLinks");
            if (reliableLinks == null || reliableLinks.isEmpty()) {
                return ApiResponse.error("可靠链接列表不能为空");
            }

            // 生成审查提示词并调用AI
            String reviewPrompt = linkValidationService.generateReviewPrompt(reliableLinks, new ArrayList<>());
            String reviewResponse = deepSeekService.generateLearningAssistantResponse(reviewPrompt);

            Map<String, Object> responseData = new HashMap<>();
            responseData.put("reliableLinks", reliableLinks);
            responseData.put("reviewPrompt", reviewPrompt);
            responseData.put("reviewResponse", reviewResponse);
            responseData.put("timestamp", System.currentTimeMillis());

            return ApiResponse.success("内容审查完成", responseData);

        } catch (Exception e) {
            System.err.println("内容审查失败: " + e.getMessage());
            return ApiResponse.error("内容审查失败: " + e.getMessage());
        }
    }

    /**
     * 获取不可信域名列表
     */
    @GetMapping("/unreliable-domains")
    public ApiResponse<Map<String, Object>> getUnreliableDomains(HttpSession session) {
        try {
            // 验证用户权限
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("用户未登录，请重新登录");
            }

            // 返回不可信域名列表（用于前端显示）
            List<String> domains = Arrays.asList(
                "hupu.com", "hupu.cn",
                "163.com", "3g.163.com", "mobile.163.com",
                "sohu.com", "sina.com", "sina.cn", "qq.com",
                "ifeng.com", "weibo.com", "tieba.baidu.com", "douban.com"
            );

            Map<String, Object> responseData = new HashMap<>();
            responseData.put("unreliableDomains", domains);
            responseData.put("count", domains.size());
            responseData.put("description", "系统预设的不可信域名列表，来自这些域名的链接将被自动过滤");

            return ApiResponse.success("获取不可信域名列表成功", responseData);

        } catch (Exception e) {
            return ApiResponse.error("获取不可信域名列表失败: " + e.getMessage());
        }
    }
}
