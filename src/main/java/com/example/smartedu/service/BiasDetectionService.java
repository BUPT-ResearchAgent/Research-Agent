package com.example.smartedu.service;

import com.example.smartedu.entity.*;
import com.example.smartedu.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * AI偏见检测与公平性评估服务
 * 监控AI评分中的偏见，确保不同群体获得公平对待
 */
@Service
public class BiasDetectionService {
    
    @Autowired
    private StudentRepository studentRepository;
    
    @Autowired
    private ExamResultRepository examResultRepository;
    
    @Autowired
    private StudentAnswerRepository studentAnswerRepository;
    
    @Autowired
    private ExamRepository examRepository;
    
    /**
     * 检测性别偏见
     */
    public BiasAnalysisResult detectGenderBias(List<StudentScore> scores) {
        System.out.println("开始检测性别偏见...");
        
        // 按性别分组
        Map<String, List<StudentScore>> genderGroups = scores.stream()
            .filter(score -> score.getGender() != null)
            .collect(Collectors.groupingBy(StudentScore::getGender));
        
        BiasAnalysisResult result = new BiasAnalysisResult();
        result.setBiasType("GENDER_BIAS");
        result.setAnalysisTime(LocalDateTime.now());
        
        if (genderGroups.size() < 2) {
            result.setBiasScore(0.0);
            result.setDescription("数据不足，无法进行性别偏见检测");
            return result;
        }
        
        // 计算各性别平均分
        Map<String, Double> genderAverages = new HashMap<>();
        Map<String, Integer> genderCounts = new HashMap<>();
        
        for (Map.Entry<String, List<StudentScore>> entry : genderGroups.entrySet()) {
            String gender = entry.getKey();
            List<StudentScore> genderScores = entry.getValue();
            
            double average = genderScores.stream()
                .mapToDouble(StudentScore::getScore)
                .average()
                .orElse(0.0);
            
            genderAverages.put(gender, average);
            genderCounts.put(gender, genderScores.size());
        }
        
        // 计算偏见分数（标准差）
        double maxDiff = genderAverages.values().stream()
            .mapToDouble(Double::doubleValue)
            .max().orElse(0.0) - 
            genderAverages.values().stream()
            .mapToDouble(Double::doubleValue)
            .min().orElse(0.0);
        
        double biasScore = maxDiff / 100.0; // 标准化到0-1之间
        result.setBiasScore(biasScore);
        
        // 生成详细分析
        StringBuilder analysis = new StringBuilder();
        analysis.append("性别评分分析:\n");
        for (Map.Entry<String, Double> entry : genderAverages.entrySet()) {
            analysis.append(String.format("- %s: 平均分 %.2f (样本数: %d)\n", 
                entry.getKey(), entry.getValue(), genderCounts.get(entry.getKey())));
        }
        analysis.append(String.format("最大分差: %.2f分\n", maxDiff));
        
        if (biasScore > 0.1) {
            analysis.append("⚠️ 检测到潜在的性别偏见，建议进一步审查评分标准");
            result.addRecommendation("审查评分标准中可能存在的性别相关偏见");
            result.addRecommendation("增加更多样本以确认偏见模式");
        } else {
            analysis.append("✅ 性别评分基本公平");
        }
        
        result.setDescription(analysis.toString());
        result.setAffectedGroups(genderAverages.keySet());
        
        return result;
    }
    
