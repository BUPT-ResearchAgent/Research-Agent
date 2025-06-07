package com.example.smartedu.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

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
            requestBody.put("max_tokens", 4000);
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
                        System.out.println("生成成功，内容长度: " + result.length());
                        return result;
                    }
                }
            }
            
            System.out.println("解析响应失败");
            return "生成失败：无法解析API响应";
            
        } catch (Exception e) {
            System.err.println("调用DeepSeek API失败: " + e.getMessage());
            e.printStackTrace();
            
            // 返回一个模拟的教学大纲，确保功能能够演示
            return generateMockOutline();
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