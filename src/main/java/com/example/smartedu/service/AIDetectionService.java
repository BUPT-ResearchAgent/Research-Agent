package com.example.smartedu.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Pattern;

@Service
public class AIDetectionService {

    @Autowired
    private DeepSeekService deepSeekService;

    /**
     * 检测文本是否使用AI生成
     * @param content 待检测的文本内容
     * @param context 作业上下文信息
     * @return AI检测结果
     */
    public AIDetectionResult detectAIUsage(String content, String context) {
        System.out.println("开始AI检测分析，文本长度: " + content.length() + " 字符");
        
        AIDetectionResult result = new AIDetectionResult();
        result.setOriginalContent(content);
        result.setContext(context);
        
        // 1. 基础特征检测
        BasicFeatureAnalysis basicAnalysis = analyzeBasicFeatures(content);
        result.setBasicAnalysis(basicAnalysis);
        
        // 2. 文本分段处理
        List<TextSegment> segments = segmentText(content);
        result.setSegments(segments);
        
        // 3. AI特征检测
        List<AIDetectionIssue> issues = detectAIFeatures(segments);
        result.setDetectedIssues(issues);
        
        // 4. 调用深度AI检测
        DeepAIAnalysis deepAnalysis = performDeepAIAnalysis(content, context);
        result.setDeepAnalysis(deepAnalysis);
        
        // 5. 综合评估
        OverallAssessment assessment = generateOverallAssessment(basicAnalysis, issues, deepAnalysis);
        result.setOverallAssessment(assessment);
        
        // 6. 生成详细报告
        String detailedReport = generateDetailedReport(result);
        result.setDetailedReport(detailedReport);
        
        System.out.println("AI检测完成，综合评分: " + assessment.getAiProbabilityScore());
        return result;
    }
    
    /**
     * 基础特征分析
     */
    private BasicFeatureAnalysis analyzeBasicFeatures(String content) {
        BasicFeatureAnalysis analysis = new BasicFeatureAnalysis();
        
        // 统计基本信息
        analysis.setTotalCharacters(content.length());
        analysis.setTotalWords(content.split("\\s+").length);
        analysis.setParagraphCount(content.split("\n\n").length);
        analysis.setSentenceCount(content.split("[。！？]").length);
        
        // 计算平均句子长度
        String[] sentences = content.split("[。！？]");
        int totalSentenceLength = Arrays.stream(sentences)
                .mapToInt(s -> s.trim().length())
                .sum();
        analysis.setAverageSentenceLength(sentences.length > 0 ? totalSentenceLength / sentences.length : 0);
        
        // 检测重复模式
        analysis.setRepetitionRate(calculateRepetitionRate(content));
        
        // 检测词汇复杂度
        analysis.setVocabularyComplexity(calculateVocabularyComplexity(content));
        
        // 检测语言风格一致性
        analysis.setStyleConsistency(calculateStyleConsistency(content));
        
        return analysis;
    }
    
    /**
     * 文本分段
     */
    private List<TextSegment> segmentText(String content) {
        List<TextSegment> segments = new ArrayList<>();
        
        // 按段落分割
        String[] paragraphs = content.split("\n\n");
        
        for (int i = 0; i < paragraphs.length; i++) {
            String paragraph = paragraphs[i].trim();
            if (!paragraph.isEmpty()) {
                TextSegment segment = new TextSegment();
                segment.setSegmentId("paragraph_" + (i + 1));
                segment.setContent(paragraph);
                segment.setStartPosition(content.indexOf(paragraph));
                segment.setEndPosition(segment.getStartPosition() + paragraph.length());
                segment.setType("paragraph");
                segments.add(segment);
            }
        }
        
        // 如果段落太少，按句子分割
        if (segments.size() < 3) {
            segments.clear();
            String[] sentences = content.split("[。！？]");
            for (int i = 0; i < sentences.length; i++) {
                String sentence = sentences[i].trim();
                if (!sentence.isEmpty() && sentence.length() > 10) {
                    TextSegment segment = new TextSegment();
                    segment.setSegmentId("sentence_" + (i + 1));
                    segment.setContent(sentence);
                    segment.setStartPosition(content.indexOf(sentence));
                    segment.setEndPosition(segment.getStartPosition() + sentence.length());
                    segment.setType("sentence");
                    segments.add(segment);
                }
            }
        }
        
        return segments;
    }
    
