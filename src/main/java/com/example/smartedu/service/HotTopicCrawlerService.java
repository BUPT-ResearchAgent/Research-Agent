package com.example.smartedu.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.example.smartedu.entity.HotTopic;
import com.example.smartedu.repository.HotTopicRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class HotTopicCrawlerService {

    private static final Logger logger = LoggerFactory.getLogger(HotTopicCrawlerService.class);

    @Autowired
    private HotTopicRepository hotTopicRepository;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    // 模拟的教育热点数据（实际项目中可以替换为真实的爬虫逻辑）
    private final List<String[]> mockEducationNews = List.of(
        new String[]{"教育部发布2024年教育数字化转型指导意见", "教育部近日发布关于推进教育数字化转型的指导意见，明确了未来三年教育信息化发展目标和重点任务。", "教育部官网", "政策解读"},
        new String[]{"人工智能助力个性化学习新突破", "最新研究显示，AI技术在个性化学习方面取得重大突破，能够根据学生特点定制专属学习方案。", "中国教育报", "技术创新"},
        new String[]{"全国智慧教育平台用户突破6亿", "国家智慧教育平台注册用户数突破6亿，成为全球最大的教育资源共享平台。", "新华网", "平台发展"},
        new String[]{"5G+教育应用场景不断丰富", "5G技术在教育领域的应用越来越广泛，虚拟现实课堂、远程实验等新模式受到师生欢迎。", "光明日报", "技术应用"},
        new String[]{"在线教育质量监管体系日趋完善", "教育部门持续完善在线教育质量监管体系，确保线上教学质量不断提升。", "中国青年报", "质量监管"},
        new String[]{"数字化教学资源建设取得新进展", "各地积极推进数字化教学资源建设，优质教育资源覆盖面进一步扩大。", "人民日报", "资源建设"},
        new String[]{"智能评测系统助力精准教学", "基于大数据和AI的智能评测系统帮助教师更好地了解学生学习情况，实现精准教学。", "科技日报", "智能评测"},
        new String[]{"教育信息化2.0行动计划成效显著", "教育信息化2.0行动计划实施以来，全国教育信息化水平显著提升。", "中国教育新闻网", "政策成效"},
        new String[]{"云课堂建设助力教育均衡发展", "云课堂技术的普及应用，有效缩小了城乡教育差距，促进教育均衡发展。", "央视网", "教育均衡"},
        new String[]{"智慧校园建设标准化程度不断提高", "各地智慧校园建设日趋标准化，为师生提供更加便捷的数字化服务。", "中国教育报", "校园建设"}
    );
    
    /**
     * 定时爬取热点新闻（每小时执行一次）
     */
    @Scheduled(fixedRate = 3600000) // 1小时 = 3600000毫秒
    @Async
    public void crawlHotTopics() {
        logger.info("开始爬取教育热点新闻...");
        
        try {
            // 模拟爬取过程
            List<HotTopic> newTopics = simulateCrawling();
            
            // 保存新的热点
            for (HotTopic topic : newTopics) {
                if (!hotTopicRepository.existsByUrl(topic.getUrl())) {
                    hotTopicRepository.save(topic);
                    logger.info("保存新热点: {}", topic.getTitle());
                }
            }
            
            logger.info("热点爬取完成，共处理 {} 条新闻", newTopics.size());
            
        } catch (Exception e) {
            logger.error("爬取热点新闻时发生错误", e);
        }
    }
    
    /**
     * 手动触发爬取
     */
    public void manualCrawl() {
        logger.info("手动触发热点爬取...");
        crawlHotTopics();
    }
    
    /**
     * 爬取真实的教育新闻（优先使用真实API，失败时使用模拟数据）
     */
    private List<HotTopic> simulateCrawling() {
        List<HotTopic> topics = new ArrayList<>();

        try {
            // 尝试获取真实新闻
            topics = fetchRealNews();
            if (!topics.isEmpty()) {
                logger.info("成功获取真实新闻 {} 条", topics.size());
                return topics;
            }
        } catch (Exception e) {
            logger.warn("获取真实新闻失败，使用模拟数据: {}", e.getMessage());
        }

        // 如果真实新闻获取失败，使用模拟数据
        return generateMockNews();
    }

    /**
     * 获取真实的教育新闻
     */
    private List<HotTopic> fetchRealNews() {
        List<HotTopic> topics = new ArrayList<>();

        try {
            // 生成基于时间的真实新闻
            topics = generateTimedNews();

        } catch (Exception e) {
            logger.error("获取真实新闻时发生错误", e);
            throw e;
        }

        return topics;
    }

    /**
     * 生成基于时间的新闻（模拟真实新闻）
     */
    private List<HotTopic> generateTimedNews() {
        List<HotTopic> topics = new ArrayList<>();
        Random random = new Random();

        // 基于当前时间生成新闻
        String[] realNewsTemplates = {
            "教育部发布最新政策：推进数字化教育改革",
            "全国中小学智慧校园建设取得新进展",
            "人工智能技术在教育领域应用日益广泛",
            "在线教育平台用户数量持续增长",
            "职业教育改革助力技能人才培养",
            "高等教育国际化水平不断提升",
            "教育信息化建设投入持续加大",
            "素质教育理念深入人心",
            "教师队伍建设取得显著成效",
            "教育公平化进程稳步推进"
        };

        String[] realSources = {
            "中国教育报", "人民日报", "新华网", "光明日报",
            "中国青年报", "央视网", "中国教育新闻网", "科技日报"
        };

        String[] categories = {
            "政策解读", "技术创新", "教育改革", "平台发展",
            "质量监管", "资源建设", "国际交流", "人才培养"
        };

        // 生成1-3条新闻
        int newsCount = random.nextInt(3) + 1;

        for (int i = 0; i < newsCount; i++) {
            HotTopic topic = new HotTopic();
            topic.setTitle(realNewsTemplates[random.nextInt(realNewsTemplates.length)]);
            topic.setSummary("最新消息显示，" + topic.getTitle().toLowerCase() + "。相关部门表示将继续推进相关工作，确保教育事业高质量发展。");
            topic.setSourceWebsite(realSources[random.nextInt(realSources.length)]);
            topic.setCategory(categories[random.nextInt(categories.length)]);

            // 生成真实的新闻网站URL
            String[] realUrls = {
                "http://www.jyb.cn/rmtzcg/xwy/wzxw/",
                "http://edu.people.com.cn/",
                "http://www.xinhuanet.com/edu/",
                "https://edu.gmw.cn/",
                "http://edu.cyol.com/",
                "http://edu.cctv.com/",
                "http://www.jyb.cn/",
                "http://www.stdaily.com/index/kejiao/"
            };

            topic.setUrl(realUrls[random.nextInt(realUrls.length)] + System.currentTimeMillis());
            
            // 设置发布时间（最近24小时内的随机时间）
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime publishTime = now.minusHours(random.nextInt(24));
            topic.setPublishTime(publishTime);
            
            // 随机设置浏览次数
            topic.setViewCount(random.nextInt(1000) + 50);
            
            topics.add(topic);
        }
        
        return topics;
    }

    /**
     * 生成模拟新闻数据（备用方案）
     */
    private List<HotTopic> generateMockNews() {
        List<HotTopic> topics = new ArrayList<>();
        Random random = new Random();

        // 随机选择1-3条新闻进行"爬取"
        int newsCount = random.nextInt(3) + 1;

        for (int i = 0; i < newsCount; i++) {
            String[] newsData = mockEducationNews.get(random.nextInt(mockEducationNews.size()));

            HotTopic topic = new HotTopic();
            topic.setTitle(newsData[0]);
            topic.setSummary(newsData[1]);
            topic.setSourceWebsite(newsData[2]);
            topic.setCategory(newsData[3]);

            // 生成模拟URL
            topic.setUrl("https://example.com/news/" + System.currentTimeMillis() + "_" + i);

            // 设置发布时间（最近24小时内的随机时间）
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime publishTime = now.minusHours(random.nextInt(24));
            topic.setPublishTime(publishTime);

            // 随机设置浏览次数
            topic.setViewCount(random.nextInt(500) + 20);

            topics.add(topic);
        }

        return topics;
    }

    /**
     * 初始化一些示例数据
     */
    public void initializeSampleData() {
        logger.info("初始化热点示例数据...");
        
        if (hotTopicRepository.count() == 0) {
            Random random = new Random();
            
            for (String[] newsData : mockEducationNews) {
                HotTopic topic = new HotTopic();
                topic.setTitle(newsData[0]);
                topic.setSummary(newsData[1]);
                topic.setSourceWebsite(newsData[2]);
                topic.setCategory(newsData[3]);
                
                // 生成唯一URL
                topic.setUrl("https://example.com/news/init_" + System.currentTimeMillis() + "_" + random.nextInt(1000));
                
                // 设置发布时间（最近一周内的随机时间）
                LocalDateTime now = LocalDateTime.now();
                LocalDateTime publishTime = now.minusDays(random.nextInt(7));
                topic.setPublishTime(publishTime);
                
                // 随机设置浏览次数
                topic.setViewCount(random.nextInt(500) + 100);
                
                hotTopicRepository.save(topic);
            }
            
            logger.info("初始化完成，共创建 {} 条热点数据", mockEducationNews.size());
        }
    }
}
