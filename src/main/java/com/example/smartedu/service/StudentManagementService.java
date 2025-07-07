package com.example.smartedu.service;

import com.example.smartedu.entity.Student;
import com.example.smartedu.entity.User;
import com.example.smartedu.repository.StudentRepository;
import com.example.smartedu.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class StudentManagementService {
    
    @Autowired
    private StudentRepository studentRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private UserService userService;
    
    /**
     * 为已存在的用户创建学生实体（管理员功能）
     */
    public Student createStudentForUser(User user, String realName) {
        // 检查是否已存在学生实体
        Optional<Student> existingStudent = studentRepository.findByUser(user);
        if (existingStudent.isPresent()) {
            return existingStudent.get(); // 如果已存在则直接返回
        }
        
        // 创建学生信息，使用默认值
        Student student = new Student(user, realName != null ? realName : user.getUsername());
        student.setClassName("未设置");
        student.setMajor("未设置");
        student.setGrade("未设置");
        
        return studentRepository.save(student);
    }
    
    /**
     * 注册学生
     */
    public Student registerStudent(String username, String password, String realName, 
                                 String studentId, String className, String major, 
                                 String grade, Integer entranceYear) {
        // 先创建用户账号
        User user = userService.register(username, password, "student");
        
        // 检查学号是否已存在
        if (studentId != null && studentRepository.existsByStudentId(studentId)) {
            throw new RuntimeException("学号已存在");
        }
        
        // 创建学生信息
        Student student = new Student(user, realName);
        student.setStudentId(studentId);
        student.setClassName(className);
        student.setMajor(major);
        student.setGrade(grade);
        student.setEntranceYear(entranceYear);
        
        return studentRepository.save(student);
    }
    
    /**
     * 根据用户ID获取学生信息
     */
    public Optional<Student> getStudentByUserId(Long userId) {
        return studentRepository.findByUserId(userId);
    }
    
    /**
     * 根据用户获取学生信息
     */
    public Optional<Student> getStudentByUser(User user) {
        return studentRepository.findByUser(user);
    }
    
    /**
     * 根据学号获取学生信息
     */
    public Optional<Student> getStudentByStudentId(String studentId) {
        return studentRepository.findByStudentId(studentId);
    }
    
    /**
     * 更新学生信息
     */
    public Student updateStudent(Long studentId, String realName, String studentNumber, 
                               String className, String major, String grade, 
                               Integer entranceYear, String gender, LocalDateTime birthDate, 
                               String address, String emergencyContact, String emergencyPhone) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("学生不存在"));
        
        // 检查学号是否被其他学生使用
        if (studentNumber != null && !studentNumber.equals(student.getStudentId())) {
            if (studentRepository.existsByStudentId(studentNumber)) {
                throw new RuntimeException("学号已被其他学生使用");
            }
        }
        
        student.setRealName(realName);
        student.setStudentId(studentNumber);
        student.setClassName(className);
        student.setMajor(major);
        student.setGrade(grade);
        student.setEntranceYear(entranceYear);
        student.setGender(gender);
        student.setBirthDate(birthDate);
        student.setAddress(address);
        student.setEmergencyContact(emergencyContact);
        student.setEmergencyPhone(emergencyPhone);
        student.setUpdatedAt(LocalDateTime.now());
        
        return studentRepository.save(student);
    }
    
    /**
     * 获取所有学生
     */
    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }
    
    /**
     * 根据班级获取学生
     */
    public List<Student> getStudentsByClass(String className) {
        return studentRepository.findByClassName(className);
    }
    
    /**
     * 根据专业获取学生
     */
    public List<Student> getStudentsByMajor(String major) {
        return studentRepository.findByMajor(major);
    }
    
    /**
     * 根据年级获取学生
     */
    public List<Student> getStudentsByGrade(String grade) {
        return studentRepository.findByGrade(grade);
    }
    
    /**
     * 根据入学年份获取学生
     */
    public List<Student> getStudentsByEntranceYear(Integer entranceYear) {
        return studentRepository.findByEntranceYear(entranceYear);
    }
    
    /**
     * 根据姓名模糊查询学生
     */
    public List<Student> searchStudentsByName(String name) {
        return studentRepository.findByRealNameContaining(name);
    }
    
    /**
     * 根据班级和专业获取学生
     */
    public List<Student> getStudentsByClassAndMajor(String className, String major) {
        return studentRepository.findByClassNameAndMajor(className, major);
    }
    
    /**
     * 根据专业和年级获取学生
     */
    public List<Student> getStudentsByMajorAndGrade(String major, String grade) {
        return studentRepository.findByMajorAndGrade(major, grade);
    }
    
    /**
     * 删除学生
     */
    public void deleteStudent(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("学生不存在"));
        
        // 删除学生信息
        studentRepository.delete(student);
        
        // 删除关联的用户账号
        if (student.getUser() != null) {
            userRepository.delete(student.getUser());
        }
    }
    
    /**
     * 获取学生统计信息
     */
    public StudentStats getStudentStats() {
        StudentStats stats = new StudentStats();
        stats.totalStudents = studentRepository.countAllStudents();
        
        // 可以添加更多统计信息
        return stats;
    }
    
    /**
     * 学生统计数据内部类
     */
    public static class StudentStats {
        public long totalStudents;
        // 可以添加更多统计字段
    }
} 