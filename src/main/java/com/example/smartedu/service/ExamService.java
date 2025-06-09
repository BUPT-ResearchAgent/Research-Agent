package com.example.smartedu.service;

import com.example.smartedu.dto.ExamGenerationRequest;
import com.example.smartedu.entity.*;
import com.example.smartedu.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.ArrayList;

@Service
@Transactional
public class ExamService {
    
    @Autowired
    private ExamRepository examRepository;
    
    @Autowired
    private QuestionRepository questionRepository;
    
    @Autowired
    private CourseRepository courseRepository;
    
    @Autowired
    private CourseMaterialRepository courseMaterialRepository;
    
    @Autowired
    private DeepSeekService deepSeekService;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    /**
     * 生成考试
     */
    public Exam generateExam(ExamGenerationRequest request) {
        try {
            // 验证课程存在
            Course course = courseRepository.findById(request.getCourseId())
                    .orElseThrow(() -> new RuntimeException("课程不存在"));
            
            // 获取选中的资料内容
            List<CourseMaterial> materials = new ArrayList<>();
            if (request.getMaterialIds() != null && !request.getMaterialIds().isEmpty()) {
                materials = courseMaterialRepository.findAllById(request.getMaterialIds());
            }
            
            if (materials.isEmpty()) {
                throw new RuntimeException("请选择至少一个资料作为生成依据");
            }
            
            // 合并资料内容
            StringBuilder materialContent = new StringBuilder();
            for (CourseMaterial material : materials) {
                materialContent.append("文件：").append(material.getOriginalName()).append("\n");
                // 这里可以根据文件类型读取内容，暂时使用描述
                if (material.getDescription() != null) {
                    materialContent.append(material.getDescription()).append("\n\n");
                }
            }
            
            // 解析题型配置
            Map<String, Object> questionTypesMap = (Map<String, Object>) request.getQuestionTypes();
            List<String> questionTypes = new ArrayList<>();
            
            if (questionTypesMap != null) {
                for (Map.Entry<String, Object> entry : questionTypesMap.entrySet()) {
                    Object value = entry.getValue();
                    Integer count = null;
                    
                    // 安全处理不同类型的值
                    if (value instanceof Number) {
                        count = ((Number) value).intValue();
                    } else if (value instanceof Map) {
                        // 处理自定义题型的复杂对象结构 {count: xx, requirement: xx}
                        Map<String, Object> customType = (Map<String, Object>) value;
                        Object countValue = customType.get("count");
                        if (countValue instanceof Number) {
                            count = ((Number) countValue).intValue();
                        }
                    }
                    
                    if (count != null && count > 0) {
                        questionTypes.add(entry.getKey());
                    }
                }
            }
            
            if (questionTypes.isEmpty()) {
                throw new RuntimeException("请至少选择一种题型");
            }
            
            // 调用DeepSeek API生成试卷内容
            String examJson = deepSeekService.generateExamQuestionsWithSettings(
                course.getName(),
                "根据选中资料",
                questionTypesMap,
                (Map<String, Object>) request.getDifficulty(),
                request.getTotalScore(),
                request.getDuration(),
                materialContent.toString(),
                request.getSpecialRequirements()
            );
            
            // 创建考试记录
        Exam exam = new Exam();
            exam.setTitle("AI生成试卷 - " + course.getName());
            exam.setCourse(course);
            exam.setChapter("根据选中资料");
            exam.setExamType("AI生成");
        exam.setDuration(request.getDuration());
            exam.setTotalScore(request.getTotalScore());
            exam.setIsPublished(false);
            exam.setIsAnswerPublished(false);
            
            // 保存考试
            exam = examRepository.save(exam);
            
            // 解析并保存题目
            parseAndSaveQuestions(examJson, exam, request);
            
            // 重新加载带有题目的考试对象
            exam = examRepository.findById(exam.getId()).orElse(exam);
        
            return exam;
            
        } catch (Exception e) {
            throw new RuntimeException("生成考试失败：" + e.getMessage(), e);
        }
    }
    
    /**
     * 获取考试详情
     */
    public Exam getExamById(Long examId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("考试不存在"));
        
        // 确保加载题目列表
        List<Question> questions = questionRepository.findByExamId(examId);
        exam.setQuestions(questions);
        
