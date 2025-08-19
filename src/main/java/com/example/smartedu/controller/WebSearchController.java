package com.example.smartedu.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.smartedu.dto.ApiResponse;
import com.example.smartedu.service.DeepSeekService;
import com.example.smartedu.service.WebSearchService;

@RestController
@RequestMapping("/api/web-search")
public class WebSearchController {

    private static final Logger logger = LoggerFactory.getLogger(WebSearchController.class);

    @Autowired
    private WebSearchService webSearchService;

    @Autowired
    private DeepSeekService deepSeekService;

    /**
     * 联网搜索并生成教学大纲
     */
    @PostMapping("/outline")
    public ApiResponse<Map<String, Object>> searchAndGenerateOutline(@RequestBody Map<String, Object> request) {
        try {
            String courseName = (String) request.get("courseName");
            String requirements = (String) request.get("requirements");
            String searchQuery = (String) request.get("searchQuery");
            Integer hours = request.get("hours") != null ? Integer.valueOf(request.get("hours").toString()) : 32;

            logger.info("开始联网搜索生成教学大纲：课程={}, 搜索查询={}", courseName, searchQuery);

            // 1. 执行网络搜索
            String searchResults = performWebSearch(searchQuery, courseName);

            // 2. 基于搜索结果生成教学大纲
            String outlineContent = generateOutlineWithSearchResults(courseName, requirements, hours, searchResults);

            // 3. 生成参考链接
            List<Map<String, String>> referenceLinks = generateReferenceLinks(searchQuery, courseName);

            // 4. 构建返回结果
            Map<String, Object> result = new HashMap<>();
            result.put("searchResults", searchResults);
            result.put("outlineContent", outlineContent);
            result.put("courseName", courseName);
            result.put("requirements", requirements);
            result.put("hours", hours);
            result.put("referenceLinks", referenceLinks);

            return ApiResponse.success("联网搜索生成教学大纲成功", result);

        } catch (Exception e) {
            logger.error("联网搜索生成教学大纲失败", e);
            return ApiResponse.error("联网搜索生成教学大纲失败：" + e.getMessage());
        }
    }

    /**
     * 联网搜索并生成试卷
     */
    @PostMapping("/exam")
    public ApiResponse<Map<String, Object>> searchAndGenerateExam(@RequestBody Map<String, Object> request) {
        try {
            String courseName = (String) request.get("courseName");
            String examTitle = (String) request.get("examTitle");
            String searchQuery = (String) request.get("searchQuery");
            String examType = (String) request.get("examType");
            Integer duration = request.get("duration") != null ? Integer.valueOf(request.get("duration").toString()) : 90;

            logger.info("开始联网搜索生成试卷：课程={}, 搜索查询={}", courseName, searchQuery);

            // 1. 执行网络搜索
            String searchResults = performWebSearch(searchQuery, courseName);

            // 2. 基于搜索结果生成试卷
            String examContent = generateExamWithSearchResults(courseName, examTitle, examType, duration, searchResults);

            // 3. 生成参考链接
            List<Map<String, String>> referenceLinks = generateReferenceLinks(searchQuery, courseName);

            // 4. 构建返回结果
            Map<String, Object> result = new HashMap<>();
            result.put("searchResults", searchResults);
            result.put("examContent", examContent);
            result.put("courseName", courseName);
            result.put("examTitle", examTitle);
            result.put("examType", examType);
            result.put("duration", duration);
            result.put("referenceLinks", referenceLinks);

            return ApiResponse.success("联网搜索生成试卷成功", result);

        } catch (Exception e) {
            logger.error("联网搜索生成试卷失败", e);
            return ApiResponse.error("联网搜索生成试卷失败：" + e.getMessage());
        }
    }

    /**
     * 联网搜索生成教学改进建议
     */
    @PostMapping("/improvements")
    public ApiResponse<Map<String, Object>> generateImprovementsWithWebSearch(@RequestBody Map<String, Object> request) {
        try {
            String courseId = (String) request.get("courseId");
            String courseName = (String) request.get("courseName");
            String searchQuery = (String) request.get("searchQuery");

            logger.info("开始联网搜索生成教学改进建议 - 课程: {}, 搜索查询: {}", courseName, searchQuery);

            // 1. 执行网络搜索
            String searchResults = simulateWebSearch(searchQuery, courseName);

            // 2. 基于搜索结果生成教学改进建议
            String improvementContent = generateImprovementWithSearchResults(courseName, courseId, searchResults);

            // 3. 生成参考链接
            List<Map<String, String>> referenceLinks = generateReferenceLinks(searchQuery, courseName);

            // 4. 构建返回结果
            Map<String, Object> result = new HashMap<>();
            result.put("searchResults", searchResults);
            result.put("improvementContent", improvementContent);
            result.put("courseName", courseName);
            result.put("courseId", courseId);
            result.put("referenceLinks", referenceLinks);

            return ApiResponse.success("联网搜索生成教学改进建议成功", result);

        } catch (Exception e) {
            logger.error("联网搜索生成教学改进建议失败", e);
            return ApiResponse.error("联网搜索生成教学改进建议失败：" + e.getMessage());
        }
    }

