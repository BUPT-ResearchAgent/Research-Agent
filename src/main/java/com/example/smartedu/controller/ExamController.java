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
import java.util.Map;

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
            System.out.println("🚀 Controller接收到生成考试请求");
            System.out.println("📝 请求中的title: " + request.getTitle());
            System.out.println("📚 请求中的courseId: " + request.getCourseId());
            
            Exam exam = examService.generateExam(request);
            
            System.out.println("✅ 考试生成成功，ID: " + exam.getId());
            System.out.println("📋 生成的考试标题: " + exam.getTitle());
            
            ExamDTO examDTO = new ExamDTO(exam);
            return ApiResponse.success("考试生成成功", examDTO);
        } catch (Exception e) {
            System.err.println("❌ 生成考试失败: " + e.getMessage());
            e.printStackTrace();
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
     * 发布考试并设置时间
     */
    @PostMapping("/{examId}/publish-with-time")
    public ApiResponse<String> publishExamWithTime(@PathVariable Long examId, @RequestBody Map<String, Object> request) {
        try {
            // 检查是否是取消定时发布的请求
            Boolean cancelSchedule = (Boolean) request.get("cancelSchedule");
            if (cancelSchedule != null && cancelSchedule) {
                examService.cancelScheduledPublish(examId);
                return ApiResponse.success("定时发布已取消");
            }
            
            String startTimeStr = (String) request.get("startTime");
            
            java.time.LocalDateTime startTime = null;
            java.time.LocalDateTime endTime = null;
            
            // 解析开始时间
            if (startTimeStr != null && !startTimeStr.isEmpty()) {
                startTime = java.time.LocalDateTime.parse(startTimeStr);
            }
            
            // 如果设置了开始时间，根据考试时长自动计算结束时间
            if (startTime != null) {
                // 获取考试信息以获取考试时长
                Exam exam = examService.getExamById(examId);
                
                // 从请求中获取duration，如果没有则使用试卷默认时长
                Integer duration = (Integer) request.get("duration");
                if (duration != null && duration > 0) {
                    // 更新试卷的时长
                    exam.setDuration(duration);
                    examService.updateExamDuration(examId, duration);
                    endTime = startTime.plusMinutes(duration);
                } else if (exam.getDuration() != null) {
                    endTime = startTime.plusMinutes(exam.getDuration());
                }
            }
            
            examService.publishExamWithTime(examId, startTime, endTime);
            return ApiResponse.success("考试发布成功，已设置考试时间");
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
     * 获取考试统计数据
     */
    @GetMapping("/stats")
    public ApiResponse<Map<String, Object>> getExamStats(@RequestParam Long teacherId) {
        try {
            Map<String, Object> stats = examService.getExamStatsByTeacher(teacherId);
            return ApiResponse.success("获取考试统计数据成功", stats);
        } catch (Exception e) {
            return ApiResponse.error("获取考试统计数据失败：" + e.getMessage());
        }
    }
    
    /**
     * 生成题目的能力培养目标
     */
    @PostMapping("/question/{questionId}/capability-goals")
    public ApiResponse<String> generateQuestionCapabilityGoals(@PathVariable Long questionId) {
        try {
            String capabilityGoals = examService.generateQuestionCapabilityGoals(questionId);
            return ApiResponse.success("生成成功", capabilityGoals);
        } catch (Exception e) {
            return ApiResponse.error("生成失败：" + e.getMessage());
        }
    }
    
    /**
     * 获取学生能力雷达图数据
     */
    @GetMapping("/{examId}/capability-radar/{studentId}")
    public ApiResponse<Map<String, Object>> getStudentCapabilityRadarData(@PathVariable Long examId, @PathVariable Long studentId) {
        try {
            Map<String, Object> radarData = examService.getStudentCapabilityRadarData(examId, studentId);
            return ApiResponse.success("获取成功", radarData);
        } catch (Exception e) {
            return ApiResponse.error("获取失败：" + e.getMessage());
        }
    }
    
    /**
     * 获取全班平均能力雷达图数据
     */
    @GetMapping("/{examId}/capability-radar/class-average")
    public ApiResponse<Map<String, Object>> getClassAverageCapabilityRadarData(@PathVariable Long examId) {
        try {
            Map<String, Object> radarData = examService.getClassAverageCapabilityRadarData(examId);
            return ApiResponse.success("获取成功", radarData);
        } catch (Exception e) {
            return ApiResponse.error("获取失败：" + e.getMessage());
        }
    }
    
    /**
     * 获取考试的参与学生列表
     */
    @GetMapping("/{examId}/participants")
    public ApiResponse<List<Map<String, Object>>> getExamParticipants(@PathVariable Long examId) {
        try {
            List<Map<String, Object>> participants = examService.getExamParticipants(examId);
            return ApiResponse.success("获取成功", participants);
        } catch (Exception e) {
            return ApiResponse.error("获取失败：" + e.getMessage());
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