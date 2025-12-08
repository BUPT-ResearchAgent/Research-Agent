package com.example.smartedu.controller;

import com.example.smartedu.dto.ApiResponse;
import com.example.smartedu.entity.Course;
import com.example.smartedu.entity.CourseMaterial;
import com.example.smartedu.entity.Student;
import com.example.smartedu.repository.CourseRepository;
import com.example.smartedu.repository.CourseMaterialRepository;
import com.example.smartedu.repository.StudentRepository;
import com.example.smartedu.service.CourseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;

import jakarta.servlet.http.HttpSession;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ai-helper")
@CrossOrigin(origins = "http://localhost:8080", allowCredentials = "true")
public class AIHelperController {

    @Autowired
    private StudentRepository studentRepository;
    
    @Autowired
    private CourseRepository courseRepository;
    
    @Autowired
    private CourseMaterialRepository courseMaterialRepository;
    
    @Autowired
    private CourseService courseService;
    
    private final RestTemplate restTemplate = new RestTemplate();
    
    // DeepSeek API配置
    @Value("${deepseek.api.url}")
    private String deepseekApiUrl;
    
    @Value("${deepseek.api.key}")
    private String deepseekApiKey;
    
    /**
     * 获取学生的课程列表
     */
    @GetMapping("/courses")
    public ApiResponse<List<Map<String, Object>>> getStudentCourses(HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("用户未登录，请重新登录");
            }
            
            String role = (String) session.getAttribute("role");
            if (!"student".equals(role)) {
                return ApiResponse.error("权限不足，非学生用户");
            }
            
