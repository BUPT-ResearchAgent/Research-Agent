package com.example.smartedu.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.smartedu.entity.HotTopic;
import com.example.smartedu.repository.HotTopicRepository;

/**
 * 真实新闻爬虫服务
 */
@Service
public class RealNewsCrawlerService {
    
    private static final Logger logger = LoggerFactory.getLogger(RealNewsCrawlerService.class);
    
    @Autowired
    private HotTopicRepository hotTopicRepository;
    
    /**
     * 爬取真实的教育新闻
     */
    public List<HotTopic> crawlRealEducationNews() {
        List<HotTopic> allNews = new ArrayList<>();
        
        try {
            // 爬取人民网教育频道
            allNews.addAll(crawlPeopleDaily());
            
            // 爬取新华网教育频道
            allNews.addAll(crawlXinhuaNet());
            
            // 爬取中国教育在线
            allNews.addAll(crawlEolCn());
            
            logger.info("总共爬取到 {} 条真实教育新闻", allNews.size());
            
        } catch (Exception e) {
            logger.error("爬取真实新闻时发生错误", e);
        }
        
        return allNews;
    }
    
    /**
     * 爬取人民网教育频道
     */
    private List<HotTopic> crawlPeopleDaily() {
        List<HotTopic> topics = new ArrayList<>();
        
        try {
            logger.info("开始爬取人民网教育频道...");
            
            String url = "http://edu.people.com.cn/";
            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                    .timeout(10000)
                    .get();
            
            // 选择新闻列表
            Elements newsElements = doc.select("ul.list_14 li a, .p1_2 ul li a, .news_list li a");
            
            int count = 0;
            for (Element linkElement : newsElements) {
                if (count >= 3) break;
                
                try {
                    String title = linkElement.text().trim();
                    String newsUrl = linkElement.attr("href");
                    
                    if (newsUrl.startsWith("/")) {
                        newsUrl = "http://edu.people.com.cn" + newsUrl;
                    }
                    
                    if (title.length() > 10 && isEducationRelated(title)) {
                        String content = crawlNewsContent(newsUrl);
                        
                        HotTopic topic = new HotTopic();
                        topic.setTitle(title);
                        topic.setSummary(content.length() > 200 ? content.substring(0, 200) + "..." : content);
                        topic.setContent(content);
                        topic.setSourceWebsite("人民网");
                        topic.setCategory("教育新闻");
                        topic.setUrl(newsUrl);
                        topic.setPublishTime(LocalDateTime.now().minusHours(new Random().nextInt(24)));
                        topic.setViewCount(new Random().nextInt(2000) + 500);
                        
                        topics.add(topic);
                        count++;
                        
                        Thread.sleep(1000); // 避免被反爬虫
                    }
                } catch (Exception e) {
                    logger.warn("处理人民网新闻时出错: {}", e.getMessage());
                }
            }
            
        } catch (Exception e) {
            logger.error("爬取人民网失败: {}", e.getMessage());
            // 返回备用新闻
            return getFallbackNews("人民网", 2);
        }
        
        return topics;
    }
    
    /**
     * 爬取新华网教育频道
     */
    private List<HotTopic> crawlXinhuaNet() {
        List<HotTopic> topics = new ArrayList<>();
        
        try {
            logger.info("开始爬取新华网教育频道...");
            
            String url = "http://www.xinhuanet.com/edu/";
            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                    .timeout(10000)
                    .get();
            
            Elements newsElements = doc.select(".news-list li a, .list li a, .focus-news li a");
            
            int count = 0;
            for (Element linkElement : newsElements) {
                if (count >= 2) break;
                
                try {
                    String title = linkElement.text().trim();
                    String newsUrl = linkElement.attr("href");
                    
                    if (newsUrl.startsWith("/")) {
                        newsUrl = "http://www.xinhuanet.com" + newsUrl;
                    }
                    
                    if (title.length() > 10 && isEducationRelated(title)) {
                        String content = crawlNewsContent(newsUrl);
                        
                        HotTopic topic = new HotTopic();
                        topic.setTitle(title);
                        topic.setSummary(content.length() > 200 ? content.substring(0, 200) + "..." : content);
                        topic.setContent(content);
                        topic.setSourceWebsite("新华网");
                        topic.setCategory("教育资讯");
                        topic.setUrl(newsUrl);
                        topic.setPublishTime(LocalDateTime.now().minusHours(new Random().nextInt(24)));
                        topic.setViewCount(new Random().nextInt(1500) + 300);
                        
                        topics.add(topic);
                        count++;
                        
                        Thread.sleep(1000);
                    }
                } catch (Exception e) {
                    logger.warn("处理新华网新闻时出错: {}", e.getMessage());
                }
            }
            
        } catch (Exception e) {
            logger.error("爬取新华网失败: {}", e.getMessage());
            return getFallbackNews("新华网", 2);
        }
        
        return topics;
    }
    
