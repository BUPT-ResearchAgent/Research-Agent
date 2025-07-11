package com.example.smartedu.service;

import com.example.smartedu.entity.Course;
import com.example.smartedu.entity.CourseMaterial;
import com.example.smartedu.repository.CourseMaterialRepository;
import com.example.smartedu.repository.CourseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Pattern;

@Service
public class CourseTypeDetectionService {

    @Autowired
    private CourseRepository courseRepository;
    
    @Autowired
    private CourseMaterialRepository courseMaterialRepository;
    
    @Autowired
    private DeepSeekService deepSeekService;

    /**
     * 检测课程类型
     * @param courseId 课程ID
     * @return 课程类型检测结果
     */
    public CourseTypeResult detectCourseType(Long courseId) {
        System.out.println("开始检测课程 " + courseId + " 的类型...");
        
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("课程不存在"));
        
        CourseTypeResult result = new CourseTypeResult();
        result.setCourseId(courseId);
        result.setCourseName(course.getName());
        
        // 1. 基于课程名称的关键词检测
        String nameBasedType = detectTypeByCourseName(course.getName());
        result.setNameBasedType(nameBasedType);
        
        // 2. 基于课程描述的检测
        String descriptionBasedType = detectTypeByDescription(course.getDescription());
        result.setDescriptionBasedType(descriptionBasedType);
        
        // 3. 基于课程资料内容的检测
        String materialBasedType = detectTypeByCourseContent(courseId);
        result.setMaterialBasedType(materialBasedType);
        
        // 4. 综合分析得出最终类型
        String finalType = determineFinalCourseType(nameBasedType, descriptionBasedType, materialBasedType);
        result.setFinalType(finalType);
        
        // 5. 生成适合该课程类型的考核建议
        Map<String, Object> examRecommendations = generateExamRecommendations(finalType);
        result.setExamRecommendations(examRecommendations);
        
        // 6. 生成教学方法建议
        String teachingMethodRecommendation = generateTeachingMethodRecommendation(finalType);
        result.setTeachingMethodRecommendation(teachingMethodRecommendation);
        
