package com.example.smartedu.dto;

import java.util.List;
import java.util.Map;

/**
 * 考试提交DTO
 */
public class ExamSubmissionDTO {
    private Long examId;
    private Long studentId;
    private List<AnswerSubmission> answers;
    private Integer durationMinutes; // 实际用时
    
    public static class AnswerSubmission {
        private Long questionId;
        private String answer;
        
        public AnswerSubmission() {}
        
        public AnswerSubmission(Long questionId, String answer) {
            this.questionId = questionId;
            this.answer = answer;
        }
        
        public Long getQuestionId() { return questionId; }
        public void setQuestionId(Long questionId) { this.questionId = questionId; }
        
        public String getAnswer() { return answer; }
        public void setAnswer(String answer) { this.answer = answer; }
    }
    
    public ExamSubmissionDTO() {}
    
    public Long getExamId() { return examId; }
    public void setExamId(Long examId) { this.examId = examId; }
    
    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }
    
    public List<AnswerSubmission> getAnswers() { return answers; }
    public void setAnswers(List<AnswerSubmission> answers) { this.answers = answers; }
    
    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
} 