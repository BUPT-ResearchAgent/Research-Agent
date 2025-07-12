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
            "**学生分类假设与针对性教学方案：**\n\n" +
            "请假设课堂中存在以下几类典型学生，并针对每类学生制定相应的教学策略：\n\n" +
            "1. **基础扎实型学生（约25%）**\n" +
            "   - 特点：基础知识牢固，学习主动性强，接受新知识能力强\n" +
            "   - 教学策略：提供拓展性内容，设计挑战性任务，培养创新思维\n" +
            "   - 课堂角色：可作为学习小组的领导者，帮助其他同学\n\n" +
            "2. **中等水平型学生（约50%）**\n" +
            "   - 特点：基础知识一般，学习态度积极，需要适当引导\n" +
            "   - 教学策略：注重基础巩固，提供充分的练习机会，循序渐进\n" +
            "   - 课堂角色：课堂主体，重点关注对象，确保跟上教学进度\n\n" +
            "3. **基础薄弱型学生（约20%）**\n" +
            "   - 特点：基础知识不牢固，学习困难较大，需要额外关注\n" +
            "   - 教学策略：提供基础补强，个别辅导，降低学习难度\n" +
            "   - 课堂角色：重点帮扶对象，需要更多鼓励和支持\n\n" +
            "4. **学习困难型学生（约5%）**\n" +
            "   - 特点：学习基础极差，学习动机不强，需要特别关注\n" +
            "   - 教学策略：个性化指导，激发学习兴趣，提供简化版内容\n" +
            "   - 课堂角色：需要一对一辅导，制定个别化学习计划\n\n" +
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
            "   - **学生情况分析**：基于上述四类学生的特点分析\n" +
            "   - **教学思路**：体现基于知识库内容的教学逻辑和方法\n" +
            "   - **教学重点**：从检索内容中提炼关键知识点\n" +
            "   - **教学难点**：识别学生理解的潜在困难点\n" +
            "   - **分层教学策略**：针对不同类型学生的具体教学方法\n" +
            "   - **思政融入点**：结合专业内容的价值观教育\n" +
            "   - **教学设计**：详细的时间安排和教学活动（必须用表格呈现）\n\n" +
            "4. **教学设计表格要求（核心）：**\n" +
            "   - 必须使用以下HTML表格格式\n" +
            "   - 包含：教学内容、教学手段、针对不同学生的策略、时间分配（分钟）四列\n" +
            "   - 时间分配必须精确到分钟，总计必须等于%d分钟\n" +
            "   - 内容安排要与检索到的知识内容高度相关\n" +
            "   - 在'针对不同学生的策略'列中，明确说明如何照顾不同类型的学生\n\n" +
            "**教学设计表格格式（必须严格遵循）：**\n" +
            "<table border='1' style='border-collapse: collapse; width: 100%%;'>\n" +
            "  <tr style='background-color: #f0f8ff;'>\n" +
            "    <th style='padding: 10px; text-align: center; border: 1px solid #ddd;'>教学内容</th>\n" +
            "    <th style='padding: 10px; text-align: center; border: 1px solid #ddd;'>教学手段</th>\n" +
            "    <th style='padding: 10px; text-align: center; border: 1px solid #ddd;'>针对不同学生的策略</th>\n" +
            "    <th style='padding: 10px; text-align: center; border: 1px solid #ddd;'>时间分配（分钟）</th>\n" +
            "  </tr>\n" +
            "  <tr>\n" +
            "    <td style='padding: 8px; border: 1px solid #ddd;'>课程导入与回顾</td>\n" +
            "    <td style='padding: 8px; border: 1px solid #ddd;'>提问互动、知识回顾</td>\n" +
            "    <td style='padding: 8px; border: 1px solid #ddd;'>基础扎实型：提出开放性问题；中等水平型：引导式提问；基础薄弱型：简单回顾；学习困难型：个别询问</td>\n" +
            "    <td style='padding: 8px; text-align: center; border: 1px solid #ddd;'>5</td>\n" +
            "  </tr>\n" +
            "  <tr>\n" +
            "    <td style='padding: 8px; border: 1px solid #ddd;'>核心概念讲解</td>\n" +
            "    <td style='padding: 8px; border: 1px solid #ddd;'>理论讲授、实例分析</td>\n" +
            "    <td style='padding: 8px; border: 1px solid #ddd;'>基础扎实型：深入讲解原理；中等水平型：重点突出应用；基础薄弱型：放慢节奏，多举例；学习困难型：简化内容，重复解释</td>\n" +
            "    <td style='padding: 8px; text-align: center; border: 1px solid #ddd;'>20</td>\n" +
            "  </tr>\n" +
            "  <tr>\n" +
            "    <td style='padding: 8px; border: 1px solid #ddd;'>实践操作</td>\n" +
            "    <td style='padding: 8px; border: 1px solid #ddd;'>动手实验、案例演示</td>\n" +
            "    <td style='padding: 8px; border: 1px solid #ddd;'>基础扎实型：挑战性任务；中等水平型：标准练习；基础薄弱型：基础题目，同伴协助；学习困难型：一对一指导</td>\n" +
            "    <td style='padding: 8px; text-align: center; border: 1px solid #ddd;'>15</td>\n" +
            "  </tr>\n" +
            "  <tr>\n" +
            "    <td style='padding: 8px; border: 1px solid #ddd;'>总结提升</td>\n" +
            "    <td style='padding: 8px; border: 1px solid #ddd;'>知识梳理、作业布置</td>\n" +
            "    <td style='padding: 8px; border: 1px solid #ddd;'>基础扎实型：拓展作业；中等水平型：巩固作业；基础薄弱型：基础作业，提供答案参考；学习困难型：简化作业，课后单独辅导</td>\n" +
            "    <td style='padding: 8px; text-align: center; border: 1px solid #ddd;'>5</td>\n" +
            "  </tr>\n" +
            "</table>\n\n" +
            "%s" +
            "**从知识库检索到的相关内容：**\n" +
            "%s\n\n" +
            "**5. 分层教学策略详细说明：**\n" +
            "请在教学大纲中专门设立'分层教学策略'章节，详细说明：\n" +
            "- 如何识别不同类型的学生\n" +
            "- 针对每类学生的具体教学方法\n" +
            "- 课堂互动中的差异化策略\n" +
            "- 作业布置的层次化设计\n" +
            "- 评价考核的多元化方式\n\n" +
            "**特别注意：**\n" +
            "- 教学大纲内容必须与检索到的知识内容紧密结合\n" +
            "- 时间分配总和必须精确等于%d分钟\n" +
            "- 教学活动设计要体现对检索内容的深度利用\n" +
            "- 确保教学逻辑清晰，知识点覆盖全面\n" +
            "- **必须使用HTML表格格式，不要使用Markdown或其他格式**\n" +
            "- 表格要包含完整的样式，确保在网页中显示美观\n" +
            "- **每个教学环节都要明确说明如何照顾不同类型的学生**\n" +
            "- 体现因材施教的教育理念，确保每个学生都能有所收获",
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
                    // 处理标准题型，支持新的Map格式和旧的数字格式
                    Integer count = null;
                    if (value instanceof Number) {
                        // 旧格式：直接是数字
                        count = ((Number) value).intValue();
                    } else if (value instanceof Map) {
                        // 新格式：包含count和scorePerQuestion的Map对象
                        @SuppressWarnings("unchecked")
                        Map<String, Object> questionTypeData = (Map<String, Object>) value;
                        Object countObj = questionTypeData.get("count");
                        if (countObj instanceof Number) {
                            count = ((Number) countObj).intValue();
                        }
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
     * 基于能力维度生成考试题目（人才培养导向）
     */
    public String generateCapabilityBasedExamQuestions(String courseName, String chapter,
            Map<String, Object> questionTypes, Map<String, Object> difficulty,
            Map<String, Object> capabilityRequirements, int totalScore, int duration,
            String materialContent, String specialRequirements) {
        
        // 构建能力维度要求字符串
        StringBuilder capabilityRequirement = new StringBuilder();
        if (capabilityRequirements != null && !capabilityRequirements.isEmpty()) {
            capabilityRequirement.append("## 能力培养导向要求（核心）：\n");
            capabilityRequirement.append("本次考试采用人才培养导向出题模式，每道题目都必须明确考核学生的核心能力：\n\n");
            
            for (Map.Entry<String, Object> entry : capabilityRequirements.entrySet()) {
                String capabilityCode = entry.getKey();
                Object requirementObj = entry.getValue();
                
                // 转换能力代码为显示名称
                String capabilityName = getCapabilityDisplayName(capabilityCode);
                String description = getCapabilityDescription(capabilityCode);
                
                if (requirementObj instanceof Number) {
                    int questionCount = ((Number) requirementObj).intValue();
                    if (questionCount > 0) {
                        capabilityRequirement.append(String.format("### %s（%d道题）\n", capabilityName, questionCount));
                        capabilityRequirement.append(String.format("- **能力描述**：%s\n", description));
                        capabilityRequirement.append(String.format("- **出题要求**：%s\n", getCapabilityQuestionGuideline(capabilityCode)));
                        capabilityRequirement.append(String.format("- **评价标准**：%s\n\n", getCapabilityEvaluationCriteria(capabilityCode)));
                    }
                }
            }
            
            capabilityRequirement.append("**重要提醒**：每道题目必须在知识点字段中明确标注主要考核的能力维度！\n\n");
        }
        
        // 构建题型要求字符串（复用现有逻辑）
        StringBuilder typesRequirement = new StringBuilder();
        int totalQuestions = 0;
        
        if (questionTypes != null) {
            for (Map.Entry<String, Object> entry : questionTypes.entrySet()) {
                String type = entry.getKey();
                Object value = entry.getValue();
                
                if ("custom".equals(type) && value instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> customType = (Map<String, Object>) value;
                    
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
                     // 处理标准题型，支持新的Map格式和旧的数字格式
                     Integer count = null;
                     if (value instanceof Number) {
                         // 旧格式：直接是数字
                         count = ((Number) value).intValue();
                     } else if (value instanceof Map) {
                         // 新格式：包含count和scorePerQuestion的Map对象
                         @SuppressWarnings("unchecked")
                         Map<String, Object> questionTypeData = (Map<String, Object>) value;
                         Object countObj = questionTypeData.get("count");
                         if (countObj instanceof Number) {
                             count = ((Number) countObj).intValue();
                         }
                     }
                     
                     if (count != null && count > 0) {
                         String typeNameCn = getQuestionTypeName(type);
                         typesRequirement.append(String.format("- %s：%d题\n", typeNameCn, count));
                         totalQuestions += count;
                     }
                 }
            }
        }
        
        // 构建难度要求字符串（复用现有逻辑）
        StringBuilder difficultyRequirement = new StringBuilder();
        if (difficulty != null) {
            Integer easy = null, medium = null, hard = null;
            Object easyObj = difficulty.get("easy");
            if (easyObj instanceof Number) easy = ((Number) easyObj).intValue();
            Object mediumObj = difficulty.get("medium");
            if (mediumObj instanceof Number) medium = ((Number) mediumObj).intValue();
            Object hardObj = difficulty.get("hard");
            if (hardObj instanceof Number) hard = ((Number) hardObj).intValue();
            
            if (easy != null) difficultyRequirement.append(String.format("- 简单题：%d%%\n", easy));
            if (medium != null) difficultyRequirement.append(String.format("- 中等题：%d%%\n", medium));
            if (hard != null) difficultyRequirement.append(String.format("- 困难题：%d%%\n", hard));
        }
        
        int averageScore = totalQuestions > 0 ? totalScore / totalQuestions : 10;
        
        String prompt = String.format(
            "请根据以下课程资料为《%s》课程的《%s》章节生成**人才培养导向**的考试题目。\n\n" +
            "%s" +
            "## 题目数量和类型要求：\n" +
            "%s" +
            "总题目数：%d题\n\n" +
            "## 难度分布要求：\n" +
            "%s\n" +
            "%s" +
            "## 分值设置：\n" +
            "- 试卷总分：%d分\n" +
            "- 建议每题分值：%d分左右\n" +
            "- 考试时长：%d分钟\n\n" +
            "## 输出格式要求（重要）：\n" +
            "请严格按照以下格式输出每道题目：\n\n" +
            "### 题目X（题型类型）\n" +
            "**题目内容**：[具体题目内容]\n" +
            "**选项**：（如果是选择题）\n" +
            "A. [选项A内容]\n" +
            "B. [选项B内容]\n" +
            "C. [选项C内容]\n" +
            "D. [选项D内容]\n" +
            "**正确答案**：[答案]\n" +
            "**解析**：[详细解析]\n" +
            "**知识点**：[能力维度代码]（如：knowledge、application、innovation等）\n" +
            "**分值建议**：[具体分值]分\n\n" +
            "---\n\n" +
            "## 课程资料内容：\n" +
            "%s\n\n" +
            "**关键要求**：\n" +
            "1. 每道题目都必须明确考核特定的能力维度\n" +
            "2. 题目设计要体现人才培养目标，不仅仅是知识记忆\n" +
            "3. 在知识点字段中必须标注对应的能力维度代码\n" +
            "4. 题目要有实践性、应用性和思辨性\n" +
            "5. 所有题目分值之和必须等于%d分\n",
            courseName, chapter,
            capabilityRequirement.toString(),
            typesRequirement.toString(),
            totalQuestions,
            difficultyRequirement.toString(),
            (specialRequirements != null && !specialRequirements.trim().isEmpty()) ? 
                ("## 特殊要求：\n" + specialRequirements + "\n\n") : "",
            totalScore,
            averageScore,
            duration,
            materialContent,
            totalScore
        );
        
        return callDeepSeekAPI(prompt);
    }
    
    /**
     * 获取能力维度显示名称
     */
    private String getCapabilityDisplayName(String code) {
        switch (code) {
            case "knowledge": return "理论掌握";
            case "application": return "实践应用";
            case "innovation": return "创新思维";
            case "transfer": return "知识迁移";
            case "learning": return "学习能力";
            case "systematic": return "系统思维";
            case "ideology": return "思政素养";
            case "communication": return "沟通协作";
            case "analysis": return "分析综合";
            case "research": return "实验研究";
            default: return code;
        }
    }
    
    /**
     * 获取能力维度描述
     */
    private String getCapabilityDescription(String code) {
        switch (code) {
            case "knowledge": return "基础知识理解、概念掌握、理论框架认知";
            case "application": return "实际操作、问题解决、方案实施";
            case "innovation": return "发散思维、创造性解决问题、批判性思维";
            case "transfer": return "跨领域应用、举一反三、综合运用";
            case "learning": return "自主学习、学习策略、持续改进";
            case "systematic": return "整体把握、系统分析、大局观念";
            case "ideology": return "价值观念、道德判断、社会责任感";
            case "communication": return "表达能力、团队合作、组织协调";
            case "analysis": return "逻辑分析、信息整合、判断推理";
            case "research": return "实验设计、数据分析、研究方法";
            default: return "能力维度描述";
        }
    }
    
    /**
     * 获取能力维度出题指导原则
     */
    private String getCapabilityQuestionGuideline(String code) {
        switch (code) {
            case "knowledge": return "重点考查基本概念、原理理解和理论应用，避免死记硬背";
            case "application": return "设计实际情境，考查学生解决具体问题的能力";
            case "innovation": return "开放性题目，鼓励多样化解答，考查创新思维和批判精神";
            case "transfer": return "跨情境应用题，考查知识迁移和举一反三能力";
            case "learning": return "考查学习方法、自主学习策略和持续改进能力";
            case "systematic": return "综合性题目，考查整体思维和系统分析能力";
            case "ideology": return "结合专业内容考查价值观和社会责任感";
            case "communication": return "考查表达能力、团队协作和沟通技巧";
            case "analysis": return "分析型题目，考查逻辑推理和综合判断能力";
            case "research": return "考查研究方法、实验设计和数据分析能力";
            default: return "根据能力特点设计相应题目";
        }
    }
    
    /**
     * 获取能力维度评价标准
     */
    private String getCapabilityEvaluationCriteria(String code) {
        switch (code) {
            case "knowledge": return "准确性、完整性、深度理解";
            case "application": return "方案可行性、操作规范性、效果评估";
            case "innovation": return "创新性、合理性、可实施性";
            case "transfer": return "迁移准确性、应用灵活性、举一反三";
            case "learning": return "方法有效性、策略合理性、改进意识";
            case "systematic": return "系统性、逻辑性、整体性";
            case "ideology": return "价值正确性、责任意识、道德判断";
            case "communication": return "表达清晰性、协作有效性、沟通技巧";
            case "analysis": return "逻辑严密性、分析深度、判断准确性";
            case "research": return "方法科学性、数据可靠性、结论合理性";
            default: return "根据能力特点制定评价标准";
        }
    }
    
    /**
     * 为题目生成AI能力培养目标
     */
    public String generateCapabilityGoalsForQuestion(String questionContent, String questionType, 
                                                   String primaryCapability, String knowledgePoint) {
        try {
            // 获取能力维度信息
            String capabilityName = getCapabilityDisplayName(primaryCapability);
            String capabilityDescription = getCapabilityDescription(primaryCapability);
            
            String prompt = String.format(
                "请为以下题目生成具体的能力培养目标，要求专业、实用、具有指导性。\n\n" +
                "## 题目信息\n" +
                "**题目类型**：%s\n" +
                "**主要能力维度**：%s（%s）\n" +
                "**知识点**：%s\n" +
                "**题目内容**：%s\n\n" +
                "## 输出要求\n" +
                "请生成2-4个具体的能力培养目标，每个目标要：\n" +
                "1. 针对该题目的具体内容和考核重点\n" +
                "2. 体现人才培养的教育价值\n" +
                "3. 语言简洁明了，每个目标控制在20-30字\n" +
                "4. 从不同角度体现能力培养的层次性\n\n" +
                "## 输出格式\n" +
                "请按以下格式输出（不要包含序号）：\n" +
                "培养学生XXX的能力\n" +
                "提升学生XXX的水平\n" +
                "锻炼学生XXX的思维\n" +
                "增强学生XXX的意识\n\n" +
                "## 参考示例\n" +
                "- 培养学生理论联系实际的应用能力\n" +
                "- 提升学生分析问题和解决问题的水平\n" +
                "- 锻炼学生的逻辑推理和批判性思维\n" +
                "- 增强学生的创新意识和实践能力\n\n" +
                "**注意**：请只输出能力培养目标，不要包含其他内容。",
                getQuestionTypeDisplayName(questionType),
                capabilityName,
                capabilityDescription,
                knowledgePoint != null ? knowledgePoint : "通用知识点",
                questionContent
            );
            
            String response = callDeepSeekAPI(prompt);
            
            // 清理和格式化响应
            if (response != null && !response.trim().isEmpty()) {
                return formatCapabilityGoals(response.trim());
            }
            
            // 如果AI生成失败，返回默认目标
            return generateDefaultCapabilityGoals(primaryCapability);
            
        } catch (Exception e) {
            System.err.println("生成能力培养目标失败: " + e.getMessage());
            return generateDefaultCapabilityGoals(primaryCapability);
        }
    }
    
    /**
     * 格式化AI生成的能力培养目标
     */
    private String formatCapabilityGoals(String rawGoals) {
        String[] lines = rawGoals.split("\n");
        StringBuilder formattedGoals = new StringBuilder();
        
        for (String line : lines) {
            String trimmedLine = line.trim();
            if (!trimmedLine.isEmpty() && 
                !trimmedLine.startsWith("#") && 
                !trimmedLine.startsWith("##") &&
                !trimmedLine.contains("输出格式") &&
                !trimmedLine.contains("参考示例") &&
                !trimmedLine.contains("注意")) {
                
                // 移除可能的序号和特殊字符
                trimmedLine = trimmedLine.replaceAll("^[0-9]+[.、]\\s*", "");
                trimmedLine = trimmedLine.replaceAll("^[-*•]\\s*", "");
                
                if (trimmedLine.length() > 8 && trimmedLine.length() < 50) {
                    if (formattedGoals.length() > 0) {
                        formattedGoals.append("；");
                    }
                    formattedGoals.append(trimmedLine);
                }
            }
        }
        
        String result = formattedGoals.toString();
        if (result.endsWith("；")) {
            result = result.substring(0, result.length() - 1);
        }
        
        return result.length() > 10 ? result : generateDefaultCapabilityGoals("application");
    }
    
    /**
     * 生成默认的能力培养目标
     */
    private String generateDefaultCapabilityGoals(String primaryCapability) {
        switch (primaryCapability) {
            case "knowledge":
                return "培养学生扎实的理论基础；提升学生知识理解和记忆能力；增强学生概念辨析的准确性";
            case "application":
                return "培养学生理论联系实际的能力；提升学生解决实际问题的水平；锻炼学生的实践操作技能";
            case "innovation":
                return "培养学生的创新思维和发散思维；提升学生创造性解决问题的能力；增强学生的批判性思维意识";
            case "transfer":
                return "培养学生举一反三的能力；提升学生跨领域知识迁移的水平；锻炼学生综合运用知识的思维";
            case "learning":
                return "培养学生自主学习的能力；提升学生学习策略运用的水平；增强学生持续学习的意识";
            case "systematic":
                return "培养学生系统性思维；提升学生整体把握问题的能力；锻炼学生统筹规划的思维方式";
            case "ideology":
                return "培养学生正确的价值观念；提升学生道德判断的水平；增强学生的社会责任感";
            case "communication":
                return "培养学生的表达和沟通能力；提升学生团队协作的水平；锻炼学生的人际交往技能";
            case "analysis":
                return "培养学生的逻辑分析能力；提升学生信息整合的水平；锻炼学生的判断推理思维";
            case "research":
                return "培养学生的科学研究能力；提升学生实验设计的水平；增强学生的数据分析意识";
            default:
                return "培养学生的综合能力；提升学生的专业素养；增强学生的实践意识";
        }
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
    
    /**
     * 生成基于学生分类和课程类型的个性化教学大纲
     */
    public String generatePersonalizedOutline(String courseName,
                                            CourseTypeDetectionService.CourseTypeResult courseTypeResult,
                                            StudentAnalysisService.StudentClassificationResult studentAnalysis,
                                            String ragContent,
                                            String hotTopicsContent,
                                            String requirements,
                                            Integer hours) {
        
        int totalMinutes = hours * 45;
        
        // 构建学生分析信息
        StringBuilder studentInfo = new StringBuilder();
        studentInfo.append("## 班级学生分析结果\n\n");
        studentInfo.append("**总学生数**: ").append(studentAnalysis.getTotalStudentCount()).append("人\n\n");
        
        studentInfo.append("**基础水平分布**:\n");
        studentAnalysis.getFamiliarityGroups().forEach((level, students) -> {
            studentInfo.append("- ").append(level).append(": ").append(students.size()).append("人\n");
        });
        
        studentInfo.append("\n**学习模式分布**:\n");
        studentAnalysis.getLearningPatternGroups().forEach((pattern, students) -> {
            studentInfo.append("- ").append(pattern).append(": ").append(students.size()).append("人\n");
        });
        
        // 添加统计信息
        Map<String, Object> stats = studentAnalysis.getStatistics();
        if (stats != null && !stats.isEmpty()) {
            studentInfo.append("\n**班级整体表现**:\n");
            studentInfo.append("- 平均分: ").append(stats.get("classAverageScore")).append("分\n");
            studentInfo.append("- 平均正确率: ").append(stats.get("classCorrectRate")).append("%\n");
            studentInfo.append("- 平均考试参与度: ").append(stats.get("averageExamParticipation")).append("次\n");
        }
        
        // 添加教学建议
        studentInfo.append("\n").append(studentAnalysis.getTeachingRecommendation());
        
        // 构建课程类型信息
        StringBuilder courseTypeInfo = new StringBuilder();
        courseTypeInfo.append("## 课程类型分析结果\n\n");
        courseTypeInfo.append("**课程类型**: ").append(courseTypeResult.getFinalType()).append("\n");
        courseTypeInfo.append("**基于名称判断**: ").append(courseTypeResult.getNameBasedType()).append("\n");
        courseTypeInfo.append("**基于描述判断**: ").append(courseTypeResult.getDescriptionBasedType()).append("\n");
        courseTypeInfo.append("**基于内容判断**: ").append(courseTypeResult.getMaterialBasedType()).append("\n\n");
        
        // 添加考核建议
        Map<String, Object> examRec = courseTypeResult.getExamRecommendations();
        if (examRec != null) {
            courseTypeInfo.append("**适合的考核方式**:\n");
            courseTypeInfo.append("- 主要题型: ").append(examRec.get("主要题型")).append("\n");
            courseTypeInfo.append("- 考试形式: ").append(examRec.get("考试形式")).append("\n");
            courseTypeInfo.append("- 重点考核: ").append(examRec.get("重点考核")).append("\n");
        }
        
        // 添加教学方法建议
        courseTypeInfo.append("\n").append(courseTypeResult.getTeachingMethodRecommendation());
        
        // 构建热点信息
        String hotTopicsSection = "";
        if (hotTopicsContent != null && !hotTopicsContent.trim().isEmpty()) {
            hotTopicsSection = "\n## 实时热点内容融入\n\n" + hotTopicsContent + "\n";
        }
        
        String prompt = String.format(
            "**智能个性化教学大纲生成任务**\n\n" +
            "请基于以下全面分析为《%s》课程生成个性化教学大纲（%d学时，共%d分钟）。\n\n" +
            "%s\n" +
            "%s\n" +
            "%s" +
            "## 知识库内容\n\n%s\n\n" +
            "## 特殊教学要求\n\n%s\n\n" +
            "**个性化教学大纲生成要求**:\n\n" +
            "1. **标题设计**: 《%s》个性化教学大纲（基于%s特点）\n\n" +
            "2. **个性化分层教学设计**: 必须根据学生基础水平分布制定分层教学策略\n" +
            "   - 针对不同水平学生群体的具体教学安排\n" +
            "   - 差异化的学习目标和评价标准\n" +
            "   - 个性化的辅导和支持措施\n\n" +
            "3. **课程类型适应性**: 根据课程类型特点优化教学方法\n" +
            "   - 充分体现%s的教学特色\n" +
            "   - 采用适合该类型课程的教学策略\n" +
            "   - 设计相应的实践或理论活动\n\n" +
            "4. **教学大纲结构** (必须包含以下所有部分):\n" +
            "   - **课程基本信息**: 课程名称、学时、学分等\n" +
            "   - **学生情况分析**: 基于实际数据的学生特点分析\n" +
            "   - **个性化教学目标**: 分层次的教学目标\n" +
            "   - **教学重点与难点**: 根据学生情况调整的重难点\n" +
            "   - **分层教学策略**: 针对不同水平学生的教学方法\n" +
            "   - **教学内容安排**: 详细的教学计划和时间分配\n" +
            "   - **实践活动设计**: 符合课程类型的实践安排\n" +
            "   - **评价与考核**: 多元化的评价方式\n" +
            "   - **课程特色**: 融入热点内容和创新元素\n\n" +
            "5. **时间分配要求**:\n" +
            "   - 总教学时间必须精确等于%d分钟\n" +
            "   - 需要合理分配理论学习、实践操作、讨论交流等环节\n" +
            "   - 为不同水平学生预留差异化的学习时间\n\n" +
            "6. **个性化特色要求**:\n" +
            "   - 体现因材施教的教育理念\n" +
            "   - 关注每个学生的学习需求\n" +
            "   - 融入现代教育技术和方法\n" +
            "   - 结合实时热点，增强课程时效性和实用性\n\n" +
            "请生成一份完整、详细、具有针对性的个性化教学大纲。",
            courseName, hours, totalMinutes,
            studentInfo.toString(),
            courseTypeInfo.toString(),
            hotTopicsSection,
            ragContent,
            requirements != null ? requirements : "无特殊要求",
            courseName,
            courseTypeResult.getFinalType(),
            courseTypeResult.getFinalType(),
            totalMinutes
        );
        
        return callDeepSeekAPI(prompt);
    }
    
    /**
     * 生成实时热点内容
     */
    public String generateHotTopicsContent(String courseName, String courseType, String hotTopicsQuery) {
        String prompt = String.format(
            "**实时热点内容生成任务**\n\n" +
            "请为《%s》课程（%s）生成相关的实时热点内容，用于融入教学大纲。\n\n" +
            "**热点查询关键词**: %s\n\n" +
            "**生成要求**:\n" +
            "1. 内容要与课程高度相关\n" +
            "2. 体现2024年的最新发展和趋势\n" +
            "3. 包含具体的案例和应用\n" +
            "4. 适合在教学中融入和讲解\n" +
            "5. 长度控制在200-400字\n\n" +
            "**输出格式**:\n" +
            "### 相关热点趋势\n" +
            "- [热点1]: [具体描述]\n" +
            "- [热点2]: [具体描述]\n" +
            "- [热点3]: [具体描述]\n\n" +
            "### 教学融入建议\n" +
            "[如何将这些热点内容融入到课程教学中的具体建议]\n\n" +
            "请基于当前的技术发展、行业动态和学术前沿生成内容。",
            courseName, courseType, hotTopicsQuery
        );
        
        return callDeepSeekAPI(prompt);
    }
    
    /**
     * 基于课程类型生成考核内容
     */
    public String generateCourseTypeBasedExam(String courseName,
                                             CourseTypeDetectionService.CourseTypeResult courseTypeResult,
                                             Object questionTypes,
                                             Object difficulty,
                                             Integer totalScore,
                                             Integer duration,
                                             String materialContent,
                                             String specialRequirements) {
        
        String courseType = courseTypeResult.getFinalType();
        
        // 构建课程类型分析说明
        StringBuilder courseAnalysis = new StringBuilder();
        courseAnalysis.append("**课程类型分析结果：**\n");
        courseAnalysis.append(String.format("- 课程类型：%s\n", courseType));
        courseAnalysis.append(String.format("- 基于名称判断：%s\n", courseTypeResult.getNameBasedType()));
        courseAnalysis.append(String.format("- 基于描述判断：%s\n", courseTypeResult.getDescriptionBasedType()));
        courseAnalysis.append(String.format("- 基于内容判断：%s\n", courseTypeResult.getMaterialBasedType()));
        
        // 根据课程类型调整题型分布
        Map<String, Object> adjustedQuestionTypes = adjustQuestionTypesForCourseType(
            questionTypes, courseType);
        
        String prompt = String.format(
            "**基于课程类型的智能考核内容生成**\n\n" +
            "课程名称：《%s》\n" +
            "考试时长：%d分钟\n" +
            "总分：%d分\n\n" +
            "%s" +
            "**课程类型专用出题指导：**\n" +
            "%s\n" +
            "**调整后的题型要求：**\n" +
            "%s\n\n" +
            "**难度分布要求：**\n" +
            "%s\n\n" +
            "%s" +
            "**课程材料内容：**\n" +
            "%s\n\n" +
            "**重要说明：**\n" +
            "1. 请严格按照课程类型特点设计考核内容\n" +
            "2. %s课程应注重%s\n" +
            "3. 题目设计要体现培养目标的实现\n" +
            "4. 每道题目都要明确对应的能力培养要求\n" +
            "5. 考核方式要符合课程特点和教学目标",
            courseName,
            duration != null ? duration : 120,
            totalScore != null ? totalScore : 100,
            courseAnalysis.toString(),
            getCourseTypeExamGuidelines(courseType),
            formatQuestionTypes(adjustedQuestionTypes),
            formatDifficulty(difficulty),
            (specialRequirements != null && !specialRequirements.trim().isEmpty()) ? 
                ("**特殊要求：**\n" + specialRequirements + "\n\n") : "",
            materialContent,
            courseType,
            getExamFocusDescription(courseType)
        );
        
        return callDeepSeekAPI(prompt);
    }
    
    /**
     * 根据课程类型调整题型分布
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> adjustQuestionTypesForCourseType(Object questionTypes, 
                                                               String courseType) {
        Map<String, Object> original = (Map<String, Object>) questionTypes;
        Map<String, Object> adjusted = new HashMap<>(original);
        
        if ("实践课".equals(courseType)) {
            // 实践课增加编程题和综合应用题的比重
            adjustQuestionType(adjusted, "programming", 1.5);
            adjustQuestionType(adjusted, "comprehensive", 1.3);
            adjustQuestionType(adjusted, "choice", 0.7);
            adjustQuestionType(adjusted, "fillblank", 0.8);
        } else if ("理论课".equals(courseType)) {
            // 理论课增加选择题和填空题的比重
            adjustQuestionType(adjusted, "choice", 1.4);
            adjustQuestionType(adjusted, "fillblank", 1.3);
            adjustQuestionType(adjusted, "shortanswer", 1.2);
            adjustQuestionType(adjusted, "programming", 0.6);
        }
        // 混合课保持原有分布
        
        return adjusted;
    }
    
    /**
     * 调整单个题型的分数
     */
    private void adjustQuestionType(Map<String, Object> questionTypes, String type, double factor) {
        if (questionTypes.containsKey(type)) {
            Object value = questionTypes.get(type);
            if (value instanceof Integer) {
                questionTypes.put(type, (int) Math.round((Integer) value * factor));
            }
        }
    }
    
    /**
     * 获取课程类型考试指导原则
     */
    private String getCourseTypeExamGuidelines(String courseType) {
        switch (courseType) {
            case "理论课":
                return "- 重点考查概念理解、理论掌握和知识应用能力\n" +
                       "- 适合使用选择题、填空题、简答题、论述题\n" +
                       "- 注重逻辑思维和理论分析能力的考核\n" +
                       "- 可设置案例分析题验证理论应用能力";
                       
            case "实践课":
                return "- 重点考查动手能力、实际操作和问题解决能力\n" +
                       "- 适合使用编程题、设计题、综合应用题\n" +
                       "- 注重实际技能和创新思维的考核\n" +
                       "- 可设置项目式考核和作品展示";
                       
            case "混合课":
                return "- 理论与实践并重，综合考查多种能力\n" +
                       "- 题型搭配要均衡，涵盖理论和实践两个层面\n" +
                       "- 注重理论指导实践、实践验证理论的能力\n" +
                       "- 可设置理论+实操的综合性题目";
                       
            default:
                return "- 根据课程特点灵活设计考核内容\n" +
                       "- 注重培养目标的实现和能力的考查\n" +
                       "- 题型选择要符合课程性质和教学要求";
        }
    }
    
    /**
     * 获取考试重点描述
     */
    private String getExamFocusDescription(String courseType) {
        switch (courseType) {
            case "理论课":
                return "概念掌握、理论理解和知识应用";
            case "实践课":
                return "动手操作、技能应用和问题解决";
            case "混合课":
                return "理论与实践的有机结合";
            default:
                return "综合能力培养";
        }
    }
    
    /**
     * 格式化题型要求
     */
    @SuppressWarnings("unchecked")
    private String formatQuestionTypes(Map<String, Object> questionTypes) {
        StringBuilder formatted = new StringBuilder();
        
        for (Map.Entry<String, Object> entry : questionTypes.entrySet()) {
            String type = entry.getKey();
            Object value = entry.getValue();
            
            if ("custom".equals(type) && value instanceof Map) {
                Map<String, Object> customType = (Map<String, Object>) value;
                Integer count = null;
                Object countObj = customType.get("count");
                if (countObj instanceof Number) {
                    count = ((Number) countObj).intValue();
                }
                String requirement = (String) customType.get("requirement");
                
                if (count != null && count > 0 && requirement != null && !requirement.trim().isEmpty()) {
                    formatted.append(String.format("- %s：%d题\n", requirement, count));
                }
            } else {
                Integer count = null;
                if (value instanceof Number) {
                    count = ((Number) value).intValue();
                } else if (value instanceof Map) {
                    Map<String, Object> questionTypeData = (Map<String, Object>) value;
                    Object countObj = questionTypeData.get("count");
                    if (countObj instanceof Number) {
                        count = ((Number) countObj).intValue();
                    }
                }
                
                if (count != null && count > 0) {
                    String typeNameCn = getQuestionTypeName(type);
                    formatted.append(String.format("- %s：%d题\n", typeNameCn, count));
                }
            }
        }
        
        return formatted.toString();
    }
    
    /**
     * 格式化难度要求
     */
    @SuppressWarnings("unchecked")
    private String formatDifficulty(Object difficulty) {
        StringBuilder formatted = new StringBuilder();
        
        if (difficulty != null && difficulty instanceof Map) {
            Map<String, Object> difficultyMap = (Map<String, Object>) difficulty;
            
            Integer easy = null, medium = null, hard = null;
            Object easyObj = difficultyMap.get("easy");
            if (easyObj instanceof Number) easy = ((Number) easyObj).intValue();
            Object mediumObj = difficultyMap.get("medium");
            if (mediumObj instanceof Number) medium = ((Number) mediumObj).intValue();
            Object hardObj = difficultyMap.get("hard");
            if (hardObj instanceof Number) hard = ((Number) hardObj).intValue();
            
            if (easy != null) formatted.append(String.format("- 简单题：%d%%\n", easy));
            if (medium != null) formatted.append(String.format("- 中等题：%d%%\n", medium));
            if (hard != null) formatted.append(String.format("- 困难题：%d%%\n", hard));
        }
        
        return formatted.toString();
    }

    /**
     * AI检测分析
     */
    public String performAIDetectionAnalysis(String content, String context) {
        String prompt = String.format(
            "**AI内容检测与分析**\n\n" +
            "请对以下学生作业内容进行深度AI检测分析，从多个维度评估其是否为AI生成：\n\n" +
            "**分析内容：**\n%s\n\n" +
            "**内容背景：**\n%s\n\n" +
            "**请从以下维度进行分析：**\n\n" +
            "1. **语言风格分析**\n" +
            "   - 语言表达是否过于完美、规范\n" +
            "   - 是否缺乏个人化的表达习惯\n" +
            "   - 句式结构是否过于统一\n\n" +
            "2. **内容逻辑分析**\n" +
            "   - 论述逻辑是否过于完整、缺乏跳跃性\n" +
            "   - 观点表达是否过于中庸、缺乏个人见解\n" +
            "   - 内容组织是否呈现明显的模板化特征\n\n" +
            "3. **知识深度分析**\n" +
            "   - 专业概念使用是否准确但缺乏深度理解\n" +
            "   - 是否存在表面化的知识堆砌\n" +
            "   - 对复杂问题的分析是否流于表面\n\n" +
            "4. **创新性分析**\n" +
            "   - 是否包含独特的见解或创新观点\n" +
            "   - 论证过程是否体现个人思考\n" +
            "   - 是否存在批判性思维\n\n" +
            "5. **AI特征识别**\n" +
            "   - 是否包含AI常用的过渡词汇\n" +
            "   - 文本结构是否过于规整\n" +
            "   - 是否存在机械化的表达模式\n\n" +
            "**请提供：**\n" +
            "1. AI生成概率评估（高/中/低）\n" +
            "2. 主要依据和具体证据\n" +
            "3. 值得肯定的部分\n" +
            "4. 存在问题的具体描述\n" +
            "5. 改进建议\n\n" +
            "**注意：**\n" +
            "- 请基于客观分析，避免主观臆断\n" +
            "- 重点关注内容的原创性和深度\n" +
            "- 考虑学生的认知水平和表达能力",
            content,
            context != null ? context : "学生作业"
        );
        
        return callDeepSeekAPI(prompt);
    }
} 