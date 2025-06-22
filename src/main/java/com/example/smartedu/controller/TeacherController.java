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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;


import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
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
            course.setUpdatedAt(LocalDateTime.now());
            
            Course savedCourse = courseRepository.save(course);
            return ApiResponse.success("课程更新成功", savedCourse);
        } catch (Exception e) {
            return ApiResponse.error("更新课程失败：" + e.getMessage());
        }
    }

    /**
     * 删除课程
     */
    @DeleteMapping("/courses/{courseId}")
    public ApiResponse<Void> deleteCourse(@PathVariable Long courseId) {
        try {
            if (!courseRepository.existsById(courseId)) {
                return ApiResponse.error("课程不存在");
            }
            
            // 使用完整删除方法，先删除所有相关数据再删除课程
            courseService.deleteCourseCompletely(courseId);
            return ApiResponse.success("课程删除成功", null);
        } catch (Exception e) {
            return ApiResponse.error("删除课程失败：" + e.getMessage());
        }
    }

    /**
     * 获取教师仪表板统计数据
     */
    @GetMapping("/dashboard/stats")
    public ApiResponse<Map<String, Object>> getDashboardStats(jakarta.servlet.http.HttpSession session) {
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
            
            // 获取教师的课程
            List<Course> courses = teacherService.getTeacherCourses(teacher.getId());
            
            // 获取课程ID列表
            List<Long> courseIds = courses.stream().map(Course::getId).collect(Collectors.toList());
            
            // 统计数据
            Map<String, Object> stats = new HashMap<>();
            stats.put("courseCount", courses.size());
            
            // 统计在线学生数量
            int onlineStudentCount = teacherService.getTeacherOnlineStudentCountByUserId(userId);
            stats.put("totalStudents", onlineStudentCount);
            
            // 统计资料数量
            int materialCount = 0;
            for (Course course : courses) {
                materialCount += teacherService.getCourseMaterials(course.getId()).size();
            }
            stats.put("materialCount", materialCount);
            
            // 统计考试数量
            int examCount = 0;
            for (Long courseId : courseIds) {
                examCount += examRepository.findByCourseIdOrderByCreatedAtDesc(courseId).size();
            }
            stats.put("examCount", examCount);
            
            // 统计待批改的考试数量
            long pendingGradeCount = 0;
            if (!courseIds.isEmpty()) {
                for (Long courseId : courseIds) {
                    List<Exam> exams = examRepository.findByCourseIdOrderByCreatedAtDesc(courseId);
                    for (Exam exam : exams) {
                        pendingGradeCount += examResultRepository.findByExamAndGradeStatus(exam, "PENDING").size();
                    }
                }
            }
            stats.put("pendingGradeCount", pendingGradeCount);
            
            return ApiResponse.success("获取统计数据成功", stats);
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("获取统计数据失败：" + e.getMessage());
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
                            gradeInfo.put("aiScore", result.getScore()); // AI评分
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
                    // 智能评分失败时，保持原有评分
                    result.setGradeStatus("AI_GRADED");
                    result.setIsCorrected(true);
                    result.setFinalScore(result.getScore().doubleValue());
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
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("未登录，请先登录");
            }
            
            String role = (String) session.getAttribute("role");
            if (!"teacher".equals(role)) {
                return ApiResponse.error("权限不足");
            }
            
            // 获取考试信息
            Optional<Exam> examOpt = examRepository.findById(examId);
            if (!examOpt.isPresent()) {
                return ApiResponse.error("考试不存在");
            }
            Exam exam = examOpt.get();
            
            // 验证权限
            Optional<Teacher> teacherOpt = teacherManagementService.getTeacherByUserId(userId);
            if (!teacherOpt.isPresent() || !exam.getCourse().getTeacher().getId().equals(teacherOpt.get().getId())) {
                return ApiResponse.error("权限不足，无法查看此考试分析");
            }
            
            // 获取考试结果
            List<ExamResult> results = examResultRepository.findByExamOrderBySubmitTimeDesc(exam);
            List<ExamResult> submittedResults = results.stream()
                .filter(r -> r.getSubmitTime() != null && r.getFinalScore() != null)
                .collect(Collectors.toList());
            
            if (submittedResults.isEmpty()) {
                Map<String, Object> emptyAnalysis = new HashMap<>();
                emptyAnalysis.put("participantCount", 0);
                emptyAnalysis.put("averageScore", 0.0);
                emptyAnalysis.put("maxScore", 0.0);
                emptyAnalysis.put("minScore", 0.0);
                emptyAnalysis.put("standardDeviation", 0.0);
                emptyAnalysis.put("scoreDistribution", new HashMap<>());
                return ApiResponse.success("获取分析数据成功", emptyAnalysis);
            }
            
            // 计算统计数据
            List<Double> scores = submittedResults.stream()
                .map(ExamResult::getFinalScore)
                .collect(Collectors.toList());
            
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
            
            for (Double score : scores) {
                if (score >= 90) scoreDistribution.put("90-100", scoreDistribution.get("90-100") + 1);
                else if (score >= 80) scoreDistribution.put("80-89", scoreDistribution.get("80-89") + 1);
                else if (score >= 70) scoreDistribution.put("70-79", scoreDistribution.get("70-79") + 1);
                else if (score >= 60) scoreDistribution.put("60-69", scoreDistribution.get("60-69") + 1);
                else scoreDistribution.put("0-59", scoreDistribution.get("0-59") + 1);
            }
            
            Map<String, Object> analysis = new HashMap<>();
            analysis.put("participantCount", submittedResults.size());
            analysis.put("averageScore", Math.round(averageScore * 100.0) / 100.0);
            analysis.put("maxScore", maxScore);
            analysis.put("minScore", minScore);
            analysis.put("standardDeviation", Math.round(standardDeviation * 100.0) / 100.0);
            analysis.put("scoreDistribution", scoreDistribution);
            analysis.put("examTitle", exam.getTitle());
            analysis.put("totalScore", exam.getTotalScore());
            
            return ApiResponse.success("获取分析数据成功", analysis);
        } catch (Exception e) {
            return ApiResponse.error("获取分析数据失败：" + e.getMessage());
        }
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
                
                // 更新考试结果的最终得分
                if (processedCount > 0) {
                    double originalFinalScore = examResult.getFinalScore() != null ? examResult.getFinalScore() : examResult.getScore().doubleValue();
                    double newFinalScore = Math.max(0, originalFinalScore + totalAdjustment);
                    examResult.setFinalScore(newFinalScore);
                    
                    System.out.println("智能评分完成 - 学生ID: " + examResult.getStudent().getId() + 
                                     ", 处理题目数: " + processedCount + 
                                     ", 分数调整: " + totalAdjustment + 
                                     ", 最终得分: " + newFinalScore);
                }
            } else {
                // 没有需要智能评分的题目，保持原有分数
                examResult.setFinalScore(examResult.getScore().doubleValue());
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
            
            // 重新计算考试总分
            ExamResult examResult = studentAnswer.getExamResult();
            List<StudentAnswer> allAnswers = studentAnswerRepository.findByExamResultId(examResult.getId());
            double totalScore = allAnswers.stream()
                .mapToDouble(sa -> sa.getScore() != null ? sa.getScore() : 0.0)
                .sum();
            
            examResult.setFinalScore(totalScore);
            examResultRepository.save(examResult);
            
            System.out.println("应用AI评分 - 学生答案ID: " + studentAnswerId + 
                             ", 原分数: " + originalScore + 
                             ", 新分数: " + aiScore + 
                             ", 考试总分: " + totalScore);
            
            return ApiResponse.success("AI评分已应用");
            
        } catch (Exception e) {
            System.err.println("应用AI评分失败: " + e.getMessage());
            e.printStackTrace();
            return ApiResponse.error("应用AI评分失败：" + e.getMessage());
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
} 