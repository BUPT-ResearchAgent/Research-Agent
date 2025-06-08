package com.example.smartedu.controller;

import com.example.smartedu.entity.User;
import com.example.smartedu.entity.Teacher;
import com.example.smartedu.entity.Student;
import com.example.smartedu.service.UserService;
import com.example.smartedu.service.TeacherManagementService;
import com.example.smartedu.service.StudentManagementService;
import com.example.smartedu.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpSession;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class AuthController {
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private TeacherManagementService teacherManagementService;
    
    @Autowired
    private StudentManagementService studentManagementService;
    
    /**
     * 用户注册 - 基础注册（仅创建用户账号）
     */
    @PostMapping("/register")
    public ApiResponse<User> register(@RequestBody Map<String, String> request) {
        try {
            String username = request.get("username");
            String password = request.get("password");
            String role = request.get("role");
            
            if (username == null || password == null || role == null) {
                return ApiResponse.error("请填写完整信息");
            }
            
            User user = userService.register(username, password, role);
            
            // 返回时隐藏密码
            user.setPassword(null);
            return ApiResponse.success("注册成功", user);
        } catch (Exception e) {
            return ApiResponse.error("注册失败：" + e.getMessage());
        }
    }
    
    /**
     * 教师注册 - 完整注册（创建用户账号和教师信息）
     */
    @PostMapping("/register/teacher")
    public ApiResponse<Map<String, Object>> registerTeacher(@RequestBody Map<String, String> request) {
        try {
            String username = request.get("username");
            String password = request.get("password");
            String realName = request.get("realName");
            String teacherCode = request.get("teacherCode");
            String department = request.get("department");
            String title = request.get("title");
            
            if (username == null || password == null || realName == null) {
                return ApiResponse.error("请填写完整的基本信息");
            }
            
            Teacher teacher = teacherManagementService.registerTeacher(
                username, password, realName, teacherCode, department, title);
            
            // 构建返回数据
            Map<String, Object> result = new HashMap<>();
            result.put("user", teacher.getUser());
            result.put("teacher", teacher);
            
            // 隐藏密码
            teacher.getUser().setPassword(null);
            
            return ApiResponse.success("教师注册成功", result);
        } catch (Exception e) {
            return ApiResponse.error("教师注册失败：" + e.getMessage());
        }
    }
    
    /**
     * 学生注册 - 完整注册（创建用户账号和学生信息）
     */
    @PostMapping("/register/student")
    public ApiResponse<Map<String, Object>> registerStudent(@RequestBody Map<String, String> request) {
        try {
            String username = request.get("username");
            String password = request.get("password");
            String realName = request.get("realName");
            String studentId = request.get("studentId");
            String className = request.get("className");
            String major = request.get("major");
            String grade = request.get("grade");
            String entranceYearStr = request.get("entranceYear");
            
            if (username == null || password == null || realName == null) {
                return ApiResponse.error("请填写完整的基本信息");
            }
            
            Integer entranceYear = null;
            if (entranceYearStr != null && !entranceYearStr.isEmpty()) {
                try {
                    entranceYear = Integer.valueOf(entranceYearStr);
                } catch (NumberFormatException e) {
                    return ApiResponse.error("入学年份格式不正确");
                }
            }
            
            Student student = studentManagementService.registerStudent(
                username, password, realName, studentId, className, major, grade, entranceYear);
            
            // 构建返回数据
            Map<String, Object> result = new HashMap<>();
            result.put("user", student.getUser());
            result.put("student", student);
            
            // 隐藏密码
            student.getUser().setPassword(null);
            
            return ApiResponse.success("学生注册成功", result);
        } catch (Exception e) {
            return ApiResponse.error("学生注册失败：" + e.getMessage());
        }
    }
    
    /**
     * 用户登录 - 简单版本
     */
    @PostMapping("/login")
    public ApiResponse<Map<String, Object>> login(@RequestBody Map<String, String> request, 
                                                 HttpSession session) {
        try {
            String username = request.get("username");
            String password = request.get("password");
            String role = request.get("role");
            
            if (username == null || password == null || role == null) {
                return ApiResponse.error("请填写完整信息");
            }
            
            // 验证用户
            User user = userService.login(username, password, role);
            
            // 设置session
            session.setAttribute("userId", user.getId());
            session.setAttribute("username", user.getUsername());
            session.setAttribute("role", user.getRole());
            
            // 构建返回数据
            Map<String, Object> result = new HashMap<>();
            result.put("userId", user.getId());
            result.put("username", user.getUsername());
            result.put("role", user.getRole());
            
            return ApiResponse.success("登录成功", result);
        } catch (Exception e) {
            return ApiResponse.error("登录失败：" + e.getMessage());
        }
    }
    
    /**
     * 用户登出
     */
    @PostMapping("/logout")
    public ApiResponse<Void> logout(HttpSession session) {
        session.invalidate();
        return ApiResponse.success("登出成功", null);
    }
    
    /**
     * 检查登录状态
     */
    @GetMapping("/check")
    public ApiResponse<Map<String, Object>> checkLogin(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ApiResponse.error("未登录");
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("userId", userId);
        result.put("username", session.getAttribute("username"));
        result.put("role", session.getAttribute("role"));
        
        return ApiResponse.success("已登录", result);
    }
    
    /**
     * 获取当前登录用户信息
     */
    @GetMapping("/current-user")
    public ApiResponse<Map<String, Object>> getCurrentUser(jakarta.servlet.http.HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("用户未登录");
            }
            
            String role = (String) session.getAttribute("role");
            Map<String, Object> result = new HashMap<>();
            result.put("userId", userId);
            result.put("username", session.getAttribute("username"));
            result.put("role", role);
            
            if ("teacher".equals(role)) {
                Long teacherId = (Long) session.getAttribute("teacherId");
                result.put("teacherId", teacherId);
            } else if ("student".equals(role)) {
                Long studentId = (Long) session.getAttribute("studentId");
                result.put("studentId", studentId);
            }
            
            return ApiResponse.success("获取用户信息成功", result);
        } catch (Exception e) {
            return ApiResponse.error("获取用户信息失败：" + e.getMessage());
        }
    }

    /**
     * 修改密码
     */
    @PostMapping("/change-password")
    public ApiResponse<Void> changePassword(@RequestBody Map<String, String> request) {
        try {
            Long userId = Long.valueOf(request.get("userId"));
            String oldPassword = request.get("oldPassword");
            String newPassword = request.get("newPassword");
            
            if (userId == null || oldPassword == null || newPassword == null) {
                return ApiResponse.error("请填写完整信息");
            }
            
            userService.changePassword(userId, oldPassword, newPassword);
            return ApiResponse.success("密码修改成功", null);
        } catch (Exception e) {
            return ApiResponse.error("密码修改失败：" + e.getMessage());
        }
    }
    
    /**
     * 获取所有用户（管理员功能）
     */
    @GetMapping("/users")
    public ApiResponse<List<User>> getAllUsers() {
        try {
            List<User> users = userService.getAllUsers();
            // 隐藏所有密码
            users.forEach(user -> user.setPassword(null));
            return ApiResponse.success("获取用户列表成功", users);
        } catch (Exception e) {
            return ApiResponse.error("获取用户列表失败：" + e.getMessage());
        }
    }
    
    /**
     * 获取所有教师（管理员功能）
     */
    @GetMapping("/teachers")
    public ApiResponse<List<Teacher>> getAllTeachers() {
        try {
            List<Teacher> teachers = teacherManagementService.getAllTeachers();
            // 隐藏密码
            teachers.forEach(teacher -> {
                if (teacher.getUser() != null) {
                    teacher.getUser().setPassword(null);
                }
            });
            return ApiResponse.success("获取教师列表成功", teachers);
        } catch (Exception e) {
            return ApiResponse.error("获取教师列表失败：" + e.getMessage());
        }
    }
    
    /**
     * 获取所有学生（管理员功能）
     */
    @GetMapping("/students")
    public ApiResponse<List<Student>> getAllStudents() {
        try {
            List<Student> students = studentManagementService.getAllStudents();
            // 隐藏密码
            students.forEach(student -> {
                if (student.getUser() != null) {
                    student.getUser().setPassword(null);
                }
            });
            return ApiResponse.success("获取学生列表成功", students);
        } catch (Exception e) {
            return ApiResponse.error("获取学生列表失败：" + e.getMessage());
        }
    }
    
    /**
     * 更新用户状态（管理员功能）
     */
    @PutMapping("/users/{userId}/status")
    public ApiResponse<Void> updateUserStatus(@PathVariable Long userId, @RequestBody Map<String, String> request) {
        try {
            String status = request.get("status");
            if (status == null) {
                return ApiResponse.error("请提供状态信息");
            }
            
            userService.updateUserStatus(userId, status);
            return ApiResponse.success("用户状态更新成功", null);
        } catch (Exception e) {
            return ApiResponse.error("更新用户状态失败：" + e.getMessage());
        }
    }
    
    /**
     * 重置用户密码（管理员功能）
     */
    @PostMapping("/users/{userId}/reset-password")
    public ApiResponse<Void> resetPassword(@PathVariable Long userId, @RequestBody Map<String, String> request) {
        try {
            String newPassword = request.get("newPassword");
            if (newPassword == null) {
                return ApiResponse.error("请提供新密码");
            }
            
            userService.resetPassword(userId, newPassword);
            return ApiResponse.success("密码重置成功", null);
        } catch (Exception e) {
            return ApiResponse.error("密码重置失败：" + e.getMessage());
        }
    }
    
    /**
     * 删除用户（管理员功能）
     */
    @DeleteMapping("/users/{userId}")
    public ApiResponse<Void> deleteUser(@PathVariable Long userId) {
        try {
            userService.deleteUser(userId);
            return ApiResponse.success("用户删除成功", null);
        } catch (Exception e) {
            return ApiResponse.error("删除用户失败：" + e.getMessage());
        }
    }
    
    /**
     * 获取用户统计信息（管理员功能）
     */
    @GetMapping("/stats")
    public ApiResponse<Map<String, Object>> getUserStats() {
        try {
            UserService.UserStats userStats = userService.getUserStats();
            TeacherManagementService.TeacherStats teacherStats = teacherManagementService.getTeacherStats();
            StudentManagementService.StudentStats studentStats = studentManagementService.getStudentStats();
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("users", userStats);
            stats.put("teachers", teacherStats);
            stats.put("students", studentStats);
            
            return ApiResponse.success("获取统计信息成功", stats);
        } catch (Exception e) {
            return ApiResponse.error("获取统计信息失败：" + e.getMessage());
        }
    }
} 