        return exam;
    }
    
    /**
     * 获取考试题目
     */
    public List<Question> getExamQuestions(Long examId) {
        return questionRepository.findByExamId(examId);
    }
    
    /**
     * 发布考试
     */
    public void publishExam(Long examId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("考试不存在"));
        
        exam.setIsPublished(true);
        examRepository.save(exam);
    }
    
    /**
     * 发布答案和解析
     */
    public void publishAnswers(Long examId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("考试不存在"));
        
        exam.setIsAnswerPublished(true);
        examRepository.save(exam);
    }
    
    /**
     * 更新考试内容
     */
    public Exam updateExamContent(Long examId, String content) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("考试不存在"));
        
        // 清空原有题目
        List<Question> existingQuestions = questionRepository.findByExamId(examId);
        questionRepository.deleteAll(existingQuestions);
        
        // 重新解析并保存题目
        parseAndSaveQuestions(content, exam, null);
        
        // 重新加载带有题目的考试对象
        exam = examRepository.findById(examId).orElse(exam);
        
        return exam;
    }
    
    /**
     * 解析DeepSeek返回的试卷内容并保存题目
     */
    private void parseAndSaveQuestions(String examContent, Exam exam, ExamGenerationRequest request) {
        try {
            System.out.println("=== 开始解析题目内容 ===");
            System.out.println("原始内容长度: " + examContent.length());
            System.out.println("原始内容前800字符: " + examContent.substring(0, Math.min(800, examContent.length())));
            
            // 计算期望的题目数量
            int expectedQuestions = 0;
            if (request != null && request.getQuestionTypes() != null) {
                Map<String, Object> questionTypesMap = (Map<String, Object>) request.getQuestionTypes();
                for (Map.Entry<String, Object> entry : questionTypesMap.entrySet()) {
                    Object value = entry.getValue();
                    Integer count = null;
                    
                    // 安全处理不同类型的值
                    if (value instanceof Number) {
                        count = ((Number) value).intValue();
                    } else if (value instanceof Map) {
                        // 处理自定义题型的复杂对象结构 {count: xx, requirement: xx}
                        Map<String, Object> customType = (Map<String, Object>) value;
                        Object countValue = customType.get("count");
                        if (countValue instanceof Number) {
                            count = ((Number) countValue).intValue();
                        }
                    }
                    
                    if (count != null && count > 0) {
                        expectedQuestions += count;
                    }
                }
            }
            
            System.out.println("期望题目数量: " + expectedQuestions);
            
            // 尝试解析AI生成的内容
            boolean parseSuccess = parseAIGeneratedQuestions(exam, examContent, expectedQuestions);
            
            if (!parseSuccess) {
                System.out.println("AI内容解析失败，使用备用题目生成");
                // 如果解析失败，使用备用题目
                createTestQuestions(exam, examContent, request);
            }
            
        } catch (Exception e) {
            System.err.println("解析题目失败: " + e.getMessage());
            e.printStackTrace();
            // 创建一个默认题目，避免试卷完全为空
            createDefaultQuestion(exam);
        }
    }
    
    /**
     * 解析AI生成的题目内容
     */
    private boolean parseAIGeneratedQuestions(Exam exam, String content, int expectedQuestions) {
        try {
            List<Question> questions = new ArrayList<>();
            
            System.out.println("=== 开始详细解析AI题目 ===");
            System.out.println("原始内容总长度: " + content.length());
            System.out.println("期望题目数量: " + expectedQuestions);
            System.out.println("期望总分: " + exam.getTotalScore());
            
            // 按### 题目X分割内容
            String[] questionBlocks = content.split("###\\s*题目\\d+");
            System.out.println("分割后的块数量: " + questionBlocks.length);
            
            if (questionBlocks.length < 2) {
                System.out.println("未找到标准格式的题目分割符，尝试其他解析方式");
                // 尝试其他可能的分割符
                questionBlocks = content.split("题目\\d+");
                System.out.println("使用备用分割符后的块数量: " + questionBlocks.length);
                
                if (questionBlocks.length < 2) {
                    return false;
                }
            }
            
            for (int i = 1; i < questionBlocks.length; i++) {
                String block = questionBlocks[i];
                System.out.println("=== 解析第" + i + "个题目块 ===");
                System.out.println("题目块内容长度: " + block.length());
                System.out.println("题目块前200字符: " + block.substring(0, Math.min(200, block.length())));
                
                Question question = parseQuestionBlock(exam, block, i);
                if (question != null) {
                    questions.add(question);
                    System.out.println("成功解析题目" + i + ": " + question.getContent() + " (分值: " + question.getScore() + ")");
                } else {
                    System.out.println("题目" + i + "解析失败");
                }
            }
            
            if (questions.isEmpty()) {
                System.out.println("未能解析出任何题目");
                return false;
            }
            
            // 验证分值总和
            int actualTotalScore = questions.stream().mapToInt(q -> q.getScore() != null ? q.getScore() : 0).sum();
            int expectedTotalScore = exam.getTotalScore() != null ? exam.getTotalScore() : 100;
            
            System.out.println("=== 分值验证 ===");
            System.out.println("实际分值总和: " + actualTotalScore);
            System.out.println("期望分值总和: " + expectedTotalScore);
            
            // 如果分值不匹配，尝试调整
            if (actualTotalScore != expectedTotalScore) {
                System.out.println("分值总和不匹配，尝试调整...");
                adjustQuestionScores(questions, expectedTotalScore);
                actualTotalScore = questions.stream().mapToInt(q -> q.getScore() != null ? q.getScore() : 0).sum();
                System.out.println("调整后分值总和: " + actualTotalScore);
            }
            
            // 保存解析出的题目
            for (Question question : questions) {
                try {
                    // 在保存前验证所有必填字段
                    if (question.getType() == null || question.getType().trim().isEmpty()) {
                        question.setType("multiple-choice");
                        System.out.println("警告：题目类型为空，设置为默认值: multiple-choice");
                    }
                    if (question.getContent() == null || question.getContent().trim().isEmpty()) {
                        question.setContent("题目内容待完善");
                        System.out.println("警告：题目内容为空，设置为默认值");
                    }
                    if (question.getAnswer() == null || question.getAnswer().trim().isEmpty()) {
                        question.setAnswer("答案待完善");
                        System.out.println("警告：题目答案为空，设置为默认值");
                    }
                    if (question.getScore() == null) {
                        question.setScore(5);
                        System.out.println("警告：题目分值为空，设置为默认值: 5");
                    }
                    
                    questionRepository.save(question);
                    System.out.println("成功解析并保存题目: " + question.getContent() + " (分值: " + question.getScore() + 
                                     ", 类型: " + question.getType() + ", 答案: " + question.getAnswer() + ")");
                } catch (Exception saveException) {
                    System.err.println("保存题目失败: " + saveException.getMessage());
                    System.err.println("题目详情 - 类型: " + question.getType() + ", 内容: " + question.getContent() + 
                                     ", 答案: " + question.getAnswer() + ", 分值: " + question.getScore());
                    throw saveException; // 重新抛出异常以触发事务回滚
                }
            }
            
            System.out.println("成功解析了 " + questions.size() + " 道题目，总分值: " + actualTotalScore);
            
            // 检查是否解析出了足够的题目
            if (expectedQuestions > 0 && questions.size() < expectedQuestions) {
                System.out.println("警告：期望 " + expectedQuestions + " 道题目，但只解析出 " + questions.size() + " 道");
                System.out.println("可能原因：1) DeepSeek没有生成完整题目 2) 解析逻辑有问题");
                System.out.println("建议检查DeepSeek返回的完整内容");
                
                // 如果缺少太多题目，可以考虑返回false让系统使用备用方案
                if (questions.size() < expectedQuestions * 0.7) { // 如果少于期望的70%
                    System.out.println("解析出的题目数量严重不足，使用备用方案");
                    return false;
                }
            }
            
            // 检查分值是否严重偏离
            if (Math.abs(actualTotalScore - expectedTotalScore) > expectedTotalScore * 0.2) {
                System.out.println("警告：分值偏离过大，实际" + actualTotalScore + "分，期望" + expectedTotalScore + "分");
            }
            
            return true;
            
        } catch (Exception e) {
            System.err.println("解析AI生成内容失败: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
    
    /**
     * 调整题目分值以匹配总分要求
     */
    private void adjustQuestionScores(List<Question> questions, int expectedTotalScore) {
        if (questions.isEmpty()) return;
        
        int currentTotal = questions.stream().mapToInt(q -> q.getScore() != null ? q.getScore() : 0).sum();
        int difference = expectedTotalScore - currentTotal;
        
        System.out.println("需要调整分值差异: " + difference);
        
        if (difference == 0) return;
        
        // 平均分配差异到每道题
        int adjustmentPerQuestion = difference / questions.size();
        int remainder = difference % questions.size();
        
        for (int i = 0; i < questions.size(); i++) {
            Question question = questions.get(i);
            int currentScore = question.getScore() != null ? question.getScore() : 5;
            int adjustment = adjustmentPerQuestion;
            
            // 将余数分配给前几道题
            if (i < Math.abs(remainder)) {
                adjustment += (remainder > 0) ? 1 : -1;
            }
            
            int newScore = Math.max(1, currentScore + adjustment); // 确保分值至少为1
            question.setScore(newScore);
            
            System.out.println("题目" + (i + 1) + "分值调整: " + currentScore + " → " + newScore);
        }
    }
    
    /**
     * 解析单个题目块
     */
    private Question parseQuestionBlock(Exam exam, String block, int questionIndex) {
        try {
            Question question = new Question();
            question.setExam(exam);
            
            // 通用题型提取（支持任何自定义题型）
            String extractedType = extractQuestionType(block, questionIndex);
            question.setType(extractedType);
            System.out.println("题目" + questionIndex + "类型识别为: " + extractedType);
            
            // 智能提取题目内容（根据题型自适应）
            String content = extractQuestionContentSmartly(block, question.getType());
            if (content != null && !content.trim().isEmpty()) {
                question.setContent(content.trim());
            } else {
                question.setContent("题目内容解析失败，请手动补充");
                System.out.println("题目" + questionIndex + "内容提取失败，使用默认内容: " + question.getContent());
            }
            
            // 智能提取选项（自动判断是否需要选项）
            List<String> options = extractOptionsSmartly(block, question.getType());
            if (!options.isEmpty()) {
                question.setOptions(objectMapper.writeValueAsString(options));
            } else {
                question.setOptions(null);
            }
            
            // 智能提取答案（根据题型自适应）
            String answer = extractAnswerSmartly(block, question.getType());
            if (answer != null && !answer.trim().isEmpty()) {
                question.setAnswer(answer.trim());
            } else {
                // 根据题型设置默认答案
                question.setAnswer(getDefaultAnswerForType(question.getType()));
                System.out.println("题目" + questionIndex + "答案提取失败，使用默认答案: " + question.getAnswer());
            }
            
            // 提取解析
            String explanation = extractContent(block, "**解析**：", "**");
            if (explanation != null) {
                question.setExplanation(explanation.trim());
            }
            
            // 提取分值
            String scoreStr = extractContent(block, "**分值建议**：", "分");
            if (scoreStr != null) {
                try {
                    question.setScore(Integer.parseInt(scoreStr.trim()));
                } catch (NumberFormatException e) {
                    question.setScore(5); // 默认分值
                }
            } else {
                question.setScore(5); // 默认分值
            }
            
            return question;
            
        } catch (Exception e) {
            System.err.println("解析题目块失败: " + e.getMessage());
            return null;
        }
    }
    
    /**
     * 通用题型提取方法（支持任何自定义题型）
     */
    private String extractQuestionType(String block, int questionIndex) {
        // 首先尝试从第一行提取题型（支持中英文括号）
        String firstLine = block.split("\n")[0].trim();
        String extractedType = null;
        
        // 提取中文括号内的题型
        if (firstLine.contains("（") && firstLine.contains("）")) {
            extractedType = firstLine.substring(firstLine.indexOf("（") + 1, firstLine.indexOf("）"));
        } 
        // 提取英文括号内的题型
        else if (firstLine.contains("(") && firstLine.contains(")")) {
            extractedType = firstLine.substring(firstLine.indexOf("(") + 1, firstLine.indexOf(")"));
        }
        
        // 如果成功提取到题型，进行标准化处理
        if (extractedType != null && !extractedType.trim().isEmpty()) {
            extractedType = normalizeQuestionType(extractedType.trim());
            System.out.println("从第一行提取到题型: " + extractedType);
            return extractedType;
        }
        
        // 如果没有显式题型，从内容推断
        String inferredType = inferQuestionTypeFromContent(block);
        System.out.println("从内容推断题型: " + inferredType);
        return inferredType;
    }
    
    /**
     * 标准化题型名称（但保留原始特征）
     */
    private String normalizeQuestionType(String originalType) {
        String lowerType = originalType.toLowerCase();
        
        // 保留原始题型名称，但转换为合适的标识符格式
        // 移除特殊字符，用下划线连接
        String normalized = originalType
            .replaceAll("[\\s\\-]+", "_")  // 空格和破折号替换为下划线
            .replaceAll("[^\\u4e00-\\u9fa5a-zA-Z0-9_]", "")  // 保留中文、英文、数字、下划线
            .toLowerCase();
        
        // 如果是空的，使用推断逻辑
        if (normalized.isEmpty()) {
            return "unknown_type";
        }
        
        return normalized;
    }
    
    /**
     * 从题目内容推断题型
     */
    private String inferQuestionTypeFromContent(String block) {
        String lowerBlock = block.toLowerCase();
        
        // 按优先级判断题型
        if (lowerBlock.contains("编程") || lowerBlock.contains("程序") || lowerBlock.contains("代码") ||
            lowerBlock.contains("```") || lowerBlock.contains("python") || lowerBlock.contains("java") ||
            lowerBlock.contains("编写代码") || lowerBlock.contains("实现")) {
            return "programming";
        } else if (lowerBlock.contains("案例") || lowerBlock.contains("情景") || lowerBlock.contains("情况") ||
                   lowerBlock.contains("场景") || lowerBlock.contains("实例")) {
            return "case_analysis";
        } else if (lowerBlock.contains("a.") || lowerBlock.contains("a）") || lowerBlock.contains("a)") ||
                   (lowerBlock.contains("b.") && lowerBlock.contains("c.") && lowerBlock.contains("d."))) {
            return "multiple_choice";
        } else if (lowerBlock.contains("判断") || lowerBlock.contains("正确") || lowerBlock.contains("错误") ||
                   lowerBlock.contains("true") || lowerBlock.contains("false")) {
            return "true_false";
        } else if (lowerBlock.contains("填空") || lowerBlock.contains("____") || lowerBlock.contains("___")) {
            return "fill_blank";
        } else if (lowerBlock.contains("计算") || lowerBlock.contains("求解") || lowerBlock.contains("求")) {
            return "calculation";
        } else if (lowerBlock.contains("论述") || lowerBlock.contains("简述") || lowerBlock.contains("分析") ||
                   lowerBlock.contains("解答") || lowerBlock.contains("说明") || lowerBlock.contains("阐述")) {
            return "essay";
        } else {
            return "comprehensive"; // 综合题作为默认类型
        }
    }
    
    /**
     * 提取两个标记之间的内容
     */
    private String extractContent(String text, String startMarker, String endMarker) {
        if (text == null || startMarker == null) return null;
        
        int startIndex = text.indexOf(startMarker);
        if (startIndex == -1) return null;
        
        startIndex += startMarker.length();
        
        // 如果结束标记是换行符，找到第一个换行符
        if ("\n".equals(endMarker)) {
            int endIndex = text.indexOf("\n", startIndex);
            if (endIndex == -1) {
                return text.substring(startIndex).trim();
            }
            return text.substring(startIndex, endIndex).trim();
        }
        
        int endIndex = text.indexOf(endMarker, startIndex);
        
        if (endIndex == -1) {
            // 如果没有找到结束标记，取到下一个**或行末
            String remaining = text.substring(startIndex);
            
            // 尝试找到下一个**标记
            int nextMarker = remaining.indexOf("**");
            if (nextMarker != -1) {
                remaining = remaining.substring(0, nextMarker);
            }
            
            // 取第一行内容
            String[] lines = remaining.split("\n");
            if (lines.length > 0) {
                return lines[0].trim();
            }
            return remaining.trim();
        }
        
        return text.substring(startIndex, endIndex).trim();
    }
    
    /**
     * 提取选项
     */
    private List<String> extractOptions(String block) {
        List<String> options = new ArrayList<>();
        String[] lines = block.split("\n");
        
        for (String line : lines) {
            line = line.trim();
            // 匹配 A. B. C. D. 格式的选项
            if (line.matches("^[A-Z]\\..+")) {
                String option = line.substring(2).trim(); // 去掉 "A." 部分
                options.add(option);
            }
        }
        
        return options;
    }
    
    /**
     * 根据用户设置创建题目（基于AI返回内容）
     */
    private void createTestQuestions(Exam exam, String aiContent, ExamGenerationRequest request) {
        try {
            List<Question> questions = new ArrayList<>();
            
            // 获取用户的题型设置
            Map<String, Object> questionTypesMap = null;
            int totalQuestions = 0;
            int totalScore = exam.getTotalScore() != null ? exam.getTotalScore() : 100;
            
            if (request != null && request.getQuestionTypes() != null) {
                questionTypesMap = (Map<String, Object>) request.getQuestionTypes();
                
                // 计算总题目数
                for (Map.Entry<String, Object> entry : questionTypesMap.entrySet()) {
                    Object value = entry.getValue();
                    Integer count = null;
                    
                    // 安全处理不同类型的值
                    if (value instanceof Number) {
                        count = ((Number) value).intValue();
                    } else if (value instanceof Map) {
                        // 处理自定义题型的复杂对象结构 {count: xx, requirement: xx}
                        Map<String, Object> customType = (Map<String, Object>) value;
                        Object countValue = customType.get("count");
                        if (countValue instanceof Number) {
                            count = ((Number) countValue).intValue();
                        }
                    }
                    
                    if (count != null && count > 0) {
                        totalQuestions += count;
                    }
                }
            }
            
            // 如果没有用户设置，使用默认设置
            if (totalQuestions == 0) {
                totalQuestions = 5; // 默认5道题
            }
            
            // 计算每道题的平均分值
            int averageScore = totalScore / totalQuestions;
            int remainderScore = totalScore % totalQuestions;
            
            System.out.println("根据用户设置生成题目：总题数=" + totalQuestions + "，总分=" + totalScore + "，平均每题=" + averageScore + "分");
            
            // 预定义的题目池，根据用户设置动态选择
            String[][] questionPool = {
                // 选择题题目池
                {
                    "multiple-choice",
                    "在嵌入式Linux开发中，交叉编译的主要目的是什么？",
                    "[\"提高代码的可读性\", \"在宿主机上生成目标机可执行的程序\", \"减少代码的存储空间\", \"增强操作系统的安全性\"]",
                    "B",
                    "交叉编译是指在宿主机（如x86 PC）上编译生成能在目标机（如ARM架构）上运行的程序，解决目标机资源不足的问题。"
                },
                {
                    "multiple-choice",
                    "以下哪个工具常用于嵌入式Linux系统的根文件系统制作？",
                    "[\"GCC\", \"Make\", \"BusyBox\", \"GDB\"]",
                    "C",
                    "BusyBox集成了常用Linux命令，可生成轻量级根文件系统。GCC是编译器，Make是构建工具，GDB是调试器。"
                },
                {
                    "multiple-choice",
                    "在配置Linux内核时，\"make menuconfig\"命令的作用是？",
                    "[\"清理编译中间文件\", \"启动图形化配置界面\", \"直接编译内核镜像\", \"生成设备树文件\"]",
                    "B",
                    "`make menuconfig`启动基于ncurses的文本图形化配置界面，其他选项对应命令分别为`make clean`、`make zImage`、`make dtbs`。"
                },
                {
                    "multiple-choice",
                    "嵌入式Linux中，通过串口打印内核启动日志通常需要配置什么？",
                    "[\"内核启用CONFIG_SERIAL_CONSOLE\", \"修改Bootloader的网络参数\", \"禁用所有中断\", \"挂载NFS文件系统\"]",
                    "A",
                    "`CONFIG_SERIAL_CONSOLE`是内核串口控制台的关键配置项，B用于网络启动，D与文件系统相关，C会导致系统不可用。"
                },
                {
                    "multiple-choice",
                    "在嵌入式Python开发中，以下哪项是减少内存占用的有效方法？",
                    "[\"使用NumPy库\", \"启用垃圾回收机制\", \"编译为C扩展模块\", \"禁用字节码缓存（.pyc文件）\"]",
                    "D",
                    "禁用`.pyc`可节省存储空间（但可能影响性能）。A会增加依赖库体积，B是默认行为，C不直接减少内存占用。"
                },
                // 填空题题目池
                {
                    "fill-blank",
                    "在嵌入式Linux开发中，常用的交叉编译工具链前缀是______-linux-gnueabihf-gcc。",
                    "[]",
                    "arm",
                    "ARM架构的交叉编译工具链通常以arm-linux-gnueabihf-开头，用于编译ARM平台的程序。"
                },
                {
                    "fill-blank",
                    "Linux内核编译后生成的镜像文件通常命名为______。",
                    "[]",
                    "zImage",
                    "zImage是Linux内核编译后的压缩镜像文件，适用于嵌入式系统。"
                },
                // 判断题题目池
                {
                    "true-false",
                    "嵌入式Linux系统中，BusyBox可以替代大部分GNU工具。",
                    "[\"正确\", \"错误\"]",
                    "A",
                    "BusyBox集成了常用的Linux命令和工具，可以在资源受限的嵌入式系统中替代大部分GNU工具。"
                },
                {
                    "true-false",
                    "交叉编译时，目标架构和宿主机架构必须相同。",
                    "[\"正确\", \"错误\"]",
                    "B",
                    "交叉编译的目的就是在宿主机上编译出目标机能运行的程序，两者架构通常不同。"
                }
            };
            
            // 根据用户设置创建题目
            int questionIndex = 0;
            if (questionTypesMap != null) {
                for (Map.Entry<String, Object> entry : questionTypesMap.entrySet()) {
                    String questionType = entry.getKey();
                    Object value = entry.getValue();
                    Integer count = null;
                    
                    // 安全处理不同类型的值
                    if (value instanceof Number) {
                        count = ((Number) value).intValue();
                    } else if (value instanceof Map) {
                        // 处理自定义题型的复杂对象结构 {count: xx, requirement: xx}
                        Map<String, Object> customType = (Map<String, Object>) value;
                        Object countValue = customType.get("count");
                        if (countValue instanceof Number) {
                            count = ((Number) countValue).intValue();
                        }
                    }
                    
                    if (count != null && count > 0) {
                        System.out.println("创建 " + questionType + " 类型题目 " + count + " 道");
                        
                        for (int i = 0; i < count && questionIndex < questionPool.length; i++) {
                            // 查找匹配的题目类型
                            while (questionIndex < questionPool.length && 
                                   !questionPool[questionIndex][0].equals(questionType)) {
                                questionIndex++;
                            }
                            
                            if (questionIndex < questionPool.length) {
                                Question question = new Question();
                                question.setExam(exam);
                                question.setType(questionPool[questionIndex][0]);
                                question.setContent(questionPool[questionIndex][1]);
                                question.setOptions(questionPool[questionIndex][2]);
                                question.setAnswer(questionPool[questionIndex][3]);
                                question.setExplanation(questionPool[questionIndex][4]);
                                
                                // 分配分值
                                int questionScore = averageScore;
                                if (remainderScore > 0) {
                                    questionScore++;
                                    remainderScore--;
                                }
                                question.setScore(questionScore);
                                
                                questions.add(question);
                                questionIndex++;
                            }
                        }
                    }
                }
            } else {
                // 默认创建5道选择题
                for (int i = 0; i < Math.min(5, questionPool.length); i++) {
                    if (questionPool[i][0].equals("multiple-choice")) {
                        Question question = new Question();
                        question.setExam(exam);
                        question.setType(questionPool[i][0]);
                        question.setContent(questionPool[i][1]);
                        question.setOptions(questionPool[i][2]);
                        question.setAnswer(questionPool[i][3]);
                        question.setExplanation(questionPool[i][4]);
                        
                        int questionScore = averageScore;
                        if (remainderScore > 0) {
                            questionScore++;
                            remainderScore--;
                        }
                        question.setScore(questionScore);
                        
                        questions.add(question);
                    }
                }
            }
            
            // 保存所有题目
            for (Question question : questions) {
                questionRepository.save(question);
                System.out.println("保存题目成功: " + question.getContent() + " (分值: " + question.getScore() + ")");
            }
            
            System.out.println("共创建了 " + questions.size() + " 道题目，总分值: " + 
                questions.stream().mapToInt(q -> q.getScore() != null ? q.getScore() : 0).sum());
            
        } catch (Exception e) {
            System.err.println("创建测试题目失败: " + e.getMessage());
            e.printStackTrace();
            createDefaultQuestion(exam);
        }
    }
    
    /**
     * 简单提取两个关键词之间的内容
     */
    private String extractContentSimple(String text, String startKeyword, String endKeyword) {
        try {
            String startPattern = "**" + startKeyword + "**";
            String endPattern = "**" + endKeyword + "**";
            
            int startIndex = text.indexOf(startPattern);
            if (startIndex == -1) return null;
            
            startIndex += startPattern.length();
            if (text.charAt(startIndex) == '：' || text.charAt(startIndex) == ':') {
                startIndex++;
            }
            
            int endIndex = text.indexOf(endPattern, startIndex);
            if (endIndex == -1) {
                return text.substring(startIndex).trim();
            }
            
            return text.substring(startIndex, endIndex).trim();
        } catch (Exception e) {
            return null;
        }
    }
    
    /**
     * 使用正则表达式提取内容
     */
    private String extractContentByPattern(String text, String pattern) {
        try {
            java.util.regex.Pattern p = java.util.regex.Pattern.compile(pattern, java.util.regex.Pattern.DOTALL);
            java.util.regex.Matcher m = p.matcher(text);
            if (m.find()) {
                return m.group(1).trim();
            }
        } catch (Exception e) {
            // 忽略错误
        }
        return null;
    }
    
    /**
     * 创建默认题目（当解析失败时）
     */
    private void createDefaultQuestion(Exam exam) {
        Question defaultQuestion = new Question();
        defaultQuestion.setExam(exam);
        defaultQuestion.setType("multiple-choice");
        defaultQuestion.setContent("AI生成的样例题目：请选择正确答案");
        defaultQuestion.setOptions("[\"选项A\", \"选项B\", \"选项C\", \"选项D\"]");
        defaultQuestion.setAnswer("A");
        defaultQuestion.setExplanation("这是AI生成试卷时的示例题目");
        defaultQuestion.setScore(5);
        questionRepository.save(defaultQuestion);
    }
    
    /**
     * 智能提取选项（根据题型和内容自动判断）
     */
    private List<String> extractOptionsSmartly(String block, String questionType) {
        List<String> options = new ArrayList<>();
        
        // 判断是否需要选项的题型
        boolean needsOptions = questionType.contains("choice") || questionType.contains("选择") || 
                              questionType.contains("判断") || questionType.contains("true_false");
        
        if (!needsOptions) {
            return options; // 不需要选项的题型直接返回空列表
        }
        
        // 提取选项的多种格式
        String[] lines = block.split("\n");
        for (String line : lines) {
            line = line.trim();
            
            // 匹配各种选项格式
            if (line.matches("^[A-Za-z][.）)].*") || line.matches("^[A-Za-z]\\s*[.）)].*")) {
                // A. 选项内容 或 A) 选项内容 或 A） 选项内容
                options.add(line);
            } else if (line.matches("^\\([A-Za-z]\\).*")) {
                // (A) 选项内容
                options.add(line);
            } else if (line.matches("^[①②③④⑤⑥⑦⑧⑨⑩].*")) {
                // 圆圈数字格式
                options.add(line);
            } else if (line.matches("^[1-9][0-9]*[.）)].*")) {
                // 数字格式：1. 2. 3.
                options.add(line);
            }
        }
        
        System.out.println("题型 " + questionType + " 提取到 " + options.size() + " 个选项");
        return options;
    }
    
    /**
     * 智能提取答案（根据题型自适应多种格式）
     */
    private String extractAnswerSmartly(String block, String questionType) {
        // 根据题型使用不同的提取策略
        if (questionType.contains("programming") || questionType.contains("编程") || questionType.contains("代码")) {
            return extractProgrammingAnswer(block);
        } else if (questionType.contains("case") || questionType.contains("案例") || questionType.contains("分析")) {
            return extractCaseAnalysisAnswer(block);
        } else {
            return extractGeneralAnswer(block);
        }
    }
    
    /**
     * 提取编程题答案
     */
    private String extractProgrammingAnswer(String block) {
        String answer = null;
        
        // 1. 先尝试从正确答案标记提取完整答案
        answer = extractGeneralAnswer(block);
        if (answer != null && !answer.trim().isEmpty() && answer.length() > 50) {
            // 如果答案长度合理，直接返回
            return cleanupAnswer(answer);
        }
        
        // 2. 优先提取代码块（可能包含在答案中）
        int codeStart = block.indexOf("```");
        if (codeStart != -1) {
            int codeEnd = block.indexOf("```", codeStart + 3);
            if (codeEnd != -1) {
                String code = block.substring(codeStart + 3, codeEnd).trim();
                // 移除语言标识符
                if (code.contains("\n")) {
                    String firstLine = code.split("\n")[0];
                    if (firstLine.matches("^(python|java|c\\+\\+|javascript|c|cpp)\\s*$")) {
                        code = code.substring(code.indexOf("\n") + 1).trim();
                    }
                }
                
                // 检查是否还有答案的其他部分（比如评分标准）
                if (answer != null && !answer.trim().isEmpty()) {
                    // 如果通用答案中包含了除代码外的其他内容，组合起来
                    if (!answer.contains("```") && !answer.equals(code)) {
                        return code + "\n\n" + answer;
                    }
                }
                
                return code;
            }
        }
        
        // 3. 尝试其他格式
        if (answer == null || answer.trim().isEmpty()) {
            answer = extractContent(block, "**示例答案**：", "**");
        }
        if (answer == null || answer.trim().isEmpty()) {
            answer = extractContent(block, "答案代码：", "\n**");
        }
        if (answer == null || answer.trim().isEmpty()) {
            answer = extractContent(block, "参考代码：", "\n**");
        }
        if (answer == null || answer.trim().isEmpty()) {
            answer = extractContent(block, "**评分标准**：", "**");
        }
        
        return answer != null ? cleanupAnswer(answer) : null;
    }
    
    /**
     * 提取案例分析题答案
     */
    private String extractCaseAnalysisAnswer(String block) {
        // 案例分析题的答案通常很长，需要特殊处理
        String answer = null;
        
        // 尝试提取完整的答案内容（从答案标记到解析标记之间的所有内容）
        int answerStart = block.indexOf("**正确答案**：");
        if (answerStart != -1) {
            answerStart += "**正确答案**：".length();
            
            // 查找解析部分的开始位置作为答案的结束位置
            int analysisStart = block.indexOf("**解析**：", answerStart);
            if (analysisStart != -1) {
                answer = block.substring(answerStart, analysisStart).trim();
            } else {
                // 如果没有解析部分，查找分值建议的位置
                int scoreStart = block.indexOf("**分值建议**：", answerStart);
                if (scoreStart != -1) {
                    answer = block.substring(answerStart, scoreStart).trim();
                } else {
                    // 如果都没有，取到最后
                    answer = block.substring(answerStart).trim();
                }
            }
        }
        
        // 如果仍然没有找到，尝试其他格式
        if (answer == null || answer.trim().isEmpty()) {
            answer = extractContent(block, "**分析过程**：", "**");
            if (answer == null || answer.trim().isEmpty()) {
                answer = extractContent(block, "**解答**：", "**");
            }
            if (answer == null || answer.trim().isEmpty()) {
                answer = extractContent(block, "**答案要点**：", "**");
            }
            if (answer == null || answer.trim().isEmpty()) {
                // 尝试通用格式
                answer = extractGeneralAnswer(block);
            }
        }
        
        // 清理答案内容（移除多余的空行和格式字符）
        if (answer != null && !answer.trim().isEmpty()) {
            answer = cleanupAnswer(answer);
        }
        
        return answer;
    }
    
    /**
     * 提取通用题型答案
     */
    private String extractGeneralAnswer(String block) {
        // 尝试多种答案格式
        String[] answerPatterns = {
            "**正确答案**：", "**答案**：", "**参考答案**：",
            "正确答案：", "答案：", "参考答案：",
            "正确答案:", "答案:", "参考答案:"
        };
        
        for (String pattern : answerPatterns) {
            // 先尝试提取到下一个**标记的内容
            String answer = extractContent(block, pattern, "**");
            if (answer != null && !answer.trim().isEmpty()) {
                return answer;
            }
            
            // 如果没有找到，尝试提取到解析部分
            int answerStart = block.indexOf(pattern);
            if (answerStart != -1) {
                answerStart += pattern.length();
                
                // 查找解析部分的开始位置
                int analysisStart = block.indexOf("**解析**：", answerStart);
                if (analysisStart != -1) {
                    answer = block.substring(answerStart, analysisStart).trim();
                    if (!answer.isEmpty()) {
                        return answer;
                    }
                } else {
                    // 查找分值建议的位置
                    int scoreStart = block.indexOf("**分值建议**：", answerStart);
                    if (scoreStart != -1) {
                        answer = block.substring(answerStart, scoreStart).trim();
                        if (!answer.isEmpty()) {
                            return answer;
                        }
                    }
                }
            }
            
            // 最后尝试以换行为结束符（适用于简短答案）
            answer = extractContent(block, pattern, "\n");
            if (answer != null && !answer.trim().isEmpty()) {
                return answer;
            }
        }
        
        return null;
    }
    
    /**
     * 根据题型获取默认答案
     */
    private String getDefaultAnswerForType(String questionType) {
        if (questionType.contains("choice") || questionType.contains("选择")) {
            return "A";
        } else if (questionType.contains("true_false") || questionType.contains("判断")) {
            return "正确";
        } else if (questionType.contains("programming") || questionType.contains("编程")) {
            return "// 代码答案解析失败，请手动补充";
        } else if (questionType.contains("case") || questionType.contains("案例")) {
            return "案例分析答案待完善";
        } else if (questionType.contains("fill") || questionType.contains("填空")) {
            return "______";
        } else {
            return "答案待完善";
        }
    }
    
    /**
     * 智能提取题目内容（根据题型自适应长度和格式）
     */
    private String extractQuestionContentSmartly(String block, String questionType) {
        // 对于案例分析题等复杂题型，需要提取更多内容
        if (questionType.contains("案例") || questionType.contains("case") || 
            questionType.contains("分析") || questionType.contains("综合")) {
            return extractLongQuestionContent(block);
        } else if (questionType.contains("编程") || questionType.contains("programming")) {
            return extractProgrammingQuestionContent(block);
        } else {
            return extractStandardQuestionContent(block);
        }
    }
    
    /**
     * 提取长题型内容（案例分析题等）
     */
    private String extractLongQuestionContent(String block) {
        int contentStart = block.indexOf("**题目内容**：");
        if (contentStart != -1) {
            contentStart += "**题目内容**：".length();
            
            // 查找任何答案相关标记作为内容的结束位置（严格分离题目和答案）
            String[] answerMarkers = {
                "**正确答案**：", "**参考答案**：", "**答案**：",
                "**解析**：", "**分值建议**："
            };
            
            int answerStart = Integer.MAX_VALUE;
            for (String marker : answerMarkers) {
                int pos = block.indexOf(marker, contentStart);
                if (pos != -1 && pos < answerStart) {
                    answerStart = pos;
                }
            }
            
            if (answerStart != Integer.MAX_VALUE) {
                String content = block.substring(contentStart, answerStart).trim();
                // 确保内容不包含答案信息
                content = cleanQuestionContent(content);
                return content;
            }
        }
        
        // 兜底逻辑：使用通用提取
        return extractStandardQuestionContent(block);
    }
    
    /**
     * 清理题目内容，确保不包含答案信息
     */
    private String cleanQuestionContent(String content) {
        if (content == null || content.trim().isEmpty()) {
            return content;
        }
        
        // 移除可能泄露答案的标记
        String[] answerIndicators = {
            "**参考答案**", "**正确答案**", "**答案**", "参考答案：", "正确答案：", "答案："
        };
        
        String cleaned = content;
        for (String indicator : answerIndicators) {
            int pos = cleaned.indexOf(indicator);
            if (pos != -1) {
                // 如果找到答案标记，截断到该位置
                cleaned = cleaned.substring(0, pos).trim();
                break;
            }
        }
        
        return cleaned;
    }
    
    /**
     * 提取编程题内容
     */
    private String extractProgrammingQuestionContent(String block) {
        // 编程题可能包含代码示例，需要保留完整内容
        return extractLongQuestionContent(block);
    }
    
    /**
     * 提取标准题型内容
     */
    private String extractStandardQuestionContent(String block) {
        // 尝试标准格式
        String content = extractContent(block, "**题目内容**：", "**");
        if (content != null && !content.trim().isEmpty()) {
            return content;
        }
        
        // 尝试其他格式
        content = extractContent(block, "题目：", "\n");
        if (content != null && !content.trim().isEmpty()) {
            return content;
        }
        
        content = extractContent(block, "题目:", "\n");
        if (content != null && !content.trim().isEmpty()) {
            return content;
        }
        
        // 如果都没找到，智能解析内容
        String[] lines = block.split("\n");
        StringBuilder contentBuilder = new StringBuilder();
        boolean contentStarted = false;
        
        for (int i = 0; i < lines.length; i++) {
            String line = lines[i].trim();
            
            // 跳过题目标题行
            if (line.contains("题目") && line.contains("（") && line.contains("）")) {
                continue;
            }
            
            // 如果遇到答案或解析标记，停止
            if (line.startsWith("**正确答案**") || line.startsWith("**解析**") || 
                line.startsWith("**分值建议**") || line.startsWith("**选项**")) {
                break;
            }
            
            // 收集内容行
            if (!line.isEmpty() && !line.startsWith("**题目内容**")) {
                if (contentBuilder.length() > 0) {
                    contentBuilder.append("\n");
                }
                contentBuilder.append(line);
                contentStarted = true;
            }
        }
        
        return contentStarted ? contentBuilder.toString().trim() : null;
    }
    
    /**
     * 清理答案内容，移除多余格式字符和空行
     */
    private String cleanupAnswer(String rawAnswer) {
        if (rawAnswer == null || rawAnswer.trim().isEmpty()) {
            return rawAnswer;
        }
        
        // 移除开头和结尾的空白字符
        String cleaned = rawAnswer.trim();
        
        // 移除多余的连续空行，保留必要的换行结构
        cleaned = cleaned.replaceAll("\n\\s*\n\\s*\n", "\n\n");
        
        // 移除每行开头的多余空格，但保留缩进结构
        String[] lines = cleaned.split("\n");
        StringBuilder result = new StringBuilder();
        
        for (int i = 0; i < lines.length; i++) {
            String line = lines[i];
            
            // 保留有意义的内容行，跳过只包含空白的行
            if (!line.trim().isEmpty()) {
                // 保留适当的缩进，但去除过多的空格
                String trimmedLine = line.replaceAll("^\\s{0,4}", "").trim();
                if (!trimmedLine.isEmpty()) {
                    if (result.length() > 0) {
                        result.append("\n");
                    }
                    result.append(trimmedLine);
                }
            } else if (i > 0 && i < lines.length - 1 && result.length() > 0) {
                // 在非空行之间保留一个空行用于分段
                result.append("\n");
            }
        }
        
        return result.toString();
    }
} 