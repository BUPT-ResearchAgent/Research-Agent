package com.example.smartedu.controller;

import com.example.smartedu.dto.ApiResponse;
import com.example.smartedu.entity.*;
import com.example.smartedu.service.StudentManagementService;
import com.example.smartedu.service.KnowledgeBaseService;
import com.example.smartedu.service.DeepSeekService;
import com.example.smartedu.service.VectorDatabaseService;
import com.example.smartedu.repository.*;
import com.example.smartedu.dto.*;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import com.example.smartedu.service.CourseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;
import java.util.ArrayList;

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
    private KnowledgeDocumentRepository knowledgeDocumentRepository;
    
    @Autowired
    private CourseService courseService;
    
    @Autowired
    private KnowledgeBaseService knowledgeBaseService;
    
    @Autowired
    private DeepSeekService deepSeekService;
    
    @Autowired
    private StudentAnswerRepository studentAnswerRepository;
    
    @Autowired
    private QuestionRepository questionRepository;
    
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
     * 获取课程资料（从知识库文档表）
     */
    /**
     * 测试方法：直接获取课程资料（无权限验证）
     */
    @GetMapping("/courses/{courseId}/materials-test")
    public ApiResponse<List<Map<String, Object>>> getCourseMaterialsTest(@PathVariable Long courseId) {
        try {
            System.out.println("=== 测试获取课程资料（无权限验证） ===");
            System.out.println("课程ID: " + courseId);
            
            // 直接从知识库文档表获取课程资料
            List<KnowledgeDocument> documents = knowledgeDocumentRepository.findByCourseIdOrderByUploadTimeDesc(courseId);
            System.out.println("查询到的知识库文档数量: " + documents.size());
            
            List<Map<String, Object>> materials = new ArrayList<>();
            for (KnowledgeDocument document : documents) {
                System.out.println("  文档ID: " + document.getId() + ", 原始名称: " + document.getOriginalName());
                Map<String, Object> materialMap = new HashMap<>();
                materialMap.put("id", document.getId());
                materialMap.put("originalName", document.getOriginalName());
                materialMap.put("filename", document.getStoredName());
                materialMap.put("fileType", document.getFileType());
                materialMap.put("fileSize", document.getFileSize());
                materialMap.put("description", document.getDescription());
                materialMap.put("uploadedAt", document.getUploadTime());
                materialMap.put("processed", document.getProcessed());
                materialMap.put("chunksCount", document.getChunksCount());
                materials.add(materialMap);
            }
            
            System.out.println("最终返回的资料数量: " + materials.size());
            return ApiResponse.success("获取课程资料成功", materials);
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("获取课程资料失败：" + e.getMessage());
        }
    }

    @GetMapping("/courses/{courseId}/materials")
    public ApiResponse<List<Map<String, Object>>> getCourseMaterials(@PathVariable Long courseId, jakarta.servlet.http.HttpSession session) {
        try {
            System.out.println("=== 获取课程资料请求 ===");
            System.out.println("课程ID: " + courseId);
            
            // 检查用户是否已登录
            Long userId = (Long) session.getAttribute("userId");
            System.out.println("用户ID: " + userId);
            if (userId == null) {
                return ApiResponse.error("用户未登录，请重新登录");
            }
            
            // 验证学生是否加入了该课程
            Optional<Student> studentOpt = studentManagementService.getStudentByUserId(userId);
            if (!studentOpt.isPresent()) {
                return ApiResponse.error("学生信息不存在");
            }
            
            System.out.println("学生ID: " + studentOpt.get().getId());
            
            // 验证学生是否加入了该课程
            List<Course> studentCourses = courseService.getStudentCourses(studentOpt.get().getId());
            System.out.println("学生已加入的课程数量: " + studentCourses.size());
            for (Course course : studentCourses) {
                System.out.println("  课程ID: " + course.getId() + ", 课程名: " + course.getName());
            }
            
            boolean isEnrolled = studentCourses.stream().anyMatch(c -> c.getId().equals(courseId));
            System.out.println("是否已加入该课程: " + isEnrolled);
            // 暂时注释掉权限验证，允许查看所有课程资料
            // if (!isEnrolled) {
            //     return ApiResponse.error("您未加入该课程");
            // }
            
            // 从知识库文档表获取课程资料
            System.out.println("开始从KNOWLEDGE_DOCUMENTS表查询课程资料...");
            List<KnowledgeDocument> documents = knowledgeDocumentRepository.findByCourseIdOrderByUploadTimeDesc(courseId);
            System.out.println("查询到的知识库文档数量: " + documents.size());
            
            List<Map<String, Object>> materials = new ArrayList<>();
            for (KnowledgeDocument document : documents) {
                System.out.println("  文档ID: " + document.getId() + ", 原始名称: " + document.getOriginalName());
                Map<String, Object> materialMap = new HashMap<>();
                materialMap.put("id", document.getId());
                materialMap.put("originalName", document.getOriginalName());
                materialMap.put("filename", document.getStoredName());
                materialMap.put("fileType", document.getFileType());
                materialMap.put("fileSize", document.getFileSize());
                materialMap.put("description", document.getDescription());
                materialMap.put("uploadedAt", document.getUploadTime());
                materialMap.put("processed", document.getProcessed());
                materialMap.put("chunksCount", document.getChunksCount());
                materials.add(materialMap);
            }
            
            System.out.println("最终返回的资料数量: " + materials.size());
            return ApiResponse.success("获取课程资料成功", materials);
        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("获取课程资料失败: " + e.getMessage());
            return ApiResponse.error("获取课程资料失败：" + e.getMessage());
        }
    }
    
    /**
     * 获取课程考试列表（学生端）
     */
    @GetMapping("/courses/{courseId}/exams")
    public ApiResponse<List<StudentExamDTO>> getCourseExams(@PathVariable Long courseId, @RequestParam Long userId) {
        try {
            // 验证学生身份
            Optional<Student> studentOpt = studentManagementService.getStudentByUserId(userId);
            if (!studentOpt.isPresent()) {
                return ApiResponse.error("学生信息不存在");
            }
            Student student = studentOpt.get();
            
            // 验证学生是否已加入该课程
            if (!courseService.isStudentEnrolled(student.getId(), courseId)) {
                return ApiResponse.error("您尚未加入此课程");
            }
            
            List<Exam> exams = examRepository.findByCourseIdOrderByCreatedAtDesc(courseId);
            // 只返回已发布的考试
            List<Exam> publishedExams = exams.stream()
                .filter(exam -> exam.getIsPublished() != null && exam.getIsPublished())
                .collect(java.util.stream.Collectors.toList());
            
            // 转换为StudentExamDTO并设置提交状态
            List<StudentExamDTO> examDTOs = publishedExams.stream()
                .map(exam -> {
                    StudentExamDTO dto = new StudentExamDTO(exam);
                    // 检查学生是否已提交
                    Optional<ExamResult> result = examResultRepository.findByStudentIdAndExamId(student.getId(), exam.getId());
                    boolean hasSubmitted = result.isPresent() && result.get().getSubmitTime() != null;
                    dto.setHasSubmitted(hasSubmitted);
                    
                    // 设置考试结果ID（如果有的话）
                    if (result.isPresent()) {
                        dto.setExamResultId(result.get().getId());
                    }
                    
                    // 根据提交状态调整考试状态
                    if (hasSubmitted) {
                        // 如果已提交，状态设为已提交
                        dto.setExamStatus("SUBMITTED");
                    } else {
                        // 如果未提交，需要根据时间判断状态
                        java.time.LocalDateTime now = java.time.LocalDateTime.now();
                        
                        if (exam.getStartTime() != null && exam.getEndTime() != null) {
                            if (now.isBefore(exam.getStartTime())) {
                                dto.setExamStatus("UPCOMING");
                            } else if (now.isAfter(exam.getEndTime())) {
                                dto.setExamStatus("EXPIRED");
                            } else {
                                dto.setExamStatus("ONGOING");
                            }
                        } else if (exam.getStartTime() != null) {
                            if (now.isBefore(exam.getStartTime())) {
                                dto.setExamStatus("UPCOMING");
                            } else {
                                dto.setExamStatus("ONGOING");
                            }
                        } else if (exam.getEndTime() != null) {
                            if (now.isAfter(exam.getEndTime())) {
                                dto.setExamStatus("EXPIRED");
                            } else {
                                dto.setExamStatus("ONGOING");
                            }
                        } else {
                            // 没有时间限制，已发布即为进行中
                            dto.setExamStatus("ONGOING");
                        }
                    }
                    
                    // 计算剩余时间（只有进行中的考试才计算）
                    if ("ONGOING".equals(dto.getExamStatus()) && dto.getEndTime() != null) {
                        java.time.Duration duration = java.time.Duration.between(
                            java.time.LocalDateTime.now(), dto.getEndTime());
                        long remainingMinutes = duration.toMinutes();
                        if (remainingMinutes > 0) {
                            dto.setRemainingMinutes((int) remainingMinutes);
                        }
                    }
                    
                    // 设置是否可以参加考试
                    dto.setCanTakeExam("ONGOING".equals(dto.getExamStatus()) && !hasSubmitted);
                    
                    // 设置是否可以查看试卷（考试结束后且已提交）
                    boolean canViewPaper = false;
                    if (hasSubmitted && exam.getEndTime() != null) {
                        canViewPaper = java.time.LocalDateTime.now().isAfter(exam.getEndTime());
                    } else if (hasSubmitted && exam.getEndTime() == null) {
                        // 如果没有结束时间，已提交即可查看
                        canViewPaper = true;
                    }
                    dto.setCanViewPaper(canViewPaper);
                    
                    return dto;
                })
                .collect(java.util.stream.Collectors.toList());
            
            return ApiResponse.success("获取课程考试成功", examDTOs);
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
     * 下载课程资料（从知识库文档表）
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
            
            // 获取知识库文档信息
            Optional<KnowledgeDocument> documentOpt = knowledgeDocumentRepository.findById(materialId);
            if (!documentOpt.isPresent()) {
                return org.springframework.http.ResponseEntity.notFound().build();
            }
            
            KnowledgeDocument document = documentOpt.get();
            
            // 检查学生是否有权限下载（是否已加入该课程）
            Optional<Student> studentOpt = studentManagementService.getStudentByUserId(userId);
            if (!studentOpt.isPresent()) {
                return org.springframework.http.ResponseEntity.status(403).build();
            }
            
            boolean isEnrolled = courseService.isStudentEnrolled(studentOpt.get().getId(), document.getCourseId());
            if (!isEnrolled) {
                return org.springframework.http.ResponseEntity.status(403).build();
            }
            
            // 检查文件内容是否存在
            if (document.getFileContent() == null || document.getFileContent().isEmpty()) {
                return org.springframework.http.ResponseEntity.notFound().build();
            }
            
            // 解码Base64文件内容
            byte[] fileData;
            try {
                fileData = java.util.Base64.getDecoder().decode(document.getFileContent());
            } catch (IllegalArgumentException e) {
                return org.springframework.http.ResponseEntity.status(500).build();
            }
            
            // 对文件名进行URL编码，支持中文文件名
            String filename = document.getOriginalName();
            String encodedFilename = java.net.URLEncoder.encode(filename, "UTF-8")
                    .replaceAll("\\+", "%20");
            
            // 根据文件扩展名确定MIME类型
            String contentType = getContentTypeFromFileName(filename);
            
            // 设置响应头并返回文件数据
            return org.springframework.http.ResponseEntity.ok()
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, 
                            "attachment; filename*=UTF-8''" + encodedFilename)
                    .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, contentType)
                    .body(fileData);
                    
        } catch (Exception e) {
            e.printStackTrace();
            return org.springframework.http.ResponseEntity.status(500).build();
        }
    }

    /**
     * 获取课程的知识库文档列表
     */
    @GetMapping("/courses/{courseId}/knowledge-documents")
    public ApiResponse<List<Map<String, Object>>> getCourseKnowledgeDocuments(
            @PathVariable Long courseId,
            @RequestParam Long userId) {
        try {
            // 验证学生身份
            Optional<Student> studentOpt = studentManagementService.getStudentByUserId(userId);
            if (!studentOpt.isPresent()) {
                return ApiResponse.error("学生信息不存在");
            }

            // 检查学生是否已加入该课程
            boolean isEnrolled = courseService.isStudentEnrolled(studentOpt.get().getId(), courseId);
            if (!isEnrolled) {
                return ApiResponse.error("您未加入此课程，无法查看知识库文档");
            }

            // 获取知识库文档列表
            List<KnowledgeDocument> documents = knowledgeDocumentRepository.findByCourseIdOrderByUploadTimeDesc(courseId);
            
            List<Map<String, Object>> documentList = documents.stream().map(doc -> {
                Map<String, Object> docInfo = new HashMap<>();
                docInfo.put("id", doc.getId());
                docInfo.put("originalName", doc.getOriginalName());
                docInfo.put("fileType", doc.getFileType());
                docInfo.put("fileSize", doc.getFileSize());
                docInfo.put("description", doc.getDescription());
                docInfo.put("chunksCount", doc.getChunksCount());
                docInfo.put("uploadTime", doc.getUploadTime());
                docInfo.put("processed", doc.getProcessed());
                return docInfo;
            }).collect(java.util.stream.Collectors.toList());

            return ApiResponse.success("获取知识库文档列表成功", documentList);
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("获取知识库文档列表失败：" + e.getMessage());
        }
    }

    /**
     * 下载知识库文档
     */
    @GetMapping("/knowledge-document/{documentId}/download")
    public ResponseEntity<FileSystemResource> downloadKnowledgeDocument(
            @PathVariable Long documentId,
            jakarta.servlet.http.HttpSession session) {
        try {
            // 检查用户是否已登录
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.status(401).build();
            }

            // 验证学生身份
            Optional<Student> studentOpt = studentManagementService.getStudentByUserId(userId);
            if (!studentOpt.isPresent()) {
                return ResponseEntity.status(403).build();
            }

            // 获取知识库文档信息
            Optional<KnowledgeDocument> docOpt = knowledgeDocumentRepository.findById(documentId);
            if (!docOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            KnowledgeDocument document = docOpt.get();

            // 检查学生是否已加入该课程
            boolean isEnrolled = courseService.isStudentEnrolled(studentOpt.get().getId(), document.getCourseId());
            if (!isEnrolled) {
                return ResponseEntity.status(403).build();
            }

            // 检查文件是否存在
            java.io.File file = new java.io.File(document.getFilePath());
            if (!file.exists()) {
                return ResponseEntity.notFound().build();
            }

            // 对文件名进行编码，支持中文文件名
            String filename = document.getOriginalName();
            String encodedFilename = java.net.URLEncoder.encode(filename, "UTF-8")
                    .replaceAll("\\+", "%20");

            // 设置响应头并返回文件
            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encodedFilename);
            headers.add(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_OCTET_STREAM_VALUE);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(new FileSystemResource(file));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * 获取学生所有课程的知识库文档
     */
    @GetMapping("/my-knowledge-documents")
    public ApiResponse<List<Map<String, Object>>> getMyKnowledgeDocuments(@RequestParam Long userId) {
        try {
            // 验证学生身份
            Optional<Student> studentOpt = studentManagementService.getStudentByUserId(userId);
            if (!studentOpt.isPresent()) {
                return ApiResponse.error("学生信息不存在");
            }

            // 获取学生的所有课程
            List<Course> courses = courseService.getStudentCourses(studentOpt.get().getId());
            List<Long> courseIds = courses.stream()
                    .map(Course::getId)
                    .collect(java.util.stream.Collectors.toList());

            if (courseIds.isEmpty()) {
                return ApiResponse.success("获取知识库文档成功", new ArrayList<>());
            }

            // 获取所有课程的知识库文档
            List<KnowledgeDocument> documents = knowledgeDocumentRepository.findByCourseIdInOrderByUploadTimeDesc(courseIds);
            
            List<Map<String, Object>> documentList = documents.stream().map(doc -> {
                Map<String, Object> docInfo = new HashMap<>();
                docInfo.put("id", doc.getId());
                docInfo.put("originalName", doc.getOriginalName());
                docInfo.put("fileType", doc.getFileType());
                docInfo.put("fileSize", doc.getFileSize());
                docInfo.put("description", doc.getDescription());
                docInfo.put("chunksCount", doc.getChunksCount());
                docInfo.put("uploadTime", doc.getUploadTime());
                docInfo.put("processed", doc.getProcessed());
                docInfo.put("courseId", doc.getCourseId());
                
                // 添加课程信息
                courses.stream()
                    .filter(course -> course.getId().equals(doc.getCourseId()))
                    .findFirst()
                    .ifPresent(course -> {
                        docInfo.put("courseName", course.getName());
                        docInfo.put("courseCode", course.getCourseCode());
                    });
                
                return docInfo;
            }).collect(java.util.stream.Collectors.toList());

            return ApiResponse.success("获取知识库文档成功", documentList);
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("获取知识库文档失败：" + e.getMessage());
        }
    }

    /**
     * 学习助手 - 智能问答（RAG技术）
     * 基于课程知识库进行智能问答
     */
    @PostMapping("/learning-assistant/ask")
    public ApiResponse<Map<String, Object>> askLearningAssistant(@RequestBody Map<String, Object> request) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            Long courseId = Long.valueOf(request.get("courseId").toString());
            String question = (String) request.get("question");
            Integer topK = request.get("topK") != null ? 
                    Integer.valueOf(request.get("topK").toString()) : 5; // 默认检索top 5

            // 验证学生身份
            Optional<Student> studentOpt = studentManagementService.getStudentByUserId(userId);
            if (!studentOpt.isPresent()) {
                return ApiResponse.error("学生信息不存在");
            }

            // 检查学生是否已加入该课程
            boolean isEnrolled = courseService.isStudentEnrolled(studentOpt.get().getId(), courseId);
            if (!isEnrolled) {
                return ApiResponse.error("您未加入此课程，无法使用学习助手");
            }

            // 检查课程知识库是否有数据
            KnowledgeBaseService.KnowledgeStats stats = knowledgeBaseService.getKnowledgeStats(courseId);
            if (stats.getProcessedChunks() == 0) {
                return ApiResponse.error("该课程的知识库暂无可用数据，请联系教师上传课程资料");
            }

            System.out.println("学习助手问答 - 用户: " + userId + ", 课程: " + courseId + ", 问题: " + question);

            // 第一步：文档召回 - 使用embedding模型向量化问题，并从向量数据库中进行近似搜索
            System.out.println("步骤1: 文档召回 - 向量化问题并搜索相关内容");
            List<VectorDatabaseService.SearchResult> searchResults = 
                    knowledgeBaseService.searchKnowledge(courseId, question, topK);

            if (searchResults.isEmpty()) {
                return ApiResponse.error("未找到相关的课程内容，请尝试换个问法或联系教师");
            }

            System.out.println("检索到 " + searchResults.size() + " 个相关知识块");

            // 组装相关内容
            StringBuilder relevantContent = new StringBuilder();
            for (int i = 0; i < searchResults.size(); i++) {
                VectorDatabaseService.SearchResult result = searchResults.get(i);
                relevantContent.append("【相关内容").append(i + 1).append("】");
                if (result.getScore() > 0) {
                    relevantContent.append(" (相似度: ").append(String.format("%.3f", result.getScore())).append(")");
                }
                relevantContent.append("\n");
                relevantContent.append(result.getContent()).append("\n\n");
            }

            // 第二步：向LLM提问 - 将匹配的内容与用户问题组装成Prompt，向大语言模型提问
            System.out.println("步骤2: 向LLM提问 - 组装Prompt并调用大语言模型");
            String llmAnswer = generateLearningAssistantAnswer(question, relevantContent.toString(), courseId);

            // 构建响应结果
            Map<String, Object> response = new HashMap<>();
            response.put("question", question);
            response.put("answer", llmAnswer);
            response.put("relevantCount", searchResults.size());
            response.put("courseId", courseId);
            response.put("searchTimestamp", System.currentTimeMillis());

            // 添加检索到的相关内容详情（供调试和展示）
            List<Map<String, Object>> searchDetails = searchResults.stream().map(result -> {
                Map<String, Object> detail = new HashMap<>();
                detail.put("content", result.getContent());
                detail.put("score", result.getScore());
                // 截取内容预览
                String preview = result.getContent();
                if (preview != null && preview.length() > 100) {
                    preview = preview.substring(0, 100) + "...";
                }
                detail.put("preview", preview);
                return detail;
            }).collect(java.util.stream.Collectors.toList());
            response.put("searchDetails", searchDetails);

            System.out.println("学习助手问答完成");
            return ApiResponse.success("学习助手回答成功", response);

        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("学习助手服务异常：" + e.getMessage());
        }
    }

    /**
     * 获取课程知识库统计信息（供学习助手功能检查使用）
     */
    @GetMapping("/learning-assistant/course/{courseId}/stats")
    public ApiResponse<Map<String, Object>> getCourseKnowledgeStats(@PathVariable Long courseId, @RequestParam Long userId) {
        try {
            // 验证学生身份
            Optional<Student> studentOpt = studentManagementService.getStudentByUserId(userId);
            if (!studentOpt.isPresent()) {
                return ApiResponse.error("学生信息不存在");
            }

            // 检查学生是否已加入该课程
            boolean isEnrolled = courseService.isStudentEnrolled(studentOpt.get().getId(), courseId);
            if (!isEnrolled) {
                return ApiResponse.error("您未加入此课程");
            }

            // 获取课程信息
            Optional<Course> courseOpt = courseRepository.findById(courseId);
            if (!courseOpt.isPresent()) {
                return ApiResponse.error("课程不存在");
            }

            Course course = courseOpt.get();
            KnowledgeBaseService.KnowledgeStats stats = knowledgeBaseService.getKnowledgeStats(courseId);

            Map<String, Object> response = new HashMap<>();
            response.put("courseId", courseId);
            response.put("courseName", course.getName());
            response.put("courseCode", course.getCourseCode());
            response.put("totalChunks", stats.getTotalChunks());
            response.put("processedChunks", stats.getProcessedChunks());
            response.put("fileCount", stats.getFileCount());
            response.put("totalSize", stats.getTotalSize());
            response.put("available", stats.getProcessedChunks() > 0);
            response.put("message", stats.getProcessedChunks() > 0 ? 
                    "知识库可用，共有 " + stats.getProcessedChunks() + " 个知识块" : 
                    "知识库暂无可用数据");

            return ApiResponse.success("获取课程知识库统计成功", response);

        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("获取课程知识库统计失败：" + e.getMessage());
        }
    }

    /**
     * 生成学习助手答案
     * 使用大语言模型基于检索到的相关内容回答学生问题
     */
    private String generateLearningAssistantAnswer(String question, String relevantContent, Long courseId) {
        try {
            // 获取课程信息
            Optional<Course> courseOpt = courseRepository.findById(courseId);
            String courseName = courseOpt.isPresent() ? courseOpt.get().getName() : "未知课程";

            String prompt = String.format(
                "**你是一个专业的学习助手，专门帮助学生解答《%s》课程的学习问题。**\n\n" +
                "**角色定位：**\n" +
                "- 你是一位耐心、专业的AI学习助手\n" +
                "- 你的任务是基于课程知识库内容，准确、详细地回答学生的学习问题\n" +
                "- 你需要用通俗易懂的语言解释复杂概念，帮助学生更好地理解\n\n" +
                "**回答要求：**\n" +
                "1. **准确性第一**：基于提供的课程内容进行回答，不要编造信息\n" +
                "2. **结构清晰**：使用标题、要点、例子等方式组织答案\n" +
                "3. **详细解释**：不仅要回答是什么，还要解释为什么\n" +
                "4. **实用导向**：如果可能，提供学习建议或实践方法\n" +
                "5. **友好态度**：使用鼓励性语言，让学生感到支持\n\n" +
                "**学生问题：**\n" +
                "%s\n\n" +
                "**从课程知识库检索到的相关内容：**\n" +
                "%s\n\n" +
                "**请基于以上课程内容，详细回答学生的问题。如果检索到的内容不足以完全回答问题，请说明需要更多信息，并建议学生如何获取帮助。**",
                courseName,
                question,
                relevantContent
            );

                         return deepSeekService.generateLearningAssistantResponse(prompt);

        } catch (Exception e) {
            System.err.println("生成学习助手答案失败: " + e.getMessage());
            return "抱歉，学习助手暂时无法处理您的问题，请稍后再试或联系教师获取帮助。";
        }
    }
    
    /**
     * 根据文件名获取MIME类型
     */
    private String getContentTypeFromFileName(String fileName) {
        if (fileName == null) {
            return org.springframework.http.MediaType.APPLICATION_OCTET_STREAM_VALUE;
        }
        
        String extension = "";
        int lastDotIndex = fileName.lastIndexOf('.');
        if (lastDotIndex > 0 && lastDotIndex < fileName.length() - 1) {
            extension = fileName.substring(lastDotIndex + 1).toLowerCase();
        }
        
        switch (extension) {
            case "txt":
                return "text/plain";
            case "pdf":
                return "application/pdf";
            case "doc":
                return "application/msword";
            case "docx":
                return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case "xls":
                return "application/vnd.ms-excel";
            case "xlsx":
                return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            case "ppt":
                return "application/vnd.ms-powerpoint";
            case "pptx":
                return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
            case "jpg":
            case "jpeg":
                return "image/jpeg";
            case "png":
                return "image/png";
            case "gif":
                return "image/gif";
            case "zip":
                return "application/zip";
            case "rar":
                return "application/x-rar-compressed";
            case "mp4":
                return "video/mp4";
            case "mp3":
                return "audio/mpeg";
            case "html":
            case "htm":
                return "text/html";
            case "css":
                return "text/css";
            case "js":
                return "application/javascript";
            case "json":
                return "application/json";
            case "xml":
                return "application/xml";
            default:
                return org.springframework.http.MediaType.APPLICATION_OCTET_STREAM_VALUE;
        }
    }
    
    // ==================== 考试相关功能 ====================
    
    /**
     * 获取考试详情（学生答题用）
     */
    @GetMapping("/exam/{examId}")
    public ApiResponse<StudentExamDTO> getExamForStudent(@PathVariable Long examId, @RequestParam Long userId) {
        try {
            // 验证学生身份
            Optional<Student> studentOpt = studentManagementService.getStudentByUserId(userId);
            if (!studentOpt.isPresent()) {
                return ApiResponse.error("学生信息不存在");
            }
            Student student = studentOpt.get();
            
            // 获取考试信息
            Optional<Exam> examOpt = examRepository.findById(examId);
            if (!examOpt.isPresent()) {
                return ApiResponse.error("考试不存在");
            }
            Exam exam = examOpt.get();
            
            // 验证考试是否已发布
            if (!exam.getIsPublished()) {
                return ApiResponse.error("考试尚未发布");
            }
            
            // 验证学生是否已加入该课程
            if (!courseService.isStudentEnrolled(student.getId(), exam.getCourse().getId())) {
                return ApiResponse.error("您尚未加入此课程");
            }
            
            // 检查考试时间
            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            if (exam.getStartTime() != null && now.isBefore(exam.getStartTime())) {
                return ApiResponse.error("考试尚未开始");
            }
            if (exam.getEndTime() != null && now.isAfter(exam.getEndTime())) {
                return ApiResponse.error("考试已结束");
            }
            
            // 检查学生是否已提交
            Optional<ExamResult> existingResult = examResultRepository.findByStudentIdAndExamId(student.getId(), examId);
            if (existingResult.isPresent()) {
                return ApiResponse.error("您已提交过此考试");
            }
            
            // 构建考试DTO，包含题目但不显示答案
            StudentExamDTO examDTO = new StudentExamDTO(exam, true, false);
            examDTO.setHasSubmitted(false);
            
            // 计算剩余时间
            if (exam.getEndTime() != null) {
                java.time.Duration duration = java.time.Duration.between(now, exam.getEndTime());
                examDTO.setRemainingMinutes((int) duration.toMinutes());
            }
            
            return ApiResponse.success("获取考试详情成功", examDTO);
            
        } catch (Exception e) {
            return ApiResponse.error("获取考试详情失败：" + e.getMessage());
        }
    }
    
    /**
     * 开始考试（创建考试记录）
     */
    @PostMapping("/exam/{examId}/start")
    public ApiResponse<Map<String, Object>> startExam(@PathVariable Long examId, @RequestParam Long userId) {
        try {
            // 验证学生身份
            Optional<Student> studentOpt = studentManagementService.getStudentByUserId(userId);
            if (!studentOpt.isPresent()) {
                return ApiResponse.error("学生信息不存在");
            }
            Student student = studentOpt.get();
            
            // 获取考试信息
            Optional<Exam> examOpt = examRepository.findById(examId);
            if (!examOpt.isPresent()) {
                return ApiResponse.error("考试不存在");
            }
            Exam exam = examOpt.get();
            
            // 验证考试状态
            if (!exam.getIsPublished()) {
                return ApiResponse.error("考试尚未发布");
            }
            
            // 验证学生是否已加入该课程
            if (!courseService.isStudentEnrolled(student.getId(), exam.getCourse().getId())) {
                return ApiResponse.error("您尚未加入此课程");
            }
            
            // 检查考试时间
            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            if (exam.getStartTime() != null && now.isBefore(exam.getStartTime())) {
                return ApiResponse.error("考试尚未开始");
            }
            if (exam.getEndTime() != null && now.isAfter(exam.getEndTime())) {
                return ApiResponse.error("考试已结束");
            }
            
            // 检查学生是否已开始考试
            Optional<ExamResult> existingResult = examResultRepository.findByStudentIdAndExamId(student.getId(), examId);
            if (existingResult.isPresent()) {
                return ApiResponse.error("您已开始过此考试");
            }
            
            // 创建考试结果记录
            ExamResult examResult = new ExamResult();
            examResult.setStudent(student);
            examResult.setExam(exam);
            examResult.setStartTime(now);
            examResult.setTotalScore(exam.getTotalScore());
            examResult.setGradeStatus("PENDING");
            
            examResult = examResultRepository.save(examResult);
            
            Map<String, Object> response = new HashMap<>();
            response.put("examResultId", examResult.getId());
            response.put("startTime", examResult.getStartTime());
            response.put("message", "考试已开始");
            
            return ApiResponse.success("开始考试成功", response);
            
        } catch (Exception e) {
            return ApiResponse.error("开始考试失败：" + e.getMessage());
        }
    }
    
    /**
     * 暂存考试答案
     */
    @PostMapping("/exam/save-answers")
    public ApiResponse<String> saveExamAnswers(@RequestBody Map<String, Object> request, @RequestParam Long userId) {
        try {
            // 验证学生身份
            Optional<Student> studentOpt = studentManagementService.getStudentByUserId(userId);
            if (!studentOpt.isPresent()) {
                return ApiResponse.error("学生信息不存在");
            }
            Student student = studentOpt.get();
            
            // 获取请求参数
            Long examId = Long.valueOf(request.get("examId").toString());
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> answers = (List<Map<String, Object>>) request.get("answers");
            
            // 获取考试信息
            Optional<Exam> examOpt = examRepository.findById(examId);
            if (!examOpt.isPresent()) {
                return ApiResponse.error("考试不存在");
            }
            Exam exam = examOpt.get();
            
            // 验证考试状态
            if (!exam.getIsPublished()) {
                return ApiResponse.error("考试尚未发布");
            }
            
            // 检查考试时间
            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            if (exam.getStartTime() != null && now.isBefore(exam.getStartTime())) {
                return ApiResponse.error("考试尚未开始");
            }
            if (exam.getEndTime() != null && now.isAfter(exam.getEndTime())) {
                return ApiResponse.error("考试已结束");
            }
            
            // 获取或创建考试结果记录
            Optional<ExamResult> resultOpt = examResultRepository.findByStudentIdAndExamId(student.getId(), examId);
            ExamResult examResult;
            
            if (!resultOpt.isPresent()) {
                // 如果还没有考试记录，创建一个（开始考试）
                examResult = new ExamResult();
                examResult.setStudent(student);
                examResult.setExam(exam);
                examResult.setStartTime(now);
                examResult.setTotalScore(exam.getTotalScore());
                examResult.setGradeStatus("PENDING");
                examResult = examResultRepository.save(examResult);
            } else {
                examResult = resultOpt.get();
                // 检查是否已提交
                if (examResult.getSubmitTime() != null) {
                    return ApiResponse.error("考试已提交，无法再次保存答案");
                }
            }
            
            // 删除该学生在此考试中的旧答案（如果有的话）
            List<StudentAnswer> existingAnswers = studentAnswerRepository.findByStudentIdAndExamResultId(student.getId(), examResult.getId());
            if (!existingAnswers.isEmpty()) {
                studentAnswerRepository.deleteAll(existingAnswers);
            }
            
            // 保存新答案
            for (Map<String, Object> answerData : answers) {
                Long questionId = Long.valueOf(answerData.get("questionId").toString());
                String answer = answerData.get("answer").toString();
                
                if (answer != null && !answer.trim().isEmpty()) {
                    Optional<Question> questionOpt = questionRepository.findById(questionId);
                    if (questionOpt.isPresent()) {
                        Question question = questionOpt.get();
                        
                        StudentAnswer studentAnswer = new StudentAnswer();
                        studentAnswer.setStudent(student);
                        studentAnswer.setQuestion(question);
                        studentAnswer.setExamResult(examResult);
                        studentAnswer.setAnswer(answer);
                        studentAnswer.setMaxScore(question.getScore());
                        studentAnswer.setScore(0); // 暂存时不评分
                        studentAnswer.setIsCorrect(false); // 暂存时不判断正误
                        
                        studentAnswerRepository.save(studentAnswer);
                    }
                }
            }
            
            return ApiResponse.success("答案暂存成功");
            
        } catch (Exception e) {
            return ApiResponse.error("暂存答案失败：" + e.getMessage());
        }
    }

    /**
     * 提交考试答案
     */
    @PostMapping("/exam/submit")
    public ApiResponse<Map<String, Object>> submitExam(@RequestBody Map<String, Object> request, @RequestParam Long userId) {
        try {
            // 验证学生身份
            Optional<Student> studentOpt = studentManagementService.getStudentByUserId(userId);
            if (!studentOpt.isPresent()) {
                return ApiResponse.error("学生信息不存在");
            }
            Student student = studentOpt.get();
            
            // 获取请求参数
            Long examId = Long.valueOf(request.get("examId").toString());
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> answers = (List<Map<String, Object>>) request.get("answers");
            
            // 获取考试信息
            Optional<Exam> examOpt = examRepository.findById(examId);
            if (!examOpt.isPresent()) {
                return ApiResponse.error("考试不存在");
            }
            Exam exam = examOpt.get();
            
            // 获取考试结果记录
            Optional<ExamResult> resultOpt = examResultRepository.findByStudentIdAndExamId(student.getId(), examId);
            ExamResult examResult;
            
            if (!resultOpt.isPresent()) {
                // 如果还没有考试记录，创建一个
                examResult = new ExamResult();
                examResult.setStudent(student);
                examResult.setExam(exam);
                examResult.setStartTime(java.time.LocalDateTime.now());
                examResult.setTotalScore(exam.getTotalScore());
                examResult.setGradeStatus("PENDING");
                examResult = examResultRepository.save(examResult);
            } else {
                examResult = resultOpt.get();
                // 检查是否已提交
                if (examResult.getSubmitTime() != null) {
                    return ApiResponse.error("您已提交过此考试");
                }
            }
            
            // 检查考试时间（允许稍微超时提交）
            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            if (exam.getEndTime() != null && now.isAfter(exam.getEndTime().plusMinutes(5))) {
                return ApiResponse.error("考试已结束超过5分钟，无法提交");
            }
            
            // 删除该学生在此考试中的旧答案
            List<StudentAnswer> existingAnswers = studentAnswerRepository.findByStudentIdAndExamResultId(student.getId(), examResult.getId());
            if (!existingAnswers.isEmpty()) {
                studentAnswerRepository.deleteAll(existingAnswers);
            }
            
            // 保存学生答案并评分
            int totalScore = 0;
            for (Map<String, Object> answerData : answers) {
                Long questionId = Long.valueOf(answerData.get("questionId").toString());
                String answer = answerData.get("answer") != null ? answerData.get("answer").toString() : "";
                
                Optional<Question> questionOpt = questionRepository.findById(questionId);
                if (questionOpt.isPresent()) {
                    Question question = questionOpt.get();
                    
                    StudentAnswer studentAnswer = new StudentAnswer();
                    studentAnswer.setStudent(student);
                    studentAnswer.setQuestion(question);
                    studentAnswer.setExamResult(examResult);
                    studentAnswer.setAnswer(answer);
                    studentAnswer.setMaxScore(question.getScore());
                    
                    // 自动批改（简单比较答案）
                    boolean isCorrect = checkAnswer(question, answer);
                    studentAnswer.setIsCorrect(isCorrect);
                    studentAnswer.setScore(isCorrect ? question.getScore() : 0);
                    
                    studentAnswerRepository.save(studentAnswer);
                    totalScore += studentAnswer.getScore();
                }
            }
            
            // 更新考试结果
            examResult.setSubmitTime(now);
            examResult.setScore(totalScore);
            examResult.setIsCorrected(true);
            examResult.setGradeStatus("AI_GRADED");
            
            // 计算用时
            if (examResult.getStartTime() != null) {
                java.time.Duration duration = java.time.Duration.between(examResult.getStartTime(), now);
                examResult.setDurationMinutes((int) duration.toMinutes());
            }
            
            examResultRepository.save(examResult);
            
            Map<String, Object> response = new HashMap<>();
            response.put("examResultId", examResult.getId());
            response.put("score", totalScore);
            response.put("totalScore", exam.getTotalScore());
            response.put("submitTime", examResult.getSubmitTime());
            response.put("message", "考试提交成功");
            
            return ApiResponse.success("提交考试成功", response);
            
        } catch (Exception e) {
            return ApiResponse.error("提交考试失败：" + e.getMessage());
        }
    }
    
    /**
     * 获取考试结果详情（包含答案和解析）
     */
    @GetMapping("/exam-result/{examResultId}")
    public ApiResponse<Map<String, Object>> getExamResult(@PathVariable Long examResultId, @RequestParam Long userId) {
        try {
            // 验证学生身份
            Optional<Student> studentOpt = studentManagementService.getStudentByUserId(userId);
            if (!studentOpt.isPresent()) {
                return ApiResponse.error("学生信息不存在");
            }
            Student student = studentOpt.get();
            
            // 获取考试结果
            Optional<ExamResult> resultOpt = examResultRepository.findById(examResultId);
            if (!resultOpt.isPresent()) {
                return ApiResponse.error("考试结果不存在");
            }
            ExamResult examResult = resultOpt.get();
            
            // 验证权限
            if (!examResult.getStudent().getId().equals(student.getId())) {
                return ApiResponse.error("您没有权限查看此考试结果");
            }
            
            // 检查是否已提交
            if (examResult.getSubmitTime() == null) {
                return ApiResponse.error("考试尚未提交");
            }
            
            Exam exam = examResult.getExam();
            
            // 检查是否可以查看试卷（只有考试结束后才能查看）
            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            boolean canViewPaper = false;
            String viewMessage = "";
            
            if (exam.getEndTime() != null) {
                if (now.isAfter(exam.getEndTime())) {
                    canViewPaper = true;
                } else {
                    java.time.Duration remaining = java.time.Duration.between(now, exam.getEndTime());
                    long hours = remaining.toHours();
                    long minutes = remaining.toMinutes() % 60;
                    viewMessage = String.format("考试结束后方可查看试卷详情，剩余时间：%d小时%d分钟", hours, minutes);
                }
            } else {
                // 如果没有设置结束时间，检查是否有其他学生还在考试
                // 简化处理：如果没有结束时间，则立即可以查看
                canViewPaper = true;
            }
            
            // 检查答案是否已发布（管理员可以控制是否显示答案和解析）
            boolean showAnswers = canViewPaper && (exam.getIsAnswerPublished() == null || exam.getIsAnswerPublished());
            
            // 检查成绩是否已发布（教师控制是否显示最终成绩）
            boolean showFinalScore = exam.getIsAnswerPublished() != null && exam.getIsAnswerPublished();
            
            // 构建考试DTO
            StudentExamDTO examDTO = new StudentExamDTO(exam, canViewPaper, showAnswers);
            examDTO.setHasSubmitted(true);
            examDTO.setExamResultId(examResultId);
            
            // 获取学生答案
            List<StudentAnswer> studentAnswers = studentAnswerRepository.findByExamResultId(examResultId);
            Map<Long, StudentAnswer> answerMap = studentAnswers.stream()
                .collect(java.util.stream.Collectors.toMap(sa -> sa.getQuestion().getId(), sa -> sa));
            
            // 设置学生答案到题目中
            if (canViewPaper && examDTO.getQuestions() != null) {
                for (StudentQuestionDTO questionDTO : examDTO.getQuestions()) {
                    StudentAnswer studentAnswer = answerMap.get(questionDTO.getId());
                    if (studentAnswer != null) {
                        questionDTO.setStudentAnswer(studentAnswer.getAnswer());
                        questionDTO.setStudentScore(studentAnswer.getScore());
                        questionDTO.setIsCorrect(studentAnswer.getIsCorrect());
                        // 添加教师反馈（只有在成绩发布后才显示）
                        if (showFinalScore && studentAnswer.getTeacherFeedback() != null) {
                            questionDTO.setTeacherFeedback(studentAnswer.getTeacherFeedback());
                        }
                    }
                }
            }
            
            // 根据成绩发布状态决定显示的分数
            Double displayScore = null;
            if (showFinalScore) {
                // 如果成绩已发布，显示最终得分（如果有的话），否则显示AI评分
                displayScore = examResult.getFinalScore() != null ? examResult.getFinalScore() : examResult.getScore().doubleValue();
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("examResult", examResult);
            response.put("exam", examDTO);
            response.put("canViewPaper", canViewPaper);
            response.put("viewMessage", viewMessage);
            response.put("showAnswers", showAnswers);
            response.put("showFinalScore", showFinalScore);
            response.put("score", displayScore); // 根据发布状态显示分数
            response.put("aiScore", examResult.getScore()); // 保留AI评分用于调试
            response.put("finalScore", examResult.getFinalScore()); // 保留最终得分用于调试
            response.put("totalScore", examResult.getTotalScore());
            response.put("durationMinutes", examResult.getDurationMinutes());
            response.put("submitTime", examResult.getSubmitTime());
            response.put("gradeStatus", examResult.getGradeStatus());
            // 添加教师评语（只有在成绩发布后才显示）
            if (showFinalScore && examResult.getTeacherComments() != null) {
                response.put("teacherComments", examResult.getTeacherComments());
            }
            
            return ApiResponse.success("获取考试结果成功", response);
            
        } catch (Exception e) {
            return ApiResponse.error("获取考试结果失败：" + e.getMessage());
        }
    }
    
    /**
     * 简单的答案检查方法
     */
    private boolean checkAnswer(Question question, String studentAnswer) {
        if (question.getAnswer() == null || studentAnswer == null) {
            return false;
        }
        
        String correctAnswer = question.getAnswer().trim().toLowerCase();
        String studentAnswerLower = studentAnswer.trim().toLowerCase();
        
        // 根据题型进行不同的比较
        switch (question.getType().toLowerCase()) {
            case "multiple-choice":
            case "single-choice":
                // 选择题：精确匹配
                return correctAnswer.equals(studentAnswerLower);
                
            case "true-false":
            case "判断题":
                // 判断题：处理多种表达方式
                return normalizeBoolean(correctAnswer).equals(normalizeBoolean(studentAnswerLower));
                
            case "fill-blank":
            case "填空题":
                // 填空题：去除空格后比较
                return correctAnswer.replaceAll("\\s+", "").equals(studentAnswerLower.replaceAll("\\s+", ""));
                
            default:
                // 其他题型：包含关键词即可
                return studentAnswerLower.contains(correctAnswer) || correctAnswer.contains(studentAnswerLower);
        }
    }
    
    /**
     * 标准化布尔值表达
     */
    private String normalizeBoolean(String answer) {
        answer = answer.toLowerCase().trim();
        if (answer.equals("true") || answer.equals("正确") || answer.equals("是") || answer.equals("对") || answer.equals("t") || answer.equals("√")) {
            return "true";
        }
        if (answer.equals("false") || answer.equals("错误") || answer.equals("否") || answer.equals("错") || answer.equals("f") || answer.equals("×")) {
            return "false";
        }
        return answer;
    }
} 