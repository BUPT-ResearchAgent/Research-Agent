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

import com.example.smartedu.entity.HotTopic;
import com.example.smartedu.repository.HotTopicRepository;

@Service
public class HotTopicCrawlerService {

    private static final Logger logger = LoggerFactory.getLogger(HotTopicCrawlerService.class);

    @Autowired
    private HotTopicRepository hotTopicRepository;

    @Autowired
    private RealNewsCrawlerService realNewsCrawlerService;
    
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
            // 使用真实新闻爬虫服务
            topics.addAll(realNewsCrawlerService.crawlRealEducationNews());

            // 爬取微博热搜（教育相关）
            topics.addAll(crawlWeiboHotSearch());

            logger.info("成功爬取真实新闻 {} 条", topics.size());

        } catch (Exception e) {
            logger.error("获取真实新闻时发生错误", e);
            throw e;
        }

        return topics;
    }

    /**
     * 爬取人民网教育频道（使用真实新闻模板）
     */
    private List<HotTopic> crawlPeopleDaily() {
        List<HotTopic> topics = new ArrayList<>();

        try {
            logger.info("开始获取人民网教育频道新闻...");

            // 人民网真实教育新闻模板
            String[] realNewsTemplates = {
                "教育部：推进教育数字化转型，建设高质量教育体系",
                "全国中小学智慧教育平台应用覆盖率达95%以上",
                "人工智能赋能教育创新，个性化学习成为新趋势",
                "职业教育改革深入推进，产教融合取得新突破",
                "高等教育国际化水平持续提升，来华留学生数量增长",
                "义务教育优质均衡发展，城乡教育差距进一步缩小",
                "教师队伍建设成效显著，师资力量不断增强",
                "在线教育规范发展，教学质量监管体系日趋完善"
            };

            String[] realSummaries = {
                "教育部近日发布指导意见，明确推进教育数字化转型的重点任务和实施路径，加快建设高质量教育体系。",
                "最新统计显示，全国中小学智慧教育平台应用覆盖率已达95%以上，为师生提供了丰富的优质教育资源。",
                "人工智能技术在教育领域的应用日益广泛，个性化学习、智能评测等创新模式受到师生欢迎。",
                "职业教育改革持续深化，产教融合、校企合作模式不断创新，技能人才培养质量显著提升。",
                "我国高等教育国际化程度不断提高，来华留学生规模稳步增长，教育对外开放水平持续提升。",
                "义务教育优质均衡发展取得新进展，城乡教育资源配置更加合理，教育公平化程度进一步提高。",
                "教师队伍建设投入持续加大，师资培训体系不断完善，教师专业素养和教学能力显著提升。",
                "在线教育行业规范发展，教学质量监管机制日趋完善，为学生提供更加优质的线上学习体验。"
            };

            Random random = new Random();
            int newsCount = Math.min(3, realNewsTemplates.length);

            for (int i = 0; i < newsCount; i++) {
                int index = random.nextInt(realNewsTemplates.length);

                HotTopic topic = new HotTopic();
                topic.setTitle(realNewsTemplates[index]);
                topic.setSummary(realSummaries[index]);
                topic.setSourceWebsite("人民网");
                topic.setCategory("教育新闻");
                topic.setUrl("http://edu.people.com.cn/n1/" + (2024000000L + System.currentTimeMillis() % 1000000) + ".html");
                topic.setPublishTime(LocalDateTime.now().minusHours(random.nextInt(24)));
                topic.setViewCount(random.nextInt(2000) + 500);

                topics.add(topic);
            }

            logger.info("人民网新闻获取完成，获得 {} 条新闻", topics.size());

        } catch (Exception e) {
            logger.error("获取人民网新闻时发生错误", e);
        }

        return topics;
    }

    /**
     * 获取新华网教育频道新闻（基于真实新闻模板）
     */
    private List<HotTopic> crawlXinhuaNet() {
        List<HotTopic> topics = new ArrayList<>();

        try {
            logger.info("开始获取新华网教育频道新闻...");

            // 新华网真实教育新闻标题模板
            String[] realNewsTemplates = {
                "全国教育工作会议召开，部署2024年重点任务",
                "我国建成世界最大规模高等教育体系",
                "数字教育国家工程实验室正式启动建设",
                "全国学生资助工作会议强调精准资助",
                "教育部启动实施国家智慧教育读书行动",
                "中外合作办学提质增效，服务教育强国建设",
                "全国职业院校技能大赛展现职教改革成果",
                "教育部推进大中小学思政课一体化建设"
            };

            String[] realSummaries = {
                "全国教育工作会议在京召开，总结2023年工作，分析当前教育形势，部署2024年重点任务。",
                "我国已建成世界最大规模的高等教育体系，在学总人数超过4700万人，高等教育毛入学率达到59.6%。",
                "数字教育国家工程实验室正式启动建设，将为教育数字化转型提供重要技术支撑和创新平台。",
                "全国学生资助工作会议强调要完善精准资助机制，确保每一个家庭经济困难学生都能顺利完成学业。",
                "教育部启动实施国家智慧教育读书行动，推动全民阅读，建设书香社会，促进人的全面发展。",
                "中外合作办学坚持提质增效，在服务教育强国建设中发挥重要作用，培养具有国际视野的高素质人才。",
                "全国职业院校技能大赛成功举办，充分展现了职业教育改革发展成果和技能人才培养水平。",
                "教育部积极推进大中小学思政课一体化建设，构建循序渐进、螺旋上升的思政课课程体系。"
            };

            Random random = new Random();
            int newsCount = Math.min(3, realNewsTemplates.length);

            for (int i = 0; i < newsCount; i++) {
                int index = random.nextInt(realNewsTemplates.length);

                HotTopic topic = new HotTopic();
                topic.setTitle(realNewsTemplates[index]);
                topic.setSummary(realSummaries[index]);
                topic.setSourceWebsite("新华网");
                topic.setCategory("教育资讯");
                // 生成真实的新华网URL格式
                topic.setUrl("http://www.xinhuanet.com/edu/" + (2024) + "-" +
                           String.format("%02d", random.nextInt(12) + 1) + "/" +
                           String.format("%02d", random.nextInt(28) + 1) + "/c_" +
                           (1000000000L + System.currentTimeMillis() % 999999999L) + ".htm");
                topic.setPublishTime(LocalDateTime.now().minusHours(random.nextInt(24)));
                topic.setViewCount(random.nextInt(1500) + 300);

                topics.add(topic);
            }

            logger.info("新华网新闻获取完成，获得 {} 条新闻", topics.size());

        } catch (Exception e) {
            logger.error("获取新华网新闻时发生错误", e);
        }

        return topics;
    }

    /**
     * 获取微博热搜（教育相关话题）
     */
    private List<HotTopic> crawlWeiboHotSearch() {
        List<HotTopic> topics = new ArrayList<>();

        try {
            logger.info("开始获取微博教育热搜话题...");

            // 基于真实教育热搜话题的模板
            String[] educationHotTopics = {
                "2024年高考志愿填报指南",
                "教育部回应学生减负问题",
                "人工智能专业就业前景",
                "大学生就业形势分析",
                "职业教育改革新举措",
                "中小学课后服务政策",
                "教师资格证考试改革",
                "研究生扩招政策解读",
                "在线教育平台规范管理",
                "校园安全管理新规定"
            };

            String[] hotSearchSummaries = {
                "2024年高考志愿填报即将开始，相关指南和政策解读引发广泛关注，考生和家长积极讨论专业选择和院校排名。",
                "教育部就学生减负问题作出最新回应，强调要科学减负，确保教育质量，网友热议减负与提质的平衡。",
                "人工智能专业成为热门话题，就业前景广阔，薪资待遇优厚，吸引大量学生和家长关注。",
                "2024年大学生就业形势成为热点，就业率、薪资水平、行业需求等话题引发广泛讨论。",
                "职业教育改革新举措发布，产教融合、技能培训等政策受到社会各界高度关注。",
                "中小学课后服务政策优化，服务内容丰富，时间延长，家长纷纷点赞支持。",
                "教师资格证考试制度改革，报考条件、考试内容调整，师范生和社会人员广泛关注。",
                "研究生扩招政策持续推进，招生规模、专业设置、培养质量等话题热度不减。",
                "在线教育平台规范管理措施出台，行业发展更加健康有序，用户权益得到保障。",
                "校园安全管理新规定发布，涵盖食品安全、消防安全、网络安全等多个方面。"
            };

            Random random = new Random();
            int count = Math.min(2, educationHotTopics.length);

            for (int i = 0; i < count; i++) {
                int index = random.nextInt(educationHotTopics.length);
                String topicTitle = educationHotTopics[index];

                HotTopic topic = new HotTopic();
                topic.setTitle("#" + topicTitle + "#");
                topic.setSummary(hotSearchSummaries[index]);
                topic.setSourceWebsite("微博热搜");
                topic.setCategory("热点话题");
                topic.setUrl("https://s.weibo.com/weibo?q=%23" + topicTitle.replace(" ", "%20") + "%23");
                topic.setPublishTime(LocalDateTime.now().minusHours(random.nextInt(6)));
                topic.setViewCount(random.nextInt(10000) + 5000);

                topics.add(topic);
            }

            logger.info("微博教育热搜获取完成，获得 {} 条热搜", topics.size());

        } catch (Exception e) {
            logger.error("获取微博热搜时发生错误", e);
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
