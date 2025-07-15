package com.example.smartedu.service;

import com.example.smartedu.entity.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * AI决策可解释性服务
 * 为AI评分提供详细解释，增强透明度和可信度
 */
@Service
public class ExplainableAIService {
    
    /**
     * 生成评分解释
     */
    public ScoreExplanation generateScoreExplanation(StudentAnswer answer, AIGradingResult result) {
        System.out.println("生成AI评分解释 - 答案ID: " + answer.getId() + ", 分数: " + result.getScore());
        
        ScoreExplanation explanation = new ScoreExplanation();
        explanation.setAnswerId(answer.getId());
        explanation.setQuestionId(answer.getQuestion().getId());
        explanation.setStudentId(answer.getStudent().getId());
        explanation.setAiScore(result.getScore());
        explanation.setMaxScore(answer.getQuestion().getScore());
        explanation.setGeneratedTime(LocalDateTime.now());
        
        // 生成评分标准解释
        List<ScoringCriterion> criteria = generateScoringCriteria(answer.getQuestion(), result);
        explanation.setScoringCriteria(criteria);
        
        // 识别关键得分点
        List<KeyScoringPoint> keyPoints = identifyKeyScoringPoints(answer, result);
        explanation.setKeyScoringPoints(keyPoints);
        
        // 生成分数构成分析
        ScoreBreakdown breakdown = analyzeScoreBreakdown(answer, result);
        explanation.setScoreBreakdown(breakdown);
        
        // 提供改进建议
        List<String> improvements = generateImprovementSuggestions(answer, result);
        explanation.setImprovementSuggestions(improvements);
        
        // 计算置信度
        double confidence = calculateExplanationConfidence(answer, result);
        explanation.setConfidence(confidence);
        
        return explanation;
    }
    
    /**
     * 分析特征重要性
     */
    public List<FeatureImportance> analyzeFeatureImportance(String questionType, String answer) {
        System.out.println("分析特征重要性 - 题目类型: " + questionType);
        
        List<FeatureImportance> features = new ArrayList<>();
        
        // 根据题目类型分析不同特征
        switch (questionType.toLowerCase()) {
            case "主观题":
            case "解答题":
                features.addAll(analyzeSubjectiveFeatures(answer));
                break;
            case "计算题":
                features.addAll(analyzeCalculationFeatures(answer));
                break;
            case "论述题":
                features.addAll(analyzeEssayFeatures(answer));
                break;
            default:
                features.addAll(analyzeGeneralFeatures(answer));
        }
        
        // 按重要性排序
        return features.stream()
            .sorted((a, b) -> Double.compare(b.getImportanceScore(), a.getImportanceScore()))
            .collect(Collectors.toList());
    }
    
    /**
     * 对比分析相似答案
     */
    public ComparisonAnalysis compareWithSimilarAnswers(StudentAnswer answer, List<StudentAnswer> similarAnswers) {
        System.out.println("对比分析相似答案 - 基准答案ID: " + answer.getId() + ", 对比答案数: " + similarAnswers.size());
        
        ComparisonAnalysis analysis = new ComparisonAnalysis();
        analysis.setBaseAnswerId(answer.getId());
        analysis.setBaseScore(answer.getScore() != null ? answer.getScore() : 0);
        analysis.setComparisonTime(LocalDateTime.now());
        
        // 计算相似性分析
        List<SimilarityComparison> comparisons = new ArrayList<>();
        for (StudentAnswer similar : similarAnswers) {
            SimilarityComparison comparison = calculateSimilarity(answer, similar);
            comparisons.add(comparison);
        }
        
        // 按相似度排序
        comparisons.sort((a, b) -> Double.compare(b.getSimilarityScore(), a.getSimilarityScore()));
        analysis.setSimilarComparisons(comparisons);
        
        // 分析评分差异
        AnalyzedScoreDifferences scoreDiffs = analyzeScoreDifferences(answer, similarAnswers);
        analysis.setScoreDifferences(scoreDiffs);
        
        // 生成对比结论
        String conclusion = generateComparisonConclusion(answer, comparisons);
        analysis.setConclusion(conclusion);
        
        return analysis;
    }
    