    /**
     * AI特征检测
     */
    private List<AIDetectionIssue> detectAIFeatures(List<TextSegment> segments) {
        List<AIDetectionIssue> issues = new ArrayList<>();
        
        for (TextSegment segment : segments) {
            List<AIDetectionIssue> segmentIssues = analyzeSegmentForAI(segment);
            issues.addAll(segmentIssues);
        }
        
        return issues;
    }
    
    /**
     * 分析单个文本段落的AI特征
     */
    private List<AIDetectionIssue> analyzeSegmentForAI(TextSegment segment) {
        List<AIDetectionIssue> issues = new ArrayList<>();
        String content = segment.getContent();
        
        // 1. 检测AI常用表达模式
        List<String> aiPhrases = detectAIPhrases(content);
        if (!aiPhrases.isEmpty()) {
            AIDetectionIssue issue = new AIDetectionIssue();
            issue.setIssueType("AI_PHRASES");
            issue.setDescription("检测到疑似AI生成的表达方式");
            issue.setSegmentId(segment.getSegmentId());
            issue.setConfidenceLevel(0.7);
            issue.setDetails("发现的AI表达: " + String.join(", ", aiPhrases));
            issues.add(issue);
        }
        
        // 2. 检测语言风格突变
        if (detectStyleShift(content)) {
            AIDetectionIssue issue = new AIDetectionIssue();
            issue.setIssueType("STYLE_SHIFT");
            issue.setDescription("语言风格存在明显变化");
            issue.setSegmentId(segment.getSegmentId());
            issue.setConfidenceLevel(0.6);
            issue.setDetails("该段落的语言风格与其他部分存在差异");
            issues.add(issue);
        }
        
        // 3. 检测过度完美的语法
        if (detectPerfectGrammar(content)) {
            AIDetectionIssue issue = new AIDetectionIssue();
            issue.setIssueType("PERFECT_GRAMMAR");
            issue.setDescription("语法过于完美，缺乏人类写作的自然性");
            issue.setSegmentId(segment.getSegmentId());
            issue.setConfidenceLevel(0.5);
            issue.setDetails("该段落语法完美度异常高");
            issues.add(issue);
        }
        
        // 4. 检测机械化表达
        if (detectMechanicalExpression(content)) {
            AIDetectionIssue issue = new AIDetectionIssue();
            issue.setIssueType("MECHANICAL_EXPRESSION");
            issue.setDescription("表达方式过于机械化，缺乏个性");
            issue.setSegmentId(segment.getSegmentId());
            issue.setConfidenceLevel(0.6);
            issue.setDetails("发现机械化或模板化的表达方式");
            issues.add(issue);
        }
        
        // 5. 检测内容连贯性问题
        if (detectCoherenceIssues(content)) {
            AIDetectionIssue issue = new AIDetectionIssue();
            issue.setIssueType("COHERENCE_ISSUES");
            issue.setDescription("内容连贯性存在问题");
            issue.setSegmentId(segment.getSegmentId());
            issue.setConfidenceLevel(0.4);
            issue.setDetails("该段落与前后文连贯性较差");
            issues.add(issue);
        }
        
        return issues;
    }
    
    /**
     * 深度AI分析
     */
    private DeepAIAnalysis performDeepAIAnalysis(String content, String context) {
        try {
            // 调用DeepSeek进行深度分析
            String analysisResult = deepSeekService.performAIDetectionAnalysis(content, context);
            
            DeepAIAnalysis deepAnalysis = new DeepAIAnalysis();
            deepAnalysis.setAnalysisResult(analysisResult);
            
            // 从AI分析结果中提取关键信息
            extractAnalysisInsights(deepAnalysis, analysisResult);
            
            return deepAnalysis;
        } catch (Exception e) {
            System.err.println("深度AI分析失败: " + e.getMessage());
            
            DeepAIAnalysis fallbackAnalysis = new DeepAIAnalysis();
            fallbackAnalysis.setAnalysisResult("深度分析暂时不可用");
            fallbackAnalysis.setAiLikelihood(0.5);
            fallbackAnalysis.setMainConcerns(List.of("无法进行深度分析"));
            return fallbackAnalysis;
        }
    }
    
