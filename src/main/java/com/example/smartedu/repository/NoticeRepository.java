package com.example.smartedu.repository;

import com.example.smartedu.entity.Notice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoticeRepository extends JpaRepository<Notice, Long> {
    List<Notice> findByCourseId(Long courseId);
    List<Notice> findByCourseIdOrderByCreatedAtDesc(Long courseId);
} 