    /**
     * 生成评分标准解释
     */
    private List<ScoringCriterion> generateScoringCriteria(Question question, AIGradingResult result) {
        List<ScoringCriterion> criteria = new ArrayList<>();
        
        // 基本评分标准
        criteria.add(new ScoringCriterion(
            "内容准确性", 
            "答案内容的正确性和准确度", 
            30, 
            result.getContentAccuracy() != null ? result.getContentAccuracy() : 0.8
        ));
        
        criteria.add(new ScoringCriterion(
            "逻辑清晰度", 
            "答案逻辑结构的清晰程度", 
            25, 
            result.getLogicClarity() != null ? result.getLogicClarity() : 0.7
        ));
        
        criteria.add(new ScoringCriterion(
            "完整性", 
            "答案是否完整回答了题目要求", 
            25, 
            result.getCompleteness() != null ? result.getCompleteness() : 0.75
        ));
        
        criteria.add(new ScoringCriterion(
            "表达规范性", 
            "语言表达和格式的规范程度", 
            20, 
            result.getExpressionQuality() != null ? result.getExpressionQuality() : 0.8
        ));
        
        return criteria;
    }
    
    /**
     * 识别关键得分点
     */
    private List<KeyScoringPoint> identifyKeyScoringPoints(StudentAnswer answer, AIGradingResult result) {
        List<KeyScoringPoint> keyPoints = new ArrayList<>();
        
        String answerText = answer.getAnswer();
        if (answerText == null || answerText.isEmpty()) {
            keyPoints.add(new KeyScoringPoint("未作答", "学生未提供答案", 0, "critical"));
            return keyPoints;
        }
        
        // 分析答案中的关键词
        List<String> keywords = extractKeywords(answerText);
        for (String keyword : keywords) {
            KeyScoringPoint point = new KeyScoringPoint(
                "关键概念", 
                "答案包含关键概念: " + keyword, 
                5, 
                "positive"
            );
            keyPoints.add(point);
        }
        
        // 分析答案结构
        if (hasGoodStructure(answerText)) {
            keyPoints.add(new KeyScoringPoint(
                "结构完整", 
                "答案具有清晰的结构层次", 
                10, 
                "positive"
            ));
        }
        
        // 分析论证质量
        if (hasGoodReasoning(answerText)) {
            keyPoints.add(new KeyScoringPoint(
                "论证充分", 
                "答案提供了充分的论证和说明", 
                15, 
                "positive"
            ));
        }
        
        return keyPoints;
    }
    
    /**
     * 分析评分构成
     */
    private ScoreBreakdown analyzeScoreBreakdown(StudentAnswer answer, AIGradingResult result) {
        ScoreBreakdown breakdown = new ScoreBreakdown();
        breakdown.setTotalScore(result.getScore());
        breakdown.setMaxScore(answer.getQuestion().getScore());
        
        // 分解各部分得分
        Map<String, Double> components = new HashMap<>();
        components.put("内容得分", result.getScore() * 0.4);
        components.put("逻辑得分", result.getScore() * 0.3);
        components.put("表达得分", result.getScore() * 0.2);
        components.put("创新得分", result.getScore() * 0.1);
        
        breakdown.setScoreComponents(components);
        
        // 计算得分率
        double scoreRate = (double) result.getScore() / answer.getQuestion().getScore();
        breakdown.setScoreRate(scoreRate);
        
        return breakdown;
    }
    
    /**
     * 生成改进建议
     */
    private List<String> generateImprovementSuggestions(StudentAnswer answer, AIGradingResult result) {
        List<String> suggestions = new ArrayList<>();
        
        if (result.getScore() < answer.getQuestion().getScore() * 0.6) {
            suggestions.add("建议重新审题，确保理解题目要求");
            suggestions.add("答案内容需要更加充实和具体");
        }
        
        if (result.getLogicClarity() != null && result.getLogicClarity() < 0.7) {
            suggestions.add("建议重新组织答案结构，使逻辑更加清晰");
            suggestions.add("可以使用序号或分点来整理答案");
        }
        
        if (result.getCompleteness() != null && result.getCompleteness() < 0.8) {
            suggestions.add("答案不够完整，建议补充相关要点");
            suggestions.add("检查是否遗漏了题目的某些要求");
        }
        
        if (suggestions.isEmpty()) {
            suggestions.add("答案质量良好，继续保持");
            suggestions.add("可以尝试增加一些个人见解或案例");
        }
        
        return suggestions;
    }
    
