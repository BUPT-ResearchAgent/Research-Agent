package com.example.smartedu.controller;

import com.example.smartedu.dto.ApiResponse;
import com.example.smartedu.entity.*;
import com.example.smartedu.repository.*;
import com.example.smartedu.service.TeacherService;
import com.example.smartedu.service.TeacherManagementService;
import com.example.smartedu.service.CourseCodeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
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
    
    /**
     * 获取教师课程列表
     */
    @GetMapping("/courses")
    public ApiResponse<List<Course>> getTeacherCourses(jakarta.servlet.http.HttpSession session) {
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
            
            System.out.println("获取课程列表，用户ID: " + userId + ", 课程数量: " + courses.size());
            
            return ApiResponse.success(courses);
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
     * 生成教学大纲
     */
    @PostMapping("/outline/generate")
    public ApiResponse<TeachingOutline> generateTeachingOutline(@RequestBody Map<String, Object> request) {
        try {
            Long courseId = Long.valueOf(request.get("courseId").toString());
            List<Integer> materialIds = (List<Integer>) request.get("materialIds");
            String requirements = (String) request.get("requirements");
            Integer hours = request.get("hours") != null ? Integer.valueOf(request.get("hours").toString()) : null;
            
            TeachingOutline outline = teacherService.generateOutlineWithMaterials(courseId, materialIds, requirements, hours);
            System.out.println("控制器：教学大纲生成成功，返回数据 - ID: " + outline.getId() + 
                ", 课程: " + (outline.getCourse() != null ? outline.getCourse().getName() : "null") +
                ", 内容长度: " + (outline.getTeachingDesign() != null ? outline.getTeachingDesign().length() : 0));
            return ApiResponse.success("教学大纲生成成功", outline);
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("生成教学大纲失败：" + e.getMessage());
        }
    }
    
    /**
     * 重新生成教学大纲（更新现有大纲）
     */
    @PostMapping("/outline/regenerate")
    public ApiResponse<TeachingOutline> regenerateTeachingOutline(@RequestBody Map<String, Object> request) {
        try {
            Long outlineId = Long.valueOf(request.get("outlineId").toString());
            Long courseId = Long.valueOf(request.get("courseId").toString());
            List<Integer> materialIds = (List<Integer>) request.get("materialIds");
            String requirements = (String) request.get("requirements");
            Integer hours = request.get("hours") != null ? Integer.valueOf(request.get("hours").toString()) : null;
            
            TeachingOutline outline = teacherService.regenerateOutlineWithMaterials(outlineId, courseId, materialIds, requirements, hours);
            System.out.println("控制器：教学大纲重新生成成功，更新数据 - ID: " + outline.getId() + 
                ", 课程: " + (outline.getCourse() != null ? outline.getCourse().getName() : "null") +
                ", 内容长度: " + (outline.getTeachingDesign() != null ? outline.getTeachingDesign().length() : 0));
            return ApiResponse.success("教学大纲重新生成成功", outline);
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
    public ApiResponse<Notice> publishNotice(
            @RequestParam Long courseId,
            @RequestParam String title,
            @RequestParam String content) {
        try {
            Notice notice = teacherService.publishNotice(courseId, title, content);
            return ApiResponse.success("通知发布成功", notice);
        } catch (Exception e) {
            return ApiResponse.error("发布通知失败：" + e.getMessage());
        }
    }

    /**
     * 根据课程代码获取课程信息
     */
    @GetMapping("/courses/code/{courseCode}")
    public ApiResponse<Course> getCourseByCode(@PathVariable String courseCode) {
        try {
            Course course = courseRepository.findByCourseCode(courseCode);
            if (course == null) {
                return ApiResponse.error("课程不存在");
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
            
            courseRepository.deleteById(courseId);
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
} 