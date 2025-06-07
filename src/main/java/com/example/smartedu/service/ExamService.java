package com.example.smartedu.service;

import com.example.smartedu.dto.ExamGenerationRequest;
import com.example.smartedu.entity.*;
import com.example.smartedu.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ExamService {
    
    @Autowired
    private ExamRepository examRepository;
    
    @Autowired
    private QuestionRepository questionRepository;
    
    /**
     * 生成考试
     */
    public Exam generateExam(ExamGenerationRequest request) {
        // 简化实现，创建基本考试
        Exam exam = new Exam();
        exam.setTitle(request.getTitle());
        exam.setChapter(request.getChapter());
        exam.setDuration(request.getDuration());
        exam.setStartTime(request.getStartTime());
        exam.setEndTime(request.getStartTime().plusMinutes(request.getDuration()));
        
        return examRepository.save(exam);
    }
    
    /**
     * 获取考试详情
     */
    public Exam getExamById(Long examId) {
        return examRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("考试不存在"));
    }
    
    /**
     * 获取考试题目
     */
    public List<Question> getExamQuestions(Long examId) {
        return questionRepository.findByExamId(examId);
    }
    
    /**
     * 发布考试
     */
    public void publishExam(Long examId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("考试不存在"));
        
        exam.setIsPublished(true);
        examRepository.save(exam);
    }
    
    /**
     * 发布答案和解析
     */
    public void publishAnswers(Long examId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("考试不存在"));
        
        exam.setIsAnswerPublished(true);
        examRepository.save(exam);
    }
} 