    /**
     * 计算解释置信度
     */
    private double calculateExplanationConfidence(StudentAnswer answer, AIGradingResult result) {
        double confidence = 0.8; // 基础置信度
        
        // 根据答案长度调整
        String answerText = answer.getAnswer();
        if (answerText != null) {
            if (answerText.length() < 50) {
                confidence -= 0.2; // 答案太短，置信度下降
            } else if (answerText.length() > 500) {
                confidence += 0.1; // 答案充实，置信度提升
            }
        }
        
        // 根据AI评分的一致性调整
        if (result.getConfidenceScore() != null) {
            confidence = (confidence + result.getConfidenceScore()) / 2;
        }
        
        return Math.max(0.0, Math.min(1.0, confidence));
    }
    
    /**
     * 分析主观题特征
     */
    private List<FeatureImportance> analyzeSubjectiveFeatures(String answer) {
        List<FeatureImportance> features = new ArrayList<>();
        
        features.add(new FeatureImportance("答案长度", calculateLengthScore(answer), 0.15, "较长的答案通常包含更多信息"));
        features.add(new FeatureImportance("关键词密度", calculateKeywordDensity(answer), 0.25, "包含更多关键概念"));
        features.add(new FeatureImportance("逻辑连接词", calculateLogicWords(answer), 0.20, "使用逻辑连接词表明思路清晰"));
        features.add(new FeatureImportance("专业术语", calculateProfessionalTerms(answer), 0.25, "正确使用专业术语"));
        features.add(new FeatureImportance("结构完整性", calculateStructureScore(answer), 0.15, "答案结构的完整程度"));
        
        return features;
    }
    
    /**
     * 分析计算题特征
     */
    private List<FeatureImportance> analyzeCalculationFeatures(String answer) {
        List<FeatureImportance> features = new ArrayList<>();
        
        features.add(new FeatureImportance("计算过程", calculateProcessScore(answer), 0.40, "完整的计算步骤"));
        features.add(new FeatureImportance("公式使用", calculateFormulaScore(answer), 0.30, "正确使用相关公式"));
        features.add(new FeatureImportance("结果准确性", calculateAccuracyScore(answer), 0.20, "计算结果的准确程度"));
        features.add(new FeatureImportance("单位标注", calculateUnitScore(answer), 0.10, "正确标注单位"));
        
        return features;
    }
    
    /**
     * 分析论述题特征
     */
    private List<FeatureImportance> analyzeEssayFeatures(String answer) {
        List<FeatureImportance> features = new ArrayList<>();
        
        features.add(new FeatureImportance("论点清晰度", calculateArgumentClarity(answer), 0.25, "论点是否明确"));
        features.add(new FeatureImportance("论证充分性", calculateEvidenceScore(answer), 0.30, "论证材料的充分程度"));
        features.add(new FeatureImportance("逻辑严密性", calculateLogicStrictness(answer), 0.25, "论证逻辑的严密程度"));
        features.add(new FeatureImportance("语言表达", calculateLanguageQuality(answer), 0.20, "语言表达的质量"));
        
        return features;
    }
    
    /**
     * 分析通用特征
     */
    private List<FeatureImportance> analyzeGeneralFeatures(String answer) {
        List<FeatureImportance> features = new ArrayList<>();
        
        features.add(new FeatureImportance("内容丰富度", calculateContentRichness(answer), 0.30, "答案内容的丰富程度"));
        features.add(new FeatureImportance("相关性", calculateRelevanceScore(answer), 0.30, "答案与题目的相关性"));
        features.add(new FeatureImportance("原创性", calculateOriginalityScore(answer), 0.20, "答案的原创性程度"));
        features.add(new FeatureImportance("规范性", calculateFormatScore(answer), 0.20, "答案格式的规范性"));
        
        return features;
    }
    