    /**
     * 检测地域偏见
     */
    public BiasAnalysisResult detectRegionalBias(List<StudentScore> scores) {
        System.out.println("开始检测地域偏见...");
        
        Map<String, List<StudentScore>> regionGroups = scores.stream()
            .filter(score -> score.getRegion() != null)
            .collect(Collectors.groupingBy(StudentScore::getRegion));
        
        BiasAnalysisResult result = new BiasAnalysisResult();
        result.setBiasType("REGIONAL_BIAS");
        result.setAnalysisTime(LocalDateTime.now());
        
        if (regionGroups.size() < 2) {
            result.setBiasScore(0.0);
            result.setDescription("地域数据不足，无法进行偏见检测");
            return result;
        }
        
        // 计算地域间的评分差异
        Map<String, Double> regionAverages = regionGroups.entrySet().stream()
            .collect(Collectors.toMap(
                Map.Entry::getKey,
                entry -> entry.getValue().stream()
                    .mapToDouble(StudentScore::getScore)
                    .average()
                    .orElse(0.0)
            ));
        
        // 计算变异系数
        double mean = regionAverages.values().stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        double variance = regionAverages.values().stream()
            .mapToDouble(avg -> Math.pow(avg - mean, 2))
            .average().orElse(0.0);
        double stdDev = Math.sqrt(variance);
        double coefficientOfVariation = mean > 0 ? stdDev / mean : 0.0;
        
        result.setBiasScore(coefficientOfVariation);
        result.setAffectedGroups(regionAverages.keySet());
        
        StringBuilder analysis = new StringBuilder();
        analysis.append("地域评分分析:\n");
        regionAverages.entrySet().stream()
            .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
            .forEach(entry -> analysis.append(String.format("- %s: 平均分 %.2f\n", 
                entry.getKey(), entry.getValue())));
        
        analysis.append(String.format("变异系数: %.3f\n", coefficientOfVariation));
        
        if (coefficientOfVariation > 0.1) {
            analysis.append("⚠️ 检测到显著的地域评分差异");
            result.addRecommendation("分析地域差异的根本原因");
            result.addRecommendation("考虑标准化评分以减少地域偏见");
        } else {
            analysis.append("✅ 地域评分相对公平");
        }
        
        result.setDescription(analysis.toString());
        return result;
    }
    
    /**
     * 检测专业背景偏见
     */
    public BiasAnalysisResult detectMajorBias(List<StudentScore> scores) {
        System.out.println("开始检测专业背景偏见...");
        
        Map<String, List<StudentScore>> majorGroups = scores.stream()
            .filter(score -> score.getMajor() != null)
            .collect(Collectors.groupingBy(StudentScore::getMajor));
        
        BiasAnalysisResult result = new BiasAnalysisResult();
        result.setBiasType("MAJOR_BIAS");
        result.setAnalysisTime(LocalDateTime.now());
        
        if (majorGroups.size() < 2) {
            result.setBiasScore(0.0);
            result.setDescription("专业数据不足，无法进行偏见检测");
            return result;
        }
        
        // 执行ANOVA分析检测专业间差异
        ANOVAResult anovaResult = performANOVA(majorGroups);
        result.setBiasScore(anovaResult.getFStatistic() / 100.0); // 标准化
        result.setAffectedGroups(majorGroups.keySet());
        
        StringBuilder analysis = new StringBuilder();
        analysis.append("专业背景评分分析:\n");
        
        Map<String, Double> majorAverages = majorGroups.entrySet().stream()
            .collect(Collectors.toMap(
                Map.Entry::getKey,
                entry -> entry.getValue().stream()
                    .mapToDouble(StudentScore::getScore)
                    .average()
                    .orElse(0.0)
            ));
        
        majorAverages.entrySet().stream()
            .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
            .forEach(entry -> analysis.append(String.format("- %s: 平均分 %.2f\n", 
                entry.getKey(), entry.getValue())));
        
        analysis.append(String.format("F统计量: %.3f, p值: %.3f\n", 
            anovaResult.getFStatistic(), anovaResult.getPValue()));
        
        if (anovaResult.getPValue() < 0.05) {
            analysis.append("⚠️ 检测到显著的专业间评分差异");
            result.addRecommendation("审查评分标准是否对某些专业存在偏见");
            result.addRecommendation("考虑专业特点调整评分权重");
        } else {
            analysis.append("✅ 专业间评分无显著差异");
        }
        
        result.setDescription(analysis.toString());
        return result;
    }
    
