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
     * 获取教师的课程列表
     */
    public List<Course> getTeacherCourses(Long teacherId) {
        return courseRepository.findByTeacherIdOrderByUpdatedAtDesc(teacherId);
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
        List<Course> courses = courseRepository.findByTeacherIdOrderByUpdatedAtDesc(teacherId);
        if (courses.isEmpty()) {
            return new java.util.ArrayList<>();
        }
        
        // 获取这些课程的所有资料
        List<Long> courseIds = courses.stream().map(Course::getId).collect(java.util.stream.Collectors.toList());
        return materialRepository.findByCourseIdInOrderByUploadedAtDesc(courseIds);
    }
    
    /**
     * 获取教学大纲
     */
    public TeachingOutline getTeachingOutline(Long courseId) {
        return outlineRepository.findByCourseId(courseId).orElse(null);
    }
    
    /**
     * 根据ID获取课程资料
     */
    public CourseMaterial getMaterialById(Long materialId) {
        return materialRepository.findById(materialId).orElse(null);
    }
    
    /**
     * 删除课程资料
     */
    public void deleteMaterial(Long materialId) {
        materialRepository.deleteById(materialId);
    }
    
    /**
     * 基于选中资料生成教学大纲
     */
    public TeachingOutline generateOutlineWithMaterials(Long courseId, List<Integer> materialIds, String requirements, Integer hours) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("课程不存在"));
        
        // 获取选中的资料内容
        StringBuilder contentBuilder = new StringBuilder();
        for (Integer materialId : materialIds) {
            Optional<CourseMaterial> materialOpt = materialRepository.findById(materialId.longValue());
            if (materialOpt.isPresent()) {
                CourseMaterial material = materialOpt.get();
                if (material.getContent() != null) {
                    contentBuilder.append("【").append(material.getOriginalName()).append("】\n");
                    contentBuilder.append(material.getContent()).append("\n\n");
                }
            }
        }
        
        if (contentBuilder.length() == 0) {
            throw new RuntimeException("选中的资料内容为空，无法生成教学大纲");
        }
        
        // 调用DeepSeek生成教学大纲（包含学时信息）
        String outlineContent = deepSeekService.generateTeachingOutlineWithHours(
            course.getName(), 
            contentBuilder.toString(), 
            requirements,
            hours
        );
        
        // 创建新的教学大纲版本（保留历史记录）
        TeachingOutline outline = new TeachingOutline();
        outline.setCourse(course);
        outline.setTeachingDesign(outlineContent);
        
        return outlineRepository.save(outline);
    }
} 