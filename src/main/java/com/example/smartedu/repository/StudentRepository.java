package com.example.smartedu.repository;

import com.example.smartedu.entity.Student;
import com.example.smartedu.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    
    /**
     * 根据用户ID查找学生
     */
    Optional<Student> findByUserId(Long userId);
    
    /**
     * 根据用户查找学生
     */
    Optional<Student> findByUser(User user);
    
    /**
     * 根据学号查找学生
     */
    Optional<Student> findByStudentId(String studentId);
    
    /**
     * 检查学号是否存在
     */
    boolean existsByStudentId(String studentId);
    
    /**
     * 根据班级查找学生
     */
    List<Student> findByClassName(String className);
    
    /**
     * 根据专业查找学生
     */
    List<Student> findByMajor(String major);
    
    /**
     * 根据年级查找学生
     */
    List<Student> findByGrade(String grade);
    
    /**
     * 根据入学年份查找学生
     */
    List<Student> findByEntranceYear(Integer entranceYear);
    
    /**
     * 根据姓名模糊查询学生
     */
    @Query("SELECT s FROM Student s WHERE s.realName LIKE %:name%")
    List<Student> findByRealNameContaining(@Param("name") String name);
    
    /**
     * 根据班级和专业查找学生
     */
    List<Student> findByClassNameAndMajor(String className, String major);
    
    /**
     * 根据专业和年级查找学生
     */
    List<Student> findByMajorAndGrade(String major, String grade);
    
    /**
     * 统计学生总数
     */
    @Query("SELECT COUNT(s) FROM Student s")
    long countAllStudents();
    
    /**
     * 根据专业统计学生数量
     */
    long countByMajor(String major);
    
    /**
     * 根据班级统计学生数量
     */
    long countByClassName(String className);
    
    /**
     * 根据年级统计学生数量
     */
    long countByGrade(String grade);
} 