package com.example.smartedu.controller;

import com.example.smartedu.entity.User;
import com.example.smartedu.entity.Teacher;
import com.example.smartedu.entity.Student;
import com.example.smartedu.service.UserService;
import com.example.smartedu.service.TeacherManagementService;
import com.example.smartedu.service.StudentManagementService;
import com.example.smartedu.service.OnlineUserService;
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
import java.util.stream.Collectors;

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
    
    @Autowired
    private OnlineUserService onlineUserService;
    
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
            
            // 用户上线
            onlineUserService.userOnline(user.getId());
            
            // 根据角色设置相应的ID
            if ("teacher".equals(role)) {
                Optional<Teacher> teacherOpt = teacherManagementService.getTeacherByUserId(user.getId());
                if (teacherOpt.isPresent()) {
                    session.setAttribute("teacherId", teacherOpt.get().getId());
                }
            } else if ("student".equals(role)) {
                Optional<Student> studentOpt = studentManagementService.getStudentByUserId(user.getId());
                if (studentOpt.isPresent()) {
                    session.setAttribute("studentId", studentOpt.get().getId());
                }
            }
            
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
        // 获取用户ID并设置下线状态
        Long userId = (Long) session.getAttribute("userId");
        if (userId != null) {
            onlineUserService.userOffline(userId);
        }
        
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
    @GetMapping("/admin/stats")
    public ApiResponse<Map<String, Object>> getAdminStats(HttpSession session) {
        try {
            // 检查管理员权限
            String role = (String) session.getAttribute("role");
            if (!"admin".equals(role)) {
                return ApiResponse.error("权限不足，需要管理员权限");
            }
            
            UserService.UserStats userStats = userService.getUserStats();
            
            // 获取在线用户数量（活跃用户指当前在线的学生和老师）
            int onlineUserCount = onlineUserService.getOnlineUserCount();
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalUsers", userStats.totalUsers);
            stats.put("activeUsers", onlineUserCount); // 活跃用户 = 在线用户
            stats.put("teacherCount", userStats.teacherCount);
            stats.put("studentCount", userStats.studentCount);
            stats.put("adminCount", userStats.adminCount);
            
            // 计算活跃率（在线用户数 / 总用户数）
            double activeRate = userStats.totalUsers > 0 ? 
                (double) onlineUserCount / userStats.totalUsers * 100 : 0;
            stats.put("activeRate", Math.round(activeRate * 10) / 10.0);
            
            return ApiResponse.success("获取统计信息成功", stats);
        } catch (Exception e) {
            return ApiResponse.error("获取统计信息失败：" + e.getMessage());
        }
    }

    /**
     * 获取用户列表（管理员功能，支持分页和筛选）
     */
    @GetMapping("/admin/users")
    public ApiResponse<Map<String, Object>> getAdminUsers(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            HttpSession session) {
        try {
            // 检查管理员权限
            String userRole = (String) session.getAttribute("role");
            if (!"admin".equals(userRole)) {
                return ApiResponse.error("权限不足，需要管理员权限");
            }
            
            // 获取所有用户
            List<User> allUsers = userService.getAllUsers();
            
            // 应用筛选条件
            List<User> filteredUsers = allUsers.stream()
                .filter(user -> {
                    boolean matchSearch = search == null || search.trim().isEmpty() || 
                        user.getUsername().toLowerCase().contains(search.toLowerCase());
                    boolean matchRole = role == null || role.trim().isEmpty() || 
                        user.getRole().equals(role);
                    boolean matchStatus = status == null || status.trim().isEmpty() || 
                        user.getStatus().equals(status);
                    return matchSearch && matchRole && matchStatus;
                })
                .collect(Collectors.toList());
            
            // 计算分页
            int totalUsers = filteredUsers.size();
            int totalPages = (int) Math.ceil((double) totalUsers / size);
            int startIndex = (page - 1) * size;
            int endIndex = Math.min(startIndex + size, totalUsers);
            
            List<User> pageUsers = filteredUsers.subList(startIndex, endIndex);
            
            // 隐藏密码并添加在线状态信息
            List<Map<String, Object>> userList = pageUsers.stream().map(user -> {
                Map<String, Object> userMap = new HashMap<>();
                userMap.put("id", user.getId());
                userMap.put("username", user.getUsername());
                userMap.put("role", user.getRole());
                userMap.put("accountStatus", user.getStatus()); // 账户状态（active/inactive）
                userMap.put("isOnline", onlineUserService.isUserOnline(user.getId())); // 真实在线状态
                userMap.put("status", onlineUserService.isUserOnline(user.getId()) ? "online" : "offline"); // 显示状态
                userMap.put("createdAt", user.getCreatedAt());
                userMap.put("updatedAt", user.getUpdatedAt());
                userMap.put("lastLogin", user.getLastLogin());
                return userMap;
            }).collect(Collectors.toList());
            
            Map<String, Object> result = new HashMap<>();
            result.put("users", userList);
            result.put("pagination", Map.of(
                "currentPage", page,
                "totalPages", totalPages,
                "pageSize", size,
                "totalUsers", totalUsers,
                "startIndex", startIndex + 1,
                "endIndex", endIndex
            ));
            
            return ApiResponse.success("获取用户列表成功", result);
        } catch (Exception e) {
            return ApiResponse.error("获取用户列表失败：" + e.getMessage());
        }
    }

    /**
     * 编辑用户信息（管理员功能）
     */
    @PutMapping("/admin/users/{userId}")
    public ApiResponse<Void> updateUser(
            @PathVariable Long userId,
            @RequestBody Map<String, Object> request,
            HttpSession session) {
        try {
            // 检查管理员权限
            String userRole = (String) session.getAttribute("role");
            if (!"admin".equals(userRole)) {
                return ApiResponse.error("权限不足，需要管理员权限");
            }
            
            // 获取用户
            Optional<User> userOpt = userService.findById(userId);
            if (!userOpt.isPresent()) {
                return ApiResponse.error("用户不存在");
            }
            
            User user = userOpt.get();
            
            // 不允许修改admin用户
            if ("admin".equals(user.getUsername())) {
                return ApiResponse.error("不允许修改管理员账户");
            }
            
            // 更新用户信息
            if (request.containsKey("role")) {
                String newRole = (String) request.get("role");
                if (!"teacher".equals(newRole) && !"student".equals(newRole) && !"admin".equals(newRole)) {
                    return ApiResponse.error("无效的角色");
                }
                user.setRole(newRole);
            }
            
            // 不再支持手动修改状态，状态由在线状态自动管理
            
            if (request.containsKey("password")) {
                String newPassword = (String) request.get("password");
                if (newPassword != null && !newPassword.trim().isEmpty()) {
                    if (newPassword.length() < 6) {
                        return ApiResponse.error("密码长度至少6位");
                    }
                    userService.resetPassword(userId, newPassword);
                }
            }
            
            user.setUpdatedAt(LocalDateTime.now());
            userService.updateUser(user);
            
            return ApiResponse.success("用户信息更新成功", null);
        } catch (Exception e) {
            return ApiResponse.error("更新用户信息失败：" + e.getMessage());
        }
    }

    /**
     * 创建新用户（管理员功能）
     */
    @PostMapping("/admin/users")
    public ApiResponse<Map<String, Object>> createUser(
            @RequestBody Map<String, String> request,
            HttpSession session) {
        try {
            // 检查管理员权限
            String userRole = (String) session.getAttribute("role");
            if (!"admin".equals(userRole)) {
                return ApiResponse.error("权限不足，需要管理员权限");
            }
            
            String username = request.get("username");
            String password = request.get("password");
            String role = request.get("role");
            
            if (username == null || password == null || role == null) {
                return ApiResponse.error("请填写完整信息");
            }
            
            if (password.length() < 6) {
                return ApiResponse.error("密码长度至少6位");
            }
            
            if (!"teacher".equals(role) && !"student".equals(role)) {
                return ApiResponse.error("只能创建教师或学生账户");
            }
            
            User user = userService.register(username, password, role);
            // 新用户默认离线状态，由在线服务自动管理
            
            Map<String, Object> result = new HashMap<>();
            result.put("id", user.getId());
            result.put("username", user.getUsername());
            result.put("role", user.getRole());
            result.put("status", user.getStatus());
            result.put("createdAt", user.getCreatedAt());
            
            return ApiResponse.success("用户创建成功", result);
        } catch (Exception e) {
            return ApiResponse.error("创建用户失败：" + e.getMessage());
        }
    }
    
    /**
     * 批量删除用户
     */
    @DeleteMapping("/admin/users/batch")
    public ApiResponse<String> batchDeleteUsers(
            @RequestBody Map<String, Object> request,
            HttpSession session) {
        try {
            // 检查管理员权限
            String role = (String) session.getAttribute("role");
            if (!"admin".equals(role)) {
                return ApiResponse.error("无权限访问");
            }
            
            @SuppressWarnings("unchecked")
            List<Long> userIds = (List<Long>) request.get("userIds");
            
            if (userIds == null || userIds.isEmpty()) {
                return ApiResponse.error("请选择要删除的用户");
            }
            
            // 检查是否包含admin用户
            String currentUsername = (String) session.getAttribute("username");
            for (Long userId : userIds) {
                Optional<User> userOpt = userService.findById(userId);
                if (userOpt.isPresent() && "admin".equals(userOpt.get().getUsername())) {
                    return ApiResponse.error("不能删除管理员账户");
                }
                if (userOpt.isPresent() && userOpt.get().getUsername().equals(currentUsername)) {
                    return ApiResponse.error("不能删除当前登录的账户");
                }
            }
            
            // 批量删除用户
            int deletedCount = 0;
            for (Long userId : userIds) {
                try {
                    userService.deleteUser(userId);
                    // 用户下线
                    onlineUserService.userOffline(userId);
                    deletedCount++;
                } catch (Exception e) {
                    // 记录错误但继续删除其他用户
                    System.err.println("删除用户 " + userId + " 失败: " + e.getMessage());
                }
            }
            
            if (deletedCount > 0) {
                return ApiResponse.success("成功删除 " + deletedCount + " 个用户");
            } else {
                return ApiResponse.error("没有用户被删除");
            }
        } catch (Exception e) {
            return ApiResponse.error("批量删除失败：" + e.getMessage());
        }
    }
    
    /**
     * 批量修改用户角色
     */
    @PutMapping("/admin/users/batch-role")
    public ApiResponse<String> batchUpdateUserRole(
            @RequestBody Map<String, Object> request,
            HttpSession session) {
        try {
            // 检查管理员权限
            String role = (String) session.getAttribute("role");
            if (!"admin".equals(role)) {
                return ApiResponse.error("无权限访问");
            }
            
            @SuppressWarnings("unchecked")
            List<Long> userIds = (List<Long>) request.get("userIds");
            String newRole = (String) request.get("newRole");
            
            if (userIds == null || userIds.isEmpty()) {
                return ApiResponse.error("请选择要修改的用户");
            }
            
            if (newRole == null || (!newRole.equals("teacher") && !newRole.equals("student"))) {
                return ApiResponse.error("角色参数无效");
            }
            
            // 检查是否包含admin用户
            for (Long userId : userIds) {
                Optional<User> userOpt = userService.findById(userId);
                if (userOpt.isPresent() && "admin".equals(userOpt.get().getUsername())) {
                    return ApiResponse.error("不能修改管理员账户的角色");
                }
            }
            
            // 批量修改角色
            int updatedCount = 0;
            for (Long userId : userIds) {
                try {
                    userService.updateUserRole(userId, newRole);
                    updatedCount++;
                } catch (Exception e) {
                    // 记录错误但继续修改其他用户
                    System.err.println("修改用户 " + userId + " 角色失败: " + e.getMessage());
                }
            }
            
            if (updatedCount > 0) {
                return ApiResponse.success("成功修改 " + updatedCount + " 个用户的角色");
            } else {
                return ApiResponse.error("没有用户角色被修改");
            }
        } catch (Exception e) {
            return ApiResponse.error("批量修改角色失败：" + e.getMessage());
        }
    }
    
    /**
     * 导出用户数据
     */
    @GetMapping("/admin/users/export")
    public ApiResponse<List<Map<String, Object>>> exportUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            HttpSession session) {
        try {
            // 检查管理员权限
            String userRole = (String) session.getAttribute("role");
            if (!"admin".equals(userRole)) {
                return ApiResponse.error("无权限访问");
            }
            
            List<User> users = userService.findAll();
            
            // 应用筛选条件
            if (role != null && !role.isEmpty()) {
                users = users.stream()
                    .filter(user -> role.equals(user.getRole()))
                    .collect(Collectors.toList());
            }
            
            // 构建导出数据
            List<Map<String, Object>> exportData = users.stream().map(user -> {
                Map<String, Object> userData = new HashMap<>();
                userData.put("用户名", user.getUsername());
                userData.put("角色", getRoleDisplayName(user.getRole()));
                userData.put("注册时间", user.getCreatedAt() != null ? 
                    user.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : "");
                userData.put("最后登录", user.getLastLogin() != null ? 
                    user.getLastLogin().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : "从未登录");
                userData.put("在线状态", onlineUserService.isUserOnline(user.getId()) ? "在线" : "离线");
                return userData;
            }).collect(Collectors.toList());
            
            return ApiResponse.success("导出成功", exportData);
        } catch (Exception e) {
            return ApiResponse.error("导出失败：" + e.getMessage());
        }
    }
    
    private String getRoleDisplayName(String role) {
        switch (role) {
            case "teacher":
                return "教师";
            case "student":
                return "学生";
            case "admin":
                return "管理员";
            default:
                return role;
        }
    }
} 