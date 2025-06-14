package com.example.smartedu.controller;

import com.example.smartedu.dto.ApiResponse;
import com.example.smartedu.entity.*;
import com.example.smartedu.service.StudentManagementService;
import com.example.smartedu.repository.*;
import com.example.smartedu.service.CourseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;

@RestController
@RequestMapping("/api/student")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class StudentController {
    
    @Autowired
    private StudentManagementService studentManagementService;
    
    @Autowired
    private CourseRepository courseRepository;
    
    @Autowired
    private ExamRepository examRepository;
    
    @Autowired
    private ExamResultRepository examResultRepository;
    
    @Autowired
    private NoticeRepository noticeRepository;
    
    @Autowired
    private CourseMaterialRepository materialRepository;
    
    @Autowired
    private CourseService courseService;
    
    /**
     * 获取学生信息
     */
    @GetMapping("/profile")
    public ApiResponse<Student> getStudentProfile(@RequestParam Long userId) {
        try {
            Optional<Student> studentOpt = studentManagementService.getStudentByUserId(userId);
            if (!studentOpt.isPresent()) {
                return ApiResponse.error("学生信息不存在");
            }
            
            Student student = studentOpt.get();
            // 隐藏密码
            if (student.getUser() != null) {
                student.getUser().setPassword(null);
            }
            
            return ApiResponse.success("获取学生信息成功", student);
        } catch (Exception e) {
            return ApiResponse.error("获取学生信息失败：" + e.getMessage());
        }
    }
    
    /**
     * 更新学生信息
     */
    @PutMapping("/profile")
    public ApiResponse<Student> updateStudentProfile(@RequestBody Map<String, Object> request) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            
            Optional<Student> studentOpt = studentManagementService.getStudentByUserId(userId);
            if (!studentOpt.isPresent()) {
                return ApiResponse.error("学生信息不存在");
            }
            
            Student student = studentOpt.get();
            
            // 更新学生信息
            String realName = (String) request.get("realName");
            String phone = (String) request.get("phone");
            String address = (String) request.get("address");
            String emergencyContact = (String) request.get("emergencyContact");
            String emergencyPhone = (String) request.get("emergencyPhone");
            
            Student updatedStudent = studentManagementService.updateStudent(
                student.getId(), realName, student.getStudentId(), 
                student.getClassName(), student.getMajor(), student.getGrade(),
                student.getEntranceYear(), student.getGender(), student.getBirthDate(),
                address, emergencyContact, emergencyPhone);
            
            // 同时更新用户表的手机号
            if (phone != null && student.getUser() != null) {
                student.getUser().setPhone(phone);
            }
            
            // 隐藏密码
            if (updatedStudent.getUser() != null) {
                updatedStudent.getUser().setPassword(null);
            }
            
            return ApiResponse.success("学生信息更新成功", updatedStudent);
        } catch (Exception e) {
            return ApiResponse.error("更新学生信息失败：" + e.getMessage());
        }
    }
    
    /**
     * 获取所有课程列表（供学生浏览）
     */
    @GetMapping("/courses")
    public ApiResponse<List<Map<String, Object>>> getAllCourses() {
        try {
            List<Course> courses = courseRepository.findByStatus("active");
            List<Map<String, Object>> coursesWithTeacher = courses.stream()
                .map(this::buildCourseResponse)
                .collect(java.util.stream.Collectors.toList());
            return ApiResponse.success("获取课程列表成功", coursesWithTeacher);
        } catch (Exception e) {
            return ApiResponse.error("获取课程列表失败：" + e.getMessage());
        }
    }

    /**
     * 根据条件查询可加入的课程
     */
    @GetMapping("/courses/search")
    public ApiResponse<List<Map<String, Object>>> searchAvailableCourses(
            @RequestParam(required = false) String semester,
            @RequestParam(required = false) String teacherName
    ) {
        try {
            List<Course> courses = courseRepository.findByStatus("active");
            
            // 根据学期筛选
            if (semester != null && !semester.isEmpty() && !"全部学期".equals(semester)) {
                courses = courses.stream()
                    .filter(course -> semester.equals(course.getSemester()))
                    .collect(java.util.stream.Collectors.toList());
            }
            
            // 根据教师姓名筛选
            if (teacherName != null && !teacherName.isEmpty() && !"全部教师".equals(teacherName)) {
                courses = courses.stream()
                    .filter(course -> course.getTeacher() != null && 
                        course.getTeacher().getRealName() != null &&
                        course.getTeacher().getRealName().contains(teacherName))
                    .collect(java.util.stream.Collectors.toList());
            }
            
            List<Map<String, Object>> coursesWithTeacher = courses.stream()
                .map(this::buildCourseResponse)
                .collect(java.util.stream.Collectors.toList());
            
            return ApiResponse.success("查询课程成功", coursesWithTeacher);
        } catch (Exception e) {
            return ApiResponse.error("查询课程失败：" + e.getMessage());
        }
    }
    
    /**
     * 构建包含教师信息的课程响应
     */
    private Map<String, Object> buildCourseResponse(Course course) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", course.getId());
        response.put("name", course.getName());
        response.put("courseCode", course.getCourseCode());
        response.put("description", course.getDescription());
        response.put("credit", course.getCredit());
        response.put("hours", course.getHours());
        response.put("semester", course.getSemester());
        response.put("academicYear", course.getAcademicYear());
        response.put("classTime", course.getClassTime());
        response.put("classLocation", course.getClassLocation());
        response.put("maxStudents", course.getMaxStudents());
        response.put("currentStudents", course.getCurrentStudents());
        response.put("status", course.getStatus());
        response.put("createdAt", course.getCreatedAt());
        response.put("updatedAt", course.getUpdatedAt());
        
        // 添加教师信息
        if (course.getTeacher() != null) {
            Map<String, Object> teacher = new HashMap<>();
            teacher.put("id", course.getTeacher().getId());
            teacher.put("realName", course.getTeacher().getRealName());
            teacher.put("department", course.getTeacher().getDepartment());
            teacher.put("title", course.getTeacher().getTitle());
            response.put("teacher", teacher);
        }
        
        return response;
    }

    /**
     * 获取所有可用的学期列表
     */
    @GetMapping("/semesters")
    public ApiResponse<List<String>> getAvailableSemesters() {
        try {
            List<String> semesters = courseRepository.findDistinctSemestersByStatus("active");
            return ApiResponse.success("获取学期列表成功", semesters);
        } catch (Exception e) {
            return ApiResponse.error("获取学期列表失败：" + e.getMessage());
        }
    }

    /**
     * 获取所有教师列表
     */
    @GetMapping("/teachers")
    public ApiResponse<List<Map<String, Object>>> getAvailableTeachers() {
        try {
            List<Course> activeCourses = courseRepository.findByStatus("active");
            List<Map<String, Object>> teachers = activeCourses.stream()
                .filter(course -> course.getTeacher() != null)
                .map(course -> {
                    Map<String, Object> teacher = new HashMap<>();
                    teacher.put("id", course.getTeacher().getId());
                    teacher.put("realName", course.getTeacher().getRealName());
                    teacher.put("department", course.getTeacher().getDepartment());
                    return teacher;
                })
                .distinct()
                .collect(java.util.stream.Collectors.toList());
            
            return ApiResponse.success("获取教师列表成功", teachers);
        } catch (Exception e) {
            return ApiResponse.error("获取教师列表失败：" + e.getMessage());
        }
    }
    
    /**
     * 获取课程详情
     */
    @GetMapping("/courses/{courseId}")
    public ApiResponse<Map<String, Object>> getCourseDetail(@PathVariable Long courseId) {
        try {
            Optional<Course> courseOpt = courseRepository.findById(courseId);
            if (!courseOpt.isPresent()) {
                return ApiResponse.error("课程不存在");
            }
            
            Map<String, Object> courseWithTeacher = buildCourseResponse(courseOpt.get());
            return ApiResponse.success("获取课程详情成功", courseWithTeacher);
        } catch (Exception e) {
            return ApiResponse.error("获取课程详情失败：" + e.getMessage());
        }
    }
    
    /**
     * 获取学生的所有通知
     */
    @GetMapping("/notices")
    public ApiResponse<List<Notice>> getStudentNotices(@RequestParam Long userId) {
        try {
            // 获取学生信息
            Optional<Student> studentOpt = studentManagementService.getStudentByUserId(userId);
            if (!studentOpt.isPresent()) {
                return ApiResponse.error("学生信息不存在");
            }
            
            // 获取学生加入的所有课程
            List<Course> studentCourses = courseService.getStudentCourses(studentOpt.get().getId());
            List<Long> courseIds = studentCourses.stream()
                .map(Course::getId)
                .collect(java.util.stream.Collectors.toList());
            
            // 获取所有相关通知
            List<Notice> allNotices = new java.util.ArrayList<>();
            if (!courseIds.isEmpty()) {
                for (Long courseId : courseIds) {
                    List<Notice> courseNotices = noticeRepository.findByCourseIdOrderByCreatedAtDesc(courseId);
                    allNotices.addAll(courseNotices);
                }
            }
            
            // 按创建时间倒序排序
            allNotices.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
            
            // 过滤掉未到推送时间的通知
            java.time.LocalDateTime currentTime = java.time.LocalDateTime.now();
            List<Notice> visibleNotices = allNotices.stream()
                .filter(notice -> {
                    // 如果是定时推送且有推送时间，检查是否已到推送时间
                    if ("scheduled".equals(notice.getPushTime()) && notice.getScheduledTime() != null) {
                        return notice.getScheduledTime().isBefore(currentTime) || notice.getScheduledTime().isEqual(currentTime);
                    }
                    // 立即推送的通知直接显示
                    return true;
                })
                .collect(java.util.stream.Collectors.toList());
            
            return ApiResponse.success("获取学生通知成功", visibleNotices);
        } catch (Exception e) {
            return ApiResponse.error("获取学生通知失败：" + e.getMessage());
        }
    }

    /**
     * 获取课程公告
     */
    @GetMapping("/courses/{courseId}/notices")
    public ApiResponse<List<Notice>> getCourseNotices(@PathVariable Long courseId) {
        try {
            List<Notice> allNotices = noticeRepository.findByCourseIdOrderByCreatedAtDesc(courseId);
            
            // 过滤掉未到推送时间的通知
            java.time.LocalDateTime currentTime = java.time.LocalDateTime.now();
            List<Notice> visibleNotices = allNotices.stream()
                .filter(notice -> {
                    // 如果是定时推送且有推送时间，检查是否已到推送时间
                    if ("scheduled".equals(notice.getPushTime()) && notice.getScheduledTime() != null) {
                        return notice.getScheduledTime().isBefore(currentTime) || notice.getScheduledTime().isEqual(currentTime);
                    }
                    // 立即推送的通知直接显示
                    return true;
                })
                .collect(java.util.stream.Collectors.toList());
            
            return ApiResponse.success("获取课程公告成功", visibleNotices);
        } catch (Exception e) {
            return ApiResponse.error("获取课程公告失败：" + e.getMessage());
        }
    }
    
    /**
     * 获取课程资料
     */
    @GetMapping("/courses/{courseId}/materials")
    public ApiResponse<List<CourseMaterial>> getCourseMaterials(@PathVariable Long courseId) {
        try {
            List<CourseMaterial> materials = materialRepository.findByCourseIdOrderByUploadedAtDesc(courseId);
            return ApiResponse.success("获取课程资料成功", materials);
        } catch (Exception e) {
            return ApiResponse.error("获取课程资料失败：" + e.getMessage());
        }
    }
    
    /**
     * 获取课程考试列表
     */
    @GetMapping("/courses/{courseId}/exams")
    public ApiResponse<List<Exam>> getCourseExams(@PathVariable Long courseId) {
        try {
            List<Exam> exams = examRepository.findByCourseIdOrderByCreatedAtDesc(courseId);
            // 只返回已发布的考试
            List<Exam> publishedExams = exams.stream()
                .filter(exam -> exam.getIsPublished() != null && exam.getIsPublished())
                .collect(java.util.stream.Collectors.toList());
            
            return ApiResponse.success("获取课程考试成功", publishedExams);
        } catch (Exception e) {
            return ApiResponse.error("获取课程考试失败：" + e.getMessage());
        }
    }
    
    /**
     * 获取学生的考试结果
     */
    @GetMapping("/exam-results")
    public ApiResponse<List<ExamResult>> getStudentExamResults(@RequestParam Long userId) {
        try {
            Optional<Student> studentOpt = studentManagementService.getStudentByUserId(userId);
            if (!studentOpt.isPresent()) {
                return ApiResponse.error("学生信息不存在");
            }
            
            List<ExamResult> results = examResultRepository.findByStudentOrderBySubmitTimeDesc(studentOpt.get());
            return ApiResponse.success("获取考试结果成功", results);
        } catch (Exception e) {
            return ApiResponse.error("获取考试结果失败：" + e.getMessage());
        }
    }
    
    /**
     * 获取学生仪表板统计数据
     */
    @GetMapping("/dashboard/stats")
    public ApiResponse<Map<String, Object>> getDashboardStats(@RequestParam Long userId) {
        try {
            Optional<Student> studentOpt = studentManagementService.getStudentByUserId(userId);
            if (!studentOpt.isPresent()) {
                return ApiResponse.error("学生信息不存在");
            }
            
            Student student = studentOpt.get();
            
            // 统计数据
            Map<String, Object> stats = new HashMap<>();
            
            // 统计可用课程数量
            long availableCourses = courseRepository.countByStatus("active");
            stats.put("availableCourses", availableCourses);
            
            // 统计学生已加入的课程数量
            List<Course> myCourses = courseService.getStudentCourses(student.getId());
            stats.put("myCourses", myCourses.size());
            
            // 统计学生的考试次数
            long examCount = examResultRepository.countByStudent(student);
            stats.put("examCount", examCount);
            
            // 计算平均分
            Double averageScore = examResultRepository.getAverageScoreByStudent(student);
            stats.put("averageScore", averageScore != null ? averageScore : 0.0);
            
            // 统计待完成的考试数量（已发布但学生未参加的考试）
            List<Exam> allPublishedExams = examRepository.findByIsPublishedTrue();
            long pendingExams = allPublishedExams.stream()
                .filter(exam -> !examResultRepository.findByStudentAndExam(student, exam).isPresent())
                .count();
            stats.put("pendingExams", pendingExams);
            
            return ApiResponse.success("获取统计数据成功", stats);
        } catch (Exception e) {
            return ApiResponse.error("获取统计数据失败：" + e.getMessage());
        }
    }
    
    /**
     * 加入课程
     */
    @PostMapping("/courses/join")
    public ApiResponse<String> joinCourse(@RequestBody Map<String, Object> request) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            String courseCode = (String) request.get("courseCode");
            
            if (courseCode == null || courseCode.trim().isEmpty()) {
                return ApiResponse.error("课程号不能为空");
            }
            
            // 获取学生信息
            Optional<Student> studentOpt = studentManagementService.getStudentByUserId(userId);
            if (!studentOpt.isPresent()) {
                return ApiResponse.error("学生信息不存在");
            }
            
            // 调用服务层加入课程
            courseService.joinCourse(studentOpt.get().getId(), courseCode.trim());
            
            return ApiResponse.success("成功加入课程");
        } catch (Exception e) {
            return ApiResponse.error("加入课程失败：" + e.getMessage());
        }
    }
    
    /**
     * 根据课程号查找课程
     */
    @GetMapping("/courses/code/{courseCode}")
    public ApiResponse<Map<String, Object>> getCourseByCode(@PathVariable String courseCode) {
        try {
            Course course = courseService.findByCourseCode(courseCode);
            if (course == null) {
                return ApiResponse.error("课程不存在");
            }
            
            Map<String, Object> courseWithTeacher = buildCourseResponse(course);
            return ApiResponse.success("获取课程成功", courseWithTeacher);
        } catch (Exception e) {
            return ApiResponse.error("获取课程失败：" + e.getMessage());
        }
    }
    
    /**
     * 获取学生已加入的课程列表（我的课程）
     */
    @GetMapping("/my-courses")
    public ApiResponse<List<Map<String, Object>>> getMyeCourses(@RequestParam Long userId) {
        try {
            // 获取学生信息
            Optional<Student> studentOpt = studentManagementService.getStudentByUserId(userId);
            if (!studentOpt.isPresent()) {
                return ApiResponse.error("学生信息不存在");
            }
            
            List<Course> courses = courseService.getStudentCourses(studentOpt.get().getId());
            List<Map<String, Object>> coursesWithTeacher = courses.stream()
                .map(this::buildCourseResponse)
                .collect(java.util.stream.Collectors.toList());
            
            return ApiResponse.success("获取我的课程成功", coursesWithTeacher);
        } catch (Exception e) {
            return ApiResponse.error("获取我的课程失败：" + e.getMessage());
        }
    }
    
    /**
     * 退出课程
     */
    @PostMapping("/courses/drop")
    public ApiResponse<String> dropCourse(@RequestBody Map<String, Object> request) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            Long courseId = Long.valueOf(request.get("courseId").toString());
            
            // 获取学生信息
            Optional<Student> studentOpt = studentManagementService.getStudentByUserId(userId);
            if (!studentOpt.isPresent()) {
                return ApiResponse.error("学生信息不存在");
            }
            
            // 调用服务层退出课程
            courseService.dropCourse(studentOpt.get().getId(), courseId);
            
            return ApiResponse.success("成功退出课程");
        } catch (Exception e) {
            return ApiResponse.error("退出课程失败：" + e.getMessage());
        }
    }
    
    /**
     * 检查学生是否已加入指定课程
     */
    @GetMapping("/courses/{courseId}/enrolled")
    public ApiResponse<Map<String, Object>> checkCourseEnrollment(@PathVariable Long courseId, @RequestParam Long userId) {
        try {
            // 获取学生信息
            Optional<Student> studentOpt = studentManagementService.getStudentByUserId(userId);
            if (!studentOpt.isPresent()) {
                return ApiResponse.error("学生信息不存在");
            }
            
            boolean enrolled = courseService.isStudentEnrolled(studentOpt.get().getId(), courseId);
            
            Map<String, Object> result = new HashMap<>();
            result.put("enrolled", enrolled);
            
            return ApiResponse.success("检查加入状态成功", result);
        } catch (Exception e) {
            return ApiResponse.error("检查加入状态失败：" + e.getMessage());
        }
    }
    
    /**
     * 下载课程资料
     */
    @GetMapping("/material/{materialId}/download")
    public org.springframework.http.ResponseEntity<byte[]> downloadMaterial(
            @PathVariable Long materialId,
            jakarta.servlet.http.HttpSession session) {
        try {
            // 检查用户是否已登录
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return org.springframework.http.ResponseEntity.status(401).build();
            }
            
            // 获取资料信息
            Optional<CourseMaterial> materialOpt = materialRepository.findById(materialId);
            if (!materialOpt.isPresent()) {
                return org.springframework.http.ResponseEntity.notFound().build();
            }
            
            CourseMaterial material = materialOpt.get();
            
            // 检查学生是否有权限下载（是否已加入该课程）
            Optional<Student> studentOpt = studentManagementService.getStudentByUserId(userId);
            if (!studentOpt.isPresent()) {
                return org.springframework.http.ResponseEntity.status(403).build();
            }
            
            boolean isEnrolled = courseService.isStudentEnrolled(studentOpt.get().getId(), material.getCourse().getId());
            if (!isEnrolled) {
                return org.springframework.http.ResponseEntity.status(403).build();
            }
            
            // 检查文件数据是否存在
            if (material.getFileData() == null) {
                return org.springframework.http.ResponseEntity.notFound().build();
            }
            
            // 对文件名进行URL编码，支持中文文件名
            String filename = material.getOriginalName();
            String encodedFilename = java.net.URLEncoder.encode(filename, "UTF-8")
                    .replaceAll("\\+", "%20");
            
            // 设置响应头并返回文件数据
            return org.springframework.http.ResponseEntity.ok()
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, 
                            "attachment; filename*=UTF-8''" + encodedFilename)
                    .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, 
                            material.getFileType() != null ? material.getFileType() : 
                            org.springframework.http.MediaType.APPLICATION_OCTET_STREAM_VALUE)
                    .body(material.getFileData());
                    
        } catch (Exception e) {
            e.printStackTrace();
            return org.springframework.http.ResponseEntity.status(500).build();
        }
    }
} 