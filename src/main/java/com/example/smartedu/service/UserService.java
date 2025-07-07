package com.example.smartedu.service;

import com.example.smartedu.entity.User;
import com.example.smartedu.repository.UserRepository;
import com.example.smartedu.repository.TeacherRepository;
import com.example.smartedu.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    // 添加依赖注入，用于删除时处理关联实体
    @Autowired
    private TeacherRepository teacherRepository;
    
    @Autowired
    private StudentRepository studentRepository;
    
    private static final String SALT = "SmartEdu2024"; // 固定盐值，实际项目中应为每个用户生成不同的盐
    
    /**
     * 用户注册
     */
    public User register(String username, String password, String role) {
        // 检查用户名是否已存在
        if (userRepository.existsByUsername(username)) {
            throw new RuntimeException("用户名已存在");
        }
        
        // 验证角色
        if (!isValidRole(role)) {
            throw new RuntimeException("无效的角色");
        }
        
        // 密码长度验证
        if (password.length() < 3) {
            throw new RuntimeException("密码长度至少3位");
        }
        
        // 创建新用户
        User user = new User();
        user.setUsername(username);
        user.setPassword(hashPassword(password)); // 加密密码
        user.setRole(role);
        user.setStatus("active");
        
        return userRepository.save(user);
    }
    
    /**
     * 用户登录
     */
    public User login(String username, String password, String role) {
        // 查找用户
        Optional<User> userOptional = userRepository.findByUsernameAndRole(username, role);
        if (!userOptional.isPresent()) {
            throw new RuntimeException("用户不存在或角色不匹配");
        }
        
        User user = userOptional.get();
        
        // 检查用户状态
        if (!"active".equals(user.getStatus())) {
            throw new RuntimeException("账户已被禁用");
        }
        
        // 验证密码
        if (!verifyPassword(password, user.getPassword())) {
            throw new RuntimeException("密码错误");
        }
        
        // 更新登录信息
        user.updateLastLogin();
        userRepository.save(user);
        
        return user;
    }
    
    /**
     * 修改密码
     */
    public void changePassword(Long userId, String oldPassword, String newPassword) {
        Optional<User> userOptional = userRepository.findById(userId);
        if (!userOptional.isPresent()) {
            throw new RuntimeException("用户不存在");
        }
        
        User user = userOptional.get();
        
        // 验证旧密码
        if (!verifyPassword(oldPassword, user.getPassword())) {
            throw new RuntimeException("原密码错误");
        }
        
        // 密码长度验证
        if (newPassword.length() < 3) {
            throw new RuntimeException("新密码长度至少3位");
        }
        
        // 更新密码
        user.setPassword(hashPassword(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }
    
    /**
     * 重置密码（管理员功能）
     */
    public void resetPassword(Long userId, String newPassword) {
        Optional<User> userOptional = userRepository.findById(userId);
        if (!userOptional.isPresent()) {
            throw new RuntimeException("用户不存在");
        }
        
        User user = userOptional.get();
        user.setPassword(hashPassword(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }
    
    /**
     * 获取所有用户
     */
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    /**
     * 根据角色获取用户
     */
    public List<User> getUsersByRole(String role) {
        return userRepository.findByRole(role);
    }
    
    /**
     * 更新用户状态
     */
    public void updateUserStatus(Long userId, String status) {
        Optional<User> userOptional = userRepository.findById(userId);
        if (!userOptional.isPresent()) {
            throw new RuntimeException("用户不存在");
        }
        
        User user = userOptional.get();
        user.setStatus(status);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }
    
    /**
     * 删除用户
     */
    @Transactional
    public void deleteUser(Long userId) {
        Optional<User> userOptional = userRepository.findById(userId);
        if (!userOptional.isPresent()) {
            throw new RuntimeException("用户不存在");
        }
        
        User user = userOptional.get();
        String role = user.getRole();
        
        // 根据角色删除相关联的实体
        if ("teacher".equals(role)) {
            // 删除教师实体
            teacherRepository.findByUserId(userId).ifPresent(teacher -> {
                teacherRepository.delete(teacher);
            });
        } else if ("student".equals(role)) {
            // 删除学生实体
            studentRepository.findByUserId(userId).ifPresent(student -> {
                studentRepository.delete(student);
            });
        }
        
        // 最后删除用户
        userRepository.deleteById(userId);
    }
    
    /**
     * 获取用户统计信息
     */
    public UserStats getUserStats() {
        UserStats stats = new UserStats();
        stats.totalUsers = userRepository.countAllUsers();
        stats.activeUsers = userRepository.countByStatus("active");
        stats.teacherCount = userRepository.countByRole("teacher");
        stats.studentCount = userRepository.countByRole("student");
        stats.adminCount = userRepository.countByRole("admin");
        return stats;
    }
    
    /**
     * 密码加密
     */
    public String hashPassword(String password) {
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
     * 密码验证
     */
    public boolean verifyPassword(String plainPassword, String hashedPassword) {
        return hashPassword(plainPassword).equals(hashedPassword);
    }
    
    /**
     * 验证角色有效性
     */
    private boolean isValidRole(String role) {
        return "teacher".equals(role) || "student".equals(role) || "admin".equals(role);
    }
    
    /**
     * 根据ID查找用户
     */
    public Optional<User> findById(Long userId) {
        return userRepository.findById(userId);
    }
    
    /**
     * 更新用户信息
     */
    public User updateUser(User user) {
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }
    
    /**
     * 获取所有用户（别名方法）
     */
    public List<User> findAll() {
        return userRepository.findAll();
    }
    
    /**
     * 更新用户角色
     */
    public void updateUserRole(Long userId, String newRole) {
        Optional<User> userOptional = userRepository.findById(userId);
        if (!userOptional.isPresent()) {
            throw new RuntimeException("用户不存在");
        }
        
        if (!isValidRole(newRole)) {
            throw new RuntimeException("无效的角色");
        }
        
        User user = userOptional.get();
        user.setRole(newRole);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }
    
    /**
     * 用户统计数据内部类
     */
    public static class UserStats {
        public long totalUsers;
        public long activeUsers;
        public long teacherCount;
        public long studentCount;
        public long adminCount;
    }
} 