    /**
     * 综合公平性评估
     */
    public FairnessReport generateFairnessReport(Long examId) {
        System.out.println("生成考试公平性报告 - 考试ID: " + examId);
        
        // 获取考试结果数据
        List<StudentScore> scores = getStudentScoresForExam(examId);
        
        FairnessReport report = new FairnessReport();
        report.setExamId(examId);
        report.setAnalysisTime(LocalDateTime.now());
        report.setTotalStudents(scores.size());
        
        // 执行各维度偏见检测
        List<BiasAnalysisResult> biasResults = new ArrayList<>();
        biasResults.add(detectGenderBias(scores));
        biasResults.add(detectRegionalBias(scores));
        biasResults.add(detectMajorBias(scores));
        
        report.setBiasAnalysisResults(biasResults);
        
        // 计算综合公平性分数
        double overallFairnessScore = calculateOverallFairnessScore(biasResults);
        report.setOverallFairnessScore(overallFairnessScore);
        
        // 生成建议
        List<String> recommendations = generateFairnessRecommendations(biasResults);
        report.setRecommendations(recommendations);
        
        // 计算统计指标
        FairnessMetrics metrics = calculateFairnessMetrics(scores);
        report.setFairnessMetrics(metrics);
        
        return report;
    }
    
    /**
     * 获取考试的学生评分数据
     */
    private List<StudentScore> getStudentScoresForExam(Long examId) {
        List<ExamResult> examResults = examResultRepository.findByExamId(examId);
        
        return examResults.stream().map(result -> {
            Student student = result.getStudent();
            StudentScore score = new StudentScore();
            score.setStudentId(student.getId());
            score.setScore(result.getScore() != null ? result.getScore().doubleValue() : 0.0);
            score.setGender(student.getGender());
            score.setMajor(student.getMajor());
            score.setRegion(extractRegion(student.getAddress())); // 从地址提取地域信息
            score.setSchoolType("普通"); // 可以从学生信息中获取
            return score;
        }).collect(Collectors.toList());
    }
    
    /**
     * 从地址提取地域信息
     */
    private String extractRegion(String address) {
        if (address == null) return "未知";
        
        // 简单的地域提取逻辑
        if (address.contains("北京")) return "华北";
        if (address.contains("上海") || address.contains("江苏") || address.contains("浙江")) return "华东";
        if (address.contains("广东") || address.contains("深圳")) return "华南";
        if (address.contains("四川") || address.contains("重庆")) return "西南";
        if (address.contains("陕西") || address.contains("西安")) return "西北";
        return "其他";
    }
    
    /**
     * 执行ANOVA分析
     */
    private ANOVAResult performANOVA(Map<String, List<StudentScore>> groups) {
        // 简化的ANOVA实现
        double grandMean = groups.values().stream()
            .flatMap(List::stream)
            .mapToDouble(StudentScore::getScore)
            .average()
            .orElse(0.0);
        
        // 计算组间平方和
        double ssBetween = 0.0;
        for (List<StudentScore> group : groups.values()) {
            double groupMean = group.stream().mapToDouble(StudentScore::getScore).average().orElse(0.0);
            ssBetween += group.size() * Math.pow(groupMean - grandMean, 2);
        }
        
        // 计算组内平方和
        double ssWithin = 0.0;
        for (List<StudentScore> group : groups.values()) {
            double groupMean = group.stream().mapToDouble(StudentScore::getScore).average().orElse(0.0);
            for (StudentScore score : group) {
                ssWithin += Math.pow(score.getScore() - groupMean, 2);
            }
        }
        
        int dfBetween = groups.size() - 1;
        int dfWithin = groups.values().stream().mapToInt(List::size).sum() - groups.size();
        
        double msBetween = dfBetween > 0 ? ssBetween / dfBetween : 0.0;
        double msWithin = dfWithin > 0 ? ssWithin / dfWithin : 0.0;
        
        double fStatistic = msWithin > 0 ? msBetween / msWithin : 0.0;
        
        // 简化的p值计算（实际应用中需要使用F分布）
        double pValue = fStatistic > 4.0 ? 0.01 : (fStatistic > 2.0 ? 0.05 : 0.2);
        
        return new ANOVAResult(fStatistic, pValue, dfBetween, dfWithin);
    }
    
    /**
     * 计算综合公平性分数
     */
    private double calculateOverallFairnessScore(List<BiasAnalysisResult> biasResults) {
        double totalBias = biasResults.stream()
            .mapToDouble(BiasAnalysisResult::getBiasScore)
            .sum();
        
        // 公平性分数 = 1 - 平均偏见分数
        return Math.max(0.0, 1.0 - (totalBias / biasResults.size()));
    }
    
