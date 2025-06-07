package com.example.smartedu.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {
    
    /**
     * 根路径重定向到主页
     */
    @GetMapping("/")
    public String home() {
        return "redirect:/SmartEdu.html";
    }
    
    /**
     * 处理其他可能的主页访问路径
     */
    @GetMapping("/index")
    public String index() {
        return "redirect:/SmartEdu.html";
    }
    
    @GetMapping("/home")
    public String homePage() {
        return "redirect:/SmartEdu.html";
    }
} 