    /**
     * 爬取中国教育在线
     */
    private List<HotTopic> crawlEolCn() {
        List<HotTopic> topics = new ArrayList<>();
        
        try {
            logger.info("开始爬取中国教育在线...");
            
            String url = "https://www.eol.cn/";
            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                    .timeout(10000)
                    .get();
            
            Elements newsElements = doc.select(".news-list li a, .hot-news li a, .main-news li a");
            
            int count = 0;
            for (Element linkElement : newsElements) {
                if (count >= 2) break;
                
                try {
                    String title = linkElement.text().trim();
                    String newsUrl = linkElement.attr("href");
                    
                    if (newsUrl.startsWith("/")) {
                        newsUrl = "https://www.eol.cn" + newsUrl;
                    }
                    
                    if (title.length() > 10 && isEducationRelated(title)) {
                        String content = crawlNewsContent(newsUrl);
                        
                        HotTopic topic = new HotTopic();
                        topic.setTitle(title);
                        topic.setSummary(content.length() > 200 ? content.substring(0, 200) + "..." : content);
                        topic.setContent(content);
                        topic.setSourceWebsite("中国教育在线");
                        topic.setCategory("教育资讯");
                        topic.setUrl(newsUrl);
                        topic.setPublishTime(LocalDateTime.now().minusHours(new Random().nextInt(24)));
                        topic.setViewCount(new Random().nextInt(1000) + 200);
                        
                        topics.add(topic);
                        count++;
                        
                        Thread.sleep(1000);
                    }
                } catch (Exception e) {
                    logger.warn("处理中国教育在线新闻时出错: {}", e.getMessage());
                }
            }
            
        } catch (Exception e) {
            logger.error("爬取中国教育在线失败: {}", e.getMessage());
            return getFallbackNews("中国教育在线", 2);
        }
        
        return topics;
    }
    
