package com.example.smartedu.service;

import com.example.smartedu.entity.Teacher;
import com.example.smartedu.entity.User;
import com.example.smartedu.repository.TeacherRepository;
import com.example.smartedu.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class TeacherManagementService {
    
    @Autowired
    private TeacherRepository teacherRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private UserService userService;
    
    /**
     * 注册教师
     */
    public Teacher registerTeacher(String username, String password, String realName, 
                                 String teacherCode, String department, String title) {
        // 先创建用户账号
        User user = userService.register(username, password, "teacher");
        
        // 检查教师工号是否已存在
        if (teacherCode != null && teacherRepository.existsByTeacherCode(teacherCode)) {
            throw new RuntimeException("教师工号已存在");
        }
        
        // 创建教师信息
        Teacher teacher = new Teacher(user, realName);
        teacher.setTeacherCode(teacherCode);
        teacher.setDepartment(department);
        teacher.setTitle(title);
        
        return teacherRepository.save(teacher);
    }
    
    /**
     * 根据用户ID获取教师信息
     */
    public Optional<Teacher> getTeacherByUserId(Long userId) {
        return teacherRepository.findByUserId(userId);
    }
    
    /**
     * 根据用户获取教师信息
     */
    public Optional<Teacher> getTeacherByUser(User user) {
        return teacherRepository.findByUser(user);
    }
    
    /**
     * 根据教师工号获取教师信息
     */
    public Optional<Teacher> getTeacherByCode(String teacherCode) {
        return teacherRepository.findByTeacherCode(teacherCode);
    }
    
    /**
     * 更新教师信息
     */
    public Teacher updateTeacher(Long teacherId, String realName, String teacherCode, 
                               String department, String title, String education, 
                               String specialty, String introduction, String officeLocation, 
                               String officeHours) {
        Teacher teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("教师不存在"));
        
        // 检查教师工号是否被其他教师使用
        if (teacherCode != null && !teacherCode.equals(teacher.getTeacherCode())) {
            if (teacherRepository.existsByTeacherCode(teacherCode)) {
                throw new RuntimeException("教师工号已被其他教师使用");
            }
        }
        
        teacher.setRealName(realName);
        teacher.setTeacherCode(teacherCode);
        teacher.setDepartment(department);
        teacher.setTitle(title);
        teacher.setEducation(education);
        teacher.setSpecialty(specialty);
        teacher.setIntroduction(introduction);
        teacher.setOfficeLocation(officeLocation);
        teacher.setOfficeHours(officeHours);
        teacher.setUpdatedAt(LocalDateTime.now());
        
        return teacherRepository.save(teacher);
    }
    
    /**
     * 获取所有教师
     */
    public List<Teacher> getAllTeachers() {
        return teacherRepository.findAll();
    }
    
    /**
     * 根据部门获取教师
     */
    public List<Teacher> getTeachersByDepartment(String department) {
        return teacherRepository.findByDepartment(department);
    }
    
    /**
     * 根据职称获取教师
     */
    public List<Teacher> getTeachersByTitle(String title) {
        return teacherRepository.findByTitle(title);
    }
    
    /**
     * 根据姓名模糊查询教师
     */
    public List<Teacher> searchTeachersByName(String name) {
        return teacherRepository.findByRealNameContaining(name);
    }
    
    /**
     * 删除教师
     */
    public void deleteTeacher(Long teacherId) {
        Teacher teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("教师不存在"));
        
        // 删除教师信息
        teacherRepository.delete(teacher);
        
        // 删除关联的用户账号
        if (teacher.getUser() != null) {
            userRepository.delete(teacher.getUser());
        }
    }
    
    /**
     * 获取教师统计信息
     */
    public TeacherStats getTeacherStats() {
        TeacherStats stats = new TeacherStats();
        stats.totalTeachers = teacherRepository.countAllTeachers();
        
        // 可以添加更多统计信息，如按部门统计等
        return stats;
    }
    
    /**
     * 教师统计数据内部类
     */
    public static class TeacherStats {
        public long totalTeachers;
        // 可以添加更多统计字段
    }
} 