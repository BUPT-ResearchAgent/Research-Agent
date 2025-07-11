package com.example.smartedu.controller;

import com.example.smartedu.dto.ApiResponse;
import com.example.smartedu.dto.PublishNoticeRequest;
import com.example.smartedu.entity.*;
import com.example.smartedu.repository.*;
import com.example.smartedu.service.TeacherService;
import com.example.smartedu.service.TeacherManagementService;
import com.example.smartedu.service.CourseCodeService;
import com.example.smartedu.service.CourseService;
import com.example.smartedu.service.DeepSeekService;
import com.example.smartedu.service.CapabilityAnalysisService;
import com.example.smartedu.service.AIDetectionService;
import com.example.smartedu.entity.CapabilityDimension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.itextpdf.html2pdf.HtmlConverter;
import com.itextpdf.html2pdf.ConverterProperties;
import com.itextpdf.layout.font.FontProvider;
import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.text.SimpleDateFormat;


import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/teacher")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class TeacherController {
    
    @Autowired
    private TeacherService teacherService;
    
    @Autowired
    private TeacherManagementService teacherManagementService;
    
    @Autowired
    private CourseRepository courseRepository;
    
    @Autowired
    private CourseCodeService courseCodeService;
    
    @Autowired
    private ExamRepository examRepository;
    
    @Autowired
    private ExamResultRepository examResultRepository;
    
    @Autowired
    private CourseService courseService;
    
    @Autowired
    private TeacherRepository teacherRepository;
    
    @Autowired
    private NoticeRepository noticeRepository;
    
    @Autowired
    private StudentAnswerRepository studentAnswerRepository;
    
    @Autowired
    private DeepSeekService deepSeekService;
    
    @Autowired
    private QuestionRepository questionRepository;
    
    @Autowired
    private CapabilityAnalysisService capabilityAnalysisService;
    
    @Autowired
    private AIDetectionService aiDetectionService;
    
    /**
     * 获取教师课程列表
     */
    @GetMapping("/courses")
    public ApiResponse<List<Map<String, Object>>> getTeacherCourses(jakarta.servlet.http.HttpSession session) {
        try {
            // 从session获取用户ID
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("未登录，请先登录");
            }
            
            String role = (String) session.getAttribute("role");
            if (!"teacher".equals(role)) {
                return ApiResponse.error("权限不足");
            }
            
            List<Course> courses = teacherService.getTeacherCoursesByUserId(userId);
            
            // 为每个课程添加实时学生数量
            List<Map<String, Object>> coursesWithStudentCount = courses.stream().map(course -> {
                Map<String, Object> courseData = new HashMap<>();
                courseData.put("id", course.getId());
                courseData.put("name", course.getName());
                courseData.put("courseCode", course.getCourseCode());
                courseData.put("description", course.getDescription());
                courseData.put("credit", course.getCredit());
                courseData.put("hours", course.getHours());
                courseData.put("semester", course.getSemester());
                courseData.put("academicYear", course.getAcademicYear());
                courseData.put("classTime", course.getClassTime());
                courseData.put("classLocation", course.getClassLocation());
                courseData.put("maxStudents", course.getMaxStudents());
                courseData.put("status", course.getStatus());
                courseData.put("createdAt", course.getCreatedAt());
                courseData.put("updatedAt", course.getUpdatedAt());
                
                // 获取实时学生数量
                long studentCount = courseService.getActiveCourseStudentCount(course.getId());
                courseData.put("currentStudents", (int) studentCount);
                
                return courseData;
            }).collect(Collectors.toList());
            
            System.out.println("获取课程列表，用户ID: " + userId + ", 课程数量: " + courses.size());
            
            return ApiResponse.success(coursesWithStudentCount);
        } catch (Exception e) {
            return ApiResponse.error("获取课程列表失败：" + e.getMessage());
        }
    }
    
    /**
     * 获取教师课程列表 - 兼容参数方式（用于测试）
     */
    @GetMapping("/courses/by-user")
    public ApiResponse<List<Course>> getTeacherCoursesByParam(@RequestParam Long userId) {
        try {
            List<Course> courses = teacherService.getTeacherCoursesByUserId(userId);
            
            System.out.println("获取课程列表，用户ID: " + userId + ", 课程数量: " + courses.size());
            
            return ApiResponse.success(courses);
        } catch (Exception e) {
            return ApiResponse.error("获取课程列表失败：" + e.getMessage());
        }
    }
    
    /**
     * 创建课程
     */
    @PostMapping("/courses")
    public ApiResponse<Course> createCourse(jakarta.servlet.http.HttpSession session,
                                          @RequestBody Map<String, Object> request) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("用户未登录，请重新登录");
            }
            
            String role = (String) session.getAttribute("role");
            if (!"teacher".equals(role)) {
                return ApiResponse.error("权限不足，非教师用户");
            }
            
            String name = (String) request.get("name");
            String description = (String) request.get("description");
            Integer credit = request.get("credit") != null ? Integer.valueOf(request.get("credit").toString()) : null;
            Integer hours = request.get("hours") != null ? Integer.valueOf(request.get("hours").toString()) : null;
            String semester = (String) request.get("semester");
            String academicYear = (String) request.get("academicYear");
            String classTime = (String) request.get("classTime");
            String classLocation = (String) request.get("classLocation");
            Integer maxStudents = request.get("maxStudents") != null ? Integer.valueOf(request.get("maxStudents").toString()) : null;
            
            // 通过用户ID获取教师信息
            Optional<Teacher> teacherOpt = teacherManagementService.getTeacherByUserId(userId);
            if (!teacherOpt.isPresent()) {
                return ApiResponse.error("教师信息不存在");
            }
            
            Course course = teacherService.createCourse(teacherOpt.get().getId(), name, description, 
                                                      credit, hours, semester, academicYear, classTime, classLocation, maxStudents);
            
            return ApiResponse.success("课程创建成功", course);
        } catch (Exception e) {
            return ApiResponse.error("创建课程失败：" + e.getMessage());
        }
    }
    
    /**
     * 创建课程 - 兼容参数方式（用于测试）
     */
    @PostMapping("/courses/by-user")
    public ApiResponse<Course> createCourseByParam(@RequestBody Map<String, Object> request) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            String name = (String) request.get("name");
            String description = (String) request.get("description");
            Integer credit = request.get("credit") != null ? Integer.valueOf(request.get("credit").toString()) : null;
            Integer hours = request.get("hours") != null ? Integer.valueOf(request.get("hours").toString()) : null;
            String semester = (String) request.get("semester");
            String academicYear = (String) request.get("academicYear");
            String classTime = (String) request.get("classTime");
            String classLocation = (String) request.get("classLocation");
            Integer maxStudents = request.get("maxStudents") != null ? Integer.valueOf(request.get("maxStudents").toString()) : null;
            
            // 通过用户ID获取教师信息
            Optional<Teacher> teacherOpt = teacherManagementService.getTeacherByUserId(userId);
            if (!teacherOpt.isPresent()) {
                return ApiResponse.error("教师信息不存在");
            }
            
            Course course = teacherService.createCourse(teacherOpt.get().getId(), name, description, 
                                                      credit, hours, semester, academicYear, classTime, classLocation, maxStudents);
            
            return ApiResponse.success("课程创建成功", course);
        } catch (Exception e) {
            return ApiResponse.error("创建课程失败：" + e.getMessage());
        }
    }
    
    /**
     * 获取课程资料列表
     */
    @GetMapping("/materials")
    public ApiResponse<List<CourseMaterial>> getMaterials(@RequestParam(required = false) Long courseId,
                                                         jakarta.servlet.http.HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("用户未登录，请重新登录");
            }
            
            String role = (String) session.getAttribute("role");
            if (!"teacher".equals(role)) {
                return ApiResponse.error("权限不足，非教师用户");
            }
            
            List<CourseMaterial> materials;
            if (courseId != null) {
                materials = teacherService.getCourseMaterials(courseId);
            } else {
                // 通过用户ID获取教师信息
                Optional<Teacher> teacherOpt = teacherManagementService.getTeacherByUserId(userId);
                if (!teacherOpt.isPresent()) {
                    return ApiResponse.error("教师信息不存在");
                }
                materials = teacherService.getAllTeacherMaterials(teacherOpt.get().getId());
            }
            return ApiResponse.success("获取成功", materials);
        } catch (Exception e) {
            return ApiResponse.error("获取资料列表失败：" + e.getMessage());
        }
    }
    
    /**
     * 获取指定课程的资料列表
     */
    @GetMapping("/courses/{courseId}/materials")
    public ApiResponse<List<CourseMaterial>> getCourseMaterials(@PathVariable Long courseId) {
        try {
            System.out.println("获取课程资料请求，courseId: " + courseId);
            List<CourseMaterial> materials = teacherService.getCourseMaterials(courseId);
            System.out.println("查询到的资料数量: " + materials.size());
            for (CourseMaterial material : materials) {
                System.out.println("  资料ID: " + material.getId() + ", 名称: " + material.getOriginalName());
            }
            return ApiResponse.success("获取成功", materials);
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("获取课程资料失败: " + e.getMessage());
            return ApiResponse.error("获取课程资料失败：" + e.getMessage());
        }
    }

    /**
     * 上传课程资料
     */
    @PostMapping("/materials/upload")
    public ApiResponse<CourseMaterial> uploadCourseMaterial(
            @RequestParam Long courseId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String materialType,
            @RequestParam(required = false) String description) {
        try {
            if (file.isEmpty()) {
                return ApiResponse.error("请选择要上传的文件");
            }
            
            CourseMaterial material = teacherService.uploadCourseMaterial(courseId, file, materialType, description);
            return ApiResponse.success("文件上传成功", material);
        } catch (Exception e) {
            e.printStackTrace(); // 打印详细错误信息
            return ApiResponse.error("文件上传失败：" + e.getMessage());
        }
    }

    /**
     * 下载课程资料
     */
    @GetMapping("/materials/{materialId}/download")
    public ResponseEntity<byte[]> downloadMaterial(@PathVariable Long materialId) {
        try {
            CourseMaterial material = teacherService.getMaterialById(materialId);
            if (material == null || material.getFileData() == null) {
                return ResponseEntity.notFound().build();
            }
            
            // 对文件名进行URL编码，支持中文文件名
            String filename = material.getOriginalName();
            String encodedFilename = java.net.URLEncoder.encode(filename, "UTF-8")
                    .replaceAll("\\+", "%20");
            
            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename*=UTF-8''" + encodedFilename)
                    .header("Content-Type", material.getFileType())
                    .body(material.getFileData());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 删除课程资料
     */
    @DeleteMapping("/materials/{materialId}")
    public ApiResponse<Void> deleteMaterial(@PathVariable Long materialId) {
        try {
            CourseMaterial material = teacherService.getMaterialById(materialId);
            if (material == null) {
                return ApiResponse.error("资料不存在");
            }
            
            teacherService.deleteMaterial(materialId);
            return ApiResponse.success("资料删除成功", null);
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("删除资料失败：" + e.getMessage());
        }
    }
    
    /**
     * 生成教学大纲（基于知识库）
     */
    @PostMapping("/outline/generate")
    public ApiResponse<TeachingOutline> generateTeachingOutline(@RequestBody Map<String, Object> request) {
        try {
            Long courseId = Long.valueOf(request.get("courseId").toString());
            String requirements = (String) request.get("requirements");
            Integer hours = request.get("hours") != null ? Integer.valueOf(request.get("hours").toString()) : null;
            
            // 验证必填参数
            if (courseId == null) {
                return ApiResponse.error("课程ID不能为空");
            }
            if (hours == null || hours <= 0) {
                return ApiResponse.error("教学学时必须大于0");
            }
            
            TeachingOutline outline = teacherService.generateOutlineWithKnowledgeBase(courseId, requirements, hours);
            System.out.println("控制器：基于知识库的教学大纲生成成功，返回数据 - ID: " + outline.getId() + 
                ", 课程: " + (outline.getCourse() != null ? outline.getCourse().getName() : "null") +
                ", 内容长度: " + (outline.getTeachingDesign() != null ? outline.getTeachingDesign().length() : 0));
            return ApiResponse.success("基于知识库的教学大纲生成成功", outline);
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("生成教学大纲失败：" + e.getMessage());
        }
    }
    
    /**
     * 重新生成教学大纲（更新现有大纲，基于知识库）
     */
    @PostMapping("/outline/regenerate")
    public ApiResponse<TeachingOutline> regenerateTeachingOutline(@RequestBody Map<String, Object> request) {
        try {
            Long outlineId = Long.valueOf(request.get("outlineId").toString());
            Long courseId = Long.valueOf(request.get("courseId").toString());
            String requirements = (String) request.get("requirements");
            Integer hours = request.get("hours") != null ? Integer.valueOf(request.get("hours").toString()) : null;
            
            // 验证必填参数
            if (outlineId == null) {
                return ApiResponse.error("大纲ID不能为空");
            }
            if (courseId == null) {
                return ApiResponse.error("课程ID不能为空");
            }
            if (hours == null || hours <= 0) {
                return ApiResponse.error("教学学时必须大于0");
            }
            
            TeachingOutline outline = teacherService.regenerateOutlineWithKnowledgeBase(outlineId, courseId, requirements, hours);
            System.out.println("控制器：基于知识库的教学大纲重新生成成功，更新数据 - ID: " + outline.getId() + 
                ", 课程: " + (outline.getCourse() != null ? outline.getCourse().getName() : "null") +
                ", 内容长度: " + (outline.getTeachingDesign() != null ? outline.getTeachingDesign().length() : 0));
            return ApiResponse.success("基于知识库的教学大纲重新生成成功", outline);
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("重新生成教学大纲失败：" + e.getMessage());
        }
    }
    
    /**
     * 获取教学大纲历史记录
     */
    @GetMapping("/outlines")
    public ApiResponse<List<TeachingOutline>> getOutlineHistory(@RequestParam(required = false) Long courseId,
                                                               jakarta.servlet.http.HttpSession session) {
        try {
            // 从session获取用户ID
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("未登录，请先登录");
            }
            
            String role = (String) session.getAttribute("role");
            if (!"teacher".equals(role)) {
                return ApiResponse.error("权限不足");
            }
            
            // 通过用户ID获取教师信息
            Optional<Teacher> teacherOpt = teacherManagementService.getTeacherByUserId(userId);
            if (!teacherOpt.isPresent()) {
                return ApiResponse.error("教师信息不存在");
            }
            
            Teacher teacher = teacherOpt.get();
            System.out.println("获取教学大纲历史记录，教师ID: " + teacher.getId() + ", courseId: " + courseId);
            
            // 获取该教师的教学大纲历史记录
            List<TeachingOutline> outlines = teacherService.getTeacherOutlineHistory(teacher.getId(), courseId);
            System.out.println("找到教学大纲数量: " + outlines.size());
            
            for (TeachingOutline outline : outlines) {
                System.out.println("大纲ID: " + outline.getId() + ", 课程: " + 
                    (outline.getCourse() != null ? outline.getCourse().getName() : "null") +
                    ", 教师: " + (outline.getCourse() != null && outline.getCourse().getTeacher() != null ? 
                        outline.getCourse().getTeacher().getRealName() : "null") +
                    ", 创建时间: " + outline.getCreatedAt());
            }
            
            return ApiResponse.success("获取成功", outlines);
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("获取教学大纲历史失败：" + e.getMessage());
        }
    }
    
    /**
     * 删除教学大纲
     */
    @DeleteMapping("/outlines/{outlineId}")
    public ApiResponse<Void> deleteOutline(@PathVariable Long outlineId,
                                          jakarta.servlet.http.HttpSession session) {
        try {
            // 从session获取用户ID
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("未登录，请先登录");
            }
            
            String role = (String) session.getAttribute("role");
            if (!"teacher".equals(role)) {
                return ApiResponse.error("权限不足");
            }
            
            // 通过用户ID获取教师信息
            Optional<Teacher> teacherOpt = teacherManagementService.getTeacherByUserId(userId);
            if (!teacherOpt.isPresent()) {
                return ApiResponse.error("教师信息不存在");
            }
            
            Teacher teacher = teacherOpt.get();
            System.out.println("删除教学大纲，教师ID: " + teacher.getId() + ", 大纲ID: " + outlineId);
            
            // 删除教学大纲（带权限验证）
            teacherService.deleteTeachingOutline(teacher.getId(), outlineId);
            
            return ApiResponse.success("教学大纲删除成功", null);
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("删除教学大纲失败：" + e.getMessage());
        }
    }
    
    /**
     * 注销教师账户
     */
    @DeleteMapping("/delete-account")
    public ApiResponse<Void> deleteAccount(@RequestBody Map<String, String> request,
                                          jakarta.servlet.http.HttpSession session) {
        try {
            // 从session获取用户ID
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("未登录，请先登录");
            }
            
            String role = (String) session.getAttribute("role");
            if (!"teacher".equals(role)) {
                return ApiResponse.error("权限不足");
            }
            
            // 通过用户ID获取教师信息
            Optional<Teacher> teacherOpt = teacherManagementService.getTeacherByUserId(userId);
            if (!teacherOpt.isPresent()) {
                return ApiResponse.error("教师信息不存在");
            }
            
            Teacher teacher = teacherOpt.get();
            String password = request.get("password");
            
            if (password == null || password.trim().isEmpty()) {
                return ApiResponse.error("请输入密码");
            }
            
            System.out.println("开始注销教师账户，教师ID: " + teacher.getId() + ", 用户名: " + teacher.getUser().getUsername());
            
            // 删除教师账户及所有相关数据
            teacherService.deleteTeacherAccount(teacher.getId(), password);
            
            // 清除session
            session.invalidate();
            
            System.out.println("教师账户注销成功");
            return ApiResponse.success("账户注销成功", null);
            
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("注销账户失败: " + e.getMessage());
            return ApiResponse.error("注销账户失败：" + e.getMessage());
        }
    }
    
    /**
     * 发布通知
     */
    @PostMapping("/notices")
    public ApiResponse<Notice> publishNotice(@RequestBody PublishNoticeRequest request, jakarta.servlet.http.HttpSession session) {
        try {
            // 获取当前登录的教师ID
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("用户未登录，请重新登录");
            }
            
            String role = (String) session.getAttribute("role");
            if (!"teacher".equals(role)) {
                return ApiResponse.error("权限不足，非教师用户");
            }
            
            Teacher teacher = teacherRepository.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("教师信息不存在"));
            
            Notice notice = teacherService.publishNotice(
                teacher.getId(),
                request.getTitle(),
                request.getContent(),
                request.getTargetType(),
                request.getCourseId(),
                request.getPriority(),
                request.getPushTime(),
                request.getScheduledTime()
            );
            
            return ApiResponse.success("通知发布成功", notice);
        } catch (Exception e) {
            return ApiResponse.error("发布通知失败：" + e.getMessage());
        }
    }
    
    /**
     * 获取教师发布的通知列表
     */
    @GetMapping("/notices")
    public ApiResponse<List<Notice>> getTeacherNotices(jakarta.servlet.http.HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("用户未登录，请重新登录");
            }
            
            String role = (String) session.getAttribute("role");
            if (!"teacher".equals(role)) {
                return ApiResponse.error("权限不足，非教师用户");
            }
            
            Teacher teacher = teacherRepository.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("教师信息不存在"));
            
            List<Notice> notices = teacherService.getTeacherNotices(teacher.getId());
            return ApiResponse.success("获取通知列表成功", notices);
        } catch (Exception e) {
            return ApiResponse.error("获取通知列表失败：" + e.getMessage());
        }
    }
    
    /**
     * 获取所有教师发送的通知（用于教师端首页显示）
     */
    @GetMapping("/notices/all")
    public ApiResponse<List<Notice>> getAllTeacherNotices(jakarta.servlet.http.HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("用户未登录，请重新登录");
            }
            
            String role = (String) session.getAttribute("role");
            if (!"teacher".equals(role)) {
                return ApiResponse.error("权限不足，非教师用户");
            }
            
            // 获取所有教师发送的通知，按创建时间倒序排列
            List<Notice> allNotices = noticeRepository.findByTargetTypeOrderByCreatedAtDesc("COURSE");
            return ApiResponse.success("获取所有通知成功", allNotices);
        } catch (Exception e) {
            return ApiResponse.error("获取所有通知失败：" + e.getMessage());
        }
    }
    
    /**
     * 更新通知
     */
    @PutMapping("/notices/{noticeId}")
    public ApiResponse<Notice> updateNotice(@PathVariable Long noticeId, @RequestBody PublishNoticeRequest request, jakarta.servlet.http.HttpSession session) {
        try {
            // 获取当前登录的教师ID
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("用户未登录，请重新登录");
            }
            
            String role = (String) session.getAttribute("role");
            if (!"teacher".equals(role)) {
                return ApiResponse.error("权限不足，非教师用户");
            }
            
            Teacher teacher = teacherRepository.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("教师信息不存在"));
            
            Notice notice = teacherService.updateNotice(
                teacher.getId(),
                noticeId,
                request.getTitle(),
                request.getContent(),
                request.getTargetType(),
                request.getCourseId(),
                request.getPushTime(),
                request.getScheduledTime()
            );
            
            return ApiResponse.success("通知更新成功", notice);
        } catch (Exception e) {
            return ApiResponse.error("更新通知失败：" + e.getMessage());
        }
    }
    
    /**
     * 删除通知
     */
    @DeleteMapping("/notices/{noticeId}")
    public ApiResponse<Void> deleteNotice(@PathVariable Long noticeId, jakarta.servlet.http.HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("用户未登录，请重新登录");
            }
            
            String role = (String) session.getAttribute("role");
            if (!"teacher".equals(role)) {
                return ApiResponse.error("权限不足，非教师用户");
            }
            
            Teacher teacher = teacherRepository.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("教师信息不存在"));
            
            // 验证通知是否存在且属于当前教师
            Notice notice = noticeRepository.findById(noticeId)
                    .orElseThrow(() -> new RuntimeException("通知不存在"));
            
            if (!notice.getTeacherId().equals(teacher.getId())) {
                return ApiResponse.error("您没有权限删除此通知");
            }
            
            noticeRepository.deleteById(noticeId);
            return ApiResponse.<Void>success("通知删除成功", null);
        } catch (Exception e) {
            return ApiResponse.error("删除通知失败：" + e.getMessage());
        }
    }

    /**
     * 根据课程代码获取课程信息
     */
    @GetMapping("/courses/code/{courseCode}")
    public ApiResponse<Object> getCourseByCode(@PathVariable String courseCode) {
        try {
            Course course = courseRepository.findByCourseCode(courseCode);
            if (course == null) {
                return ApiResponse.error("课程不存在");
            }
            
            // 手动设置教师信息，避免@JsonIgnore导致的数据丢失
            if (course.getTeacher() != null) {
                // 创建一个包含教师信息的响应对象
                Map<String, Object> courseData = new HashMap<>();
                courseData.put("id", course.getId());
                courseData.put("name", course.getName());
                courseData.put("courseCode", course.getCourseCode());
                courseData.put("description", course.getDescription());
                courseData.put("credit", course.getCredit());
                courseData.put("hours", course.getHours());
                courseData.put("semester", course.getSemester());
                courseData.put("academicYear", course.getAcademicYear());
                courseData.put("classTime", course.getClassTime());
                courseData.put("classLocation", course.getClassLocation());
                courseData.put("maxStudents", course.getMaxStudents());
                courseData.put("currentStudents", course.getCurrentStudents());
                courseData.put("status", course.getStatus());
                courseData.put("createdAt", course.getCreatedAt());
                courseData.put("updatedAt", course.getUpdatedAt());
                
                // 添加教师信息
                Map<String, Object> teacherData = new HashMap<>();
                teacherData.put("id", course.getTeacher().getId());
                teacherData.put("realName", course.getTeacher().getRealName());
                teacherData.put("teacherCode", course.getTeacher().getTeacherCode());
                teacherData.put("department", course.getTeacher().getDepartment());
                teacherData.put("title", course.getTeacher().getTitle());
                courseData.put("teacher", teacherData);
                
                return ApiResponse.success("获取成功", courseData);
            }
            
            return ApiResponse.success("获取成功", course);
        } catch (Exception e) {
            return ApiResponse.error("获取课程信息失败：" + e.getMessage());
        }
    }

    /**
     * 更新课程信息
     */
    @PutMapping("/courses/{courseId}")
    public ApiResponse<Course> updateCourse(@PathVariable Long courseId, @RequestBody Course courseData) {
        try {
            Optional<Course> courseOpt = courseRepository.findById(courseId);
            if (!courseOpt.isPresent()) {
                return ApiResponse.error("课程不存在");
            }
            
            Course course = courseOpt.get();
            course.setName(courseData.getName());
            course.setDescription(courseData.getDescription());
            course.setCredit(courseData.getCredit());
            course.setHours(courseData.getHours());
            course.setSemester(courseData.getSemester());
            course.setAcademicYear(courseData.getAcademicYear());
            course.setClassTime(courseData.getClassTime());
            course.setClassLocation(courseData.getClassLocation());
            course.setMaxStudents(courseData.getMaxStudents());
            course.setTrainingObjectives(courseData.getTrainingObjectives());
            course.setUpdatedAt(LocalDateTime.now());
            
            Course savedCourse = courseRepository.save(course);
            return ApiResponse.success("课程更新成功", savedCourse);
        } catch (Exception e) {
            return ApiResponse.error("更新课程失败：" + e.getMessage());
        }
    }

    /**
     * 设置课程培养目标
     */
    @PostMapping("/courses/{courseId}/training-objectives")
    public ApiResponse<Course> setCourseTrainingObjectives(@PathVariable Long courseId,
                                                         @RequestBody Map<String, Object> request,
                                                         jakarta.servlet.http.HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("用户未登录，请重新登录");
            }
            
            String role = (String) session.getAttribute("role");
            if (!"teacher".equals(role)) {
                return ApiResponse.error("权限不足，非教师用户");
            }
            
            Optional<Course> courseOpt = courseRepository.findById(courseId);
            if (!courseOpt.isPresent()) {
                return ApiResponse.error("课程不存在");
            }
            
            Course course = courseOpt.get();
            
            // 验证当前教师是否拥有该课程
            Optional<Teacher> teacherOpt = teacherManagementService.getTeacherByUserId(userId);
            if (!teacherOpt.isPresent()) {
                return ApiResponse.error("教师信息不存在");
            }
            
            Teacher currentTeacher = teacherOpt.get();
            if (!course.getTeacher().getId().equals(currentTeacher.getId())) {
                return ApiResponse.error("您没有权限修改此课程的培养目标");
            }
            
            String trainingObjectives = (String) request.get("trainingObjectives");
            course.setTrainingObjectives(trainingObjectives);
            course.setUpdatedAt(LocalDateTime.now());
            
            Course savedCourse = courseRepository.save(course);
            return ApiResponse.success("课程培养目标设置成功", savedCourse);
        } catch (Exception e) {
            return ApiResponse.error("设置课程培养目标失败：" + e.getMessage());
        }
    }

    /**
     * 获取课程培养目标
     */
    @GetMapping("/courses/{courseId}/training-objectives")
    public ApiResponse<Map<String, Object>> getCourseTrainingObjectives(@PathVariable Long courseId) {
        try {
            Optional<Course> courseOpt = courseRepository.findById(courseId);
            if (!courseOpt.isPresent()) {
                return ApiResponse.error("课程不存在");
            }
            
            Course course = courseOpt.get();
            Map<String, Object> response = new HashMap<>();
            response.put("courseId", courseId);
            response.put("courseName", course.getName());
            response.put("trainingObjectives", course.getTrainingObjectives());
            
            return ApiResponse.success("获取课程培养目标成功", response);
        } catch (Exception e) {
            return ApiResponse.error("获取课程培养目标失败：" + e.getMessage());
        }
    }

    /**
     * 为题目设置培养目标
     */
    @PostMapping("/questions/{questionId}/training-objective")
    public ApiResponse<Question> setQuestionTrainingObjective(@PathVariable Long questionId,
                                                            @RequestBody Map<String, Object> request,
                                                            jakarta.servlet.http.HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("用户未登录，请重新登录");
            }
            
            String role = (String) session.getAttribute("role");
            if (!"teacher".equals(role)) {
                return ApiResponse.error("权限不足，非教师用户");
            }
            
            Optional<Question> questionOpt = questionRepository.findById(questionId);
            if (!questionOpt.isPresent()) {
                return ApiResponse.error("题目不存在");
            }
            
            Question question = questionOpt.get();
            
            // 验证当前教师是否拥有该题目所属的考试
            Exam exam = question.getExam();
            Course course = exam.getCourse();
            
            Optional<Teacher> teacherOpt = teacherManagementService.getTeacherByUserId(userId);
            if (!teacherOpt.isPresent()) {
                return ApiResponse.error("教师信息不存在");
            }
            
            Teacher currentTeacher = teacherOpt.get();
            if (!course.getTeacher().getId().equals(currentTeacher.getId())) {
                return ApiResponse.error("您没有权限修改此题目的培养目标");
            }
            
            String trainingObjective = (String) request.get("trainingObjective");
            question.setTrainingObjective(trainingObjective);
            
            Question savedQuestion = questionRepository.save(question);
            return ApiResponse.success("题目培养目标设置成功", savedQuestion);
        } catch (Exception e) {
            return ApiResponse.error("设置题目培养目标失败：" + e.getMessage());
        }
    }

    /**
     * 批量为题目设置培养目标
     */
    @PostMapping("/exams/{examId}/questions/training-objectives")
    public ApiResponse<String> setExamQuestionsTrainingObjectives(@PathVariable Long examId,
                                                                @RequestBody Map<String, Object> request,
                                                                jakarta.servlet.http.HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("用户未登录，请重新登录");
            }
            
            String role = (String) session.getAttribute("role");
            if (!"teacher".equals(role)) {
                return ApiResponse.error("权限不足，非教师用户");
            }
            
            Optional<Exam> examOpt = examRepository.findById(examId);
            if (!examOpt.isPresent()) {
                return ApiResponse.error("考试不存在");
            }
            
            Exam exam = examOpt.get();
            Course course = exam.getCourse();
            
            // 验证当前教师是否拥有该考试
            Optional<Teacher> teacherOpt = teacherManagementService.getTeacherByUserId(userId);
            if (!teacherOpt.isPresent()) {
                return ApiResponse.error("教师信息不存在");
            }
            
            Teacher currentTeacher = teacherOpt.get();
            if (!course.getTeacher().getId().equals(currentTeacher.getId())) {
                return ApiResponse.error("您没有权限修改此考试的题目培养目标");
            }
            
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> questionObjectives = (List<Map<String, Object>>) request.get("questionObjectives");
            
            int updatedCount = 0;
            for (Map<String, Object> qo : questionObjectives) {
                Long questionId = Long.valueOf(qo.get("questionId").toString());
                String trainingObjective = (String) qo.get("trainingObjective");
                
                Optional<Question> questionOpt = questionRepository.findById(questionId);
                if (questionOpt.isPresent()) {
                    Question question = questionOpt.get();
                    if (question.getExam().getId().equals(examId)) {
                        question.setTrainingObjective(trainingObjective);
                        questionRepository.save(question);
                        updatedCount++;
                    }
                }
            }
            
            return ApiResponse.success("成功为 " + updatedCount + " 道题目设置了培养目标");
        } catch (Exception e) {
            return ApiResponse.error("批量设置题目培养目标失败：" + e.getMessage());
        }
    }

    /**
     * 删除课程
     */
    @DeleteMapping("/courses/{courseId}")
    public ApiResponse<Void> deleteCourse(@PathVariable Long courseId, jakarta.servlet.http.HttpSession session) {
        // 声明userId变量，确保在整个方法中都可见
        Long userId = null;
        try {
            // 验证用户登录状态
            userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                ApiResponse<Void> errorResponse = ApiResponse.error("用户未登录，请重新登录");
                System.out.println("[DEBUG] 返回登录错误响应: " + errorResponse.toString());
                return errorResponse;
            }
            
            String role = (String) session.getAttribute("role");
            if (!"teacher".equals(role)) {
                ApiResponse<Void> errorResponse = ApiResponse.error("权限不足，非教师用户");
                System.out.println("[DEBUG] 返回权限错误响应: " + errorResponse.toString());
                return errorResponse;
            }
            
            // 验证课程是否存在
            Optional<Course> courseOpt = courseRepository.findById(courseId);
            if (!courseOpt.isPresent()) {
                ApiResponse<Void> errorResponse = ApiResponse.error("课程不存在");
                System.out.println("[DEBUG] 返回课程不存在错误响应: " + errorResponse.toString());
                return errorResponse;
            }
            
            Course course = courseOpt.get();
            
            // 验证当前教师是否拥有该课程
            Optional<Teacher> teacherOpt = teacherManagementService.getTeacherByUserId(userId);
            if (!teacherOpt.isPresent()) {
                ApiResponse<Void> errorResponse = ApiResponse.error("教师信息不存在");
                System.out.println("[DEBUG] 返回教师信息错误响应: " + errorResponse.toString());
                return errorResponse;
            }
            
            Teacher currentTeacher = teacherOpt.get();
            if (!course.getTeacher().getId().equals(currentTeacher.getId())) {
                ApiResponse<Void> errorResponse = ApiResponse.error("您没有权限删除此课程，只能删除自己创建的课程");
                System.out.println("[DEBUG] 返回权限不足错误响应: " + errorResponse.toString());
                return errorResponse;
            }
            
            // 记录详细的删除操作审计日志
            String auditLog = String.format(
                "[AUDIT] 课程删除操作 - 时间: %s, 操作者: %s (教师ID: %d, 用户ID: %d), " +
                "删除课程: %s (课程ID: %d, 课程代码: %s), 操作IP: %s",
                java.time.LocalDateTime.now().toString(),
                currentTeacher.getRealName(),
                currentTeacher.getId(),
                userId,
                course.getName(),
                courseId,
                course.getCourseCode(),
                "未获取" // 可以从HttpServletRequest获取真实IP
            );
            System.out.println(auditLog);
            
            // 使用完整删除方法，先删除所有相关数据再删除课程
            // 删除操作在独立事务中执行，避免事务冲突
            System.out.println("[DEBUG] 开始调用courseService.deleteCourseSimple，课程ID: " + courseId);
            courseService.deleteCourseSimple(courseId);  // 临时使用简化方法测试
            System.out.println("[DEBUG] courseService.deleteCourseSimple调用完成，未抛出异常");
            
            // 记录删除完成日志
            String completionLog = String.format(
                "[AUDIT] 课程删除完成 - 时间: %s, 课程: %s (ID: %d) 已成功删除",
                java.time.LocalDateTime.now().toString(),
                course.getName(),
                courseId
            );
            System.out.println(completionLog);
            
            // 创建成功响应
            ApiResponse<Void> successResponse = ApiResponse.success("课程删除成功", null);
            System.out.println("[DEBUG] 创建成功响应: " + successResponse.toString());
            System.out.println("[DEBUG] 成功响应的success字段: " + successResponse.getSuccess());
            System.out.println("[DEBUG] 成功响应的message字段: " + successResponse.getMessage());
            
            return successResponse;
            
        } catch (Exception e) {
            // 记录删除失败的审计日志
            String failureLog = String.format(
                "[AUDIT] 课程删除失败 - 时间: %s, 用户ID: %s, 课程ID: %d, 错误信息: %s",
                java.time.LocalDateTime.now().toString(),
                userId != null ? userId.toString() : "未知",
                courseId,
                e.getMessage()
            );
            System.err.println(failureLog);
            e.printStackTrace();
            
            // 创建错误响应
            ApiResponse<Void> errorResponse = ApiResponse.error("删除课程失败：" + e.getMessage());
            System.out.println("[DEBUG] 创建错误响应: " + errorResponse.toString());
            System.out.println("[DEBUG] 错误响应的success字段: " + errorResponse.getSuccess());
            System.out.println("[DEBUG] 错误响应的message字段: " + errorResponse.getMessage());
            
            return errorResponse;
        }
    }

    /**
     * 获取教师仪表板统计数据
     */
    @GetMapping("/dashboard/stats")
    public ApiResponse<Map<String, Object>> getDashboardStats(jakarta.servlet.http.HttpSession session) {
        try {
            System.out.println("开始获取教师控制面板统计数据...");
            
            // 从session获取用户ID
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                System.out.println("用户未登录");
                return ApiResponse.error("未登录，请先登录");
            }
            
            String role = (String) session.getAttribute("role");
            if (!"teacher".equals(role)) {
                System.out.println("用户权限不足，角色: " + role);
                return ApiResponse.error("权限不足");
            }
            
            System.out.println("用户ID: " + userId + ", 角色: " + role);
            
            // 通过用户ID获取教师信息
            Optional<Teacher> teacherOpt = teacherManagementService.getTeacherByUserId(userId);
            if (!teacherOpt.isPresent()) {
                System.out.println("教师信息不存在，用户ID: " + userId);
                return ApiResponse.error("教师信息不存在");
            }
            
            Teacher teacher = teacherOpt.get();
            System.out.println("教师信息: " + teacher.getRealName() + " (ID: " + teacher.getId() + ")");
            
            // 获取教师的课程
            List<Course> courses = teacherService.getTeacherCourses(teacher.getId());
            System.out.println("教师课程数量: " + courses.size());
            
            // 获取课程ID列表
            List<Long> courseIds = courses.stream().map(Course::getId).collect(Collectors.toList());
            
            // 统计数据
            Map<String, Object> stats = new HashMap<>();
            stats.put("courseCount", courses.size());
            
            // 统计在线学生数量
            int onlineStudentCount = 0;
            try {
                onlineStudentCount = teacherService.getTeacherOnlineStudentCountByUserId(userId);
                System.out.println("在线学生数量: " + onlineStudentCount);
            } catch (Exception e) {
                System.out.println("获取在线学生数量失败: " + e.getMessage());
                onlineStudentCount = 0;
            }
            stats.put("totalStudents", onlineStudentCount);
            
            // 统计资料数量
            int materialCount = 0;
            try {
            for (Course course : courses) {
                materialCount += teacherService.getCourseMaterials(course.getId()).size();
                }
                System.out.println("资料数量: " + materialCount);
            } catch (Exception e) {
                System.out.println("获取资料数量失败: " + e.getMessage());
                materialCount = 0;
            }
            stats.put("materialCount", materialCount);
            
            // 统计考试数量
            int examCount = 0;
            try {
            for (Long courseId : courseIds) {
                examCount += examRepository.findByCourseIdOrderByCreatedAtDesc(courseId).size();
                }
                System.out.println("考试数量: " + examCount);
            } catch (Exception e) {
                System.out.println("获取考试数量失败: " + e.getMessage());
                examCount = 0;
            }
            stats.put("examCount", examCount);
            
            // 统计待批改的考试数量
            long pendingGradeCount = 0;
            try {
            if (!courseIds.isEmpty()) {
                for (Long courseId : courseIds) {
                    List<Exam> exams = examRepository.findByCourseIdOrderByCreatedAtDesc(courseId);
                    for (Exam exam : exams) {
                        pendingGradeCount += examResultRepository.findByExamAndGradeStatus(exam, "PENDING").size();
                    }
                }
                }
                System.out.println("待批改考试数量: " + pendingGradeCount);
            } catch (Exception e) {
                System.out.println("获取待批改考试数量失败: " + e.getMessage());
                pendingGradeCount = 0;
            }
            stats.put("pendingGradeCount", pendingGradeCount);
            
            // 直接查询数据库获取所有考试成绩来计算平均分
            double averageScore = 0.0;
            try {
                System.out.println("========== 直接查询数据库计算总体平均分 ==========");
                System.out.println("教师课程数量: " + courseIds.size());
                
                List<Double> allScores = new ArrayList<>();
                
                // 直接查询所有考试结果
                for (Long courseId : courseIds) {
                    System.out.println("查询课程 " + courseId + " 的所有考试结果...");
                    
                    // 获取该课程的所有考试
                    List<Exam> courseExams = examRepository.findByCourseIdOrderByCreatedAtDesc(courseId);
                    System.out.println("  课程考试数量: " + courseExams.size());
                    
                    for (Exam exam : courseExams) {
                        System.out.println("  考试: " + exam.getTitle() + " (ID: " + exam.getId() + ")");
                        
                        // 查询该考试的所有结果
                        List<ExamResult> allExamResults = examResultRepository.findByExam(exam);
                        System.out.println("    总考试结果数: " + allExamResults.size());
                        
                        for (ExamResult result : allExamResults) {
                            System.out.println("      结果ID: " + result.getId() + 
                                             ", 学生ID: " + result.getStudentId() + 
                                             ", 提交时间: " + result.getSubmitTime() + 
                                             ", finalScore: " + result.getFinalScore() + 
                                             ", score: " + result.getScore() + 
                                             ", 状态: " + result.getGradeStatus());
                            
                            // 如果有提交时间，就提取分数
                            if (result.getSubmitTime() != null) {
                                Double scoreToUse = null;
                                
                                // 优先使用 finalScore
                                if (result.getFinalScore() != null) {
                                    scoreToUse = result.getFinalScore();
                                    System.out.println("        使用 finalScore: " + scoreToUse);
                                } else if (result.getScore() != null) {
                                    scoreToUse = result.getScore().doubleValue();
                                    System.out.println("        使用 score: " + scoreToUse);
                                }
                                
                                if (scoreToUse != null) {
                                    allScores.add(scoreToUse);
                                    System.out.println("        添加分数: " + scoreToUse + ", 当前总数: " + allScores.size());
                                }
                            }
                        }
                    }
                }
                
                System.out.println("所有收集到的分数: " + allScores);
                System.out.println("总分数个数: " + allScores.size());
                
                // 计算平均分
                if (!allScores.isEmpty()) {
                    averageScore = allScores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
                    System.out.println("计算得到的平均分: " + averageScore);
                } else {
                    System.out.println("没有找到任何分数数据！");
                    
                    // 额外调试：直接查询数据库看看是否有数据
                    System.out.println("=== 额外调试信息 ===");
                    List<ExamResult> allResults = examResultRepository.findAll();
                    System.out.println("数据库中总的ExamResult记录数: " + allResults.size());
                    
                    for (int i = 0; i < Math.min(5, allResults.size()); i++) {
                        ExamResult r = allResults.get(i);
                        System.out.println("  记录" + (i+1) + ": ID=" + r.getId() + 
                                         ", 考试ID=" + r.getExam().getId() + 
                                         ", 学生ID=" + r.getStudentId() + 
                                         ", finalScore=" + r.getFinalScore() + 
                                         ", score=" + r.getScore() + 
                                         ", 提交时间=" + r.getSubmitTime());
                    }
                }
                
                System.out.println("最终平均分: " + String.format("%.2f", averageScore));
                System.out.println("=============================================");
            } catch (Exception e) {
                System.out.println("计算平均分失败: " + e.getMessage());
                e.printStackTrace();
                averageScore = 0.0;
            }
            stats.put("averageScore", averageScore);
            
            // 课程数已经在上面设置了，不需要额外计算
            System.out.println("课程数: " + courses.size());
            
            System.out.println("统计数据获取完成: " + stats);
            return ApiResponse.success("获取统计数据成功", stats);
        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("获取统计数据失败: " + e.getMessage());
            return ApiResponse.error("获取统计数据失败：" + e.getMessage());
        }
    }

    /**
     * 获取指定课程的知识点掌握情况
     */
    @GetMapping("/knowledge-mastery/{courseId}")
    public ApiResponse<List<Map<String, Object>>> getKnowledgeMastery(@PathVariable Long courseId,
                                                                      jakarta.servlet.http.HttpSession session) {
        try {
            System.out.println("开始获取课程 " + courseId + " 的知识点掌握情况...");
            
            // 验证用户权限
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("未登录，请先登录");
            }
            
            String role = (String) session.getAttribute("role");
            if (!"teacher".equals(role)) {
                return ApiResponse.error("权限不足");
            }
            
            // 验证教师是否有权限访问该课程
            Optional<Teacher> teacherOpt = teacherManagementService.getTeacherByUserId(userId);
            if (!teacherOpt.isPresent()) {
                return ApiResponse.error("教师信息不存在");
            }
            
            Teacher teacher = teacherOpt.get();
            List<Course> teacherCourses = teacherService.getTeacherCourses(teacher.getId());
            boolean hasAccess = teacherCourses.stream().anyMatch(course -> course.getId().equals(courseId));
            
            if (!hasAccess) {
                return ApiResponse.error("您没有权限访问该课程");
            }
            
            // 获取该课程的所有考试
            List<Exam> exams = examRepository.findByCourseIdOrderByCreatedAtDesc(courseId);
            System.out.println("课程 " + courseId + " 的考试数量: " + exams.size());
            
            if (exams.isEmpty()) {
                System.out.println("课程 " + courseId + " 没有考试，返回空数据");
                return ApiResponse.success("获取知识点掌握情况成功", List.of());
            }
            
            // 筛选已发布的考试
            List<Exam> publishedExams = exams.stream()
                .filter(Exam::getIsPublished)
                .collect(Collectors.toList());
            System.out.println("已发布的考试数量: " + publishedExams.size());
            
            if (publishedExams.isEmpty()) {
                System.out.println("课程 " + courseId + " 没有已发布的考试，返回空数据");
                return ApiResponse.success("获取知识点掌握情况成功", List.of());
            }
            
            // 统计知识点掌握情况
            Map<String, Map<String, Object>> knowledgeStats = new HashMap<>();
            
            for (Exam exam : publishedExams) {
                System.out.println("处理考试: " + exam.getTitle() + " (ID: " + exam.getId() + ")");
                
                List<Question> questions = questionRepository.findByExamId(exam.getId());
                System.out.println("  - 题目数量: " + questions.size());
                
                List<ExamResult> examResults = examResultRepository.findByExam(exam);
                List<ExamResult> submittedResults = examResults.stream()
                    .filter(result -> result.getSubmitTime() != null)
                    .collect(Collectors.toList());
                System.out.println("  - 考试结果数量: " + examResults.size());
                System.out.println("  - 已提交的考试结果: " + submittedResults.size());
                
                if (questions.isEmpty()) {
                    System.out.println("  - 跳过，该考试没有题目");
                    continue;
                }
                
                if (submittedResults.isEmpty()) {
                    System.out.println("  - 跳过，该考试没有学生提交答案");
                    continue;
                }
                
                int questionsWithKnowledge = 0;
                for (Question question : questions) {
                    String knowledgePoint = question.getKnowledgePoint();
                    if (knowledgePoint == null || knowledgePoint.trim().isEmpty()) {
                        knowledgePoint = "通用知识点";
                    } else {
                        questionsWithKnowledge++;
                    }
                    
                    final String finalKnowledgePoint = knowledgePoint;
                    
                    // 初始化知识点统计
                    knowledgeStats.putIfAbsent(knowledgePoint, new HashMap<String, Object>() {{
                        put("knowledgePoint", finalKnowledgePoint);
                        put("totalQuestions", 0);
                        put("correctAnswers", 0);
                        put("totalAnswers", 0);
                        put("masteryRate", 0.0);
                        put("level", "需要强化");
                    }});
                    
                    Map<String, Object> stats = knowledgeStats.get(knowledgePoint);
                    stats.put("totalQuestions", (Integer) stats.get("totalQuestions") + 1);
                    
                    // 统计该题的答题情况
                    for (ExamResult examResult : submittedResults) {
                        List<StudentAnswer> studentAnswers = studentAnswerRepository.findByExamResultIdAndQuestionId(examResult.getId(), question.getId());
                        for (StudentAnswer answer : studentAnswers) {
                            stats.put("totalAnswers", (Integer) stats.get("totalAnswers") + 1);
                            
                            // 判断答案是否正确
                            boolean isCorrect = false;
                            switch (question.getType()) {
                                case "SINGLE_CHOICE":
                                case "TRUE_FALSE":
                                    isCorrect = question.getAnswer().equals(answer.getAnswer());
                                    break;
                                case "MULTIPLE_CHOICE":
                                    // 多选题需要完全匹配
                                    isCorrect = question.getAnswer().equals(answer.getAnswer());
                                    break;
                                case "FILL_BLANK":
                                case "SHORT_ANSWER":
                                    // 填空题和简答题通过分数判断
                                    isCorrect = answer.getScore() != null && answer.getScore() > 0;
                                    break;
                            }
                            
                            if (isCorrect) {
                                stats.put("correctAnswers", (Integer) stats.get("correctAnswers") + 1);
                            }
                        }
                    }
                }
                
                System.out.println("  - 有知识点的题目数量: " + questionsWithKnowledge);
            }
            
            System.out.println("统计完成，知识点种类数量: " + knowledgeStats.size());
            
            // 计算掌握率并设置等级
            List<Map<String, Object>> masteryList = new ArrayList<>();
            for (Map<String, Object> stats : knowledgeStats.values()) {
                int totalAnswers = (Integer) stats.get("totalAnswers");
                if (totalAnswers > 0) {
                    int correctAnswers = (Integer) stats.get("correctAnswers");
                    double masteryRate = (double) correctAnswers / totalAnswers * 100;
                    stats.put("masteryRate", Math.round(masteryRate * 10.0) / 10.0);
                    
                    // 设置掌握等级
                    String level;
                    if (masteryRate >= 80) {
                        level = "优秀掌握";
                    } else if (masteryRate >= 60) {
                        level = "良好掌握";
                    } else {
                        level = "需要强化";
                    }
                    stats.put("level", level);
                }
                masteryList.add(stats);
            }
            
            // 按掌握率排序
            masteryList.sort((a, b) -> Double.compare(
                (Double) b.get("masteryRate"), 
                (Double) a.get("masteryRate")
            ));
            
            System.out.println("知识点掌握情况统计完成，共 " + masteryList.size() + " 个知识点");
            
            // 输出详细的掌握情况
            for (Map<String, Object> mastery : masteryList) {
                System.out.println("  - " + mastery.get("knowledgePoint") + ": " 
                    + mastery.get("masteryRate") + "% (" 
                    + mastery.get("correctAnswers") + "/" + mastery.get("totalAnswers") + " 答对)");
            }
            
            return ApiResponse.success("获取知识点掌握情况成功", masteryList);
            
        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("获取知识点掌握情况失败: " + e.getMessage());
            return ApiResponse.error("获取知识点掌握情况失败：" + e.getMessage());
        }
    }

    /**
     * 获取待批改试卷列表
     */
    @GetMapping("/grades")
    public ApiResponse<List<Map<String, Object>>> getGradeList(jakarta.servlet.http.HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("未登录，请先登录");
            }
            
            String role = (String) session.getAttribute("role");
            if (!"teacher".equals(role)) {
                return ApiResponse.error("权限不足");
            }
            
            // 获取教师信息
            Optional<Teacher> teacherOpt = teacherManagementService.getTeacherByUserId(userId);
            if (!teacherOpt.isPresent()) {
                return ApiResponse.error("教师信息不存在");
            }
            Teacher teacher = teacherOpt.get();
            
            // 获取教师的所有课程
            List<Course> courses = teacherService.getTeacherCoursesByUserId(userId);
            List<Long> courseIds = courses.stream().map(Course::getId).collect(Collectors.toList());
            
            if (courseIds.isEmpty()) {
                return ApiResponse.success("获取成绩列表成功", List.of());
            }
            
            // 获取所有课程的考试结果
            List<Map<String, Object>> gradeList = new java.util.ArrayList<>();
            for (Long courseId : courseIds) {
                List<Exam> exams = examRepository.findByCourseIdOrderByCreatedAtDesc(courseId);
                for (Exam exam : exams) {
                    List<ExamResult> results = examResultRepository.findByExamOrderBySubmitTimeDesc(exam);
                    for (ExamResult result : results) {
                        if (result.getSubmitTime() != null) { // 只显示已提交的
                            Map<String, Object> gradeInfo = new HashMap<>();
                            gradeInfo.put("id", result.getId());
                            gradeInfo.put("studentName", result.getStudent().getRealName());
                            gradeInfo.put("studentNumber", result.getStudent().getStudentId());
                            gradeInfo.put("examTitle", exam.getTitle());
                            gradeInfo.put("submitTime", result.getSubmitTime());
                            gradeInfo.put("aiScore", result.getAiScore()); // AI评分
                            gradeInfo.put("finalScore", result.getFinalScore()); // 最终得分
                            gradeInfo.put("totalScore", result.getTotalScore());
                            gradeInfo.put("gradeStatus", result.getGradeStatus());
                            gradeInfo.put("teacherComments", result.getTeacherComments());
                            gradeInfo.put("examId", exam.getId());
                            gradeInfo.put("courseId", courseId);
                            gradeInfo.put("courseName", exam.getCourse().getName());
                            gradeInfo.put("isAnswerPublished", exam.getIsAnswerPublished()); // 添加发布状态
                            gradeList.add(gradeInfo);
                        }
                    }
                }
            }
            
            return ApiResponse.success("获取成绩列表成功", gradeList);
        } catch (Exception e) {
            return ApiResponse.error("获取成绩列表失败：" + e.getMessage());
        }
    }
    
    /**
     * 获取考试结果详情（用于批改）
     */
    @GetMapping("/grades/{resultId}")
    public ApiResponse<Map<String, Object>> getGradeDetail(@PathVariable Long resultId, jakarta.servlet.http.HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("未登录，请先登录");
            }
            
            String role = (String) session.getAttribute("role");
            if (!"teacher".equals(role)) {
                return ApiResponse.error("权限不足");
            }
            
            // 获取考试结果
            Optional<ExamResult> resultOpt = examResultRepository.findById(resultId);
            if (!resultOpt.isPresent()) {
                return ApiResponse.error("考试结果不存在");
            }
            ExamResult result = resultOpt.get();
            
            // 验证权限（确保是该教师的课程）
            Exam exam = result.getExam();
            Optional<Teacher> teacherOpt = teacherManagementService.getTeacherByUserId(userId);
            if (!teacherOpt.isPresent() || !exam.getCourse().getTeacher().getId().equals(teacherOpt.get().getId())) {
                return ApiResponse.error("权限不足，无法查看此考试结果");
            }
            
            // 获取学生答案
            List<StudentAnswer> studentAnswers = studentAnswerRepository.findByExamResultId(resultId);
            
            // 构建响应数据，避免Hibernate代理序列化问题
            Map<String, Object> gradeDetail = new HashMap<>();
            
            // 构建ExamResult数据
            Map<String, Object> examResultData = new HashMap<>();
            examResultData.put("id", result.getId());
            examResultData.put("score", result.getScore());
            examResultData.put("totalScore", result.getTotalScore());
            examResultData.put("finalScore", result.getFinalScore());
            examResultData.put("submitTime", result.getSubmitTime());
            examResultData.put("startTime", result.getStartTime());
            examResultData.put("durationMinutes", result.getDurationMinutes());
            examResultData.put("gradeStatus", result.getGradeStatus());
            examResultData.put("teacherComments", result.getTeacherComments());
            examResultData.put("isCorrected", result.getIsCorrected());
            
            // 构建Student数据
            Map<String, Object> studentData = new HashMap<>();
            studentData.put("id", result.getStudent().getId());
            studentData.put("realName", result.getStudent().getRealName());
            studentData.put("studentId", result.getStudent().getStudentId());
            studentData.put("className", result.getStudent().getClassName());
            
            // 构建Exam数据
            Map<String, Object> examData = new HashMap<>();
            examData.put("id", exam.getId());
            examData.put("title", exam.getTitle());
            examData.put("description", exam.getDescription());
            examData.put("duration", exam.getDuration());
            examData.put("totalScore", exam.getTotalScore());
            examData.put("isAnswerPublished", exam.getIsAnswerPublished());
            
            // 构建Course数据
            Map<String, Object> courseData = new HashMap<>();
            courseData.put("id", exam.getCourse().getId());
            courseData.put("name", exam.getCourse().getName());
            courseData.put("description", exam.getCourse().getDescription());
            examData.put("course", courseData);
            
            // 构建Questions数据
            List<Map<String, Object>> questionsData = new ArrayList<>();
            for (Question question : exam.getQuestions()) {
                Map<String, Object> questionData = new HashMap<>();
                questionData.put("id", question.getId());
                questionData.put("content", question.getContent());
                questionData.put("type", question.getType());
                questionData.put("score", question.getScore());
                questionData.put("options", question.getOptions());
                questionData.put("correctAnswer", question.getAnswer());
                questionData.put("explanation", question.getExplanation());
                questionsData.add(questionData);
            }
            
            // 构建StudentAnswers数据
            List<Map<String, Object>> studentAnswersData = new ArrayList<>();
            for (StudentAnswer answer : studentAnswers) {
                Map<String, Object> answerData = new HashMap<>();
                answerData.put("id", answer.getId());
                answerData.put("questionId", answer.getQuestionId());
                answerData.put("answer", answer.getAnswer());
                answerData.put("score", answer.getScore());
                answerData.put("isCorrect", answer.getIsCorrect());
                studentAnswersData.add(answerData);
            }
            
            gradeDetail.put("examResult", examResultData);
            gradeDetail.put("exam", examData);
            gradeDetail.put("student", studentData);
            gradeDetail.put("studentAnswers", studentAnswersData);
            gradeDetail.put("questions", questionsData);
            
            return ApiResponse.success("获取成绩详情成功", gradeDetail);
        } catch (Exception e) {
            return ApiResponse.error("获取成绩详情失败：" + e.getMessage());
        }
    }
    
    /**
     * 手动评分
     */
    @PostMapping("/grades/{resultId}/manual-grade")
    public ApiResponse<String> manualGrade(@PathVariable Long resultId, 
                                         @RequestBody Map<String, Object> gradeData,
                                         jakarta.servlet.http.HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("未登录，请先登录");
            }
            
            String role = (String) session.getAttribute("role");
            if (!"teacher".equals(role)) {
                return ApiResponse.error("权限不足");
            }
            
            // 获取考试结果
            Optional<ExamResult> resultOpt = examResultRepository.findById(resultId);
            if (!resultOpt.isPresent()) {
                return ApiResponse.error("考试结果不存在");
            }
            ExamResult result = resultOpt.get();
            
            // 验证权限
            Exam exam = result.getExam();
            Optional<Teacher> teacherOpt = teacherManagementService.getTeacherByUserId(userId);
            if (!teacherOpt.isPresent() || !exam.getCourse().getTeacher().getId().equals(teacherOpt.get().getId())) {
                return ApiResponse.error("权限不足，无法批改此考试");
            }
            
            // 更新成绩
            Double finalScore = gradeData.get("finalScore") != null ? 
                Double.valueOf(gradeData.get("finalScore").toString()) : null;
            String teacherComments = (String) gradeData.get("teacherComments");
            Boolean isPublished = (Boolean) gradeData.getOrDefault("isPublished", false);
            
            // 处理单题评分
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> questionScores = (List<Map<String, Object>>) gradeData.get("questionScores");
            if (questionScores != null && !questionScores.isEmpty()) {
                // 更新每道题的得分和反馈
                for (Map<String, Object> questionScore : questionScores) {
                    Long questionId = Long.valueOf(questionScore.get("questionId").toString());
                    Integer score = questionScore.get("score") != null ? 
                        Integer.valueOf(questionScore.get("score").toString()) : null;
                    String feedback = (String) questionScore.get("feedback");
                    
                    // 查找对应的学生答案
                    List<StudentAnswer> studentAnswers = studentAnswerRepository.findByExamResultIdAndQuestionId(resultId, questionId);
                    if (!studentAnswers.isEmpty()) {
                        StudentAnswer studentAnswer = studentAnswers.get(0);
                        if (score != null) {
                            studentAnswer.setScore(score);
                        }
                        if (feedback != null && !feedback.trim().isEmpty()) {
                            studentAnswer.setTeacherFeedback(feedback);
                        }
                        studentAnswerRepository.save(studentAnswer);
                    }
                }
                
                // 重新计算总分（用于最终得分，不影响AI评分）
                List<StudentAnswer> allAnswers = studentAnswerRepository.findByExamResultId(resultId);
                int totalScore = allAnswers.stream()
                    .filter(answer -> answer.getScore() != null)
                    .mapToInt(StudentAnswer::getScore)
                    .sum();
                // 注意：不要修改result.setScore()，它应该保持为最初的AI评分
                
                // 如果没有提供最终得分，使用计算出的总分
                if (finalScore == null) {
                    finalScore = (double) totalScore;
                }
            }
            
            result.setFinalScore(finalScore);
            result.setTeacherComments(teacherComments);
            result.setGradeStatus("MANUAL_GRADED");
            result.setIsCorrected(true);
            
            // 如果发布成绩，设置发布状态
            if (isPublished) {
                exam.setIsAnswerPublished(true);
                examRepository.save(exam);
            }
            
            examResultRepository.save(result);
            
            return ApiResponse.success("评分成功");
        } catch (Exception e) {
            return ApiResponse.error("评分失败：" + e.getMessage());
        }
    }
    
    /**
     * 批量自动批改
     */
    @PostMapping("/grades/batch-auto-grade")
    public ApiResponse<String> batchAutoGrade(@RequestBody Map<String, Object> request,
                                            jakarta.servlet.http.HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("未登录，请先登录");
            }
            
            String role = (String) session.getAttribute("role");
            if (!"teacher".equals(role)) {
                return ApiResponse.error("权限不足");
            }
            
            Long examId = Long.valueOf(request.get("examId").toString());
            
            // 获取考试信息
            Optional<Exam> examOpt = examRepository.findById(examId);
            if (!examOpt.isPresent()) {
                return ApiResponse.error("考试不存在");
            }
            Exam exam = examOpt.get();
            
            // 验证权限
            Optional<Teacher> teacherOpt = teacherManagementService.getTeacherByUserId(userId);
            if (!teacherOpt.isPresent() || !exam.getCourse().getTeacher().getId().equals(teacherOpt.get().getId())) {
                return ApiResponse.error("权限不足，无法批改此考试");
            }
            
            // 获取待批改的考试结果
            List<ExamResult> pendingResults = examResultRepository.findByExamAndGradeStatus(exam, "PENDING");
            
            int gradedCount = 0;
            for (ExamResult result : pendingResults) {
                try {
                    // 使用DeepSeek智能评分
                    performIntelligentGrading(result);
                    result.setGradeStatus("AI_GRADED");
                    result.setIsCorrected(true);
                    examResultRepository.save(result);
                    gradedCount++;
                } catch (Exception e) {
                    System.err.println("智能评分失败，学生ID: " + result.getStudent().getId() + ", 错误: " + e.getMessage());
                    // 智能评分失败时，保持原有评分，但存到aiScore字段
                    result.setGradeStatus("AI_GRADED");
                    result.setIsCorrected(true);
                    result.setAiScore(result.getScore().doubleValue());
                    examResultRepository.save(result);
                    gradedCount++;
                }
            }
            
            return ApiResponse.success("批量批改完成，共批改 " + gradedCount + " 份试卷");
        } catch (Exception e) {
            return ApiResponse.error("批量批改失败：" + e.getMessage());
        }
    }
    
    /**
     * 发布/取消发布成绩
     */
    @PostMapping("/grades/publish")
    public ApiResponse<String> publishGrades(@RequestBody Map<String, Object> request,
                                           jakarta.servlet.http.HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("未登录，请先登录");
            }
            
            String role = (String) session.getAttribute("role");
            if (!"teacher".equals(role)) {
                return ApiResponse.error("权限不足");
            }
            
            Long examId = Long.valueOf(request.get("examId").toString());
            Boolean isPublished = (Boolean) request.get("isPublished");
            
            // 获取考试信息
            Optional<Exam> examOpt = examRepository.findById(examId);
            if (!examOpt.isPresent()) {
                return ApiResponse.error("考试不存在");
            }
            Exam exam = examOpt.get();
            
            // 验证权限
            Optional<Teacher> teacherOpt = teacherManagementService.getTeacherByUserId(userId);
            if (!teacherOpt.isPresent() || !exam.getCourse().getTeacher().getId().equals(teacherOpt.get().getId())) {
                return ApiResponse.error("权限不足，无法操作此考试");
            }
            
            // 更新发布状态
            exam.setIsAnswerPublished(isPublished);
            examRepository.save(exam);
            
            return ApiResponse.success(isPublished ? "成绩已发布" : "成绩已取消发布");
        } catch (Exception e) {
            return ApiResponse.error("操作失败：" + e.getMessage());
        }
    }
    
    /**
     * 获取成绩分析数据
     */
    @GetMapping("/analysis/{examId}")
    public ApiResponse<Map<String, Object>> getGradeAnalysis(@PathVariable Long examId,
                                                           jakarta.servlet.http.HttpSession session) {
        try {
            System.out.println("=== 开始处理成绩分析请求 ===");
            System.out.println("考试ID: " + examId);
            
            Long userId = (Long) session.getAttribute("userId");
            System.out.println("当前用户ID: " + userId);
            if (userId == null) {
                System.out.println("用户未登录");
                return ApiResponse.error("未登录，请先登录");
            }
            
            String role = (String) session.getAttribute("role");
            System.out.println("用户角色: " + role);
            if (!"teacher".equals(role)) {
                System.out.println("权限不足，非教师用户");
                return ApiResponse.error("权限不足");
            }
            
            // 获取考试信息
            System.out.println("查询考试信息...");
            Optional<Exam> examOpt = examRepository.findById(examId);
            if (!examOpt.isPresent()) {
                System.out.println("考试不存在: ID=" + examId);
                return ApiResponse.error("考试不存在");
            }
            Exam exam = examOpt.get();
            System.out.println("找到考试: " + exam.getTitle() + ", 课程: " + exam.getCourse().getName());
            
            // 验证权限
            System.out.println("验证教师权限...");
            Optional<Teacher> teacherOpt = teacherManagementService.getTeacherByUserId(userId);
            if (!teacherOpt.isPresent()) {
                System.out.println("未找到对应的教师记录");
                return ApiResponse.error("权限不足，无法查看此考试分析");
            }
            Teacher currentTeacher = teacherOpt.get();
            Teacher examTeacher = exam.getCourse().getTeacher();
            System.out.println("当前教师ID: " + currentTeacher.getId() + ", 考试所属教师ID: " + examTeacher.getId());
            
            if (!examTeacher.getId().equals(currentTeacher.getId())) {
                System.out.println("权限验证失败：不是考试所属教师");
                return ApiResponse.error("权限不足，无法查看此考试分析");
            }
            
            // 获取考试结果
            System.out.println("查询考试结果...");
            List<ExamResult> results = examResultRepository.findByExamOrderBySubmitTimeDesc(exam);
            System.out.println("找到考试结果总数: " + results.size());
            
            // 输出所有结果的详细信息
            for (int i = 0; i < results.size(); i++) {
                ExamResult result = results.get(i);
                System.out.println("结果 " + (i+1) + ": 学生ID=" + result.getStudent().getId() + 
                    ", 提交时间=" + result.getSubmitTime() + 
                    ", 最终分数=" + result.getFinalScore() + 
                    ", 总分=" + result.getScore());
            }
            
            // 修改筛选逻辑：只要有提交时间就认为是有效提交
            List<ExamResult> submittedResults = results.stream()
                .filter(r -> r.getSubmitTime() != null && (r.getFinalScore() != null || r.getScore() != null))
                .collect(Collectors.toList());
            
            System.out.println("有效提交结果数量: " + submittedResults.size());
            
            // 输出有效结果的详细信息
            for (int i = 0; i < submittedResults.size(); i++) {
                ExamResult result = submittedResults.get(i);
                System.out.println("有效结果 " + (i+1) + ": 学生ID=" + result.getStudent().getId() + 
                    ", 提交时间=" + result.getSubmitTime() + 
                    ", 最终分数=" + result.getFinalScore() + 
                    ", 基础分数=" + result.getScore());
            }
            
            if (submittedResults.isEmpty()) {
                System.out.println("没有有效的提交结果，返回空数据");
                Map<String, Object> emptyAnalysis = new HashMap<>();
                emptyAnalysis.put("participantCount", 0);
                emptyAnalysis.put("averageScore", 0.0);
                emptyAnalysis.put("maxScore", 0.0);
                emptyAnalysis.put("minScore", 0.0);
                emptyAnalysis.put("passRate", 0.0);
                emptyAnalysis.put("standardDeviation", 0.0);
                emptyAnalysis.put("scoreDistribution", new HashMap<>());
                emptyAnalysis.put("examTitle", exam.getTitle());
                emptyAnalysis.put("totalScore", exam.getTotalScore());
                return ApiResponse.success("获取分析数据成功", emptyAnalysis);
            }
            
            // 计算统计数据 - 优先使用finalScore，如果为空则使用score
            List<Double> scores = submittedResults.stream()
                .map(result -> {
                    Double finalScore = result.getFinalScore();
                    if (finalScore != null) {
                        return finalScore;
                    } else if (result.getScore() != null) {
                        return result.getScore().doubleValue();
                    } else {
                        return 0.0;
                    }
                })
                .collect(Collectors.toList());
            
            System.out.println("计算得到的分数列表: " + scores);
            
            double averageScore = scores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
            double maxScore = scores.stream().mapToDouble(Double::doubleValue).max().orElse(0.0);
            double minScore = scores.stream().mapToDouble(Double::doubleValue).min().orElse(0.0);
            
            // 计算标准差
            double variance = scores.stream()
                .mapToDouble(score -> Math.pow(score - averageScore, 2))
                .average().orElse(0.0);
            double standardDeviation = Math.sqrt(variance);
            
            // 分数分布
            Map<String, Integer> scoreDistribution = new HashMap<>();
            scoreDistribution.put("90-100", 0);
            scoreDistribution.put("80-89", 0);
            scoreDistribution.put("70-79", 0);
            scoreDistribution.put("60-69", 0);
            scoreDistribution.put("0-59", 0);
            
            // 计算及格率（以60分为及格线）
            long passCount = 0;
            
            for (Double score : scores) {
                if (score >= 60) {
                    passCount++;
                }
                
                if (score >= 90) scoreDistribution.put("90-100", scoreDistribution.get("90-100") + 1);
                else if (score >= 80) scoreDistribution.put("80-89", scoreDistribution.get("80-89") + 1);
                else if (score >= 70) scoreDistribution.put("70-79", scoreDistribution.get("70-79") + 1);
                else if (score >= 60) scoreDistribution.put("60-69", scoreDistribution.get("60-69") + 1);
                else scoreDistribution.put("0-59", scoreDistribution.get("0-59") + 1);
            }
            
            double passRate = submittedResults.size() > 0 ? (passCount * 100.0) / submittedResults.size() : 0.0;
            
            // 错误率分析
            List<Map<String, Object>> errorAnalysis = new ArrayList<>();
            List<Question> questions = questionRepository.findByExamId(examId);
            
            for (int i = 0; i < questions.size(); i++) {
                Question question = questions.get(i);
                
                // 计算该题的错误率
                long totalAnswers = 0;
                long correctAnswers = 0;
                
                for (ExamResult result : submittedResults) {
                    List<StudentAnswer> studentAnswers = studentAnswerRepository.findByExamResultIdAndQuestionId(result.getId(), question.getId());
                    if (!studentAnswers.isEmpty()) {
                        totalAnswers++;
                        StudentAnswer answer = studentAnswers.get(0);
                        // 基于得分判断是否正确（得满分视为正确）
                        if (answer.getScore() != null && answer.getScore().equals(question.getScore())) {
                            correctAnswers++;
                        }
                    }
                }
                
                double errorRate = totalAnswers > 0 ? ((totalAnswers - correctAnswers) * 100.0) / totalAnswers : 0.0;
                
                Map<String, Object> questionAnalysis = new HashMap<>();
                questionAnalysis.put("questionNumber", i + 1);
                questionAnalysis.put("questionType", getQuestionTypeDisplayName(question.getType()));
                questionAnalysis.put("knowledgePoint", question.getKnowledgePoint() != null ? question.getKnowledgePoint() : "未分类");
                questionAnalysis.put("errorRate", Math.round(errorRate * 100.0) / 100.0);
                questionAnalysis.put("commonErrors", generateCommonErrors(question, submittedResults));
                
                errorAnalysis.add(questionAnalysis);
            }
            
            Map<String, Object> analysis = new HashMap<>();
            analysis.put("participantCount", submittedResults.size());
            analysis.put("averageScore", Math.round(averageScore * 100.0) / 100.0);
            analysis.put("maxScore", maxScore);
            analysis.put("minScore", minScore);
            analysis.put("passRate", Math.round(passRate * 100.0) / 100.0);
            analysis.put("standardDeviation", Math.round(standardDeviation * 100.0) / 100.0);
            analysis.put("scoreDistribution", scoreDistribution);
            analysis.put("errorAnalysis", errorAnalysis);
            analysis.put("examTitle", exam.getTitle());
            analysis.put("totalScore", exam.getTotalScore());
            
            return ApiResponse.success("获取分析数据成功", analysis);
        } catch (Exception e) {
            return ApiResponse.error("获取分析数据失败：" + e.getMessage());
        }
    }
    
    /**
     * 临时调试端点 - 查看数据库中的考试和成绩数据
     */
    @GetMapping("/debug/exam-data")
    public ApiResponse<Map<String, Object>> debugExamData(jakarta.servlet.http.HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("未登录");
            }
            
            System.out.println("=== 调试查询数据库数据 ===");
            
            Map<String, Object> debugInfo = new HashMap<>();
            
            // 1. 查询所有考试
            List<Exam> allExams = examRepository.findAll();
            System.out.println("数据库中总考试数量: " + allExams.size());
            
            List<Map<String, Object>> examInfo = new ArrayList<>();
            for (Exam exam : allExams) {
                Map<String, Object> examData = new HashMap<>();
                examData.put("id", exam.getId());
                examData.put("title", exam.getTitle());
                examData.put("isPublished", exam.getIsPublished());
                examData.put("courseName", exam.getCourse().getName());
                examData.put("teacherName", exam.getCourse().getTeacher().getRealName());
                
                // 查询该考试的成绩记录
                List<ExamResult> results = examResultRepository.findByExamId(exam.getId());
                examData.put("totalResults", results.size());
                
                long submittedCount = results.stream()
                    .mapToLong(r -> r.getSubmitTime() != null ? 1 : 0)
                    .sum();
                examData.put("submittedResults", submittedCount);
                
                // 详细的成绩信息
                List<Map<String, Object>> resultDetails = new ArrayList<>();
                for (ExamResult result : results) {
                    Map<String, Object> detail = new HashMap<>();
                    detail.put("studentId", result.getStudentId());
                    detail.put("submitTime", result.getSubmitTime());
                    detail.put("score", result.getScore());
                    detail.put("finalScore", result.getFinalScore());
                    detail.put("gradeStatus", result.getGradeStatus());
                    resultDetails.add(detail);
                }
                examData.put("resultDetails", resultDetails);
                
                examInfo.add(examData);
                
                System.out.println("考试: " + exam.getTitle() + 
                    ", 总记录: " + results.size() + 
                    ", 已提交: " + submittedCount);
            }
            
            debugInfo.put("examInfo", examInfo);
            debugInfo.put("totalExams", allExams.size());
            debugInfo.put("currentUserId", userId);
            
            return ApiResponse.success("调试数据获取成功", debugInfo);
            
        } catch (Exception e) {
            System.err.println("调试查询失败: " + e.getMessage());
            e.printStackTrace();
            return ApiResponse.error("调试查询失败: " + e.getMessage());
        }
    }
    
    /**
     * 导出成绩分析报告为PDF
     */
    @GetMapping("/analysis/{examId}/export")
    public ResponseEntity<byte[]> exportAnalysisReport(@PathVariable Long examId,
                                                       jakarta.servlet.http.HttpSession session) {
        try {
            // 权限检查
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.status(401).build();
            }
            
            String role = (String) session.getAttribute("role");
            if (!"teacher".equals(role)) {
                return ResponseEntity.status(403).build();
            }
            
            // 获取考试信息
            Optional<Exam> examOpt = examRepository.findById(examId);
            if (!examOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            Exam exam = examOpt.get();
            
            // 获取分析数据（复用现有逻辑）
            List<ExamResult> examResults = examResultRepository.findByExamId(examId);
            if (examResults.isEmpty()) {
                return ResponseEntity.noContent().build();
            }
            
            // 只考虑已批改或已提交的结果
            List<ExamResult> submittedResults = examResults.stream()
                    .filter(result -> result.getSubmitTime() != null)
                    .collect(Collectors.toList());
            
            if (submittedResults.isEmpty()) {
                return ResponseEntity.noContent().build();
            }
            
            // 计算统计数据
            double averageScore = submittedResults.stream()
                    .mapToDouble(ExamResult::getTotalScore)
                    .average()
                    .orElse(0.0);
            
            double maxScore = submittedResults.stream()
                    .mapToDouble(ExamResult::getTotalScore)
                    .max()
                    .orElse(0.0);
            
            long passCount = submittedResults.stream()
                    .mapToLong(result -> result.getTotalScore() >= 60 ? 1L : 0L)
                    .sum();
            
            double passRate = (double) passCount / submittedResults.size() * 100;
            
            // 计算标准差
            double variance = submittedResults.stream()
                    .mapToDouble(result -> Math.pow(result.getTotalScore() - averageScore, 2))
                    .average()
                    .orElse(0.0);
            double standardDeviation = Math.sqrt(variance);
            
            // 成绩分布统计
            Map<String, Integer> scoreDistribution = new HashMap<>();
            scoreDistribution.put("90-100", 0);
            scoreDistribution.put("80-89", 0);
            scoreDistribution.put("70-79", 0);
            scoreDistribution.put("60-69", 0);
            scoreDistribution.put("0-59", 0);
            
            submittedResults.forEach(result -> {
                double score = result.getTotalScore();
                if (score >= 90) scoreDistribution.put("90-100", scoreDistribution.get("90-100") + 1);
                else if (score >= 80) scoreDistribution.put("80-89", scoreDistribution.get("80-89") + 1);
                else if (score >= 70) scoreDistribution.put("70-79", scoreDistribution.get("70-79") + 1);
                else if (score >= 60) scoreDistribution.put("60-69", scoreDistribution.get("60-69") + 1);
                else scoreDistribution.put("0-59", scoreDistribution.get("0-59") + 1);
            });
            
            // 错误率分析
            List<Map<String, Object>> errorAnalysis = new ArrayList<>();
            List<Question> questions = questionRepository.findByExamId(examId);
            
            for (int i = 0; i < questions.size(); i++) {
                Question question = questions.get(i);
                List<StudentAnswer> answers = studentAnswerRepository.findByQuestionId(question.getId());
                
                if (!answers.isEmpty()) {
                    long wrongCount = answers.stream()
                            .mapToLong(answer -> (answer.getIsCorrect() != null && !answer.getIsCorrect()) ? 1L : 0L)
                            .sum();
                    
                    double errorRate = (double) wrongCount / answers.size() * 100;
                    
                    Map<String, Object> errorItem = new HashMap<>();
                    errorItem.put("questionNumber", i + 1);
                    errorItem.put("questionType", getQuestionTypeName(question.getType()));
                    errorItem.put("knowledgePoint", question.getKnowledgePoint() != null ? question.getKnowledgePoint() : "未分类");
                    errorItem.put("errorRate", String.format("%.1f", errorRate));
                    errorItem.put("commonErrors", generateCommonErrors(question, submittedResults));
                    
                    errorAnalysis.add(errorItem);
                }
            }
            
            // 生成HTML报告
            String htmlContent = generateAnalysisReportHtml(exam, averageScore, maxScore, passRate, 
                                                           standardDeviation, scoreDistribution, errorAnalysis, submittedResults.size());
            
            // 转换HTML为PDF
            ByteArrayOutputStream pdfOutputStream = new ByteArrayOutputStream();
            
            try {
                // 配置中文字体支持
                ConverterProperties converterProperties = new ConverterProperties();
                FontProvider fontProvider = new FontProvider();
                
                // 添加系统默认字体
                fontProvider.addStandardPdfFonts();
                
                // 尝试添加中文字体
                try {
                    // 添加内置的亚洲字体支持
                    fontProvider.addFont("STSongStd-Light", "UniGB-UCS2-H");
                    fontProvider.addFont("STSong-Light", "UniGB-UCS2-H");
                    fontProvider.addFont("HeiseiMinStd-W3", "UniJIS-UCS2-H");
                    fontProvider.addFont("HeiseiKakuGothicStd-W5", "UniJIS-UCS2-H");
                    System.out.println("成功加载中文字体支持");
                } catch (Exception fontException) {
                    System.out.println("中文字体加载警告: " + fontException.getMessage());
                    // 尝试加载系统字体
                    try {
                        fontProvider.addSystemFonts();
                        System.out.println("已加载系统字体作为备选");
                    } catch (Exception sysException) {
                        System.out.println("系统字体加载失败: " + sysException.getMessage());
                        // 最后备选：使用标准字体
                        fontProvider.addFont(StandardFonts.HELVETICA);
                    }
                }
                
                converterProperties.setFontProvider(fontProvider);
                
                // 设置字符集
                converterProperties.setCharset("UTF-8");
                
                // 转换HTML为PDF
                HtmlConverter.convertToPdf(htmlContent, pdfOutputStream, converterProperties);
            } catch (Exception e) {
                // 如果PDF转换失败，降级为HTML格式
                System.err.println("PDF转换失败，使用HTML格式: " + e.getMessage());
                SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMdd");
                String fileName = String.format("成绩分析报告_%s_%s.html", exam.getTitle(), sdf.format(new java.util.Date()));
                String encodedFileName = URLEncoder.encode(fileName, "UTF-8").replaceAll("\\+", "%20");
                
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.TEXT_HTML);
                headers.set("Content-Disposition", "attachment; filename*=UTF-8''" + encodedFileName);
                headers.set("Cache-Control", "no-cache");
                
                return ResponseEntity.ok()
                        .headers(headers)
                        .body(htmlContent.getBytes("UTF-8"));
            }
            
            // 生成PDF文件名并进行URL编码
            SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMdd");
            String fileName = String.format("成绩分析报告_%s_%s.pdf", exam.getTitle(), sdf.format(new java.util.Date()));
            String encodedFileName = URLEncoder.encode(fileName, "UTF-8").replaceAll("\\+", "%20");
            
            // 设置PDF响应头
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.set("Content-Disposition", "attachment; filename*=UTF-8''" + encodedFileName);
            headers.set("Cache-Control", "no-cache");
            headers.setContentLength(pdfOutputStream.size());
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdfOutputStream.toByteArray());
                    
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }
    
    /**
     * 生成分析报告HTML内容
     */
    private String generateAnalysisReportHtml(Exam exam, double averageScore, double maxScore, 
                                             double passRate, double standardDeviation,
                                             Map<String, Integer> scoreDistribution,
                                             List<Map<String, Object>> errorAnalysis,
                                             int totalStudents) {
        
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy年MM月dd日 HH:mm:ss");
        String currentTime = sdf.format(new java.util.Date());
        
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html>");
        html.append("<html lang='zh-CN'><head>");
        html.append("<meta charset='UTF-8'>");
        html.append("<meta http-equiv='Content-Type' content='text/html; charset=UTF-8'>");
        html.append("<meta name='viewport' content='width=device-width, initial-scale=1.0'>");
        html.append("<title>成绩分析报告</title>");
        html.append("<style>");
        html.append("@page { size: A4; margin: 1cm; }");
        html.append("body { font-family: 'STSong-Light', 'STSongStd-Light', 'SimSun', 'Microsoft YaHei', sans-serif; font-size: 12px; margin: 0; padding: 20px; line-height: 1.4; }");
        html.append("h1 { color: #2c3e50; text-align: center; font-size: 20px; margin-bottom: 30px; page-break-after: avoid; }");
        html.append("h2 { color: #34495e; font-size: 16px; margin-top: 25px; margin-bottom: 15px; border-bottom: 2px solid #3498db; padding-bottom: 5px; page-break-after: avoid; }");
        html.append(".header-info { background: #f8f9fa; padding: 15px; border: 1px solid #e9ecef; margin-bottom: 20px; page-break-inside: avoid; }");
        html.append(".stats-container { display: table; width: 100%; margin: 20px 0; page-break-inside: avoid; }");
        html.append(".stats-row { display: table-row; }");
        html.append(".stat-cell { display: table-cell; width: 25%; padding: 10px; text-align: center; border: 1px solid #e9ecef; background: #fff; }");
        html.append(".stat-value { font-size: 18px; font-weight: bold; color: #2c3e50; display: block; }");
        html.append(".stat-label { font-size: 11px; color: #7f8c8d; margin-top: 5px; display: block; }");
        html.append("table { width: 100%; border-collapse: collapse; margin: 15px 0; page-break-inside: avoid; }");
        html.append("th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; }");
        html.append("th { background-color: #f2f2f2; font-weight: bold; }");
        html.append(".distribution-table td { text-align: center; }");
        html.append(".error-rate { font-weight: bold; }");
        html.append(".error-rate.high { color: #e74c3c; }");
        html.append(".error-rate.medium { color: #f39c12; }");
        html.append(".error-rate.low { color: #27ae60; }");
        html.append(".footer { margin-top: 30px; text-align: center; font-size: 10px; color: #7f8c8d; page-break-inside: avoid; }");
        html.append("</style>");
        html.append("</head><body>");
        
        // 标题
        html.append("<h1>").append(exam.getTitle()).append(" - 成绩分析报告</h1>");
        
        // 基本信息
        html.append("<div class='header-info'>");
        html.append("<p><strong>考试名称：</strong>").append(exam.getTitle()).append("</p>");
        html.append("<p><strong>参与人数：</strong>").append(totalStudents).append("人</p>");
        html.append("<p><strong>生成时间：</strong>").append(currentTime).append("</p>");
        html.append("</div>");
        
        // 统计数据
        html.append("<h2>统计概览</h2>");
        html.append("<div class='stats-container'>");
        html.append("<div class='stats-row'>");
        html.append("<div class='stat-cell'>");
        html.append("<span class='stat-value'>").append(String.format("%.1f", averageScore)).append("</span>");
        html.append("<span class='stat-label'>平均分</span>");
        html.append("</div>");
        html.append("<div class='stat-cell'>");
        html.append("<span class='stat-value'>").append(String.format("%.1f", maxScore)).append("</span>");
        html.append("<span class='stat-label'>最高分</span>");
        html.append("</div>");
        html.append("<div class='stat-cell'>");
        html.append("<span class='stat-value'>").append(String.format("%.1f%%", passRate)).append("</span>");
        html.append("<span class='stat-label'>及格率</span>");
        html.append("</div>");
        html.append("<div class='stat-cell'>");
        html.append("<span class='stat-value'>").append(String.format("%.1f", standardDeviation)).append("</span>");
        html.append("<span class='stat-label'>标准差</span>");
        html.append("</div>");
        html.append("</div></div>");
        
        // 成绩分布
        html.append("<h2>成绩分布</h2>");
        html.append("<table class='distribution-table'>");
        html.append("<tr><th>分数区间</th><th>人数</th><th>占比</th><th>等级</th></tr>");
        
        String[] ranges = {"90-100", "80-89", "70-79", "60-69", "0-59"};
        String[] labels = {"优秀", "良好", "中等", "及格", "不及格"};
        
        for (int i = 0; i < ranges.length; i++) {
            int count = scoreDistribution.get(ranges[i]);
            double percentage = (double) count / totalStudents * 100;
            html.append("<tr>");
            html.append("<td>").append(ranges[i]).append("</td>");
            html.append("<td>").append(count).append("</td>");
            html.append("<td>").append(String.format("%.1f%%", percentage)).append("</td>");
            html.append("<td>").append(labels[i]).append("</td>");
            html.append("</tr>");
        }
        html.append("</table>");
        
        // 错误率分析
        html.append("<h2>错误率分析</h2>");
        html.append("<table>");
        html.append("<tr><th>题目编号</th><th>题目类型</th><th>知识点</th><th>错误率</th><th>常见错误</th></tr>");
        
        for (Map<String, Object> error : errorAnalysis) {
            double errorRate = Double.parseDouble(error.get("errorRate").toString());
            String errorClass = errorRate > 50 ? "high" : errorRate > 30 ? "medium" : "low";
            
            html.append("<tr>");
            html.append("<td>第").append(error.get("questionNumber")).append("题</td>");
            html.append("<td>").append(error.get("questionType")).append("</td>");
                                html.append("<td>").append(error.get("knowledgePoint") != null ? error.get("knowledgePoint") : "未分类").append("</td>");
            html.append("<td><span class='error-rate ").append(errorClass).append("'>").append(error.get("errorRate")).append("%</span></td>");
            html.append("<td>").append(error.get("commonErrors")).append("</td>");
            html.append("</tr>");
        }
        html.append("</table>");
        
        // 页脚
        html.append("<div class='footer'>");
        html.append("<p>本报告由SmartEdu智能教育系统自动生成</p>");
        html.append("</div>");
        
        html.append("</body></html>");
        
        return html.toString();
    }
    
    /**
     * 执行智能评分
     * @param examResult 考试结果
     */
    private void performIntelligentGrading(ExamResult examResult) {
        try {
            // 获取考试信息
            Exam exam = examResult.getExam();
            List<Question> questions = questionRepository.findByExamId(exam.getId());
            
            // 获取学生答案
            List<StudentAnswer> studentAnswers = studentAnswerRepository.findByExamResultId(examResult.getId());
            
            // 构建智能评分请求
            List<Map<String, Object>> gradingRequests = new ArrayList<>();
            
            for (Question question : questions) {
                // 只对非选择题进行智能评分
                if (!"multiple-choice".equals(question.getType()) && 
                    !"choice".equals(question.getType()) &&
                    !"true-false".equals(question.getType()) &&
                    !"true_false".equals(question.getType())) {
                    
                    // 查找对应的学生答案
                    StudentAnswer studentAnswer = studentAnswers.stream()
                        .filter(sa -> sa.getQuestionId().equals(question.getId()))
                        .findFirst()
                        .orElse(null);
                    
                    if (studentAnswer != null) {
                        Map<String, Object> request = new HashMap<>();
                        request.put("questionId", question.getId());
                        request.put("questionContent", question.getContent());
                        request.put("questionType", getQuestionTypeName(question.getType()));
                        request.put("studentAnswer", studentAnswer.getAnswer());
                        request.put("standardAnswer", question.getAnswer());
                        request.put("explanation", question.getExplanation());
                        request.put("maxScore", question.getScore());
                        
                        gradingRequests.add(request);
                    }
                }
            }
            
            if (!gradingRequests.isEmpty()) {
                System.out.println("=== 开始执行智能评分 ===");
                System.out.println("学生ID: " + examResult.getStudent().getId());
                System.out.println("待评分题目数量: " + gradingRequests.size());
                for (Map<String, Object> req : gradingRequests) {
                    System.out.println("题目ID: " + req.get("questionId") + 
                                     ", 类型: " + req.get("questionType") + 
                                     ", 学生答案: " + req.get("studentAnswer"));
                }
                
                // 调用DeepSeek批量智能评分
                List<Map<String, Object>> gradingResults = deepSeekService.batchIntelligentGrading(gradingRequests);
                
                System.out.println("收到评分结果数量: " + gradingResults.size());
                
                // 更新学生答案的评分
                double totalAdjustment = 0.0;
                int processedCount = 0;
                
                for (Map<String, Object> result : gradingResults) {
                    Long questionId = (Long) result.get("questionId");
                    Integer aiScore = (Integer) result.get("score");
                    String feedback = (String) result.get("feedback");
                    
                    // 查找对应的学生答案
                    StudentAnswer studentAnswer = studentAnswers.stream()
                        .filter(sa -> sa.getQuestionId().equals(questionId))
                        .findFirst()
                        .orElse(null);
                    
                    if (studentAnswer != null) {
                        // 计算调整量
                        double originalScore = studentAnswer.getScore() != null ? studentAnswer.getScore() : 0.0;
                        double adjustment = aiScore - originalScore;
                        totalAdjustment += adjustment;
                        
                        // 更新学生答案
                        studentAnswer.setScore(aiScore);
                        studentAnswer.setTeacherFeedback(feedback);
                        studentAnswerRepository.save(studentAnswer);
                        processedCount++;
                    }
                }
                
                // 更新考试结果的AI评分
                if (processedCount > 0) {
                    double originalAiScore = examResult.getAiScore() != null ? examResult.getAiScore() : examResult.getScore().doubleValue();
                    double newAiScore = Math.max(0, originalAiScore + totalAdjustment);
                    examResult.setAiScore(newAiScore);
                    
                    System.out.println("智能评分完成 - 学生ID: " + examResult.getStudent().getId() + 
                                     ", 处理题目数: " + processedCount + 
                                     ", 分数调整: " + totalAdjustment + 
                                     ", AI得分: " + newAiScore);
                }
            } else {
                // 没有需要智能评分的题目，保持原有分数
                examResult.setAiScore(examResult.getScore().doubleValue());
            }
            
        } catch (Exception e) {
            System.err.println("智能评分过程出错: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    /**
     * 单题AI批改
     */
    @PostMapping("/grades/ai-grade-question")
    public ApiResponse<Map<String, Object>> aiGradeQuestion(@RequestBody Map<String, Object> request,
                                                           jakarta.servlet.http.HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("未登录，请先登录");
            }
            
            String role = (String) session.getAttribute("role");
            if (!"teacher".equals(role)) {
                return ApiResponse.error("权限不足");
            }
            
            Long questionId = Long.valueOf(request.get("questionId").toString());
            Long studentAnswerId = Long.valueOf(request.get("studentAnswerId").toString());
            
            // 获取学生答案
            Optional<StudentAnswer> studentAnswerOpt = studentAnswerRepository.findById(studentAnswerId);
            if (!studentAnswerOpt.isPresent()) {
                return ApiResponse.error("学生答案不存在");
            }
            StudentAnswer studentAnswer = studentAnswerOpt.get();
            
            // 获取题目信息
            Optional<Question> questionOpt = questionRepository.findById(questionId);
            if (!questionOpt.isPresent()) {
                return ApiResponse.error("题目不存在");
            }
            Question question = questionOpt.get();
            
            // 验证权限 - 检查是否是该教师的考试
            Exam exam = studentAnswer.getExamResult().getExam();
            Optional<Teacher> teacherOpt = teacherManagementService.getTeacherByUserId(userId);
            if (!teacherOpt.isPresent() || !exam.getCourse().getTeacher().getId().equals(teacherOpt.get().getId())) {
                return ApiResponse.error("权限不足，无法批改此题目");
            }
            
            // 检查是否为非选择题
            if ("multiple-choice".equals(question.getType()) || 
                "choice".equals(question.getType()) ||
                "true-false".equals(question.getType()) ||
                "true_false".equals(question.getType())) {
                return ApiResponse.error("选择题和判断题不支持AI批改");
            }
            
            System.out.println("=== 开始单题AI批改 ===");
            System.out.println("题目ID: " + questionId + ", 学生答案ID: " + studentAnswerId);
            
            // 调用DeepSeek进行单题智能评分
            Integer aiScore = deepSeekService.singleQuestionGrading(
                question.getContent(),
                getQuestionTypeName(question.getType()),
                studentAnswer.getAnswer(),
                question.getAnswer(),
                question.getExplanation(),
                question.getScore()
            );
            
            System.out.println("AI评分结果: " + aiScore + "分");
            
            // 返回AI评分结果
            Map<String, Object> result = new HashMap<>();
            result.put("aiScore", aiScore);
            result.put("maxScore", question.getScore());
            result.put("questionId", questionId);
            result.put("studentAnswerId", studentAnswerId);
            
            return ApiResponse.success("AI批改完成", result);
            
        } catch (Exception e) {
            System.err.println("单题AI批改失败: " + e.getMessage());
            e.printStackTrace();
            return ApiResponse.error("AI批改失败：" + e.getMessage());
        }
    }

    /**
     * 大作业AI检测和建议评分
     */
    @PostMapping("/assignment/ai-detect-and-grade")
    public ApiResponse<Map<String, Object>> detectAndGradeAssignment(@RequestBody Map<String, Object> request,
                                                                   jakarta.servlet.http.HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("未登录，请先登录");
            }
            
            String role = (String) session.getAttribute("role");
            if (!"teacher".equals(role)) {
                return ApiResponse.error("权限不足");
            }
            
            Long studentAnswerId = Long.valueOf(request.get("studentAnswerId").toString());
            
            // 获取学生答案
            Optional<StudentAnswer> studentAnswerOpt = studentAnswerRepository.findById(studentAnswerId);
            if (!studentAnswerOpt.isPresent()) {
                return ApiResponse.error("学生答案不存在");
            }
            StudentAnswer studentAnswer = studentAnswerOpt.get();
            
            // 验证权限 - 检查是否是该教师的考试
            Exam exam = studentAnswer.getExamResult().getExam();
            Optional<Teacher> teacherOpt = teacherManagementService.getTeacherByUserId(userId);
            if (!teacherOpt.isPresent() || !exam.getCourse().getTeacher().getId().equals(teacherOpt.get().getId())) {
                return ApiResponse.error("权限不足，无法批改此作业");
            }
            
            // 检查是否为大作业
            Question question = studentAnswer.getQuestion();
            if (!"assignment".equals(question.getType()) && !question.getType().contains("大作业")) {
                return ApiResponse.error("此题目不是大作业题型");
            }
            
            // 检查是否上传了文档
            if (studentAnswer.getFileContent() == null || studentAnswer.getFileContent().trim().isEmpty()) {
                return ApiResponse.error("学生未上传作业文档");
            }
            
            System.out.println("=== 开始大作业AI检测和评分 ===");
            System.out.println("学生答案ID: " + studentAnswerId);
            System.out.println("文件名: " + studentAnswer.getFileName());
            System.out.println("文件大小: " + studentAnswer.getFileSize() + " bytes");
            
            // 解码文件内容
            String fileContent;
            try {
                byte[] decodedBytes = Base64.getDecoder().decode(studentAnswer.getFileContent());
                fileContent = new String(decodedBytes, "UTF-8");
                
                // 如果是PDF或Word文档，内容可能无法直接读取，使用文件名和基本信息
                if (studentAnswer.getFileName().toLowerCase().endsWith(".pdf") || 
                    studentAnswer.getFileName().toLowerCase().endsWith(".doc") || 
                    studentAnswer.getFileName().toLowerCase().endsWith(".docx")) {
                    fileContent = "文档类型: " + getFileExtension(studentAnswer.getFileName()) + 
                                 "\n文件名: " + studentAnswer.getFileName() + 
                                 "\n文件大小: " + studentAnswer.getFileSize() + " bytes" +
                                 "\n上传时间: " + studentAnswer.getUploadTime() +
                                 "\n\n注意：此为二进制文档文件，内容无法直接提取文本进行AI检测。建议教师手动查看文档内容进行评分。";
                }
            } catch (Exception e) {
                System.err.println("解码文件内容失败: " + e.getMessage());
                fileContent = "文件内容解析失败，文件名: " + studentAnswer.getFileName();
            }
            
            // 构建检测上下文，包含教师设置的作业要求
            String assignmentRequirement = question.getAssignmentRequirement();
            String context = String.format("大作业文档检测\n课程: %s\n题目: %s\n学生: %s\n文件: %s%s", 
                                          exam.getCourse().getName(),
                                          question.getContent(),
                                          studentAnswer.getStudent().getRealName(),
                                          studentAnswer.getFileName(),
                                          assignmentRequirement != null && !assignmentRequirement.trim().isEmpty() ? 
                                              "\n\n作业具体要求：\n" + assignmentRequirement : 
                                              "\n\n注意：教师尚未设置具体的作业要求");
            
            // 调用AI检测服务
            AIDetectionService.AIDetectionResult detectionResult = aiDetectionService.detectAIUsage(fileContent, context);
            
            // 根据AI检测结果计算建议分数
            int maxScore = question.getScore() != null ? question.getScore() : 50;
            int suggestedScore = calculateSuggestedScore(detectionResult, maxScore);
            
            // 构建返回结果
            Map<String, Object> result = new HashMap<>();
            result.put("aiDetectionResult", buildDetectionResultMap(detectionResult));
            result.put("suggestedScore", suggestedScore);
            result.put("maxScore", maxScore);
            result.put("fileName", studentAnswer.getFileName());
            result.put("fileSize", studentAnswer.getFileSize());
            result.put("uploadTime", studentAnswer.getUploadTime());
            result.put("riskLevel", detectionResult.getOverallAssessment().getRiskLevel());
            result.put("aiProbability", detectionResult.getOverallAssessment().getAiProbabilityScore());
            
            System.out.println("AI检测完成 - 风险等级: " + detectionResult.getOverallAssessment().getRiskLevel() + 
                             ", 建议得分: " + suggestedScore + "/" + maxScore);
            
            return ApiResponse.success("AI检测和评分建议完成", result);
            
        } catch (Exception e) {
            System.err.println("大作业AI检测失败: " + e.getMessage());
            e.printStackTrace();
            return ApiResponse.error("AI检测失败：" + e.getMessage());
        }
    }
    
    /**
     * 构建AI检测结果映射
     */
    private Map<String, Object> buildDetectionResultMap(AIDetectionService.AIDetectionResult detectionResult) {
        Map<String, Object> resultMap = new HashMap<>();
        
        // 基本分析信息
        if (detectionResult.getBasicAnalysis() != null) {
            Map<String, Object> basicAnalysis = new HashMap<>();
            basicAnalysis.put("totalCharacters", detectionResult.getBasicAnalysis().getTotalCharacters());
            basicAnalysis.put("totalWords", detectionResult.getBasicAnalysis().getTotalWords());
            basicAnalysis.put("averageSentenceLength", detectionResult.getBasicAnalysis().getAverageSentenceLength());
            basicAnalysis.put("vocabularyComplexity", detectionResult.getBasicAnalysis().getVocabularyComplexity());
            resultMap.put("basicAnalysis", basicAnalysis);
        }
        
        // 检测到的问题
        List<Map<String, Object>> issues = new ArrayList<>();
        if (detectionResult.getDetectedIssues() != null) {
            for (AIDetectionService.AIDetectionIssue issue : detectionResult.getDetectedIssues()) {
                Map<String, Object> issueMap = new HashMap<>();
                issueMap.put("type", issue.getIssueType());
                issueMap.put("description", issue.getDescription());
                issueMap.put("confidence", issue.getConfidenceLevel());
                issueMap.put("details", issue.getDetails());
                issues.add(issueMap);
            }
        }
        resultMap.put("detectedIssues", issues);
        
        // 总体评估
        if (detectionResult.getOverallAssessment() != null) {
            Map<String, Object> assessment = new HashMap<>();
            assessment.put("aiProbabilityScore", detectionResult.getOverallAssessment().getAiProbabilityScore());
            assessment.put("riskLevel", detectionResult.getOverallAssessment().getRiskLevel());
            assessment.put("mainFindings", detectionResult.getOverallAssessment().getMainFindings());
            assessment.put("recommendations", detectionResult.getOverallAssessment().getRecommendations());
            assessment.put("summary", detectionResult.getOverallAssessment().getSummary());
            resultMap.put("overallAssessment", assessment);
        }
        
        // 详细分析报告
        resultMap.put("detailedReport", detectionResult.getDetailedReport());
        
        return resultMap;
    }
    
    /**
     * 根据AI检测结果计算建议分数
     */
    private int calculateSuggestedScore(AIDetectionService.AIDetectionResult detectionResult, int maxScore) {
        if (detectionResult == null || detectionResult.getOverallAssessment() == null) {
            return (int) (maxScore * 0.7); // 默认给70%的分数
        }
        
        String riskLevel = detectionResult.getOverallAssessment().getRiskLevel();
        double aiProbability = detectionResult.getOverallAssessment().getAiProbabilityScore();
        
        double scoreRatio;
        
        switch (riskLevel.toLowerCase()) {
            case "high":
                // 高风险：严重怀疑AI生成，建议分数较低
                scoreRatio = Math.max(0.2, 0.8 - aiProbability * 0.6);
                break;
            case "medium":
                // 中等风险：部分可能AI生成，适度扣分
                scoreRatio = Math.max(0.4, 0.9 - aiProbability * 0.4);
                break;
            case "low":
                // 低风险：基本原创，轻微扣分
                scoreRatio = Math.max(0.6, 1.0 - aiProbability * 0.2);
                break;
            case "normal":
            default:
                // 正常：原创性良好，基本不扣分
                scoreRatio = Math.max(0.7, 1.0 - aiProbability * 0.1);
                break;
        }
        
        return Math.round((float) (maxScore * scoreRatio));
    }
    
    /**
     * 获取文件扩展名（用于AI检测）
     */
    private String getFileExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
    }

    /**
     * 应用AI批改分数
     */
    @PostMapping("/grades/apply-ai-score")
    public ApiResponse<String> applyAiScore(@RequestBody Map<String, Object> request,
                                          jakarta.servlet.http.HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("未登录，请先登录");
            }
            
            String role = (String) session.getAttribute("role");
            if (!"teacher".equals(role)) {
                return ApiResponse.error("权限不足");
            }
            
            Long studentAnswerId = Long.valueOf(request.get("studentAnswerId").toString());
            Integer aiScore = Integer.valueOf(request.get("aiScore").toString());
            
            // 获取学生答案
            Optional<StudentAnswer> studentAnswerOpt = studentAnswerRepository.findById(studentAnswerId);
            if (!studentAnswerOpt.isPresent()) {
                return ApiResponse.error("学生答案不存在");
            }
            StudentAnswer studentAnswer = studentAnswerOpt.get();
            
            // 验证权限
            Exam exam = studentAnswer.getExamResult().getExam();
            Optional<Teacher> teacherOpt = teacherManagementService.getTeacherByUserId(userId);
            if (!teacherOpt.isPresent() || !exam.getCourse().getTeacher().getId().equals(teacherOpt.get().getId())) {
                return ApiResponse.error("权限不足，无法修改此分数");
            }
            
            // 更新分数
            Integer originalScore = studentAnswer.getScore();
            studentAnswer.setScore(aiScore);
            studentAnswer.setTeacherFeedback("AI智能评分");
            studentAnswerRepository.save(studentAnswer);
            
            // 重新计算考试AI总分
            ExamResult examResult = studentAnswer.getExamResult();
            List<StudentAnswer> allAnswers = studentAnswerRepository.findByExamResultId(examResult.getId());
            double totalScore = allAnswers.stream()
                .mapToDouble(sa -> sa.getScore() != null ? sa.getScore() : 0.0)
                .sum();
            
            examResult.setAiScore(totalScore);
            examResultRepository.save(examResult);
            
            System.out.println("应用AI评分 - 学生答案ID: " + studentAnswerId + 
                             ", 原分数: " + originalScore + 
                             ", 新分数: " + aiScore + 
                             ", 考试AI总分: " + totalScore);
            
            return ApiResponse.success("AI评分已应用");
            
        } catch (Exception e) {
            System.err.println("应用AI评分失败: " + e.getMessage());
            e.printStackTrace();
            return ApiResponse.error("应用AI评分失败：" + e.getMessage());
        }
    }

    /**
     * AI批改整个试卷
     */
    @PostMapping("/grades/ai-grade-exam")
    public ApiResponse<Map<String, Object>> aiGradeFullExam(@RequestBody Map<String, Object> request,
                                                           jakarta.servlet.http.HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("未登录，请先登录");
            }
            
            String role = (String) session.getAttribute("role");
            if (!"teacher".equals(role)) {
                return ApiResponse.error("权限不足");
            }
            
            Long resultId = Long.valueOf(request.get("resultId").toString());
            
            // 获取考试结果
            Optional<ExamResult> resultOpt = examResultRepository.findById(resultId);
            if (!resultOpt.isPresent()) {
                return ApiResponse.error("考试结果不存在");
            }
            ExamResult result = resultOpt.get();
            
            // 验证权限 - 检查是否是该教师的考试
            Exam exam = result.getExam();
            Optional<Teacher> teacherOpt = teacherManagementService.getTeacherByUserId(userId);
            if (!teacherOpt.isPresent() || !exam.getCourse().getTeacher().getId().equals(teacherOpt.get().getId())) {
                return ApiResponse.error("权限不足，无法批改此考试");
            }
            
            // 获取学生答案
            List<StudentAnswer> studentAnswers = studentAnswerRepository.findByExamResultId(resultId);
            
            // 筛选出需要AI评分的题目（主观题）
            List<Map<String, Object>> gradingRequests = new ArrayList<>();
            Map<Long, Question> questionMap = new HashMap<>();
            
            for (Question question : exam.getQuestions()) {
                questionMap.put(question.getId(), question);
                
                // 跳过客观题
                String questionType = question.getType();
                if ("multiple-choice".equals(questionType) || 
                    "choice".equals(questionType) ||
                    "true-false".equals(questionType) ||
                    "true_false".equals(questionType)) {
                    continue;
                }
                
                // 找到对应的学生答案
                Optional<StudentAnswer> studentAnswerOpt = studentAnswers.stream()
                    .filter(sa -> sa.getQuestionId().equals(question.getId()))
                    .findFirst();
                
                if (studentAnswerOpt.isPresent()) {
                    StudentAnswer studentAnswer = studentAnswerOpt.get();
                    
                    Map<String, Object> gradingRequest = new HashMap<>();
                    gradingRequest.put("questionId", question.getId());
                    gradingRequest.put("studentAnswerId", studentAnswer.getId());
                    gradingRequest.put("questionContent", question.getContent());
                    gradingRequest.put("questionType", getQuestionTypeName(question.getType()));
                    gradingRequest.put("studentAnswer", studentAnswer.getAnswer());
                    gradingRequest.put("standardAnswer", question.getAnswer());
                    gradingRequest.put("explanation", question.getExplanation());
                    gradingRequest.put("maxScore", question.getScore());
                    
                    gradingRequests.add(gradingRequest);
                }
            }
            
            if (gradingRequests.isEmpty()) {
                return ApiResponse.error("此试卷没有需要AI批改的主观题");
            }
            
            System.out.println("=== 开始整卷AI批改 ===");
            System.out.println("学生ID: " + result.getStudent().getId() + 
                             ", 考试ID: " + exam.getId() + 
                             ", 需批改题目数: " + gradingRequests.size());
            
            // 使用现有的单题批改方法逐个处理
            List<Map<String, Object>> gradingResults = new ArrayList<>();
            double totalAiScore = 0;
            int processedCount = 0;
            
            for (Map<String, Object> gradingRequest : gradingRequests) {
                try {
                    Long questionId = (Long) gradingRequest.get("questionId");
                    Long studentAnswerId = (Long) gradingRequest.get("studentAnswerId");
                    String questionContent = (String) gradingRequest.get("questionContent");
                    String questionType = (String) gradingRequest.get("questionType");
                    String studentAnswer = (String) gradingRequest.get("studentAnswer");
                    String standardAnswer = (String) gradingRequest.get("standardAnswer");
                    String explanation = (String) gradingRequest.get("explanation");
                    Integer maxScore = (Integer) gradingRequest.get("maxScore");
                    
                    // 调用DeepSeek进行单题智能评分
                    Integer aiScore = deepSeekService.singleQuestionGrading(
                        questionContent, questionType, studentAnswer, 
                        standardAnswer, explanation, maxScore
                    );
                    
                    // 更新学生答案
                    Optional<StudentAnswer> studentAnswerOpt = studentAnswerRepository.findById(studentAnswerId);
                    if (studentAnswerOpt.isPresent()) {
                        StudentAnswer sa = studentAnswerOpt.get();
                        sa.setScore(aiScore);
                        sa.setTeacherFeedback("AI智能评分");
                        studentAnswerRepository.save(sa);
                        
                        totalAiScore += aiScore;
                        processedCount++;
                        
                        Map<String, Object> gradingResult = new HashMap<>();
                        gradingResult.put("questionId", questionId);
                        gradingResult.put("questionContent", questionContent.length() > 50 ? 
                            questionContent.substring(0, 50) + "..." : questionContent);
                        gradingResult.put("studentAnswer", studentAnswer != null && studentAnswer.length() > 30 ? 
                            studentAnswer.substring(0, 30) + "..." : (studentAnswer != null ? studentAnswer : "未答"));
                        gradingResult.put("aiScore", aiScore);
                        gradingResult.put("maxScore", maxScore);
                        
                        gradingResults.add(gradingResult);
                    }
                    
                } catch (Exception e) {
                    System.err.println("单题AI批改失败: " + e.getMessage());
                    e.printStackTrace();
                }
            }
            
            // 重新计算考试总分
            List<StudentAnswer> allAnswers = studentAnswerRepository.findByExamResultId(resultId);
            double newTotalScore = allAnswers.stream()
                .mapToDouble(sa -> sa.getScore() != null ? sa.getScore() : 0.0)
                .sum();
            
            // 更新考试结果
            result.setScore((int) Math.round(newTotalScore));
            result.setAiScore(newTotalScore); // AI评分存到aiScore字段
            result.setGradeStatus("AI_GRADED");
            examResultRepository.save(result);
            
            System.out.println("整卷AI批改完成 - 处理题目数: " + processedCount + 
                             ", 主观题总分: " + totalAiScore + 
                             ", 试卷总分: " + newTotalScore);
            
            // 构建返回结果
            Map<String, Object> resultData = new HashMap<>();
            resultData.put("processedCount", processedCount);
            resultData.put("totalAiScore", totalAiScore);
            resultData.put("newTotalScore", newTotalScore);
            resultData.put("gradingResults", gradingResults);
            
            return ApiResponse.success("AI批改完成", resultData);
            
        } catch (Exception e) {
            System.err.println("整卷AI批改失败: " + e.getMessage());
            e.printStackTrace();
            return ApiResponse.error("AI批改失败：" + e.getMessage());
        }
    }

    /**
     * 获取题目类型显示名称（中文）
     */
    private String getQuestionTypeDisplayName(String type) {
        return getQuestionTypeName(type);
    }
    
    /**
     * 生成常见错误描述（基于学生实际答案）
     */
    private String generateCommonErrors(Question question, List<ExamResult> examResults) {
        try {
            // 收集该题目的所有学生答案
            Map<String, Integer> answerCount = new HashMap<>();
            String correctAnswer = question.getAnswer();
            int totalAnswers = 0;
            int wrongAnswers = 0;
            
            for (ExamResult result : examResults) {
                List<StudentAnswer> studentAnswers = studentAnswerRepository.findByExamResultId(result.getId());
                for (StudentAnswer studentAnswer : studentAnswers) {
                    if (studentAnswer.getQuestion().getId().equals(question.getId())) {
                        String answer = studentAnswer.getAnswer();
                        if (answer != null && !answer.trim().isEmpty()) {
                            answerCount.put(answer, answerCount.getOrDefault(answer, 0) + 1);
                            totalAnswers++;
                            
                            // 判断是否为错误答案
                            if (!answer.equals(correctAnswer)) {
                                wrongAnswers++;
                            }
                        }
                        break;
                    }
                }
            }
            
            if (totalAnswers == 0) {
                return "暂无答题数据";
            }
            
            if (wrongAnswers == 0) {
                return "全部正确";
            }
            
            // 找出最常见的错误答案
            List<Map.Entry<String, Integer>> sortedAnswers = answerCount.entrySet().stream()
                .filter(entry -> !entry.getKey().equals(correctAnswer))
                .sorted((e1, e2) -> e2.getValue().compareTo(e1.getValue()))
                .collect(Collectors.toList());
            
            StringBuilder commonErrors = new StringBuilder();
            int errorCount = 0;
            
            for (Map.Entry<String, Integer> entry : sortedAnswers) {
                if (errorCount >= 3) break; // 最多显示3个常见错误
                
                String wrongAnswer = entry.getKey();
                int count = entry.getValue();
                double percentage = (count * 100.0) / totalAnswers;
                
                if (percentage >= 10) { // 只显示占比10%以上的错误答案
                    if (commonErrors.length() > 0) {
                        commonErrors.append("；");
                    }
                    
                    // 根据题目类型分析错误原因
                    String errorAnalysis = analyzeErrorReason(question, wrongAnswer, correctAnswer);
                    commonErrors.append(String.format("选择%s (%d人，%.1f%%) - %s", 
                        wrongAnswer, count, percentage, errorAnalysis));
                    errorCount++;
                }
            }
            
            if (commonErrors.length() == 0) {
                return "错误答案较为分散，无明显集中的错误选项";
            }
            
            return commonErrors.toString();
            
        } catch (Exception e) {
            return "错误分析生成失败";
        }
    }
    
    /**
     * 分析错误原因
     */
    private String analyzeErrorReason(Question question, String wrongAnswer, String correctAnswer) {
        String questionType = question.getType();
        
        if ("multiple-choice".equals(questionType) || "single-choice".equals(questionType)) {
            // 对于选择题，可以分析选项特点
            try {
                String optionsJson = question.getOptions();
                if (optionsJson != null) {
                    // 这里可以根据具体的选项内容进行更详细的分析
                    return "可能存在概念混淆";
                }
            } catch (Exception e) {
                // 忽略解析错误
            }
            return "理解偏差";
        } else if ("fill-blank".equals(questionType)) {
            return "知识点掌握不准确";
        } else if ("essay".equals(questionType)) {
            return "答题要点不全面";
        } else {
            return "理解有误";
        }
    }
    


    /**
     * 获取题型中文名称
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
     * 生成教学改进建议
     */
    /**
     * 获取所有能力维度
     */
    @GetMapping("/capability-dimensions")
    public ApiResponse<List<Map<String, Object>>> getCapabilityDimensions() {
        try {
            List<Map<String, Object>> dimensions = new ArrayList<>();
            
            for (CapabilityDimension dimension : CapabilityDimension.values()) {
                Map<String, Object> dimensionData = new HashMap<>();
                dimensionData.put("code", dimension.getCode());
                dimensionData.put("displayName", dimension.getDisplayName());
                dimensionData.put("description", dimension.getDescription());
                dimensionData.put("recommendedWeight", dimension.getRecommendedWeight());
                dimensions.add(dimensionData);
            }
            
            return ApiResponse.success("获取能力维度成功", dimensions);
        } catch (Exception e) {
            return ApiResponse.error("获取能力维度失败：" + e.getMessage());
        }
    }
    
    /**
     * 分析学生能力表现
     */
    @GetMapping("/capability-analysis/{studentId}/{examId}")
    public ApiResponse<Map<String, Object>> analyzeStudentCapabilities(@PathVariable Long studentId, 
                                                                      @PathVariable Long examId,
                                                                      jakarta.servlet.http.HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("用户未登录，请重新登录");
            }
            
            String role = (String) session.getAttribute("role");
            if (!"teacher".equals(role)) {
                return ApiResponse.error("权限不足，非教师用户");
            }
            
            Map<String, Object> analysis = capabilityAnalysisService.analyzeStudentCapabilities(studentId, examId);
            return ApiResponse.success("能力分析完成", analysis);
        } catch (Exception e) {
            return ApiResponse.error("能力分析失败：" + e.getMessage());
        }
    }
    
    /**
     * 分析学生能力发展轨迹
     */
    @GetMapping("/capability-development/{studentId}/{courseId}")
    public ApiResponse<Map<String, Object>> analyzeCapabilityDevelopment(@PathVariable Long studentId,
                                                                        @PathVariable Long courseId,
                                                                        jakarta.servlet.http.HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("用户未登录，请重新登录");
            }
            
            String role = (String) session.getAttribute("role");
            if (!"teacher".equals(role)) {
                return ApiResponse.error("权限不足，非教师用户");
            }
            
            Map<String, Object> development = capabilityAnalysisService.analyzeCapabilityDevelopment(studentId, courseId);
            return ApiResponse.success("能力发展分析完成", development);
        } catch (Exception e) {
            return ApiResponse.error("能力发展分析失败：" + e.getMessage());
        }
    }
    
    /**
     * 批量分析课程学生能力表现
     */
    @GetMapping("/course-capability-analysis/{courseId}")
    public ApiResponse<Map<String, Object>> analyzeCourseCapabilities(@PathVariable Long courseId,
                                                                     jakarta.servlet.http.HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("用户未登录，请重新登录");
            }
            
            String role = (String) session.getAttribute("role");
            if (!"teacher".equals(role)) {
                return ApiResponse.error("权限不足，非教师用户");
            }
            
            // 验证教师是否拥有该课程
            Optional<Teacher> teacherOpt = teacherManagementService.getTeacherByUserId(userId);
            if (!teacherOpt.isPresent()) {
                return ApiResponse.error("教师信息不存在");
            }
            
            Optional<Course> courseOpt = courseRepository.findById(courseId);
            if (!courseOpt.isPresent()) {
                return ApiResponse.error("课程不存在");
            }
            
            Course course = courseOpt.get();
            Teacher currentTeacher = teacherOpt.get();
            if (!course.getTeacher().getId().equals(currentTeacher.getId())) {
                return ApiResponse.error("您没有权限查看此课程的能力分析");
            }
            
            // 获取课程所有考试的学生能力分析
            Map<String, Object> courseAnalysis = new HashMap<>();
            // 这里可以实现更复杂的课程级别能力分析逻辑
            
            return ApiResponse.success("课程能力分析完成", courseAnalysis);
        } catch (Exception e) {
            return ApiResponse.error("课程能力分析失败：" + e.getMessage());
        }
    }

    @PostMapping("/improvements")
    public ResponseEntity<Map<String, Object>> generateImprovements(@RequestBody Map<String, Object> request) {
        try {
            String scope = (String) request.get("scope");
            Object courseIdObj = request.get("courseId");
            
            if (scope == null || scope.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "分析范围不能为空"
                ));
            }
            
            // 验证courseId（当scope为COURSE时）
            if ("COURSE".equals(scope)) {
                if (courseIdObj == null || courseIdObj.toString().trim().isEmpty()) {
                    return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "选择单个课程分析时，必须指定课程"
                    ));
                }
            }
            
            Long courseId = null;
            if (courseIdObj != null && !courseIdObj.toString().trim().isEmpty()) {
                try {
                    courseId = Long.valueOf(courseIdObj.toString());
                } catch (NumberFormatException e) {
                    return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "无效的课程ID格式"
                    ));
                }
            }
            
            // 调用服务生成改进建议
            String improvements = teacherService.generateTeachingImprovements(scope, courseId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of(
                    "improvements", improvements,
                    "scope", scope,
                    "courseId", courseId
                ),
                "message", "教学改进建议生成成功"
            ));
            
        } catch (Exception e) {
            System.err.println("生成教学改进建议失败: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "生成教学改进建议失败：" + e.getMessage()
            ));
        }
    }
    
    /**
     * 保存大作业要求
     */
    @PostMapping("/assignment/requirement/{questionId}")
    public ApiResponse<String> saveAssignmentRequirement(@PathVariable Long questionId,
                                                       @RequestBody Map<String, Object> request,
                                                       jakarta.servlet.http.HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("未登录，请先登录");
            }
            
            String role = (String) session.getAttribute("role");
            if (!"teacher".equals(role)) {
                return ApiResponse.error("权限不足");
            }
            
            // 获取题目
            Optional<Question> questionOpt = questionRepository.findById(questionId);
            if (!questionOpt.isPresent()) {
                return ApiResponse.error("题目不存在");
            }
            Question question = questionOpt.get();
            
            // 验证权限 - 检查是否是该教师的题目
            Exam exam = question.getExam();
            Optional<Teacher> teacherOpt = teacherManagementService.getTeacherByUserId(userId);
            if (!teacherOpt.isPresent() || !exam.getCourse().getTeacher().getId().equals(teacherOpt.get().getId())) {
                return ApiResponse.error("权限不足，无法修改此题目");
            }
            
            // 验证是否为大作业题型
            if (!"assignment".equals(question.getType()) && !question.getType().contains("大作业")) {
                return ApiResponse.error("此题目不是大作业题型");
            }
            
            String requirement = (String) request.get("requirement");
            Map<String, Object> weights = (Map<String, Object>) request.get("weights");
            
            if (requirement == null || requirement.trim().isEmpty()) {
                return ApiResponse.error("作业要求不能为空");
            }
            
            System.out.println("=== 保存大作业要求 ===");
            System.out.println("题目ID: " + questionId);
            System.out.println("作业要求长度: " + requirement.length() + " 字符");
            System.out.println("评分权重: " + weights);
            
            // 保存大作业要求到题目
            question.setAssignmentRequirement(requirement);
            
            // 可以考虑将权重设置保存到其他字段或单独的表中
            // 这里暂时将权重作为JSON字符串保存到explanation字段的特定部分
            String currentExplanation = question.getExplanation() != null ? question.getExplanation() : "";
            try {
                String weightsJson = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(weights);
                String newExplanation = currentExplanation.replaceAll("\\*\\*评分权重设置:\\*\\*[\\s\\S]*?(?=\\n\\n|$)", "");
                newExplanation = newExplanation.trim() + "\n\n**评分权重设置:**\n" + weightsJson;
                question.setExplanation(newExplanation);
            } catch (Exception e) {
                System.err.println("权重JSON序列化失败: " + e.getMessage());
            }
            
            // 更新题目内容，将要求显示在题目中
            String currentContent = question.getContent();
            String updatedContent = currentContent.replaceAll("\\[待教师设置具体要求\\]", requirement);
            question.setContent(updatedContent);
            
            questionRepository.save(question);
            
            System.out.println("✅ 大作业要求保存成功");
            
            return ApiResponse.success("大作业要求保存成功");
            
        } catch (Exception e) {
            System.err.println("保存大作业要求失败: " + e.getMessage());
            e.printStackTrace();
            return ApiResponse.error("保存失败：" + e.getMessage());
        }
    }

} 