    /**
     * 综合评估
     */
    private OverallAssessment generateOverallAssessment(BasicFeatureAnalysis basicAnalysis, 
                                                       List<AIDetectionIssue> issues, 
                                                       DeepAIAnalysis deepAnalysis) {
        OverallAssessment assessment = new OverallAssessment();
        
        // 计算AI概率分数
        double probabilityScore = calculateAIProbabilityScore(basicAnalysis, issues, deepAnalysis);
        assessment.setAiProbabilityScore(probabilityScore);
        
        // 确定风险等级
        String riskLevel = determineRiskLevel(probabilityScore);
        assessment.setRiskLevel(riskLevel);
        
        // 生成主要发现
        List<String> mainFindings = generateMainFindings(issues, deepAnalysis);
        assessment.setMainFindings(mainFindings);
        
        // 生成建议
        List<String> recommendations = generateRecommendations(riskLevel, issues);
        assessment.setRecommendations(recommendations);
        
        // 生成总结
        String summary = generateSummary(probabilityScore, riskLevel, mainFindings.size());
        assessment.setSummary(summary);
        
        return assessment;
    }
    
    /**
     * 计算重复率
     */
    private double calculateRepetitionRate(String content) {
        String[] words = content.split("\\s+");
        Set<String> uniqueWords = new HashSet<>(Arrays.asList(words));
        return 1.0 - (double) uniqueWords.size() / words.length;
    }
    
    /**
     * 计算词汇复杂度
     */
    private double calculateVocabularyComplexity(String content) {
        String[] words = content.split("\\s+");
        int complexWords = 0;
        
        for (String word : words) {
            if (word.length() > 6) { // 简单的复杂词判断
                complexWords++;
            }
        }
        
        return (double) complexWords / words.length;
    }
    
    /**
     * 计算语言风格一致性
     */
    private double calculateStyleConsistency(String content) {
        // 简化的风格一致性计算
        String[] sentences = content.split("[。！？]");
        if (sentences.length < 2) return 1.0;
        
        double[] sentenceLengths = new double[sentences.length];
        for (int i = 0; i < sentences.length; i++) {
            sentenceLengths[i] = sentences[i].trim().length();
        }
        
        // 计算标准差
        double mean = Arrays.stream(sentenceLengths).average().orElse(0);
        double variance = Arrays.stream(sentenceLengths)
                .map(len -> Math.pow(len - mean, 2))
                .average().orElse(0);
        double stdDev = Math.sqrt(variance);
        
        // 标准差越小，一致性越高
        return Math.max(0, 1.0 - stdDev / mean);
    }
    
    /**
     * 检测AI常用短语
     */
    private List<String> detectAIPhrases(String content) {
        List<String> detectedPhrases = new ArrayList<>();
        
        String[] aiPhrases = {
            "综上所述", "总而言之", "需要注意的是", "值得一提的是",
            "首先.*其次.*最后", "一方面.*另一方面", "不仅.*而且",
            "通过以上分析", "基于以上讨论", "综合考虑各种因素",
            "在这种情况下", "基于这种理解", "从多个角度来看",
            "这是一个复杂的问题", "这个问题需要从多个维度考虑"
        };
        
        for (String phrase : aiPhrases) {
            if (Pattern.compile(phrase).matcher(content).find()) {
                detectedPhrases.add(phrase);
            }
        }
        
        return detectedPhrases;
    }
    
    /**
     * 检测语言风格突变
     */
    private boolean detectStyleShift(String content) {
        // 简化的风格检测
        return content.contains("然而") && content.contains("因此") && content.length() > 200;
    }
    
    /**
     * 检测过度完美的语法
     */
    private boolean detectPerfectGrammar(String content) {
        // 检测是否句子结构过于完美
        String[] sentences = content.split("[。！？]");
        int perfectSentences = 0;
        
        for (String sentence : sentences) {
            if (sentence.trim().length() > 20 && 
                !sentence.contains("呃") && 
                !sentence.contains("嗯") && 
                !sentence.contains("...")) {
                perfectSentences++;
            }
        }
        
        return sentences.length > 0 && (double) perfectSentences / sentences.length > 0.9;
    }
    