        System.out.println("课程类型检测完成: " + finalType);
        return result;
    }
    
    /**
     * 基于课程名称检测类型
     */
    private String detectTypeByCourseName(String courseName) {
        if (courseName == null || courseName.trim().isEmpty()) {
            return "未知";
        }
        
        String name = courseName.toLowerCase();
        
        // 明确的实践课关键词
        String[] practicalKeywords = {
            "实验", "实践", "实训", "实习", "项目", "设计", "制作", "开发", 
            "编程", "程序设计", "软件开发", "系统开发", "应用开发",
            "工程", "技术", "操作", "实战", "案例", "workshop", "lab",
            "exercise", "practice", "project", "design", "development"
        };
        
        // 明确的理论课关键词
        String[] theoreticalKeywords = {
            "原理", "理论", "概论", "导论", "基础", "概念", "思想", "哲学",
            "历史", "文学", "数学", "物理学", "化学", "经济学", "管理学",
            "心理学", "社会学", "法学", "principles", "theory", "introduction",
            "foundation", "concepts", "philosophy", "mathematics"
        };
        
        // 检查实践课关键词
        for (String keyword : practicalKeywords) {
            if (name.contains(keyword)) {
                return "实践课";
            }
        }
        
        // 检查理论课关键词
        for (String keyword : theoreticalKeywords) {
            if (name.contains(keyword)) {
                return "理论课";
            }
        }
        
        return "混合课";
    }
    
    /**
     * 基于课程描述检测类型
     */
    private String detectTypeByDescription(String description) {
        if (description == null || description.trim().isEmpty()) {
            return "未知";
        }
        
        String desc = description.toLowerCase();
        
        // 实践课描述特征
        String[] practicalPatterns = {
            "动手", "操作", "实验", "练习", "项目", "实战", "应用", "开发",
            "制作", "设计", "编程", "代码", "软件", "系统", "工具",
            "技能", "能力", "实际", "具体", "hands-on", "practical",
            "lab", "exercise", "project", "development", "coding"
        };
        
        // 理论课描述特征
        String[] theoreticalPatterns = {
            "理论", "原理", "概念", "思想", "知识", "理解", "掌握", "学习",
            "认识", "了解", "分析", "研究", "探讨", "theory", "principle",
            "concept", "knowledge", "understanding", "learning", "analysis"
        };
        
        int practicalScore = 0;
        int theoreticalScore = 0;
        
        // 计算实践课特征分数
        for (String pattern : practicalPatterns) {
            if (desc.contains(pattern)) {
                practicalScore++;
            }
        }
        
        // 计算理论课特征分数
        for (String pattern : theoreticalPatterns) {
            if (desc.contains(pattern)) {
                theoreticalScore++;
            }
        }
        
        if (practicalScore > theoreticalScore) {
            return "实践课";
        } else if (theoreticalScore > practicalScore) {
            return "理论课";
        } else {
            return "混合课";
        }
    }
    
    /**
     * 基于课程资料内容检测类型
     */
    private String detectTypeByCourseContent(Long courseId) {
        List<CourseMaterial> materials = courseMaterialRepository.findByCourseId(courseId);
        
        if (materials.isEmpty()) {
            return "未知";
        }
        
        StringBuilder allContent = new StringBuilder();
        
        // 收集所有课程资料内容
        for (CourseMaterial material : materials) {
            if (material.getContent() != null && !material.getContent().trim().isEmpty()) {
                allContent.append(material.getContent()).append(" ");
            }
        }
        
        if (allContent.length() == 0) {
            return "未知";
        }
        
        String content = allContent.toString().toLowerCase();
        
        // 使用更复杂的规则分析内容
        return analyzeContentForCourseType(content);
    }
    
    /**
     * 分析内容文本确定课程类型
     */
    private String analyzeContentForCourseType(String content) {
        // 实践课内容特征（权重更高的关键词）
        Map<String, Integer> practicalFeatures = new HashMap<>();
        practicalFeatures.put("代码", 3);
        practicalFeatures.put("编程", 3);
        practicalFeatures.put("程序", 3);
        practicalFeatures.put("算法实现", 3);
        practicalFeatures.put("实验步骤", 3);
        practicalFeatures.put("操作方法", 3);
        practicalFeatures.put("项目开发", 3);
        practicalFeatures.put("系统设计", 3);
        practicalFeatures.put("软件开发", 3);
        practicalFeatures.put("数据库设计", 3);
        practicalFeatures.put("网页制作", 3);
        practicalFeatures.put("app开发", 3);
        
        practicalFeatures.put("实验", 2);
        practicalFeatures.put("实践", 2);
        practicalFeatures.put("练习", 2);
        practicalFeatures.put("操作", 2);
        practicalFeatures.put("步骤", 2);
        practicalFeatures.put("方法", 2);
        practicalFeatures.put("技能", 2);
        practicalFeatures.put("工具", 2);
        practicalFeatures.put("软件", 2);
        practicalFeatures.put("应用", 2);
        
        // 理论课内容特征
        Map<String, Integer> theoreticalFeatures = new HashMap<>();
        theoreticalFeatures.put("定理", 3);
        theoreticalFeatures.put("公式", 3);
        theoreticalFeatures.put("原理", 3);
        theoreticalFeatures.put("理论", 3);
        theoreticalFeatures.put("概念", 3);
        theoreticalFeatures.put("定义", 3);
        theoreticalFeatures.put("数学证明", 3);
        theoreticalFeatures.put("推导", 3);
        theoreticalFeatures.put("证明", 3);
        
        theoreticalFeatures.put("分析", 2);
        theoreticalFeatures.put("研究", 2);
        theoreticalFeatures.put("探讨", 2);
        theoreticalFeatures.put("思考", 2);
        theoreticalFeatures.put("理解", 2);
        theoreticalFeatures.put("认识", 2);
        theoreticalFeatures.put("知识", 2);
        theoreticalFeatures.put("学习", 2);
        
        int practicalScore = calculateFeatureScore(content, practicalFeatures);
        int theoreticalScore = calculateFeatureScore(content, theoreticalFeatures);
        
        System.out.println("内容分析得分 - 实践课: " + practicalScore + ", 理论课: " + theoreticalScore);
        
        if (practicalScore > theoreticalScore + 2) { // 需要明显差异
            return "实践课";
        } else if (theoreticalScore > practicalScore + 2) {
            return "理论课";
        } else {
            return "混合课";
        }
    }
    
    /**
     * 计算特征得分
     */
    private int calculateFeatureScore(String content, Map<String, Integer> features) {
        int totalScore = 0;
        
        for (Map.Entry<String, Integer> entry : features.entrySet()) {
            String keyword = entry.getKey();
            int weight = entry.getValue();
            
            // 统计关键词出现次数
            int count = (content.length() - content.replace(keyword, "").length()) / keyword.length();
            totalScore += count * weight;
        }
        
        return totalScore;
    }
    
    /**
     * 综合确定最终课程类型
     */
    private String determineFinalCourseType(String nameBasedType, String descriptionBasedType, String materialBasedType) {
        // 投票机制
        Map<String, Integer> votes = new HashMap<>();
        votes.put("理论课", 0);
        votes.put("实践课", 0);
        votes.put("混合课", 0);
        votes.put("未知", 0);
        
        // 课程名称的权重最高
        if (!"未知".equals(nameBasedType)) {
            votes.put(nameBasedType, votes.get(nameBasedType) + 3);
        }
        
        // 课程描述权重中等
        if (!"未知".equals(descriptionBasedType)) {
            votes.put(descriptionBasedType, votes.get(descriptionBasedType) + 2);
        }
        
        // 课程内容权重最高（因为最准确）
        if (!"未知".equals(materialBasedType)) {
            votes.put(materialBasedType, votes.get(materialBasedType) + 4);
        }
        
        // 找出得分最高的类型
        String finalType = votes.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("混合课");
        
        // 如果得分都很低，默认为混合课
        if (votes.get(finalType) < 2) {
            finalType = "混合课";
        }
        
        return finalType;
    }
    
    /**
     * 生成适合该课程类型的考核建议
     */
    private Map<String, Object> generateExamRecommendations(String courseType) {
        Map<String, Object> recommendations = new HashMap<>();
        
        switch (courseType) {
            case "理论课":
                recommendations.put("主要题型", Arrays.asList("选择题", "填空题", "简答题", "论述题"));
                recommendations.put("题型分布", Map.of(
                    "选择题", "30-40%",
                    "填空题", "20-30%", 
                    "简答题", "20-30%",
                    "论述题", "10-20%"
                ));
                recommendations.put("重点考核", Arrays.asList("概念理解", "理论掌握", "知识应用", "分析能力"));
                recommendations.put("考试形式", "笔试为主");
                recommendations.put("时间建议", "90-120分钟");
                break;
                
            case "实践课":
                recommendations.put("主要题型", Arrays.asList("编程题", "操作题", "设计题", "项目作业"));
                recommendations.put("题型分布", Map.of(
                    "编程题", "40-50%",
                    "操作题", "20-30%",
                    "设计题", "20-30%",
                    "项目作业", "10-20%"
                ));
                recommendations.put("重点考核", Arrays.asList("动手能力", "实践技能", "问题解决", "创新应用"));
                recommendations.put("考试形式", "上机操作、项目提交");
                recommendations.put("时间建议", "120-180分钟");
                break;
                
            case "混合课":
                recommendations.put("主要题型", Arrays.asList("选择题", "编程题", "简答题", "应用题"));
                recommendations.put("题型分布", Map.of(
                    "选择题", "20-30%",
                    "编程题", "30-40%",
                    "简答题", "20-30%",
                    "应用题", "10-20%"
                ));
                recommendations.put("重点考核", Arrays.asList("理论理解", "实践应用", "综合能力", "创新思维"));
                recommendations.put("考试形式", "笔试+上机");
                recommendations.put("时间建议", "120-150分钟");
                break;
                
            default:
                recommendations.put("主要题型", Arrays.asList("选择题", "简答题", "应用题"));
                recommendations.put("建议", "需要进一步分析课程特点以制定合适的考核方案");
        }
        
        return recommendations;
    }
    
    /**
     * 生成教学方法建议
     */
    private String generateTeachingMethodRecommendation(String courseType) {
        StringBuilder recommendation = new StringBuilder();
        
        recommendation.append("## ").append(courseType).append("教学方法建议\n\n");
        
        switch (courseType) {
            case "理论课":
                recommendation.append("### 教学策略:\n");
                recommendation.append("- **讲授法**: 系统讲解理论知识点，注重概念的准确性和逻辑性\n");
                recommendation.append("- **案例分析法**: 通过具体案例帮助学生理解抽象理论\n");
                recommendation.append("- **讨论法**: 组织学生就理论问题进行深入讨论\n");
                recommendation.append("- **问答法**: 通过提问引导学生思考，加深理解\n\n");
                
                recommendation.append("### 重点关注:\n");
                recommendation.append("- 概念的准确理解和掌握\n");
                recommendation.append("- 理论体系的完整性和逻辑性\n");
                recommendation.append("- 培养学生的抽象思维能力\n");
                recommendation.append("- 注重知识的系统性和深度\n");
                break;
                
            case "实践课":
                recommendation.append("### 教学策略:\n");
                recommendation.append("- **项目驱动**: 以实际项目为载体，让学生在实践中学习\n");
                recommendation.append("- **任务导向**: 设计具体任务，引导学生主动探索和实践\n");
                recommendation.append("- **分组协作**: 组织小组合作，培养团队协作能力\n");
                recommendation.append("- **师生互动**: 教师作为指导者，学生作为主体进行实践操作\n\n");
                
                recommendation.append("### 重点关注:\n");
                recommendation.append("- 动手操作能力的培养\n");
                recommendation.append("- 实际问题的解决能力\n");
                recommendation.append("- 创新思维和应用能力\n");
                recommendation.append("- 职业技能的实用性\n");
                break;
                
            case "混合课":
                recommendation.append("### 教学策略:\n");
                recommendation.append("- **理实一体**: 理论学习与实践操作相结合\n");
                recommendation.append("- **循序渐进**: 从基础理论到实际应用，层层递进\n");
                recommendation.append("- **多元化教学**: 结合多种教学方法，适应不同学习需求\n");
                recommendation.append("- **翻转课堂**: 线上学习理论，线下进行实践和讨论\n\n");
                
                recommendation.append("### 重点关注:\n");
                recommendation.append("- 理论与实践的有机结合\n");
                recommendation.append("- 知识迁移和应用能力\n");
                recommendation.append("- 综合素质的全面发展\n");
                recommendation.append("- 学习方法的指导和培养\n");
                break;
        }
        
        return recommendation.toString();
    }
    
    /**
     * 课程类型检测结果类
     */
    public static class CourseTypeResult {
        private Long courseId;
        private String courseName;
        private String nameBasedType;          // 基于名称的类型判断
        private String descriptionBasedType;   // 基于描述的类型判断
        private String materialBasedType;      // 基于资料内容的类型判断
        private String finalType;              // 最终确定的类型
        private Map<String, Object> examRecommendations;  // 考核建议
        private String teachingMethodRecommendation;      // 教学方法建议
        
        // Getters and Setters
        public Long getCourseId() { return courseId; }
        public void setCourseId(Long courseId) { this.courseId = courseId; }
        
        public String getCourseName() { return courseName; }
        public void setCourseName(String courseName) { this.courseName = courseName; }
        
        public String getNameBasedType() { return nameBasedType; }
        public void setNameBasedType(String nameBasedType) { this.nameBasedType = nameBasedType; }
        
        public String getDescriptionBasedType() { return descriptionBasedType; }
        public void setDescriptionBasedType(String descriptionBasedType) { this.descriptionBasedType = descriptionBasedType; }
        
        public String getMaterialBasedType() { return materialBasedType; }
        public void setMaterialBasedType(String materialBasedType) { this.materialBasedType = materialBasedType; }
        
        public String getFinalType() { return finalType; }
        public void setFinalType(String finalType) { this.finalType = finalType; }
        
        public Map<String, Object> getExamRecommendations() { return examRecommendations; }
        public void setExamRecommendations(Map<String, Object> examRecommendations) { this.examRecommendations = examRecommendations; }
        
        public String getTeachingMethodRecommendation() { return teachingMethodRecommendation; }
        public void setTeachingMethodRecommendation(String teachingMethodRecommendation) { this.teachingMethodRecommendation = teachingMethodRecommendation; }
    }
} 