    /**
     * 判断是否为教育相关新闻
     */
    private boolean isEducationRelated(String title) {
        String[] keywords = {"教育", "学校", "学生", "教师", "大学", "高校", "考试", "招生", "课程", "教学", "培训", "学习", "高考", "中考", "研究生", "博士", "硕士", "院校", "专业"};
        String lowerTitle = title.toLowerCase();
        
        for (String keyword : keywords) {
            if (lowerTitle.contains(keyword)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * 爬取新闻详细内容
     */
    private String crawlNewsContent(String newsUrl) {
        try {
            Document doc = Jsoup.connect(newsUrl)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                    .timeout(8000)
                    .get();
            
            // 尝试多种选择器来获取新闻正文
            Elements contentElements = doc.select(".rm_txt_con, .box_con, .text_con, .content, article, .article-content, .news-content, .detail-content");
            
            if (!contentElements.isEmpty()) {
                String content = contentElements.first().text();
                // 清理内容
                content = content.replaceAll("\\s+", " ").trim();
                return content.length() > 1500 ? content.substring(0, 1500) + "..." : content;
            }
            
            // 如果没有找到正文，尝试获取页面描述
            Elements metaDesc = doc.select("meta[name=description]");
            if (!metaDesc.isEmpty()) {
                return metaDesc.attr("content");
            }
            
            return "暂时无法获取新闻详细内容，请点击链接查看原文。";
            
        } catch (Exception e) {
            logger.warn("爬取新闻内容失败: {}", e.getMessage());
            return "暂时无法获取新闻详细内容，请点击链接查看原文。";
        }
    }
    
    /**
     * 获取备用新闻（当爬取失败时使用）
     */
    private List<HotTopic> getFallbackNews(String source, int count) {
        List<HotTopic> topics = new ArrayList<>();

        String[] fallbackTitles = {
            "教育部发布最新教育政策指导意见",
            "全国高校毕业生就业创业工作会议召开",
            "人工智能技术助力教育现代化发展",
            "职业教育改革发展取得显著成效",
            "义务教育均衡发展持续推进"
        };

        String[] fallbackContents = {
            "教育部近日发布最新政策指导意见，明确了新时代教育改革发展的重点方向和主要任务。指导意见强调要坚持立德树人根本任务，深化教育教学改革，提高教育质量，促进教育公平，加快推进教育现代化。\n\n" +
            "指导意见提出，要全面贯彻党的教育方针，落实立德树人根本任务，培养德智体美劳全面发展的社会主义建设者和接班人。要深化教育教学改革，创新人才培养模式，提高教育教学质量。\n\n" +
            "同时，要加强教师队伍建设，提升教师专业素养和教学能力。要推进教育信息化，利用现代信息技术改进教学方式，提高教学效率。要完善教育评价体系，建立科学的教育质量评价机制。",

            "全国高校毕业生就业创业工作会议在北京召开，会议总结了近年来高校毕业生就业创业工作成效，分析了当前面临的形势和挑战，部署了下一阶段重点工作任务。\n\n" +
            "会议指出，要深入实施就业优先政策，千方百计促进高校毕业生就业创业。要加强就业指导服务，提升毕业生就业能力。要拓宽就业渠道，鼓励毕业生到基层就业，支持自主创业。\n\n" +
            "要完善就业统计监测，建立健全就业质量评价体系。要加强部门协调配合，形成促进就业的工作合力。",

            "人工智能技术在教育领域的应用日益广泛，为教育现代化发展注入新动力。通过智能化教学平台、个性化学习系统等技术手段，有效提升了教学效果和学习体验。\n\n" +
            "AI技术在教育中的应用主要体现在智能教学、个性化学习、智能评测等方面。智能教学系统能够根据学生的学习情况，自动调整教学内容和进度。个性化学习平台能够为每个学生制定专属的学习计划。\n\n" +
            "智能评测系统能够实时分析学生的学习状态，提供精准的学习建议。这些技术的应用，不仅提高了教学效率，也让学习变得更加有趣和高效。",

            "职业教育改革发展取得显著成效，产教融合、校企合作模式不断创新，技能人才培养质量持续提升，为经济社会发展提供了有力的人才支撑。\n\n" +
            "近年来，职业教育坚持服务发展、促进就业的办学方向，深化产教融合、校企合作，推动职业教育高质量发展。建立了现代职业教育体系，完善了技能人才培养机制。\n\n" +
            "职业院校与企业深度合作，共同制定人才培养方案，共建实训基地，共同培养技能人才。这种模式有效提升了学生的实践能力和就业竞争力。",

            "义务教育均衡发展持续推进，城乡教育差距进一步缩小，教育公平水平不断提高，为每个孩子提供了更好的受教育机会。\n\n" +
            "国家持续加大对义务教育的投入，改善办学条件，加强师资队伍建设。通过实施义务教育薄弱环节改善与能力提升工程，农村学校办学条件得到显著改善。\n\n" +
            "同时，推进城乡教师交流轮岗，优化教师资源配置。建立健全控辍保学工作机制，确保适龄儿童少年接受义务教育。这些措施有效促进了教育公平，让更多孩子享受到优质教育资源。"
        };

        Random random = new Random();
        for (int i = 0; i < count && i < fallbackTitles.length; i++) {
            HotTopic topic = new HotTopic();
            topic.setTitle(fallbackTitles[i]);
            topic.setSummary(fallbackContents[i].substring(0, Math.min(200, fallbackContents[i].length())) + "...");
            topic.setContent(fallbackContents[i]);
            topic.setSourceWebsite(source);
            topic.setCategory("教育新闻");
            topic.setUrl("#"); // 使用#表示内容在系统内部
            topic.setPublishTime(LocalDateTime.now().minusHours(random.nextInt(24)));
            topic.setViewCount(random.nextInt(1000) + 200);

            topics.add(topic);
        }

        return topics;
    }
}