    // 简化的特征计算方法
    private double calculateLengthScore(String answer) {
        if (answer == null) return 0.0;
        int length = answer.length();
        return Math.min(1.0, length / 500.0); // 500字符为满分
    }
    
    private double calculateKeywordDensity(String answer) {
        if (answer == null) return 0.0;
        List<String> keywords = extractKeywords(answer);
        return Math.min(1.0, keywords.size() / 10.0); // 10个关键词为满分
    }
    
    private double calculateLogicWords(String answer) {
        if (answer == null) return 0.0;
        String[] logicWords = {"因此", "所以", "由于", "首先", "其次", "最后", "综上", "总之"};
        long count = Arrays.stream(logicWords).mapToLong(word -> 
            answer.length() - answer.replace(word, "").length()).sum() / 2; // 除以2近似计算词频
        return Math.min(1.0, count / 5.0);
    }
    
    private double calculateProfessionalTerms(String answer) {
        // 简化实现，实际应该根据学科建立专业词库
        return 0.7; // 占位符
    }
    
    private double calculateStructureScore(String answer) {
        if (answer == null) return 0.0;
        return hasGoodStructure(answer) ? 0.9 : 0.4;
    }
    
    private double calculateProcessScore(String answer) {
        // 检测计算过程的步骤
        if (answer == null) return 0.0;
        return answer.contains("=") ? 0.8 : 0.3;
    }
    
    private double calculateFormulaScore(String answer) {
        // 检测公式
        return 0.75; // 占位符
    }
    
    private double calculateAccuracyScore(String answer) {
        // 检测结果准确性
        return 0.8; // 占位符
    }
    
    private double calculateUnitScore(String answer) {
        // 检测单位标注
        return 0.6; // 占位符
    }
    
    private double calculateArgumentClarity(String answer) {
        return 0.7; // 占位符
    }
    
    private double calculateEvidenceScore(String answer) {
        return 0.8; // 占位符
    }
    
    private double calculateLogicStrictness(String answer) {
        return 0.75; // 占位符
    }
    
    private double calculateLanguageQuality(String answer) {
        return 0.8; // 占位符
    }
    
    private double calculateContentRichness(String answer) {
        return 0.7; // 占位符
    }
    
    private double calculateRelevanceScore(String answer) {
        return 0.85; // 占位符
    }
    
    private double calculateOriginalityScore(String answer) {
        return 0.6; // 占位符
    }
    
    private double calculateFormatScore(String answer) {
        return 0.8; // 占位符
    }
    
    /**
     * 提取关键词
     */
    private List<String> extractKeywords(String text) {
        if (text == null) return new ArrayList<>();
        
        // 简化的关键词提取
        String[] words = text.split("[\\s，。！？；：]");
        return Arrays.stream(words)
            .filter(word -> word.length() > 2)
            .limit(10)
            .collect(Collectors.toList());
    }
    
    /**
     * 检查是否有良好结构
     */
    private boolean hasGoodStructure(String text) {
        if (text == null) return false;
        
        // 简化检查：是否包含序号或分点
        return text.contains("1.") || text.contains("(1)") || 
               text.contains("首先") || text.contains("其次");
    }
    
    /**
     * 检查是否有良好论证
     */
    private boolean hasGoodReasoning(String text) {
        if (text == null) return false;
        
        // 简化检查：是否包含论证词汇
        return text.contains("因为") || text.contains("由于") || 
               text.contains("因此") || text.contains("所以");
    }
    
    /**
     * 计算答案相似性
     */
    private SimilarityComparison calculateSimilarity(StudentAnswer base, StudentAnswer compare) {
        SimilarityComparison comparison = new SimilarityComparison();
        comparison.setCompareAnswerId(compare.getId());
        comparison.setCompareScore(compare.getScore() != null ? compare.getScore() : 0);
        
        // 简化的相似性计算（实际应该使用更复杂的算法）
        String baseText = base.getAnswer() != null ? base.getAnswer() : "";
        String compareText = compare.getAnswer() != null ? compare.getAnswer() : "";
        
        // 基于长度的相似性
        double lengthSimilarity = 1.0 - Math.abs(baseText.length() - compareText.length()) / 
                                  (double) Math.max(baseText.length(), compareText.length());
        
        // 基于关键词的相似性
        List<String> baseKeywords = extractKeywords(baseText);
        List<String> compareKeywords = extractKeywords(compareText);
        
        long commonKeywords = baseKeywords.stream()
            .filter(compareKeywords::contains)
            .count();
        
        double keywordSimilarity = commonKeywords / (double) Math.max(baseKeywords.size(), compareKeywords.size());
        
        // 综合相似性分数
        double similarity = (lengthSimilarity + keywordSimilarity) / 2.0;
        comparison.setSimilarityScore(similarity);
        
        return comparison;
    }
    
