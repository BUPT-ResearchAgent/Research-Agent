package com.example.smartedu.service;

import java.net.URL;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/**
 * 链接验证和内容审查服务
 * 基于Python脚本的功能移植到Java
 */
@Service
public class LinkValidationService {

    // 移除对DeepSeekService的直接依赖，避免循环依赖

    private final RestTemplate restTemplate = new RestTemplate();

    // 不可信域名列表
    private static final Set<String> UNRELIABLE_DOMAINS = Set.of(
        "hupu.com", "hupu.cn",
        "163.com", "3g.163.com", "mobile.163.com",
        "sohu.com",
        "sina.com", "sina.cn",
        "qq.com",
        "ifeng.com",
        "weibo.com",
        "tieba.baidu.com",
        "douban.com"
    );

    // URL提取的正则表达式模式
    private static final List<Pattern> URL_PATTERNS = Arrays.asList(
        Pattern.compile("https?://[^\\s\\)\\]\"]+"),  // 普通URL
        Pattern.compile("\\[(\\d+)\\]:\\s*(https?://[^\\s]+)"),  // 标记式引用
        Pattern.compile("参考(文献|资料)[：:]\\s*(https?://[^\\s]+)"),  // 中文参考文献格式
        Pattern.compile("来源[：:]\\s*(https?://[^\\s]+)"),  // 来源格式
        Pattern.compile("链接[：:]\\s*(https?://[^\\s]+)")  // 链接格式
    );

    /**
     * 从文本中提取所有链接
     */
    public List<String> extractLinks(String text) {
        Set<String> links = new HashSet<>();
        
        for (Pattern pattern : URL_PATTERNS) {
            Matcher matcher = pattern.matcher(text);
            while (matcher.find()) {
                if (matcher.groupCount() > 1) {
                    // 对于有分组的模式，取第二个分组（URL部分）
                    links.add(matcher.group(2));
                } else {
                    links.add(matcher.group());
                }
            }
        }
        
        return new ArrayList<>(links);
    }

