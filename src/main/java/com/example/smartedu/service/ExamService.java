package com.example.smartedu.service;

import com.example.smartedu.dto.ExamGenerationRequest;
import com.example.smartedu.dto.ExamListDTO;
import com.example.smartedu.entity.*;
import com.example.smartedu.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.stream.Collectors;
import java.time.LocalDateTime;

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
    
    @Autowired
    private ExamResultRepository examResultRepository;
    
    @Autowired
    private KnowledgeBaseService knowledgeBaseService;
    
    @Autowired
    private EmbeddingService embeddingService;
    
    /**
     * 生成考试
     */
    public Exam generateExam(ExamGenerationRequest request) {
        try {
            // 验证课程存在
            Course course = courseRepository.findById(request.getCourseId())
                    .orElseThrow(() -> new RuntimeException("课程不存在"));
            
            // 使用RAG从知识库检索相关内容，如果知识库没有数据则使用课程资料
            String ragContent = retrieveRelevantKnowledge(request.getCourseId(), request);
            
            if (ragContent == null || ragContent.trim().isEmpty()) {
                // 检查课程是否有任何内容资源
                List<CourseMaterial> materials = courseMaterialRepository.findByCourseId(request.getCourseId());
                
                if (materials.isEmpty()) {
                    throw new RuntimeException("该课程没有上传任何学习资料。请先在课程管理中上传PPT、PDF或Word等课程资料，或者在知识库管理中上传相关文档，然后再尝试生成试卷。");
                } else {
                    // 检查资料是否有文本内容
                    boolean hasContent = materials.stream().anyMatch(m -> m.getContent() != null && !m.getContent().trim().isEmpty());
                    if (!hasContent) {
                        throw new RuntimeException("课程资料中没有可提取的文本内容。请确保上传的文档包含文字内容（不只是图片），或者在知识库管理中重新上传并处理文档。");
                    } else {
                        throw new RuntimeException("无法从课程资料中生成足够的内容。建议：1）在知识库管理中上传更多相关文档；2）确保上传的文档内容丰富且与课程相关；3）检查文档格式是否正确。");
                    }
                }
            }
            
            System.out.println("RAG检索到的知识内容长度: " + ragContent.length() + " 字符");
            
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
            
            // 调用DeepSeek API生成试卷内容，使用RAG检索的内容
            String examJson = deepSeekService.generateExamQuestionsWithSettings(
                course.getName(),
                "基于知识库内容",
                questionTypesMap,
                (Map<String, Object>) request.getDifficulty(),
                request.getTotalScore(),
                request.getDuration(),
                ragContent,
                request.getSpecialRequirements()
            );
            
            // 创建考试记录
        Exam exam = new Exam();
            // 生成时间格式：yyyyMMddHHmm
            String timeStamp = java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmm"));
            exam.setTitle(course.getName() + "+" + timeStamp);
            exam.setCourse(course);
            
            // 根据内容来源设置不同的标识
            if (ragContent.contains("=== 基于知识库检索的相关内容 ===")) {
                exam.setChapter("基于知识库内容");
                exam.setExamType("知识库RAG生成");
            } else if (ragContent.contains("=== 基于课程资料的相关内容 ===")) {
                exam.setChapter("基于课程资料内容");
                exam.setExamType("课程资料生成");
            } else {
                exam.setChapter("基于已有内容");
                exam.setExamType("智能生成");
            }
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
     * 使用RAG检索相关知识内容
     */
    private String retrieveRelevantKnowledge(Long courseId, ExamGenerationRequest request) {
        try {
            // 构建查询语句，基于题型和课程内容
            String query = buildSearchQuery(request);
            
            // 从向量数据库中检索相关内容，增加检索数量以获得更全面的内容
            List<VectorDatabaseService.SearchResult> searchResults = 
                knowledgeBaseService.searchKnowledge(courseId, query, 15); // 增加到15个结果
            
            if (searchResults.isEmpty()) {
                System.out.println("警告：未从知识库中检索到相关内容，尝试使用课程资料作为备选");
                // 当知识库没有数据时，尝试使用课程资料作为fallback
                return getCourseMaterialContent(courseId);
            }
            
            System.out.println("RAG检索到 " + searchResults.size() + " 个相关知识块");
            
            // 合并检索结果，按相关性排序
            StringBuilder ragContent = new StringBuilder();
            ragContent.append("=== 基于知识库检索的相关内容 ===\n\n");
            
            for (int i = 0; i < searchResults.size(); i++) {
                VectorDatabaseService.SearchResult result = searchResults.get(i);
                ragContent.append(String.format("【知识块 %d】(相关度: %.3f)\n", i + 1, result.getScore()));
                ragContent.append(result.getContent());
                ragContent.append("\n\n---\n\n");
            }
            
            System.out.println("RAG内容构建完成，总长度: " + ragContent.length() + " 字符");
            return ragContent.toString();
            
        } catch (Exception e) {
            System.err.println("RAG检索失败: " + e.getMessage());
            e.printStackTrace();
            // 发生异常时也尝试使用课程资料作为fallback
            return getCourseMaterialContent(courseId);
        }
    }
    
    /**
     * 获取课程资料内容作为fallback
     */
    private String getCourseMaterialContent(Long courseId) {
        try {
            List<CourseMaterial> materials = courseMaterialRepository.findByCourseIdOrderByUploadedAtDesc(courseId);
            
            System.out.println("课程 " + courseId + " 共有 " + materials.size() + " 个资料文件");
            
            if (materials.isEmpty()) {
                System.out.println("课程 " + courseId + " 既没有知识库数据，也没有课程资料");
                return null;
            }
            
            StringBuilder content = new StringBuilder();
            content.append("=== 基于课程资料的相关内容 ===\n\n");
            
            int validMaterialCount = 0;
            int totalMaterialCount = 0;
            
            for (CourseMaterial material : materials) {
                totalMaterialCount++;
                System.out.println("检查资料 " + totalMaterialCount + ": " + material.getOriginalName() + 
                                 " (内容长度: " + (material.getContent() != null ? material.getContent().length() : 0) + ")");
                
                if (material.getContent() != null && !material.getContent().trim().isEmpty()) {
                    content.append(String.format("【资料 %d】%s\n", ++validMaterialCount, material.getOriginalName()));
                    String materialContent = material.getContent().trim();
                    
                    // 如果内容太长，只取前面部分
                    if (materialContent.length() > 3000) {
                        materialContent = materialContent.substring(0, 3000) + "...[内容过长，已截断]";
                    }
                    
                    content.append(materialContent);
                    content.append("\n\n---\n\n");
                    
                    // 限制总内容长度，避免过长
                    if (content.length() > 15000) {
                        content.append("...[更多内容已省略]\n");
                        break;
                    }
                }
            }
            
            if (validMaterialCount == 0) {
                System.out.println("课程资料中没有可用的文本内容。共检查了 " + totalMaterialCount + " 个资料文件。");
                return null;
            }
            
            System.out.println("使用课程资料作为内容源，共 " + validMaterialCount + "/" + totalMaterialCount + 
                             " 个有效资料，总长度: " + content.length() + " 字符");
            return content.toString();
            
        } catch (Exception e) {
            System.err.println("获取课程资料内容失败: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }
    
    /**
     * 构建搜索查询语句
     */
    private String buildSearchQuery(ExamGenerationRequest request) {
        StringBuilder query = new StringBuilder();
        
        // 基于题型构建查询
        if (request.getQuestionTypes() != null) {
            Map<String, Object> questionTypes = (Map<String, Object>) request.getQuestionTypes();
            
            for (String type : questionTypes.keySet()) {
                switch (type) {
                    case "multiple-choice":
                        query.append("概念 定义 选择 理论 原理 ");
                        break;
                    case "fill-blank":
                        query.append("关键词 术语 公式 步骤 ");
                        break;
                    case "true-false":
                        query.append("判断 正确 错误 特点 性质 ");
                        break;
                    case "answer":
                        query.append("解答 分析 计算 解决 方法 过程 ");
                        break;
                    case "custom":
                        // 对于自定义题型，尝试从要求中提取关键词
                        if (questionTypes.get(type) instanceof Map) {
                            Map<String, Object> customType = (Map<String, Object>) questionTypes.get(type);
                            String requirement = (String) customType.get("requirement");
                            if (requirement != null && !requirement.trim().isEmpty()) {
                                query.append(requirement).append(" ");
                            }
                        }
                        break;
                }
            }
        }
        
        // 添加通用的学习相关词汇
        query.append("知识 内容 学习 课程 教学");
        
        // 如果有特殊要求，也加入查询
        if (request.getSpecialRequirements() != null && !request.getSpecialRequirements().trim().isEmpty()) {
            query.append(" ").append(request.getSpecialRequirements());
        }
        
        String finalQuery = query.toString().trim();
        System.out.println("构建的RAG搜索查询: " + finalQuery);
        return finalQuery;
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
        
        // 确保加载课程信息（触发延迟加载）
        if (exam.getCourse() != null) {
            // 访问课程属性以触发延迟加载
            exam.getCourse().getName();
            exam.getCourse().getCourseCode();
        }
        
        return exam;
    }
    
    /**
     * 获取考试题目
     */
    public List<Question> getExamQuestions(Long examId) {
        return questionRepository.findByExamId(examId);
    }
    
    /**
     * 发布考试（立即发布）
     */
    public void publishExam(Long examId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("考试不存在"));
        
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        
        exam.setIsPublished(true);
        exam.setPublishedAt(now); // 设置发布时间
        exam.setStartTime(now); // 立即发布时，开始时间就是发布时间
        
        // 根据考试时长设置结束时间
        if (exam.getDuration() != null) {
            exam.setEndTime(now.plusMinutes(exam.getDuration()));
        }
        
        examRepository.save(exam);
    }
    
    /**
     * 发布考试并设置时间
     */
    public void publishExamWithTime(Long examId, java.time.LocalDateTime startTime, java.time.LocalDateTime endTime) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("考试不存在"));
        
        // 验证时间设置
        if (startTime != null && endTime != null && startTime.isAfter(endTime)) {
            throw new RuntimeException("开始时间不能晚于结束时间");
        }
        
        exam.setIsPublished(true);
        exam.setPublishedAt(java.time.LocalDateTime.now());
        exam.setStartTime(startTime);
        exam.setEndTime(endTime);
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
            
            // 构建题目类型顺序列表
            List<String> questionTypeOrder = new ArrayList<>();
            int expectedQuestions = 0;
            
            if (request != null && request.getQuestionTypes() != null) {
                Map<String, Object> questionTypesMap = (Map<String, Object>) request.getQuestionTypes();
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
                        // 对于自定义题型，使用requirement作为题型名称
                        String requirement = (String) customType.get("requirement");
                        if (requirement != null && !requirement.trim().isEmpty()) {
                            questionType = "custom"; // 保持为custom，但后续会特殊处理
                        }
                    }
                    
                    if (count != null && count > 0) {
                        // 根据数量添加题目类型到顺序列表
                        for (int i = 0; i < count; i++) {
                            questionTypeOrder.add(questionType);
                        }
                        expectedQuestions += count;
                    }
                }
            }
            
            System.out.println("期望题目数量: " + expectedQuestions);
            System.out.println("题目类型顺序: " + questionTypeOrder);
            
            // 尝试解析AI生成的内容，传递题目类型顺序
            boolean parseSuccess = parseAIGeneratedQuestions(exam, examContent, expectedQuestions, questionTypeOrder);
            
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
     * 解析AI生成的题目内容（兼容旧版本）
     */
    private boolean parseAIGeneratedQuestions(Exam exam, String content, int expectedQuestions) {
        return parseAIGeneratedQuestions(exam, content, expectedQuestions, null);
    }
    
    /**
     * 解析AI生成的题目内容（支持题目类型顺序）
     */
    private boolean parseAIGeneratedQuestions(Exam exam, String content, int expectedQuestions, List<String> questionTypeOrder) {
        try {
            List<Question> questions = new ArrayList<>();
            
            System.out.println("=== 开始详细解析AI题目 ===");
            System.out.println("原始内容总长度: " + content.length());
            System.out.println("期望题目数量: " + expectedQuestions);
            System.out.println("期望总分: " + exam.getTotalScore());
            
            // 打印AI生成的原始内容前500字符用于调试
            System.out.println("AI生成内容前500字符：");
            System.out.println(content.substring(0, Math.min(500, content.length())));
            
            // 尝试多种分割符模式
            String[] questionBlocks = null;
            
            // 模式1: ### 题目X（类型）
            questionBlocks = content.split("###\\s*题目\\d+[^\\n]*");
            System.out.println("模式1分割后的块数量: " + questionBlocks.length);
            
            if (questionBlocks.length < 2) {
                // 模式2: ### 题目X
                questionBlocks = content.split("###\\s*题目\\d+");
                System.out.println("模式2分割后的块数量: " + questionBlocks.length);
            }
            
            if (questionBlocks.length < 2) {
                // 模式3: 题目X（任何格式）
                questionBlocks = content.split("题目\\d+[^\\n]*");
                System.out.println("模式3分割后的块数量: " + questionBlocks.length);
            }
            
            if (questionBlocks.length < 2) {
                // 模式4: ## 题目X 或 # 题目X
                questionBlocks = content.split("#{1,3}\\s*题目\\d+[^\\n]*");
                System.out.println("模式4分割后的块数量: " + questionBlocks.length);
            }
            
            if (questionBlocks.length < 2) {
                // 模式5: 使用---分隔符
                questionBlocks = content.split("---+");
                System.out.println("模式5分割后的块数量: " + questionBlocks.length);
            }
            
            // 只有在期望多道题目时才使用数字编号分割，避免把题目内容中的编号误识别为分割符
            if (questionBlocks.length < 2 && expectedQuestions > 1) {
                // 模式6: 数字编号 1. 2. 3.（仅在期望多题时使用）
                questionBlocks = content.split("\\n\\s*\\d+\\.");
                System.out.println("模式6（数字编号）分割后的块数量: " + questionBlocks.length);
            }
            
            if (questionBlocks.length < 2) {
                System.out.println("所有分割模式都失败，尝试整体解析");
                // 如果所有分割都失败，尝试将整个内容作为一道题目
                return parseAsOneQuestion(exam, content, expectedQuestions);
            }
            
            // 特殊处理：如果期望1道题目，但分割结果不合理，优先使用整体解析
            if (expectedQuestions == 1) {
                boolean shouldUseWholeContent = false;
                
                // 检查分割结果是否合理
                if (questionBlocks.length == 2) {
                    // 如果分割成2块，检查第一块是否太小（可能是验证信息等）
                    String firstBlock = questionBlocks[1].trim(); // 第0块通常是空的
                    if (firstBlock.length() < 100) {
                        System.out.println("第一个分割块太小(" + firstBlock.length() + "字符)，可能不是完整题目，使用整体解析");
                        shouldUseWholeContent = true;
                    }
                } else if (questionBlocks.length > 2) {
                    // 如果分割成多块但期望1道题，可能是误分割
                    System.out.println("期望1道题目但分割成" + questionBlocks.length + "块，可能是误分割，使用整体解析");
                    shouldUseWholeContent = true;
                }
                
                if (shouldUseWholeContent) {
                    return parseAsOneQuestion(exam, content, expectedQuestions);
                }
            }
            
            // 解析每个题目块
            for (int i = 1; i < questionBlocks.length; i++) {
                String block = questionBlocks[i].trim();
                if (block.isEmpty()) continue;
                
                System.out.println("=== 解析第" + i + "个题目块 ===");
                System.out.println("题目块内容长度: " + block.length());
                System.out.println("题目块前300字符: " + block.substring(0, Math.min(300, block.length())));
                
                Question question = parseQuestionBlock(exam, block, i, questionTypeOrder);
                if (question != null) {
                    questions.add(question);
                    System.out.println("成功解析题目" + i + ": " + question.getContent().substring(0, Math.min(50, question.getContent().length())) + "... (分值: " + question.getScore() + ")");
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
                    System.out.println("成功解析并保存题目: " + question.getContent().substring(0, Math.min(30, question.getContent().length())) + "... (分值: " + question.getScore() + 
                                     ", 类型: " + question.getType() + ", 答案长度: " + (question.getAnswer() != null ? question.getAnswer().length() : 0) + "字符)");
                } catch (Exception saveException) {
                    System.err.println("保存题目失败: " + saveException.getMessage());
                    System.err.println("题目详情 - 类型: " + question.getType() + ", 内容长度: " + (question.getContent() != null ? question.getContent().length() : 0) + 
                                     ", 答案长度: " + (question.getAnswer() != null ? question.getAnswer().length() : 0) + ", 分值: " + question.getScore());
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
                if (questions.size() < expectedQuestions * 0.5) { // 如果少于期望的50%
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
     * 当无法分割时，尝试将整个内容作为一道题目解析
     */
    private boolean parseAsOneQuestion(Exam exam, String content, int expectedQuestions) {
        try {
            System.out.println("尝试将整个内容作为一道题目解析");
            
            Question question = new Question();
            question.setExam(exam);
            
            // 智能推断题型
            String questionType = inferQuestionTypeFromContent(content);
            question.setType(questionType);
            System.out.println("推断题型为: " + questionType);
            
            // 提取题目内容 - 针对编程题进行特殊处理
            String questionContent = null;
            if (questionType.contains("programming") || questionType.contains("编程")) {
                // 对于编程题，提取从题目内容到正确答案之前的所有内容
                int answerStart = content.indexOf("**正确答案**");
                if (answerStart == -1) {
                    answerStart = content.indexOf("**参考答案**");
                }
                if (answerStart == -1) {
                    answerStart = content.indexOf("**答案**");
                }
                
                if (answerStart != -1) {
                    // 找到了答案标记，提取题目内容部分
                    String contentPart = content.substring(0, answerStart).trim();
                    
                    // 移除开头的题目标题（如"### 编程题（困难题）"）
                    String[] lines = contentPart.split("\n");
                    StringBuilder contentBuilder = new StringBuilder();
                    boolean contentStarted = false;
                    
                    for (String line : lines) {
                        String trimmedLine = line.trim();
                        
                        // 跳过题目标题行
                        if (trimmedLine.startsWith("###") || trimmedLine.startsWith("**题目内容**")) {
                            if (trimmedLine.startsWith("**题目内容**")) {
                                // 如果这行包含内容，提取冒号后的部分
                                int colonIndex = trimmedLine.indexOf("：");
                                if (colonIndex == -1) colonIndex = trimmedLine.indexOf(":");
                                if (colonIndex != -1 && colonIndex < trimmedLine.length() - 1) {
                                    String afterColon = trimmedLine.substring(colonIndex + 1).trim();
                                    if (!afterColon.isEmpty()) {
                                        contentBuilder.append(afterColon).append("\n");
                                        contentStarted = true;
                                    }
                                }
                            }
                            continue;
                        }
                        
                        // 收集题目内容
                        if (!trimmedLine.isEmpty()) {
                            if (contentBuilder.length() > 0) {
                                contentBuilder.append("\n");
                            }
                            contentBuilder.append(line); // 保持原始缩进
                            contentStarted = true;
                        } else if (contentStarted) {
                            contentBuilder.append("\n"); // 保持空行
                        }
                    }
                    
                    questionContent = contentBuilder.toString().trim();
                } else {
                    // 没有找到答案标记，使用前80%的内容作为题目
                    int cutPoint = (int)(content.length() * 0.8);
                    questionContent = content.substring(0, cutPoint).trim();
                }
            } else {
                // 非编程题使用原有逻辑
                questionContent = extractQuestionContentSmartly(content, questionType);
                if (questionContent == null || questionContent.trim().isEmpty()) {
                    // 如果没有找到标准格式，使用前半部分作为题目内容
                    String[] lines = content.split("\n");
                    StringBuilder contentBuilder = new StringBuilder();
                    int lineCount = 0;
                    for (String line : lines) {
                        if (lineCount > 10) break; // 最多取前10行作为题目内容
                        if (!line.trim().isEmpty() && !line.contains("答案") && !line.contains("解析")) {
                            contentBuilder.append(line).append("\n");
                            lineCount++;
                        }
                    }
                    questionContent = contentBuilder.toString().trim();
                }
            }
            
            if (questionContent == null || questionContent.trim().isEmpty()) {
                questionContent = "AI生成的题目内容解析失败，请查看原始内容。";
            }
            question.setContent(questionContent);
            
            // 提取答案
            String answer = extractAnswerSmartly(content, questionType);
            if (answer == null || answer.trim().isEmpty()) {
                answer = getDefaultAnswerForType(questionType);
            }
            question.setAnswer(answer);
            
            // 提取解析
            String explanation = extractContent(content, "**解析**：", "**");
            if (explanation == null) {
                explanation = extractContent(content, "解析：", "\n");
            }
            if (explanation == null) {
                explanation = "这道题目考查相关知识点的理解和应用能力。";
            }
            question.setExplanation(explanation);
            
            // 生成知识点
            String knowledgePoint = extractContent(content, "**知识点**：", "**");
            if (knowledgePoint != null && !knowledgePoint.trim().isEmpty()) {
                question.setKnowledgePoint(knowledgePoint.trim());
            } else {
                // 使用DeepSeek生成知识点
                String generatedKnowledgePoint = generateKnowledgePoint(questionContent, questionType);
                question.setKnowledgePoint(generatedKnowledgePoint);
            }
            
            // 设置分值
            int totalScore = exam.getTotalScore() != null ? exam.getTotalScore() : 100;
            question.setScore(totalScore); // 单题情况下使用全部分值
            
            // 处理选项（如果是选择题）
            if (questionType.contains("choice")) {
                List<String> options = extractOptionsSmartly(content, questionType);
                if (!options.isEmpty()) {
                    try {
                        question.setOptions(objectMapper.writeValueAsString(options));
                    } catch (Exception e) {
                        System.err.println("序列化选项失败: " + e.getMessage());
                    }
                }
            } else {
                question.setOptions("[]"); // 非选择题设置空选项
            }
            
            // 保存题目
            questionRepository.save(question);
            System.out.println("成功保存单题目解析结果: " + questionContent.substring(0, Math.min(50, questionContent.length())) + "...");
            
            return true;
            
        } catch (Exception e) {
            System.err.println("单题目解析失败: " + e.getMessage());
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
        return parseQuestionBlock(exam, block, questionIndex, null);
    }
    
    private Question parseQuestionBlock(Exam exam, String block, int questionIndex, List<String> questionTypeOrder) {
        try {
            Question question = new Question();
            question.setExam(exam);
            
            // 根据题目类型顺序分配题目类型
            String questionType;
            if (questionTypeOrder != null && !questionTypeOrder.isEmpty() && questionIndex <= questionTypeOrder.size()) {
                // 使用预设的题目类型顺序（questionIndex从1开始，所以要减1）
                String originalType = questionTypeOrder.get(questionIndex - 1);
                questionType = normalizeQuestionType(originalType);
                System.out.println("题目" + questionIndex + "使用预设类型: " + originalType + " -> " + questionType);
            } else {
                // 如果没有预设顺序，使用原来的推断逻辑
                questionType = extractQuestionType(block, questionIndex);
                System.out.println("题目" + questionIndex + "使用推断类型: " + questionType);
            }
            
            question.setType(questionType);
            
            // 智能提取题目内容（根据题型自适应）
            String content = extractQuestionContentSmartly(block, questionType);
            if (content != null && !content.trim().isEmpty()) {
                question.setContent(content.trim());
            } else {
                question.setContent("题目内容解析失败，请手动补充");
                System.out.println("题目" + questionIndex + "内容提取失败，使用默认内容: " + question.getContent());
            }
            
            // 智能提取选项（自动判断是否需要选项）
            List<String> options = extractOptionsSmartly(block, questionType);
            if (!options.isEmpty()) {
                question.setOptions(objectMapper.writeValueAsString(options));
            } else {
                question.setOptions(null);
            }
            
            // 智能提取答案（根据题型自适应）
            String answer = extractAnswerSmartly(block, questionType);
            if (answer != null && !answer.trim().isEmpty()) {
                question.setAnswer(answer.trim());
            } else {
                // 根据题型设置默认答案
                question.setAnswer(getDefaultAnswerForType(questionType));
                System.out.println("题目" + questionIndex + "答案提取失败，使用默认答案: " + question.getAnswer());
            }
            
            // 提取解析
            String explanation = extractContent(block, "**解析**：", "**");
            if (explanation != null) {
                question.setExplanation(explanation.trim());
            }
            
            // 提取知识点
            String knowledgePoint = extractContent(block, "**知识点**：", "**");
            if (knowledgePoint != null && !knowledgePoint.trim().isEmpty()) {
                question.setKnowledgePoint(knowledgePoint.trim());
            } else {
                // 如果没有显式提取到知识点，使用DeepSeek生成
                String generatedKnowledgePoint = generateKnowledgePoint(question.getContent(), questionType);
                question.setKnowledgePoint(generatedKnowledgePoint);
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
     * 标准化题型名称 - 统一映射到标准题型
     */
    private String normalizeQuestionType(String originalType) {
        if (originalType == null || originalType.trim().isEmpty()) {
            return "essay"; // 默认为解答题
        }
        
        String lowerType = originalType.toLowerCase().trim();
        
        // 统一映射到标准题型
        if (lowerType.contains("选择") || lowerType.contains("choice") || lowerType.contains("单选") || lowerType.contains("多选")) {
            return "choice";
        } else if (lowerType.contains("判断") || lowerType.contains("true") || lowerType.contains("false") || lowerType.contains("对错")) {
            return "true_false";
        } else if (lowerType.contains("填空") || lowerType.contains("fill") || lowerType.contains("blank")) {
            return "fill_blank";
        } else if (lowerType.contains("编程") || lowerType.contains("program") || lowerType.contains("代码") || lowerType.contains("code")) {
            return "programming";
        } else if (lowerType.contains("简答") || lowerType.contains("short")) {
            return "short_answer";
        } else if (lowerType.contains("计算") || lowerType.contains("calculation") || lowerType.contains("计算题")) {
            return "calculation";
        } else if (lowerType.contains("案例") || lowerType.contains("case") || lowerType.contains("分析")) {
            return "case_analysis";
        } else if (lowerType.contains("解答") || lowerType.contains("论述") || lowerType.contains("essay") || lowerType.contains("answer")) {
            return "essay";
        } else {
            // 如果无法识别，根据内容推断
            return "essay"; // 默认为解答题
        }
    }
    
    /**
     * 从题目内容推断题型 - 与标准化方法保持一致
     */
    private String inferQuestionTypeFromContent(String block) {
        String lowerBlock = block.toLowerCase();
        
        // 按优先级判断题型，使用标准题型名称
        // 优先检查选项格式来识别选择题
        if (lowerBlock.contains("**选项**") || lowerBlock.contains("选项：") ||
            (lowerBlock.contains("a.") && lowerBlock.contains("b.") && lowerBlock.contains("c.") && lowerBlock.contains("d."))) {
            return "choice";
        } else if (lowerBlock.contains("填空") || lowerBlock.contains("____") || lowerBlock.contains("___") ||
                   lowerBlock.contains("______")) {
            return "fill_blank";
        } else if (lowerBlock.contains("判断") || lowerBlock.contains("正确") || lowerBlock.contains("错误") ||
                   lowerBlock.contains("true") || lowerBlock.contains("false")) {
            return "true_false";
        } else if (lowerBlock.contains("编程") || lowerBlock.contains("程序") || lowerBlock.contains("代码") ||
                   lowerBlock.contains("```") || lowerBlock.contains("python") || lowerBlock.contains("java") ||
                   lowerBlock.contains("编写代码") || lowerBlock.contains("实现")) {
            return "programming";
        } else if (lowerBlock.contains("计算") || lowerBlock.contains("求解") || lowerBlock.contains("求")) {
            return "calculation";
        } else if (lowerBlock.contains("案例") || lowerBlock.contains("情景") || lowerBlock.contains("情况") ||
                   lowerBlock.contains("场景") || lowerBlock.contains("实例")) {
            return "case_analysis";
        } else if (lowerBlock.contains("简述") || lowerBlock.contains("简答")) {
            return "short_answer";
        } else if (lowerBlock.contains("论述") || lowerBlock.contains("分析") ||
                   lowerBlock.contains("解答") || lowerBlock.contains("说明") || lowerBlock.contains("阐述")) {
            return "essay";
        } else {
            return "essay"; // 默认为解答题
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
                // 编程题题目池
                {
                    "programming",
                    "请编写一个Python函数，实现LED灯的闪烁控制。要求：\n1. 函数名为control_led\n2. 接受参数：led_pin（GPIO引脚号）、blink_times（闪烁次数）、interval（间隔时间，秒）\n3. 使用RPi.GPIO库控制GPIO\n4. 实现LED的开关控制和延时",
                    "[]",
                    "```python\nimport RPi.GPIO as GPIO\nimport time\n\ndef control_led(led_pin, blink_times, interval):\n    \"\"\"\n    控制LED灯闪烁\n    \n    参数:\n    led_pin: GPIO引脚号\n    blink_times: 闪烁次数\n    interval: 间隔时间（秒）\n    \"\"\"\n    # 设置GPIO模式\n    GPIO.setmode(GPIO.BCM)\n    GPIO.setup(led_pin, GPIO.OUT)\n    \n    try:\n        for i in range(blink_times):\n            # 点亮LED\n            GPIO.output(led_pin, GPIO.HIGH)\n            time.sleep(interval)\n            \n            # 熄灭LED\n            GPIO.output(led_pin, GPIO.LOW)\n            time.sleep(interval)\n            \n    finally:\n        # 清理GPIO资源\n        GPIO.cleanup()\n\n# 使用示例\nif __name__ == \"__main__\":\n    control_led(18, 5, 0.5)  # GPIO18引脚，闪烁5次，间隔0.5秒\n```",
                    "这道题考查嵌入式Python编程中GPIO控制的基本概念。解答要点：\n1. 导入必要的库（RPi.GPIO和time）\n2. 正确设置GPIO模式和引脚配置\n3. 使用循环实现指定次数的闪烁\n4. 通过GPIO.HIGH和GPIO.LOW控制LED开关\n5. 使用time.sleep()实现延时\n6. 异常处理和资源清理（GPIO.cleanup()）\n7. 代码结构清晰，包含注释和使用示例"
                },
                {
                    "programming", 
                    "请编写一个C程序，实现简单的温度传感器数据读取和处理。要求：\n1. 定义结构体存储传感器数据（温度值、时间戳）\n2. 实现函数read_temperature()模拟读取温度\n3. 实现函数process_data()处理温度数据（转换单位、异常检测）\n4. 在main函数中演示使用",
                    "[]",
                    "```c\n#include <stdio.h>\n#include <stdlib.h>\n#include <time.h>\n\n// 定义传感器数据结构体\ntypedef struct {\n    float temperature;  // 温度值（摄氏度）\n    time_t timestamp;   // 时间戳\n    int status;         // 状态：0正常，1异常\n} SensorData;\n\n// 模拟读取温度数据\nSensorData read_temperature() {\n    SensorData data;\n    \n    // 模拟温度读取（实际应用中从硬件接口读取）\n    data.temperature = 20.0 + (rand() % 200) / 10.0;  // 20-40度范围\n    data.timestamp = time(NULL);\n    data.status = 0;\n    \n    return data;\n}\n\n// 处理温度数据\nvoid process_data(SensorData *data) {\n    // 异常检测\n    if (data->temperature < -40 || data->temperature > 85) {\n        data->status = 1;  // 标记为异常\n        printf(\"警告：温度异常 %.1f°C\\n\", data->temperature);\n    }\n    \n    // 温度单位转换（摄氏度转华氏度）\n    float fahrenheit = data->temperature * 9.0 / 5.0 + 32.0;\n    \n    printf(\"温度数据：%.1f°C / %.1f°F\\n\", data->temperature, fahrenheit);\n    printf(\"时间戳：%ld\\n\", data->timestamp);\n    printf(\"状态：%s\\n\", data->status == 0 ? \"正常\" : \"异常\");\n}\n\nint main() {\n    printf(\"温度传感器数据处理程序\\n\");\n    printf(\"========================\\n\");\n    \n    srand(time(NULL));  // 初始化随机数种子\n    \n    // 模拟读取和处理5次温度数据\n    for (int i = 0; i < 5; i++) {\n        printf(\"\\n第%d次读取：\\n\", i + 1);\n        \n        SensorData data = read_temperature();\n        process_data(&data);\n        \n        // 延时1秒\n        sleep(1);\n    }\n    \n    return 0;\n}\n```",
                    "这道题考查嵌入式C编程的基础知识。解答要点：\n1. 结构体定义：合理设计数据结构存储传感器信息\n2. 函数设计：模块化编程，功能分离\n3. 数据处理：温度单位转换、异常检测逻辑\n4. 内存管理：正确使用指针传递结构体\n5. 标准库使用：time.h获取时间戳，stdlib.h随机数生成\n6. 错误处理：温度范围检查和状态标记\n7. 代码规范：清晰的注释、合理的变量命名\n8. 实际应用考虑：模拟真实的传感器读取场景"
                },
                {
                    "programming",
                    "请编写一个嵌入式系统的任务调度器框架。要求：\n1. 定义任务结构体（任务ID、优先级、执行函数指针、状态）\n2. 实现任务队列管理（添加、删除、查找任务）\n3. 实现简单的优先级调度算法\n4. 提供任务执行和状态管理接口",
                    "[]", 
                    "```c\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\n#define MAX_TASKS 10\n#define TASK_READY 0\n#define TASK_RUNNING 1\n#define TASK_BLOCKED 2\n\n// 任务结构体定义\ntypedef struct {\n    int task_id;                    // 任务ID\n    int priority;                   // 优先级（数值越小优先级越高）\n    void (*task_func)(void);        // 任务执行函数指针\n    int status;                     // 任务状态\n    char name[32];                  // 任务名称\n} Task;\n\n// 任务调度器结构体\ntypedef struct {\n    Task tasks[MAX_TASKS];          // 任务数组\n    int task_count;                 // 当前任务数量\n    int current_task;               // 当前运行任务索引\n} Scheduler;\n\n// 全局调度器实例\nScheduler scheduler = {0};\n\n// 示例任务函数\nvoid led_task(void) {\n    printf(\"执行LED控制任务\\n\");\n}\n\nvoid sensor_task(void) {\n    printf(\"执行传感器读取任务\\n\");\n}\n\nvoid communication_task(void) {\n    printf(\"执行通信任务\\n\");\n}\n\n// 添加任务到调度器\nint add_task(int task_id, int priority, void (*func)(void), const char* name) {\n    if (scheduler.task_count >= MAX_TASKS) {\n        printf(\"错误：任务队列已满\\n\");\n        return -1;\n    }\n    \n    Task* task = &scheduler.tasks[scheduler.task_count];\n    task->task_id = task_id;\n    task->priority = priority;\n    task->task_func = func;\n    task->status = TASK_READY;\n    strncpy(task->name, name, sizeof(task->name) - 1);\n    \n    scheduler.task_count++;\n    printf(\"任务添加成功：%s (ID:%d, 优先级:%d)\\n\", name, task_id, priority);\n    return 0;\n}\n\n// 根据优先级查找下一个就绪任务\nint find_highest_priority_task(void) {\n    int highest_priority = 999;\n    int selected_task = -1;\n    \n    for (int i = 0; i < scheduler.task_count; i++) {\n        if (scheduler.tasks[i].status == TASK_READY && \n            scheduler.tasks[i].priority < highest_priority) {\n            highest_priority = scheduler.tasks[i].priority;\n            selected_task = i;\n        }\n    }\n    \n    return selected_task;\n}\n\n// 执行任务调度\nvoid schedule_tasks(void) {\n    printf(\"\\n=== 开始任务调度 ===\\n\");\n    \n    for (int cycle = 0; cycle < 3; cycle++) {\n        printf(\"\\n调度周期 %d:\\n\", cycle + 1);\n        \n        // 重置所有任务为就绪状态（模拟任务完成后重新就绪）\n        for (int i = 0; i < scheduler.task_count; i++) {\n            if (scheduler.tasks[i].status == TASK_RUNNING) {\n                scheduler.tasks[i].status = TASK_READY;\n            }\n        }\n        \n        // 查找最高优先级任务\n        int next_task = find_highest_priority_task();\n        if (next_task != -1) {\n            Task* task = &scheduler.tasks[next_task];\n            task->status = TASK_RUNNING;\n            \n            printf(\"运行任务：%s (优先级:%d)\\n\", task->name, task->priority);\n            \n            // 执行任务\n            if (task->task_func) {\n                task->task_func();\n            }\n            \n            scheduler.current_task = next_task;\n        } else {\n            printf(\"没有就绪任务\\n\");\n        }\n    }\n}\n\n// 显示任务状态\nvoid show_task_status(void) {\n    printf(\"\\n=== 任务状态列表 ===\\n\");\n    printf(\"ID\\t名称\\t\\t优先级\\t状态\\n\");\n    printf(\"----------------------------------\\n\");\n    \n    for (int i = 0; i < scheduler.task_count; i++) {\n        Task* task = &scheduler.tasks[i];\n        const char* status_str;\n        \n        switch (task->status) {\n            case TASK_READY: status_str = \"就绪\"; break;\n            case TASK_RUNNING: status_str = \"运行\"; break;\n            case TASK_BLOCKED: status_str = \"阻塞\"; break;\n            default: status_str = \"未知\"; break;\n        }\n        \n        printf(\"%d\\t%-12s\\t%d\\t%s\\n\", \n               task->task_id, task->name, task->priority, status_str);\n    }\n}\n\nint main() {\n    printf(\"嵌入式任务调度器演示\\n\");\n    printf(\"=====================\\n\");\n    \n    // 初始化调度器\n    scheduler.task_count = 0;\n    scheduler.current_task = -1;\n    \n    // 添加任务（优先级：1最高，数值越大优先级越低）\n    add_task(1, 1, led_task, \"LED控制\");\n    add_task(2, 3, sensor_task, \"传感器读取\");\n    add_task(3, 2, communication_task, \"通信处理\");\n    \n    // 显示初始任务状态\n    show_task_status();\n    \n    // 执行任务调度\n    schedule_tasks();\n    \n    // 显示最终任务状态\n    show_task_status();\n    \n    return 0;\n}\n```",
                    "这道编程题考查嵌入式系统任务调度的核心概念。解答要点：\n1. 数据结构设计：合理定义任务和调度器结构体\n2. 任务管理：实现任务的添加、查找、状态管理\n3. 调度算法：基于优先级的抢占式调度\n4. 函数指针：使用函数指针实现任务的动态调用\n5. 状态机：任务状态的正确转换和管理\n6. 内存管理：静态数组管理任务队列，避免动态分配\n7. 错误处理：任务队列满、无就绪任务等异常情况\n8. 实际应用：模拟真实嵌入式系统的任务调度场景\n9. 代码规范：清晰的模块划分和接口设计"
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
                            int foundIndex = -1;
                            
                            // 先精确匹配题型
                            for (int j = 0; j < questionPool.length; j++) {
                                if (questionPool[j][0].equals(questionType)) {
                                    // 检查是否已经使用过这道题
                                    boolean alreadyUsed = false;
                                    for (int k = 0; k < questions.size(); k++) {
                                        if (questions.get(k).getContent().equals(questionPool[j][1])) {
                                            alreadyUsed = true;
                                            break;
                                        }
                                    }
                                    
                                    if (!alreadyUsed) {
                                        foundIndex = j;
                                        break;
                                    }
                                }
                            }
                            
                            // 如果精确匹配失败，尝试模糊匹配
                            if (foundIndex == -1) {
                                for (int j = 0; j < questionPool.length; j++) {
                                    String poolType = questionPool[j][0];
                                    boolean typeMatch = false;
                                    
                                    // 编程题的多种匹配方式
                                    if ((questionType.contains("programming") || questionType.contains("编程") || questionType.contains("代码")) &&
                                        (poolType.contains("programming") || poolType.contains("编程"))) {
                                        typeMatch = true;
                                    }
                                    // 其他题型的模糊匹配
                                    else if (poolType.contains(questionType) || questionType.contains(poolType)) {
                                        typeMatch = true;
                                    }
                                    
                                    if (typeMatch) {
                                        // 检查是否已经使用过这道题
                                        boolean alreadyUsed = false;
                                        for (int k = 0; k < questions.size(); k++) {
                                            if (questions.get(k).getContent().equals(questionPool[j][1])) {
                                                alreadyUsed = true;
                                                break;
                                            }
                                        }
                                        
                                        if (!alreadyUsed) {
                                            foundIndex = j;
                                            break;
                                        }
                                    }
                                }
                            }
                            
                            if (foundIndex != -1) {
                                Question question = new Question();
                                question.setExam(exam);
                                question.setType(questionPool[foundIndex][0]);
                                question.setContent(questionPool[foundIndex][1]);
                                question.setOptions(questionPool[foundIndex][2]);
                                question.setAnswer(questionPool[foundIndex][3]);
                                question.setExplanation(questionPool[foundIndex][4]);
                                
                                // 分配分值（编程题分值通常较高）
                                int questionScore = averageScore;
                                if (questionType.contains("programming") || questionType.contains("编程")) {
                                    questionScore = Math.max(averageScore, 20); // 编程题至少20分
                                }
                                if (remainderScore > 0) {
                                    questionScore++;
                                    remainderScore--;
                                }
                                question.setScore(questionScore);
                                
                                questions.add(question);
                                System.out.println("成功匹配题目：" + questionType + " -> " + questionPool[foundIndex][0]);
                            } else {
                                // 如果找不到匹配的题目，创建一个通用题目
                                System.out.println("未找到匹配的" + questionType + "题目，创建通用题目");
                                Question question = createGenericQuestion(exam, questionType, averageScore);
                                if (remainderScore > 0) {
                                    question.setScore(question.getScore() + 1);
                                    remainderScore--;
                                }
                                questions.add(question);
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
            System.out.println("题型 " + questionType + " 不需要选项");
            return options; // 不需要选项的题型直接返回空列表
        }
        
        System.out.println("开始为题型 " + questionType + " 提取选项");
        System.out.println("题目块前500字符: " + block.substring(0, Math.min(500, block.length())));
        
        // 首先尝试查找选项区域
        boolean inOptionsSection = false;
        String[] lines = block.split("\n");
        
        for (int i = 0; i < lines.length; i++) {
            String line = lines[i].trim();
            
            // 检查是否进入选项区域
            if (line.contains("**选项**") || line.contains("选项：") || 
                line.equals("选项:") || line.startsWith("**选项")) {
                inOptionsSection = true;
                System.out.println("找到选项标记: " + line);
                continue;
            }
            
            // 检查是否离开选项区域
            if (inOptionsSection && (line.startsWith("**正确答案") || line.startsWith("**答案") || 
                line.startsWith("**解析") || line.startsWith("**分值"))) {
                System.out.println("选项区域结束: " + line);
                break;
            }
            
            // 如果在选项区域内，提取选项
            if (inOptionsSection && !line.isEmpty()) {
                // 匹配各种选项格式
                if (line.matches("^[A-Za-z][.）)].*") || line.matches("^[A-Za-z]\\s*[.）)].*")) {
                    // A. 选项内容 或 A) 选项内容 或 A） 选项内容
                    options.add(line);
                    System.out.println("提取选项: " + line);
                } else if (line.matches("^\\([A-Za-z]\\).*")) {
                    // (A) 选项内容
                    options.add(line);
                    System.out.println("提取选项: " + line);
                } else if (line.matches("^[①②③④⑤⑥⑦⑧⑨⑩].*")) {
                    // 圆圈数字格式
                    options.add(line);
                    System.out.println("提取选项: " + line);
                } else if (line.matches("^[1-9][0-9]*[.）)].*")) {
                    // 数字格式：1. 2. 3.
                    options.add(line);
                    System.out.println("提取选项: " + line);
                } else {
                    System.out.println("跳过非选项行: " + line);
                }
            }
        }
        
        // 如果没有找到选项区域，尝试全文搜索选项
        if (options.isEmpty()) {
            System.out.println("未找到选项区域，尝试全文搜索选项");
            for (String line : lines) {
                line = line.trim();
                if (line.matches("^[A-Za-z][.）)].*") || line.matches("^[A-Za-z]\\s*[.）)].*")) {
                    options.add(line);
                    System.out.println("全文搜索提取选项: " + line);
                }
            }
        }
        
        // 如果是判断题但没有找到选项，创建默认选项
        if (options.isEmpty() && (questionType.contains("判断") || questionType.contains("true_false"))) {
            options.add("A. 正确");
            options.add("B. 错误");
            System.out.println("为判断题创建默认选项");
        }
        
        System.out.println("题型 " + questionType + " 最终提取到 " + options.size() + " 个选项: " + options);
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
        
        System.out.println("开始提取编程题答案，内容长度: " + block.length());
        
        // 1. 先尝试从正确答案标记提取完整答案
        answer = extractGeneralAnswer(block);
        System.out.println("通用答案提取结果长度: " + (answer != null ? answer.length() : 0));
        
        if (answer != null && !answer.trim().isEmpty()) {
            // 对于编程题，答案通常很长，如果长度合理就直接返回
            if (answer.length() > 30) {
                System.out.println("编程题答案长度合理，直接返回");
                return cleanupAnswer(answer);
            }
        }
        
        // 2. 尝试提取更长的内容（从答案开始到文档结尾）
        int answerStart = -1;
        String[] answerMarkers = {
            "**正确答案**：", "**参考答案**：", "**答案**：", 
            "**示例代码**：", "**参考代码**：", "**实现代码**："
        };
        
        for (String marker : answerMarkers) {
            answerStart = block.indexOf(marker);
            if (answerStart != -1) {
                answerStart += marker.length();
                System.out.println("找到答案标记: " + marker);
                break;
            }
        }
        
        if (answerStart != -1) {
            // 查找下一个主要标记作为答案结束位置
            String[] endMarkers = {"**解析**：", "**分值建议**：", "**评分标准**："};
            int answerEnd = block.length();
            
            for (String endMarker : endMarkers) {
                int endPos = block.indexOf(endMarker, answerStart);
                if (endPos != -1 && endPos < answerEnd) {
                    answerEnd = endPos;
                    System.out.println("找到答案结束标记: " + endMarker);
                    break;
                }
            }
            
            if (answerEnd > answerStart) {
                answer = block.substring(answerStart, answerEnd).trim();
                System.out.println("提取到的答案长度: " + answer.length());
                
                if (answer.length() > 10) {
                    return cleanupAnswer(answer);
                }
            }
        }
        
        // 3. 尝试提取代码块
        int codeStart = block.indexOf("```");
        if (codeStart != -1) {
            int codeEnd = block.indexOf("```", codeStart + 3);
            if (codeEnd != -1) {
                String code = block.substring(codeStart, codeEnd + 3).trim();
                System.out.println("找到代码块，长度: " + code.length());
                
                // 检查代码块前后是否有说明文字
                String beforeCode = "";
                String afterCode = "";
                
                // 提取代码块前的说明
                if (codeStart > 0) {
                    String before = block.substring(0, codeStart).trim();
                    if (before.length() > 0) {
                        // 取最后几行作为代码说明
                        String[] lines = before.split("\n");
                        if (lines.length > 0) {
                            String lastLine = lines[lines.length - 1].trim();
                            if (lastLine.length() > 5 && !lastLine.startsWith("**")) {
                                beforeCode = lastLine + "\n\n";
                            }
                        }
                    }
                }
                
                // 提取代码块后的说明
                if (codeEnd + 3 < block.length()) {
                    String after = block.substring(codeEnd + 3).trim();
                    if (after.length() > 0 && !after.startsWith("**")) {
                        // 取前几行作为代码说明
                        String[] lines = after.split("\n");
                        StringBuilder afterBuilder = new StringBuilder();
                        for (int i = 0; i < Math.min(3, lines.length); i++) {
                            String line = lines[i].trim();
                            if (line.length() > 0 && !line.startsWith("**")) {
                                afterBuilder.append(line).append("\n");
                            } else {
                                break;
                            }
                        }
                        if (afterBuilder.length() > 0) {
                            afterCode = "\n\n" + afterBuilder.toString().trim();
                        }
                    }
                }
                
                return beforeCode + code + afterCode;
            }
        }
        
        // 4. 如果没有找到标准格式，尝试智能提取
        if (answer == null || answer.trim().isEmpty()) {
            System.out.println("尝试智能提取编程题答案");
            
            // 查找包含关键词的段落
            String[] lines = block.split("\n");
            StringBuilder answerBuilder = new StringBuilder();
            boolean inAnswerSection = false;
            
            for (String line : lines) {
                String trimmedLine = line.trim();
                
                // 检查是否进入答案区域
                if (trimmedLine.contains("答案") || trimmedLine.contains("代码") || 
                    trimmedLine.contains("实现") || trimmedLine.contains("解决方案")) {
                    inAnswerSection = true;
                    if (!trimmedLine.startsWith("**题目") && !trimmedLine.startsWith("**选项")) {
                        answerBuilder.append(line).append("\n");
                    }
                    continue;
                }
                
                // 检查是否离开答案区域
                if (inAnswerSection && (trimmedLine.startsWith("**解析") || 
                    trimmedLine.startsWith("**分值") || trimmedLine.startsWith("**评分"))) {
                    break;
                }
                
                // 如果在答案区域内，收集内容
                if (inAnswerSection && trimmedLine.length() > 0) {
                    answerBuilder.append(line).append("\n");
                }
            }
            
            if (answerBuilder.length() > 10) {
                answer = answerBuilder.toString().trim();
                System.out.println("智能提取的答案长度: " + answer.length());
            }
        }
        
        // 5. 最后的备用方案
        if (answer == null || answer.trim().isEmpty()) {
            System.out.println("使用编程题默认答案");
            answer = "请根据题目要求编写相应的代码实现。\n\n参考实现思路：\n1. 分析题目要求\n2. 设计算法逻辑\n3. 编写代码实现\n4. 测试验证结果";
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
            int answerStart = block.indexOf(pattern);
            if (answerStart != -1) {
                answerStart += pattern.length();
                
                // 查找答案结束位置的多种标记
                String[] endMarkers = {"**解析**：", "**分值建议**：", "**评分标准**：", "**难度**："};
                int answerEnd = block.length(); // 默认到文档结尾
                
                // 找到最近的结束标记
                for (String endMarker : endMarkers) {
                    int endPos = block.indexOf(endMarker, answerStart);
                    if (endPos != -1 && endPos < answerEnd) {
                        answerEnd = endPos;
                    }
                }
                
                if (answerEnd > answerStart) {
                    String answer = block.substring(answerStart, answerEnd).trim();
                    if (!answer.isEmpty()) {
                        System.out.println("提取到答案，长度: " + answer.length() + " 字符");
                        System.out.println("答案前100字符: " + answer.substring(0, Math.min(100, answer.length())));
                        return answer;
                    }
                }
            }
        }
        
        // 如果标准格式提取失败，尝试智能提取
        System.out.println("标准格式提取失败，尝试智能提取答案");
        return extractAnswerIntelligently(block);
    }
    
    /**
     * 智能提取答案（当标准格式失败时使用）
     */
    private String extractAnswerIntelligently(String block) {
        String[] lines = block.split("\n");
        StringBuilder answerBuilder = new StringBuilder();
        boolean inAnswerSection = false;
        boolean foundAnswerStart = false;
        
        for (int i = 0; i < lines.length; i++) {
            String line = lines[i].trim();
            
            // 检查是否进入答案区域
            if (!foundAnswerStart && (line.contains("答案") || line.contains("解答") || 
                line.contains("参考") || line.startsWith("1.") || line.startsWith("（1）"))) {
                inAnswerSection = true;
                foundAnswerStart = true;
                
                // 如果这行本身就包含答案内容，加入答案
                if (!line.startsWith("**") && line.length() > 3) {
                    answerBuilder.append(line).append("\n");
                }
                continue;
            }
            
            // 检查是否离开答案区域
            if (inAnswerSection && (line.startsWith("**解析") || line.startsWith("**分值") || 
                line.startsWith("**评分") || line.startsWith("**难度"))) {
                break;
            }
            
            // 如果在答案区域内，收集内容
            if (inAnswerSection && !line.isEmpty() && !line.startsWith("**")) {
                answerBuilder.append(line).append("\n");
            }
        }
        
        String result = answerBuilder.toString().trim();
        if (!result.isEmpty()) {
            System.out.println("智能提取到答案，长度: " + result.length() + " 字符");
            return result;
        }
        
        System.out.println("智能提取也失败，返回null");
        return null;
    }
    
    /**
     * 根据题型获取默认答案
     */
    
    /**
     * 为题目生成知识点标记
     */
    private String generateKnowledgePoint(String questionContent, String questionType) {
        try {
            // 调用DeepSeek生成知识点
            String knowledgePoint = deepSeekService.generateKnowledgePoint(questionContent, questionType);
            return knowledgePoint != null && !knowledgePoint.trim().isEmpty() ? knowledgePoint.trim() : "未分类";
        } catch (Exception e) {
            System.err.println("生成知识点失败: " + e.getMessage());
            return "未分类";
        }
    }
    
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
    
    /**
     * 获取教师的试卷列表
     */
    public List<ExamListDTO> getExamListByTeacher(Long teacherId, String status, String search) {
        try {
            // 根据教师ID查找考试
            List<Exam> exams = examRepository.findByTeacherId(teacherId);
            
            // 按创建时间倒序排列
            exams = exams.stream()
                    .sorted((e1, e2) -> e2.getCreatedAt().compareTo(e1.getCreatedAt()))
                    .collect(Collectors.toList());
            
            // 转换为DTO并设置参与人数
            List<ExamListDTO> examListDTOs = exams.stream()
                    .map(exam -> {
                        ExamListDTO dto = new ExamListDTO(exam);
                        
                        // 设置参与人数
                        long participantCount = examResultRepository.countByExam(exam);
                        dto.setParticipantCount(participantCount);
                        
                        return dto;
                    })
                    .collect(Collectors.toList());
            
            // 应用状态筛选
            if (status != null && !status.trim().isEmpty()) {
                examListDTOs = examListDTOs.stream()
                        .filter(exam -> status.equals(exam.getStatus()))
                        .collect(Collectors.toList());
            }
            
            // 应用搜索筛选
            if (search != null && !search.trim().isEmpty()) {
                String searchLower = search.toLowerCase();
                examListDTOs = examListDTOs.stream()
                        .filter(exam -> 
                            (exam.getTitle() != null && exam.getTitle().toLowerCase().contains(searchLower)) ||
                            (exam.getCourseName() != null && exam.getCourseName().toLowerCase().contains(searchLower)) ||
                            (exam.getExamType() != null && exam.getExamType().toLowerCase().contains(searchLower))
                        )
                        .collect(Collectors.toList());
            }
            
            return examListDTOs;
            
        } catch (Exception e) {
            throw new RuntimeException("获取试卷列表失败：" + e.getMessage(), e);
        }
    }
    
    /**
     * 删除试卷
     */
    public void deleteExam(Long examId) {
        try {
            Exam exam = examRepository.findById(examId)
                    .orElseThrow(() -> new RuntimeException("试卷不存在"));
            
            // 检查是否有学生已经参与考试
            long participantCount = examResultRepository.countByExam(exam);
            if (participantCount > 0) {
                throw new RuntimeException("该试卷已有学生参与，无法删除");
            }
            
            // 删除相关的题目
            List<Question> questions = questionRepository.findByExamId(examId);
            if (!questions.isEmpty()) {
                questionRepository.deleteAll(questions);
            }
            
            // 删除试卷
            examRepository.delete(exam);
            
        } catch (Exception e) {
            throw new RuntimeException("删除试卷失败：" + e.getMessage(), e);
        }
    }
    
    /**
     * 获取教师的考试统计数据
     */
    public Map<String, Object> getExamStatsByTeacher(Long teacherId) {
        try {
            Map<String, Object> stats = new java.util.HashMap<>();
            
            // 获取教师的所有课程
            List<Course> courses = courseRepository.findByTeacherId(teacherId);
            List<Long> courseIds = courses.stream().map(Course::getId).collect(Collectors.toList());
            
            if (courseIds.isEmpty()) {
                // 如果教师没有课程，返回全为0的统计
                stats.put("draftExamCount", 0);
                stats.put("ongoingExamCount", 0);
                stats.put("pendingGradeCount", 0);
                stats.put("monthlyExamCount", 0);
                return stats;
            }
            
            // 获取所有考试
            List<Exam> allExams = new ArrayList<>();
            for (Long courseId : courseIds) {
                allExams.addAll(examRepository.findByCourseIdOrderByCreatedAtDesc(courseId));
            }
            
            // 1. 待发布试卷数（草稿状态）
            long draftExamCount = allExams.stream()
                .filter(exam -> exam.getIsPublished() == null || !exam.getIsPublished())
                .count();
            stats.put("draftExamCount", draftExamCount);
            
            // 2. 进行中考试数（已发布且正在进行中）
            LocalDateTime now = LocalDateTime.now();
            long ongoingExamCount = allExams.stream()
                .filter(exam -> exam.getIsPublished() != null && exam.getIsPublished())
                .filter(exam -> {
                    // 判断考试是否正在进行中
                    LocalDateTime startTime = exam.getStartTime();
                    LocalDateTime endTime = exam.getEndTime();
                    
                    // 如果设置了具体的考试时间，按时间判断
                    if (startTime != null && endTime != null) {
                        return now.isAfter(startTime) && now.isBefore(endTime);
                    } else if (startTime != null) {
                        // 只设置了开始时间，检查是否已开始
                        return now.isAfter(startTime);
                    } else if (endTime != null) {
                        // 只设置了结束时间，检查是否未结束
                        return now.isBefore(endTime);
                    }
                    
                    // 如果没有设置具体时间，则认为是随时可考的考试
                    // 这种情况下，只要已发布且没有学生参与，或有学生正在考试中，就算进行中
                    long totalParticipants = examResultRepository.countByExam(exam);
                    if (totalParticipants == 0) {
                        return true; // 已发布但还没有人参与，算作进行中
                    }
                    
                    // 检查是否还有学生在考试中（已开始但未提交）
                    List<ExamResult> allResults = examResultRepository.findByExam(exam);
                    boolean hasUnsubmittedResults = allResults.stream()
                        .anyMatch(result -> result.getSubmitTime() == null);
                    
                    return hasUnsubmittedResults; // 有未提交的答卷，说明还在进行中
                })
                .count();
            stats.put("ongoingExamCount", ongoingExamCount);
            
            // 3. 已结束考试数
            long finishedExamCount = allExams.stream()
                .filter(exam -> exam.getIsPublished() != null && exam.getIsPublished())
                .filter(exam -> {
                    // 判断考试是否已结束：有学生提交答案的考试视为已结束
                    long submissionCount = examResultRepository.countByExam(exam);
                    return submissionCount > 0;
                })
                .count();
            stats.put("pendingGradeCount", finishedExamCount);
            
            // 4. 本月考试数
            java.time.LocalDateTime startOfMonth = java.time.LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
            java.time.LocalDateTime endOfMonth = startOfMonth.plusMonths(1).minusSeconds(1);
            
            long monthlyExamCount = allExams.stream()
                .filter(exam -> exam.getCreatedAt() != null)
                .filter(exam -> {
                    java.time.LocalDateTime createdAt = exam.getCreatedAt();
                    return createdAt.isAfter(startOfMonth) && createdAt.isBefore(endOfMonth);
                })
                .count();
            stats.put("monthlyExamCount", monthlyExamCount);
            
            System.out.println("考试统计数据: " + stats);
            return stats;
            
        } catch (Exception e) {
            System.err.println("获取考试统计数据失败: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("获取考试统计数据失败：" + e.getMessage());
        }
    }
    
    /**
     * 创建通用题目（当题目池中没有匹配的题型时）
     */
    private Question createGenericQuestion(Exam exam, String questionType, int baseScore) {
        Question question = new Question();
        question.setExam(exam);
        question.setType(questionType);
        question.setScore(baseScore);
        
        // 根据题型创建不同的通用题目
        if (questionType.contains("programming") || questionType.contains("编程") || questionType.contains("代码")) {
            question.setContent("请根据课程内容编写一个程序，实现相关功能。要求：\n1. 代码结构清晰，注释完整\n2. 实现指定的功能需求\n3. 考虑异常处理和边界条件\n4. 提供使用示例或测试用例");
            question.setOptions("[]");
            question.setAnswer("```\n// 请在此处编写您的代码实现\n// 根据具体题目要求完成相应功能\n\n// 示例框架：\nfunction main() {\n    // 主要逻辑实现\n    console.log('程序执行完成');\n}\n\nmain();\n```\n\n评分要点：\n1. 代码语法正确性（30%）\n2. 功能实现完整性（40%）\n3. 代码规范和注释（20%）\n4. 异常处理和优化（10%）");
            question.setExplanation("这是一道编程实践题，主要考查学生的编程能力和问题解决能力。需要根据具体的课程内容和知识点来完成相应的编程任务。");
            question.setScore(Math.max(baseScore, 25)); // 编程题分值较高
        } else if (questionType.contains("case") || questionType.contains("案例") || questionType.contains("分析")) {
            question.setContent("请分析以下案例，并回答相关问题：\n\n[案例背景]\n根据课程学习内容，结合实际应用场景，分析相关技术方案的优缺点，并提出改进建议。\n\n请从以下几个方面进行分析：\n1. 技术方案的合理性\n2. 存在的问题和不足\n3. 改进方案和建议\n4. 实际应用价值");
            question.setOptions("[]");
            question.setAnswer("参考分析要点：\n\n1. 技术方案分析：\n   - 方案的技术可行性\n   - 实现复杂度评估\n   - 性能和效率考虑\n\n2. 问题识别：\n   - 潜在的技术风险\n   - 实施中可能遇到的困难\n   - 资源和成本考虑\n\n3. 改进建议：\n   - 技术优化方案\n   - 实施策略建议\n   - 风险控制措施\n\n4. 应用价值：\n   - 实际应用场景\n   - 预期效果评估\n   - 推广可能性分析");
            question.setExplanation("案例分析题主要考查学生的综合分析能力、批判性思维和实际应用能力。需要结合理论知识对实际问题进行深入分析。");
            question.setScore(Math.max(baseScore, 20)); // 案例分析题分值较高
        } else if (questionType.contains("fill") || questionType.contains("填空")) {
            question.setContent("请在下列空白处填入正确的内容：\n\n根据课程学习内容，______是______的重要概念，它的主要作用是______。在实际应用中，我们通常通过______方法来实现______功能。");
            question.setOptions("[]");
            question.setAnswer("（答案根据具体课程内容填写）\n参考答案格式：\n1. 第一空：核心概念名称\n2. 第二空：所属领域或分类\n3. 第三空：主要功能描述\n4. 第四空：实现方法\n5. 第五空：目标功能");
            question.setExplanation("填空题主要考查学生对基础概念和关键知识点的掌握程度。");
        } else if (questionType.contains("true") || questionType.contains("false") || questionType.contains("判断")) {
            question.setContent("请判断以下说法是否正确：\n\n根据课程学习内容，相关技术概念的描述和应用场景是准确的。");
            question.setOptions("[\"正确\", \"错误\"]");
            question.setAnswer("A");
            question.setExplanation("判断题主要考查学生对基本概念的理解和判断能力。需要根据具体的课程内容来设定正确的判断标准。");
        } else if (questionType.contains("choice") || questionType.contains("选择")) {
            question.setContent("根据课程学习内容，以下哪个选项是正确的？");
            question.setOptions("[\"选项A：相关概念描述\", \"选项B：相关概念描述\", \"选项C：相关概念描述\", \"选项D：相关概念描述\"]");
            question.setAnswer("A");
            question.setExplanation("选择题主要考查学生对知识点的理解和应用能力。需要根据具体的课程内容来设定选项和正确答案。");
        } else {
            // 默认创建综合题
            question.setContent("请结合课程学习内容，回答以下问题：\n\n根据所学知识，请详细阐述相关概念的定义、特点、应用场景，并举例说明其在实际中的应用价值。");
            question.setOptions("[]");
            question.setAnswer("参考答案要点：\n\n1. 概念定义：\n   - 准确描述核心概念\n   - 说明概念的内涵和外延\n\n2. 主要特点：\n   - 列举关键特征\n   - 分析特点的意义\n\n3. 应用场景：\n   - 描述典型应用环境\n   - 分析适用条件\n\n4. 实际应用：\n   - 提供具体应用实例\n   - 分析应用效果和价值");
            question.setExplanation("综合题主要考查学生的综合运用能力和知识整合能力。");
        }
        
        return question;
    }
}