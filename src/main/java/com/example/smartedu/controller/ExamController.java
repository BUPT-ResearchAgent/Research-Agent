package com.example.smartedu.controller;

import com.example.smartedu.dto.ApiResponse;
import com.example.smartedu.dto.ExamDTO;
import com.example.smartedu.dto.ExamGenerationRequest;
import com.example.smartedu.dto.ExamListDTO;
import com.example.smartedu.entity.Exam;
import com.example.smartedu.entity.Question;
import com.example.smartedu.service.ExamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exam")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class ExamController {
    
    @Autowired
    private ExamService examService;
    
    /**
     * 生成考试
     */
    @PostMapping("/generate")
    public ApiResponse<ExamDTO> generateExam(@RequestBody ExamGenerationRequest request) {
        try {
            Exam exam = examService.generateExam(request);
            ExamDTO examDTO = new ExamDTO(exam);
            return ApiResponse.success("考试生成成功", examDTO);
        } catch (Exception e) {
            return ApiResponse.error("生成考试失败：" + e.getMessage());
        }
    }
    
    /**
     * 获取考试详情
     */
    @GetMapping("/{examId}")
    public ApiResponse<ExamDTO> getExamDetails(@PathVariable Long examId) {
        try {
            Exam exam = examService.getExamById(examId);
            ExamDTO examDTO = new ExamDTO(exam);
            return ApiResponse.success(examDTO);
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
     * 更新考试
     */
    @PutMapping("/{examId}")
    public ApiResponse<ExamDTO> updateExam(@PathVariable Long examId, @RequestBody String content) {
        try {
            Exam exam = examService.updateExamContent(examId, content);
            ExamDTO examDTO = new ExamDTO(exam);
            return ApiResponse.success("考试更新成功", examDTO);
        } catch (Exception e) {
            return ApiResponse.error("更新考试失败：" + e.getMessage());
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
    
    /**
     * 获取教师的试卷列表
     */
    @GetMapping("/list")
    public ApiResponse<List<ExamListDTO>> getExamList(@RequestParam Long teacherId,
                                                      @RequestParam(required = false) String status,
                                                      @RequestParam(required = false) String search) {
        try {
            List<ExamListDTO> examList = examService.getExamListByTeacher(teacherId, status, search);
            return ApiResponse.success("获取试卷列表成功", examList);
        } catch (Exception e) {
            return ApiResponse.error("获取试卷列表失败：" + e.getMessage());
        }
    }
    
    /**
     * 删除试卷
     */
    @DeleteMapping("/{examId}")
    public ApiResponse<String> deleteExam(@PathVariable Long examId) {
        try {
            examService.deleteExam(examId);
            return ApiResponse.success("试卷删除成功");
        } catch (Exception e) {
            return ApiResponse.error("删除试卷失败：" + e.getMessage());
        }
    }
} 