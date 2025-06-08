package com.example.smartedu.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;

@Entity
@Table(name = "student_answers")
public class StudentAnswer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    @JsonIgnore
    private Student student;
    
    @Column(name = "student_id", insertable = false, updatable = false)
    private Long studentId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    @JsonIgnore
    private Question question;
    
    @Column(name = "question_id", insertable = false, updatable = false)
    private Long questionId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_result_id")
    @JsonIgnore
    private ExamResult examResult;
    
    @Column(name = "exam_result_id", insertable = false, updatable = false)
    private Long examResultId;
    
    @Column(columnDefinition = "TEXT")
    private String answer; // 学生答案
    
    private Integer score; // 得分
    
    private Integer maxScore; // 该题满分
    
    @Column(name = "is_correct")
    private Boolean isCorrect; // 是否正确
    
    @Column(name = "answer_time")
    private LocalDateTime answerTime; // 答题时间
    
    @Column(name = "ai_feedback", columnDefinition = "TEXT")
    private String aiFeedback; // AI反馈
    
    @Column(name = "teacher_feedback", columnDefinition = "TEXT")
    private String teacherFeedback; // 教师反馈
    
    public StudentAnswer() {
        this.answerTime = LocalDateTime.now();
    }
    
    public StudentAnswer(Student student, Question question, ExamResult examResult) {
        this();
        this.student = student;
        this.question = question;
        this.examResult = examResult;
    }
    
    // Getter和Setter方法
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Student getStudent() {
        return student;
    }
    
    public void setStudent(Student student) {
        this.student = student;
    }
    
    public Long getStudentId() {
        return studentId;
    }
    
    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }
    
    public Question getQuestion() {
        return question;
    }
    
    public void setQuestion(Question question) {
        this.question = question;
    }
    
    public Long getQuestionId() {
        return questionId;
    }
    
    public void setQuestionId(Long questionId) {
        this.questionId = questionId;
    }
    
    public ExamResult getExamResult() {
        return examResult;
    }
    
    public void setExamResult(ExamResult examResult) {
        this.examResult = examResult;
    }
    
    public Long getExamResultId() {
        return examResultId;
    }
    
    public void setExamResultId(Long examResultId) {
        this.examResultId = examResultId;
    }
    
    public String getAnswer() {
        return answer;
    }
    
    public void setAnswer(String answer) {
        this.answer = answer;
    }
    
    public Integer getScore() {
        return score;
    }
    
    public void setScore(Integer score) {
        this.score = score;
    }
    
    public Integer getMaxScore() {
        return maxScore;
    }
    
    public void setMaxScore(Integer maxScore) {
        this.maxScore = maxScore;
    }
    
    public Boolean getIsCorrect() {
        return isCorrect;
    }
    
    public void setIsCorrect(Boolean isCorrect) {
        this.isCorrect = isCorrect;
    }
    
    public LocalDateTime getAnswerTime() {
        return answerTime;
    }
    
    public void setAnswerTime(LocalDateTime answerTime) {
        this.answerTime = answerTime;
    }
    
    public String getAiFeedback() {
        return aiFeedback;
    }
    
    public void setAiFeedback(String aiFeedback) {
        this.aiFeedback = aiFeedback;
    }
    
    public String getTeacherFeedback() {
        return teacherFeedback;
    }
    
    public void setTeacherFeedback(String teacherFeedback) {
        this.teacherFeedback = teacherFeedback;
    }
} 