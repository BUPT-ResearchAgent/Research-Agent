package com.example.smartedu.service;

import com.example.smartedu.entity.*;
import com.example.smartedu.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class StudentAnalysisService {

    @Autowired
    private StudentRepository studentRepository;
    
    @Autowired
    private ExamResultRepository examResultRepository;
    
    @Autowired
    private StudentAnswerRepository studentAnswerRepository;
    
    @Autowired
    private ExamRepository examRepository;
    
    @Autowired
    private QuestionRepository questionRepository;
    
    @Autowired
    private StudentCourseRepository studentCourseRepository;

    /**
     * 分析班级学生对指定课程的熟悉程度
     * @param courseId 课程ID
     * @param className 班级名称（可选，如果为空则分析所有学生）
     * @return 学生分类结果
     */
    public StudentClassificationResult analyzeStudentsForCourse(Long courseId, String className) {
        System.out.println("开始分析课程 " + courseId + " 的学生熟悉程度...");
        
        // 获取参与该课程的学生
        List<Student> students = getStudentsForCourse(courseId, className);
        
        if (students.isEmpty()) {
            System.out.println("未找到参与该课程的学生");
            return new StudentClassificationResult();
        }
        
        System.out.println("找到 " + students.size() + " 名学生参与该课程");
        
        // 分析每个学生的学习情况
        Map<Long, StudentAnalysisData> studentAnalysisMap = new HashMap<>();
        
        for (Student student : students) {
            StudentAnalysisData analysisData = analyzeIndividualStudent(student, courseId);
            studentAnalysisMap.put(student.getId(), analysisData);
        }
        
        // 进行学生分类
        return classifyStudents(studentAnalysisMap, students);
    }
    
    /**
     * 获取参与指定课程的学生列表
     */
    private List<Student> getStudentsForCourse(Long courseId, String className) {
        if (className != null && !className.trim().isEmpty()) {
            // 按班级筛选
            return studentRepository.findByClassName(className.trim());
        } else {
            // 查找所有选修该课程的学生
            List<StudentCourse> studentCourses = studentCourseRepository.findByCourseId(courseId);
            return studentCourses.stream()
                    .map(StudentCourse::getStudent)
                    .collect(Collectors.toList());
        }
    }
    
    /**
     * 分析单个学生在指定课程中的学习情况
     */
    private StudentAnalysisData analyzeIndividualStudent(Student student, Long courseId) {
        StudentAnalysisData data = new StudentAnalysisData();
        data.setStudentId(student.getId());
        data.setStudentName(student.getRealName());
        data.setClassName(student.getClassName());
        data.setMajor(student.getMajor());
        
        // 获取该学生在该课程的所有考试结果
        List<ExamResult> examResults = examResultRepository.findByStudentIdAndCourseId(student.getId(), courseId);
        
        if (examResults.isEmpty()) {
            // 没有考试记录，标记为新手
            data.setFamiliarityLevel("新手");
            data.setAverageScore(0.0);
            data.setExamCount(0);
            data.setCorrectRate(0.0);
            return data;
        }
        
        // 计算平均成绩
        double totalScore = 0;
        int validExamCount = 0;
        
        for (ExamResult result : examResults) {
            if (result.getSubmitTime() != null) { // 只统计已提交的考试
                double score = result.getFinalScore() != null ? result.getFinalScore() : 
                              (result.getAiScore() != null ? result.getAiScore() : 0);
                totalScore += score;
                validExamCount++;
            }
        }
        
        data.setExamCount(validExamCount);
        data.setAverageScore(validExamCount > 0 ? totalScore / validExamCount : 0);
        
        // 分析答题正确率
        double correctRate = calculateCorrectRate(student.getId(), courseId);
        data.setCorrectRate(correctRate);
        
        // 分析学习模式
        String learningPattern = analyzeLearningPattern(examResults);
        data.setLearningPattern(learningPattern);
        
        // 确定熟悉程度等级
        String familiarityLevel = determineFamiliarityLevel(data.getAverageScore(), correctRate, validExamCount);
        data.setFamiliarityLevel(familiarityLevel);
        
        return data;
    }
    
    /**
     * 计算学生在指定课程中的答题正确率
     */
    private double calculateCorrectRate(Long studentId, Long courseId) {
        // 获取该课程的所有考试
        List<Exam> courseExams = examRepository.findByCourseId(courseId);
        
        int totalQuestions = 0;
        int correctAnswers = 0;
        
        for (Exam exam : courseExams) {
            List<StudentAnswer> studentAnswers = studentAnswerRepository.findByStudentIdAndExamId(studentId, exam.getId());
            
            for (StudentAnswer answer : studentAnswers) {
                totalQuestions++;
                
                // 基于得分判断是否正确
                Question question = questionRepository.findById(answer.getQuestionId()).orElse(null);
                if (question != null && answer.getScore() != null) {
                    if (answer.getScore().equals(question.getScore())) {
                        correctAnswers++;
                    }
                }
            }
        }
        
        return totalQuestions > 0 ? (double) correctAnswers / totalQuestions * 100 : 0;
    }
    
    /**
     * 分析学生的学习模式
     */
    private String analyzeLearningPattern(List<ExamResult> examResults) {
        if (examResults.size() < 2) {
            return "数据不足";
        }
        
        // 按时间排序
        examResults.sort(Comparator.comparing(ExamResult::getSubmitTime));
        
        List<Double> scores = examResults.stream()
                .filter(r -> r.getSubmitTime() != null)
                .map(r -> r.getFinalScore() != null ? r.getFinalScore() : 
                         (r.getAiScore() != null ? r.getAiScore() : 0))
                .collect(Collectors.toList());
        
        if (scores.size() < 2) {
            return "数据不足";
        }
        
        // 分析成绩趋势
        double firstHalfAvg = scores.subList(0, scores.size() / 2).stream()
                .mapToDouble(Double::doubleValue).average().orElse(0);
        double secondHalfAvg = scores.subList(scores.size() / 2, scores.size()).stream()
                .mapToDouble(Double::doubleValue).average().orElse(0);
        
        if (secondHalfAvg - firstHalfAvg > 10) {
            return "进步型";
        } else if (firstHalfAvg - secondHalfAvg > 10) {
            return "退步型";
        } else {
            return "稳定型";
        }
    }
    
    /**
     * 根据成绩和正确率确定熟悉程度等级
     */
    private String determineFamiliarityLevel(double averageScore, double correctRate, int examCount) {
        if (examCount == 0) {
            return "新手";
        }
        
        // 综合考虑平均分和正确率
        double overallScore = (averageScore + correctRate) / 2;
        
        if (overallScore >= 85) {
            return "熟练";
        } else if (overallScore >= 70) {
            return "中等";
        } else if (overallScore >= 60) {
            return "基础";
        } else {
            return "薄弱";
        }
    }
    
    /**
     * 对学生进行分类
     */
    private StudentClassificationResult classifyStudents(Map<Long, StudentAnalysisData> studentAnalysisMap, List<Student> students) {
        StudentClassificationResult result = new StudentClassificationResult();
        
        // 按熟悉程度分类
        Map<String, List<StudentAnalysisData>> familiarityGroups = studentAnalysisMap.values().stream()
                .collect(Collectors.groupingBy(StudentAnalysisData::getFamiliarityLevel));
        
        // 按学习模式分类
        Map<String, List<StudentAnalysisData>> patternGroups = studentAnalysisMap.values().stream()
                .collect(Collectors.groupingBy(StudentAnalysisData::getLearningPattern));
        
        result.setFamiliarityGroups(familiarityGroups);
        result.setLearningPatternGroups(patternGroups);
        result.setTotalStudentCount(students.size());
        
        // 生成统计信息
        Map<String, Object> statistics = generateStatistics(studentAnalysisMap.values());
        result.setStatistics(statistics);
        
        // 生成教学建议
        String teachingRecommendation = generateTeachingRecommendation(familiarityGroups, patternGroups);
        result.setTeachingRecommendation(teachingRecommendation);
        
        System.out.println("学生分类完成:");
        familiarityGroups.forEach((level, group) -> 
            System.out.println("  " + level + ": " + group.size() + "人"));
        
        return result;
    }
    
    /**
     * 生成统计信息
     */
    private Map<String, Object> generateStatistics(Collection<StudentAnalysisData> analysisData) {
        Map<String, Object> stats = new HashMap<>();
        
        // 平均分统计
        double avgScore = analysisData.stream()
                .mapToDouble(StudentAnalysisData::getAverageScore)
                .average().orElse(0);
        stats.put("classAverageScore", Math.round(avgScore * 10) / 10.0);
        
        // 正确率统计
        double avgCorrectRate = analysisData.stream()
                .mapToDouble(StudentAnalysisData::getCorrectRate)
                .average().orElse(0);
        stats.put("classCorrectRate", Math.round(avgCorrectRate * 10) / 10.0);
        
        // 考试参与度
        double avgExamCount = analysisData.stream()
                .mapToDouble(StudentAnalysisData::getExamCount)
                .average().orElse(0);
        stats.put("averageExamParticipation", Math.round(avgExamCount * 10) / 10.0);
        
        return stats;
    }
    
    /**
     * 基于学生分类生成教学建议
     */
    private String generateTeachingRecommendation(Map<String, List<StudentAnalysisData>> familiarityGroups,
                                                 Map<String, List<StudentAnalysisData>> patternGroups) {
        StringBuilder recommendation = new StringBuilder();
        
        recommendation.append("## 个性化教学建议\n\n");
        
        // 基于熟悉程度的建议
        recommendation.append("### 基于基础水平的分层教学:\n");
        
        if (familiarityGroups.containsKey("熟练")) {
            int count = familiarityGroups.get("熟练").size();
            recommendation.append(String.format("- **熟练学生(%d人)**: 可安排进阶内容和挑战性任务，担任小组学习的带头人\n", count));
        }
        
        if (familiarityGroups.containsKey("中等")) {
            int count = familiarityGroups.get("中等").size();
            recommendation.append(String.format("- **中等学生(%d人)**: 重点加强理解和应用，提供适量练习和指导\n", count));
        }
        
        if (familiarityGroups.containsKey("基础")) {
            int count = familiarityGroups.get("基础").size();
            recommendation.append(String.format("- **基础学生(%d人)**: 需要更多基础知识巩固和个别辅导\n", count));
        }
        
        if (familiarityGroups.containsKey("薄弱")) {
            int count = familiarityGroups.get("薄弱").size();
            recommendation.append(String.format("- **薄弱学生(%d人)**: 需要重点关注，提供基础补习和额外支持\n", count));
        }
        
        if (familiarityGroups.containsKey("新手")) {
            int count = familiarityGroups.get("新手").size();
            recommendation.append(String.format("- **新手学生(%d人)**: 从基础概念开始，循序渐进地引导学习\n", count));
        }
        
        recommendation.append("\n### 基于学习模式的个性化策略:\n");
        
        if (patternGroups.containsKey("进步型")) {
            int count = patternGroups.get("进步型").size();
            recommendation.append(String.format("- **进步型学生(%d人)**: 保持当前教学节奏，继续激励和鼓励\n", count));
        }
        
        if (patternGroups.containsKey("稳定型")) {
            int count = patternGroups.get("稳定型").size();
            recommendation.append(String.format("- **稳定型学生(%d人)**: 可以尝试新的教学方法来激发学习兴趣\n", count));
        }
        
        if (patternGroups.containsKey("退步型")) {
            int count = patternGroups.get("退步型").size();
            recommendation.append(String.format("- **退步型学生(%d人)**: 需要分析原因，提供针对性帮助和心理支持\n", count));
        }
        
        return recommendation.toString();
    }
    
    /**
     * 学生分析数据类
     */
    public static class StudentAnalysisData {
        private Long studentId;
        private String studentName;
        private String className;
        private String major;
        private String familiarityLevel; // 熟悉程度: 新手/基础/中等/熟练/薄弱
        private double averageScore;     // 平均分
        private double correctRate;      // 正确率
        private int examCount;           // 考试次数
        private String learningPattern;  // 学习模式: 进步型/稳定型/退步型/数据不足
        
        // Getters and Setters
        public Long getStudentId() { return studentId; }
        public void setStudentId(Long studentId) { this.studentId = studentId; }
        
        public String getStudentName() { return studentName; }
        public void setStudentName(String studentName) { this.studentName = studentName; }
        
        public String getClassName() { return className; }
        public void setClassName(String className) { this.className = className; }
        
        public String getMajor() { return major; }
        public void setMajor(String major) { this.major = major; }
        
        public String getFamiliarityLevel() { return familiarityLevel; }
        public void setFamiliarityLevel(String familiarityLevel) { this.familiarityLevel = familiarityLevel; }
        
        public double getAverageScore() { return averageScore; }
        public void setAverageScore(double averageScore) { this.averageScore = averageScore; }
        
        public double getCorrectRate() { return correctRate; }
        public void setCorrectRate(double correctRate) { this.correctRate = correctRate; }
        
        public int getExamCount() { return examCount; }
        public void setExamCount(int examCount) { this.examCount = examCount; }
        
        public String getLearningPattern() { return learningPattern; }
        public void setLearningPattern(String learningPattern) { this.learningPattern = learningPattern; }
    }
    
    /**
     * 学生分类结果类
     */
    public static class StudentClassificationResult {
        private Map<String, List<StudentAnalysisData>> familiarityGroups;
        private Map<String, List<StudentAnalysisData>> learningPatternGroups;
        private int totalStudentCount;
        private Map<String, Object> statistics;
        private String teachingRecommendation;
        
        public StudentClassificationResult() {
            this.familiarityGroups = new HashMap<>();
            this.learningPatternGroups = new HashMap<>();
            this.totalStudentCount = 0;
            this.statistics = new HashMap<>();
            this.teachingRecommendation = "";
        }
        
        // Getters and Setters
        public Map<String, List<StudentAnalysisData>> getFamiliarityGroups() { return familiarityGroups; }
        public void setFamiliarityGroups(Map<String, List<StudentAnalysisData>> familiarityGroups) { this.familiarityGroups = familiarityGroups; }
        
        public Map<String, List<StudentAnalysisData>> getLearningPatternGroups() { return learningPatternGroups; }
        public void setLearningPatternGroups(Map<String, List<StudentAnalysisData>> learningPatternGroups) { this.learningPatternGroups = learningPatternGroups; }
        
        public int getTotalStudentCount() { return totalStudentCount; }
        public void setTotalStudentCount(int totalStudentCount) { this.totalStudentCount = totalStudentCount; }
        
        public Map<String, Object> getStatistics() { return statistics; }
        public void setStatistics(Map<String, Object> statistics) { this.statistics = statistics; }
        
        public String getTeachingRecommendation() { return teachingRecommendation; }
        public void setTeachingRecommendation(String teachingRecommendation) { this.teachingRecommendation = teachingRecommendation; }
    }
} 