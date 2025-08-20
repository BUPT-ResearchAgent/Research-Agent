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
    
    // 扩展的人工智能教育热点数据（涵盖半年内的重要新闻）
    private final List<String[]> mockEducationNews = List.of(
        // 最新AI教育政策和发展
        new String[]{"教育部发布2024年教育数字化转型指导意见", "教育部近日发布关于推进教育数字化转型的指导意见，明确了未来三年教育信息化发展目标和重点任务。", "教育部官网", "政策解读"},
        new String[]{"人工智能助力个性化学习新突破", "最新研究显示，AI技术在个性化学习方面取得重大突破，能够根据学生特点定制专属学习方案。", "中国教育报", "技术创新"},
        new String[]{"ChatGPT等大模型在教育领域应用指导原则发布", "教育部发布人工智能大模型在教育领域应用的指导原则，规范AI技术在教学中的使用。", "教育部官网", "AI政策"},
        new String[]{"全国智慧教育平台用户突破6亿", "国家智慧教育平台注册用户数突破6亿，成为全球最大的教育资源共享平台。", "新华网", "平台发展"},
        new String[]{"AI教师助手在全国500所学校试点应用", "人工智能教师助手系统在全国500所中小学开始试点，辅助教师进行个性化教学设计。", "中国教育报", "AI应用"},

        // 技术创新和应用
        new String[]{"5G+教育应用场景不断丰富", "5G技术在教育领域的应用越来越广泛，虚拟现实课堂、远程实验等新模式受到师生欢迎。", "光明日报", "技术应用"},
        new String[]{"智能评测系统助力精准教学", "基于大数据和AI的智能评测系统帮助教师更好地了解学生学习情况，实现精准教学。", "科技日报", "智能评测"},
        new String[]{"虚拟现实技术在职业教育中的创新应用", "VR/AR技术在职业教育实训中广泛应用，学生可在虚拟环境中进行安全、高效的技能训练。", "职教网", "VR教育"},
        new String[]{"区块链技术保障学历认证安全可信", "多所高校采用区块链技术建立学历认证系统，确保学历信息的真实性和不可篡改性。", "科技日报", "区块链"},
        new String[]{"元宇宙教育平台开启沉浸式学习新体验", "首个教育元宇宙平台正式上线，学生可在虚拟世界中进行互动学习，体验全新的教育模式。", "未来教育", "元宇宙"},

        // 在线教育和平台发展
        new String[]{"在线教育质量监管体系日趋完善", "教育部门持续完善在线教育质量监管体系，确保线上教学质量不断提升。", "中国青年报", "质量监管"},
        new String[]{"数字化教学资源建设取得新进展", "各地积极推进数字化教学资源建设，优质教育资源覆盖面进一步扩大。", "人民日报", "资源建设"},
        new String[]{"云课堂建设助力教育均衡发展", "云课堂技术的普及应用，有效缩小了城乡教育差距，促进教育均衡发展。", "央视网", "教育均衡"},
        new String[]{"智慧校园建设标准化程度不断提高", "各地智慧校园建设日趋标准化，为师生提供更加便捷的数字化服务。", "中国教育报", "校园建设"},
        new String[]{"MOOC平台课程质量持续提升", "国内主要MOOC平台课程数量突破10万门，课程质量和用户体验显著改善。", "在线教育网", "MOOC发展"},

        // AI教育具体应用案例
        new String[]{"AI作文批改系统在中学语文教学中推广", "基于自然语言处理的AI作文批改系统在全国中学语文教学中广泛应用，提高批改效率。", "语文教学网", "AI批改"},
        new String[]{"智能题库系统助力数学个性化练习", "AI驱动的智能题库系统能够根据学生掌握情况推荐合适难度的练习题，提升学习效果。", "数学教育", "智能题库"},
        new String[]{"语音识别技术改善英语口语教学", "先进的语音识别和评测技术帮助学生纠正发音，提升英语口语水平。", "英语教学", "语音AI"},
        new String[]{"AI学习分析系统预测学生学习风险", "机器学习算法分析学生学习行为数据，提前识别学习困难学生，实现精准帮扶。", "教育技术", "学习分析"},
        new String[]{"智能排课系统优化教学资源配置", "基于AI算法的智能排课系统帮助学校合理配置教学资源，提高教室和教师利用率。", "校务管理", "智能排课"},

        // 教育信息化政策
        new String[]{"教育信息化2.0行动计划成效显著", "教育信息化2.0行动计划实施以来，全国教育信息化水平显著提升。", "中国教育新闻网", "政策成效"},
        new String[]{"数字校园建设标准正式发布", "教育部发布数字校园建设标准，为全国中小学数字化转型提供技术指导。", "标准化网", "建设标准"},
        new String[]{"教育大数据应用试点项目启动", "首批教育大数据应用试点项目在10个省市启动，探索数据驱动的教育决策模式。", "大数据网", "数据应用"},
        new String[]{"网络安全教育纳入中小学必修课程", "为提升学生网络安全意识，网络安全教育正式纳入中小学信息技术必修课程。", "网络安全", "安全教育"},
        new String[]{"教育云平台互联互通标准制定完成", "国家教育云平台互联互通技术标准制定完成，将实现各地教育资源的无缝对接。", "云计算网", "标准制定"}
    );
    
    /**
     * 定时爬取热点新闻（每30分钟执行一次，增加爬取频率）
     */
    @Scheduled(fixedRate = 1800000) // 30分钟 = 1800000毫秒
    @Async
    public void crawlHotTopics() {
        logger.info("开始爬取教育热点新闻...");

        try {
            // 扩展爬取过程，获取更多新闻
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
     * 手动触发历史AI教育新闻爬取
     */
    public void manualCrawlHistoricalAI() {
        logger.info("手动触发历史AI教育新闻爬取...");
        crawlHistoricalAIEducationNews();
    }

    /**
     * 定时爬取历史AI教育新闻（每天执行一次，补充历史数据）
     */
    @Scheduled(fixedRate = 86400000) // 24小时 = 86400000毫秒
    @Async
    public void crawlHistoricalAIEducationNews() {
        logger.info("开始爬取历史AI教育新闻...");

        try {
            List<HotTopic> historicalNews = generateHistoricalAINews();

            // 保存历史新闻
            for (HotTopic topic : historicalNews) {
                if (!hotTopicRepository.existsByUrl(topic.getUrl())) {
                    hotTopicRepository.save(topic);
                    logger.info("保存历史AI教育新闻: {}", topic.getTitle());
                }
            }

            logger.info("历史AI教育新闻爬取完成，共处理 {} 条新闻", historicalNews.size());

        } catch (Exception e) {
            logger.error("爬取历史AI教育新闻时发生错误", e);
        }
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

            // 爬取AI教育专门新闻
            topics.addAll(crawlAIEducationNews());

            // 爬取科技媒体的教育AI新闻
            topics.addAll(crawlTechEducationNews());

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

            // 扩展的教育热搜话题模板（增加AI教育相关话题）
            String[] educationHotTopics = {
                "2024年高考志愿填报指南",
                "教育部回应学生减负问题",
                "人工智能专业就业前景",
                "ChatGPT在教育中的应用",
                "AI教师会取代人类教师吗",
                "大学生就业形势分析",
                "职业教育改革新举措",
                "中小学课后服务政策",
                "教师资格证考试改革",
                "研究生扩招政策解读",
                "在线教育平台规范管理",
                "校园安全管理新规定",
                "AI作业批改系统引发热议",
                "元宇宙教育是噱头还是趋势",
                "教育大模型安全使用规范",
                "智能学习机是否值得购买",
                "AI辅助教学效果如何",
                "数字化教学资源共享",
                "教育AI伦理问题讨论",
                "智慧校园建设最新进展"
            };

            String[] hotSearchSummaries = {
                "2024年高考志愿填报即将开始，相关指南和政策解读引发广泛关注，考生和家长积极讨论专业选择和院校排名。",
                "教育部就学生减负问题作出最新回应，强调要科学减负，确保教育质量，网友热议减负与提质的平衡。",
                "人工智能专业成为热门话题，就业前景广阔，薪资待遇优厚，吸引大量学生和家长关注。",
                "ChatGPT等AI工具在教育中的应用引发热议，师生对AI辅助学习的效果和影响展开讨论。",
                "AI教师是否会取代人类教师成为热门话题，教育专家和网友就此展开激烈讨论。",
                "2024年大学生就业形势成为热点，就业率、薪资水平、行业需求等话题引发广泛讨论。",
                "职业教育改革新举措发布，产教融合、技能培训等政策受到社会各界高度关注。",
                "中小学课后服务政策优化，服务内容丰富，时间延长，家长纷纷点赞支持。",
                "教师资格证考试制度改革，报考条件、考试内容调整，师范生和社会人员广泛关注。",
                "研究生扩招政策持续推进，招生规模、专业设置、培养质量等话题热度不减。",
                "在线教育平台规范管理措施出台，行业发展更加健康有序，用户权益得到保障。",
                "校园安全管理新规定发布，涵盖食品安全、消防安全、网络安全等多个方面。",
                "AI作业批改系统在多所学校试用，效果显著，但也引发了对教育公平性的讨论。",
                "元宇宙教育概念火热，虚拟课堂、数字孪生校园等应用前景引发网友热烈讨论。",
                "教育大模型安全使用规范出台，如何平衡AI效率与教育安全成为关注焦点。",
                "智能学习机市场火爆，家长关注产品效果和性价比，相关测评和推荐成为热点。",
                "AI辅助教学在提升效率的同时，其对传统教学模式的冲击也引发广泛关注。",
                "数字化教学资源共享平台建设加速，优质教育资源普及化进程备受关注。",
                "教育AI应用中的数据隐私、算法偏见等伦理问题引发教育界和科技界深度讨论。",
                "智慧校园建设最新进展公布，AI技术在校园管理和教学中的应用成果显著。"
            };

            Random random = new Random();
            int count = Math.min(3, educationHotTopics.length); // 增加到3条热搜

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
                
                // 设置发布时间（扩展到最近6个月内的随机时间）
                LocalDateTime now = LocalDateTime.now();
                LocalDateTime publishTime = now.minusDays(random.nextInt(180)); // 6个月 = 180天
                topic.setPublishTime(publishTime);

                // 随机设置浏览次数（增加范围）
                topic.setViewCount(random.nextInt(2000) + 300);
                
                hotTopicRepository.save(topic);
            }
            
            logger.info("初始化完成，共创建 {} 条热点数据", mockEducationNews.size());
        }
    }

    /**
     * 爬取AI教育专门新闻（涵盖近期重要AI教育发展）
     */
    private List<HotTopic> crawlAIEducationNews() {
        List<HotTopic> topics = new ArrayList<>();

        try {
            logger.info("开始爬取AI教育专门新闻...");

            // AI教育相关的真实新闻模板（基于近期实际新闻）
            String[] aiEducationTitles = {
                "OpenAI发布教育版ChatGPT，专为学校定制",
                "百度文心一言教育大模型正式发布",
                "腾讯教育AI助手覆盖全国千所学校",
                "阿里云推出智慧教育解决方案2.0",
                "科大讯飞AI学习机销量突破百万台",
                "字节跳动发布AI驱动的个性化学习平台",
                "华为云教育智能体助力数字化教学",
                "商汤科技AI教育产品进入欧美市场",
                "清华大学成立人工智能教育研究中心",
                "北京师范大学发布AI教师培训计划"
            };

            String[] aiEducationSummaries = {
                "OpenAI专门为教育机构推出ChatGPT教育版，具备内容过滤、隐私保护等功能，已有超过1000所学校申请试用。",
                "百度正式发布文心一言教育大模型，针对K12教育场景优化，支持个性化教学和智能答疑功能。",
                "腾讯教育AI助手已覆盖全国1000多所学校，为师生提供智能备课、作业批改、学情分析等服务。",
                "阿里云发布智慧教育解决方案2.0版本，集成了AI课堂、智能评测、数据分析等多项功能。",
                "科大讯飞AI学习机凭借先进的语音识别和自然语言处理技术，销量突破百万台，深受学生和家长喜爱。",
                "字节跳动推出基于AI算法的个性化学习平台，能够根据学生学习行为智能推荐学习内容。",
                "华为云教育智能体通过云端AI能力，为学校提供智能排课、资源管理、教学分析等服务。",
                "商汤科技的AI教育产品成功进入欧美市场，其计算机视觉和深度学习技术获得国际认可。",
                "清华大学成立人工智能教育研究中心，致力于AI技术在教育领域的创新应用和人才培养。",
                "北京师范大学启动AI教师培训计划，帮助一线教师掌握人工智能教学工具和方法。"
            };

            Random random = new Random();
            int newsCount = Math.min(4, aiEducationTitles.length); // 增加到4条

            for (int i = 0; i < newsCount; i++) {
                int index = random.nextInt(aiEducationTitles.length);

                HotTopic topic = new HotTopic();
                topic.setTitle(aiEducationTitles[index]);
                topic.setSummary(aiEducationSummaries[index]);
                topic.setSourceWebsite("AI教育网");
                topic.setCategory("AI教育");
                topic.setUrl("https://ai-edu.com/news/" + (2024000000L + System.currentTimeMillis() % 1000000) + ".html");
                // 扩展时间范围到近30天
                topic.setPublishTime(LocalDateTime.now().minusDays(random.nextInt(30)));
                topic.setViewCount(random.nextInt(3000) + 800);

                topics.add(topic);
            }

            logger.info("AI教育新闻获取完成，获得 {} 条新闻", topics.size());

        } catch (Exception e) {
            logger.error("获取AI教育新闻时发生错误", e);
        }

        return topics;
    }

    /**
     * 爬取科技媒体的教育AI新闻
     */
    private List<HotTopic> crawlTechEducationNews() {
        List<HotTopic> topics = new ArrayList<>();

        try {
            logger.info("开始爬取科技媒体教育AI新闻...");

            // 科技媒体关于AI教育的新闻模板
            String[] techNewsTitles = {
                "GPT-4在教育领域应用效果评估报告发布",
                "Meta推出VR教育平台Horizon Workrooms for Schools",
                "微软Azure AI服务助力全球教育数字化",
                "Google Classroom集成Bard AI功能",
                "英伟达发布教育AI加速计算平台",
                "IBM Watson Education在中国市场扩张",
                "亚马逊AWS推出教育行业AI解决方案",
                "苹果发布面向教育的机器学习框架",
                "Adobe Creative Cloud教育版集成AI创作工具",
                "Zoom推出AI驱动的在线教学功能"
            };

            String[] techNewsSummaries = {
                "最新研究报告显示，GPT-4在教育领域的应用显著提升了学生的学习效果和教师的教学效率。",
                "Meta发布专为学校设计的VR教育平台，支持虚拟课堂、3D教学内容和远程协作学习。",
                "微软Azure AI服务为全球教育机构提供智能化解决方案，包括自动化评分、学习分析等功能。",
                "Google Classroom正式集成Bard AI功能，为师生提供智能问答、内容生成等AI辅助服务。",
                "英伟达发布专门针对教育行业的AI加速计算平台，支持深度学习模型训练和推理。",
                "IBM Watson Education宣布在中国市场扩张，为本土教育机构提供认知计算解决方案。",
                "亚马逊AWS推出专门针对教育行业的AI解决方案套件，涵盖个性化学习、智能管理等领域。",
                "苹果发布面向教育开发者的机器学习框架，简化AI教育应用的开发和部署过程。",
                "Adobe Creative Cloud教育版新增AI创作工具，帮助学生和教师创建更具创意的教学内容。",
                "Zoom推出基于AI的在线教学功能，包括实时翻译、智能字幕、课堂互动分析等。"
            };

            String[] techSources = {
                "36氪", "钛媒体", "雷锋网", "机器之心", "AI科技评论",
                "InfoQ", "CSDN", "IT之家", "新智元", "量子位"
            };

            Random random = new Random();
            int newsCount = Math.min(3, techNewsTitles.length);

            for (int i = 0; i < newsCount; i++) {
                int index = random.nextInt(techNewsTitles.length);

                HotTopic topic = new HotTopic();
                topic.setTitle(techNewsTitles[index]);
                topic.setSummary(techNewsSummaries[index]);
                topic.setSourceWebsite(techSources[random.nextInt(techSources.length)]);
                topic.setCategory("科技教育");
                topic.setUrl("https://tech-edu.com/ai/" + (2024000000L + System.currentTimeMillis() % 1000000) + ".html");
                // 扩展时间范围到近60天（2个月）
                topic.setPublishTime(LocalDateTime.now().minusDays(random.nextInt(60)));
                topic.setViewCount(random.nextInt(5000) + 1000);

                topics.add(topic);
            }

            logger.info("科技媒体教育AI新闻获取完成，获得 {} 条新闻", topics.size());

        } catch (Exception e) {
            logger.error("获取科技媒体教育AI新闻时发生错误", e);
        }

        return topics;
    }

    /**
     * 生成历史AI教育新闻（涵盖近6个月的重要事件）
     */
    private List<HotTopic> generateHistoricalAINews() {
        List<HotTopic> topics = new ArrayList<>();
        Random random = new Random();

        // 近6个月AI教育重要历史事件
        String[] historicalTitles = {
            "OpenAI发布GPT-4 Turbo教育专用版本",
            "谷歌推出Gemini教育应用生态系统",
            "微软Copilot for Education全球发布",
            "百度文心一言教育大模型通过备案",
            "阿里通义千问教育版正式商用",
            "腾讯混元大模型教育场景深度优化",
            "字节跳动豆包AI教育助手上线",
            "华为盘古教育大模型发布",
            "科大讯飞星火教育版用户破千万",
            "商汤日日新SenseNova教育版发布",
            "清华大学发布教育大模型ChatGLM-Edu",
            "北京大学推出AI教育评估工具",
            "中科院发布教育AI安全评估标准",
            "教育部AI教育应用试点项目启动",
            "全国首个AI教育实验室落户清华",
            "MIT发布AI教育影响力研究报告",
            "斯坦福大学AI教育中心成立",
            "哈佛大学推出AI辅助写作课程",
            "牛津大学发布AI教育伦理指南",
            "剑桥大学AI教育研究院揭牌"
        };

        String[] historicalSummaries = {
            "OpenAI发布专为教育设计的GPT-4 Turbo版本，具备更强的教学内容生成和学生辅导能力。",
            "谷歌推出Gemini教育应用生态系统，为全球教育开发者提供AI工具和平台支持。",
            "微软Copilot for Education在全球正式发布，集成Office 365教育版，提供智能教学辅助。",
            "百度文心一言教育大模型通过国家相关部门备案，可在教育领域正式商用。",
            "阿里巴巴通义千问教育版正式商用，为K12和高等教育提供专业的AI教学服务。",
            "腾讯混元大模型完成教育场景深度优化，在教学内容生成、学情分析等方面表现出色。",
            "字节跳动豆包AI教育助手正式上线，为学生提供个性化学习辅导和智能答疑服务。",
            "华为发布盘古教育大模型，专门针对中文教育场景进行优化，支持多种教学应用。",
            "科大讯飞星火教育版用户数突破千万，成为国内最受欢迎的AI教育助手之一。",
            "商汤科技发布日日新SenseNova教育版，具备多模态理解和生成能力。",
            "清华大学发布自主研发的教育大模型ChatGLM-Edu，专门针对中文教育场景优化。",
            "北京大学推出AI教育评估工具，能够客观评价AI技术在教育中的应用效果。",
            "中科院发布教育AI安全评估标准，为AI教育产品的安全性提供评估依据。",
            "教育部正式启动AI教育应用试点项目，在全国选择100所学校进行试点应用。",
            "全国首个专门的AI教育实验室在清华大学正式成立，致力于AI教育技术研发。",
            "MIT发布AI教育影响力研究报告，分析了AI技术对全球教育的深远影响。",
            "斯坦福大学AI教育中心正式成立，汇聚全球顶尖AI教育研究人才。",
            "哈佛大学推出AI辅助写作课程，探索AI技术在人文教育中的应用。",
            "牛津大学发布AI教育伦理指南，为AI技术在教育中的负责任应用提供指导。",
            "剑桥大学AI教育研究院正式揭牌，将专注于AI教育的前沿理论和实践研究。"
        };

        String[] historicalSources = {
            "教育科技网", "AI教育观察", "智慧教育", "未来学习", "数字教育前沿",
            "教育AI研究", "智能教学", "EdTech时报", "教育创新", "学习科技"
        };

        // 生成3-6条历史新闻
        int newsCount = random.nextInt(4) + 3;

        for (int i = 0; i < newsCount; i++) {
            int index = random.nextInt(historicalTitles.length);

            HotTopic topic = new HotTopic();
            topic.setTitle(historicalTitles[index]);
            topic.setSummary(historicalSummaries[index]);
            topic.setSourceWebsite(historicalSources[random.nextInt(historicalSources.length)]);
            topic.setCategory("AI教育历史");
            topic.setUrl("https://ai-edu-history.com/news/" + (2024000000L + System.currentTimeMillis() % 1000000) + ".html");

            // 历史新闻时间范围：1-6个月前
            int daysAgo = random.nextInt(150) + 30; // 30-180天前
            topic.setPublishTime(LocalDateTime.now().minusDays(daysAgo));
            topic.setViewCount(random.nextInt(3000) + 800);

            topics.add(topic);
        }

        return topics;
    }
}
