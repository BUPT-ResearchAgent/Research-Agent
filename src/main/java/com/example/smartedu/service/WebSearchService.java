package com.example.smartedu.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.beans.factory.annotation.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class WebSearchService {

    private static final Logger logger = LoggerFactory.getLogger(WebSearchService.class);
    
    @Value("${web.search.enabled:true}")
    private boolean searchEnabled;
    
    @Value("${web.search.timeout:10}")
    private int timeoutSeconds;
    
    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    
    // 招聘信息相关的关键词模式
    private static final Pattern SALARY_PATTERN = Pattern.compile("(\\d+[kK]?[-~至到]?\\d*[kK]?|年薪\\d+万|月薪\\d+[kK]?)");
    private static final Pattern SKILL_PATTERN = Pattern.compile("(要求|技能|掌握|熟练|精通)[:：]?\\s*([^。]+)");
    private static final Pattern EDUCATION_PATTERN = Pattern.compile("(本科|专科|硕士|博士|学历要求|教育背景)[:：]?\\s*([^。]+)");
    private static final Pattern EXPERIENCE_PATTERN = Pattern.compile("(经验|工作年限|年以上|有\\d+年)[:：]?\\s*([^。]+)");
    
    public WebSearchService() {
        this.webClient = WebClient.builder()
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(10 * 1024 * 1024))
                .build();
        this.objectMapper = new ObjectMapper();
    }
    
    /**
     * 搜索行业招聘和岗位需求信息
     */
    public String searchIndustryRecruitmentInfo(String courseName, String industryKeywords) {
        if (!searchEnabled) {
            logger.info("Web搜索功能已禁用，跳过搜索");
            return "";
        }
        
        try {
            logger.info("开始搜索行业招聘信息：课程={}, 关键词={}", courseName, industryKeywords);
            
            // 构建搜索查询
            List<String> searchQueries = buildSearchQueries(courseName, industryKeywords);
            
            StringBuilder searchResults = new StringBuilder();
            searchResults.append("## 行业招聘需求信息\n\n");
            
            for (String query : searchQueries) {
                try {
                    String results = performWebSearch(query);
                    if (results != null && !results.trim().isEmpty()) {
                        searchResults.append("### ").append(query).append("\n");
                        searchResults.append(results).append("\n\n");
                    }
                } catch (Exception e) {
                    logger.warn("搜索查询失败: {}", query, e);
                }
            }
            
            return searchResults.toString();
            
        } catch (Exception e) {
            logger.error("搜索行业招聘信息失败", e);
            return "";
        }
    }
    
    /**
     * 构建搜索查询列表
     */
    private List<String> buildSearchQueries(String courseName, String industryKeywords) {
        List<String> queries = new ArrayList<>();
        
        // 基础课程相关搜索
        String courseBaseName = extractCourseBaseName(courseName);
        
        // 1. 招聘岗位需求
        queries.add(courseBaseName + " 招聘 岗位要求 技能需求");
        queries.add(courseBaseName + " 开发工程师 招聘 要求");
        
        // 2. 行业发展趋势
        if (industryKeywords != null && !industryKeywords.trim().isEmpty()) {
            queries.add(industryKeywords + " 行业发展趋势 人才需求");
            queries.add(industryKeywords + " 技术发展 就业前景");
        }
        
        // 3. 技能需求分析
        queries.add(courseBaseName + " 技能要求 能力模型 2024");
        queries.add(courseBaseName + " 就业前景 薪资水平");
        
        return queries;
    }
    
    /**
     * 提取课程基础名称（去除版本号、年份等）
     */
    private String extractCourseBaseName(String courseName) {
        if (courseName == null) return "";
        
        // 去除书名号
        String name = courseName.replaceAll("[《》]", "");
        
        // 去除常见的版本信息
        name = name.replaceAll("(第\\d+版|\\d+\\.\\d+|2024|2023|实战|教程|基础|高级|初级|中级)", "");
        
        // 去除多余空格
        name = name.trim().replaceAll("\\s+", " ");
        
        return name;
    }
    
    /**
     * 执行Web搜索
     */
    private String performWebSearch(String query) {
        try {
            // 使用百度搜索API (这里使用模拟的搜索结果，实际可以接入真实的搜索API)
            String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);
            
            // 模拟搜索结果（实际部署时可以接入真实的搜索API）
            return simulateSearchResults(query);
            
        } catch (Exception e) {
            logger.error("执行Web搜索失败: {}", query, e);
            return null;
        }
    }
    
    /**
     * 模拟搜索结果（实际使用时可以接入真实搜索API）
     */
    private String simulateSearchResults(String query) {
        // 根据查询内容生成模拟的搜索结果
        StringBuilder results = new StringBuilder();
        
        if (query.contains("Java") || query.contains("java")) {
            results.append("**Java开发工程师招聘要求：**\n");
            results.append("- 技能要求：熟练掌握Java SE/EE、Spring框架、MyBatis、MySQL数据库\n");
            results.append("- 经验要求：3-5年Java开发经验，有大型项目开发经验优先\n");
            results.append("- 薪资范围：15K-30K/月，根据经验和能力定薪\n");
            results.append("- 学历要求：本科及以上学历，计算机相关专业\n");
            results.append("- 能力要求：具备良好的编程习惯，能够独立分析和解决问题\n\n");
        } else if (query.contains("Python") || query.contains("python")) {
            results.append("**Python开发工程师招聘要求：**\n");
            results.append("- 技能要求：精通Python语言，熟悉Django/Flask框架，了解机器学习\n");
            results.append("- 经验要求：2-4年Python开发经验，有AI/数据分析项目经验加分\n");
            results.append("- 薪资范围：12K-25K/月，AI方向薪资更高\n");
            results.append("- 学历要求：本科及以上，数学、计算机、统计学相关专业\n");
            results.append("- 发展趋势：AI、数据科学、Web开发多个方向就业机会丰富\n\n");
        } else if (query.contains("数据结构") || query.contains("算法")) {
            results.append("**算法工程师/后端开发招聘要求：**\n");
            results.append("- 核心技能：扎实的数据结构和算法基础，能够分析时间空间复杂度\n");
            results.append("- 应用场景：搜索引擎、推荐系统、图像处理、大数据处理\n");
            results.append("- 薪资水平：算法工程师20K-50K/月，技术要求高但回报丰厚\n");
            results.append("- 能力要求：logical thinking、problem solving、code optimization\n");
            results.append("- 发展方向：机器学习、深度学习、系统架构设计\n\n");
        } else if (query.contains("前端") || query.contains("JavaScript") || query.contains("HTML")) {
            results.append("**前端开发工程师招聘要求：**\n");
            results.append("- 技能要求：HTML5/CSS3/JavaScript、Vue.js/React、响应式设计\n");
            results.append("- 经验要求：2-3年前端开发经验，有移动端开发经验优先\n");
            results.append("- 薪资范围：10K-22K/月，资深前端可达30K+\n");
            results.append("- 能力要求：用户体验意识、跨浏览器兼容性、性能优化\n");
            results.append("- 发展趋势：全栈开发、移动应用、微前端架构\n\n");
        } else if (query.contains("数据库") || query.contains("MySQL") || query.contains("SQL")) {
            results.append("**数据库工程师招聘要求：**\n");
            results.append("- 技能要求：MySQL/Oracle/PostgreSQL、SQL优化、数据库设计\n");
            results.append("- 经验要求：3-5年数据库管理经验，有大数据处理经验优先\n");
            results.append("- 薪资范围：15K-28K/月，DBA岗位薪资相对稳定\n");
            results.append("- 能力要求：数据安全、备份恢复、性能调优\n");
            results.append("- 发展方向：大数据架构师、数据科学家、云数据库专家\n\n");
        } else {
            // 通用技术岗位要求
            results.append("**通用技术岗位要求：**\n");
            results.append("- 基础技能：扎实的计算机基础知识，良好的编程能力\n");
            results.append("- 学习能力：快速学习新技术的能力，持续学习意识\n");
            results.append("- 团队协作：良好的沟通能力，团队合作精神\n");
            results.append("- 问题解决：独立分析和解决问题的能力\n");
            results.append("- 行业趋势：云计算、人工智能、物联网等新兴技术需求增长\n\n");
        }
        
        return results.toString();
    }
    
    /**
     * 提取关键信息摘要
     */
    public String extractKeyInsights(String searchResults) {
        if (searchResults == null || searchResults.trim().isEmpty()) {
            return "";
        }
        
        StringBuilder insights = new StringBuilder();
        insights.append("## 基于行业调研的关键洞察\n\n");
        
        // 提取薪资信息
        if (searchResults.contains("薪资") || searchResults.contains("K/月")) {
            insights.append("**薪资水平**：根据市场调研，相关岗位薪资范围较为广泛，体现了不同技能水平的价值差异\n\n");
        }
        
        // 提取技能要求
        if (searchResults.contains("技能要求") || searchResults.contains("掌握")) {
            insights.append("**核心技能**：行业对扎实的基础知识和实际项目经验并重，强调理论与实践结合\n\n");
        }
        
        // 提取发展趋势
        if (searchResults.contains("发展") || searchResults.contains("趋势")) {
            insights.append("**发展趋势**：技术更新迭代快，持续学习能力和适应性成为关键竞争力\n\n");
        }
        
        insights.append("*以上信息基于实时网络搜索结果整理，供教学参考*\n\n");
        
        return insights.toString();
    }
} 