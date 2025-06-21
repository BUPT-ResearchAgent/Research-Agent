package com.example.smartedu.service;

import com.example.smartedu.entity.*;
import com.example.smartedu.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class CourseService {
    
    @Autowired
    private CourseRepository courseRepository;
    
    @Autowired
    private StudentRepository studentRepository;
    
    @Autowired
    private StudentCourseRepository studentCourseRepository;
    
    @Autowired
    private ExamRepository examRepository;

    @Autowired
    private ExamResultRepository examResultRepository;

    @Autowired
    private CourseMaterialRepository courseMaterialRepository;

    @Autowired
    private NoticeRepository noticeRepository;

    @Autowired
    private TeachingOutlineRepository teachingOutlineRepository;

    @Autowired
    private KnowledgeBaseService knowledgeBaseService;

    @PersistenceContext
    private EntityManager entityManager;
    
    /**
     * 学生加入课程
     */
    public void joinCourse(Long studentId, String courseCode) {
        // 查找学生
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("学生不存在"));
        
        // 查找课程
        Course course = courseRepository.findByCourseCode(courseCode);
        if (course == null) {
            throw new RuntimeException("课程不存在");
        }
        
        // 检查课程状态
        if (!"active".equals(course.getStatus())) {
            throw new RuntimeException("课程已关闭，无法加入");
        }
        
        // 检查是否已经加入（活跃状态）
        boolean alreadyJoined = studentCourseRepository.existsByStudentIdAndCourseIdAndStatus(
                studentId, course.getId(), "active");
        if (alreadyJoined) {
            throw new RuntimeException("您已经加入了这门课程");
        }
        
        // 检查课程容量
        if (course.getMaxStudents() != null && course.getCurrentStudents() >= course.getMaxStudents()) {
            throw new RuntimeException("课程已满员，无法加入");
        }
        
        // 检查是否存在已退出的记录
        Optional<StudentCourse> existingRecord = studentCourseRepository
                .findByStudentIdAndCourseId(studentId, course.getId());
        
        StudentCourse studentCourse;
        if (existingRecord.isPresent()) {
            // 如果存在记录，重新激活
            studentCourse = existingRecord.get();
            studentCourse.setStatus("active");
            studentCourse.setEnrollmentDate(LocalDateTime.now());
            studentCourse.setUpdatedAt(LocalDateTime.now());
        } else {
            // 如果不存在记录，创建新记录
            studentCourse = new StudentCourse(student, course);
        }
        
        studentCourseRepository.save(studentCourse);
        
        // 更新课程当前学生数
        course.setCurrentStudents(course.getCurrentStudents() + 1);
        course.setUpdatedAt(LocalDateTime.now());
        courseRepository.save(course);
    }
    
    /**
     * 根据课程号查找课程
     */
    public Course findByCourseCode(String courseCode) {
        return courseRepository.findByCourseCode(courseCode);
    }
    
    /**
     * 获取学生已加入的课程列表
     */
    public List<Course> getStudentCourses(Long studentId) {
        return studentCourseRepository.findCoursesByStudentIdAndStatus(studentId, "active");
    }
    
    /**
     * 获取所有可加入的课程
     */
    public List<Course> getAvailableCourses() {
        return courseRepository.findByStatus("active");
    }
    
    /**
     * 检查学生是否已加入课程
     */
    public boolean isStudentEnrolled(Long studentId, Long courseId) {
        return studentCourseRepository.existsByStudentIdAndCourseIdAndStatus(studentId, courseId, "active");
    }
    
    /**
     * 退出课程
     */
    public void dropCourse(Long studentId, Long courseId) {
        Optional<StudentCourse> studentCourseOpt = studentCourseRepository
                .findByStudentIdAndCourseId(studentId, courseId);
        
        if (!studentCourseOpt.isPresent()) {
            throw new RuntimeException("您未加入此课程");
        }
        
        StudentCourse studentCourse = studentCourseOpt.get();
        if (!"active".equals(studentCourse.getStatus())) {
            throw new RuntimeException("您已经退出了此课程");
        }
        
        // 更新状态为退出
        studentCourse.setStatus("dropped");
        studentCourse.setUpdatedAt(LocalDateTime.now());
        studentCourseRepository.save(studentCourse);
        
        // 更新课程当前学生数
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("课程不存在"));
        course.setCurrentStudents(Math.max(0, course.getCurrentStudents() - 1));
        course.setUpdatedAt(LocalDateTime.now());
        courseRepository.save(course);
    }
    
    /**
     * 获取课程的活跃学生数量
     */
    public long getActiveCourseStudentCount(Long courseId) {
        return studentCourseRepository.countByCourseIdAndStatus(courseId, "active");
    }
    
    /**
     * 获取课程的活跃学生列表
     */
    public List<Student> getCourseStudents(Long courseId) {
        return studentCourseRepository.findStudentsByCourseIdAndStatus(courseId, "active");
    }
    
    /**
     * 同步课程学生数量（用于数据修复）
     */
    public void syncCourseStudentCount(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("课程不存在"));
        
        long actualCount = getActiveCourseStudentCount(courseId);
        course.setCurrentStudents((int) actualCount);
        course.setUpdatedAt(LocalDateTime.now());
        courseRepository.save(course);
    }

    /**
     * 完整删除课程及其相关数据
     * 这个方法会删除课程的所有相关数据，包括：
     * - 学生选课记录
     * - 考试记录及考试结果
     * - 课程资料
     * - 通知
     * - 教学大纲
     * - 课程知识库（包括向量数据库和知识文档）
     * - 最后删除课程本身
     */
    @Transactional
    public void deleteCourseCompletely(Long courseId) {
        // 首先检查课程是否存在
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("课程不存在"));
        
        System.out.println("开始删除课程及相关数据，课程ID: " + courseId + ", 课程名: " + course.getName());
        
        try {
            // 第一步：查询并显示现有的学生选课记录
            List<StudentCourse> existingRecords = studentCourseRepository.findAllByCourseId(courseId);
            System.out.println("课程 " + courseId + " 当前有 " + existingRecords.size() + " 条学生选课记录");
            
                         // 第二步：删除学生选课记录，这是最关键的步骤
             System.out.println("开始删除学生选课记录（使用原生SQL，表名：STUDENT_COURSES）");
            studentCourseRepository.deleteByCourseIdNative(courseId);
            studentCourseRepository.flush(); // 强制刷新到数据库
            System.out.println("学生选课记录删除SQL执行完成");
            
            // 验证删除是否成功
            List<StudentCourse> remainingRecords = studentCourseRepository.findAllByCourseId(courseId);
            System.out.println("删除后剩余记录数: " + remainingRecords.size());
            
            if (!remainingRecords.isEmpty()) {
                System.err.println("警告：原生SQL删除后仍有 " + remainingRecords.size() + " 条记录未删除");
                for (StudentCourse sc : remainingRecords) {
                    System.err.println("剩余记录: ID=" + sc.getId() + ", StudentId=" + sc.getStudentId() + 
                                     ", CourseId=" + sc.getCourseId() + ", Status=" + sc.getStatus());
                }
                
                // 尝试使用JPA方法删除剩余记录
                System.out.println("尝试使用JPA删除剩余记录");
                studentCourseRepository.deleteAll(remainingRecords);
                studentCourseRepository.flush();
                
                // 最终验证
                List<StudentCourse> finalCheck = studentCourseRepository.findAllByCourseId(courseId);
                if (!finalCheck.isEmpty()) {
                    throw new RuntimeException("无法删除学生选课记录，剩余 " + finalCheck.size() + " 条记录");
                }
            }
            
            System.out.println("学生选课记录删除成功");
            
                         // 第三步：删除课程知识库
             System.out.println("删除课程知识库");
             try {
                 knowledgeBaseService.deleteCourseKnowledge(courseId);
                 System.out.println("课程知识库删除成功");
             } catch (Exception e) {
                 System.err.println("删除课程知识库失败，但继续删除课程: " + e.getMessage());
             }
             
             // 第四步：使用原生SQL删除其他相关数据
             System.out.println("删除其他相关数据");
             
             // 删除考试结果
             entityManager.createNativeQuery("DELETE FROM EXAM_RESULTS WHERE EXAM_ID IN (SELECT ID FROM EXAMS WHERE COURSE_ID = :courseId)")
                     .setParameter("courseId", courseId)
                     .executeUpdate();
             
             // 删除考试
             entityManager.createNativeQuery("DELETE FROM EXAMS WHERE COURSE_ID = :courseId")
                     .setParameter("courseId", courseId)
                     .executeUpdate();
             
             // 删除课程资料
             entityManager.createNativeQuery("DELETE FROM COURSE_MATERIALS WHERE COURSE_ID = :courseId")
                     .setParameter("courseId", courseId)
                     .executeUpdate();
             
             // 删除通知
             entityManager.createNativeQuery("DELETE FROM NOTICES WHERE COURSE_ID = :courseId")
                     .setParameter("courseId", courseId)
                     .executeUpdate();
             
             // 删除教学大纲
             entityManager.createNativeQuery("DELETE FROM TEACHING_OUTLINES WHERE COURSE_ID = :courseId")
                     .setParameter("courseId", courseId)
                     .executeUpdate();
             
             System.out.println("其他相关数据删除完成");
             
             // 第五步：清除EntityManager缓存，避免实体状态冲突
             System.out.println("清除EntityManager缓存");
             entityManager.clear();
             
             // 第六步：最终验证学生选课记录是否真的被删除
             System.out.println("最终验证学生选课记录删除情况");
             int remainingStudentCourses = entityManager.createNativeQuery("SELECT COUNT(*) FROM STUDENT_COURSES WHERE COURSE_ID = :courseId")
                     .setParameter("courseId", courseId)
                     .getSingleResult() != null ? ((Number) entityManager.createNativeQuery("SELECT COUNT(*) FROM STUDENT_COURSES WHERE COURSE_ID = :courseId")
                     .setParameter("courseId", courseId)
                     .getSingleResult()).intValue() : 0;
             
             System.out.println("STUDENT_COURSES表中剩余记录数: " + remainingStudentCourses);
             
             if (remainingStudentCourses > 0) {
                 System.err.println("发现STUDENT_COURSES表中仍有记录，再次删除");
                 int deletedStudentCourses = entityManager.createNativeQuery("DELETE FROM STUDENT_COURSES WHERE COURSE_ID = :courseId")
                         .setParameter("courseId", courseId)
                         .executeUpdate();
                 System.out.println("额外删除了 " + deletedStudentCourses + " 条STUDENT_COURSES记录");
             }
             
             // 第七步：检查并删除所有可能的选课记录表（ENROLLMENTS、STUDENT_ENROLLMENTS）
             System.out.println("检查并删除所有选课记录表");
             
             // 删除ENROLLMENTS表（如果存在）
             try {
                 int remainingEnrollments = ((Number) entityManager.createNativeQuery("SELECT COUNT(*) FROM ENROLLMENTS WHERE COURSE_ID = :courseId")
                         .setParameter("courseId", courseId)
                         .getSingleResult()).intValue();
                 
                 System.out.println("ENROLLMENTS表中剩余记录数: " + remainingEnrollments);
                 
                 if (remainingEnrollments > 0) {
                     System.out.println("删除ENROLLMENTS表中的记录");
                     int deletedEnrollments = entityManager.createNativeQuery("DELETE FROM ENROLLMENTS WHERE COURSE_ID = :courseId")
                             .setParameter("courseId", courseId)
                             .executeUpdate();
                     System.out.println("成功删除 " + deletedEnrollments + " 条ENROLLMENTS记录");
                 } else {
                     System.out.println("ENROLLMENTS表中没有相关记录");
                 }
             } catch (Exception e) {
                 System.err.println("检查ENROLLMENTS表时出错（可能表不存在）: " + e.getMessage());
             }
             
             // 删除STUDENT_ENROLLMENTS表（H2数据库可能使用的表名）
             try {
                 int remainingStudentEnrollments = ((Number) entityManager.createNativeQuery("SELECT COUNT(*) FROM STUDENT_ENROLLMENTS WHERE COURSE_ID = :courseId")
                         .setParameter("courseId", courseId)
                         .getSingleResult()).intValue();
                 
                 System.out.println("STUDENT_ENROLLMENTS表中剩余记录数: " + remainingStudentEnrollments);
                 
                 if (remainingStudentEnrollments > 0) {
                     System.out.println("删除STUDENT_ENROLLMENTS表中的记录");
                     int deletedStudentEnrollments = entityManager.createNativeQuery("DELETE FROM STUDENT_ENROLLMENTS WHERE COURSE_ID = :courseId")
                             .setParameter("courseId", courseId)
                             .executeUpdate();
                     System.out.println("成功删除 " + deletedStudentEnrollments + " 条STUDENT_ENROLLMENTS记录");
                 } else {
                     System.out.println("STUDENT_ENROLLMENTS表中没有相关记录");
                 }
             } catch (Exception e) {
                 System.err.println("检查STUDENT_ENROLLMENTS表时出错（可能表不存在）: " + e.getMessage());
             }
             
             // 第八步：使用原生SQL删除课程，避免Hibernate的级联处理
             System.out.println("使用原生SQL删除课程，课程ID: " + courseId);
             int deletedCount = entityManager.createNativeQuery("DELETE FROM COURSES WHERE ID = :courseId")
                     .setParameter("courseId", courseId)
                     .executeUpdate();
             
             if (deletedCount > 0) {
                 System.out.println("课程删除完全成功，课程ID: " + courseId);
             } else {
                 System.err.println("警告：课程可能已经被删除，删除行数: " + deletedCount);
             }
            
        } catch (Exception e) {
            System.err.println("删除课程失败: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("删除课程失败: " + e.getMessage(), e);
        }
    }
} 