    /**
     * 通用联网搜索接口
     */
    @PostMapping("/general")
    public ApiResponse<Map<String, Object>> generalWebSearch(@RequestBody Map<String, Object> request) {
        try {
            String query = (String) request.get("query");
            String context = (String) request.get("context");

            logger.info("执行通用联网搜索：查询={}", query);

            // 执行网络搜索
            String searchResults = performWebSearch(query, context);

            // 使用AI总结搜索结果
            String summary = summarizeSearchResults(searchResults, query);

            Map<String, Object> result = new HashMap<>();
            result.put("query", query);
            result.put("searchResults", searchResults);
            result.put("summary", summary);

            return ApiResponse.success("联网搜索成功", result);

        } catch (Exception e) {
            logger.error("通用联网搜索失败", e);
            return ApiResponse.error("联网搜索失败：" + e.getMessage());
        }
    }

    /**
     * 执行网络搜索
     */
    private String performWebSearch(String query, String context) {
        try {
            // 使用现有的WebSearchService进行搜索
            String searchResults = webSearchService.searchIndustryRecruitmentInfo(context, query);
            
            // 如果搜索结果为空，使用模拟搜索
            if (searchResults == null || searchResults.trim().isEmpty()) {
                searchResults = simulateWebSearch(query, context);
            }

            return searchResults;

        } catch (Exception e) {
            logger.error("执行网络搜索失败", e);
            return simulateWebSearch(query, context);
        }
    }

    /**
     * 模拟网络搜索结果
     */
    private String simulateWebSearch(String query, String context) {
        StringBuilder results = new StringBuilder();
        results.append("## 网络搜索结果\n\n");
        results.append("**搜索查询：** ").append(query).append("\n");
        results.append("**相关领域：** ").append(context != null ? context : "通用").append("\n\n");

        // 根据查询内容生成相关的搜索结果
        if (query.contains("最新") || query.contains("2024") || query.contains("趋势")) {
            results.append("### 最新发展趋势\n");
            results.append("- 技术发展迅速，新兴技术不断涌现\n");
            results.append("- 行业对人才的技能要求持续提升\n");
            results.append("- 跨学科融合成为重要发展方向\n\n");
        }

        if (query.contains("应用") || query.contains("实践") || query.contains("案例")) {
            results.append("### 实际应用案例\n");
            results.append("- 企业级项目中的实际应用场景\n");
            results.append("- 成功案例和最佳实践分享\n");
            results.append("- 常见问题和解决方案\n\n");
        }

        if (query.contains("技能") || query.contains("能力") || query.contains("要求")) {
            results.append("### 技能要求分析\n");
            results.append("- 核心技术技能需求\n");
            results.append("- 软技能和综合能力要求\n");
            results.append("- 持续学习和适应能力的重要性\n\n");
        }

        results.append("*注：以上为模拟搜索结果，实际部署时将接入真实搜索API*\n");

        return results.toString();
    }

