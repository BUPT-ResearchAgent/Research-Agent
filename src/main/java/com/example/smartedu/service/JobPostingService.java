package com.example.smartedu.service;

import com.example.smartedu.entity.JobPosting;
import com.example.smartedu.repository.JobPostingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class JobPostingService {

    @Autowired
    private JobPostingRepository jobPostingRepository;

    public List<JobPosting> getLatestJobPostings() {
        return jobPostingRepository.findTop10ByOrderByPostedDateDesc();
    }
}