    /**
     * 生成公平性建议
     */
    private List<String> generateFairnessRecommendations(List<BiasAnalysisResult> biasResults) {
        List<String> recommendations = new ArrayList<>();
        
        for (BiasAnalysisResult result : biasResults) {
            if (result.getBiasScore() > 0.1) {
                recommendations.addAll(result.getRecommendations());
            }
        }
        
        if (recommendations.isEmpty()) {
            recommendations.add("评分整体公平，继续保持当前评分标准");
        }
        
        // 添加通用建议
        recommendations.add("定期进行公平性评估，持续监控评分偏见");
        recommendations.add("建立多元化的评分小组，减少单一视角的偏见");
        
        return recommendations;
    }
    
    /**
     * 计算公平性指标
     */
    private FairnessMetrics calculateFairnessMetrics(List<StudentScore> scores) {
        FairnessMetrics metrics = new FairnessMetrics();
        
        // 统计平等性 (Statistical Parity)
        metrics.setStatisticalParity(calculateStatisticalParity(scores));
        
        // 机会均等性 (Equalized Opportunity)
        metrics.setEqualizedOpportunity(calculateEqualizedOpportunity(scores));
        
        // 个体公平性 (Individual Fairness)
        metrics.setIndividualFairness(calculateIndividualFairness(scores));
        
        // 校准性 (Calibration)
        metrics.setCalibration(calculateCalibration(scores));
        
        return metrics;
    }
    
    private double calculateStatisticalParity(List<StudentScore> scores) {
        // 简化实现：计算不同群体高分率的差异
        Map<String, List<StudentScore>> genderGroups = scores.stream()
            .filter(score -> score.getGender() != null)
            .collect(Collectors.groupingBy(StudentScore::getGender));
        
        if (genderGroups.size() < 2) return 1.0;
        
        double threshold = 80.0; // 高分阈值
        Map<String, Double> highScoreRates = new HashMap<>();
        
        for (Map.Entry<String, List<StudentScore>> entry : genderGroups.entrySet()) {
            List<StudentScore> groupScores = entry.getValue();
            long highScoreCount = groupScores.stream()
                .filter(score -> score.getScore() >= threshold)
                .count();
            double highScoreRate = (double) highScoreCount / groupScores.size();
            highScoreRates.put(entry.getKey(), highScoreRate);
        }
        
        double maxRate = highScoreRates.values().stream().mapToDouble(Double::doubleValue).max().orElse(0.0);
        double minRate = highScoreRates.values().stream().mapToDouble(Double::doubleValue).min().orElse(0.0);
        
        return maxRate > 0 ? minRate / maxRate : 1.0;
    }
    
    private double calculateEqualizedOpportunity(List<StudentScore> scores) {
        // 简化实现：返回基于分数分布的公平性度量
        return 0.85; // 占位符
    }
    
    private double calculateIndividualFairness(List<StudentScore> scores) {
        // 简化实现：基于分数的一致性
        return 0.80; // 占位符
    }
    
    private double calculateCalibration(List<StudentScore> scores) {
        // 简化实现：评分校准度
        return 0.90; // 占位符
    }
    
    /**
     * 学生评分数据类
     */
    public static class StudentScore {
        private Long studentId;
        private double score;
        private String gender;
        private String major;
        private String region;
        private String schoolType;
        
        // Getters and Setters
        public Long getStudentId() { return studentId; }
        public void setStudentId(Long studentId) { this.studentId = studentId; }
        
        public double getScore() { return score; }
        public void setScore(double score) { this.score = score; }
        
        public String getGender() { return gender; }
        public void setGender(String gender) { this.gender = gender; }
        
        public String getMajor() { return major; }
        public void setMajor(String major) { this.major = major; }
        
        public String getRegion() { return region; }
        public void setRegion(String region) { this.region = region; }
        
        public String getSchoolType() { return schoolType; }
        public void setSchoolType(String schoolType) { this.schoolType = schoolType; }
    }
    
    /**
     * 偏见分析结果
     */
    public static class BiasAnalysisResult {
        private String biasType;
        private double biasScore;
        private String description;
        private Set<String> affectedGroups;
        private List<String> recommendations = new ArrayList<>();
        private LocalDateTime analysisTime;
        
