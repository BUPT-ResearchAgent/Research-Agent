package com.example.smartedu.controller;

import com.example.smartedu.dto.ApiResponse;
import com.example.smartedu.entity.JobPosting;
import com.example.smartedu.service.JobPostingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/jobs")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class JobPostingController {

    @Autowired
    private JobPostingService jobPostingService;

    @GetMapping("/latest")
    public ApiResponse<List<JobPosting>> getLatestJobPostings() {
        try {
            List<JobPosting> jobPostings = jobPostingService.getLatestJobPostings();
            return ApiResponse.success("获取最新招聘信息成功", jobPostings);
        } catch (Exception e) {
            return ApiResponse.error("获取最新招聘信息失败：" + e.getMessage());
        }
    }
}