    /**
     * 检查链接可用性
     */
    public LinkCheckResult checkLinkAvailability(String url) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.HEAD, entity, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                return new LinkCheckResult(true, response.getStatusCode().value(), "链接可用");
            } else {
                return new LinkCheckResult(false, response.getStatusCode().value(), 
                    "状态码: " + response.getStatusCode().value());
            }
            
        } catch (Exception e) {
            return new LinkCheckResult(false, -1, "请求异常: " + e.getMessage());
        }
    }

    /**
     * 过滤不可信来源和无效链接
     */
    public FilterResult filterUnreliableSources(List<String> links) {
        List<String> reliableLinks = new ArrayList<>();
        List<LinkCheckResult> unavailableLinks = new ArrayList<>();
        
        System.out.println("开始检查链接可用性...");
        
        for (int i = 0; i < links.size(); i++) {
            String link = links.get(i);
            System.out.printf("检查链接 %d/%d: %s...%n", i + 1, links.size(), 
                link.length() > 60 ? link.substring(0, 60) + "..." : link);
            
            // 检查域名可信度
            try {
                URL url = new URL(link);
                String domain = url.getHost().toLowerCase();
                
                if (UNRELIABLE_DOMAINS.stream().anyMatch(domain::contains)) {
                    System.out.println("  → 过滤不可信平台: " + domain);
                    continue;
                }
                
                // 检查链接可用性
                LinkCheckResult result = checkLinkAvailability(link);
                result.setUrl(link);
                
                if (result.isAvailable()) {
                    reliableLinks.add(link);
                    System.out.printf("  ✓ 链接可用 (状态码: %d)%n", result.getStatusCode());
                } else {
                    unavailableLinks.add(result);
                    System.out.printf("  ✗ 链接不可用: %s%n", result.getMessage());
                }
                
                // 添加短暂延迟，避免请求过于频繁
                Thread.sleep(500);
                
            } catch (Exception e) {
                LinkCheckResult result = new LinkCheckResult(false, -1, "URL解析错误: " + e.getMessage());
                result.setUrl(link);
                unavailableLinks.add(result);
                System.out.printf("  ✗ URL解析错误: %s%n", e.getMessage());
            }
        }
        
        return new FilterResult(reliableLinks, unavailableLinks);
    }

    /**
     * 生成内容审查提示词
     */
    public String generateReviewPrompt(List<String> reliableLinks, List<LinkCheckResult> unavailableLinks) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("我想根据这些链接的发布人、发布平台、发布题目和内容对这些内容进行审查：\n\n");
        
        for (String link : reliableLinks) {
            prompt.append("- ").append(link).append("\n");
        }
        
        prompt.append("\n请分析每个链接的：\n");
        prompt.append("1. 发布人/机构背景和专业性\n");
        prompt.append("2. 发布平台的权威性和专业性\n");
        prompt.append("3. 文章题目的相关性和专业性\n");
        prompt.append("4. 内容质量、深度和可信度\n\n");
        
        prompt.append("请特别过滤掉来自娱乐性、非专业平台的内容，只保留来自专业机构、标准组织、学术研究或知名技术媒体的高质量内容。\n\n");
        prompt.append("对每个链接进行评级（A:优秀, B:良好, C:一般, D:不可靠），并最终提供经过筛选的可靠资源列表和分析报告。\n");
        
        if (!unavailableLinks.isEmpty()) {
            prompt.append(String.format("\n注意：发现 %d 个不可用链接已被过滤。", unavailableLinks.size()));
        }
        
        return prompt.toString();
    }

    /**
     * 执行完整的链接验证和内容审查流程
     * @param searchQuery 搜索查询
     * @param aiResponseProvider AI响应提供者函数接口
     */
    public ContentAnalysisResult analyzeContent(String searchQuery, java.util.function.Function<String, String> aiResponseProvider) {
        System.out.println("=== 开始内容分析流程 ===");

        // 第一阶段：搜索内容
        String searchPrompt = String.format("请搜索关于%s的详细信息，包括其概念、应用场景、实施方法和相关标准。请提供权威来源的参考资料，并将所有引用的链接以规范的参考文献格式列出。", searchQuery);

        String searchResponse = aiResponseProvider.apply(searchPrompt);
        
        if (searchResponse == null || searchResponse.trim().isEmpty()) {
            return new ContentAnalysisResult("搜索失败", null, null, null);
        }
        
        System.out.println("搜索响应摘要:");
        System.out.println(searchResponse.length() > 500 ? 
            searchResponse.substring(0, 500) + "..." : searchResponse);
        
        // 提取链接
        List<String> links = extractLinks(searchResponse);
        System.out.printf("提取到的 %d 个链接:%n", links.size());
        for (int i = 0; i < links.size(); i++) {
            System.out.printf("%d. %s%n", i + 1, links.get(i));
        }
        
        // 过滤不可信来源和无效链接
        FilterResult filterResult = filterUnreliableSources(links);
        
        System.out.printf("过滤结果:%n");
        System.out.printf("总链接数: %d%n", links.size());
        System.out.printf("可靠链接: %d%n", filterResult.getReliableLinks().size());
        System.out.printf("不可用链接: %d%n", filterResult.getUnavailableLinks().size());
        
        String reviewResponse = null;
        if (!filterResult.getReliableLinks().isEmpty()) {
            // 第二阶段：内容审查和分析
            System.out.println("=== 开始内容审查和分析 ===");
            String reviewPrompt = generateReviewPrompt(filterResult.getReliableLinks(), filterResult.getUnavailableLinks());
            reviewResponse = aiResponseProvider.apply(reviewPrompt);
            System.out.println("审查结果:");
            System.out.println(reviewResponse);
        } else {
            System.out.println("没有找到可靠的链接资源");
        }
        
        return new ContentAnalysisResult(searchResponse, filterResult.getReliableLinks(), 
            filterResult.getUnavailableLinks(), reviewResponse);
    }

    // 内部类定义
    public static class LinkCheckResult {
        private boolean available;
        private int statusCode;
        private String message;
        private String url;

        public LinkCheckResult(boolean available, int statusCode, String message) {
            this.available = available;
            this.statusCode = statusCode;
            this.message = message;
        }

        // Getters and Setters
        public boolean isAvailable() { return available; }
        public int getStatusCode() { return statusCode; }
        public String getMessage() { return message; }
        public String getUrl() { return url; }
        public void setUrl(String url) { this.url = url; }
    }

    public static class FilterResult {
        private List<String> reliableLinks;
        private List<LinkCheckResult> unavailableLinks;

        public FilterResult(List<String> reliableLinks, List<LinkCheckResult> unavailableLinks) {
            this.reliableLinks = reliableLinks;
            this.unavailableLinks = unavailableLinks;
        }

        public List<String> getReliableLinks() { return reliableLinks; }
        public List<LinkCheckResult> getUnavailableLinks() { return unavailableLinks; }
    }

    public static class ContentAnalysisResult {
        private String searchResponse;
        private List<String> reliableLinks;
        private List<LinkCheckResult> unavailableLinks;
        private String reviewResponse;

        public ContentAnalysisResult(String searchResponse, List<String> reliableLinks, 
                                   List<LinkCheckResult> unavailableLinks, String reviewResponse) {
            this.searchResponse = searchResponse;
            this.reliableLinks = reliableLinks;
            this.unavailableLinks = unavailableLinks;
            this.reviewResponse = reviewResponse;
        }

        // Getters
        public String getSearchResponse() { return searchResponse; }
        public List<String> getReliableLinks() { return reliableLinks; }
        public List<LinkCheckResult> getUnavailableLinks() { return unavailableLinks; }
        public String getReviewResponse() { return reviewResponse; }
    }
}