            Student student = studentRepository.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("学生信息不存在"));
            
            List<Course> courses = courseService.getStudentCourses(student.getId());
            
            List<Map<String, Object>> courseList = courses.stream()
                    .map(course -> {
                        Map<String, Object> courseMap = new HashMap<>();
                        courseMap.put("id", course.getId());
                        courseMap.put("name", course.getName());
                        courseMap.put("code", course.getCourseCode());
                        courseMap.put("description", course.getDescription());
                        return courseMap;
                    })
                    .collect(Collectors.toList());
            
            return ApiResponse.success(courseList);
        } catch (Exception e) {
            return ApiResponse.error("获取课程列表失败: " + e.getMessage());
        }
    }
    
    /**
     * 获取指定课程的资料列表
     */
    @GetMapping("/materials/{courseId}")
    public ApiResponse<List<Map<String, Object>>> getCourseMaterials(@PathVariable Long courseId, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("用户未登录，请重新登录");
            }
            
            String role = (String) session.getAttribute("role");
            if (!"student".equals(role)) {
                return ApiResponse.error("权限不足，非学生用户");
            }
            
            // 验证学生是否加入了该课程
            Student student = studentRepository.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("学生信息不存在"));
            
            Course course = courseRepository.findById(courseId)
                    .orElseThrow(() -> new RuntimeException("课程不存在"));
            
            // 验证学生是否加入了该课程
            List<Course> studentCourses = courseService.getStudentCourses(student.getId());
            boolean isEnrolled = studentCourses.stream().anyMatch(c -> c.getId().equals(courseId));
            if (!isEnrolled) {
                return ApiResponse.error("您未加入该课程");
            }
            
            // 获取课程的实际资料
            List<CourseMaterial> courseMaterials = courseMaterialRepository.findByCourseIdOrderByUploadedAtDesc(courseId);
            
            List<Map<String, Object>> materials = new ArrayList<>();
            
            // 添加"全选"选项
            Map<String, Object> allMaterials = new HashMap<>();
            allMaterials.put("id", 0L);
            allMaterials.put("name", "全部资料");
            allMaterials.put("type", "all");
            allMaterials.put("description", "使用所有上传的课程资料");
            materials.add(allMaterials);
            
            // 添加实际的课程资料
            for (CourseMaterial material : courseMaterials) {
                Map<String, Object> materialMap = new HashMap<>();
                materialMap.put("id", material.getId());
                materialMap.put("name", material.getOriginalName() != null ? material.getOriginalName() : material.getFilename());
                materialMap.put("type", material.getMaterialType() != null ? material.getMaterialType().toLowerCase() : "document");
                materialMap.put("description", material.getDescription());
                materialMap.put("fileSize", material.getFileSize());
                materialMap.put("uploadedAt", material.getUploadedAt());
                materials.add(materialMap);
            }
            
            return ApiResponse.success(materials);
        } catch (Exception e) {
            return ApiResponse.error("获取课程资料失败: " + e.getMessage());
        }
    }

    // FIXME: 调用AI助手方法，未被使用！
    /**
     * 发送消息给AI助手
     */
    @PostMapping("/chat")
    public ApiResponse<Map<String, Object>> chatWithAI(@RequestBody Map<String, Object> request, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("用户未登录，请重新登录");
            }
            
            String role = (String) session.getAttribute("role");
            if (!"student".equals(role)) {
                return ApiResponse.error("权限不足，非学生用户");
            }
            
            String message = (String) request.get("message");
            Long courseId = request.get("courseId") != null ? 
                    Long.valueOf(request.get("courseId").toString()) : null;
            Long materialId = request.get("materialId") != null ? 
                    Long.valueOf(request.get("materialId").toString()) : null;
            
            if (message == null || message.trim().isEmpty()) {
                return ApiResponse.error("消息内容不能为空");
            }
            
            if (courseId == null) {
                return ApiResponse.error("请先选择课程");
            }
            
            // 验证学生是否加入了该课程
            Student student = studentRepository.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("学生信息不存在"));
            
            Course course = courseRepository.findById(courseId)
                    .orElseThrow(() -> new RuntimeException("课程不存在"));
            
            // 验证学生是否加入了该课程
            List<Course> studentCourses = courseService.getStudentCourses(student.getId());
            boolean isEnrolled = studentCourses.stream().anyMatch(c -> c.getId().equals(courseId));
            if (!isEnrolled) {
                return ApiResponse.error("您未加入该课程");
            }
            
            // 构建上下文信息
            String context = buildContext(course, materialId);
            
            // 调用DeepSeek API
            String aiResponse = callDeepSeekAPI(message, context);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", aiResponse);
            response.put("timestamp", System.currentTimeMillis());
            
            return ApiResponse.success(response);
        } catch (Exception e) {
            return ApiResponse.error("AI助手响应失败: " + e.getMessage());
        }
    }
    
    /**
     * 构建上下文信息
     */
    private String buildContext(Course course, Long materialId) {
        StringBuilder context = new StringBuilder();
        context.append("课程信息：\n");
        context.append("课程名称：").append(course.getName()).append("\n");
        context.append("课程代码：").append(course.getCourseCode()).append("\n");
        context.append("课程描述：").append(course.getDescription()).append("\n\n");
        
        // 添加资料内容
        if (materialId != null) {
            if (materialId == 0L) {
                // 全部资料
                List<CourseMaterial> allMaterials = courseMaterialRepository.findByCourseIdOrderByUploadedAtDesc(course.getId());
                if (!allMaterials.isEmpty()) {
                    context.append("课程资料内容：\n");
                    for (CourseMaterial material : allMaterials) {
                        context.append("【").append(material.getOriginalName() != null ? material.getOriginalName() : material.getFilename()).append("】\n");
                        if (material.getContent() != null && !material.getContent().trim().isEmpty()) {
                            // 发送完整的资料内容给AI
                            context.append(material.getContent()).append("\n\n");
                        }
                    }
                }
            } else {
                // 特定资料
                CourseMaterial material = courseMaterialRepository.findById(materialId).orElse(null);
                if (material != null) {
                    context.append("当前选择的学习资料：").append(material.getOriginalName() != null ? material.getOriginalName() : material.getFilename()).append("\n");
                    if (material.getContent() != null && !material.getContent().trim().isEmpty()) {
                        context.append("资料内容：\n").append(material.getContent()).append("\n\n");
                    }
                }
            }
        }
        
        context.append("请基于以上课程信息和资料内容回答学生的问题，提供准确、有帮助的学习指导。");
        
        return context.toString();
    }
    
    /**
     * 调用DeepSeek API
     */
    private String callDeepSeekAPI(String userMessage, String context) {
        try {
            // 构建请求体
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "deepseek-chat");
            
            List<Map<String, String>> messages = new ArrayList<>();
            
            // 系统消息
            Map<String, String> systemMessage = new HashMap<>();
            systemMessage.put("role", "system");
            systemMessage.put("content", "你是一个专业的学习助手，专门帮助学生解答课程相关问题。" + context);
            messages.add(systemMessage);
            
            // 用户消息
            Map<String, String> userMsg = new HashMap<>();
            userMsg.put("role", "user");
            userMsg.put("content", userMessage);
            messages.add(userMsg);
            
            requestBody.put("messages", messages);
            requestBody.put("max_tokens", 1000);
            requestBody.put("temperature", 0.7);
            
            // 设置请求头
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(deepseekApiKey);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            // 发送请求
            ResponseEntity<Map> response = restTemplate.postForEntity(deepseekApiUrl, entity, Map.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map<String, Object> choice = choices.get(0);
                    Map<String, Object> message = (Map<String, Object>) choice.get("message");
                    return (String) message.get("content");
                }
            }
            
            return "抱歉，AI助手暂时无法响应，请稍后再试。";
        } catch (Exception e) {
            System.err.println("调用DeepSeek API失败: " + e.getMessage());
            // 返回模拟响应，避免功能完全不可用
            return generateMockResponse(userMessage);
        }
    }
    
    /**
     * 生成模拟响应（当API调用失败时使用）
     */
    private String generateMockResponse(String userMessage) {
        String lowerMessage = userMessage.toLowerCase();
        
        if (lowerMessage.contains("什么") || lowerMessage.contains("是什么")) {
            return "这是一个很好的问题！根据课程内容，我建议您从以下几个方面来理解：\n\n" +
                   "1. 首先了解基本概念和定义\n" +
                   "2. 理解其在课程中的重要性\n" +
                   "3. 学习相关的应用场景\n" +
                   "4. 通过练习加深理解\n\n" +
                   "如果您需要更详细的解释，请告诉我具体想了解哪个方面。";
        } else if (lowerMessage.contains("怎么") || lowerMessage.contains("如何")) {
            return "关于您的问题，我建议采用以下学习方法：\n\n" +
                   "1. 📚 先阅读相关的课程资料\n" +
                   "2. 💡 理解核心概念和原理\n" +
                   "3. 🔍 查看具体的示例和案例\n" +
                   "4. ✍️ 通过练习巩固知识\n" +
                   "5. 🤔 思考实际应用场景\n\n" +
                   "建议您循序渐进，有任何疑问随时向我提问！";
        } else if (lowerMessage.contains("难") || lowerMessage.contains("不懂")) {
            return "我理解您遇到的困难。学习确实需要时间和耐心，让我来帮助您：\n\n" +
                   "🎯 **学习建议：**\n" +
                   "• 将复杂问题分解为小的部分\n" +
                   "• 从最基础的概念开始\n" +
                   "• 多做练习和实例\n" +
                   "• 不要害怕提问\n\n" +
                   "请告诉我具体哪个部分让您感到困难，我会提供更有针对性的帮助。";
        } else {
            return "感谢您的提问！基于您选择的课程内容，我为您提供以下学习指导：\n\n" +
                   "📖 **学习要点：**\n" +
                   "• 认真阅读课程资料\n" +
                   "• 理解核心概念\n" +
                   "• 多做练习巩固\n" +
                   "• 及时复习总结\n\n" +
                   "💡 **提示：** 如果您有更具体的问题，请详细描述，我会提供更精准的帮助！\n\n" +
                   "注：当前为演示模式，实际使用时会连接到DeepSeek AI进行智能问答。";
        }
    }
} 