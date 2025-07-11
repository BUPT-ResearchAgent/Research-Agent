package com.example.smartedu.service;

import com.example.smartedu.entity.*;
import com.example.smartedu.repository.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CapabilityAnalysisService {
    
    @Autowired
    private QuestionRepository questionRepository;
    
    @Autowired
    private StudentAnswerRepository studentAnswerRepository;
    
    @Autowired
    private ExamResultRepository examResultRepository;
    
    @Autowired
    private StudentRepository studentRepository;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    /**
     * 分析学生在特定考试中的能力表现
     */
    public Map<String, Object> analyzeStudentCapabilities(Long studentId, Long examId) {
        try {
            // 获取考试中的所有题目
            List<Question> questions = questionRepository.findByExamId(examId);
            
            // 获取学生的答题情况
            List<StudentAnswer> studentAnswers = studentAnswerRepository.findByStudentIdAndExamId(studentId, examId);
            Map<Long, StudentAnswer> answerMap = studentAnswers.stream()
                .collect(Collectors.toMap(answer -> answer.getQuestion().getId(), answer -> answer));
            
            // 按能力维度分组统计
            Map<String, List<Question>> capabilityQuestions = new HashMap<>();
            Map<String, CapabilityPerformance> capabilityPerformances = new HashMap<>();
            
            for (Question question : questions) {
                String primaryCapability = question.getPrimaryCapability();
                if (primaryCapability == null) continue;
                
                capabilityQuestions.computeIfAbsent(primaryCapability, k -> new ArrayList<>()).add(question);
                
                StudentAnswer answer = answerMap.get(question.getId());
                CapabilityPerformance performance = capabilityPerformances.computeIfAbsent(
                    primaryCapability, 
                    k -> new CapabilityPerformance(primaryCapability)
                );
                
                performance.addQuestion(question, answer);
            }
            
            // 计算各能力维度的详细表现
            Map<String, Object> result = new HashMap<>();
            Map<String, Map<String, Object>> capabilityAnalysis = new HashMap<>();
            
            for (CapabilityPerformance performance : capabilityPerformances.values()) {
                String capability = performance.getCapability();
                CapabilityDimension dimension = CapabilityDimension.fromCode(capability);
                
                Map<String, Object> analysis = new HashMap<>();
                analysis.put("displayName", dimension != null ? dimension.getDisplayName() : capability);
                analysis.put("description", dimension != null ? dimension.getDescription() : "");
                analysis.put("totalQuestions", performance.getTotalQuestions());
                analysis.put("correctAnswers", performance.getCorrectAnswers());
                analysis.put("accuracy", performance.getAccuracy());
                analysis.put("averageDifficulty", performance.getAverageDifficulty());
                analysis.put("achievedLevel", performance.getAchievedLevel());
                analysis.put("levelDescription", dimension != null ? 
                    dimension.getLevelDescription(performance.getAchievedLevel()) : "");
                analysis.put("strengths", performance.getStrengths());
                analysis.put("weaknesses", performance.getWeaknesses());
                analysis.put("suggestions", generateImprovementSuggestions(dimension, performance));
                
                capabilityAnalysis.put(capability, analysis);
            }
            
            // 计算整体能力雷达图数据
            Map<String, Double> radarData = calculateCapabilityRadar(capabilityPerformances);
            
            // 生成能力发展建议
            List<String> developmentSuggestions = generateDevelopmentSuggestions(capabilityPerformances);
            
            result.put("capabilityAnalysis", capabilityAnalysis);
            result.put("radarData", radarData);
            result.put("developmentSuggestions", developmentSuggestions);
            result.put("overallAssessment", generateOverallAssessment(capabilityPerformances));
            
            return result;
            
        } catch (Exception e) {
            throw new RuntimeException("能力分析失败：" + e.getMessage(), e);
        }
    }
    
    /**
     * 分析学生在课程中的能力发展轨迹
     */
    public Map<String, Object> analyzeCapabilityDevelopment(Long studentId, Long courseId) {
        try {
            // 获取课程中的所有考试
            List<ExamResult> examResults = examResultRepository.findByStudentIdAndCourseIdOrderBySubmitTime(studentId, courseId);
            
            Map<String, List<Double>> capabilityTrends = new HashMap<>();
            List<String> timePoints = new ArrayList<>();
            
            for (ExamResult examResult : examResults) {
                Map<String, Object> capabilityAnalysis = analyzeStudentCapabilities(studentId, examResult.getExam().getId());
                @SuppressWarnings("unchecked")
                Map<String, Map<String, Object>> analysis = (Map<String, Map<String, Object>>) capabilityAnalysis.get("capabilityAnalysis");
                
                timePoints.add(examResult.getSubmitTime().toString());
                
                for (Map.Entry<String, Map<String, Object>> entry : analysis.entrySet()) {
                    String capability = entry.getKey();
                    Double accuracy = (Double) entry.getValue().get("accuracy");
                    
                    capabilityTrends.computeIfAbsent(capability, k -> new ArrayList<>()).add(accuracy);
                }
            }
            
            Map<String, Object> result = new HashMap<>();
            result.put("capabilityTrends", capabilityTrends);
            result.put("timePoints", timePoints);
            result.put("progressSummary", generateProgressSummary(capabilityTrends));
            
            return result;
            
        } catch (Exception e) {
            throw new RuntimeException("能力发展分析失败：" + e.getMessage(), e);
        }
    }
    
    /**
     * 能力表现内部类
     */
    private static class CapabilityPerformance {
        private String capability;
        private int totalQuestions = 0;
        private int correctAnswers = 0;
        private double totalDifficulty = 0;
        private List<String> strengths = new ArrayList<>();
        private List<String> weaknesses = new ArrayList<>();
        
        public CapabilityPerformance(String capability) {
            this.capability = capability;
        }
        
        public void addQuestion(Question question, StudentAnswer answer) {
            totalQuestions++;
            if (answer != null && answer.getScore() != null && answer.getScore() > 0) {
                correctAnswers++;
            }
            if (question.getDifficultyLevel() != null) {
                totalDifficulty += question.getDifficultyLevel();
            }
            
            // 分析强弱项
            if (answer != null && answer.getScore() != null) {
                if (answer.getScore() > 0.8 * (question.getScore() != null ? question.getScore() : 100)) {
                    if (question.getDifficultyLevel() != null && question.getDifficultyLevel() >= 4) {
                        strengths.add("在高难度" + question.getType() + "题目上表现优秀");
                    }
                } else {
                    if (question.getDifficultyLevel() != null && question.getDifficultyLevel() <= 2) {
                        weaknesses.add("在基础" + question.getType() + "题目上需要加强");
                    }
                }
            }
        }
        
        public String getCapability() { return capability; }
        public int getTotalQuestions() { return totalQuestions; }
        public int getCorrectAnswers() { return correctAnswers; }
        public double getAccuracy() { return totalQuestions > 0 ? (double) correctAnswers / totalQuestions : 0; }
        public double getAverageDifficulty() { return totalQuestions > 0 ? totalDifficulty / totalQuestions : 0; }
        public int getAchievedLevel() { 
            double accuracy = getAccuracy();
            if (accuracy >= 0.9) return 5;
            if (accuracy >= 0.8) return 4;
            if (accuracy >= 0.7) return 3;
            if (accuracy >= 0.6) return 2;
            return 1;
        }
        public List<String> getStrengths() { return strengths; }
        public List<String> getWeaknesses() { return weaknesses; }
    }
    
    private List<String> generateImprovementSuggestions(CapabilityDimension dimension, CapabilityPerformance performance) {
        List<String> suggestions = new ArrayList<>();
        
        if (dimension == null) return suggestions;
        
        double accuracy = performance.getAccuracy();
        
        switch (dimension) {
            case THEORETICAL_MASTERY:
                if (accuracy < 0.7) {
                    suggestions.add("建议加强基础理论学习，重点复习核心概念和定义");
                    suggestions.add("通过制作概念图和思维导图来理清理论体系");
                }
                if (accuracy >= 0.7 && accuracy < 0.9) {
                    suggestions.add("可以尝试用理论解释实际案例，提高理论应用能力");
                }
                break;
                
            case PRACTICAL_APPLICATION:
                if (accuracy < 0.7) {
                    suggestions.add("建议增加实践练习，从简单操作开始逐步提升");
                    suggestions.add("寻找实际项目或案例进行练习");
                }
                suggestions.add("可以参与实验室项目或企业实习获得更多实践经验");
                break;
                
            case INNOVATIVE_THINKING:
                if (accuracy < 0.8) {
                    suggestions.add("培养发散思维，尝试用多种方法解决同一问题");
                    suggestions.add("阅读跨学科资料，拓宽思维边界");
                }
                suggestions.add("参与创新竞赛或头脑风暴活动");
                break;
                
            case KNOWLEDGE_TRANSFER:
                if (accuracy < 0.7) {
                    suggestions.add("练习将知识应用到不同情境中");
                    suggestions.add("学习类比思维，找出不同问题之间的共同点");
                }
                break;
        }
        
        return suggestions;
    }
    
    private Map<String, Double> calculateCapabilityRadar(Map<String, CapabilityPerformance> performances) {
        Map<String, Double> radarData = new HashMap<>();
        
        for (CapabilityDimension dimension : CapabilityDimension.values()) {
            CapabilityPerformance performance = performances.get(dimension.getCode());
            double score = performance != null ? performance.getAccuracy() * 100 : 0;
            radarData.put(dimension.getDisplayName(), score);
        }
        
        return radarData;
    }
    
    private List<String> generateDevelopmentSuggestions(Map<String, CapabilityPerformance> performances) {
        List<String> suggestions = new ArrayList<>();
        
        // 找出最弱的能力维度
        String weakestCapability = performances.entrySet().stream()
            .min(Map.Entry.comparingByValue((p1, p2) -> Double.compare(p1.getAccuracy(), p2.getAccuracy())))
            .map(Map.Entry::getKey)
            .orElse(null);
        
        if (weakestCapability != null) {
            CapabilityDimension dimension = CapabilityDimension.fromCode(weakestCapability);
            if (dimension != null) {
                suggestions.add("重点关注" + dimension.getDisplayName() + "能力的提升");
            }
        }
        
        // 找出最强的能力维度
        String strongestCapability = performances.entrySet().stream()
            .max(Map.Entry.comparingByValue((p1, p2) -> Double.compare(p1.getAccuracy(), p2.getAccuracy())))
            .map(Map.Entry::getKey)
            .orElse(null);
        
        if (strongestCapability != null) {
            CapabilityDimension dimension = CapabilityDimension.fromCode(strongestCapability);
            if (dimension != null) {
                suggestions.add("继续发挥" + dimension.getDisplayName() + "方面的优势");
            }
        }
        
        suggestions.add("建议制定个性化学习计划，平衡各项能力发展");
        suggestions.add("可以寻求教师指导，获得更有针对性的学习建议");
        
        return suggestions;
    }
    
    private Map<String, Object> generateOverallAssessment(Map<String, CapabilityPerformance> performances) {
        Map<String, Object> assessment = new HashMap<>();
        
        double overallAccuracy = performances.values().stream()
            .mapToDouble(CapabilityPerformance::getAccuracy)
            .average()
            .orElse(0.0);
        
        assessment.put("overallScore", Math.round(overallAccuracy * 100));
        assessment.put("level", getOverallLevel(overallAccuracy));
        assessment.put("summary", generateOverallSummary(overallAccuracy, performances));
        
        return assessment;
    }
    
    private String getOverallLevel(double accuracy) {
        if (accuracy >= 0.9) return "优秀";
        if (accuracy >= 0.8) return "良好";
        if (accuracy >= 0.7) return "中等";
        if (accuracy >= 0.6) return "及格";
        return "待提高";
    }
    
    private String generateOverallSummary(double overallAccuracy, Map<String, CapabilityPerformance> performances) {
        StringBuilder summary = new StringBuilder();
        
        summary.append("综合表现").append(getOverallLevel(overallAccuracy)).append("。");
        
        long strongCapabilities = performances.values().stream()
            .mapToDouble(CapabilityPerformance::getAccuracy)
            .filter(acc -> acc >= 0.8)
            .count();
        
        long weakCapabilities = performances.values().stream()
            .mapToDouble(CapabilityPerformance::getAccuracy)
            .filter(acc -> acc < 0.6)
            .count();
        
        if (strongCapabilities > 0) {
            summary.append("在").append(strongCapabilities).append("个能力维度表现突出。");
        }
        
        if (weakCapabilities > 0) {
            summary.append("有").append(weakCapabilities).append("个能力维度需要重点提升。");
        }
        
        return summary.toString();
    }
    
    private Map<String, Object> generateProgressSummary(Map<String, List<Double>> capabilityTrends) {
        Map<String, Object> summary = new HashMap<>();
        Map<String, String> trendAnalysis = new HashMap<>();
        
        for (Map.Entry<String, List<Double>> entry : capabilityTrends.entrySet()) {
            String capability = entry.getKey();
            List<Double> trends = entry.getValue();
            
            if (trends.size() >= 2) {
                double firstScore = trends.get(0);
                double lastScore = trends.get(trends.size() - 1);
                double improvement = lastScore - firstScore;
                
                if (improvement > 0.1) {
                    trendAnalysis.put(capability, "显著提升");
                } else if (improvement > 0.05) {
                    trendAnalysis.put(capability, "稳步提升");
                } else if (improvement > -0.05) {
                    trendAnalysis.put(capability, "基本稳定");
                } else {
                    trendAnalysis.put(capability, "需要关注");
                }
            }
        }
        
        summary.put("trendAnalysis", trendAnalysis);
        return summary;
    }
} 