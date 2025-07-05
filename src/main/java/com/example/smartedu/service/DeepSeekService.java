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
                "**知识点**：[简短的知识点标记，如：数据结构、算法分析等]\n" +
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
            "**知识点**：[简短的知识点标记，如：数据结构、算法分析等]\n" +
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

    /**
     * 为题目生成知识点标记
     */
    public String generateKnowledgePoint(String questionContent, String questionType) {
        String prompt = String.format(
            "请为以下题目生成一个简洁的知识点标记（3-8个字）：\n\n" +
            "题目类型：%s\n" +
            "题目内容：%s\n\n" +
            "要求：\n" +
            "1. 知识点标记要简洁明了，3-8个字\n" +
            "2. 体现题目考查的核心知识领域\n" +
            "3. 使用标准的学科术语\n" +
            "4. 只返回知识点标记，不要其他内容\n\n" +
            "示例：\n" +
            "- 数据结构\n" +
            "- 算法分析\n" +
            "- 面向对象\n" +
            "- 数据库设计\n" +
            "- 网络协议\n" +
            "- 系统架构\n\n" +
            "请直接返回知识点标记：",
            questionType, questionContent
        );
        
        try {
            String response = callDeepSeekAPI(prompt);
            // 清理响应，去除多余的文字
            if (response != null) {
                response = response.trim()
                    .replaceAll("知识点标记[：:]?", "")
                    .replaceAll("知识点[：:]?", "")
                    .replaceAll("^[：:：\\-\\s]+", "")
                    .replaceAll("[：:：\\-\\s]+$", "")
                    .trim();
                
                // 如果响应过长，取前8个字符
                if (response.length() > 8) {
                    response = response.substring(0, 8);
                }
                
                return response.isEmpty() ? "未分类" : response;
            }
        } catch (Exception e) {
            System.err.println("生成知识点失败: " + e.getMessage());
        }
        
        return "未分类";
    }
    
    /**
     * 生成题目帮助回答
     */
    public String generateQuestionHelpResponse(String questionContent, String questionType, 
                                             String userQuestion, String correctAnswer, 
                                             String explanation, List<Map<String, String>> chatHistory) {
        
        // 构建上下文信息
        StringBuilder context = new StringBuilder();
        context.append("题目信息：\n");
        context.append("题目类型：").append(getQuestionTypeName(questionType)).append("\n");
        context.append("题目内容：").append(questionContent).append("\n");
        
        if (correctAnswer != null && !correctAnswer.trim().isEmpty()) {
            context.append("正确答案：").append(correctAnswer).append("\n");
        }
        
        if (explanation != null && !explanation.trim().isEmpty()) {
            context.append("题目解析：").append(explanation).append("\n");
        }
        
        // 添加历史对话记录
        if (chatHistory != null && !chatHistory.isEmpty()) {
            context.append("\n历史对话：\n");
            for (Map<String, String> chat : chatHistory) {
                String role = chat.get("role");
                String content = chat.get("content");
                if ("user".equals(role)) {
                    context.append("学生问：").append(content).append("\n");
                } else if ("assistant".equals(role)) {
                    context.append("AI答：").append(content).append("\n");
                }
            }
        }
        
        // 构建完整的prompt
        String prompt = String.format(
            "你是一个专业的学习助手，正在帮助学生理解考试题目。请根据以下信息回答学生的问题：\n\n" +
            "%s\n" +
            "学生问题：%s\n\n" +
            "请注意：\n" +
            "1. 如果学生询问正确答案，只有在题目信息中包含正确答案时才能告诉学生\n" +
            "2. 重点帮助学生理解题目思路和解题方法，而不是直接给出答案\n" +
            "3. 如果有解析信息，可以基于解析进行详细说明\n" +
            "4. 回答要通俗易懂，有教育意义\n" +
            "5. 如果学生问题与当前题目无关，请引导学生回到题目讨论\n" +
            "6. 保持友好、耐心的语气\n\n" +
            "请回答学生的问题：",
            context.toString(), userQuestion
        );
        
        return callDeepSeekAPI(prompt);
    }

    /**
     * 生成教学改进建议（包含详细错题分析）
     */
    public String generateTeachingImprovementsWithDetailedAnalysis(String scope, String analysisData, 
                                                                 int totalExams, int totalStudents, 
                                                                 Map<String, List<Double>> courseScores, 
                                                                 Map<String, Map<String, Integer>> difficultyStats,
                                                                 List<Map<String, Object>> examAnalysisData) {
        
        // 如果没有详细的错题数据，使用原来的方法
        if (examAnalysisData.isEmpty()) {
            return generateTeachingImprovements(scope, analysisData, totalExams, totalStudents, courseScores, difficultyStats);
        }
        
        try {
            // 构建多轮对话
            List<Map<String, Object>> messages = new ArrayList<>();
            
            // 第一轮：发送系统角色和基础分析数据
            messages.add(Map.of(
                "role", "system",
                "content", "您是一位资深的教育专家，擅长分析学生学习情况并提供教学改进建议。我将为您提供详细的考试数据和错题分析，请您仔细记录这些信息，在我发送完所有数据后，您将基于这些信息生成专业的教学改进建议。"
            ));
            
            // 第二轮：发送基础统计数据
            StringBuilder summary = buildAnalysisSummary(scope, totalExams, totalStudents, courseScores, difficultyStats);
            messages.add(Map.of(
                "role", "user",
                "content", "**基础教学数据分析**\n\n" + summary.toString() + "\n\n" + analysisData + "\n\n请记录这些基础数据，我接下来将发送详细的错题分析。"
            ));
            
            messages.add(Map.of(
                "role", "assistant",
                "content", "我已经记录了基础教学数据。请继续发送详细的错题分析数据。"
            ));
            
            // 第三轮及后续：逐个发送考试的详细错题分析
            for (int i = 0; i < examAnalysisData.size(); i++) {
                Map<String, Object> examData = examAnalysisData.get(i);
                String examAnalysisContent = buildExamAnalysisContent(examData, i + 1);
                
                messages.add(Map.of(
                    "role", "user",
                    "content", examAnalysisContent
                ));
                
                if (i < examAnalysisData.size() - 1) {
                    // 不是最后一个考试，AI确认收到
                    messages.add(Map.of(
                        "role", "assistant",
                        "content", String.format("已记录第%d个考试的详细错题分析数据。请继续发送下一个考试的分析。", i + 1)
                    ));
                }
            }
            
            // 最后一轮：要求生成综合分析报告
            String finalPrompt = buildFinalAnalysisPrompt(scope, examAnalysisData.size());
            messages.add(Map.of(
                "role", "user",
                "content", finalPrompt
            ));
            
            // 调用DeepSeek API进行多轮对话
            return callDeepSeekAPIWithMessages(messages);
            
        } catch (Exception e) {
            System.err.println("详细分析失败，使用基础分析: " + e.getMessage());
            // 如果详细分析失败，回退到基础分析
            return generateTeachingImprovements(scope, analysisData, totalExams, totalStudents, courseScores, difficultyStats);
        }
    }
    
    /**
     * 构建分析摘要
     */
    private StringBuilder buildAnalysisSummary(String scope, int totalExams, int totalStudents, 
                                             Map<String, List<Double>> courseScores, 
                                             Map<String, Map<String, Integer>> difficultyStats) {
        StringBuilder summary = new StringBuilder();
        summary.append("**数据概览**\n");
        summary.append("- 分析范围：").append(getScopeDisplayName(scope)).append("\n");
        summary.append("- 考试总数：").append(totalExams).append(" 场\n");
        summary.append("- 学生总数：").append(totalStudents).append(" 人次\n\n");
        
        // 分析各课程成绩分布
        if (!courseScores.isEmpty()) {
            summary.append("**成绩分析**\n");
            for (Map.Entry<String, List<Double>> entry : courseScores.entrySet()) {
                String courseName = entry.getKey();
                List<Double> scores = entry.getValue();
                if (scores.isEmpty()) continue;
                
                double avg = scores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
                
                // 计算优秀率、良好率、及格率
                long excellentCount = scores.stream().mapToLong(s -> s >= 90 ? 1 : 0).sum();
                long goodCount = scores.stream().mapToLong(s -> s >= 80 && s < 90 ? 1 : 0).sum();
                long passCount = scores.stream().mapToLong(s -> s >= 60 ? 1 : 0).sum();
                
                double excellentRate = excellentCount * 100.0 / scores.size();
                double goodRate = goodCount * 100.0 / scores.size();
                double passRate = passCount * 100.0 / scores.size();
                
                summary.append("- ").append(courseName).append("：\n");
                summary.append("  平均分：").append(String.format("%.2f", avg));
                summary.append(" | 及格率：").append(String.format("%.1f%%", passRate));
                summary.append(" | 优秀率：").append(String.format("%.1f%%", excellentRate)).append("\n");
            }
        }
        
        // 分析题目难度分布
        if (!difficultyStats.isEmpty()) {
            summary.append("\n**题目难度分析**\n");
            for (Map.Entry<String, Map<String, Integer>> entry : difficultyStats.entrySet()) {
                String courseName = entry.getKey();
                Map<String, Integer> stats = entry.getValue();
                
                int total = stats.values().stream().mapToInt(Integer::intValue).sum();
                if (total == 0) continue;
                
                summary.append("- ").append(courseName).append("：");
                summary.append("简单题 ").append(stats.getOrDefault("简单", 0)).append("道");
                summary.append(" | 中等题 ").append(stats.getOrDefault("中等", 0)).append("道");
                summary.append(" | 困难题 ").append(stats.getOrDefault("困难", 0)).append("道\n");
            }
        }
        
        return summary;
    }
    
    /**
     * 构建单个考试的详细分析内容
     */
    private String buildExamAnalysisContent(Map<String, Object> examData, int examIndex) {
        StringBuilder content = new StringBuilder();
        
        content.append("**第").append(examIndex).append("个考试详细错题分析**\n\n");
        content.append("考试名称：").append(examData.get("examTitle")).append("\n");
        content.append("课程名称：").append(examData.get("courseName")).append("\n");
        content.append("参考人数：").append(examData.get("studentCount")).append("\n\n");
        
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> questionAnalysis = (List<Map<String, Object>>) examData.get("questionAnalysis");
        
        if (questionAnalysis != null && !questionAnalysis.isEmpty()) {
            content.append("**错题详细分析（正确率<70%的题目）：**\n\n");
            
            for (int i = 0; i < questionAnalysis.size(); i++) {
                Map<String, Object> question = questionAnalysis.get(i);
                content.append("题目").append(i + 1).append("：\n");
                content.append("- 题目内容：").append(question.get("questionContent")).append("\n");
                content.append("- 题目类型：").append(getQuestionTypeDisplayName((String) question.get("questionType"))).append("\n");
                content.append("- 标准答案：").append(question.get("standardAnswer")).append("\n");
                content.append("- 题目解析：").append(question.get("explanation")).append("\n");
                content.append("- 满分：").append(question.get("maxScore")).append("分\n");
                content.append("- 答题人数：").append(question.get("totalAnswers")).append("\n");
                content.append("- 正确人数：").append(question.get("correctCount")).append("\n");
                content.append("- 正确率：").append(String.format("%.1f%%", ((Double) question.get("correctRate")) * 100)).append("\n");
                content.append("- 平均得分：").append(String.format("%.2f", question.get("avgScore"))).append("分\n");
                
                // 错误答案分析
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> wrongAnswers = (List<Map<String, Object>>) question.get("wrongAnswers");
                if (wrongAnswers != null && !wrongAnswers.isEmpty()) {
                    content.append("- 典型错误答案：\n");
                    
                    // 只显示前5个错误答案作为代表
                    int maxDisplay = Math.min(5, wrongAnswers.size());
                    for (int j = 0; j < maxDisplay; j++) {
                        Map<String, Object> wrongAnswer = wrongAnswers.get(j);
                        content.append("  ").append(j + 1).append(". \"").append(wrongAnswer.get("studentAnswer"))
                               .append("\" (得分：").append(wrongAnswer.get("score")).append("/")
                               .append(wrongAnswer.get("maxScore")).append(")\n");
                    }
                    
                    if (wrongAnswers.size() > 5) {
                        content.append("  ... 还有").append(wrongAnswers.size() - 5).append("个错误答案\n");
                    }
                }
                
                // 答案分布分析
                @SuppressWarnings("unchecked")
                Map<String, Integer> answerDistribution = (Map<String, Integer>) question.get("answerDistribution");
                if (answerDistribution != null && !answerDistribution.isEmpty()) {
                    content.append("- 答案分布统计：\n");
                    answerDistribution.entrySet().stream()
                        .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                        .limit(3) // 只显示前3个最常见的答案
                        .forEach(entry -> {
                            content.append("  \"").append(entry.getKey()).append("\": ")
                                   .append(entry.getValue()).append("人\n");
                        });
                }
                
                content.append("\n");
            }
        } else {
            content.append("该考试没有正确率较低的题目，学生整体表现良好。\n\n");
        }
        
        return content.toString();
    }
    
    /**
     * 构建最终分析要求的prompt
     */
    private String buildFinalAnalysisPrompt(String scope, int examCount) {
        return String.format(
            "现在我已经为您提供了完整的教学数据，包括：\n" +
            "1. 基础统计数据（分析范围：%s）\n" +
            "2. %d个考试的详细错题分析\n\n" +
            "请您基于以上所有信息，生成一份专业、全面的教学改进建议报告。要求：\n\n" +
            "**分析维度：**\n" +
            "1. **教学效果评估**\n" +
            "   - 基于成绩数据和错题分析，评估整体教学成效\n" +
            "   - 识别教学优势和薄弱环节\n" +
            "   - 分析学生学习状况和知识掌握情况\n\n" +
            "2. **具体问题诊断**\n" +
            "   - 分析高错误率题目的共同特征\n" +
            "   - 识别学生的典型错误模式和思维误区\n" +
            "   - 找出知识点掌握的薄弱环节\n" +
            "   - 分析不同题型的答题情况\n\n" +
            "3. **针对性教学改进建议**\n" +
            "   - 针对具体错题和错误模式提出教学策略\n" +
            "   - 建议重点讲解的知识点和教学方法\n" +
            "   - 提出课堂练习和作业的改进方案\n" +
            "   - 建议学生个性化辅导重点\n\n" +
            "4. **考试命题优化建议**\n" +
            "   - 基于答题情况分析题目设计的合理性\n" +
            "   - 建议题目难度和类型的调整\n" +
            "   - 提出更好的题目表达方式\n\n" +
            "5. **实施计划**\n" +
            "   - 短期改进措施（1-2周内可实施）\n" +
            "   - 中期改进计划（1个月内的教学调整）\n" +
            "   - 长期发展目标（一学期的教学优化）\n\n" +
            "**输出要求：**\n" +
            "- 建议要具体可操作，避免空泛理论\n" +
            "- 要引用具体的错题和数据进行分析\n" +
            "- 提供多种可选的改进方案\n" +
            "- 建议要符合实际教学条件\n" +
            "- 使用清晰的结构化格式\n" +
            "- 重点关注错误率高的题目和知识点\n\n" +
            "请开始生成详细的教学改进建议报告。",
            getScopeDisplayName(scope),
            examCount
        );
    }
    
    /**
     * 调用DeepSeek API进行多轮对话
     */
    private String callDeepSeekAPIWithMessages(List<Map<String, Object>> messages) {
        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "deepseek-chat");
            requestBody.put("messages", messages);
            requestBody.put("temperature", 0.7);
            requestBody.put("max_tokens", 4000);
            requestBody.put("stream", false);
            
            String response = webClient.post()
                    .uri(apiUrl)
                    .header("Authorization", "Bearer " + apiKey)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            
            if (response != null) {
                JsonNode jsonResponse = objectMapper.readTree(response);
                JsonNode choices = jsonResponse.get("choices");
                if (choices != null && choices.isArray() && choices.size() > 0) {
                    JsonNode message = choices.get(0).get("message");
                    if (message != null) {
                        String content = message.get("content").asText();
                        System.out.println("DeepSeek多轮对话响应成功，内容长度: " + content.length());
                        return content;
                    }
                }
            }
            
            System.err.println("DeepSeek多轮对话响应格式异常");
            return "AI分析服务暂时不可用，请稍后重试。";
            
        } catch (Exception e) {
            System.err.println("调用DeepSeek多轮对话API失败: " + e.getMessage());
            e.printStackTrace();
            return "AI分析服务暂时不可用，请稍后重试。";
        }
    }
    
    /**
     * 获取题目类型显示名称
     */
    private String getQuestionTypeDisplayName(String type) {
        if (type == null) return "未知类型";
        switch (type.toLowerCase()) {
            case "choice": return "选择题";
            case "multiple_choice": return "多选题";
            case "true_false": return "判断题";
            case "fill_blank": return "填空题";
            case "short_answer": return "简答题";
            case "essay": return "论述题";
            default: return type;
        }
    }
    
    /**
     * 生成教学改进建议
     */
    public String generateTeachingImprovements(String scope, String analysisData, int totalExams, 
                                             int totalStudents, Map<String, List<Double>> courseScores, 
                                             Map<String, Map<String, Integer>> difficultyStats) {
        
        // 构建分析摘要
        StringBuilder summary = new StringBuilder();
        summary.append("**数据概览**\n");
        summary.append("- 分析范围：").append(getScopeDisplayName(scope)).append("\n");
        summary.append("- 考试总数：").append(totalExams).append(" 场\n");
        summary.append("- 学生总数：").append(totalStudents).append(" 人次\n\n");
        
        // 分析各课程成绩分布
        if (!courseScores.isEmpty()) {
            summary.append("**成绩分析**\n");
            for (Map.Entry<String, List<Double>> entry : courseScores.entrySet()) {
                String courseName = entry.getKey();
                List<Double> scores = entry.getValue();
                if (scores.isEmpty()) continue;
                
                double avg = scores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
                double max = scores.stream().mapToDouble(Double::doubleValue).max().orElse(0.0);
                double min = scores.stream().mapToDouble(Double::doubleValue).min().orElse(0.0);
                
                // 计算优秀率、良好率、及格率
                long excellentCount = scores.stream().mapToLong(s -> s >= 90 ? 1 : 0).sum();
                long goodCount = scores.stream().mapToLong(s -> s >= 80 && s < 90 ? 1 : 0).sum();
                long passCount = scores.stream().mapToLong(s -> s >= 60 ? 1 : 0).sum();
                
                double excellentRate = excellentCount * 100.0 / scores.size();
                double goodRate = goodCount * 100.0 / scores.size();
                double passRate = passCount * 100.0 / scores.size();
                
                summary.append("- ").append(courseName).append("：\n");
                summary.append("  平均分：").append(String.format("%.2f", avg));
                summary.append(" | 及格率：").append(String.format("%.1f%%", passRate));
                summary.append(" | 优秀率：").append(String.format("%.1f%%", excellentRate)).append("\n");
            }
        }
        
        // 分析题目难度分布
        if (!difficultyStats.isEmpty()) {
            summary.append("\n**题目难度分析**\n");
            for (Map.Entry<String, Map<String, Integer>> entry : difficultyStats.entrySet()) {
                String courseName = entry.getKey();
                Map<String, Integer> stats = entry.getValue();
                
                int total = stats.values().stream().mapToInt(Integer::intValue).sum();
                if (total == 0) continue;
                
                summary.append("- ").append(courseName).append("：");
                summary.append("简单题 ").append(stats.getOrDefault("简单", 0)).append("道");
                summary.append(" | 中等题 ").append(stats.getOrDefault("中等", 0)).append("道");
                summary.append(" | 困难题 ").append(stats.getOrDefault("困难", 0)).append("道\n");
            }
        }
        
        String prompt = String.format(
            "**智能教学改进建议生成**\n\n" +
            "您是一位资深的教育专家，请基于以下教学数据分析，为教师提供专业、实用的教学改进建议。\n\n" +
            "%s\n" +
            "**详细数据**\n" +
            "%s\n\n" +
            "**任务要求：**\n" +
            "请从以下维度进行深度分析并提出具体可行的改进建议：\n\n" +
            "1. **教学效果评估**\n" +
            "   - 分析整体教学成效\n" +
            "   - 识别优势和不足\n" +
            "   - 评估学生学习状况\n\n" +
            "2. **问题诊断与分析**\n" +
            "   - 学生成绩分布分析\n" +
            "   - 知识点掌握情况\n" +
            "   - 常见错误类型\n" +
            "   - 学习难点识别\n\n" +
            "3. **教学方法改进**\n" +
            "   - 课堂教学策略优化\n" +
            "   - 教学手段多样化建议\n" +
            "   - 互动方式改进\n" +
            "   - 因材施教方案\n\n" +
            "4. **考试与评价优化**\n" +
            "   - 题目难度调整建议\n" +
            "   - 考试类型多样化\n" +
            "   - 评价方式改进\n" +
            "   - 反馈机制完善\n\n" +
            "5. **具体实施方案**\n" +
            "   - 短期改进措施（1-2周内）\n" +
            "   - 中期改进计划（1个月内）\n" +
            "   - 长期发展目标（一学期内）\n" +
            "   - 效果评估指标\n\n" +
            "**输出要求：**\n" +
            "- 建议要具体可操作，避免空泛的理论\n" +
            "- 要针对数据中反映的实际问题\n" +
            "- 提供多种可选的改进方案\n" +
            "- 建议要符合实际教学条件\n" +
            "- 使用清晰的结构化格式\n" +
            "- 适当使用图标和强调格式提高可读性\n\n" +
            "请生成一份专业、全面、实用的教学改进建议报告。",
            summary.toString(), 
            analysisData
        );
        
        return callDeepSeekAPI(prompt);
    }
    
    /**
     * 获取分析范围的显示名称
     */
    private String getScopeDisplayName(String scope) {
        switch (scope) {
            case "COURSE": return "单个课程";
            case "SEMESTER": return "本学期";
            case "YEAR": return "本学年";
            default: return "未知范围";
        }
    }

    /**
     * 生成课程优化建议
     */
    public String generateCourseOptimizationSuggestions(String courseName, String courseDescription, 
                                                       double passRate, int totalAttempts, int passedAttempts,
                                                       String topErrorKnowledgePoint, double errorRate,
                                                       int examCount, List<String> recentExamTitles) {
        
        String prompt = String.format(
            "**课程优化建议分析任务**\n\n" +
            "您是一位资深的教育专家和课程设计顾问，请根据以下课程数据为《%s》课程提供专业的优化建议。\n\n" +
            "**课程基本信息：**\n" +
            "- 课程名称：%s\n" +
            "- 课程描述：%s\n\n" +
            "**学习效果统计：**\n" +
            "- 总体通过率：%.2f%%\n" +
            "- 总参与人次：%d\n" +
            "- 通过人次：%d\n" +
            "- 未通过人次：%d\n\n" +
            "**知识点掌握情况：**\n" +
            "- 最高错误率知识点：%s\n" +
            "- 该知识点错误率：%.2f%%\n\n" +
            "**考试安排情况：**\n" +
            "- 考试总数：%d\n" +
            "- 最近考试：%s\n\n" +
            "**请提供以下三个方面的专业建议：**\n\n" +
            "1. **教学质量优化建议**\n" +
            "   - 基于通过率分析教学效果\n" +
            "   - 针对性的教学改进措施\n" +
            "   - 教学方法和策略建议\n\n" +
            "2. **重点知识点强化建议**\n" +
            "   - 分析高错误率知识点的原因\n" +
            "   - 提供具体的教学改进方案\n" +
            "   - 推荐辅助学习资源和方法\n\n" +
            "3. **考试评估体系优化建议**\n" +
            "   - 基于考试频次和效果的分析\n" +
            "   - 考试设计和安排的改进建议\n" +
            "   - 多元化评估方式的建议\n\n" +
            "**输出要求：**\n" +
            "- 每个建议都要具体可操作，避免空泛的表述\n" +
            "- 结合数据分析，提供有针对性的解决方案\n" +
            "- 建议应该分为短期（1-2周）、中期（1-2个月）、长期（一学期）三个实施阶段\n" +
            "- 每个建议都应该包含预期效果和衡量标准\n" +
            "- 语言要专业但易懂，适合教育工作者理解和实施\n" +
            "- 使用清晰的结构化格式，便于阅读和实施\n\n" +
            "请基于以上数据，为这门课程提供详细的AI优化建议。",
            courseName, courseName, 
            courseDescription != null ? courseDescription : "暂无描述",
            passRate, totalAttempts, passedAttempts, (totalAttempts - passedAttempts),
            topErrorKnowledgePoint != null ? topErrorKnowledgePoint : "暂无数据",
            errorRate,
            examCount,
            recentExamTitles != null && !recentExamTitles.isEmpty() ? 
                String.join("、", recentExamTitles) : "暂无最近考试"
        );
        
        return callDeepSeekAPI(prompt);
    }
} 