    /**
     * 检测机械化表达
     */
    private boolean detectMechanicalExpression(String content) {
        String[] mechanicalPatterns = {
            "第一.*第二.*第三", "首先.*然后.*最后",
            "优点如下.*缺点如下", "原因主要有以下几点"
        };
        
        for (String pattern : mechanicalPatterns) {
            if (Pattern.compile(pattern).matcher(content).find()) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 检测连贯性问题
     */
    private boolean detectCoherenceIssues(String content) {
        // 简化的连贯性检测
        return content.contains("总之") && content.length() < 100;
    }
    
    /**
     * 从AI分析结果中提取见解
     */
    private void extractAnalysisInsights(DeepAIAnalysis deepAnalysis, String analysisResult) {
        // 简化的信息提取
        if (analysisResult.toLowerCase().contains("高概率")) {
            deepAnalysis.setAiLikelihood(0.8);
        } else if (analysisResult.toLowerCase().contains("中等概率")) {
            deepAnalysis.setAiLikelihood(0.5);
        } else {
            deepAnalysis.setAiLikelihood(0.2);
        }
        
        List<String> concerns = new ArrayList<>();
        if (analysisResult.contains("语言风格")) {
            concerns.add("语言风格异常");
        }
        if (analysisResult.contains("结构化")) {
            concerns.add("结构过于规整");
        }
        if (analysisResult.contains("表达方式")) {
            concerns.add("表达方式机械化");
        }
        
        deepAnalysis.setMainConcerns(concerns);
    }
    
    /**
     * 计算AI概率分数
     */
    private double calculateAIProbabilityScore(BasicFeatureAnalysis basicAnalysis, 
                                             List<AIDetectionIssue> issues, 
                                             DeepAIAnalysis deepAnalysis) {
        double score = 0.0;
        
        // 基础特征权重 (30%)
        if (basicAnalysis.getStyleConsistency() > 0.95) score += 0.1;
        if (basicAnalysis.getVocabularyComplexity() > 0.3) score += 0.1;
        if (basicAnalysis.getRepetitionRate() < 0.1) score += 0.1;
        
        // 检测问题权重 (40%)
        double issueWeight = Math.min(0.4, issues.size() * 0.1);
        score += issueWeight;
        
        // 深度分析权重 (30%)
        score += deepAnalysis.getAiLikelihood() * 0.3;
        
        return Math.min(1.0, score);
    }
    
    /**
     * 确定风险等级
     */
    private String determineRiskLevel(double probabilityScore) {
        if (probabilityScore >= 0.8) return "高风险";
        if (probabilityScore >= 0.6) return "中等风险";
        if (probabilityScore >= 0.4) return "低风险";
        return "正常";
    }
    
    /**
     * 生成主要发现
     */
    private List<String> generateMainFindings(List<AIDetectionIssue> issues, DeepAIAnalysis deepAnalysis) {
        List<String> findings = new ArrayList<>();
        
        Map<String, Long> issueTypeCount = issues.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                    AIDetectionIssue::getIssueType, 
                    java.util.stream.Collectors.counting()));
        
        for (Map.Entry<String, Long> entry : issueTypeCount.entrySet()) {
            String issueType = entry.getKey();
            Long count = entry.getValue();
            
            String finding = String.format("发现 %d 处 %s 问题", count, getIssueTypeDisplayName(issueType));
            findings.add(finding);
        }
        
        if (deepAnalysis.getMainConcerns() != null) {
            findings.addAll(deepAnalysis.getMainConcerns());
        }
        
        return findings;
    }
    
    /**
     * 生成建议
     */
    private List<String> generateRecommendations(String riskLevel, List<AIDetectionIssue> issues) {
        List<String> recommendations = new ArrayList<>();
        
        switch (riskLevel) {
            case "高风险":
                recommendations.add("建议进行人工复审，该作业存在较高的AI生成可能性");
                recommendations.add("需要与学生进行面谈，了解写作过程");
                recommendations.add("考虑要求学生重新提交或提供写作过程说明");
                break;
                
            case "中等风险":
                recommendations.add("建议关注标注的问题段落");
                recommendations.add("可以询问学生关于特定段落的写作思路");
                recommendations.add("注意观察学生其他作业的写作风格是否一致");
                break;
                
            case "低风险":
                recommendations.add("整体较为正常，但仍需关注个别可疑段落");
                recommendations.add("可以作为参考，结合其他证据进行判断");
                break;
                
            default:
                recommendations.add("作业表现正常，无明显AI生成迹象");
        }
        
        return recommendations;
    }
    
    /**
     * 生成总结
     */
    private String generateSummary(double probabilityScore, String riskLevel, int issueCount) {
        return String.format(
            "AI检测完成。概率评分: %.2f，风险等级: %s，发现 %d 个潜在问题。%s",
            probabilityScore, riskLevel, issueCount,
            probabilityScore > 0.6 ? "建议进一步审查。" : "整体表现正常。"
        );
    }
    
