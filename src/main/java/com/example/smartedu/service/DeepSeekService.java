package com.example.smartedu.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DeepSeekService {
    
    @Value("${deepseek.api.url}")
    private String apiUrl;
    
    @Value("${deepseek.api.key}")
    private String apiKey;
    
    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    
    public DeepSeekService() {
        this.webClient = WebClient.builder()
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
        this.objectMapper = new ObjectMapper();
    }
    
    /**
     * 生成教学大纲
     */
    public String generateTeachingOutline(String courseName, String materialContent) {
        String prompt = String.format(
            "请根据以下课程资料为《%s》课程生成详细的教学大纲，包括：\n" +
            "1. 教学目的\n" +
            "2. 教学思路\n" +
            "3. 教学重点\n" +
            "4. 教学难点\n" +
            "5. 思政设计\n" +
            "6. 教学设计（以表格形式呈现，包含教学内容、教学手段、时间分配）\n\n" +
            "课程资料内容：\n%s",
            courseName, materialContent
        );
        
        return callDeepSeekAPI(prompt);
    }
    
    /**
     * 基于选中资料和教学要求生成教学大纲
     */
    public String generateTeachingOutlineWithRequirements(String courseName, String materialContent, String requirements) {
        String prompt = String.format(
            "请根据以下课程资料为《%s》课程生成详细的教学大纲，包括：\n" +
            "1. 教学目标\n" +
            "2. 教学思路\n" +
            "3. 教学重点\n" +
            "4. 教学难点\n" +
            "5. 思政融入点\n" +
            "6. 教学设计（详细的教学步骤和内容安排）\n" +
            "7. 教学方法与手段\n" +
            "8. 课程考核方式\n\n" +
            "%s" +
            "课程资料内容：\n%s",
            courseName, 
            (requirements != null && !requirements.trim().isEmpty()) ? 
                ("特殊教学要求：\n" + requirements + "\n\n") : "",
            materialContent
        );
        
        return callDeepSeekAPI(prompt);
    }
    
    /**
     * 基于选中资料、教学要求和学时生成教学大纲
     */
    public String generateTeachingOutlineWithHours(String courseName, String materialContent, String requirements, Integer hours) {
        int totalMinutes = hours * 45; // 1学时 = 45分钟
        
        String prompt = String.format(
            "请根据以下课程资料为《%s》课程生成详细的教学大纲。课程总学时为%d学时（共%d分钟），请按照此时间安排进行设计。\n\n" +
            "**重要要求：**\n" +
            "1. 请首先根据提供的知识库内容，凝练出本次教学的主要内容，并将教学大纲的主题设定为：《%s》[根据知识库内容凝练的主要内容]\n" +
            "   例如：《Python程序设计》面向对象编程与异常处理、《数据结构》栈与队列的实现与应用等\n\n" +
            "2. 教学大纲要求包括：\n" +
            "   - 教学目标\n" +
            "   - 教学思路\n" +
            "   - 教学重点\n" +
            "   - 教学难点\n" +
            "   - 思政融入点\n" +
            "   - 教学设计（**必须以表格形式呈现**，包含教学内容、教学手段、时间分配三列，时间分配必须精确到分钟，总时间必须等于%d分钟）\n\n" +
            "3. 教学设计表格格式示例：\n" +
            "| 教学内容 | 教学手段 | 时间分配（分钟） |\n" +
            "|---------|---------|----------------|\n" +
            "| 课程导入与知识回顾 | PPT讲解、提问互动 | 10分钟 |\n" +
            "| 新知识点讲解 | 理论讲授、案例分析 | 25分钟 |\n" +
            "| 课堂练习 | 实践操作、小组讨论 | 8分钟 |\n" +
            "| 总结与布置作业 | 知识梳理、作业说明 | 2分钟 |\n\n" +
            "%s" +
            "课程资料内容：\n%s\n\n" +
            "注意：\n" +
            "- 时间分配必须精确到分钟，各环节时间总和必须等于%d分钟！\n" +
            "- 教学大纲标题必须体现从知识库中凝练出的具体教学内容，而不是简单的课程名！",
            courseName, 
            hours,
            totalMinutes,
            courseName,
            totalMinutes,
            (requirements != null && !requirements.trim().isEmpty()) ? 
                ("特殊教学要求：\n" + requirements + "\n\n") : "",
            materialContent,
            totalMinutes
        );
        
        return callDeepSeekAPI(prompt);
    }
    
    /**
     * 基于RAG搜索结果生成教学大纲
     */
    public String generateTeachingOutlineWithRAG(String courseName, String ragContent, String requirements, Integer hours, int matchCount) {
        int totalMinutes = hours * 45; // 1学时 = 45分钟
        
        String prompt = String.format(
            "**基于知识库检索结果生成教学大纲**\n\n" +
            "课程名称：《%s》\n" +
            "教学学时：%d学时（共%d分钟）\n" +
            "检索到相关知识块：%d个\n\n" +
            "**RAG技术说明：**\n" +
            "以下内容是通过向量相似性搜索从课程知识库中检索到的最相关内容，请基于这些内容生成教学大纲。\n\n" +
            "**重要要求：**\n\n" +
            "1. **标题设计要求：**\n" +
            "   - 请根据检索到的知识内容，智能分析其核心主题\n" +
            "   - 将教学大纲标题设定为：《%s》[基于检索内容的核心主题]\n" +
            "   - 例如：《Python程序设计》面向对象编程与异常处理、《数据结构》栈与队列实现、《计算机网络》TCP/IP协议原理等\n" +
            "   - 标题必须体现具体的教学内容主题，而非泛泛的课程名称\n\n" +
            "2. **输出格式要求（重要）：**\n" +
            "   - **必须使用HTML表格格式**\n" +
            "   - **不要使用Markdown表格格式**\n" +
            "   - 表格必须包含完整的HTML标签\n" +
            "   - 表格样式要清晰美观\n\n" +
            "3. **教学大纲结构要求：**\n" +
            "   - **教学目标**：基于检索内容制定具体、可衡量的学习目标\n" +
            "   - **教学思路**：体现基于知识库内容的教学逻辑和方法\n" +
            "   - **教学重点**：从检索内容中提炼关键知识点\n" +
            "   - **教学难点**：识别学生理解的潜在困难点\n" +
            "   - **思政融入点**：结合专业内容的价值观教育\n" +
            "   - **教学设计**：详细的时间安排和教学活动（必须用表格呈现）\n\n" +
            "4. **教学设计表格要求（核心）：**\n" +
            "   - 必须使用以下HTML表格格式\n" +
            "   - 包含：教学内容、教学手段、时间分配（分钟）三列\n" +
            "   - 时间分配必须精确到分钟，总计必须等于%d分钟\n" +
            "   - 内容安排要与检索到的知识内容高度相关\n\n" +
            "**教学设计表格格式（必须严格遵循）：**\n" +
            "<table border='1' style='border-collapse: collapse; width: 100%%;'>\n" +
            "  <tr style='background-color: #f0f8ff;'>\n" +
            "    <th style='padding: 10px; text-align: center; border: 1px solid #ddd;'>教学内容</th>\n" +
            "    <th style='padding: 10px; text-align: center; border: 1px solid #ddd;'>教学手段</th>\n" +
            "    <th style='padding: 10px; text-align: center; border: 1px solid #ddd;'>时间分配（分钟）</th>\n" +
            "  </tr>\n" +
            "  <tr>\n" +
            "    <td style='padding: 8px; border: 1px solid #ddd;'>课程导入与回顾</td>\n" +
            "    <td style='padding: 8px; border: 1px solid #ddd;'>提问互动、知识回顾</td>\n" +
            "    <td style='padding: 8px; text-align: center; border: 1px solid #ddd;'>5</td>\n" +
            "  </tr>\n" +
            "  <tr>\n" +
            "    <td style='padding: 8px; border: 1px solid #ddd;'>核心概念讲解</td>\n" +
            "    <td style='padding: 8px; border: 1px solid #ddd;'>理论讲授、实例分析</td>\n" +
            "    <td style='padding: 8px; text-align: center; border: 1px solid #ddd;'>20</td>\n" +
            "  </tr>\n" +
            "  <tr>\n" +
            "    <td style='padding: 8px; border: 1px solid #ddd;'>实践操作</td>\n" +
            "    <td style='padding: 8px; border: 1px solid #ddd;'>动手实验、案例演示</td>\n" +
            "    <td style='padding: 8px; text-align: center; border: 1px solid #ddd;'>15</td>\n" +
            "  </tr>\n" +
            "  <tr>\n" +
            "    <td style='padding: 8px; border: 1px solid #ddd;'>总结提升</td>\n" +
            "    <td style='padding: 8px; border: 1px solid #ddd;'>知识梳理、作业布置</td>\n" +
            "    <td style='padding: 8px; text-align: center; border: 1px solid #ddd;'>5</td>\n" +
            "  </tr>\n" +
            "</table>\n\n" +
            "%s" +
            "**从知识库检索到的相关内容：**\n" +
            "%s\n\n" +
            "**特别注意：**\n" +
            "- 教学大纲内容必须与检索到的知识内容紧密结合\n" +
            "- 时间分配总和必须精确等于%d分钟\n" +
            "- 教学活动设计要体现对检索内容的深度利用\n" +
            "- 确保教学逻辑清晰，知识点覆盖全面\n" +
            "- **必须使用HTML表格格式，不要使用Markdown或其他格式**\n" +
            "- 表格要包含完整的样式，确保在网页中显示美观",
            courseName,
            hours,
            totalMinutes,
            matchCount,
            courseName,
            totalMinutes,
            (requirements != null && !requirements.trim().isEmpty()) ? 
                ("**特殊教学要求：**\n" + requirements + "\n\n") : "",
            ragContent,
            totalMinutes
        );
        
        System.out.println("生成RAG教学大纲的Prompt长度: " + prompt.length());
        System.out.println("使用的知识块数量: " + matchCount);
        
        return callDeepSeekAPI(prompt);
    }
    
    /**
     * 生成考试题目
     */
    public String generateExamQuestions(String courseName, String chapter, List<String> questionTypes, String materialContent) {
        String typesStr = String.join("、", questionTypes);
        String prompt = String.format(
            "请根据以下课程资料为《%s》课程的《%s》章节生成考试题目，题目类型包括：%s。\n" +
            "请为每道题目提供：\n" +
            "1. 题目内容\n" +
            "2. 选项（如果是选择题）\n" +
            "3. 正确答案\n" +
            "4. 详细解析\n" +
            "5. 分值建议\n\n" +
            "课程资料内容：\n%s",
            courseName, chapter, typesStr, materialContent
        );
        
        return callDeepSeekAPI(prompt);
    }
    
    /**
     * 根据用户详细设置生成考试题目
     */
    public String generateExamQuestionsWithSettings(String courseName, String chapter, 
            Map<String, Object> questionTypes, Map<String, Object> difficulty, 
            int totalScore, int duration, String materialContent, String specialRequirements) {
        
        // 构建题型要求字符串
        StringBuilder typesRequirement = new StringBuilder();
        int totalQuestions = 0;
        
        if (questionTypes != null) {
            for (Map.Entry<String, Object> entry : questionTypes.entrySet()) {
                String type = entry.getKey();
                Object value = entry.getValue();
                
                if ("custom".equals(type) && value instanceof Map) {
                    // 处理自定义题型
                    @SuppressWarnings("unchecked")
                    Map<String, Object> customType = (Map<String, Object>) value;
                    
                    // 安全地获取count，处理可能的类型转换问题
                    Integer count = null;
                    Object countObj = customType.get("count");
                    if (countObj instanceof Number) {
                        count = ((Number) countObj).intValue();
                    }
                    
                    String requirement = (String) customType.get("requirement");
                    
                    if (count != null && count > 0 && requirement != null && !requirement.trim().isEmpty()) {
                        typesRequirement.append(String.format("- %s：%d题\n", requirement, count));
                        totalQuestions += count;
                    }
                } else {
                    // 处理标准题型，安全地进行类型转换
                    Integer count = null;
                    if (value instanceof Number) {
                        count = ((Number) value).intValue();
                    }
                    
                    if (count != null && count > 0) {
                        String typeNameCn = getQuestionTypeName(type);
                        typesRequirement.append(String.format("- %s：%d题\n", typeNameCn, count));
                        totalQuestions += count;
                    }
                }
            }
        }
        
        // 构建难度要求字符串
        StringBuilder difficultyRequirement = new StringBuilder();
        if (difficulty != null) {
            // 安全地获取难度配置，处理可能的类型转换问题
            Integer easy = null;
            Object easyObj = difficulty.get("easy");
            if (easyObj instanceof Number) {
                easy = ((Number) easyObj).intValue();
            }
            
            Integer medium = null;
            Object mediumObj = difficulty.get("medium");
            if (mediumObj instanceof Number) {
                medium = ((Number) mediumObj).intValue();
            }
            
            Integer hard = null;
            Object hardObj = difficulty.get("hard");
            if (hardObj instanceof Number) {
                hard = ((Number) hardObj).intValue();
            }
            
            if (easy != null) difficultyRequirement.append(String.format("- 简单题：%d%%\n", easy));
            if (medium != null) difficultyRequirement.append(String.format("- 中等题：%d%%\n", medium));
            if (hard != null) difficultyRequirement.append(String.format("- 困难题：%d%%\n", hard));
        }
        
        // 计算每道题的平均分值
        int averageScore = totalQuestions > 0 ? totalScore / totalQuestions : 10;
        
        String prompt = String.format(
            "请根据以下课程资料为《%s》课程的《%s》章节生成考试题目。\n\n" +
            "**严格按照以下要求生成：**\n\n" +
            "## 题目数量和类型要求：\n" +
            "%s" +
            "总题目数：%d题\n\n" +
            "## 难度分布要求：\n" +
            "%s\n" +
            "%s" +
            "## 分值设置（重要）：\n" +
            "- **试卷总分：%d分（必须严格遵守）**\n" +
            "- 建议每题分值：%d分左右（可根据题型难度适当调整）\n" +
            "- **所有题目分值之和必须精确等于%d分**\n" +
            "- 考试时长：%d分钟\n" +
            "- **分值分配原则：**\n" +
            "  * 选择题通常：5-10分\n" +
            "  * 填空题通常：8-12分\n" +
            "  * 判断题通常：3-8分\n" +
            "  * 解答题通常：15-25分（包含计算过程和文字表述）\n" +
            "  * 困难题可以适当增加分值\n\n" +
            "## 输出格式要求：\n" +
            "请严格按照以下格式输出每道题目：\n\n" +
            (totalQuestions == 1 ? 
                // 单道题目的特殊格式
                "### 编程题（题型类型）\n" +
                "**题目内容**：[具体题目内容，可以包含多行、代码示例、列表等]\n" +
                "**选项**：（如果是选择题才需要）\n" +
                "A. [选项A内容]\n" +
                "B. [选项B内容]\n" +
                "C. [选项C内容]\n" +
                "D. [选项D内容]\n" +
                "**正确答案**：[完整答案内容，编程题请提供完整代码]\n" +
                "**解析**：[详细解析]\n" +
                "**分值建议**：[具体分值]分\n\n" +
                "**重要提醒**：\n" +
                "- 单道题目时，请将所有内容作为一个完整题目输出\n" +
                "- 不要在题目内容中使用分隔符如---\n" +
                "- 题目内容可以包含编号列表（1. 2. 3.），这是正常的格式\n" +
                "- 编程题的答案部分必须包含完整可运行的代码\n\n"
                :
                // 多道题目的标准格式  
                "### 题目X（题型类型）\n" +
                "**题目内容**：[具体题目内容]\n" +
                "**选项**：（如果是选择题）\n" +
                "A. [选项A内容]\n" +
                "B. [选项B内容]\n" +
                "C. [选项C内容]\n" +
                "D. [选项D内容]\n" +
                "**正确答案**：[答案]\n" +
                "**解析**：[详细解析]\n" +
                "**分值建议**：[具体分值]分\n\n" +
                "---\n\n"
            ) +
            "## 题型说明：\n" +
            "- multiple-choice：单项选择题（4个选项，选择1个正确答案）\n" +
            "- fill-blank：填空题（在题目中用______表示空白处）\n" +
            "- true-false：判断题（正确/错误）\n" +
            "- answer：解答题（包含计算题和论述题，需要完整的解答过程和文字表述）\n" +
            "- 自定义题型：按照题目列表中指定的要求生成相应类型的题目\n\n" +
            "## 答案格式特别要求（重要）：\n" +
            "1. **编程题答案**：必须提供完整的可运行代码，包含所有必要的函数、语句和注释\n" +
            "2. **案例分析题答案**：必须提供完整的分析过程，包含所有问题点的详细回答\n" +
            "3. **解答题答案**：必须提供完整的解答步骤和结论\n" +
            "4. **所有题型的答案都必须完整**，不能只提供框架或部分内容\n" +
            "5. **答案长度要求**：编程题答案不少于10行代码，案例分析题答案不少于200字\n\n" +
            "## 课程资料内容：\n" +
            "%s\n\n" +
            "**重要提醒（必须严格遵守）：**\n" +
            "1. 必须严格按照上述题目数量和类型要求生成\n" +
            "2. 题目内容必须基于提供的课程资料\n" +
            "3. 难度分布要符合设定的比例\n" +
            "4. **所有题目的分值之和必须精确等于%d分**\n" +
            "5. 题目要有一定的区分度和实用性\n" +
            "6. **必须生成完整的%d道题目，不允许因篇幅限制而省略任何题目**\n" +
            "7. **如果内容较长，请确保所有%d道题目都完整输出**\n" +
            (totalQuestions == 1 ? 
                "8. **单道题目要求**：请将所有内容作为一个完整题目输出，不要添加额外的验证信息或分隔符\n" +
                "9. **分值要求**：这道题目的分值必须等于%d分" :
                "8. **在最后请计算并验证：所有题目分值总和 = %d分**\n" +
                "9. **如果分值总和不等于%d分，请调整部分题目的分值使其精确等于%d分**"
            ),
            courseName, 
            chapter,
            typesRequirement.toString(),
            totalQuestions,
            difficultyRequirement.toString(),
            (specialRequirements != null && !specialRequirements.trim().isEmpty()) ? 
                ("## 特殊要求：\n" + specialRequirements + "\n\n") : "",
            totalScore,
            averageScore,
            totalScore,
            duration,
            materialContent,
            totalScore,
            totalQuestions,
            totalQuestions,
            totalQuestions == 1 ? totalScore : totalScore,
            totalQuestions == 1 ? totalScore : totalScore,
            totalQuestions == 1 ? totalScore : totalScore
        );
        
        return callDeepSeekAPI(prompt);
    }
    
    /**
     * 获取题型中文名称 - 使用标准化的题型映射
     */
    private String getQuestionTypeName(String type) {
        switch (type) {
            case "multiple-choice": return "选择题";
            case "choice": return "选择题";
            case "fill-blank": return "填空题";
            case "fill_blank": return "填空题";
            case "true-false": return "判断题";
            case "true_false": return "判断题";
            case "answer": return "解答题";
            case "essay": return "解答题";
            case "short-answer": return "简答题";
            case "short_answer": return "简答题";
            case "programming": return "编程题";
            case "calculation": return "计算题";
            case "case-analysis": return "案例分析题";
            case "case_analysis": return "案例分析题";
            default: return type;
        }
    }
    
    /**
     * 学习助手专用的API调用方法
     * 供学生端学习助手功能使用
     */
    public String generateLearningAssistantResponse(String prompt) {
        return callDeepSeekAPI(prompt);
    }
    
    /**
     * 智能评分 - 针对非选择题和判断题
     * @param questionContent 题目内容
     * @param questionType 题目类型
     * @param studentAnswer 学生答案
     * @param standardAnswer 标准答案
     * @param explanation 题目解析
     * @param maxScore 题目满分
     * @return 评分结果（包含分数、评语和建议）
     */
    public Map<String, Object> intelligentGrading(String questionContent, String questionType, 
                                                String studentAnswer, String standardAnswer, 
                                                String explanation, int maxScore) {
        String prompt = String.format(
            "**智能评分任务**\n\n" +
            "请作为一名专业的教师，对学生的答案进行客观、公正的评分。\n\n" +
            "**题目信息：**\n" +
            "- 题目类型：%s\n" +
            "- 题目内容：%s\n" +
            "- 满分：%d分\n" +
            "- 标准答案：%s\n" +
            "- 题目解析：%s\n\n" +
            "**学生答案：**\n" +
            "%s\n\n" +
            "**评分要求：**\n" +
            "1. 请仔细比较学生答案与标准答案的相似度和正确性\n" +
            "2. 考虑答案的完整性、准确性、逻辑性\n" +
            "3. 对于主观题，要考虑多种合理的表达方式\n" +
            "4. 评分要客观公正，既不过于严苛也不过于宽松\n" +
            "5. 提供具体的评分理由和改进建议\n\n" +
            "**输出格式（严格按此格式）：**\n" +
            "```json\n" +
            "{\n" +
            "  \"score\": 实际得分（0-%d之间的整数）,\n" +
            "  \"feedback\": \"详细的评分理由和建议\",\n" +
            "  \"correctness\": \"correct/partial/incorrect\",\n" +
            "  \"keyPoints\": [\"答对的要点1\", \"答对的要点2\"],\n" +
            "  \"missingPoints\": [\"遗漏的要点1\", \"遗漏的要点2\"],\n" +
            "  \"suggestions\": [\"改进建议1\", \"改进建议2\"]\n" +
            "}\n" +
            "```\n\n" +
            "请确保输出的JSON格式正确，可以被程序解析。",
            questionType, questionContent, maxScore, standardAnswer, 
            explanation != null ? explanation : "无", 
            studentAnswer != null ? studentAnswer : "未作答",
            maxScore
        );
        
        try {
            String response = callDeepSeekAPI(prompt);
            return parseGradingResponse(response, maxScore);
        } catch (Exception e) {
            System.err.println("智能评分失败: " + e.getMessage());
            // 返回默认评分结果
            Map<String, Object> result = new HashMap<>();
            result.put("score", 0);
            result.put("feedback", "智能评分服务暂时不可用，请手动评分");
            result.put("correctness", "unknown");
            result.put("keyPoints", List.of());
            result.put("missingPoints", List.of());
            result.put("suggestions", List.of("请联系教师进行人工评分"));
            return result;
        }
    }
    
    /**
     * 单题智能评分 - 只返回分数
     * @param questionContent 题目内容
     * @param questionType 题目类型
     * @param studentAnswer 学生答案
     * @param standardAnswer 标准答案
     * @param explanation 题目解析
     * @param maxScore 满分
     * @return AI评分结果（只返回分数）
     */
    public Integer singleQuestionGrading(String questionContent, String questionType, 
                                       String studentAnswer, String standardAnswer, 
                                       String explanation, Integer maxScore) {
        String prompt = String.format(
            "**单题AI评分任务**\n\n" +
            "请作为一名专业的教师，对学生的答案进行客观、公正的评分，只需要返回分数。\n\n" +
            "**题目信息：**\n" +
            "- 题目类型：%s\n" +
            "- 题目内容：%s\n" +
            "- 满分：%d分\n" +
            "- 标准答案：%s\n" +
            "- 题目解析：%s\n\n" +
            "**学生答案：**\n" +
            "%s\n\n" +
            "**评分要求：**\n" +
            "1. 请仔细比较学生答案与标准答案的相似度和正确性\n" +
            "2. 考虑答案的完整性、准确性、逻辑性\n" +
            "3. 对于主观题，要考虑多种合理的表达方式\n" +
            "4. 评分要客观公正，既不过于严苛也不过于宽松\n\n" +
            "**输出要求：**\n" +
            "请直接返回一个0-%d之间的整数分数，不需要其他内容。\n" +
            "例如：8",
            questionType, questionContent, maxScore, standardAnswer, 
            explanation != null ? explanation : "无", 
            studentAnswer != null ? studentAnswer : "未作答",
            maxScore
        );
        
        try {
            String response = callDeepSeekAPI(prompt);
            return parseSingleScore(response, maxScore);
        } catch (Exception e) {
            System.err.println("单题智能评分失败: " + e.getMessage());
            // 返回0分作为默认值
            return 0;
        }
    }

    /**
     * 批量智能评分 - 处理多道题目
     * @param gradingRequests 评分请求列表
     * @return 评分结果列表
     */
    public List<Map<String, Object>> batchIntelligentGrading(List<Map<String, Object>> gradingRequests) {
        List<Map<String, Object>> results = new ArrayList<>();
        
        for (Map<String, Object> request : gradingRequests) {
            String questionContent = (String) request.get("questionContent");
            String questionType = (String) request.get("questionType");
            String studentAnswer = (String) request.get("studentAnswer");
            String standardAnswer = (String) request.get("standardAnswer");
            String explanation = (String) request.get("explanation");
            Integer maxScore = (Integer) request.get("maxScore");
            Long questionId = (Long) request.get("questionId");
            
            Map<String, Object> result = intelligentGrading(
                questionContent, questionType, studentAnswer, 
                standardAnswer, explanation, maxScore
            );
            result.put("questionId", questionId);
            results.add(result);
        }
        
        return results;
    }
    
    /**
     * 解析DeepSeek返回的评分结果
     */
    private Map<String, Object> parseGradingResponse(String response, int maxScore) {
        try {
            // 提取JSON部分
            String jsonStr = extractJsonFromResponse(response);
            if (jsonStr != null) {
                JsonNode jsonNode = objectMapper.readTree(jsonStr);
                
                Map<String, Object> result = new HashMap<>();
                result.put("score", Math.min(jsonNode.get("score").asInt(), maxScore));
                result.put("feedback", jsonNode.get("feedback").asText());
                result.put("correctness", jsonNode.get("correctness").asText());
                
                // 解析数组字段
                List<String> keyPoints = new ArrayList<>();
                JsonNode keyPointsNode = jsonNode.get("keyPoints");
                if (keyPointsNode != null && keyPointsNode.isArray()) {
                    for (JsonNode point : keyPointsNode) {
                        keyPoints.add(point.asText());
                    }
                }
                result.put("keyPoints", keyPoints);
                
                List<String> missingPoints = new ArrayList<>();
                JsonNode missingPointsNode = jsonNode.get("missingPoints");
                if (missingPointsNode != null && missingPointsNode.isArray()) {
                    for (JsonNode point : missingPointsNode) {
                        missingPoints.add(point.asText());
                    }
                }
                result.put("missingPoints", missingPoints);
                
                List<String> suggestions = new ArrayList<>();
                JsonNode suggestionsNode = jsonNode.get("suggestions");
                if (suggestionsNode != null && suggestionsNode.isArray()) {
                    for (JsonNode suggestion : suggestionsNode) {
                        suggestions.add(suggestion.asText());
                    }
                }
                result.put("suggestions", suggestions);
                
                return result;
            }
        } catch (Exception e) {
            System.err.println("解析评分结果失败: " + e.getMessage());
        }
        
        // 解析失败时返回默认结果
        Map<String, Object> result = new HashMap<>();
        result.put("score", 0);
        result.put("feedback", "评分结果解析失败，请手动评分");
        result.put("correctness", "unknown");
        result.put("keyPoints", List.of());
        result.put("missingPoints", List.of());
        result.put("suggestions", List.of("请联系教师进行人工评分"));
        return result;
    }
    
    /**
     * 解析单题评分响应，只提取分数
     */
    private Integer parseSingleScore(String response, Integer maxScore) {
        if (response == null || response.trim().isEmpty()) {
            return 0;
        }
        
        try {
            // 尝试直接解析数字
            String cleanResponse = response.trim();
            
            // 移除可能的前缀文字，只保留数字
            String[] lines = cleanResponse.split("\n");
            for (String line : lines) {
                line = line.trim();
                // 查找纯数字
                if (line.matches("\\d+")) {
                    int score = Integer.parseInt(line);
                    return Math.min(Math.max(score, 0), maxScore); // 确保分数在0-maxScore范围内
                }
                // 查找包含数字的行，如"分数：8"或"8分"
                if (line.matches(".*\\d+.*")) {
                    String numberStr = line.replaceAll("\\D", ""); // 移除所有非数字字符
                    if (!numberStr.isEmpty()) {
                        int score = Integer.parseInt(numberStr);
                        return Math.min(Math.max(score, 0), maxScore);
                    }
                }
            }
            
            // 如果没有找到明确的数字，尝试从整个响应中提取第一个数字
            String numberStr = response.replaceAll("\\D", "");
            if (!numberStr.isEmpty()) {
                int score = Integer.parseInt(numberStr.substring(0, Math.min(2, numberStr.length())));
                return Math.min(Math.max(score, 0), maxScore);
            }
            
        } catch (Exception e) {
            System.err.println("解析单题评分失败: " + e.getMessage());
        }
        
        // 解析失败，返回0分
        return 0;
    }

    /**
     * 从响应中提取JSON字符串
     */
    private String extractJsonFromResponse(String response) {
        if (response == null) return null;
        
        // 查找JSON代码块
        int startIndex = response.indexOf("```json");
        if (startIndex != -1) {
            startIndex += 7; // 跳过 "```json"
            int endIndex = response.indexOf("```", startIndex);
            if (endIndex != -1) {
                return response.substring(startIndex, endIndex).trim();
            }
        }
        
        // 如果没有代码块，尝试查找直接的JSON
        int braceStart = response.indexOf("{");
        int braceEnd = response.lastIndexOf("}");
        if (braceStart != -1 && braceEnd != -1 && braceEnd > braceStart) {
            return response.substring(braceStart, braceEnd + 1);
        }
        
        return null;
    }
    
    /**
     * 调用DeepSeek API
     */
    private String callDeepSeekAPI(String prompt) {
        try {
            System.out.println("=== 开始调用DeepSeek API ===");
            System.out.println("API URL: " + apiUrl);
            System.out.println("API Key: " + (apiKey != null ? apiKey.substring(0, 10) + "..." : "null"));
            System.out.println("Prompt长度: " + prompt.length());
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "deepseek-chat");
            requestBody.put("messages", List.of(
                Map.of("role", "user", "content", prompt)
            ));
            requestBody.put("max_tokens", 8000);
            requestBody.put("temperature", 0.7);
            
            System.out.println("请求体: " + objectMapper.writeValueAsString(requestBody));
            
            String response = webClient.post()
                    .uri(apiUrl)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            
            System.out.println("API响应: " + response);
            
            // 解析响应
            JsonNode jsonNode = objectMapper.readTree(response);
            JsonNode choices = jsonNode.get("choices");
            if (choices != null && choices.isArray() && choices.size() > 0) {
                JsonNode message = choices.get(0).get("message");
                if (message != null) {
                    JsonNode content = message.get("content");
                    if (content != null) {
                        String result = content.asText();
                        System.out.println("API调用成功，内容长度: " + result.length());
                        return result;
                    }
                }
            }
            
            System.out.println("解析响应失败");
            throw new RuntimeException("无法解析API响应");
            
        } catch (Exception e) {
            System.err.println("调用DeepSeek API失败: " + e.getMessage());
            e.printStackTrace();
            
            // 判断是否为智能评分请求
            if (prompt.contains("智能评分任务")) {
                // 智能评分失败时，抛出异常让上层处理
                throw new RuntimeException("智能评分API调用失败: " + e.getMessage());
            } else {
                // 其他请求（如教学大纲生成）返回模拟内容
                return generateMockOutline();
            }
        }
    }
    
    /**
     * 生成模拟教学大纲（当API调用失败时使用）
     */
    private String generateMockOutline() {
        return """
        # 教学大纲
        
        ## 1. 教学目标
        - 掌握本课程的核心知识点和基本概念
        - 培养学生分析问题和解决问题的能力
        - 提高学生的实践操作技能
        
        ## 2. 教学思路
        采用理论与实践相结合的教学方法，通过案例分析、课堂讨论、实验操作等多种形式，
        帮助学生深入理解课程内容，提高学习效果。
        
        ## 3. 教学重点
        - 基础理论知识的掌握
        - 核心概念的理解和应用
        - 实际问题的分析和解决
        
        ## 4. 教学难点
        - 复杂概念的理解
        - 理论与实践的结合
        - 综合应用能力的培养
        
        ## 5. 思政融入点
        - 培养学生科学严谨的学习态度
        - 增强学生的团队协作意识
        - 提高学生的创新思维能力
        
        ## 6. 教学设计
        
        ### 第一阶段：基础知识学习（2-4周）
        - 理论讲授：基本概念和原理
        - 课堂练习：基础题目训练
        - 作业布置：巩固基础知识
        
        ### 第二阶段：深入学习（4-6周）
        - 案例分析：实际问题解决
        - 小组讨论：知识点深入探讨
        - 实验操作：实践技能培养
        
        ### 第三阶段：综合应用（2-3周）
        - 项目实践：综合能力培养
        - 成果展示：学习效果检验
        - 总结反思：查漏补缺
        
        ## 7. 教学方法与手段
        - 讲授法：系统传授理论知识
        - 讨论法：启发学生思考
        - 实践法：提高动手能力
        - 案例法：理论联系实际
        
        ## 8. 课程考核方式
        - 平时成绩（30%）：出勤、作业、课堂表现
        - 期中考试（30%）：理论知识掌握情况
        - 期末考试（40%）：综合能力考查
        
        *注：本大纲由AI智能生成，基于上传的课程资料内容制定。*
        """;
    }
} 