    /**
     * 分析评分差异
     */
    private AnalyzedScoreDifferences analyzeScoreDifferences(StudentAnswer base, List<StudentAnswer> similar) {
        AnalyzedScoreDifferences analysis = new AnalyzedScoreDifferences();
        
        double baseScore = base.getScore() != null ? base.getScore() : 0;
        List<Double> otherScores = similar.stream()
            .map(answer -> answer.getScore() != null ? answer.getScore() : 0.0)
            .collect(Collectors.toList());
        
        double avgOtherScore = otherScores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        double scoreDifference = baseScore - avgOtherScore;
        
        analysis.setAverageScoreDifference(scoreDifference);
        analysis.setScoreVariance(calculateVariance(otherScores));
        
        if (Math.abs(scoreDifference) > 10) {
            analysis.setSignificantDifference(true);
            analysis.setDifferenceReason(scoreDifference > 0 ? "明显高于相似答案" : "明显低于相似答案");
        } else {
            analysis.setSignificantDifference(false);
            analysis.setDifferenceReason("评分与相似答案基本一致");
        }
        
        return analysis;
    }
    
    /**
     * 计算方差
     */
    private double calculateVariance(List<Double> scores) {
        double mean = scores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        return scores.stream()
            .mapToDouble(score -> Math.pow(score - mean, 2))
            .average()
            .orElse(0.0);
    }
    
    /**
     * 生成对比结论
     */
    private String generateComparisonConclusion(StudentAnswer base, List<SimilarityComparison> comparisons) {
        double avgSimilarity = comparisons.stream()
            .mapToDouble(SimilarityComparison::getSimilarityScore)
            .average()
            .orElse(0.0);
        
        if (avgSimilarity > 0.8) {
            return "该答案与相似答案高度一致，评分合理";
        } else if (avgSimilarity > 0.6) {
            return "该答案与相似答案基本一致，评分基本合理";
        } else {
            return "该答案具有独特性，建议人工复核评分";
        }
    }
    
    // 数据模型类定义
    
    /**
     * 评分解释
     */
    public static class ScoreExplanation {
        private Long answerId;
        private Long questionId;
        private Long studentId;
        private Integer aiScore;
        private Integer maxScore;
        private LocalDateTime generatedTime;
        private List<ScoringCriterion> scoringCriteria;
        private List<KeyScoringPoint> keyScoringPoints;
        private ScoreBreakdown scoreBreakdown;
        private List<String> improvementSuggestions;
        private double confidence;
        
        // Getters and Setters
        public Long getAnswerId() { return answerId; }
        public void setAnswerId(Long answerId) { this.answerId = answerId; }
        
        public Long getQuestionId() { return questionId; }
        public void setQuestionId(Long questionId) { this.questionId = questionId; }
        
        public Long getStudentId() { return studentId; }
        public void setStudentId(Long studentId) { this.studentId = studentId; }
        
        public Integer getAiScore() { return aiScore; }
        public void setAiScore(Integer aiScore) { this.aiScore = aiScore; }
        
        public Integer getMaxScore() { return maxScore; }
        public void setMaxScore(Integer maxScore) { this.maxScore = maxScore; }
        
        public LocalDateTime getGeneratedTime() { return generatedTime; }
        public void setGeneratedTime(LocalDateTime generatedTime) { this.generatedTime = generatedTime; }
        
        public List<ScoringCriterion> getScoringCriteria() { return scoringCriteria; }
        public void setScoringCriteria(List<ScoringCriterion> scoringCriteria) { this.scoringCriteria = scoringCriteria; }
        
