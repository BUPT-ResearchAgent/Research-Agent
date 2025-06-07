package com.example.smartedu.controller;

import com.example.smartedu.dto.ApiResponse;
import com.example.smartedu.entity.*;
import com.example.smartedu.repository.*;
import com.example.smartedu.service.TeacherService;
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
@CrossOrigin(origins = "*")
public class TeacherController {
    
    // 模拟当前登录教师ID
    private static final Long CURRENT_TEACHER_ID = 1L;
    
    @Autowired
    private TeacherService teacherService;
    
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
    public ApiResponse<List<Course>> getTeacherCourses() {
        try {
            // 使用当前登录教师ID
            List<Course> courses = teacherService.getTeacherCourses(CURRENT_TEACHER_ID);
            
            System.out.println("获取课程列表，数量: " + courses.size());
            for (Course course : courses) {
                System.out.println("  课程ID: " + course.getId() + ", 名称: " + course.getName() + ", 创建时间: " + course.getCreatedAt());
            }
            
            return ApiResponse.success(courses);
        } catch (Exception e) {
            return ApiResponse.error("获取课程列表失败：" + e.getMessage());
        }
    }
    
    /**
     * 获取课程资料列表
     */
    @GetMapping("/materials")
    public ApiResponse<List<CourseMaterial>> getMaterials(@RequestParam(required = false) Long courseId) {
        try {
            List<CourseMaterial> materials;
            if (courseId != null) {
                materials = teacherService.getCourseMaterials(courseId);
            } else {
                // 获取当前教师的所有课程的资料
                materials = teacherService.getAllTeacherMaterials(CURRENT_TEACHER_ID);
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
            return ApiResponse.success("教学大纲生成成功", outline);
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("生成教学大纲失败：" + e.getMessage());
        }
    }
    
    /**
     * 获取教学大纲历史记录
     */
    @GetMapping("/outlines")
    public ApiResponse<List<TeachingOutline>> getOutlineHistory(@RequestParam(required = false) Long courseId) {
        try {
            System.out.println("获取教学大纲历史记录，courseId: " + courseId);
            List<TeachingOutline> outlines = teacherService.getOutlineHistory(courseId);
            System.out.println("找到教学大纲数量: " + outlines.size());
            
            for (TeachingOutline outline : outlines) {
                System.out.println("大纲ID: " + outline.getId() + ", 课程: " + 
                    (outline.getCourse() != null ? outline.getCourse().getName() : "null") +
                    ", 创建时间: " + outline.getCreatedAt());
            }
            
            return ApiResponse.success("获取历史记录成功", outlines);
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("获取历史记录失败：" + e.getMessage());
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
     * 新建课程
     */
    @PostMapping("/courses")
    public ApiResponse<Course> createCourse(@RequestBody Course course) {
        try {
            System.out.println("接收到创建课程请求: " + course.getName());
            
            // 生成唯一的课程号
            String courseCode = courseCodeService.generateUniqueCourseCode();
            course.setCourseCode(courseCode);
            
            // 设置创建者为当前教师
            course.setTeacherId(CURRENT_TEACHER_ID);
            course.setTeacherName("教师"); // 默认教师姓名，实际应从用户会话获取
            course.setCreatedAt(LocalDateTime.now());
            course.setUpdatedAt(LocalDateTime.now());
            
            Course savedCourse = courseRepository.save(course);
            System.out.println("课程保存成功，ID: " + savedCourse.getId() + ", 名称: " + savedCourse.getName() + ", 课程号: " + savedCourse.getCourseCode());
            
            return ApiResponse.success("课程创建成功", savedCourse);
        } catch (Exception e) {
            System.err.println("创建课程失败: " + e.getMessage());
            return ApiResponse.error("创建课程失败: " + e.getMessage());
        }
    }

    /* 暂时注释掉更新和删除课程功能，避免编译错误
    @PutMapping("/courses/{courseId}")
    public ApiResponse<?> updateCourse(@PathVariable Long courseId, @RequestBody Course course) {
        // TODO: 实现更新课程功能
        return ApiResponse.error("功能开发中");
    }

    @DeleteMapping("/courses/{courseId}")
    public ApiResponse<?> deleteCourse(@PathVariable Long courseId) {
        // TODO: 实现删除课程功能
        return ApiResponse.error("功能开发中");
    }
    */

    /**
     * 根据课程号查找课程
     */
    @GetMapping("/courses/code/{courseCode}")
    public ApiResponse<Course> getCourseByCode(@PathVariable String courseCode) {
        try {
            Course course = courseRepository.findByCourseCode(courseCode);
            if (course == null) {
                return ApiResponse.error("课程号不存在");
            }
            return ApiResponse.success("查找成功", course);
        } catch (Exception e) {
            return ApiResponse.error("查找课程失败：" + e.getMessage());
        }
    }

    /**
     * 更新课程
     */
    @PutMapping("/courses/{courseId}")
    public ApiResponse<Course> updateCourse(@PathVariable Long courseId, @RequestBody Course courseData) {
        try {
            System.out.println("接收到更新课程请求，课程ID: " + courseId);
            
            Course existingCourse = courseRepository.findById(courseId).orElse(null);
            if (existingCourse == null) {
                return ApiResponse.error("课程不存在");
            }
            
            // 更新允许修改的字段，但不能修改课程号
            existingCourse.setName(courseData.getName());
            existingCourse.setDescription(courseData.getDescription());
            existingCourse.setCredit(courseData.getCredit());
            existingCourse.setHours(courseData.getHours());
            existingCourse.setUpdatedAt(LocalDateTime.now());
            
            Course updatedCourse = courseRepository.save(existingCourse);
            System.out.println("课程更新成功，ID: " + courseId + ", 课程号: " + updatedCourse.getCourseCode());
            
            return ApiResponse.success("课程更新成功", updatedCourse);
        } catch (Exception e) {
            System.err.println("更新课程失败: " + e.getMessage());
            return ApiResponse.error("更新课程失败：" + e.getMessage());
        }
    }

    /**
     * 删除课程
     */
    @DeleteMapping("/courses/{courseId}")
    public ApiResponse<Void> deleteCourse(@PathVariable Long courseId) {
        try {
            System.out.println("接收到删除课程请求，课程ID: " + courseId);
            
            if (!courseRepository.existsById(courseId)) {
                return ApiResponse.error("课程不存在");
            }
            
            courseRepository.deleteById(courseId);
            System.out.println("课程删除成功，ID: " + courseId);
            
            return ApiResponse.success("课程删除成功", null);
        } catch (Exception e) {
            System.err.println("删除课程失败: " + e.getMessage());
            return ApiResponse.error("删除课程失败：" + e.getMessage());
        }
    }

    /**
     * 获取教学统计数据
     */
    @GetMapping("/dashboard/stats")
    public ApiResponse<Map<String, Object>> getDashboardStats() {
        try {
            Map<String, Object> stats = new HashMap<>();
            
            // 获取真实的课程统计
            List<Course> courses = courseRepository.findByTeacherId(CURRENT_TEACHER_ID);
            stats.put("totalCourses", courses.size());
            
            // 学生统计：初始为0，实际应该从学生选课表获取
            stats.put("totalStudents", 0);
            
            // 获取真实的试卷统计
            List<Exam> exams = examRepository.findByTeacherId(CURRENT_TEACHER_ID);
            stats.put("totalExams", exams.size());
            
            // 获取真实的待批改试卷数量
            List<Long> examIds = exams.stream().map(Exam::getId).collect(Collectors.toList());
            long pendingGrades = 0;
            if (!examIds.isEmpty()) {
                try {
                    pendingGrades = examResultRepository.countByExamIdInAndGradeStatus(examIds, "PENDING");
                } catch (Exception e) {
                    // 如果查询失败，返回0
                    pendingGrades = 0;
                }
            }
            stats.put("pendingGrades", pendingGrades);
            
            // 获取真实的平均成绩
            Double avgScore = null;
            try {
                avgScore = examResultRepository.getAverageScoreByTeacherId(CURRENT_TEACHER_ID);
            } catch (Exception e) {
                // 如果查询失败，返回null
                avgScore = null;
            }
            stats.put("averageScore", avgScore != null ? avgScore : 0.0);
            
            // 计算真实的完成率：初始为0
            stats.put("completionRate", 0.0);
            
            return ApiResponse.success("统计数据获取成功", stats);
        } catch (Exception e) {
            return ApiResponse.error("获取统计数据失败: " + e.getMessage());
        }
    }
} 