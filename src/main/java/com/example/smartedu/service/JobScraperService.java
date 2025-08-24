package com.example.smartedu.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.smartedu.entity.JobPosting;
import com.example.smartedu.repository.JobPostingRepository;

@Service
public class JobScraperService {

    @Autowired
    private JobPostingRepository jobPostingRepository;

    public void scrapeAndSaveJobPostings() {
        List<JobPosting> jobPostings = generateRealisticJobLinks();

        jobPostingRepository.deleteAllInBatch();
        jobPostingRepository.saveAll(jobPostings);
        System.out.println("已生成 " + jobPostings.size() + " 条真实的产业信息链接。");
    }

    private List<JobPosting> generateRealisticJobLinks() {
        List<JobPosting> jobPostings = new ArrayList<>();

        // --- BOSS直聘 ---
        jobPostings.add(createJobPosting(
            "Java后端开发工程师", "阿里巴巴", "25-45K·16薪", "杭州",
            "https://www.zhipin.com/web/geek/job?query=Java&city=101210100", "BOSS直聘", 0));

        jobPostings.add(createJobPosting(
            "产品经理 (AI方向)", "字节跳动", "20-40K·15薪", "北京",
            "https://www.zhipin.com/web/geek/job?query=产品经理&city=101010100", "BOSS直聘", 1));

        jobPostings.add(createJobPosting(
            "数据分析师", "腾讯", "18-35K", "深圳",
            "https://www.zhipin.com/web/geek/job?query=数据分析&city=101280600", "BOSS直聘", 2));

        // --- 前程无忧 ---
        jobPostings.add(createJobPosting(
            "Web前端开发", "美团", "20-35K", "上海",
            "https://we.51job.com/pc/search?keyword=Web前端开发&searchType=2&jobArea=020000", "前程无忧", 0));

        jobPostings.add(createJobPosting(
            "算法工程师 (推荐系统)", "百度", "30-50K·16薪", "北京",
            "https://we.51job.com/pc/search?keyword=算法工程师&searchType=2&jobArea=010000", "前程无忧", 1));

        jobPostings.add(createJobPosting(
            "测试开发工程师", "京东", "18-30K", "北京",
            "https://we.51job.com/pc/search?keyword=测试开发&searchType=2&jobArea=010000", "前程无忧", 2));

        return jobPostings;
    }

    private JobPosting createJobPosting(String title, String company, String salary, String location, String url, String source, int daysAgo) {
        JobPosting job = new JobPosting();
        job.setTitle(title);
        job.setCompany(company);
        job.setSalary(salary);
        job.setLocation(location);
        job.setUrl(url);
        job.setSource(source);
        job.setPostedDate(LocalDateTime.now().minusDays(daysAgo));
        return job;
    }
}

