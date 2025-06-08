package com.example.smartedu.repository;

import com.example.smartedu.entity.Teacher;
import com.example.smartedu.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeacherRepository extends JpaRepository<Teacher, Long> {
    
    /**
     * 根据用户ID查找教师
     */
    Optional<Teacher> findByUserId(Long userId);
    
    /**
     * 根据用户查找教师
     */
    Optional<Teacher> findByUser(User user);
    
    /**
     * 根据教师工号查找教师
     */
    Optional<Teacher> findByTeacherCode(String teacherCode);
    
    /**
     * 检查教师工号是否存在
     */
    boolean existsByTeacherCode(String teacherCode);
    
    /**
     * 根据部门查找教师
     */
    List<Teacher> findByDepartment(String department);
    
    /**
     * 根据职称查找教师
     */
    List<Teacher> findByTitle(String title);
    
    /**
     * 根据姓名模糊查询教师
     */
    @Query("SELECT t FROM Teacher t WHERE t.realName LIKE %:name%")
    List<Teacher> findByRealNameContaining(@Param("name") String name);
    
    /**
     * 根据部门和职称查找教师
     */
    List<Teacher> findByDepartmentAndTitle(String department, String title);
    
    /**
     * 统计教师总数
     */
    @Query("SELECT COUNT(t) FROM Teacher t")
    long countAllTeachers();
    
    /**
     * 根据部门统计教师数量
     */
    long countByDepartment(String department);
} 