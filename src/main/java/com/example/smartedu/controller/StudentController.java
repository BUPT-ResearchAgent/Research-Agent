package com.example.smartedu.controller;

import com.example.smartedu.dto.ApiResponse;
import com.example.smartedu.entity.*;
import com.example.smartedu.service.StudentManagementService;
import com.example.smartedu.repository.*;
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
    public ApiResponse<List<Course>> getAllCourses() {
        try {
            List<Course> courses = courseRepository.findByStatus("active");
            return ApiResponse.success("获取课程列表成功", courses);
        } catch (Exception e) {
            return ApiResponse.error("获取课程列表失败：" + e.getMessage());
        }
    }
    
    /**
     * 获取课程详情
     */
    @GetMapping("/courses/{courseId}")
    public ApiResponse<Course> getCourseDetail(@PathVariable Long courseId) {
        try {
            Optional<Course> courseOpt = courseRepository.findById(courseId);
            if (!courseOpt.isPresent()) {
                return ApiResponse.error("课程不存在");
            }
            
            return ApiResponse.success("获取课程详情成功", courseOpt.get());
        } catch (Exception e) {
            return ApiResponse.error("获取课程详情失败：" + e.getMessage());
        }
    }
    
    /**
     * 获取课程公告
     */
    @GetMapping("/courses/{courseId}/notices")
    public ApiResponse<List<Notice>> getCourseNotices(@PathVariable Long courseId) {
        try {
            List<Notice> notices = noticeRepository.findByCourseIdOrderByCreatedAtDesc(courseId);
            return ApiResponse.success("获取课程公告成功", notices);
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
} 