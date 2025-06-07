package com.example.smartedu.service;

import com.example.smartedu.repository.CourseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Random;

@Service
public class CourseCodeService {
    
    @Autowired
    private CourseRepository courseRepository;
    
    private static final String LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String NUMBERS = "0123456789";
    private static final Random random = new SecureRandom();
    
    /**
     * 生成唯一的课程代码
     * 格式：SE-XXXX (SE代表SmartEdu，后面跟4位随机字母数字组合)
     */
    public String generateUniqueCourseCode() {
        String courseCode;
        int attempts = 0;
        final int maxAttempts = 100;
        
        do {
            courseCode = generateCourseCode();
            attempts++;
            
            if (attempts > maxAttempts) {
                // 如果尝试次数过多，使用时间戳确保唯一性
                courseCode = "SE-" + System.currentTimeMillis() % 10000;
                break;
            }
        } while (courseRepository.existsByCourseCode(courseCode));
        
        return courseCode;
    }
    
    /**
     * 生成课程代码
     */
    private String generateCourseCode() {
        StringBuilder code = new StringBuilder("SE-");
        
        // 生成4位随机字符（2位字母 + 2位数字）
        for (int i = 0; i < 2; i++) {
            code.append(LETTERS.charAt(random.nextInt(LETTERS.length())));
        }
        for (int i = 0; i < 2; i++) {
            code.append(NUMBERS.charAt(random.nextInt(NUMBERS.length())));
        }
        
        return code.toString();
    }
    
    /**
     * 验证课程代码格式
     */
    public boolean isValidCourseCode(String courseCode) {
        if (courseCode == null || courseCode.length() != 7) {
            return false;
        }
        
        if (!courseCode.startsWith("SE-")) {
            return false;
        }
        
        String suffix = courseCode.substring(3);
        if (suffix.length() != 4) {
            return false;
        }
        
        // 检查格式：2位字母 + 2位数字
        for (int i = 0; i < 2; i++) {
            if (!Character.isLetter(suffix.charAt(i))) {
                return false;
            }
        }
        for (int i = 2; i < 4; i++) {
            if (!Character.isDigit(suffix.charAt(i))) {
                return false;
            }
        }
        
        return true;
    }
} 