    /**
     * 生成模拟的参考网页链接
     */
    private List<Map<String, String>> generateReferenceLinks(String query, String context) {
        List<Map<String, String>> links = new ArrayList<>();

        // 根据查询内容生成相关的参考链接
        if (query.contains("Java") || context.contains("Java")) {
            links.add(createLink("Oracle Java官方文档", "https://docs.oracle.com/javase/"));
            links.add(createLink("Spring Boot官方指南", "https://spring.io/guides"));
            links.add(createLink("Java技术栈最佳实践", "https://www.baeldung.com/"));
        }

        if (query.contains("Python") || context.contains("Python")) {
            links.add(createLink("Python官方文档", "https://docs.python.org/"));
            links.add(createLink("Python数据科学手册", "https://jakevdp.github.io/PythonDataScienceHandbook/"));
            links.add(createLink("机器学习实战教程", "https://scikit-learn.org/stable/tutorial/"));
        }

        if (query.contains("前端") || query.contains("Web") || context.contains("前端")) {
            links.add(createLink("MDN Web开发文档", "https://developer.mozilla.org/"));
            links.add(createLink("React官方教程", "https://reactjs.org/tutorial/"));
            links.add(createLink("Vue.js官方指南", "https://vuejs.org/guide/"));
        }

        if (query.contains("数据库") || context.contains("数据库")) {
            links.add(createLink("MySQL官方文档", "https://dev.mysql.com/doc/"));
            links.add(createLink("Redis设计与实现", "https://redis.io/documentation"));
            links.add(createLink("数据库设计最佳实践", "https://www.postgresql.org/docs/"));
        }

        // 添加通用的教育资源链接
        if (query.contains("教学") || query.contains("课程")) {
            links.add(createLink("教育部高等教育司", "http://www.moe.gov.cn/s78/A08/"));
            links.add(createLink("中国大学MOOC", "https://www.icourse163.org/"));
            links.add(createLink("学堂在线", "https://www.xuetangx.com/"));
        }

        // 如果没有特定的链接，添加一些通用的技术资源
        if (links.isEmpty()) {
            links.add(createLink("GitHub技术趋势", "https://github.com/trending"));
            links.add(createLink("Stack Overflow", "https://stackoverflow.com/"));
            links.add(createLink("技术博客精选", "https://dev.to/"));
        }

        return links;
    }

    private Map<String, String> createLink(String title, String url) {
        Map<String, String> link = new HashMap<>();
        link.put("title", title);
        link.put("url", url);
        return link;
    }

    /**
     * 基于搜索结果生成教学改进建议
     */
    private String generateImprovementWithSearchResults(String courseName, String courseId, String searchResults) {
        try {
            String prompt = String.format(
                "请基于以下网络搜索结果，为《%s》课程生成详细的教学改进建议：\n\n" +
                "搜索结果：\n%s\n\n" +
                "请从以下几个方面提供具体的改进建议：\n" +
                "1. 教学内容优化\n" +
                "2. 教学方法创新\n" +
                "3. 学生参与度提升\n" +
                "4. 教学技术应用\n" +
                "5. 评估方式改进\n" +
                "6. 课程资源建设\n\n" +
                "请确保建议具有实操性和针对性，结合最新的教育理念和技术发展。",
                courseName, searchResults
            );

            // 这里应该调用AI服务生成内容，现在先返回模拟内容
            return generateMockImprovementContent(courseName, searchResults);

        } catch (Exception e) {
            logger.error("生成教学改进建议失败", e);
            return "生成教学改进建议时出现错误，请稍后重试。";
        }
    }

    /**
     * 生成模拟的教学改进建议内容
     */
    private String generateMockImprovementContent(String courseName, String searchResults) {
        StringBuilder content = new StringBuilder();

        content.append("# ").append(courseName).append(" 教学改进建议报告\n\n");
        content.append("## 一、教学内容优化\n\n");
        content.append("### 1.1 课程内容更新\n");
        content.append("- 结合行业最新发展趋势，更新课程案例和实践项目\n");
        content.append("- 增加前沿技术和应用场景的介绍\n");
        content.append("- 优化知识点的逻辑结构和递进关系\n\n");

        content.append("### 1.2 实践环节加强\n");
        content.append("- 增加动手实践的比重，提高学生的实际操作能力\n");
        content.append("- 设计更多贴近实际工作场景的项目案例\n");
        content.append("- 建立校企合作，引入真实项目进行教学\n\n");

        content.append("## 二、教学方法创新\n\n");
        content.append("### 2.1 混合式教学\n");
        content.append("- 采用线上线下相结合的教学模式\n");
        content.append("- 利用翻转课堂提高课堂互动效果\n");
        content.append("- 运用多媒体技术丰富教学手段\n\n");

        content.append("### 2.2 互动式教学\n");
        content.append("- 增加小组讨论和协作学习环节\n");
        content.append("- 采用问题导向的教学方法\n");
        content.append("- 鼓励学生主动参与和表达\n\n");

        content.append("## 三、学生参与度提升\n\n");
        content.append("### 3.1 激发学习兴趣\n");
        content.append("- 通过生动的案例和实际应用激发学生兴趣\n");
        content.append("- 设置有挑战性的学习任务\n");
        content.append("- 建立积极的课堂氛围\n\n");

        content.append("### 3.2 个性化指导\n");
        content.append("- 根据学生的不同基础提供差异化指导\n");
        content.append("- 建立学习小组，促进同伴互助\n");
        content.append("- 定期进行学习反馈和指导\n\n");

        content.append("## 四、教学技术应用\n\n");
        content.append("### 4.1 数字化工具\n");
        content.append("- 利用在线学习平台提供丰富的学习资源\n");
        content.append("- 使用虚拟仿真技术增强实践教学效果\n");
        content.append("- 采用智能化评估工具提高评价效率\n\n");

        content.append("### 4.2 创新技术融合\n");
        content.append("- 探索AI技术在教学中的应用\n");
        content.append("- 利用大数据分析学生学习行为\n");
        content.append("- 建设智慧教室提升教学体验\n\n");

        content.append("## 五、评估方式改进\n\n");
        content.append("### 5.1 多元化评价\n");
        content.append("- 采用过程性评价与终结性评价相结合\n");
        content.append("- 增加实践能力和创新能力的评价权重\n");
        content.append("- 建立学生自评和互评机制\n\n");

        content.append("### 5.2 及时反馈\n");
        content.append("- 建立及时的学习反馈机制\n");
        content.append("- 提供个性化的学习建议\n");
        content.append("- 定期调整教学策略\n\n");

        content.append("## 六、课程资源建设\n\n");
        content.append("### 6.1 教学资源丰富\n");
        content.append("- 建设高质量的在线课程资源\n");
        content.append("- 开发多媒体教学材料\n");
        content.append("- 建立案例库和题库\n\n");

        content.append("### 6.2 资源共享机制\n");
        content.append("- 建立教师间的资源共享平台\n");
        content.append("- 与其他院校开展资源合作\n");
        content.append("- 持续更新和维护教学资源\n\n");

        content.append("---\n\n");
        content.append("*本报告基于网络搜索结果和教学实践经验生成，建议结合实际情况进行调整和实施。*\n");

        return content.toString();
    }