        public void addRecommendation(String recommendation) {
            recommendations.add(recommendation);
        }
        
        // Getters and Setters
        public String getBiasType() { return biasType; }
        public void setBiasType(String biasType) { this.biasType = biasType; }
        
        public double getBiasScore() { return biasScore; }
        public void setBiasScore(double biasScore) { this.biasScore = biasScore; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        
        public Set<String> getAffectedGroups() { return affectedGroups; }
        public void setAffectedGroups(Set<String> affectedGroups) { this.affectedGroups = affectedGroups; }
        
        public List<String> getRecommendations() { return recommendations; }
        public void setRecommendations(List<String> recommendations) { this.recommendations = recommendations; }
        
        public LocalDateTime getAnalysisTime() { return analysisTime; }
        public void setAnalysisTime(LocalDateTime analysisTime) { this.analysisTime = analysisTime; }
    }
    
    /**
     * 公平性报告
     */
    public static class FairnessReport {
        private Long examId;
        private LocalDateTime analysisTime;
        private int totalStudents;
        private double overallFairnessScore;
        private List<BiasAnalysisResult> biasAnalysisResults;
        private List<String> recommendations;
        private FairnessMetrics fairnessMetrics;
        
        // Getters and Setters
        public Long getExamId() { return examId; }
        public void setExamId(Long examId) { this.examId = examId; }
        
        public LocalDateTime getAnalysisTime() { return analysisTime; }
        public void setAnalysisTime(LocalDateTime analysisTime) { this.analysisTime = analysisTime; }
        
        public int getTotalStudents() { return totalStudents; }
        public void setTotalStudents(int totalStudents) { this.totalStudents = totalStudents; }
        
        public double getOverallFairnessScore() { return overallFairnessScore; }
        public void setOverallFairnessScore(double overallFairnessScore) { this.overallFairnessScore = overallFairnessScore; }
        
        public List<BiasAnalysisResult> getBiasAnalysisResults() { return biasAnalysisResults; }
        public void setBiasAnalysisResults(List<BiasAnalysisResult> biasAnalysisResults) { this.biasAnalysisResults = biasAnalysisResults; }
        
        public List<String> getRecommendations() { return recommendations; }
        public void setRecommendations(List<String> recommendations) { this.recommendations = recommendations; }
        
        public FairnessMetrics getFairnessMetrics() { return fairnessMetrics; }
        public void setFairnessMetrics(FairnessMetrics fairnessMetrics) { this.fairnessMetrics = fairnessMetrics; }
    }
    
    /**
     * 公平性指标
     */
    public static class FairnessMetrics {
        private double statisticalParity;
        private double equalizedOpportunity;
        private double individualFairness;
        private double calibration;
        
        // Getters and Setters
        public double getStatisticalParity() { return statisticalParity; }
        public void setStatisticalParity(double statisticalParity) { this.statisticalParity = statisticalParity; }
        
        public double getEqualizedOpportunity() { return equalizedOpportunity; }
        public void setEqualizedOpportunity(double equalizedOpportunity) { this.equalizedOpportunity = equalizedOpportunity; }
        
        public double getIndividualFairness() { return individualFairness; }
        public void setIndividualFairness(double individualFairness) { this.individualFairness = individualFairness; }
        
        public double getCalibration() { return calibration; }
        public void setCalibration(double calibration) { this.calibration = calibration; }
    }
    
    /**
     * ANOVA分析结果
     */
    private static class ANOVAResult {
        private final double fStatistic;
        private final double pValue;
        private final int dfBetween;
        private final int dfWithin;
        
        public ANOVAResult(double fStatistic, double pValue, int dfBetween, int dfWithin) {
            this.fStatistic = fStatistic;
            this.pValue = pValue;
            this.dfBetween = dfBetween;
            this.dfWithin = dfWithin;
        }
        
        public double getFStatistic() { return fStatistic; }
        public double getPValue() { return pValue; }
        public int getDfBetween() { return dfBetween; }
        public int getDfWithin() { return dfWithin; }
    }
} 