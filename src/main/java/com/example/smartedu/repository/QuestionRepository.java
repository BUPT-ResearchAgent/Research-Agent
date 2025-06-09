package com.example.smartedu.repository;

import com.example.smartedu.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {
    @Query("SELECT q FROM Question q WHERE q.exam.id = :examId")
    List<Question> findByExamId(@Param("examId") Long examId);
} 