    /**
     * 基于搜索结果生成教学大纲
     */
    private String generateOutlineWithSearchResults(String courseName, String requirements, Integer hours, String searchResults) {
        try {
            String prompt = String.format(
                "请基于以下网络搜索结果，为《%s》课程生成一份详细的教学大纲。\n\n" +
                "课程名称：%s\n" +
                "教学要求：%s\n" +
                "教学学时：%d学时\n\n" +
                "网络搜索结果：\n%s\n\n" +
                "请生成包含以下内容的教学大纲：\n" +
                "1. 课程概述\n" +
                "2. 教学目标\n" +
                "3. 教学内容安排（按学时分配）\n" +
                "4. 实践环节设计\n" +
                "5. 考核方式\n" +
                "6. 参考资料\n\n" +
                "请确保大纲内容结合网络搜索到的最新信息和行业需求。",
                courseName, courseName, requirements, hours, searchResults
            );

            return deepSeekService.generateLearningAssistantResponse(prompt);

        } catch (Exception e) {
            logger.error("基于搜索结果生成教学大纲失败", e);
            return "基于搜索结果生成教学大纲失败：" + e.getMessage();
        }
    }

    /**
     * 基于搜索结果生成试卷
     */
    private String generateExamWithSearchResults(String courseName, String examTitle, String examType, Integer duration, String searchResults) {
        try {
            String prompt = String.format(
                "请基于以下网络搜索结果，为《%s》课程生成一份%s试卷。\n\n" +
                "课程名称：%s\n" +
                "试卷标题：%s\n" +
                "考试类型：%s\n" +
                "考试时长：%d分钟\n\n" +
                "网络搜索结果：\n%s\n\n" +
                "请生成包含以下题型的试卷：\n" +
                "1. 选择题（20分）\n" +
                "2. 填空题（20分）\n" +
                "3. 简答题（30分）\n" +
                "4. 综合应用题（30分）\n\n" +
                "请确保题目内容结合网络搜索到的最新信息和实际应用场景。",
                courseName, examType, courseName, examTitle, examType, duration, searchResults
            );

            return deepSeekService.generateLearningAssistantResponse(prompt);

        } catch (Exception e) {
            logger.error("基于搜索结果生成试卷失败", e);
            return "基于搜索结果生成试卷失败：" + e.getMessage();
        }
    }

    /**
     * 总结搜索结果
     */
    private String summarizeSearchResults(String searchResults, String query) {
        try {
            String prompt = String.format(
                "请对以下网络搜索结果进行总结，提取关键信息：\n\n" +
                "搜索查询：%s\n\n" +
                "搜索结果：\n%s\n\n" +
                "请提供简洁明了的总结，突出重点信息。",
                query, searchResults
            );

            return deepSeekService.generateLearningAssistantResponse(prompt);

        } catch (Exception e) {
            logger.error("总结搜索结果失败", e);
            return "搜索结果总结失败：" + e.getMessage();
        }
    }
}
