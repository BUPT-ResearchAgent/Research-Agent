package com.example.smartedu.config;

import com.example.smartedu.service.HotTopicCrawlerService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class StartupInitializer implements ApplicationRunner {
    
    private static final Logger logger = LoggerFactory.getLogger(StartupInitializer.class);
    
    @Autowired
    private HotTopicCrawlerService hotTopicCrawlerService;
    
    @Override
    public void run(ApplicationArguments args) throws Exception {
        logger.info("=== 应用启动初始化开始 ===");
        
        try {
            // 初始化热点示例数据
            logger.info("初始化热点推送数据...");
            hotTopicCrawlerService.initializeSampleData();
            
            logger.info("=== 应用启动初始化完成 ===");
        } catch (Exception e) {
            logger.error("应用启动初始化失败", e);
        }
    }
}