        public List<KeyScoringPoint> getKeyScoringPoints() { return keyScoringPoints; }
        public void setKeyScoringPoints(List<KeyScoringPoint> keyScoringPoints) { this.keyScoringPoints = keyScoringPoints; }
        
        public ScoreBreakdown getScoreBreakdown() { return scoreBreakdown; }
        public void setScoreBreakdown(ScoreBreakdown scoreBreakdown) { this.scoreBreakdown = scoreBreakdown; }
        
        public List<String> getImprovementSuggestions() { return improvementSuggestions; }
        public void setImprovementSuggestions(List<String> improvementSuggestions) { this.improvementSuggestions = improvementSuggestions; }
        
        public double getConfidence() { return confidence; }
        public void setConfidence(double confidence) { this.confidence = confidence; }
    }
    
    /**
     * 评分标准
     */
    public static class ScoringCriterion {
        private String criterion;
        private String description;
        private int weight;
        private double performance;
        
        public ScoringCriterion(String criterion, String description, int weight, double performance) {
            this.criterion = criterion;
            this.description = description;
            this.weight = weight;
            this.performance = performance;
        }
        
        // Getters and Setters
        public String getCriterion() { return criterion; }
        public void setCriterion(String criterion) { this.criterion = criterion; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        
        public int getWeight() { return weight; }
        public void setWeight(int weight) { this.weight = weight; }
        
        public double getPerformance() { return performance; }
        public void setPerformance(double performance) { this.performance = performance; }
    }
    
    /**
     * 关键得分点
     */
    public static class KeyScoringPoint {
        private String pointType;
        private String description;
        private int pointValue;
        private String impact; // positive, negative, neutral, critical
        
        public KeyScoringPoint(String pointType, String description, int pointValue, String impact) {
            this.pointType = pointType;
            this.description = description;
            this.pointValue = pointValue;
            this.impact = impact;
        }
        
        // Getters and Setters
        public String getPointType() { return pointType; }
        public void setPointType(String pointType) { this.pointType = pointType; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        
        public int getPointValue() { return pointValue; }
        public void setPointValue(int pointValue) { this.pointValue = pointValue; }
        
        public String getImpact() { return impact; }
        public void setImpact(String impact) { this.impact = impact; }
    }
    
    /**
     * 分数构成分析
     */
    public static class ScoreBreakdown {
        private Integer totalScore;
        private Integer maxScore;
        private Map<String, Double> scoreComponents;
        private double scoreRate;
        
        // Getters and Setters
        public Integer getTotalScore() { return totalScore; }
        public void setTotalScore(Integer totalScore) { this.totalScore = totalScore; }
        
        public Integer getMaxScore() { return maxScore; }
        public void setMaxScore(Integer maxScore) { this.maxScore = maxScore; }
        
        public Map<String, Double> getScoreComponents() { return scoreComponents; }
        public void setScoreComponents(Map<String, Double> scoreComponents) { this.scoreComponents = scoreComponents; }
        
        public double getScoreRate() { return scoreRate; }
        public void setScoreRate(double scoreRate) { this.scoreRate = scoreRate; }
    }
    
    /**
     * 特征重要性
     */
    public static class FeatureImportance {
        private String featureName;
        private double featureValue;
        private double importanceScore;
        private String explanation;
        
        public FeatureImportance(String featureName, double featureValue, double importanceScore, String explanation) {
            this.featureName = featureName;
            this.featureValue = featureValue;
            this.importanceScore = importanceScore;
            this.explanation = explanation;
        }
        
        // Getters and Setters
        public String getFeatureName() { return featureName; }
        public void setFeatureName(String featureName) { this.featureName = featureName; }
        
        public double getFeatureValue() { return featureValue; }
        public void setFeatureValue(double featureValue) { this.featureValue = featureValue; }
        
        public double getImportanceScore() { return importanceScore; }
        public void setImportanceScore(double importanceScore) { this.importanceScore = importanceScore; }
        
        public String getExplanation() { return explanation; }
        public void setExplanation(String explanation) { this.explanation = explanation; }
    }
    
