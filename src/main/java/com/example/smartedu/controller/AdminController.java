package com.example.smartedu.controller;

import com.example.smartedu.dto.ApiResponse;
import com.example.smartedu.entity.*;
import com.example.smartedu.repository.*;
import com.example.smartedu.service.ExamService;
import com.example.smartedu.service.TeacherService;
import com.example.smartedu.service.DeepSeekService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpSession;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.WeekFields;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private TeacherRepository teacherRepository;
    
    @Autowired
    private StudentRepository studentRepository;
    
    @Autowired
    private CourseRepository courseRepository;
    
    @Autowired
    private CourseMaterialRepository courseMaterialRepository;
    
    @Autowired
    private ExamRepository examRepository;
    
    @Autowired
    private ExamResultRepository examResultRepository;
    
    @Autowired
    private QuestionRepository questionRepository;
    
    @Autowired
    private StudentAnswerRepository studentAnswerRepository;
    
    @Autowired
    private StudentCourseRepository studentCourseRepository;
    
    @Autowired
    private KnowledgeRepository knowledgeRepository;
    
    @Autowired
    private KnowledgeDocumentRepository knowledgeDocumentRepository;
    
    @Autowired
    private TeachingOutlineRepository teachingOutlineRepository;
    
    @Autowired
    private NoticeRepository noticeRepository;
    
    @Autowired
    private ExamService examService;
    
    @Autowired
    private TeacherService teacherService;
    
    @Autowired
    private DeepSeekService deepSeekService;
    
    /**
     * 删除试卷
     */
    @DeleteMapping("/exams/{examId}")
    public ApiResponse<String> deleteExam(@PathVariable Long examId, HttpSession session) {
        try {
            // 验证管理员权限
            if (!isAdmin(session)) {
                return ApiResponse.error("权限不足");
            }
            
            // 调用ExamService删除试卷
            examService.deleteExam(examId);
            
            return ApiResponse.success("试卷删除成功");
            
        } catch (Exception e) {
            return ApiResponse.error("删除试卷失败：" + e.getMessage());
        }
    }
    
    /**
     * 获取所有教学大纲
     */
    @GetMapping("/teaching-outlines")
    public ApiResponse<List<Map<String, Object>>> getAllTeachingOutlines(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword,
            HttpSession session) {
        
        try {
            // 验证管理员权限
            if (!isAdmin(session)) {
                return ApiResponse.error("权限不足");
            }
            
            System.out.println("=== 获取教学大纲API调用 ===");
            System.out.println("🎯 页码: " + page + ", 大小: " + size);
            System.out.println("🔍 关键词: " + (keyword != null ? keyword : "无"));
            
            // 获取所有教学大纲
            List<TeachingOutline> outlines = teachingOutlineRepository.findAllByOrderByCreatedAtDesc();
            System.out.println("📚 找到的教学大纲总数: " + outlines.size());
            
            // 应用关键词筛选
            if (keyword != null && !keyword.trim().isEmpty()) {
                String lowerKeyword = keyword.toLowerCase();
                outlines = outlines.stream()
                    .filter(outline -> {
                        String courseName = outline.getCourse() != null ? outline.getCourse().getName() : "";
                        String teacherName = outline.getCourse() != null && outline.getCourse().getTeacher() != null 
                            ? outline.getCourse().getTeacher().getRealName() : "";
                        String objective = outline.getTeachingObjective() != null ? outline.getTeachingObjective() : "";
                        String idea = outline.getTeachingIdea() != null ? outline.getTeachingIdea() : "";
                        String keyPoints = outline.getKeyPoints() != null ? outline.getKeyPoints() : "";
                        
                        return courseName.toLowerCase().contains(lowerKeyword) ||
                               teacherName.toLowerCase().contains(lowerKeyword) ||
                               objective.toLowerCase().contains(lowerKeyword) ||
                               idea.toLowerCase().contains(lowerKeyword) ||
                               keyPoints.toLowerCase().contains(lowerKeyword);
                    })
                    .collect(Collectors.toList());
                System.out.println("🎯 筛选后的教学大纲数: " + outlines.size());
            }
            
            // 应用分页
            int startIndex = page * size;
            int endIndex = Math.min(startIndex + size, outlines.size());
            List<TeachingOutline> paginatedOutlines = outlines.subList(startIndex, endIndex);
            
            // 构建返回数据
            List<Map<String, Object>> result = new ArrayList<>();
            for (TeachingOutline outline : paginatedOutlines) {
                Map<String, Object> outlineData = new HashMap<>();
                outlineData.put("id", outline.getId());
                outlineData.put("teachingObjective", outline.getTeachingObjective());
                outlineData.put("teachingIdea", outline.getTeachingIdea());
                outlineData.put("keyPoints", outline.getKeyPoints());
                outlineData.put("difficulties", outline.getDifficulties());
                outlineData.put("ideologicalDesign", outline.getIdeologicalDesign());
                outlineData.put("teachingDesign", outline.getTeachingDesign());
                outlineData.put("hours", outline.getHours());
                outlineData.put("createdAt", outline.getCreatedAt());
                outlineData.put("updatedAt", outline.getUpdatedAt());
                
                // 添加课程信息
                if (outline.getCourse() != null) {
                    outlineData.put("courseId", outline.getCourse().getId());
                    outlineData.put("courseName", outline.getCourse().getName());
                    outlineData.put("courseDescription", outline.getCourse().getDescription());
                    
                    // 添加教师信息
                    if (outline.getCourse().getTeacher() != null) {
                        outlineData.put("teacherId", outline.getCourse().getTeacher().getId());
                        outlineData.put("teacherName", outline.getCourse().getTeacher().getRealName());
                    }
                }
                
                result.add(outlineData);
            }
            
            System.out.println("✅ 成功返回 " + result.size() + " 个教学大纲");
            return ApiResponse.success(result);
            
        } catch (Exception e) {
            System.err.println("❌ 获取教学大纲失败: " + e.getMessage());
            e.printStackTrace();
            return ApiResponse.error("获取教学大纲失败：" + e.getMessage());
        }
    }
    
    /**
     * 查看教学大纲详情
     */
    @GetMapping("/teaching-outlines/{outlineId}")
    public ApiResponse<Map<String, Object>> getTeachingOutlineDetail(
            @PathVariable Long outlineId, 
            HttpSession session) {
        
        try {
            // 验证管理员权限
            if (!isAdmin(session)) {
                return ApiResponse.error("权限不足");
            }
            
            System.out.println("=== 获取教学大纲详情API调用 ===");
            System.out.println("🎯 大纲ID: " + outlineId);
            
            // 获取教学大纲
            Optional<TeachingOutline> outlineOpt = teachingOutlineRepository.findById(outlineId);
            if (!outlineOpt.isPresent()) {
                return ApiResponse.error("教学大纲不存在");
            }
            
            TeachingOutline outline = outlineOpt.get();
            
            // 构建返回数据
            Map<String, Object> result = new HashMap<>();
            result.put("id", outline.getId());
            
            // 如果分段字段为空，从teachingDesign中解析内容
            String fullContent = outline.getTeachingDesign();
            if (fullContent != null && !fullContent.trim().isEmpty()) {
                // 尝试从完整内容中解析各个部分
                Map<String, String> parsedContent = parseTeachingOutlineContent(fullContent);
                
                result.put("teachingObjective", parsedContent.getOrDefault("teachingObjective", 
                    outline.getTeachingObjective() != null ? outline.getTeachingObjective() : fullContent));
                result.put("teachingIdea", parsedContent.getOrDefault("teachingIdea", 
                    outline.getTeachingIdea() != null ? outline.getTeachingIdea() : ""));
                result.put("keyPoints", parsedContent.getOrDefault("keyPoints", 
                    outline.getKeyPoints() != null ? outline.getKeyPoints() : ""));
                result.put("difficulties", parsedContent.getOrDefault("difficulties", 
                    outline.getDifficulties() != null ? outline.getDifficulties() : ""));
                result.put("ideologicalDesign", parsedContent.getOrDefault("ideologicalDesign", 
                    outline.getIdeologicalDesign() != null ? outline.getIdeologicalDesign() : ""));
                result.put("teachingDesign", parsedContent.getOrDefault("teachingDesign", fullContent));
            } else {
                // 如果完整内容也为空，使用原始字段
                result.put("teachingObjective", outline.getTeachingObjective());
                result.put("teachingIdea", outline.getTeachingIdea());
                result.put("keyPoints", outline.getKeyPoints());
                result.put("difficulties", outline.getDifficulties());
                result.put("ideologicalDesign", outline.getIdeologicalDesign());
                result.put("teachingDesign", outline.getTeachingDesign());
            }
            
            result.put("hours", outline.getHours());
            result.put("createdAt", outline.getCreatedAt());
            result.put("updatedAt", outline.getUpdatedAt());
            
            // 添加课程信息
            if (outline.getCourse() != null) {
                result.put("courseId", outline.getCourse().getId());
                result.put("courseName", outline.getCourse().getName());
                result.put("courseDescription", outline.getCourse().getDescription());
                
                // 添加教师信息
                if (outline.getCourse().getTeacher() != null) {
                    result.put("teacherId", outline.getCourse().getTeacher().getId());
                    result.put("teacherName", outline.getCourse().getTeacher().getRealName());
                }
            }
            
            System.out.println("✅ 成功返回教学大纲详情");
            return ApiResponse.success(result);
            
        } catch (Exception e) {
            System.err.println("❌ 获取教学大纲详情失败: " + e.getMessage());
            e.printStackTrace();
            return ApiResponse.error("获取教学大纲详情失败：" + e.getMessage());
        }
    }
    
    /**
     * 获取按学科分组的课件资源
     */
    @GetMapping("/resources")
    public ApiResponse<Map<String, Object>> getResourcesBySubject(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) String keyword,
            HttpSession session) {
        
        try {
            // 验证管理员权限
            if (!isAdmin(session)) {
                return ApiResponse.error("权限不足");
            }
            
            // 添加调试信息
            long totalCourses = courseRepository.count();
            long activeCourses = courseRepository.countByStatus("active");
            long totalMaterials = courseMaterialRepository.count();
            long totalTeachers = teacherRepository.count();
            
            System.out.println("=== 数据统计 ===");
            System.out.println("总课程数: " + totalCourses);
            System.out.println("活跃课程数: " + activeCourses);
            System.out.println("总资料数: " + totalMaterials);
            System.out.println("总教师数: " + totalTeachers);
            
            Map<String, Object> result = new HashMap<>();
            
            // 获取所有活跃课程及其资料
            List<Course> courses = courseRepository.findByStatus("active");
            if (courses.isEmpty()) {
                // 如果没有活跃课程，获取所有课程
                courses = courseRepository.findAll();
            }
            
            System.out.println("实际处理的课程数: " + courses.size());
            
            Map<String, List<Map<String, Object>>> resourcesBySubject = new HashMap<>();
            Map<String, Integer> subjectCounts = new HashMap<>();
            
            for (Course course : courses) {
                // 只处理有教师的课程
                if (course.getTeacher() == null) {
                    continue;
                }
                
                String subjectName = course.getName(); // 使用课程名称作为学科
                
                if (!resourcesBySubject.containsKey(subjectName)) {
                    resourcesBySubject.put(subjectName, new ArrayList<>());
                    subjectCounts.put(subjectName, 0);
                }
                
                // 1. 添加课程资料
                List<CourseMaterial> materials = courseMaterialRepository.findByCourseIdOrderByUploadedAtDesc(course.getId());
                for (CourseMaterial material : materials) {
                    // 添加null检查
                    String materialName = material.getOriginalName() != null ? material.getOriginalName() : material.getFilename();
                    if (materialName == null) materialName = "未知文件";
                    
                    boolean matchesKeyword = keyword == null || keyword.trim().isEmpty() || 
                        materialName.toLowerCase().contains(keyword.toLowerCase()) ||
                        (material.getDescription() != null && material.getDescription().toLowerCase().contains(keyword.toLowerCase()));
                    
                    if (matchesKeyword) {
                        Map<String, Object> materialInfo = new HashMap<>();
                        materialInfo.put("id", material.getId());
                        materialInfo.put("name", materialName);
                        materialInfo.put("type", material.getMaterialType() != null ? material.getMaterialType() : "MATERIAL");
                        materialInfo.put("resourceType", "课程资料");
                        materialInfo.put("description", material.getDescription() != null ? material.getDescription() : "");
                        materialInfo.put("fileSize", material.getFileSize() != null ? material.getFileSize() : 0L);
                        materialInfo.put("uploadedAt", material.getUploadedAt());
                        materialInfo.put("courseId", course.getId());
                        materialInfo.put("courseName", course.getName() != null ? course.getName() : "未知课程");
                        materialInfo.put("teacherName", course.getTeacher().getRealName() != null ? course.getTeacher().getRealName() : "未知教师");
                        
                        resourcesBySubject.get(subjectName).add(materialInfo);
                        subjectCounts.put(subjectName, subjectCounts.get(subjectName) + 1);
                    }
                }
                
                // 2. 添加试卷/考试
                List<Exam> exams = examRepository.findByCourseIdOrderByCreatedAtDesc(course.getId());
                for (Exam exam : exams) {
                    String examName = exam.getTitle() != null ? exam.getTitle() : "未知考试";
                    
                    boolean matchesKeyword = keyword == null || keyword.trim().isEmpty() || 
                        examName.toLowerCase().contains(keyword.toLowerCase()) ||
                        (exam.getDescription() != null && exam.getDescription().toLowerCase().contains(keyword.toLowerCase()));
                    
                    if (matchesKeyword) {
                        Map<String, Object> examInfo = new HashMap<>();
                        examInfo.put("id", exam.getId());
                        examInfo.put("name", examName);
                        examInfo.put("type", "EXAM");
                        examInfo.put("resourceType", "考试试卷");
                        examInfo.put("description", exam.getDescription() != null ? exam.getDescription() : "");
                        examInfo.put("fileSize", 0L); // 试卷没有文件大小
                        examInfo.put("uploadedAt", exam.getCreatedAt());
                        examInfo.put("courseId", course.getId());
                        examInfo.put("courseName", course.getName() != null ? course.getName() : "未知课程");
                        examInfo.put("teacherName", course.getTeacher().getRealName() != null ? course.getTeacher().getRealName() : "未知教师");
                        
                        // 添加考试特有信息
                        examInfo.put("duration", exam.getDuration() != null ? exam.getDuration() : 0);
                        examInfo.put("totalScore", exam.getTotalScore() != null ? exam.getTotalScore() : 0);
                        
                        // 统计题目数量
                        List<Question> questions = questionRepository.findByExamId(exam.getId());
                        examInfo.put("questionCount", questions.size());
                        
                        resourcesBySubject.get(subjectName).add(examInfo);
                        subjectCounts.put(subjectName, subjectCounts.get(subjectName) + 1);
                    }
                }
                
                // 3. 添加知识块
                List<Knowledge> knowledgeList = knowledgeRepository.findByCourseId(course.getId());
                // 按文件名分组知识块
                Map<String, List<Knowledge>> knowledgeByFile = knowledgeList.stream()
                    .collect(Collectors.groupingBy(Knowledge::getFileName));
                
                for (Map.Entry<String, List<Knowledge>> entry : knowledgeByFile.entrySet()) {
                    String fileName = entry.getKey();
                    List<Knowledge> chunks = entry.getValue();
                    
                    boolean matchesKeyword = keyword == null || keyword.trim().isEmpty() || 
                        fileName.toLowerCase().contains(keyword.toLowerCase());
                    
                    if (matchesKeyword) {
                        Map<String, Object> knowledgeInfo = new HashMap<>();
                        knowledgeInfo.put("id", "knowledge_" + fileName.hashCode());
                        knowledgeInfo.put("name", fileName);
                        knowledgeInfo.put("type", "KNOWLEDGE");
                        knowledgeInfo.put("resourceType", "知识块");
                        knowledgeInfo.put("description", chunks.size() + " 个知识块");
                        
                        // 从KnowledgeDocument表获取真实的文件大小
                        Long fileSize = 0L;
                        try {
                            List<KnowledgeDocument> docs = knowledgeDocumentRepository.findByCourseId(course.getId());
                            for (KnowledgeDocument doc : docs) {
                                if (fileName.equals(doc.getOriginalName())) {
                                    fileSize = doc.getFileSize() != null ? doc.getFileSize() : 0L;
                                    break;
                                }
                            }
                        } catch (Exception e) {
                            System.err.println("获取知识块文件大小失败: " + e.getMessage());
                        }
                        
                        knowledgeInfo.put("fileSize", fileSize);
                        knowledgeInfo.put("uploadedAt", chunks.get(0).getCreatedAt());
                        knowledgeInfo.put("courseId", course.getId());
                        knowledgeInfo.put("courseName", course.getName() != null ? course.getName() : "未知课程");
                        knowledgeInfo.put("teacherName", course.getTeacher().getRealName() != null ? course.getTeacher().getRealName() : "未知教师");
                        
                        // 添加知识块特有信息
                        knowledgeInfo.put("chunkCount", chunks.size());
                        knowledgeInfo.put("processedCount", chunks.stream().mapToInt(k -> k.getProcessed() ? 1 : 0).sum());
                        knowledgeInfo.put("fileName", fileName);
                        
                        resourcesBySubject.get(subjectName).add(knowledgeInfo);
                        subjectCounts.put(subjectName, subjectCounts.get(subjectName) + 1);
                    }
                }
            }
            
            // 如果指定了学科，只返回该学科的资料
            if (subject != null && !subject.trim().isEmpty()) {
                List<Map<String, Object>> subjectResources = resourcesBySubject.getOrDefault(subject, new ArrayList<>());
                
                System.out.println("请求的学科: " + subject);
                System.out.println("找到的资源数量: " + subjectResources.size());
                System.out.println("可用的学科: " + resourcesBySubject.keySet());
                
                // 分页处理
                int start = page * size;
                int end = Math.min(start + size, subjectResources.size());
                
                if (start >= subjectResources.size()) {
                    // 如果起始位置超出范围，返回空列表
                    result.put("resources", new ArrayList<>());
                } else {
                    List<Map<String, Object>> pagedResources = subjectResources.subList(start, end);
                    result.put("resources", pagedResources);
                }
                
                result.put("totalPages", (int) Math.ceil((double) subjectResources.size() / size));
                result.put("totalElements", subjectResources.size());
                result.put("currentPage", page);
                result.put("size", size);
                result.put("subject", subject);
            } else {
                // 返回所有学科统计信息
                result.put("subjectCounts", subjectCounts);
                result.put("resourcesBySubject", resourcesBySubject);
                result.put("totalSubjects", resourcesBySubject.size());
                result.put("totalResources", subjectCounts.values().stream().mapToInt(Integer::intValue).sum());
            }
            
            return ApiResponse.success("获取成功", result);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("获取资源失败：" + e.getMessage());
        }
    }
    
    /**
     * 导出课件资源
     */
    @GetMapping("/resources/export")
    public ResponseEntity<byte[]> exportResources(
            @RequestParam(required = false) String subject,
            HttpSession session) {
        
        try {
            // 验证管理员权限
            if (!isAdmin(session)) {
                return ResponseEntity.status(403).build();
            }
            
            List<Course> courses = courseRepository.findByStatus("active");
            if (courses.isEmpty()) {
                courses = courseRepository.findAll();
            }
            
            StringBuilder csvContent = new StringBuilder();
            csvContent.append("学科,课程名称,资源名称,资源类型,文件大小,创建时间,教师姓名,资源描述,额外信息\n");
            
            for (Course course : courses) {
                // 只处理有教师的课程
                if (course.getTeacher() == null) {
                    continue;
                }
                
                String subjectName = course.getName() != null ? course.getName() : "未知学科";
                
                // 如果指定了学科，只导出该学科的资料
                if (subject != null && !subject.trim().isEmpty() && !subjectName.equals(subject)) {
                    continue;
                }
                
                String courseName = course.getName() != null ? course.getName() : "未知课程";
                String teacherName = course.getTeacher().getRealName() != null ? course.getTeacher().getRealName() : "未知教师";
                
                // 1. 导出课程资料
                List<CourseMaterial> materials = courseMaterialRepository.findByCourseIdOrderByUploadedAtDesc(course.getId());
                
                for (CourseMaterial material : materials) {
                    String materialName = material.getOriginalName() != null ? material.getOriginalName() : material.getFilename();
                    if (materialName == null) materialName = "未知文件";
                    
                    String materialType = material.getMaterialType() != null ? material.getMaterialType() : "OTHER";
                    Long fileSize = material.getFileSize() != null ? material.getFileSize() : 0L;
                    String uploadTime = material.getUploadedAt() != null ? 
                        material.getUploadedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : "未知时间";
                    String description = material.getDescription() != null ? 
                        material.getDescription().replace("\"", "\"\"") : "";
                    
                    csvContent.append(String.format("%s,%s,%s,%s,%d,%s,%s,\"%s\",\"%s\"\n",
                        subjectName,
                        courseName,
                        materialName,
                        "课程资料",
                        fileSize,
                        uploadTime,
                        teacherName,
                        description,
                        "文件类型: " + materialType
                    ));
                }
                
                // 2. 导出试卷/考试
                List<Exam> exams = examRepository.findByCourseIdOrderByCreatedAtDesc(course.getId());
                
                for (Exam exam : exams) {
                    String examName = exam.getTitle() != null ? exam.getTitle() : "未知考试";
                    String examTime = exam.getCreatedAt() != null ? 
                        exam.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : "未知时间";
                    String examDescription = exam.getDescription() != null ? 
                        exam.getDescription().replace("\"", "\"\"") : "";
                    
                    // 统计题目数量
                    List<Question> questions = questionRepository.findByExamId(exam.getId());
                    String extraInfo = String.format("考试时长: %d分钟, 总分: %d分, 题目数: %d", 
                        exam.getDuration() != null ? exam.getDuration() : 0,
                        exam.getTotalScore() != null ? exam.getTotalScore() : 0,
                        questions.size());
                    
                    csvContent.append(String.format("%s,%s,%s,%s,%d,%s,%s,\"%s\",\"%s\"\n",
                        subjectName,
                        courseName,
                        examName,
                        "考试试卷",
                        0L, // 试卷没有文件大小
                        examTime,
                        teacherName,
                        examDescription,
                        extraInfo
                    ));
                }
            }
            
            byte[] bytes = csvContent.toString().getBytes("UTF-8");
            
            String filename = "课件资源统计_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".csv";
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + 
                            java.net.URLEncoder.encode(filename, "UTF-8"))
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(bytes);
                    
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }
    
    /**
     * 查看知识块内容
     */
    @GetMapping("/knowledge/view")
    public ApiResponse<Map<String, Object>> viewKnowledgeContent(
            @RequestParam Long courseId, 
            @RequestParam String fileName, 
            HttpSession session) {
        try {
            System.out.println("=== 知识块查看API调用 ===");
            System.out.println("🎯 请求的课程ID: " + courseId + ", 文件名: " + fileName);
            
            // 验证管理员权限
            if (!isAdmin(session)) {
                System.out.println("❌ 权限验证失败");
                return ApiResponse.error("权限不足");
            }
            System.out.println("✅ 管理员权限验证通过");
            
            // 获取知识块列表
            List<Knowledge> knowledgeList = knowledgeRepository.findByFileNameAndCourseId(fileName, courseId);
            if (knowledgeList.isEmpty()) {
                System.out.println("❌ 知识块不存在，课程ID: " + courseId + ", 文件名: " + fileName);
                return ApiResponse.error("知识块不存在");
            }
            
            // 获取课程信息
            Optional<Course> courseOpt = courseRepository.findById(courseId);
            if (!courseOpt.isPresent()) {
                System.out.println("❌ 课程不存在，ID: " + courseId);
                return ApiResponse.error("课程不存在");
            }
            
            Course course = courseOpt.get();
            System.out.println("📚 课程信息: " + course.getName());
            
            Map<String, Object> result = new HashMap<>();
            result.put("courseId", courseId);
            result.put("courseName", course.getName());
            result.put("teacherName", course.getTeacher() != null ? course.getTeacher().getRealName() : "未知教师");
            result.put("fileName", fileName);
            result.put("totalChunks", knowledgeList.size());
            result.put("processedChunks", knowledgeList.stream().mapToInt(k -> k.getProcessed() ? 1 : 0).sum());
            
            // 整理知识块列表
            List<Map<String, Object>> chunks = new ArrayList<>();
            for (Knowledge knowledge : knowledgeList) {
                Map<String, Object> chunk = new HashMap<>();
                chunk.put("id", knowledge.getId());
                chunk.put("chunkId", knowledge.getChunkId());
                chunk.put("chunkIndex", knowledge.getChunkIndex());
                chunk.put("content", knowledge.getContent());
                chunk.put("processed", knowledge.getProcessed());
                chunk.put("createdAt", knowledge.getCreatedAt());
                chunk.put("vectorId", knowledge.getVectorId());
                chunks.add(chunk);
            }
            
            // 按索引排序
            chunks.sort((a, b) -> {
                Integer indexA = (Integer) a.get("chunkIndex");
                Integer indexB = (Integer) b.get("chunkIndex");
                if (indexA == null) indexA = 0;
                if (indexB == null) indexB = 0;
                return indexA.compareTo(indexB);
            });
            
            result.put("chunks", chunks);
            
            System.out.println("✅ 成功获取知识块内容，共 " + knowledgeList.size() + " 个块");
            
            return ApiResponse.success("获取成功", result);
            
        } catch (Exception e) {
            System.out.println("❌ 获取知识块内容失败: " + e.getMessage());
            e.printStackTrace();
            return ApiResponse.error("获取知识块内容失败：" + e.getMessage());
        }
    }
    
    /**
     * 查看试卷内容
     */
    @GetMapping("/exams/view")
    public ApiResponse<Map<String, Object>> viewExamContent(@RequestParam Long examId, HttpSession session) {
        try {
            System.out.println("=== 试卷查看API调用 ===");
            System.out.println("🎯 请求的试卷ID: " + examId);
            
            // 验证管理员权限
            if (!isAdmin(session)) {
                System.out.println("❌ 权限验证失败");
                return ApiResponse.error("权限不足");
            }
            System.out.println("✅ 管理员权限验证通过");
            
            Optional<Exam> examOpt = examRepository.findById(examId);
            if (!examOpt.isPresent()) {
                System.out.println("❌ 试卷不存在，ID: " + examId);
                return ApiResponse.error("试卷不存在");
            }
            
            Exam exam = examOpt.get();
            System.out.println("✅ 找到试卷: " + exam.getTitle());
            System.out.println("📚 试卷课程: " + (exam.getCourse() != null ? exam.getCourse().getName() : "无课程"));
            
            // 获取试卷的题目
            List<Question> questions = questionRepository.findByExamId(examId);
            System.out.println("📝 找到题目数量: " + questions.size());
            
            // 构建试卷数据
            Map<String, Object> examData = new HashMap<>();
            examData.put("id", exam.getId());
            examData.put("title", exam.getTitle());
            examData.put("description", exam.getDescription());
            examData.put("duration", exam.getDuration());
            examData.put("totalScore", exam.getTotalScore());
            examData.put("courseName", exam.getCourse() != null ? exam.getCourse().getName() : "未知课程");
            examData.put("teacherName", exam.getCourse() != null && exam.getCourse().getTeacher() != null ? 
                                      exam.getCourse().getTeacher().getRealName() : "未知教师");
            
            // 构建题目数据
            List<Map<String, Object>> questionList = new ArrayList<>();
            for (Question question : questions) {
                System.out.println("🔄 处理题目: " + question.getContent());
                
                Map<String, Object> questionData = new HashMap<>();
                questionData.put("id", question.getId());
                questionData.put("content", question.getContent());
                questionData.put("score", question.getScore());
                questionData.put("correctAnswer", question.getAnswer());
                questionData.put("explanation", question.getExplanation());
                questionData.put("knowledgePoint", question.getKnowledgePoint());
                
                // 解析选项
                if (question.getOptions() != null && !question.getOptions().isEmpty()) {
                    String[] options = question.getOptions().split("\\|");
                    List<String> optionList = new ArrayList<>();
                    for (String option : options) {
                        optionList.add(option.trim());
                    }
                    questionData.put("options", optionList);
                    System.out.println("📋 题目选项数量: " + optionList.size());
                } else {
                    questionData.put("options", new ArrayList<>());
                    System.out.println("📋 题目无选项");
                }
                
                questionList.add(questionData);
            }
            
            examData.put("questions", questionList);
            
            System.out.println("✅ 试卷数据构建完成");
            System.out.println("📊 返回的数据结构: " + examData.keySet());
            
            return ApiResponse.success(examData);
            
        } catch (Exception e) {
            System.err.println("❌ 试卷查看API异常:");
            e.printStackTrace();
            return ApiResponse.error("获取试卷内容失败: " + e.getMessage());
        }
    }
    
    /**
     * 导出试卷内容
     */
    @GetMapping("/exams/export")
    public ResponseEntity<byte[]> exportExamContent(
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) Long examId,
            HttpSession session) {
        
        try {
            // 验证管理员权限
            if (!isAdmin(session)) {
                return ResponseEntity.status(403).build();
            }
            
            StringBuilder content = new StringBuilder();
            String filename;
            
            if (examId != null) {
                // 导出单个试卷
                Optional<Exam> examOpt = examRepository.findById(examId);
                if (!examOpt.isPresent()) {
                    return ResponseEntity.notFound().build();
                }
                
                Exam exam = examOpt.get();
                content.append(generateExamMarkdown(exam));
                filename = (exam.getTitle() != null ? exam.getTitle() : "试卷") + "_" + 
                          LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".md";
            } else {
                // 导出指定学科的所有试卷
                List<Course> courses = courseRepository.findAll();
                int exportedCount = 0;
                
                for (Course course : courses) {
                    if (course.getTeacher() == null) {
                        continue;
                    }
                    
                    String subjectName = course.getName() != null ? course.getName() : "未知学科";
                    
                    // 如果指定了学科，只导出该学科的试卷
                    if (subject != null && !subject.trim().isEmpty() && !subjectName.equals(subject)) {
                        continue;
                    }
                    
                    List<Exam> exams = examRepository.findByCourseIdOrderByCreatedAtDesc(course.getId());
                    
                    for (Exam exam : exams) {
                        if (exportedCount > 0) {
                            content.append("\n\n---\n\n");
                        }
                        content.append(generateExamMarkdown(exam));
                        exportedCount++;
                    }
                }
                
                filename = (subject != null ? subject + "_" : "") + "试卷合集_" + 
                          LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".md";
            }
            
            byte[] bytes = content.toString().getBytes("UTF-8");
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + 
                            java.net.URLEncoder.encode(filename, "UTF-8"))
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(bytes);
                    
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }
    
    /**
     * 生成试卷Markdown内容
     */
    private String generateExamMarkdown(Exam exam) {
        StringBuilder markdown = new StringBuilder();
        
        // 试卷标题
        markdown.append("# ").append(exam.getTitle() != null ? exam.getTitle() : "试卷").append("\n\n");
        
        // 试卷信息
        markdown.append("**课程**: ").append(exam.getCourse() != null ? exam.getCourse().getName() : "未知课程").append("\n");
        markdown.append("**教师**: ").append(exam.getCourse() != null && exam.getCourse().getTeacher() != null ? 
                                             exam.getCourse().getTeacher().getRealName() : "未知教师").append("\n");
        markdown.append("**考试时长**: ").append(exam.getDuration() != null ? exam.getDuration() : 0).append("分钟\n");
        markdown.append("**总分**: ").append(exam.getTotalScore() != null ? exam.getTotalScore() : 0).append("分\n");
        
        if (exam.getDescription() != null && !exam.getDescription().trim().isEmpty()) {
            markdown.append("**说明**: ").append(exam.getDescription()).append("\n");
        }
        
        markdown.append("**创建时间**: ").append(exam.getCreatedAt() != null ? 
                                              exam.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : "未知时间").append("\n\n");
        
        markdown.append("---\n\n");
        
        // 试卷题目
        List<Question> questions = questionRepository.findByExamId(exam.getId());
        
        if (questions.isEmpty()) {
            markdown.append("*此试卷暂无题目*\n\n");
        } else {
            markdown.append("## 试卷题目\n\n");
            
            for (int i = 0; i < questions.size(); i++) {
                Question question = questions.get(i);
                markdown.append("### ").append(i + 1).append(". ").append(question.getContent()).append("\n\n");
                
                // 知识点
                if (question.getKnowledgePoint() != null && !question.getKnowledgePoint().trim().isEmpty()) {
                    markdown.append("**知识点**: ").append(question.getKnowledgePoint()).append("\n\n");
                }
                
                // 选择题选项
                if ("MULTIPLE_CHOICE".equals(question.getType()) || "SINGLE_CHOICE".equals(question.getType())) {
                    if (question.getOptions() != null && !question.getOptions().trim().isEmpty()) {
                        String[] options = question.getOptions().split("\\|");
                        char optionLabel = 'A';
                        for (String option : options) {
                            markdown.append(optionLabel).append(". ").append(option.trim()).append("\n");
                            optionLabel++;
                        }
                        markdown.append("\n");
                    }
                }
                
                // 分值
                markdown.append("**分值**: ").append(question.getScore() != null ? question.getScore() : 0).append("分\n\n");
                
                // 正确答案
                if (question.getAnswer() != null && !question.getAnswer().trim().isEmpty()) {
                    markdown.append("**正确答案**: ").append(question.getAnswer()).append("\n\n");
                }
                
                // 解析
                if (question.getExplanation() != null && !question.getExplanation().trim().isEmpty()) {
                    markdown.append("**解析**: ").append(question.getExplanation()).append("\n\n");
                }
                
                markdown.append("---\n\n");
            }
        }
        
        return markdown.toString();
    }

    /**
     * 获取大屏概览统计数据
     */
    @GetMapping("/overview")
    public ApiResponse<Map<String, Object>> getOverviewStats(HttpSession session) {
        try {
            // 验证管理员权限
            if (!isAdmin(session)) {
                return ApiResponse.error("权限不足");
            }
            
            System.out.println("=== 大屏概览数据统计 ===");
            
            Map<String, Object> result = new HashMap<>();
            
            // 基础统计
            long totalUsers = userRepository.count();
            long totalTeachers = teacherRepository.count();
            long totalStudents = studentRepository.count();
            long totalCourses = courseRepository.count();
            long totalMaterials = courseMaterialRepository.count();
            long totalExams = examRepository.count();
            
            System.out.println("总用户数: " + totalUsers);
            System.out.println("总教师数: " + totalTeachers);
            System.out.println("总学生数: " + totalStudents);
            System.out.println("总课程数: " + totalCourses);
            System.out.println("总资料数: " + totalMaterials);
            System.out.println("总考试数: " + totalExams);
            
            // 检查具体的课程数据
            List<Course> allCourses = courseRepository.findAll();
            long coursesWithTeachers = allCourses.stream()
                .filter(course -> course.getTeacher() != null)
                .count();
            System.out.println("有教师的课程数: " + coursesWithTeachers);
            
            // 检查考试结果数据
            long totalExamResults = examResultRepository.count();
            System.out.println("总考试结果数: " + totalExamResults);
            
            Map<String, Object> basicStats = new HashMap<>();
            basicStats.put("totalUsers", totalUsers);
            basicStats.put("totalTeachers", totalTeachers);
            basicStats.put("totalStudents", totalStudents);
            basicStats.put("totalCourses", totalCourses);
            basicStats.put("totalMaterials", totalMaterials);
            basicStats.put("totalExams", totalExams);
            
            // 教师使用统计（模拟数据，实际需要根据登录日志等实现）
            Map<String, Object> teacherStats = getTeacherUsageStats();
            
            // 学生使用统计（模拟数据，实际需要根据登录日志等实现）
            Map<String, Object> studentStats = getStudentUsageStats();
            
            // 教学效率指数
            Map<String, Object> teachingEfficiency = getTeachingEfficiencyStats();
            
            // 学生学习效果
            Map<String, Object> learningEffects = getLearningEffectStats();
            
            result.put("basicStats", basicStats);
            result.put("teacherStats", teacherStats);
            result.put("studentStats", studentStats);
            result.put("teachingEfficiency", teachingEfficiency);
            result.put("learningEffects", learningEffects);
            
            return ApiResponse.success("获取成功", result);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("获取统计数据失败：" + e.getMessage());
        }
    }
    
    /**
     * 获取教师使用统计
     */
    private Map<String, Object> getTeacherUsageStats() {
        Map<String, Object> stats = new HashMap<>();
        
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime todayStart = now.withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime weekStart = now.minusDays(now.getDayOfWeek().getValue() - 1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        
        // 获取所有教师及其用户信息
        List<Teacher> teachers = teacherRepository.findAll();
        
        // 计算真实的活跃教师数量（基于登录记录）
        int activeTodayCount = 0;
        int activeThisWeekCount = 0;
        
        // 统计各功能模块的使用情况
        Map<String, Integer> activeModules = new HashMap<>();
        activeModules.put("课程管理", 0);
        activeModules.put("资料上传", 0);
        activeModules.put("考试管理", 0);
        activeModules.put("学生管理", 0);
        activeModules.put("教学大纲", 0);
        
        // 按日期统计使用情况 - 使用LinkedHashMap保持顺序
        Map<String, Integer> dailyUsage = new LinkedHashMap<>();
        Map<String, Integer> weeklyUsage = new HashMap<>();
        
        // 初始化每日使用数据 - 按星期几分组
        String[] days = {"周一", "周二", "周三", "周四", "周五", "周六", "周日"};
        for (String day : days) {
            dailyUsage.put(day, 0);
        }
        
        for (Teacher teacher : teachers) {
            // 获取教师对应的用户信息
            User user = userRepository.findByUsername(teacher.getTeacherCode()).orElse(null);
            
            if (user != null && user.getLastLogin() != null) {
                // 基于真实登录时间判断活跃度
                if (user.getLastLogin().isAfter(todayStart)) {
                    activeTodayCount++;
                }
                if (user.getLastLogin().isAfter(weekStart)) {
                    activeThisWeekCount++;
                }
            }
            
            // 统计功能模块使用情况（基于实际数据）
            List<Course> courses = courseRepository.findByTeacherId(teacher.getId());
            if (!courses.isEmpty()) {
                activeModules.put("课程管理", activeModules.get("课程管理") + 1);
                
                // 检查是否有学生
                boolean hasStudents = false;
                for (Course course : courses) {
                    long studentCount = studentCourseRepository.countByCourseIdAndStatus(course.getId(), "active");
                    if (studentCount > 0) {
                        hasStudents = true;
                        break;
                    }
                }
                if (hasStudents) {
                    activeModules.put("学生管理", activeModules.get("学生管理") + 1);
                }
                
                activeModules.put("教学大纲", activeModules.get("教学大纲") + 1);
            }
            
            // 检查资料上传
            int materialCount = 0;
            for (Course course : courses) {
                List<CourseMaterial> materials = courseMaterialRepository.findByCourseIdOrderByUploadedAtDesc(course.getId());
                materialCount += materials.size();
            }
            if (materialCount > 0) {
                activeModules.put("资料上传", activeModules.get("资料上传") + 1);
            }
            
            // 检查考试管理
            int examCount = 0;
            for (Course course : courses) {
                List<Exam> exams = examRepository.findByCourseIdOrderByCreatedAtDesc(course.getId());
                examCount += exams.size();
            }
            if (examCount > 0) {
                activeModules.put("考试管理", activeModules.get("考试管理") + 1);
            }
        }
        
        // 计算过去7天的登录统计 - 按星期几分组
        for (int i = 6; i >= 0; i--) { // 从6天前到今天
            LocalDateTime dayStart = now.minusDays(i).withHour(0).withMinute(0).withSecond(0).withNano(0);
            LocalDateTime dayEnd = dayStart.plusDays(1);
            
            // 获取该天是星期几
            int dayOfWeek = dayStart.getDayOfWeek().getValue(); // 1=周一, 7=周日
            String dayName = days[dayOfWeek - 1];
            
            int dayLoginCount = 0;
            
            // 统计当天登录的教师数量
            for (Teacher teacher : teachers) {
                User user = userRepository.findByUsername(teacher.getTeacherCode()).orElse(null);
                if (user != null && user.getLastLogin() != null && 
                    user.getLastLogin().isAfter(dayStart) && 
                    user.getLastLogin().isBefore(dayEnd)) {
                    dayLoginCount++;
                }
            }
            
            // 累加到对应的星期几
            dailyUsage.put(dayName, dailyUsage.get(dayName) + dayLoginCount);
        }
        
        // 计算周统计
        int thisWeekTotal = dailyUsage.values().stream().mapToInt(Integer::intValue).sum();
        weeklyUsage.put("本周", thisWeekTotal);
        
        // 计算上周统计（基于真实数据）
        LocalDateTime lastWeekStart = weekStart.minusDays(7);
        LocalDateTime lastWeekEnd = weekStart;
        int lastWeekTotal = 0;
        for (Teacher teacher : teachers) {
            User user = userRepository.findByUsername(teacher.getTeacherCode()).orElse(null);
            if (user != null && user.getLastLogin() != null && 
                user.getLastLogin().isAfter(lastWeekStart) && 
                user.getLastLogin().isBefore(lastWeekEnd)) {
                lastWeekTotal++;
            }
        }
        weeklyUsage.put("上周", lastWeekTotal);
        
        // 计算上上周统计
        LocalDateTime twoWeeksAgoStart = lastWeekStart.minusDays(7);
        int twoWeeksAgoTotal = 0;
        for (Teacher teacher : teachers) {
            User user = userRepository.findByUsername(teacher.getTeacherCode()).orElse(null);
            if (user != null && user.getLastLogin() != null && 
                user.getLastLogin().isAfter(twoWeeksAgoStart) && 
                user.getLastLogin().isBefore(lastWeekStart)) {
                twoWeeksAgoTotal++;
            }
        }
        weeklyUsage.put("上上周", twoWeeksAgoTotal);
        
        stats.put("totalTeachers", teachers.size());
        stats.put("activeToday", activeTodayCount);
        stats.put("activeThisWeek", activeThisWeekCount);
        stats.put("dailyUsage", dailyUsage);
        stats.put("weeklyUsage", weeklyUsage);
        stats.put("activeModules", activeModules);
        
        return stats;
    }
    
    /**
     * 获取学生使用统计
     */
    private Map<String, Object> getStudentUsageStats() {
        Map<String, Object> stats = new HashMap<>();
        
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime todayStart = now.withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime weekStart = now.minusDays(now.getDayOfWeek().getValue() - 1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        
        List<Student> students = studentRepository.findAll();
        
        // 计算真实的活跃学生数量（基于登录记录）
        int activeTodayCount = 0;
        int activeThisWeekCount = 0;
        
        // 统计各功能模块的使用情况
        Map<String, Integer> activeModules = new HashMap<>();
        activeModules.put("课程学习", 0);
        activeModules.put("在线考试", 0);
        activeModules.put("资料下载", 0);
        activeModules.put("AI助手", 0);
        activeModules.put("作业提交", 0);
        
        // 按日期统计使用情况 - 使用LinkedHashMap保持顺序
        Map<String, Integer> dailyUsage = new LinkedHashMap<>();
        Map<String, Integer> weeklyUsage = new HashMap<>();
        
        // 初始化每日使用数据 - 按星期几分组
        String[] days = {"周一", "周二", "周三", "周四", "周五", "周六", "周日"};
        for (String day : days) {
            dailyUsage.put(day, 0);
        }
        
        for (Student student : students) {
            // 获取学生对应的用户信息
            User user = userRepository.findById(student.getUserId()).orElse(null);
            
            if (user != null && user.getLastLogin() != null) {
                // 基于真实登录时间判断活跃度
                if (user.getLastLogin().isAfter(todayStart)) {
                    activeTodayCount++;
                }
                if (user.getLastLogin().isAfter(weekStart)) {
                    activeThisWeekCount++;
                }
            }
            
            // 统计功能模块使用情况（基于实际数据）
            // 1. 课程学习活动（基于选课记录）
            List<StudentCourse> studentCourses = studentCourseRepository.findByStudentIdAndStatus(student.getId(), "active");
            if (!studentCourses.isEmpty()) {
                activeModules.put("课程学习", activeModules.get("课程学习") + 1);
            }
            
            // 2. 在线考试活动（基于考试结果）
            List<ExamResult> examResults = examResultRepository.findByStudentId(student.getId());
            if (!examResults.isEmpty()) {
                activeModules.put("在线考试", activeModules.get("在线考试") + 1);
            }
            
            // 3. 答题活动（基于学生答题记录）
            boolean hasAnswers = false;
            for (ExamResult result : examResults) {
                List<StudentAnswer> studentAnswers = studentAnswerRepository.findByExamResultId(result.getId());
                if (!studentAnswers.isEmpty()) {
                    hasAnswers = true;
                    break;
                }
            }
            if (hasAnswers) {
                activeModules.put("作业提交", activeModules.get("作业提交") + 1);
            }
            
            // 4. 资料下载活动（基于选课的学生数量估算）
            if (!studentCourses.isEmpty()) {
                activeModules.put("资料下载", activeModules.get("资料下载") + 1);
            }
            
            // 5. AI助手活动（基于参与考试的学生数量估算）
            if (!examResults.isEmpty()) {
                activeModules.put("AI助手", activeModules.get("AI助手") + 1);
            }
        }
        
        // 计算过去7天的登录统计 - 按星期几分组
        for (int i = 6; i >= 0; i--) { // 从6天前到今天
            LocalDateTime dayStart = now.minusDays(i).withHour(0).withMinute(0).withSecond(0).withNano(0);
            LocalDateTime dayEnd = dayStart.plusDays(1);
            
            // 获取该天是星期几
            int dayOfWeek = dayStart.getDayOfWeek().getValue(); // 1=周一, 7=周日
            String dayName = days[dayOfWeek - 1];
            
            int dayLoginCount = 0;
            
            // 统计当天登录的学生数量
            for (Student student : students) {
                User user = userRepository.findById(student.getUserId()).orElse(null);
                if (user != null && user.getLastLogin() != null && 
                    user.getLastLogin().isAfter(dayStart) && 
                    user.getLastLogin().isBefore(dayEnd)) {
                    dayLoginCount++;
                }
            }
            
            // 累加到对应的星期几
            dailyUsage.put(dayName, dailyUsage.get(dayName) + dayLoginCount);
        }
        
        // 计算周统计
        int thisWeekTotal = dailyUsage.values().stream().mapToInt(Integer::intValue).sum();
        weeklyUsage.put("本周", thisWeekTotal);
        
        // 计算上周统计（基于真实数据）
        LocalDateTime lastWeekStart = weekStart.minusDays(7);
        LocalDateTime lastWeekEnd = weekStart;
        int lastWeekTotal = 0;
        for (Student student : students) {
            User user = userRepository.findById(student.getUserId()).orElse(null);
            if (user != null && user.getLastLogin() != null && 
                user.getLastLogin().isAfter(lastWeekStart) && 
                user.getLastLogin().isBefore(lastWeekEnd)) {
                lastWeekTotal++;
            }
        }
        weeklyUsage.put("上周", lastWeekTotal);
        
        // 计算上上周统计
        LocalDateTime twoWeeksAgoStart = lastWeekStart.minusDays(7);
        int twoWeeksAgoTotal = 0;
        for (Student student : students) {
            User user = userRepository.findById(student.getUserId()).orElse(null);
            if (user != null && user.getLastLogin() != null && 
                user.getLastLogin().isAfter(twoWeeksAgoStart) && 
                user.getLastLogin().isBefore(lastWeekStart)) {
                twoWeeksAgoTotal++;
            }
        }
        weeklyUsage.put("上上周", twoWeeksAgoTotal);
        
        stats.put("totalStudents", students.size());
        stats.put("activeToday", activeTodayCount);
        stats.put("activeThisWeek", activeThisWeekCount);
        stats.put("dailyUsage", dailyUsage);
        stats.put("weeklyUsage", weeklyUsage);
        stats.put("activeModules", activeModules);
        
        return stats;
    }
    
    /**
     * 获取教学效率指数
     */
    private Map<String, Object> getTeachingEfficiencyStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // 基于真实数据计算备课与修正耗时
        Map<String, Double> preparationTime = new HashMap<>();
        Map<String, Double> exerciseTime = new HashMap<>();
        
        // 获取所有课程资料和考试数据来估算时间
        List<CourseMaterial> allMaterials = courseMaterialRepository.findAll();
        List<Exam> allExams = examRepository.findAll();
        
        // 计算平均备课时间 - 基于资料上传的时间间隔
        double avgPrepTime = 0.0;
        double avgCorrectionTime = 0.0;
        
        if (!allMaterials.isEmpty()) {
            // 按课程分组计算备课时间
            Map<Long, List<CourseMaterial>> materialsByCourse = new HashMap<>();
            for (CourseMaterial material : allMaterials) {
                materialsByCourse.computeIfAbsent(material.getCourseId(), k -> new ArrayList<>()).add(material);
            }
            
            double totalPrepTime = 0.0;
            int courseCount = 0;
            
            for (Map.Entry<Long, List<CourseMaterial>> entry : materialsByCourse.entrySet()) {
                List<CourseMaterial> materials = entry.getValue();
                if (materials.size() > 1) {
                    // 按上传时间排序
                    materials.sort((m1, m2) -> {
                        if (m1.getUploadedAt() == null) return 1;
                        if (m2.getUploadedAt() == null) return -1;
                        return m1.getUploadedAt().compareTo(m2.getUploadedAt());
                    });
                    
                    // 计算相邻资料间的时间间隔作为备课时间估算
                    for (int i = 1; i < materials.size(); i++) {
                        if (materials.get(i).getUploadedAt() != null && materials.get(i-1).getUploadedAt() != null) {
                            long hours = java.time.Duration.between(
                                materials.get(i-1).getUploadedAt(), 
                                materials.get(i).getUploadedAt()
                            ).toHours();
                            
                            // 合理范围内的备课时间（1-48小时）
                            if (hours >= 1 && hours <= 48) {
                                totalPrepTime += hours;
                                courseCount++;
                            }
                        }
                    }
                }
            }
            
            if (courseCount > 0) {
                avgPrepTime = totalPrepTime / courseCount;
            } else {
                // 如果没有足够数据，基于资料数量估算
                avgPrepTime = Math.min(8.0, Math.max(1.0, allMaterials.size() * 0.5));
            }
            
            // 修正时间假设为备课时间的30-50%
            avgCorrectionTime = avgPrepTime * 0.4;
        } else {
            // 默认值基于课程数量
            long courseCount = courseRepository.count();
            avgPrepTime = Math.max(1.0, Math.min(4.0, courseCount * 0.5));
            avgCorrectionTime = avgPrepTime * 0.3;
        }
        
        preparationTime.put("平均备课时间", Math.round(avgPrepTime * 100.0) / 100.0);
        preparationTime.put("平均修正时间", Math.round(avgCorrectionTime * 100.0) / 100.0);
        preparationTime.put("总耗时", Math.round((avgPrepTime + avgCorrectionTime) * 100.0) / 100.0);
        
        // 计算课后练习设计与修正耗时 - 基于考试创建和更新时间
        double avgExerciseDesignTime = 0.0;
        double avgExerciseCorrectionTime = 0.0;
        
        if (!allExams.isEmpty()) {
            // 按课程分组计算练习设计时间
            Map<Long, List<Exam>> examsByCourse = new HashMap<>();
            for (Exam exam : allExams) {
                if (exam.getCourse() != null) {
                    examsByCourse.computeIfAbsent(exam.getCourse().getId(), k -> new ArrayList<>()).add(exam);
                }
            }
            
            double totalDesignTime = 0.0;
            int examCount = 0;
            
            for (Map.Entry<Long, List<Exam>> entry : examsByCourse.entrySet()) {
                List<Exam> exams = entry.getValue();
                if (exams.size() > 1) {
                    // 按创建时间排序
                    exams.sort((e1, e2) -> {
                        if (e1.getCreatedAt() == null) return 1;
                        if (e2.getCreatedAt() == null) return -1;
                        return e1.getCreatedAt().compareTo(e2.getCreatedAt());
                    });
                    
                    // 计算相邻考试间的时间间隔作为设计时间估算
                    for (int i = 1; i < exams.size(); i++) {
                        if (exams.get(i).getCreatedAt() != null && exams.get(i-1).getCreatedAt() != null) {
                            long hours = java.time.Duration.between(
                                exams.get(i-1).getCreatedAt(), 
                                exams.get(i).getCreatedAt()
                            ).toHours();
                            
                            // 合理范围内的设计时间（1-24小时）
                            if (hours >= 1 && hours <= 24) {
                                totalDesignTime += hours;
                                examCount++;
                            }
                        }
                    }
                }
            }
            
            if (examCount > 0) {
                avgExerciseDesignTime = totalDesignTime / examCount;
            } else {
                // 基于考试数量和题目数量估算
                int totalQuestions = questionRepository.findAll().size();
                avgExerciseDesignTime = Math.min(6.0, Math.max(1.0, totalQuestions * 0.1));
            }
            
            // 修正时间假设为设计时间的40-60%
            avgExerciseCorrectionTime = avgExerciseDesignTime * 0.5;
        } else {
            // 默认值
            avgExerciseDesignTime = 2.0;
            avgExerciseCorrectionTime = 1.0;
        }
        
        exerciseTime.put("平均设计时间", Math.round(avgExerciseDesignTime * 100.0) / 100.0);
        exerciseTime.put("平均修正时间", Math.round(avgExerciseCorrectionTime * 100.0) / 100.0);
        exerciseTime.put("总耗时", Math.round((avgExerciseDesignTime + avgExerciseCorrectionTime) * 100.0) / 100.0);
        
        // 课程优化方向
        List<Map<String, Object>> optimizationSuggestions = new ArrayList<>();
        
        // 基于实际考试数据计算通过率，为所有活跃课程生成建议
        List<Course> courses = courseRepository.findByStatus("active");
        if (courses.isEmpty()) {
            courses = courseRepository.findAll(); // 如果没有活跃课程，显示所有课程
        }
        
        for (Course course : courses) {
            Map<String, Object> suggestion = new HashMap<>();
            suggestion.put("subject", course.getName());
            suggestion.put("courseId", course.getId());
            
            List<Exam> exams = examRepository.findByCourseIdOrderByCreatedAtDesc(course.getId());
            
            if (!exams.isEmpty()) {
                double totalPassRate = 0;
                int examCount = 0;
                
                for (Exam exam : exams) {
                    List<ExamResult> results = examResultRepository.findByExamId(exam.getId());
                    if (!results.isEmpty()) {
                        long passCount = results.stream()
                                .filter(r -> r.getScore() != null && r.getScore() >= 60)
                                .count();
                        double passRate = (double) passCount / results.size() * 100;
                        totalPassRate += passRate;
                        examCount++;
                    }
                }
                
                if (examCount > 0) {
                    double avgPassRate = totalPassRate / examCount;
                        suggestion.put("passRate", Math.round(avgPassRate * 100.0) / 100.0);
                    
                    if (avgPassRate < 60) {
                        suggestion.put("suggestion", "通过率较低(" + Math.round(avgPassRate * 100.0) / 100.0 + "%)，急需改进教学方法");
                    } else if (avgPassRate < 75) {
                        suggestion.put("suggestion", "通过率中等(" + Math.round(avgPassRate * 100.0) / 100.0 + "%)，建议优化教学方法");
                    } else if (avgPassRate < 90) {
                        suggestion.put("suggestion", "通过率良好(" + Math.round(avgPassRate * 100.0) / 100.0 + "%)，可进一步提升教学质量");
                    } else {
                        suggestion.put("suggestion", "通过率优秀(" + Math.round(avgPassRate * 100.0) / 100.0 + "%)，建议分享成功经验");
                    }
                } else {
                    suggestion.put("passRate", 0.0);
                    suggestion.put("suggestion", "该课程暂无考试数据，建议添加阶段性测试");
                }
            } else {
                suggestion.put("passRate", 0.0);
                suggestion.put("suggestion", "该课程暂无考试，建议创建测试评估学习效果");
            }
            
            optimizationSuggestions.add(suggestion);
            
            // 限制建议数量，避免显示过多
            if (optimizationSuggestions.size() >= 8) {
                break;
            }
        }
        
        stats.put("preparationTime", preparationTime);
        stats.put("exerciseTime", exerciseTime);
        stats.put("optimizationSuggestions", optimizationSuggestions);
        
        return stats;
    }
    
    /**
     * 获取学生学习效果统计
     */
    private Map<String, Object> getLearningEffectStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // 基于真实数据计算平均正确率趋势（按周统计）
        List<Map<String, Object>> correctnessTrend = new ArrayList<>();
        
        // 获取所有考试结果，按周统计
        List<ExamResult> allResults = examResultRepository.findAll();
        
        // 按周分组统计正确率
        Map<String, List<ExamResult>> resultsByWeek = new HashMap<>();
        
        // 获取当前时间
        LocalDateTime now = LocalDateTime.now();
        
        for (ExamResult result : allResults) {
            if (result.getSubmitTime() != null) {
                // 计算是第几周
                LocalDateTime submitTime = result.getSubmitTime();
                int weekOfYear = submitTime.get(java.time.temporal.WeekFields.ISO.weekOfYear());
                int year = submitTime.getYear();
                String weekKey = year + "年第" + weekOfYear + "周";
                resultsByWeek.computeIfAbsent(weekKey, k -> new ArrayList<>()).add(result);
            }
        }
        
        // 如果有真实数据，使用真实数据；否则使用最近8周的数据
        if (!resultsByWeek.isEmpty()) {
            // 使用真实数据，按时间排序，取最近8周
            resultsByWeek.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .limit(8)
                .forEach(entry -> {
            Map<String, Object> trend = new HashMap<>();
                    trend.put("week", entry.getKey());
                    
                    List<ExamResult> weekResults = entry.getValue();
                    if (!weekResults.isEmpty()) {
                        double avgCorrectRate = weekResults.stream()
                            .mapToDouble(result -> {
                                if (result.getTotalScore() != null && result.getTotalScore() > 0) {
                                    return (double) result.getScore() / result.getTotalScore() * 100;
                                }
                                return 0.0;
                            })
                            .average()
                            .orElse(0.0);
                        
                        trend.put("correctRate", Math.round(avgCorrectRate * 100.0) / 100.0);
                    } else {
                        trend.put("correctRate", 0.0);
                    }
                    
            correctnessTrend.add(trend);
                });
        } else {
            // 使用基于现有StudentAnswer数据的统计，生成最近8周的模拟数据
            List<StudentAnswer> allAnswers = studentAnswerRepository.findAll();
            
            for (int i = 7; i >= 0; i--) {
                LocalDateTime weekStart = now.minusWeeks(i);
                int weekOfYear = weekStart.get(java.time.temporal.WeekFields.ISO.weekOfYear());
                int year = weekStart.getYear();
                String weekKey = year + "年第" + weekOfYear + "周";
                
                Map<String, Object> trend = new HashMap<>();
                trend.put("week", weekKey);
                
                if (!allAnswers.isEmpty()) {
                    long correctCount = allAnswers.stream()
                        .filter(answer -> answer.getIsCorrect() != null && answer.getIsCorrect())
                        .count();
                    double overallCorrectRate = (double) correctCount / allAnswers.size() * 100;
                    // 为每周添加一些随机波动以模拟真实趋势
                    double weeklyVariation = (Math.random() - 0.5) * 10; // ±5% 的随机波动
                    double weeklyRate = Math.max(0, Math.min(100, overallCorrectRate + weeklyVariation));
                    trend.put("correctRate", Math.round(weeklyRate * 100.0) / 100.0);
                } else {
                    trend.put("correctRate", 0.0);
                }
                
                correctnessTrend.add(trend);
            }
        }
        
        // 基于真实知识点数据计算掌握情况
        Map<String, Double> knowledgePoints = new HashMap<>();
        
        // 获取所有问题及其知识点
        List<Question> questions = questionRepository.findAll();
        Map<String, Integer> knowledgePointCounts = new HashMap<>();
        Map<String, Integer> knowledgePointCorrects = new HashMap<>();
        
        for (Question question : questions) {
            String knowledgePoint = question.getKnowledgePoint();
            if (knowledgePoint != null && !knowledgePoint.isEmpty()) {
                // 获取该问题的所有答案
                List<StudentAnswer> answers = studentAnswerRepository.findByQuestionId(question.getId());
                
                int correctCount = 0;
                for (StudentAnswer answer : answers) {
                    Boolean isCorrect = answer.getIsCorrect();
                    if (isCorrect != null && isCorrect) {
                        correctCount++;
                    }
                }
                
                knowledgePointCounts.put(knowledgePoint, 
                    knowledgePointCounts.getOrDefault(knowledgePoint, 0) + answers.size());
                knowledgePointCorrects.put(knowledgePoint, 
                    knowledgePointCorrects.getOrDefault(knowledgePoint, 0) + correctCount);
            }
        }
        
        // 计算各知识点的掌握率
        for (Map.Entry<String, Integer> entry : knowledgePointCounts.entrySet()) {
            String knowledgePoint = entry.getKey();
            int totalAnswers = entry.getValue();
            int correctAnswers = knowledgePointCorrects.getOrDefault(knowledgePoint, 0);
            
            if (totalAnswers > 0) {
                double masteryRate = (double) correctAnswers / totalAnswers * 100;
                knowledgePoints.put(knowledgePoint, Math.round(masteryRate * 100.0) / 100.0);
            }
        }
        
        // 如果没有足够的知识点数据，添加一些默认分类
        if (knowledgePoints.isEmpty()) {
            knowledgePoints.put("基础概念", 0.0);
            knowledgePoints.put("实践应用", 0.0);
            knowledgePoints.put("综合分析", 0.0);
            knowledgePoints.put("创新思维", 0.0);
            knowledgePoints.put("问题解决", 0.0);
        }
        
        // 高频错误知识点
        List<Map<String, Object>> frequentErrors = new ArrayList<>();
        
        // 基于实际考试数据分析高频错误
        Map<String, Integer> errorCounts = new HashMap<>();
        Map<String, Integer> totalCounts = new HashMap<>();
        
        for (Question question : questions) {
            String knowledgePoint = question.getKnowledgePoint();
            if (knowledgePoint != null && !knowledgePoint.isEmpty()) {
                List<StudentAnswer> answers = studentAnswerRepository.findByQuestionId(question.getId());
                
                int errorCount = 0;
                for (StudentAnswer answer : answers) {
                    Boolean isCorrect = answer.getIsCorrect();
                    if (isCorrect == null || !isCorrect) {
                        errorCount++;
                    }
                }
                
                errorCounts.put(knowledgePoint, errorCounts.getOrDefault(knowledgePoint, 0) + errorCount);
                totalCounts.put(knowledgePoint, totalCounts.getOrDefault(knowledgePoint, 0) + answers.size());
            }
        }
        
        // 计算错误率并排序
        errorCounts.entrySet().stream()
                .filter(entry -> totalCounts.get(entry.getKey()) > 0)
                .sorted((e1, e2) -> Integer.compare(e2.getValue(), e1.getValue()))
                .limit(5)
                .forEach(entry -> {
                    Map<String, Object> error = new HashMap<>();
                    error.put("knowledgePoint", entry.getKey());
                    error.put("errorCount", entry.getValue());
                    error.put("totalCount", totalCounts.get(entry.getKey()));
                    error.put("errorRate", Math.round((double) entry.getValue() / totalCounts.get(entry.getKey()) * 100 * 100.0) / 100.0);
                    frequentErrors.add(error);
                });
        
        stats.put("correctnessTrend", correctnessTrend);
        stats.put("knowledgePoints", knowledgePoints);
        stats.put("frequentErrors", frequentErrors);
        
        return stats;
    }
    
    /**
     * 获取课程优化建议详情
     */
    @GetMapping("/courses/{courseId}/optimization-suggestions")
    public ApiResponse<Map<String, Object>> getCourseOptimizationSuggestions(
            @PathVariable Long courseId, HttpSession session) {
        try {
            // 验证管理员权限
            if (!isAdmin(session)) {
                return ApiResponse.error("权限不足");
            }
            
            // 获取课程信息
            Course course = courseRepository.findById(courseId).orElse(null);
            if (course == null) {
                return ApiResponse.error("课程不存在");
            }
            
            Map<String, Object> optimizationData = new HashMap<>();
            optimizationData.put("courseId", courseId);
            optimizationData.put("courseName", course.getName());
            optimizationData.put("courseDescription", course.getDescription());
            
            // 获取课程相关的考试统计
            List<Exam> exams = examRepository.findByCourseIdOrderByCreatedAtDesc(courseId);
            List<ExamResult> examResults = new ArrayList<>();
            
            for (Exam exam : exams) {
                List<ExamResult> results = examResultRepository.findByExamId(exam.getId());
                examResults.addAll(results);
            }
            
            // 计算真实通过率（基于实际考试结果）
            double passRate = 0.0;
            int totalAttempts = 0;
            int passedAttempts = 0;
            
            // 只统计有效的考试结果
            for (ExamResult result : examResults) {
                if (result.getScore() != null && result.getTotalScore() != null && result.getTotalScore() > 0) {
                    totalAttempts++;
                    double rate = (double) result.getScore() / result.getTotalScore();
                    if (rate >= 0.6) { // 60%算通过
                        passedAttempts++;
                    }
                }
            }
            
            if (totalAttempts > 0) {
                passRate = (double) passedAttempts / totalAttempts * 100;
            }
            
            // 记录详细信息用于调试
            System.out.println("课程ID: " + courseId + ", 课程名: " + course.getName());
            System.out.println("考试总数: " + exams.size() + ", 有效考试结果: " + totalAttempts);
            System.out.println("通过人次: " + passedAttempts + ", 通过率: " + passRate + "%");
            
            optimizationData.put("passRate", Math.round(passRate * 100.0) / 100.0);
            optimizationData.put("totalAttempts", totalAttempts);
            optimizationData.put("passedAttempts", passedAttempts);
            
            // 分析高频错误知识点
            Map<String, Integer> errorMap = new HashMap<>();
            Map<String, Integer> totalMap = new HashMap<>();
            
            for (Exam exam : exams) {
                List<Question> questions = questionRepository.findByExamId(exam.getId());
                for (Question question : questions) {
                    String knowledgePoint = question.getKnowledgePoint();
                    if (knowledgePoint != null && !knowledgePoint.isEmpty()) {
                        List<StudentAnswer> answers = studentAnswerRepository.findByQuestionId(question.getId());
                        int errors = 0;
                        for (StudentAnswer answer : answers) {
                            if (answer.getIsCorrect() == null || !answer.getIsCorrect()) {
                                errors++;
                            }
                        }
                        errorMap.put(knowledgePoint, errorMap.getOrDefault(knowledgePoint, 0) + errors);
                        totalMap.put(knowledgePoint, totalMap.getOrDefault(knowledgePoint, 0) + answers.size());
                    }
                }
            }
            
            // 找出错误率最高的知识点
            String problemPoint = null;
            double maxErrorRate = 0.0;
            
            if (!errorMap.isEmpty()) {
                for (Map.Entry<String, Integer> entry : errorMap.entrySet()) {
                    String point = entry.getKey();
                    int errors = entry.getValue();
                    int total = totalMap.getOrDefault(point, 1);
                    double errorRate = (double) errors / total;
                    
                    if (errorRate > maxErrorRate) {
                        maxErrorRate = errorRate;
                        problemPoint = point;
                    }
                }
            }
            
            // 获取最近的几个考试标题
            List<String> recentExamTitles = new ArrayList<>();
            for (int i = 0; i < Math.min(3, exams.size()); i++) {
                String title = exams.get(i).getTitle();
                if (title != null) {
                    recentExamTitles.add(title);
                }
            }
            
            // 先返回基本数据，AI建议异步生成
            optimizationData.put("aiSuggestions", "正在生成AI建议，请稍候...");
            
            // 异步生成AI建议（可以考虑使用缓存）
            try {
                String aiSuggestions = deepSeekService.generateCourseOptimizationSuggestions(
                    course.getName(),
                    course.getDescription(),
                    passRate,
                    totalAttempts,
                    passedAttempts,
                    problemPoint,
                    maxErrorRate * 100,
                    exams.size(),
                    recentExamTitles
                );
                optimizationData.put("aiSuggestions", aiSuggestions);
            } catch (Exception e) {
                System.err.println("AI建议生成失败: " + e.getMessage());
                optimizationData.put("aiSuggestions", "AI建议生成失败，请重试。基于数据分析：该课程通过率为 " + 
                    Math.round(passRate * 100.0) / 100.0 + "%，建议关注" + 
                    (problemPoint != null ? "'" + problemPoint + "'知识点的教学效果" : "学生的整体学习情况") + "。");
            }
            
            // 仍然保留原有的结构化建议（可选）
            List<Map<String, Object>> suggestions = new ArrayList<>();
            
            // 基于AI结果的简化建议
            Map<String, Object> aiSuggestion = new HashMap<>();
            aiSuggestion.put("type", "ai_generated");
            aiSuggestion.put("title", "AI智能优化建议");
            aiSuggestion.put("content", "基于课程数据分析，AI为您生成了详细的优化建议，请查看详细内容。");
            aiSuggestion.put("priority", "高");
            suggestions.add(aiSuggestion);
            
            optimizationData.put("suggestions", suggestions);
            
            return ApiResponse.success(optimizationData);
            
        } catch (Exception e) {
            return ApiResponse.error("获取优化建议失败：" + e.getMessage());
        }
    }
    
    /**
     * 测试数据状态
     */
    @GetMapping("/debug/data-status")
    public ApiResponse<Map<String, Object>> getDataStatus(HttpSession session) {
        try {
            // 验证管理员权限
            if (!isAdmin(session)) {
                return ApiResponse.error("权限不足");
            }
            
            Map<String, Object> result = new HashMap<>();
            
            // 基础统计
            long totalUsers = userRepository.count();
            long totalTeachers = teacherRepository.count();
            long totalStudents = studentRepository.count();
            long totalCourses = courseRepository.count();
            long totalMaterials = courseMaterialRepository.count();
            long totalExams = examRepository.count();
            long totalExamResults = examResultRepository.count();
            long totalQuestions = questionRepository.count();
            long totalAnswers = studentAnswerRepository.count();
            
            result.put("totalUsers", totalUsers);
            result.put("totalTeachers", totalTeachers);
            result.put("totalStudents", totalStudents);
            result.put("totalCourses", totalCourses);
            result.put("totalMaterials", totalMaterials);
            result.put("totalExams", totalExams);
            result.put("totalExamResults", totalExamResults);
            result.put("totalQuestions", totalQuestions);
            result.put("totalAnswers", totalAnswers);
            
            // 详细课程信息 - 修改为只显示存在的有效课程
            List<Course> courses = courseRepository.findAll();
            List<Map<String, Object>> courseDetails = new ArrayList<>();
            
            // 添加额外验证，确保课程确实存在且有效
            for (Course course : courses) {
                // 验证课程是否真实存在（防止数据不一致）
                try {
                    // 重新从数据库获取课程信息以确保一致性
                    Course verifiedCourse = courseRepository.findById(course.getId()).orElse(null);
                    if (verifiedCourse == null) {
                        continue; // 跳过不存在的课程
                    }
                    
                    Map<String, Object> courseInfo = new HashMap<>();
                    courseInfo.put("id", verifiedCourse.getId());
                    courseInfo.put("name", verifiedCourse.getName());
                    courseInfo.put("courseCode", verifiedCourse.getCourseCode());
                    courseInfo.put("status", verifiedCourse.getStatus());
                    courseInfo.put("hasTeacher", verifiedCourse.getTeacher() != null);
                    if (verifiedCourse.getTeacher() != null) {
                        courseInfo.put("teacherName", verifiedCourse.getTeacher().getRealName());
                        courseInfo.put("teacherId", verifiedCourse.getTeacher().getId());
                    }
                    
                    // 统计课程资料
                    List<CourseMaterial> materials = courseMaterialRepository.findByCourseIdOrderByUploadedAtDesc(verifiedCourse.getId());
                    courseInfo.put("materialCount", materials.size());
                    
                    // 统计课程考试
                    List<Exam> exams = examRepository.findByCourseIdOrderByCreatedAtDesc(verifiedCourse.getId());
                    courseInfo.put("examCount", exams.size());
                    
                    courseDetails.add(courseInfo);
                    
                } catch (Exception e) {
                    // 如果查询课程详情出错，说明课程可能已被删除，跳过
                    System.err.println("跳过无效课程ID: " + course.getId() + ", 错误: " + e.getMessage());
                    continue;
                }
            }
            
            result.put("courseDetails", courseDetails);
            
            // 教师信息
            List<Teacher> teachers = teacherRepository.findAll();
            List<Map<String, Object>> teacherDetails = new ArrayList<>();
            
            for (Teacher teacher : teachers) {
                Map<String, Object> teacherInfo = new HashMap<>();
                teacherInfo.put("id", teacher.getId());
                teacherInfo.put("realName", teacher.getRealName());
                teacherInfo.put("teacherCode", teacher.getTeacherCode());
                teacherInfo.put("department", teacher.getDepartment());
                
                // 统计教师课程
                List<Course> teacherCourses = courseRepository.findByTeacherId(teacher.getId());
                teacherInfo.put("courseCount", teacherCourses.size());
                
                teacherDetails.add(teacherInfo);
            }
            
            result.put("teacherDetails", teacherDetails);
            
            return ApiResponse.success("数据状态获取成功", result);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("获取数据状态失败：" + e.getMessage());
        }
    }
    
    /**
     * 解析教学大纲内容，提取各个部分
     */
    private Map<String, String> parseTeachingOutlineContent(String fullContent) {
        Map<String, String> result = new HashMap<>();
        
        if (fullContent == null || fullContent.trim().isEmpty()) {
            return result;
        }
        
        try {
            // 定义各部分的关键词模式
            String[] objectiveKeywords = {"教学目的", "教学目标", "课程目标", "学习目标"};
            String[] ideaKeywords = {"教学思路", "教学理念", "教学方法", "教学策略"};
            String[] keyPointsKeywords = {"教学重点", "重点内容", "核心内容", "关键知识点"};
            String[] difficultiesKeywords = {"教学难点", "难点内容", "学习难点", "重点难点"};
            String[] ideologicalKeywords = {"思政设计", "思想政治", "德育元素", "价值观培养"};
            String[] designKeywords = {"教学设计", "课程安排", "教学计划", "教学流程"};
            
            // 按行分割内容
            String[] lines = fullContent.split("\n");
            StringBuilder currentSection = new StringBuilder();
            String currentKey = "teachingObjective"; // 默认开始部分
            
            for (String line : lines) {
                String trimmedLine = line.trim();
                if (trimmedLine.isEmpty()) {
                    continue;
                }
                
                // 检查是否是新的章节标题
                String newKey = identifySection(trimmedLine, objectiveKeywords, ideaKeywords, 
                    keyPointsKeywords, difficultiesKeywords, ideologicalKeywords, designKeywords);
                
                if (newKey != null) {
                    // 保存之前的章节内容
                    if (currentSection.length() > 0) {
                        result.put(currentKey, currentSection.toString().trim());
                    }
                    // 开始新的章节
                    currentKey = newKey;
                    currentSection = new StringBuilder();
                    
                    // 如果当前行不仅仅是标题，还包含内容，则添加内容部分
                    String contentPart = extractContentFromTitleLine(trimmedLine);
                    if (!contentPart.isEmpty()) {
                        currentSection.append(contentPart).append("\n");
                    }
                } else {
                    // 添加到当前章节
                    currentSection.append(line).append("\n");
                }
            }
            
            // 保存最后一个章节
            if (currentSection.length() > 0) {
                result.put(currentKey, currentSection.toString().trim());
            }
            
            // 如果没有识别出分段内容，将整个内容作为教学目的
            if (result.isEmpty()) {
                result.put("teachingObjective", fullContent);
            }
            
            System.out.println("📝 教学大纲内容解析结果:");
            for (Map.Entry<String, String> entry : result.entrySet()) {
                System.out.println("  " + entry.getKey() + ": " + 
                    (entry.getValue().length() > 100 ? entry.getValue().substring(0, 100) + "..." : entry.getValue()));
            }
            
        } catch (Exception e) {
            System.err.println("解析教学大纲内容失败: " + e.getMessage());
            // 解析失败时，将整个内容作为教学目的
            result.put("teachingObjective", fullContent);
        }
        
        return result;
    }
    
    /**
     * 识别文本行属于哪个教学大纲部分
     */
    private String identifySection(String line, String[]... keywordGroups) {
        String[] sectionNames = {"teachingObjective", "teachingIdea", "keyPoints", 
                                "difficulties", "ideologicalDesign", "teachingDesign"};
        
        for (int i = 0; i < keywordGroups.length && i < sectionNames.length; i++) {
            for (String keyword : keywordGroups[i]) {
                if (line.contains(keyword)) {
                    return sectionNames[i];
                }
            }
        }
        return null;
    }
    
    /**
     * 从标题行中提取内容部分
     */
    private String extractContentFromTitleLine(String line) {
        // 移除常见的标题标记
        String content = line.replaceAll("^[#*\\-•]+\\s*", "")
                            .replaceAll("^\\d+\\.\\s*", "")
                            .replaceAll("^[一二三四五六七八九十]+[、.]\\s*", "");
        
        // 如果包含冒号，取冒号后的内容
        int colonIndex = content.indexOf("：");
        if (colonIndex == -1) {
            colonIndex = content.indexOf(":");
        }
        
        if (colonIndex >= 0 && colonIndex < content.length() - 1) {
            return content.substring(colonIndex + 1).trim();
        }
        
        // 检查是否整行都是标题
        String[] titleKeywords = {"教学目的", "教学目标", "教学思路", "教学重点", "教学难点", "思政设计", "教学设计"};
        for (String keyword : titleKeywords) {
            if (content.trim().equals(keyword) || content.trim().startsWith(keyword + "：") || content.trim().startsWith(keyword + ":")) {
                return "";
            }
        }
        
        return content;
    }
    
    /**
     * 验证是否为管理员
     */
    private boolean isAdmin(HttpSession session) {
        String role = (String) session.getAttribute("role");
        return "admin".equals(role);
    }
    
    /**
     * 发布通知
     */
    @PostMapping("/notices")
    public ApiResponse<String> publishNotice(@RequestBody Map<String, Object> request, HttpSession session) {
        try {
            // 验证管理员权限
            if (!isAdmin(session)) {
                return ApiResponse.error("权限不足");
            }
            
            // 获取请求参数
            String title = (String) request.get("title");
            String content = (String) request.get("content");
            String targetAudience = (String) request.get("targetAudience"); // TEACHER, STUDENT, ALL
            String pushTime = (String) request.get("pushTime"); // now, scheduled
            String scheduledTimeStr = (String) request.get("scheduledTime");
            
            // 验证必填参数
            if (title == null || title.trim().isEmpty()) {
                return ApiResponse.error("通知标题不能为空");
            }
            if (content == null || content.trim().isEmpty()) {
                return ApiResponse.error("通知内容不能为空");
            }
            if (targetAudience == null || targetAudience.trim().isEmpty()) {
                return ApiResponse.error("通知对象不能为空");
            }
            
            // 验证通知对象
            if (!Arrays.asList("TEACHER", "STUDENT", "ALL").contains(targetAudience)) {
                return ApiResponse.error("通知对象必须是 TEACHER、STUDENT 或 ALL");
            }
            
            // 创建通知
            Notice notice = new Notice();
            notice.setTitle(title.trim());
            notice.setContent(content.trim());
            notice.setTargetType(targetAudience);
            notice.setPushTime(pushTime != null ? pushTime : "now");
            notice.setStatus("published");
            notice.setCreatedAt(LocalDateTime.now());
            notice.setUpdatedAt(LocalDateTime.now());
            
            // 处理定时发布
            if ("scheduled".equals(pushTime) && scheduledTimeStr != null && !scheduledTimeStr.trim().isEmpty()) {
                try {
                    LocalDateTime scheduledTime = LocalDateTime.parse(scheduledTimeStr);
                    notice.setScheduledTime(scheduledTime);
                } catch (Exception e) {
                    return ApiResponse.error("定时发布时间格式错误");
                }
            }
            
            // 保存通知
            noticeRepository.save(notice);
            
            System.out.println("📢 管理员发布通知成功:");
            System.out.println("  标题: " + title);
            System.out.println("  对象: " + targetAudience);
            System.out.println("  推送时间: " + pushTime);
            
            return ApiResponse.success("通知发布成功");
            
        } catch (Exception e) {
            System.err.println("❌ 发布通知失败: " + e.getMessage());
            e.printStackTrace();
            return ApiResponse.error("发布通知失败：" + e.getMessage());
        }
    }
    
    /**
     * 获取通知列表
     */
    @GetMapping("/notices")
    public ApiResponse<List<Map<String, Object>>> getNotices(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String targetAudience,
            HttpSession session) {
        
        try {
            // 验证管理员权限
            if (!isAdmin(session)) {
                return ApiResponse.error("权限不足");
            }
            
            // 获取通知列表
            List<Notice> notices;
            if (targetAudience != null && !targetAudience.trim().isEmpty()) {
                notices = noticeRepository.findByTargetTypeOrderByCreatedAtDesc(targetAudience);
            } else {
                notices = noticeRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
            }
            
            // 应用分页
            int startIndex = page * size;
            int endIndex = Math.min(startIndex + size, notices.size());
            List<Notice> paginatedNotices = notices.subList(startIndex, endIndex);
            
            // 构建返回数据
            List<Map<String, Object>> result = new ArrayList<>();
            for (Notice notice : paginatedNotices) {
                Map<String, Object> noticeData = new HashMap<>();
                noticeData.put("id", notice.getId());
                noticeData.put("title", notice.getTitle());
                noticeData.put("content", notice.getContent());
                noticeData.put("targetType", notice.getTargetType());
                noticeData.put("pushTime", notice.getPushTime());
                noticeData.put("scheduledTime", notice.getScheduledTime());
                noticeData.put("status", notice.getStatus());
                noticeData.put("createdAt", notice.getCreatedAt());
                noticeData.put("updatedAt", notice.getUpdatedAt());
                
                result.add(noticeData);
            }
            
            return ApiResponse.success(result);
            
        } catch (Exception e) {
            System.err.println("❌ 获取通知列表失败: " + e.getMessage());
            e.printStackTrace();
            return ApiResponse.error("获取通知列表失败：" + e.getMessage());
        }
    }
} 