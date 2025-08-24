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

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.smartedu.entity.Message;
import com.example.smartedu.entity.Student;
import com.example.smartedu.entity.Teacher;
import com.example.smartedu.entity.User;
import com.example.smartedu.repository.MessageRepository;
import com.example.smartedu.repository.StudentRepository;
import com.example.smartedu.repository.TeacherRepository;
import com.example.smartedu.repository.UserRepository;

@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    // 添加依赖注入，用于删除时处理关联实体
    @Autowired
    private TeacherRepository teacherRepository;
    
    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private MessageRepository messageRepository;
    
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
     * 检测用户密码强度
     */
    public Map<String, Object> checkPasswordStrength(User user) {
        Map<String, Object> result = new HashMap<>();

        // 由于密码已经加密，我们无法直接检测密码强度
        // 这里我们基于用户名和一些启发式规则来判断
        String username = user.getUsername();

        // 密码强度等级：WEAK（弱）、MEDIUM（中等）、STRONG（强）
        String strength = "MEDIUM";
        String reason = "";
        List<String> suggestions = new ArrayList<>();

        // 检测常见弱口令模式
        boolean isWeakPassword = isWeakPassword(username);

        if (isWeakPassword) {
            strength = "WEAK";
            reason = "检测到弱口令特征：" + getWeakPasswordReason(username);
            suggestions.add("立即修改密码，使用包含大小写字母、数字和特殊字符的复杂密码");
            suggestions.add("密码长度建议至少8位");
            suggestions.add("避免使用用户名、生日、键盘序列、常见单词作为密码");
            suggestions.add("不要使用纯数字或纯字母密码");
        } else {
            // 进一步判断强度
            if (isStrongPassword(username)) {
                strength = "STRONG";
                reason = "密码强度较高";
                suggestions.add("密码强度良好，建议定期更换密码");
                suggestions.add("继续保持良好的密码安全习惯");
            } else {
                strength = "MEDIUM";
                reason = "密码强度中等";
                suggestions.add("建议增加密码复杂度，包含大小写字母、数字和特殊字符");
                suggestions.add("建议定期更换密码");
            }
        }

        result.put("userId", user.getId());
        result.put("username", user.getUsername());
        result.put("strength", strength);
        result.put("reason", reason);
        result.put("suggestions", suggestions);
        result.put("isWeak", "WEAK".equals(strength));
        result.put("checkTime", LocalDateTime.now());

        return result;
    }

    /**
     * 获取弱口令的具体原因
     */
    private String getWeakPasswordReason(String username) {
        String lowerUsername = username.toLowerCase();

        if (lowerUsername.matches("\\d+")) {
            return "纯数字密码";
        }
        if (lowerUsername.matches("[a-z]+") && lowerUsername.length() <= 8) {
            return "纯字母且长度过短";
        }
        if (lowerUsername.matches("^[a-z]+\\d+$") || lowerUsername.matches("^\\d+[a-z]+$")) {
            return "简单的字母数字组合";
        }
        if (hasRepeatingChars(lowerUsername)) {
            return "包含重复字符";
        }
        if (isKeyboardSequence(lowerUsername)) {
            return "键盘序列密码";
        }
        if (lowerUsername.length() < 6) {
            return "密码长度过短";
        }

        // 检查常见弱口令
        List<String> weakPatterns = java.util.Arrays.asList(
            "123456", "password", "admin", "123123", "111111",
            "000000", "qwerty", "abc123", "123abc", "password123"
        );

        for (String pattern : weakPatterns) {
            if (lowerUsername.contains(pattern) || pattern.contains(lowerUsername)) {
                return "包含常见弱口令模式";
            }
        }

        return "可能存在安全风险";
    }

    /**
     * 判断是否为强密码
     */
    private boolean isStrongPassword(String username) {
        String lowerUsername = username.toLowerCase();

        // 长度足够且包含多种字符类型的组合
        if (lowerUsername.length() >= 10 &&
            lowerUsername.matches(".*[a-z].*") &&
            lowerUsername.matches(".*\\d.*") &&
            !lowerUsername.matches("^[a-z0-9]+$")) { // 不是纯字母数字
            return true;
        }

        return false;
    }

    /**
     * 判断是否为弱口令（基于用户名的启发式判断）
     */
    private boolean isWeakPassword(String username) {
        // 常见弱口令模式
        List<String> weakPatterns = java.util.Arrays.asList(
            "123456", "password", "admin", "123123", "111111",
            "000000", "qwerty", "abc123", "123abc", "password123",
            "test", "user", "demo", "guest"
        );

        String lowerUsername = username.toLowerCase();

        // 检查是否包含常见弱口令
        for (String pattern : weakPatterns) {
            if (lowerUsername.contains(pattern) || pattern.contains(lowerUsername)) {
                return true;
            }
        }

        // 检查是否为纯数字（更严格的判断）
        if (lowerUsername.matches("\\d+")) {
            return true;
        }

        // 检查是否为纯字母且长度较短
        if (lowerUsername.matches("[a-z]+") && lowerUsername.length() <= 8) {
            return true;
        }

        // 检查是否为简单的字母数字组合
        if (lowerUsername.matches("^[a-z]+\\d+$") || lowerUsername.matches("^\\d+[a-z]+$")) {
            return true;
        }

        // 检查重复字符
        if (hasRepeatingChars(lowerUsername)) {
            return true;
        }

        // 检查是否为键盘序列
        if (isKeyboardSequence(lowerUsername)) {
            return true;
        }

        // 检查长度过短
        if (lowerUsername.length() < 6) {
            return true;
        }

        return false;
    }

    /**
     * 检查是否为键盘序列
     */
    private boolean isKeyboardSequence(String str) {
        String[] sequences = {
            "qwerty", "asdfgh", "zxcvbn", "qwertyuiop", "asdfghjkl", "zxcvbnm",
            "abcdef", "123456", "654321", "qweasd", "asdqwe"
        };

        for (String seq : sequences) {
            if (str.contains(seq) || seq.contains(str)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 检查是否有重复字符
     */
    private boolean hasRepeatingChars(String str) {
        if (str.length() < 3) return false;

        for (int i = 0; i < str.length() - 2; i++) {
            if (str.charAt(i) == str.charAt(i + 1) && str.charAt(i + 1) == str.charAt(i + 2)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 发送弱口令通知
     */
    public boolean sendWeakPasswordNotice(User user) {
        try {
            // 获取用户的真实姓名
            String realName = user.getRealName();
            if (realName == null || realName.trim().isEmpty()) {
                realName = user.getUsername();
            }

            // 构建通知内容
            String noticeContent = String.format(
                "%s您好，根据市委网信办关于重要时期网络安全保障工作的通知要求，" +
                "为进一步提高信息系统及办公终端网络安全防护水平，有效防范和抵御安全风险，" +
                "切实保障重要时期网络和信息系统稳定运行，检测到您智囊系统中密码为\"弱口令\"，" +
                "建议您重新修改密码。如您已修改密码，请忽略此信息。",
                realName
            );

            // 创建消息对象发送到用户的待办
            Message message = new Message();
            message.setSenderId(1L); // 系统管理员ID
            message.setSenderType("admin");
            message.setSenderName("系统管理员");

            // 根据用户角色设置接收者信息
            if ("teacher".equals(user.getRole())) {
                Optional<Teacher> teacherOpt = teacherRepository.findByUserId(user.getId());
                if (teacherOpt.isPresent()) {
                    Teacher teacher = teacherOpt.get();
                    message.setReceiverId(teacher.getId());
                    message.setReceiverType("teacher");
                    message.setReceiverName(teacher.getRealName() != null ? teacher.getRealName() : user.getUsername());
                }
            } else if ("student".equals(user.getRole())) {
                Optional<Student> studentOpt = studentRepository.findByUserId(user.getId());
                if (studentOpt.isPresent()) {
                    Student student = studentOpt.get();
                    message.setReceiverId(student.getId());
                    message.setReceiverType("student");
                    message.setReceiverName(student.getRealName() != null ? student.getRealName() : user.getUsername());
                }
            } else {
                // 对于管理员或其他角色，直接使用用户信息
                message.setReceiverId(user.getId());
                message.setReceiverType(user.getRole());
                message.setReceiverName(realName);
            }

            message.setContent(noticeContent);
            message.setMessageType("notice");
            message.setSentAt(LocalDateTime.now());

            // 保存消息
            messageRepository.save(message);

            return true;
        } catch (Exception e) {
            System.err.println("发送弱口令通知失败: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
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