    /**
     * 对比分析结果
     */
    public static class ComparisonAnalysis {
        private Long baseAnswerId;
        private Integer baseScore;
        private LocalDateTime comparisonTime;
        private List<SimilarityComparison> similarComparisons;
        private AnalyzedScoreDifferences scoreDifferences;
        private String conclusion;
        
        // Getters and Setters
        public Long getBaseAnswerId() { return baseAnswerId; }
        public void setBaseAnswerId(Long baseAnswerId) { this.baseAnswerId = baseAnswerId; }
        
        public Integer getBaseScore() { return baseScore; }
        public void setBaseScore(Integer baseScore) { this.baseScore = baseScore; }
        
        public LocalDateTime getComparisonTime() { return comparisonTime; }
        public void setComparisonTime(LocalDateTime comparisonTime) { this.comparisonTime = comparisonTime; }
        
        public List<SimilarityComparison> getSimilarComparisons() { return similarComparisons; }
        public void setSimilarComparisons(List<SimilarityComparison> similarComparisons) { this.similarComparisons = similarComparisons; }
        
        public AnalyzedScoreDifferences getScoreDifferences() { return scoreDifferences; }
        public void setScoreDifferences(AnalyzedScoreDifferences scoreDifferences) { this.scoreDifferences = scoreDifferences; }
        
        public String getConclusion() { return conclusion; }
        public void setConclusion(String conclusion) { this.conclusion = conclusion; }
    }
    
    /**
     * 相似性对比
     */
    public static class SimilarityComparison {
        private Long compareAnswerId;
        private Integer compareScore;
        private double similarityScore;
        
        // Getters and Setters
        public Long getCompareAnswerId() { return compareAnswerId; }
        public void setCompareAnswerId(Long compareAnswerId) { this.compareAnswerId = compareAnswerId; }
        
        public Integer getCompareScore() { return compareScore; }
        public void setCompareScore(Integer compareScore) { this.compareScore = compareScore; }
        
        public double getSimilarityScore() { return similarityScore; }
        public void setSimilarityScore(double similarityScore) { this.similarityScore = similarityScore; }
    }
    
    /**
     * 评分差异分析
     */
    public static class AnalyzedScoreDifferences {
        private double averageScoreDifference;
        private double scoreVariance;
        private boolean significantDifference;
        private String differenceReason;
        
        // Getters and Setters
        public double getAverageScoreDifference() { return averageScoreDifference; }
        public void setAverageScoreDifference(double averageScoreDifference) { this.averageScoreDifference = averageScoreDifference; }
        
        public double getScoreVariance() { return scoreVariance; }
        public void setScoreVariance(double scoreVariance) { this.scoreVariance = scoreVariance; }
        
        public boolean isSignificantDifference() { return significantDifference; }
        public void setSignificantDifference(boolean significantDifference) { this.significantDifference = significantDifference; }
        
        public String getDifferenceReason() { return differenceReason; }
        public void setDifferenceReason(String differenceReason) { this.differenceReason = differenceReason; }
    }
    
    /**
     * AI评分结果（简化版本，实际应该引用现有的结果类）
     */
    public static class AIGradingResult {
        private Integer score;
        private Double confidenceScore;
        private Double contentAccuracy;
        private Double logicClarity;
        private Double completeness;
        private Double expressionQuality;
        
        // Getters and Setters
        public Integer getScore() { return score; }
        public void setScore(Integer score) { this.score = score; }
        
        public Double getConfidenceScore() { return confidenceScore; }
        public void setConfidenceScore(Double confidenceScore) { this.confidenceScore = confidenceScore; }
        
        public Double getContentAccuracy() { return contentAccuracy; }
        public void setContentAccuracy(Double contentAccuracy) { this.contentAccuracy = contentAccuracy; }
        
        public Double getLogicClarity() { return logicClarity; }
        public void setLogicClarity(Double logicClarity) { this.logicClarity = logicClarity; }
        
        public Double getCompleteness() { return completeness; }
        public void setCompleteness(Double completeness) { this.completeness = completeness; }
        
        public Double getExpressionQuality() { return expressionQuality; }
        public void setExpressionQuality(Double expressionQuality) { this.expressionQuality = expressionQuality; }
    }
} 