    /**
     * 获取问题类型显示名称
     */
    private String getIssueTypeDisplayName(String issueType) {
        switch (issueType) {
            case "AI_PHRASES": return "AI表达方式";
            case "STYLE_SHIFT": return "语言风格突变";
            case "PERFECT_GRAMMAR": return "语法过度完美";
            case "MECHANICAL_EXPRESSION": return "机械化表达";
            case "COHERENCE_ISSUES": return "连贯性问题";
            default: return issueType;
        }
    }
    
    /**
     * 生成详细报告
     */
    private String generateDetailedReport(AIDetectionResult result) {
        StringBuilder report = new StringBuilder();
        
        report.append("# AI检测详细报告\n\n");
        
        // 基本信息
        report.append("## 基本信息\n");
        report.append("- 文本长度: ").append(result.getBasicAnalysis().getTotalCharacters()).append(" 字符\n");
        report.append("- 词汇数量: ").append(result.getBasicAnalysis().getTotalWords()).append(" 词\n");
        report.append("- 段落数量: ").append(result.getBasicAnalysis().getParagraphCount()).append(" 段\n");
        report.append("- 风险等级: ").append(result.getOverallAssessment().getRiskLevel()).append("\n");
        report.append("- AI概率: ").append(String.format("%.2f", result.getOverallAssessment().getAiProbabilityScore())).append("\n\n");
        
        // 主要发现
        if (!result.getOverallAssessment().getMainFindings().isEmpty()) {
            report.append("## 主要发现\n");
            for (String finding : result.getOverallAssessment().getMainFindings()) {
                report.append("- ").append(finding).append("\n");
            }
            report.append("\n");
        }
        
        // 详细问题列表
        if (!result.getDetectedIssues().isEmpty()) {
            report.append("## 检测到的问题\n");
            for (AIDetectionIssue issue : result.getDetectedIssues()) {
                report.append("### ").append(issue.getDescription()).append("\n");
                report.append("- 位置: ").append(issue.getSegmentId()).append("\n");
                report.append("- 置信度: ").append(String.format("%.2f", issue.getConfidenceLevel())).append("\n");
                report.append("- 详情: ").append(issue.getDetails()).append("\n\n");
            }
        }
        
        // 建议
        report.append("## 建议\n");
        for (String recommendation : result.getOverallAssessment().getRecommendations()) {
            report.append("- ").append(recommendation).append("\n");
        }
        
        return report.toString();
    }
    
    // 内部数据类定义
    
    /**
     * AI检测结果
     */
    public static class AIDetectionResult {
        private String originalContent;
        private String context;
        private BasicFeatureAnalysis basicAnalysis;
        private List<TextSegment> segments;
        private List<AIDetectionIssue> detectedIssues;
        private DeepAIAnalysis deepAnalysis;
        private OverallAssessment overallAssessment;
        private String detailedReport;
        
        // Getters and Setters
        public String getOriginalContent() { return originalContent; }
        public void setOriginalContent(String originalContent) { this.originalContent = originalContent; }
        
        public String getContext() { return context; }
        public void setContext(String context) { this.context = context; }
        
        public BasicFeatureAnalysis getBasicAnalysis() { return basicAnalysis; }
        public void setBasicAnalysis(BasicFeatureAnalysis basicAnalysis) { this.basicAnalysis = basicAnalysis; }
        
        public List<TextSegment> getSegments() { return segments; }
        public void setSegments(List<TextSegment> segments) { this.segments = segments; }
        
        public List<AIDetectionIssue> getDetectedIssues() { return detectedIssues; }
        public void setDetectedIssues(List<AIDetectionIssue> detectedIssues) { this.detectedIssues = detectedIssues; }
        
        public DeepAIAnalysis getDeepAnalysis() { return deepAnalysis; }
        public void setDeepAnalysis(DeepAIAnalysis deepAnalysis) { this.deepAnalysis = deepAnalysis; }
        
        public OverallAssessment getOverallAssessment() { return overallAssessment; }
        public void setOverallAssessment(OverallAssessment overallAssessment) { this.overallAssessment = overallAssessment; }
        
        public String getDetailedReport() { return detailedReport; }
        public void setDetailedReport(String detailedReport) { this.detailedReport = detailedReport; }
    }
    
    /**
     * 基础特征分析
     */
    public static class BasicFeatureAnalysis {
        private int totalCharacters;
        private int totalWords;
        private int paragraphCount;
        private int sentenceCount;
        private double averageSentenceLength;
        private double repetitionRate;
        private double vocabularyComplexity;
        private double styleConsistency;
        
