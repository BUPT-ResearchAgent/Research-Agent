package com.example.smartedu.service;

import com.example.smartedu.dto.ExamGenerationRequest;
import com.example.smartedu.entity.*;
import com.example.smartedu.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class TeacherService {
    
    @Autowired
    private CourseRepository courseRepository;
    
    @Autowired
    private CourseMaterialRepository materialRepository;
    
    @Autowired
    private NoticeRepository noticeRepository;
    
    @Autowired
    private ExamRepository examRepository;
    
    @Autowired
    private TeachingOutlineRepository outlineRepository;
    
    @Autowired
    private TeacherRepository teacherRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private FileService fileService;
    
    @Autowired
    private DeepSeekService deepSeekService;
    
    @Autowired
    private OnlineUserService onlineUserService;
    
    @Autowired
    private StudentCourseRepository studentCourseRepository;
    
    private static final String SALT = "SmartEdu2024"; // 与UserService保持一致的盐值
    
    /**
     * 上传课程资料
     */
    public CourseMaterial uploadCourseMaterial(Long courseId, MultipartFile file, String materialType, String description) throws Exception {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("课程不存在"));
        
        // 生成唯一文件名（保留扩展名）
        String originalFilename = file.getOriginalFilename();
        String filename = java.util.UUID.randomUUID().toString();
        if (originalFilename != null && originalFilename.contains(".")) {
            String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            filename += extension;
        }
        
        // 简化内容提取，对于非文本文件返回基本信息
        String content = "已上传文件：" + originalFilename;
        String fileExtension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
        }
        
        // 如果是文本文件，尝试读取内容
        if (".txt".equals(fileExtension)) {
            try {
                content = new String(file.getBytes(), "UTF-8");
            } catch (Exception e) {
                content = "文本文件内容读取失败：" + e.getMessage();
            }
        }
        
        // 创建课程资料记录，直接存储到数据库
        CourseMaterial material = new CourseMaterial();
        material.setFilename(filename);
        material.setOriginalName(originalFilename);
        material.setFilePath("database_storage"); // 标记为数据库存储
        material.setFileType(file.getContentType());
        material.setFileSize(file.getSize());
        material.setFileData(file.getBytes()); // 直接存储文件数据到数据库
        material.setContent(content);
        material.setMaterialType(materialType);
        material.setDescription(description);
        material.setCourse(course);
        
        // 保存并确保关联关系正确
        CourseMaterial savedMaterial = materialRepository.save(material);
        savedMaterial.setCourseId(courseId); // 确保courseId被正确设置用于JSON序列化
        
        return savedMaterial;
    }
    
    /**
     * 生成教学大纲
     */
    public TeachingOutline generateTeachingOutline(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("课程不存在"));
        
        // 获取课程资料内容
        List<CourseMaterial> materials = materialRepository.findByCourseId(courseId);
        StringBuilder contentBuilder = new StringBuilder();
        for (CourseMaterial material : materials) {
            if (material.getContent() != null) {
                contentBuilder.append(material.getContent()).append("\n\n");
            }
        }
        
        if (contentBuilder.length() == 0) {
            throw new RuntimeException("请先上传课程资料");
        }
        
        // 调用DeepSeek生成教学大纲
        String outlineContent = deepSeekService.generateTeachingOutline(course.getName(), contentBuilder.toString());
        
        // 创建或更新教学大纲
        TeachingOutline outline = new TeachingOutline();
        outline.setCourse(course);
        outline.setTeachingDesign(outlineContent); // 简化处理，将整个内容存储
        
        // 检查是否已存在教学大纲
        Optional<TeachingOutline> existingOutline = outlineRepository.findByCourseId(courseId);
        if (existingOutline.isPresent()) {
            TeachingOutline existing = existingOutline.get();
            existing.setTeachingDesign(outlineContent);
            existing.setUpdatedAt(LocalDateTime.now());
            return outlineRepository.save(existing);
        } else {
            return outlineRepository.save(outline);
        }
    }
    
    /**
     * 发布通知
     */
    public Notice publishNotice(Long courseId, String title, String content) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("课程不存在"));
        
        Notice notice = new Notice(title, content, course);
        return noticeRepository.save(notice);
    }
    
    /**
     * 获取教师的课程列表 - 通过Teacher实体
     */
    public List<Course> getTeacherCourses(Long teacherId) {
        Teacher teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("教师不存在"));
        return courseRepository.findByTeacherOrderByUpdatedAtDesc(teacher);
    }
    
    /**
     * 获取教师的课程列表 - 通过用户ID
     */
    public List<Course> getTeacherCoursesByUserId(Long userId) {
        Teacher teacher = teacherRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("教师不存在"));
        return courseRepository.findByTeacherOrderByUpdatedAtDesc(teacher);
    }
    
    /**
     * 获取教师所有课程的在线学生数量
     */
    public int getTeacherOnlineStudentCount(Long teacherId) {
        // 获取教师的所有课程
        List<Course> courses = getTeacherCourses(teacherId);
        
        // 获取所有在线用户ID
        java.util.Set<Long> onlineUserIds = onlineUserService.getOnlineUserIds();
        
        // 统计选了这些课程且在线的学生数量
        java.util.Set<Long> onlineStudentUserIds = new java.util.HashSet<>();
        
        for (Course course : courses) {
            // 获取选了这门课程的学生的用户ID
            List<StudentCourse> studentCourses = studentCourseRepository.findByCourseIdAndStatus(course.getId(), "active");
            
            for (StudentCourse sc : studentCourses) {
                Long studentUserId = sc.getStudent().getUser().getId();
                if (onlineUserIds.contains(studentUserId)) {
                    onlineStudentUserIds.add(studentUserId);
                }
            }
        }
        
        return onlineStudentUserIds.size();
    }
    
    /**
     * 获取教师所有课程的在线学生数量 - 通过用户ID
     */
    public int getTeacherOnlineStudentCountByUserId(Long userId) {
        Teacher teacher = teacherRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("教师不存在"));
        return getTeacherOnlineStudentCount(teacher.getId());
    }
    
    /**
     * 生成唯一的课程代码
     */
    private String generateUniqueCourseCode() {
        String courseCode;
        int maxAttempts = 100; // 最多尝试100次
        int attempts = 0;
        
        do {
            // 生成4位随机数
            int randomNum = (int) (Math.random() * 10000);
            courseCode = String.format("SE-%04d", randomNum);
            attempts++;
            
            if (attempts > maxAttempts) {
                throw new RuntimeException("无法生成唯一的课程代码，请稍后重试");
            }
        } while (courseRepository.existsByCourseCode(courseCode));
        
        return courseCode;
    }

    /**
     * 创建课程（自动生成课程代码）
     */
    public Course createCourse(Long teacherId, String name, String description, 
                             Integer credit, Integer hours, String semester, String academicYear,
                             String classTime, String classLocation, Integer maxStudents) {
        Teacher teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("教师不存在"));
        
        // 自动生成唯一的课程代码
        String courseCode = generateUniqueCourseCode();
        
        Course course = new Course(name, description, teacher);
        course.setCourseCode(courseCode);
        course.setCredit(credit);
        course.setHours(hours);
        course.setSemester(semester);
        course.setAcademicYear(academicYear);
        course.setClassTime(classTime);
        course.setClassLocation(classLocation);
        course.setMaxStudents(maxStudents);
        
        return courseRepository.save(course);
    }
    
    /**
     * 获取课程通知
     */
    public List<Notice> getCourseNotices(Long courseId) {
        return noticeRepository.findByCourseIdOrderByCreatedAtDesc(courseId);
    }
    
    /**
     * 获取课程考试列表
     */
    public List<Exam> getCourseExams(Long courseId) {
        return examRepository.findByCourseIdOrderByCreatedAtDesc(courseId);
    }
    
    /**
     * 获取课程资料列表
     */
    public List<CourseMaterial> getCourseMaterials(Long courseId) {
        return materialRepository.findByCourseIdOrderByUploadedAtDesc(courseId);
    }
    
    /**
     * 获取教学大纲历史记录
     */
    public List<TeachingOutline> getOutlineHistory(Long courseId) {
        if (courseId != null) {
            return outlineRepository.findByCourseIdOrderByCreatedAtDesc(courseId);
        } else {
            return outlineRepository.findAllByOrderByCreatedAtDesc();
        }
    }
    
    /**
     * 获取教师的教学大纲历史记录
     */
    public List<TeachingOutline> getTeacherOutlineHistory(Long teacherId, Long courseId) {
        if (courseId != null) {
            // 验证课程是否属于该教师
            Course course = courseRepository.findById(courseId)
                    .orElseThrow(() -> new RuntimeException("课程不存在"));
            if (!course.getTeacher().getId().equals(teacherId)) {
                throw new RuntimeException("无权访问该课程的教学大纲");
            }
            return outlineRepository.findByCourseIdOrderByCreatedAtDesc(courseId);
        } else {
            // 获取该教师所有课程的教学大纲
            return outlineRepository.findByTeacherIdOrderByCreatedAtDesc(teacherId);
        }
    }
    
    /**
     * 删除教学大纲（带权限验证）
     */
    public void deleteTeachingOutline(Long teacherId, Long outlineId) {
        TeachingOutline outline = outlineRepository.findById(outlineId)
                .orElseThrow(() -> new RuntimeException("教学大纲不存在"));
        
        // 验证大纲所属课程是否属于该教师
        if (!outline.getCourse().getTeacher().getId().equals(teacherId)) {
            throw new RuntimeException("无权删除该教学大纲");
        }
        
        outlineRepository.deleteById(outlineId);
    }
    
    /**
     * 删除教师账户及所有相关数据
     */
    @Transactional
    public void deleteTeacherAccount(Long teacherId, String password) {
        Teacher teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("教师不存在"));
        
        User user = teacher.getUser();
        if (user == null) {
            throw new RuntimeException("用户信息不存在");
        }
        
        // 验证密码
        if (!verifyPassword(password, user.getPassword())) {
            throw new RuntimeException("密码验证失败");
        }
        
        // 获取教师的所有课程
        List<Course> courses = courseRepository.findByTeacherOrderByUpdatedAtDesc(teacher);
        
        // 删除所有相关数据
        for (Course course : courses) {
            // 删除课程相关的教学大纲
            outlineRepository.deleteByCourseId(course.getId());
            
            // 删除课程资料
            materialRepository.deleteByCourseId(course.getId());
            
            // 删除课程通知
            noticeRepository.deleteByCourseId(course.getId());
            
            // 删除课程考试及相关数据
            List<Exam> exams = examRepository.findByCourseIdOrderByCreatedAtDesc(course.getId());
            for (Exam exam : exams) {
                // 这里可能需要删除考试结果等相关数据
                // examResultRepository.deleteByExamId(exam.getId());
            }
            examRepository.deleteByCourseId(course.getId());
        }
        
        // 删除所有课程
        courseRepository.deleteByTeacher(teacher);
        
        // 删除教师信息
        teacherRepository.delete(teacher);
        
        // 最后删除用户账户
        userRepository.delete(user);
        
        System.out.println("已成功删除教师账户及所有相关数据: " + user.getUsername());
    }
    
    /**
     * 根据ID获取课程
     */
    public Course getCourseById(Long courseId) {
        return courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("课程不存在"));
    }
    
    /**
     * 获取教师的所有课程资料
     */
    public List<CourseMaterial> getAllTeacherMaterials(Long teacherId) {
        // 先获取教师的所有课程
        Teacher teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("教师不存在"));
        List<Course> courses = courseRepository.findByTeacherOrderByUpdatedAtDesc(teacher);
        if (courses.isEmpty()) {
            return new java.util.ArrayList<>();
        }
        
        // 获取所有课程的资料
        List<CourseMaterial> allMaterials = new java.util.ArrayList<>();
        for (Course course : courses) {
            List<CourseMaterial> materials = materialRepository.findByCourseIdOrderByUploadedAtDesc(course.getId());
            allMaterials.addAll(materials);
        }
        
        return allMaterials;
    }
    
    /**
     * 获取教学大纲
     */
    public TeachingOutline getTeachingOutline(Long courseId) {
        Optional<TeachingOutline> outline = outlineRepository.findByCourseId(courseId);
        return outline.orElse(null);
    }
    
    /**
     * 根据ID获取课程资料
     */
    public CourseMaterial getMaterialById(Long materialId) {
        return materialRepository.findById(materialId)
                .orElseThrow(() -> new RuntimeException("资料不存在"));
    }
    
    /**
     * 删除课程资料
     */
    public void deleteMaterial(Long materialId) {
        if (!materialRepository.existsById(materialId)) {
            throw new RuntimeException("资料不存在");
        }
        materialRepository.deleteById(materialId);
    }
    
    /**
     * 根据选定的资料生成教学大纲
     */
    public TeachingOutline generateOutlineWithMaterials(Long courseId, List<Integer> materialIds, String requirements, Integer hours) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("课程不存在"));
        
        // 获取选定的课程资料
        StringBuilder contentBuilder = new StringBuilder();
        for (Integer materialId : materialIds) {
            Optional<CourseMaterial> materialOpt = materialRepository.findById(materialId.longValue());
            if (materialOpt.isPresent() && materialOpt.get().getContent() != null) {
                contentBuilder.append(materialOpt.get().getContent()).append("\n\n");
            }
        }
        
        if (contentBuilder.length() == 0) {
            throw new RuntimeException("选定的资料中没有可用的内容");
        }
        
        // 构建生成请求
        String prompt = String.format("课程名称：%s\n学时：%d\n特殊要求：%s\n\n课程资料内容：\n%s", 
                course.getName(), hours, requirements, contentBuilder.toString());
        
        // 调用DeepSeek生成教学大纲
        String outlineContent = deepSeekService.generateTeachingOutlineWithHours(course.getName(), contentBuilder.toString(), requirements, hours);
        
        // 总是创建新的教学大纲，不覆盖现有记录
        TeachingOutline outline = new TeachingOutline();
        outline.setCourse(course);
        outline.setTeachingDesign(outlineContent);
        outline.setHours(hours); // 保存学时信息
        
        System.out.println("开始创建新的教学大纲，课程ID: " + courseId + ", 课程名: " + course.getName());
        
        TeachingOutline saved = outlineRepository.save(outline);
        System.out.println("创建教学大纲成功，ID: " + saved.getId());
        // 确保Course被正确加载以避免懒加载问题
        saved.getCourse().getName(); // 触发加载
        return saved;
    }
    
    /**
     * 重新生成教学大纲（更新当前显示的大纲）
     */
    public TeachingOutline regenerateOutlineWithMaterials(Long outlineId, Long courseId, List<Integer> materialIds, String requirements, Integer hours) {
        // 验证大纲是否存在
        TeachingOutline existingOutline = outlineRepository.findById(outlineId)
                .orElseThrow(() -> new RuntimeException("教学大纲不存在"));
        
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("课程不存在"));
        
        // 获取选定的课程资料
        StringBuilder contentBuilder = new StringBuilder();
        for (Integer materialId : materialIds) {
            Optional<CourseMaterial> materialOpt = materialRepository.findById(materialId.longValue());
            if (materialOpt.isPresent() && materialOpt.get().getContent() != null) {
                contentBuilder.append(materialOpt.get().getContent()).append("\n\n");
            }
        }
        
        if (contentBuilder.length() == 0) {
            throw new RuntimeException("选定的资料中没有可用的内容");
        }
        
        // 构建生成请求
        String prompt = String.format("课程名称：%s\n学时：%d\n特殊要求：%s\n\n课程资料内容：\n%s", 
                course.getName(), hours, requirements, contentBuilder.toString());
        
        // 调用DeepSeek重新生成教学大纲
        String outlineContent = deepSeekService.generateTeachingOutlineWithHours(course.getName(), contentBuilder.toString(), requirements, hours);
        
        System.out.println("开始更新教学大纲，ID: " + outlineId + ", 课程: " + course.getName());
        
        // 更新现有大纲
        existingOutline.setTeachingDesign(outlineContent);
        existingOutline.setHours(hours); // 更新学时信息
        existingOutline.setUpdatedAt(LocalDateTime.now());
        
        TeachingOutline saved = outlineRepository.save(existingOutline);
        System.out.println("更新教学大纲成功，ID: " + saved.getId());
        // 确保Course被正确加载以避免懒加载问题
        saved.getCourse().getName(); // 触发加载
        return saved;
    }
    
    /**
     * 密码加密（与UserService保持一致）
     */
    private String hashPassword(String password) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            String saltedPassword = password + SALT;
            byte[] hashedBytes = md.digest(saltedPassword.getBytes());
            return Base64.getEncoder().encodeToString(hashedBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("密码加密失败", e);
        }
    }
    
    /**
     * 密码验证（与UserService保持一致）
     */
    private boolean verifyPassword(String plainPassword, String hashedPassword) {
        return hashPassword(plainPassword).equals(hashedPassword);
    }
} 