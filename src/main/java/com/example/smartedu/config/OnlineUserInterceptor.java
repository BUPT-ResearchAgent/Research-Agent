package com.example.smartedu.config;

import com.example.smartedu.service.OnlineUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@Component
public class OnlineUserInterceptor implements HandlerInterceptor {
    
    @Autowired
    private OnlineUserService onlineUserService;
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        HttpSession session = request.getSession(false);
        if (session != null) {
            Long userId = (Long) session.getAttribute("userId");
            if (userId != null) {
                // 更新用户活跃时间
                onlineUserService.updateUserActivity(userId);
            }
        }
        return true;
    }
} 