        // Getters and Setters
        public int getTotalCharacters() { return totalCharacters; }
        public void setTotalCharacters(int totalCharacters) { this.totalCharacters = totalCharacters; }
        
        public int getTotalWords() { return totalWords; }
        public void setTotalWords(int totalWords) { this.totalWords = totalWords; }
        
        public int getParagraphCount() { return paragraphCount; }
        public void setParagraphCount(int paragraphCount) { this.paragraphCount = paragraphCount; }
        
        public int getSentenceCount() { return sentenceCount; }
        public void setSentenceCount(int sentenceCount) { this.sentenceCount = sentenceCount; }
        
        public double getAverageSentenceLength() { return averageSentenceLength; }
        public void setAverageSentenceLength(double averageSentenceLength) { this.averageSentenceLength = averageSentenceLength; }
        
        public double getRepetitionRate() { return repetitionRate; }
        public void setRepetitionRate(double repetitionRate) { this.repetitionRate = repetitionRate; }
        
        public double getVocabularyComplexity() { return vocabularyComplexity; }
        public void setVocabularyComplexity(double vocabularyComplexity) { this.vocabularyComplexity = vocabularyComplexity; }
        
        public double getStyleConsistency() { return styleConsistency; }
        public void setStyleConsistency(double styleConsistency) { this.styleConsistency = styleConsistency; }
    }
    
    /**
     * 文本段落
     */
    public static class TextSegment {
        private String segmentId;
        private String content;
        private int startPosition;
        private int endPosition;
        private String type;
        
        // Getters and Setters
        public String getSegmentId() { return segmentId; }
        public void setSegmentId(String segmentId) { this.segmentId = segmentId; }
        
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
        
        public int getStartPosition() { return startPosition; }
        public void setStartPosition(int startPosition) { this.startPosition = startPosition; }
        
        public int getEndPosition() { return endPosition; }
        public void setEndPosition(int endPosition) { this.endPosition = endPosition; }
        
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
    }
    
    /**
     * AI检测问题
     */
    public static class AIDetectionIssue {
        private String issueType;
        private String description;
        private String segmentId;
        private double confidenceLevel;
        private String details;
        
        // Getters and Setters
        public String getIssueType() { return issueType; }
        public void setIssueType(String issueType) { this.issueType = issueType; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        
        public String getSegmentId() { return segmentId; }
        public void setSegmentId(String segmentId) { this.segmentId = segmentId; }
        
        public double getConfidenceLevel() { return confidenceLevel; }
        public void setConfidenceLevel(double confidenceLevel) { this.confidenceLevel = confidenceLevel; }
        
        public String getDetails() { return details; }
        public void setDetails(String details) { this.details = details; }
    }
    
    /**
     * 深度AI分析
     */
    public static class DeepAIAnalysis {
        private String analysisResult;
        private double aiLikelihood;
        private List<String> mainConcerns;
        
        // Getters and Setters
        public String getAnalysisResult() { return analysisResult; }
        public void setAnalysisResult(String analysisResult) { this.analysisResult = analysisResult; }
        
        public double getAiLikelihood() { return aiLikelihood; }
        public void setAiLikelihood(double aiLikelihood) { this.aiLikelihood = aiLikelihood; }
        
        public List<String> getMainConcerns() { return mainConcerns; }
        public void setMainConcerns(List<String> mainConcerns) { this.mainConcerns = mainConcerns; }
    }
    
    /**
     * 综合评估
     */
    public static class OverallAssessment {
        private double aiProbabilityScore;
        private String riskLevel;
        private List<String> mainFindings;
        private List<String> recommendations;
        private String summary;
        
        // Getters and Setters
        public double getAiProbabilityScore() { return aiProbabilityScore; }
        public void setAiProbabilityScore(double aiProbabilityScore) { this.aiProbabilityScore = aiProbabilityScore; }
        
        public String getRiskLevel() { return riskLevel; }
        public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
        
        public List<String> getMainFindings() { return mainFindings; }
        public void setMainFindings(List<String> mainFindings) { this.mainFindings = mainFindings; }
        
        public List<String> getRecommendations() { return recommendations; }
        public void setRecommendations(List<String> recommendations) { this.recommendations = recommendations; }
        
        public String getSummary() { return summary; }
        public void setSummary(String summary) { this.summary = summary; }
    }
} 