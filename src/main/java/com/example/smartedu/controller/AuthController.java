package com.example.smartedu.controller;

import com.example.smartedu.entity.User;
import com.example.smartedu.service.UserService;
import com.example.smartedu.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    
    @Autowired
    private UserService userService;
    
    /**
     * 用户注册
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
     * 用户登录
     */
    @PostMapping("/login")
    public ApiResponse<User> login(@RequestBody Map<String, String> request) {
        try {
            String username = request.get("username");
            String password = request.get("password");
            String role = request.get("role");
            
            if (username == null || password == null || role == null) {
                return ApiResponse.error("请填写完整信息");
            }
            
            User user = userService.login(username, password, role);
            
            // 返回时隐藏密码
            user.setPassword(null);
            return ApiResponse.success("登录成功", user);
        } catch (Exception e) {
            return ApiResponse.error("登录失败：" + e.getMessage());
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
    public ApiResponse<UserService.UserStats> getUserStats() {
        try {
            UserService.UserStats stats = userService.getUserStats();
            return ApiResponse.success("获取统计信息成功", stats);
        } catch (Exception e) {
            return ApiResponse.error("获取统计信息失败：" + e.getMessage());
        }
    }
} 