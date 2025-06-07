package com.example.smartedu.controller;

import com.example.smartedu.dto.ApiResponse;
import com.example.smartedu.dto.ExamGenerationRequest;
import com.example.smartedu.entity.Exam;
import com.example.smartedu.entity.Question;
import com.example.smartedu.service.ExamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exam")
@CrossOrigin(origins = "*")
public class ExamController {
    
    @Autowired
    private ExamService examService;
    
    /**
     * 生成考试
     */
    @PostMapping("/generate")
    public ApiResponse<Exam> generateExam(@RequestBody ExamGenerationRequest request) {
        try {
            Exam exam = examService.generateExam(request);
            return ApiResponse.success("考试生成成功", exam);
        } catch (Exception e) {
            return ApiResponse.error("生成考试失败：" + e.getMessage());
        }
    }
    
    /**
     * 获取考试详情
     */
    @GetMapping("/{examId}")
    public ApiResponse<Exam> getExamDetails(@PathVariable Long examId) {
        try {
            Exam exam = examService.getExamById(examId);
            return ApiResponse.success(exam);
        } catch (Exception e) {
            return ApiResponse.error("获取考试详情失败：" + e.getMessage());
        }
    }
    
    /**
     * 获取考试题目
     */
    @GetMapping("/{examId}/questions")
    public ApiResponse<List<Question>> getExamQuestions(@PathVariable Long examId) {
        try {
            List<Question> questions = examService.getExamQuestions(examId);
            return ApiResponse.success(questions);
        } catch (Exception e) {
            return ApiResponse.error("获取考试题目失败：" + e.getMessage());
        }
    }
    
    /**
     * 发布考试
     */
    @PostMapping("/{examId}/publish")
    public ApiResponse<String> publishExam(@PathVariable Long examId) {
        try {
            examService.publishExam(examId);
            return ApiResponse.success("考试发布成功");
        } catch (Exception e) {
            return ApiResponse.error("发布考试失败：" + e.getMessage());
        }
    }
    
    /**
     * 发布答案和解析
     */
    @PostMapping("/{examId}/publish-answers")
    public ApiResponse<String> publishAnswers(@PathVariable Long examId) {
        try {
            examService.publishAnswers(examId);
            return ApiResponse.success("答案发布成功");
        } catch (Exception e) {
            return ApiResponse.error("发布答案失败：" + e.getMessage());
        }
    }
} 