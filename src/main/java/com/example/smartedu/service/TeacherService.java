package com.example.smartedu.service;

import com.example.smartedu.dto.ExamGenerationRequest;
import com.example.smartedu.entity.*;
import com.example.smartedu.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
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
    private FileService fileService;
    
    @Autowired
    private DeepSeekService deepSeekService;
    
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
        String outlineContent = deepSeekService.generateTeachingOutline(course.getName(), prompt);
        
        // 创建或更新教学大纲
        TeachingOutline outline = new TeachingOutline();
        outline.setCourse(course);
        outline.setTeachingDesign(outlineContent);
        
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
} 