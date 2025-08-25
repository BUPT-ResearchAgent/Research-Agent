package com.example.smartedu.service;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.example.smartedu.entity.Course;
import com.example.smartedu.entity.CourseMaterial;
import com.example.smartedu.entity.Exam;
import com.example.smartedu.entity.ExamResult;
import com.example.smartedu.entity.Notice;
import com.example.smartedu.entity.Question;
import com.example.smartedu.entity.StudentAnswer;
import com.example.smartedu.entity.StudentCourse;
import com.example.smartedu.entity.Teacher;
import com.example.smartedu.entity.TeachingOutline;
import com.example.smartedu.entity.User;
import com.example.smartedu.repository.CourseMaterialRepository;
import com.example.smartedu.repository.CourseRepository;
import com.example.smartedu.repository.ExamRepository;
import com.example.smartedu.repository.ExamResultRepository;
import com.example.smartedu.repository.NoticeRepository;
import com.example.smartedu.repository.QuestionRepository;
import com.example.smartedu.repository.StudentAnswerRepository;
import com.example.smartedu.repository.StudentCourseRepository;
import com.example.smartedu.repository.TeacherRepository;
import com.example.smartedu.repository.TeachingOutlineRepository;
import com.example.smartedu.repository.UserRepository;

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
    private PriorityPolicyService priorityPolicyService;
    
    @Autowired
    private DeepSeekService deepSeekService;
    
    @Autowired
    private OnlineUserService onlineUserService;
    
    @Autowired
    private StudentCourseRepository studentCourseRepository;
    
    @Autowired
    private KnowledgeBaseService knowledgeBaseService;
    
    @Autowired
    private VectorDatabaseService vectorDatabaseService;
    
    @Autowired
    private ExamResultRepository examResultRepository;
    
    @Autowired
    private QuestionRepository questionRepository;
    
    @Autowired
    private StudentAnswerRepository studentAnswerRepository;
    
    @Autowired
    private StudentAnalysisService studentAnalysisService;
    
    @Autowired
    private CourseTypeDetectionService courseTypeDetectionService;

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
    public Notice publishNotice(Long teacherId, String title, String content, String targetType, 
                               Long courseId, String priority, String pushTime, LocalDateTime scheduledTime) {
        Teacher teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("教师不存在"));
        
        // 验证必须选择课程
        if (courseId == null) {
            throw new RuntimeException("必须选择课程");
        }
        
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("课程不存在"));
        
        // 验证教师是否有权限发布该课程的通知
        if (!course.getTeacher().getId().equals(teacherId)) {
            throw new RuntimeException("您没有权限向该课程发布通知");
        }
        
        Notice notice = new Notice(title, content, course, teacher, "COURSE");
        
        notice.setPriority(priority != null ? priority : "NORMAL");
        notice.setPushTime(pushTime != null ? pushTime : "now");
        
        if ("scheduled".equals(pushTime)) {
            if (scheduledTime == null) {
                throw new RuntimeException("定时推送时必须设置推送时间");
            }
            if (scheduledTime.isBefore(LocalDateTime.now())) {
                throw new RuntimeException("推送时间不能早于当前时间");
            }
            notice.setScheduledTime(scheduledTime);
        }
        
        return noticeRepository.save(notice);
    }
    
    /**
     * 更新通知
     */
    public Notice updateNotice(Long teacherId, Long noticeId, String title, String content, 
                              String targetType, Long courseId, String pushTime, LocalDateTime scheduledTime) {
        // 查找通知并验证权限
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new RuntimeException("通知不存在"));
        
        if (!notice.getTeacherId().equals(teacherId)) {
            throw new RuntimeException("您没有权限修改此通知");
        }
        
        // 检查通知状态，只允许修改未推送的通知
        boolean isScheduled = "scheduled".equals(notice.getPushTime()) && notice.getScheduledTime() != null;
        boolean isPending = isScheduled && notice.getScheduledTime().isAfter(LocalDateTime.now());
        
        if (!isPending && !"scheduled".equals(notice.getPushTime())) {
            throw new RuntimeException("只能修改待推送的通知");
        }
        
        // 验证课程是否存在且属于该教师
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("课程不存在"));
        
        if (!course.getTeacher().getId().equals(teacherId)) {
            throw new RuntimeException("您没有权限向此课程发送通知");
        }
        
        // 更新通知信息
        notice.setTitle(title);
        notice.setContent(content);
        notice.setTargetType(targetType);
        notice.setCourse(course);
        notice.setCourseId(courseId);
        notice.setPushTime(pushTime);
        notice.setUpdatedAt(LocalDateTime.now());
        
        // 处理定时推送
        if ("scheduled".equals(pushTime)) {
            if (scheduledTime == null) {
                throw new RuntimeException("定时推送必须指定推送时间");
            }
            if (scheduledTime.isBefore(LocalDateTime.now())) {
                throw new RuntimeException("推送时间不能早于当前时间");
            }
            notice.setScheduledTime(scheduledTime);
        } else {
            notice.setScheduledTime(null);
        }
        
        return noticeRepository.save(notice);
    }
    
    /**
     * 获取教师发布的通知列表
     */
    public List<Notice> getTeacherNotices(Long teacherId) {
        return noticeRepository.findByTeacherIdOrderByCreatedAtDesc(teacherId);
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
        
        // 保存课程
        course = courseRepository.save(course);
        
        // 异步添加重点政策文档到新课程
        try {
            priorityPolicyService.addPriorityPolicyDocumentsToCourse(course.getId());
            System.out.println("✅ 新课程 " + course.getName() + " (ID: " + course.getId() + ") 已自动添加重点政策文档");
        } catch (Exception e) {
            System.err.println("⚠️ 为新课程添加重点政策文档失败: " + e.getMessage());
            // 不影响课程创建，继续执行
        }
        
        return course;
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
     * 根据知识库生成教学大纲（使用RAG技术）
     */
    public TeachingOutline generateOutlineWithKnowledgeBase(Long courseId, String requirements, Integer hours) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("课程不存在"));
        
        // 先检查课程是否有知识库数据
        KnowledgeBaseService.KnowledgeStats stats = knowledgeBaseService.getKnowledgeStats(courseId);
        if (stats.getTotalChunks() == 0) {
            throw new RuntimeException("该课程还没有知识库数据，请先在「构建课程知识库」中上传课程资料");
        }
        
        if (stats.getProcessedChunks() == 0) {
            throw new RuntimeException("该课程的知识库数据正在处理中，请稍后再试");
        }
        
        System.out.println("课程 " + courseId + " 知识库检查通过: 总块数=" + stats.getTotalChunks() + 
                          ", 已处理=" + stats.getProcessedChunks());

        // 测试向量数据库连接和集合状态
        vectorDatabaseService.testConnectionAndCollection(courseId);

        // 构建查询问题，包含课程信息和教学要求
        String queryText = buildOutlineQuery(course.getName(), requirements, hours);
        
        System.out.println("开始RAG搜索，查询内容: " + queryText);
        
        // 使用RAG技术搜索相关知识块
        List<VectorDatabaseService.SearchResult> searchResults = 
            knowledgeBaseService.searchKnowledge(courseId, queryText, 5); // 搜索top 5相关内容
        
        if (searchResults.isEmpty()) {
            throw new RuntimeException("无法从知识库中检索到与教学要求相关的内容，请调整要求或检查知识库数据");
        }
        
        System.out.println("RAG搜索完成，找到 " + searchResults.size() + " 个相关知识块");
        
        // 提取匹配的内容
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
        
        // 调用DeepSeek生成教学大纲（区分课程内容和政策指导）
        String outlineContent = deepSeekService.generateTeachingOutlineWithPolicyGuidance(
            course.getName(), searchResults, requirements, hours);
        
        // 总是创建新的教学大纲，不覆盖现有记录
        TeachingOutline outline = new TeachingOutline();
        outline.setCourse(course);
        outline.setTeachingDesign(outlineContent);
        outline.setHours(hours); // 保存学时信息
        
        System.out.println("开始创建新的教学大纲（基于知识库RAG），课程ID: " + courseId + ", 课程名: " + course.getName());
        
        TeachingOutline saved = outlineRepository.save(outline);
        System.out.println("知识库RAG教学大纲生成成功，ID: " + saved.getId());
        // 确保Course被正确加载以避免懒加载问题
        saved.getCourse().getName(); // 触发加载
        return saved;
    }
    
    /**
     * 获取备用知识块（当向量搜索失败时使用）
     */
    private List<VectorDatabaseService.SearchResult> getFallbackKnowledgeChunks(Long courseId, int limit) {
        try {
            List<Map<String, Object>> chunks = knowledgeBaseService.getKnowledgeChunks(courseId);
            List<VectorDatabaseService.SearchResult> results = new ArrayList<>();
            
            int count = Math.min(limit, chunks.size());
            for (int i = 0; i < count; i++) {
                Map<String, Object> chunk = chunks.get(i);
                VectorDatabaseService.SearchResult result = new VectorDatabaseService.SearchResult();
                result.setChunkId((String) chunk.get("chunkId"));
                result.setContent((String) chunk.get("content"));
                result.setCourseId(courseId);
                result.setScore(0.0f); // 备用方案没有相似度分数
                results.add(result);
            }
            
            System.out.println("使用备用方案获取了 " + results.size() + " 个知识块");
            return results;
        } catch (Exception e) {
            System.err.println("获取备用知识块失败: " + e.getMessage());
            return new ArrayList<>();
        }
    }
    
    /**
     * 构建大纲生成的查询问题
     */
    private String buildOutlineQuery(String courseName, String requirements, Integer hours) {
        StringBuilder query = new StringBuilder();
        
        // 基本查询内容
        query.append(courseName).append(" 教学大纲 课程设计");
        
        // 添加学时信息
        if (hours != null && hours > 0) {
            query.append(" ").append(hours).append("学时");
        }
        
        // 添加特殊要求
        if (requirements != null && !requirements.trim().isEmpty()) {
            query.append(" ").append(requirements);
        }
        
        // 添加相关教学术语
        query.append(" 教学目标 教学重点 教学难点 教学方法 教学设计 课程内容");
        
        return query.toString();
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

    // 保留原有方法以兼容现有API调用
    /**
     * 根据选定的资料生成教学大纲（使用RAG技术）
     * @deprecated 推荐使用 generateOutlineWithKnowledgeBase 方法
     */
    @Deprecated
    public TeachingOutline generateOutlineWithMaterials(Long courseId, List<Integer> materialIds, String requirements, Integer hours) {
        // 直接调用新的知识库方法，忽略materialIds参数
        return generateOutlineWithKnowledgeBase(courseId, requirements, hours);
    }

    /**
     * 重新生成教学大纲（更新当前显示的大纲，使用RAG技术）
     * @deprecated 推荐使用 regenerateOutlineWithKnowledgeBase 方法
     */
    @Deprecated
    public TeachingOutline regenerateOutlineWithMaterials(Long outlineId, Long courseId, List<Integer> materialIds, String requirements, Integer hours) {
        // 直接调用新的知识库方法，忽略materialIds参数
        return regenerateOutlineWithKnowledgeBase(outlineId, courseId, requirements, hours);
    }

    /**
     * 重新生成教学大纲（更新当前显示的大纲，使用知识库RAG技术）
     */
    public TeachingOutline regenerateOutlineWithKnowledgeBase(Long outlineId, Long courseId, String requirements, Integer hours) {
        // 验证大纲是否存在
        TeachingOutline existingOutline = outlineRepository.findById(outlineId)
                .orElseThrow(() -> new RuntimeException("教学大纲不存在"));
        
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("课程不存在"));
        
        // 先检查课程是否有知识库数据
        KnowledgeBaseService.KnowledgeStats stats = knowledgeBaseService.getKnowledgeStats(courseId);
        if (stats.getTotalChunks() == 0) {
            throw new RuntimeException("该课程还没有知识库数据，请先在「构建课程知识库」中上传课程资料");
        }
        
        if (stats.getProcessedChunks() == 0) {
            throw new RuntimeException("该课程的知识库数据正在处理中，请稍后再试");
        }
        
        // 构建查询问题，包含课程信息和教学要求
        String queryText = buildOutlineQuery(course.getName(), requirements, hours);
        
        System.out.println("开始RAG重新搜索，查询内容: " + queryText);
        
        // 使用RAG技术搜索相关知识块
        List<VectorDatabaseService.SearchResult> searchResults = 
            knowledgeBaseService.searchKnowledge(courseId, queryText, 10); // 搜索top 10相关内容
        
        if (searchResults.isEmpty()) {
            // 如果RAG搜索没有结果，可能是向量数据库的问题，尝试重建集合
            System.out.println("向量搜索无结果，可能是字段名称问题，尝试重建向量集合");
            boolean rebuilt = vectorDatabaseService.rebuildCollectionForCourse(courseId);
            
            if (rebuilt) {
                // 重建成功后，需要重新导入知识库数据
                System.out.println("向量集合重建成功，需要重新导入知识库数据");
                knowledgeBaseService.reimportCourseKnowledge(courseId);
                
                // 再次尝试搜索
                searchResults = knowledgeBaseService.searchKnowledge(courseId, queryText, 10);
            }
            
            if (searchResults.isEmpty()) {
                // 如果仍然没有结果，使用备用方案
                System.out.println("重建后仍无搜索结果，使用数据库中的知识块");
                searchResults = getFallbackKnowledgeChunks(courseId, 5);
                
                if (searchResults.isEmpty()) {
                    throw new RuntimeException("无法从知识库中检索到相关内容，请检查知识库数据是否正常");
                }
            }
        }
        
        System.out.println("RAG重新搜索完成，找到 " + searchResults.size() + " 个相关知识块");
        
        // 提取匹配的内容
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
        
        // 调用DeepSeek重新生成教学大纲（区分课程内容和政策指导）
        String outlineContent = deepSeekService.generateTeachingOutlineWithPolicyGuidance(
            course.getName(), searchResults, requirements, hours);
        
        System.out.println("开始更新教学大纲（基于知识库RAG），ID: " + outlineId + ", 课程: " + course.getName());
        
        // 更新现有大纲
        existingOutline.setTeachingDesign(outlineContent);
        existingOutline.setHours(hours); // 更新学时信息
        existingOutline.setUpdatedAt(LocalDateTime.now());
        
        TeachingOutline saved = outlineRepository.save(existingOutline);
        System.out.println("知识库RAG教学大纲更新成功，ID: " + saved.getId());
        // 确保Course被正确加载以避免懒加载问题
        saved.getCourse().getName(); // 触发加载
        return saved;
    }

    /**
     * 生成教学改进建议
     */
    public String generateTeachingImprovements(String scope, Long courseId) {
        try {
            System.out.println("开始生成教学改进建议，范围: " + scope + ", 课程ID: " + courseId);
            
            // 根据范围收集数据
            List<Course> coursesToAnalyze = new ArrayList<>();
            if ("COURSE".equals(scope) && courseId != null) {
                // 单个课程分析
                Course course = courseRepository.findById(courseId)
                    .orElseThrow(() -> new RuntimeException("课程不存在"));
                coursesToAnalyze.add(course);
            } else if ("SEMESTER".equals(scope) || "YEAR".equals(scope)) {
                // 本学期或本学年分析 - 获取当前教师的所有课程
                coursesToAnalyze = courseRepository.findAll().stream()
                    .filter(course -> course.getTeacher() != null)
                    .collect(Collectors.toList());
            }
            
            if (coursesToAnalyze.isEmpty()) {
                return "暂无课程数据可供分析，请先创建课程并进行考试。";
            }
            
            // 检查课程是否有考试和成绩数据
            boolean hasExamData = false;
            for (Course course : coursesToAnalyze) {
                List<Exam> exams = examRepository.findByCourseId(course.getId());
                if (!exams.isEmpty()) {
                    for (Exam exam : exams) {
                        List<ExamResult> results = examResultRepository.findByExamId(exam.getId());
                        if (!results.isEmpty()) {
                            hasExamData = true;
                            break;
                        }
                    }
                }
                if (hasExamData) break;
            }
            
            if (!hasExamData) {
                return "暂无考试数据可供分析。\n\n**建议：**\n1. 先创建考试并让学生参加\n2. 学生答题后才能生成基于数据的改进建议\n3. 或者您可以先查看课程的基本教学建议";
            }
            
            // 收集考试和成绩数据
            StringBuilder analysisData = new StringBuilder();
            int totalExams = 0;
            int totalStudents = 0;
            Map<String, List<Double>> courseScores = new HashMap<>();
            Map<String, Map<String, Integer>> difficultyStats = new HashMap<>();
            List<Map<String, Object>> examAnalysisData = new ArrayList<>();
            
            for (Course course : coursesToAnalyze) {
                List<Exam> exams = examRepository.findByCourseId(course.getId());
                if (exams.isEmpty()) continue;
                
                analysisData.append("\n**课程：").append(course.getName())
                    .append("（").append(course.getCourseCode()).append("）**\n");
                
                List<Double> allScores = new ArrayList<>();
                Map<String, Integer> difficultyCount = new HashMap<>();
                
                for (Exam exam : exams) {
                    List<ExamResult> results = examResultRepository.findByExamId(exam.getId());
                    if (results.isEmpty()) continue;
                    
                    totalExams++;
                    totalStudents += results.size();
                    
                    // 统计本次考试成绩
                    List<Double> examScores = results.stream()
                        .map(r -> {
                            if (r.getFinalScore() != null) {
                                return r.getFinalScore();
                            } else if (r.getScore() != null) {
                                return r.getScore().doubleValue();
                            } else {
                                return 0.0;
                            }
                        })
                        .collect(Collectors.toList());
                    allScores.addAll(examScores);
                    
                    double avgScore = examScores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
                    double maxScore = examScores.stream().mapToDouble(Double::doubleValue).max().orElse(0.0);
                    double minScore = examScores.stream().mapToDouble(Double::doubleValue).min().orElse(0.0);
                    
                    analysisData.append("- 考试：").append(exam.getTitle())
                        .append("\n  参考人数：").append(results.size())
                        .append("\n  平均分：").append(String.format("%.2f", avgScore))
                        .append("\n  最高分：").append(String.format("%.2f", maxScore))
                        .append("\n  最低分：").append(String.format("%.2f", minScore));
                    
                    // 收集详细的错题分析数据
                    Map<String, Object> examData = collectDetailedExamAnalysis(exam, results);
                    if (examData != null) {
                        examAnalysisData.add(examData);
                    }
                    
                    // 分析题目难度分布
                    List<Question> questions = questionRepository.findByExamId(exam.getId());
                    for (Question question : questions) {
                        List<StudentAnswer> answers = studentAnswerRepository.findByQuestionId(question.getId());
                        if (!answers.isEmpty()) {
                            double correctRate = answers.stream()
                                .mapToDouble(ans -> {
                                    if (ans.getScore() == null || question.getScore() == null || question.getScore() == 0) return 0.0;
                                    return ans.getScore().doubleValue() / question.getScore();
                                })
                                .average().orElse(0.0);
                            
                            String difficulty;
                            if (correctRate >= 0.8) difficulty = "简单";
                            else if (correctRate >= 0.6) difficulty = "中等";
                            else difficulty = "困难";
                            
                            difficultyCount.put(difficulty, difficultyCount.getOrDefault(difficulty, 0) + 1);
                        }
                    }
                    
                    analysisData.append("\n");
                }
                
                courseScores.put(course.getName(), allScores);
                difficultyStats.put(course.getName(), difficultyCount);
                
                if (!allScores.isEmpty()) {
                    double courseAvg = allScores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
                    analysisData.append("课程总体平均分：").append(String.format("%.2f", courseAvg)).append("\n");
                }
            }
            
            // 调用DeepSeek生成改进建议（使用多轮对话）
            return deepSeekService.generateTeachingImprovementsWithDetailedAnalysis(
                scope, analysisData.toString(), totalExams, totalStudents, 
                courseScores, difficultyStats, examAnalysisData);
                
        } catch (Exception e) {
            System.err.println("生成教学改进建议失败: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("生成教学改进建议失败：" + e.getMessage());
        }
    }
    
    /**
     * 收集详细的考试分析数据
     */
    private Map<String, Object> collectDetailedExamAnalysis(Exam exam, List<ExamResult> results) {
        try {
            Map<String, Object> examData = new HashMap<>();
            examData.put("examTitle", exam.getTitle());
            examData.put("courseName", exam.getCourse().getName());
            examData.put("studentCount", results.size());
            
            // 获取考试题目
            List<Question> questions = questionRepository.findByExamId(exam.getId());
            if (questions.isEmpty()) return null;
            
            List<Map<String, Object>> questionAnalysis = new ArrayList<>();
            
            for (Question question : questions) {
                Map<String, Object> questionData = new HashMap<>();
                questionData.put("questionContent", question.getContent());
                questionData.put("questionType", question.getType());
                questionData.put("maxScore", question.getScore() != null ? question.getScore() : 0);
                questionData.put("standardAnswer", question.getAnswer());
                questionData.put("explanation", question.getExplanation());
                
                // 获取学生答案
                List<StudentAnswer> studentAnswers = studentAnswerRepository.findByQuestionId(question.getId());
                
                if (!studentAnswers.isEmpty()) {
                    // 统计答题情况
                    int totalAnswers = studentAnswers.size();
                    int correctCount = 0;
                    double totalScore = 0;
                    List<Map<String, Object>> wrongAnswers = new ArrayList<>();
                    Map<String, Integer> answerDistribution = new HashMap<>();
                    
                    for (StudentAnswer answer : studentAnswers) {
                        double score = answer.getScore() != null ? answer.getScore() : 0;
                        totalScore += score;
                        
                                                 String studentAnswerText = answer.getAnswer();
                         if (studentAnswerText != null && !studentAnswerText.trim().isEmpty()) {
                             answerDistribution.put(studentAnswerText, 
                                 answerDistribution.getOrDefault(studentAnswerText, 0) + 1);
                         }
                         
                         // 判断是否正确（得分率>=80%视为正确）
                         Integer questionScore = question.getScore();
                         if (questionScore != null && questionScore > 0 && score >= questionScore * 0.8) {
                             correctCount++;
                         } else {
                             // 收集错误答案
                             Map<String, Object> wrongAnswer = new HashMap<>();
                             wrongAnswer.put("studentAnswer", studentAnswerText);
                            wrongAnswer.put("score", score);
                            wrongAnswer.put("maxScore", questionScore != null ? questionScore : 0);
                            wrongAnswers.add(wrongAnswer);
                        }
                    }
                    
                    double correctRate = (double) correctCount / totalAnswers;
                    double avgScore = totalScore / totalAnswers;
                    
                    questionData.put("totalAnswers", totalAnswers);
                    questionData.put("correctCount", correctCount);
                    questionData.put("correctRate", correctRate);
                    questionData.put("avgScore", avgScore);
                    questionData.put("wrongAnswers", wrongAnswers);
                    questionData.put("answerDistribution", answerDistribution);
                    
                    // 只收集正确率较低的题目（<70%）进行详细分析
                    if (correctRate < 0.7) {
                        questionAnalysis.add(questionData);
                    }
                }
            }
            
            examData.put("questionAnalysis", questionAnalysis);
            
            // 只有存在错题分析时才返回数据
            return questionAnalysis.isEmpty() ? null : examData;
            
        } catch (Exception e) {
            System.err.println("收集考试分析数据失败: " + e.getMessage());
            return null;
        }
    }
    
    /**
     * 智能生成个性化教学大纲（基于学生分类、课程类型和实时热点）
     * 
     * @param courseId 课程ID
     * @param requirements 教学要求
     * @param hours 教学学时
     * @param className 班级名称（可选，用于学生分析）
     * @param enableHotTopics 是否考虑实时热点
     * @return 个性化教学大纲
     */
    public TeachingOutline generatePersonalizedOutline(Long courseId, String requirements, Integer hours, 
                                                     String className, Boolean enableHotTopics) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("课程不存在"));
        
        System.out.println("开始生成个性化教学大纲 - 课程: " + course.getName() + 
                          ", 班级: " + (className != null ? className : "全部") + 
                          ", 学时: " + hours + 
                          ", 启用热点: " + enableHotTopics);
        
        // 1. 学生分析和分类
        StudentAnalysisService.StudentClassificationResult studentAnalysis = 
            studentAnalysisService.analyzeStudentsForCourse(courseId, className);
        
        // 2. 课程类型检测
        CourseTypeDetectionService.CourseTypeResult courseTypeResult = 
            courseTypeDetectionService.detectCourseType(courseId);
        
        // 3. 获取实时热点（如果启用）
        String hotTopicsContent = "";
        if (enableHotTopics != null && enableHotTopics) {
            hotTopicsContent = generateHotTopicsContent(course.getName(), courseTypeResult.getFinalType());
        }
        
        // 4. 基于知识库获取课程内容
        String ragContent = getKnowledgeBaseContent(courseId, requirements, hours);
        
        // 5. 调用AI生成个性化教学大纲
        String outlineContent = deepSeekService.generatePersonalizedOutline(
            course.getName(), 
            courseTypeResult,
            studentAnalysis,
            ragContent,
            hotTopicsContent,
            requirements,
            hours
        );
        
        // 6. 保存教学大纲
        TeachingOutline outline = new TeachingOutline();
        outline.setCourse(course);
        outline.setTeachingDesign(outlineContent);
        outline.setHours(hours);
        
        TeachingOutline saved = outlineRepository.save(outline);
        System.out.println("个性化教学大纲生成成功，ID: " + saved.getId());
        
        // 确保Course被正确加载
        saved.getCourse().getName();
        return saved;
    }
    
    /**
     * 获取实时热点内容
     */
    private String generateHotTopicsContent(String courseName, String courseType) {
        try {
            System.out.println("正在获取 " + courseName + " 相关的实时热点...");
            
            // 构建热点查询
            String hotTopicsQuery = buildHotTopicsQuery(courseName, courseType);
            
            // 调用AI获取热点内容
            String hotTopics = deepSeekService.generateHotTopicsContent(courseName, courseType, hotTopicsQuery);
            
            return hotTopics;
        } catch (Exception e) {
            System.err.println("获取实时热点失败: " + e.getMessage());
            return ""; // 热点获取失败不影响主流程
        }
    }
    
    /**
     * 构建热点查询内容
     */
    private String buildHotTopicsQuery(String courseName, String courseType) {
        StringBuilder query = new StringBuilder();
        
        // 根据课程类型构建不同的热点查询
        switch (courseType) {
            case "实践课":
                query.append("最新技术趋势 前沿应用 行业发展 实践案例 ");
                break;
            case "理论课":
                query.append("学术前沿 理论发展 研究热点 新观点 ");
                break;
            default:
                query.append("行业动态 技术发展 学术研究 应用案例 ");
        }
        
        // 添加课程相关关键词
        query.append(courseName).append(" ");
        
        // 添加时效性关键词
        query.append("2024 最新 当前 热点 趋势");
        
        return query.toString();
    }
    
    /**
     * 获取基于知识库的课程内容
     */
    private String getKnowledgeBaseContent(Long courseId, String requirements, Integer hours) {
        try {
            // 检查知识库状态
            KnowledgeBaseService.KnowledgeStats stats = knowledgeBaseService.getKnowledgeStats(courseId);
            if (stats.getTotalChunks() == 0) {
                return "该课程暂无知识库内容";
            }
            
            // 构建查询
            String queryText = buildOutlineQuery(courseRepository.findById(courseId).get().getName(), requirements, hours);
            
            // 使用RAG搜索
            List<VectorDatabaseService.SearchResult> searchResults = 
                knowledgeBaseService.searchKnowledge(courseId, queryText, 8);
            
            if (searchResults.isEmpty()) {
                searchResults = getFallbackKnowledgeChunks(courseId, 5);
            }
            
            // 整理内容
            StringBuilder content = new StringBuilder();
            for (int i = 0; i < searchResults.size(); i++) {
                VectorDatabaseService.SearchResult result = searchResults.get(i);
                content.append("【知识块").append(i + 1).append("】\n");
                content.append(result.getContent()).append("\n\n");
            }
            
            return content.toString();
        } catch (Exception e) {
            System.err.println("获取知识库内容失败: " + e.getMessage());
            return "知识库内容获取失败";
        }
    }
} 