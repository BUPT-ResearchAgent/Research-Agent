package com.example.smartedu.service;

import com.example.smartedu.entity.HotTopic;
import com.example.smartedu.repository.HotTopicRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class HotTopicService {
    
    private static final Logger logger = LoggerFactory.getLogger(HotTopicService.class);
    
    @Autowired
    private HotTopicRepository hotTopicRepository;
    
    @Autowired
    private HotTopicCrawlerService crawlerService;
    
    /**
     * 获取最新的热点列表
     */
    public List<HotTopic> getLatestHotTopics(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return hotTopicRepository.findTopNActiveHotTopics(pageable);
    }
    
    /**
     * 获取所有活跃的热点
     */
    public List<HotTopic> getAllActiveHotTopics() {
        return hotTopicRepository.findByIsActiveTrueOrderByPublishTimeDesc();
    }
    
    /**
     * 分页获取热点
     */
    public Page<HotTopic> getHotTopicsPage(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return hotTopicRepository.findByIsActiveTrueOrderByPublishTimeDesc(pageable);
    }
    
    /**
     * 根据分类获取热点
     */
    public List<HotTopic> getHotTopicsByCategory(String category) {
        return hotTopicRepository.findByIsActiveTrueAndCategoryOrderByPublishTimeDesc(category);
    }
    
    /**
     * 获取热门热点（按浏览次数排序）
     */
    public List<HotTopic> getPopularHotTopics(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return hotTopicRepository.findPopularHotTopics(pageable);
    }
    
    /**
     * 搜索热点
     */
    public List<HotTopic> searchHotTopics(String keyword) {
        return hotTopicRepository.findByTitleContainingAndIsActiveTrue(keyword);
    }
    
    /**
     * 根据ID获取热点详情
     */
    public Optional<HotTopic> getHotTopicById(Long id) {
        return hotTopicRepository.findById(id);
    }
    
    /**
     * 增加热点浏览次数
     */
    public void incrementViewCount(Long id) {
        Optional<HotTopic> optionalTopic = hotTopicRepository.findById(id);
        if (optionalTopic.isPresent()) {
            HotTopic topic = optionalTopic.get();
            topic.incrementViewCount();
            hotTopicRepository.save(topic);
            logger.debug("热点 {} 浏览次数增加到 {}", topic.getTitle(), topic.getViewCount());
        }
    }
    
    /**
     * 创建新热点
     */
    public HotTopic createHotTopic(HotTopic hotTopic) {
        hotTopic.setCreatedTime(LocalDateTime.now());
        if (hotTopic.getPublishTime() == null) {
            hotTopic.setPublishTime(LocalDateTime.now());
        }
        return hotTopicRepository.save(hotTopic);
    }
    
    /**
     * 更新热点
     */
    public HotTopic updateHotTopic(HotTopic hotTopic) {
        return hotTopicRepository.save(hotTopic);
    }
    
    /**
     * 删除热点（软删除）
     */
    public void deleteHotTopic(Long id) {
        Optional<HotTopic> optionalTopic = hotTopicRepository.findById(id);
        if (optionalTopic.isPresent()) {
            HotTopic topic = optionalTopic.get();
            topic.setIsActive(false);
            hotTopicRepository.save(topic);
            logger.info("热点 {} 已被标记为删除", topic.getTitle());
        }
    }
    
    /**
     * 获取指定时间范围内的热点
     */
    public List<HotTopic> getHotTopicsByTimeRange(LocalDateTime startTime, LocalDateTime endTime) {
        return hotTopicRepository.findByPublishTimeBetweenAndIsActiveTrue(startTime, endTime);
    }
    
    /**
     * 根据来源网站获取热点
     */
    public List<HotTopic> getHotTopicsBySource(String sourceWebsite) {
        return hotTopicRepository.findByIsActiveTrueAndSourceWebsiteOrderByPublishTimeDesc(sourceWebsite);
    }
    
    /**
     * 获取热点统计信息
     */
    public HotTopicStats getHotTopicStats() {
        long totalCount = hotTopicRepository.countByIsActiveTrue();
        
        // 统计各分类的数量
        long policyCount = hotTopicRepository.countByIsActiveTrueAndCategory("政策解读");
        long techCount = hotTopicRepository.countByIsActiveTrueAndCategory("技术创新");
        long platformCount = hotTopicRepository.countByIsActiveTrueAndCategory("平台发展");
        long otherCount = totalCount - policyCount - techCount - platformCount;
        
        return new HotTopicStats(totalCount, policyCount, techCount, platformCount, otherCount);
    }
    
    /**
     * 手动刷新热点数据
     */
    public void refreshHotTopics() {
        logger.info("手动刷新热点数据...");
        crawlerService.manualCrawl();
    }
    
    /**
     * 初始化示例数据
     */
    public void initializeSampleData() {
        crawlerService.initializeSampleData();
    }
    
    /**
     * 热点统计信息内部类
     */
    public static class HotTopicStats {
        private final long totalCount;
        private final long policyCount;
        private final long techCount;
        private final long platformCount;
        private final long otherCount;
        
        public HotTopicStats(long totalCount, long policyCount, long techCount, long platformCount, long otherCount) {
            this.totalCount = totalCount;
            this.policyCount = policyCount;
            this.techCount = techCount;
            this.platformCount = platformCount;
            this.otherCount = otherCount;
        }
        
        // Getters
        public long getTotalCount() { return totalCount; }
        public long getPolicyCount() { return policyCount; }
        public long getTechCount() { return techCount; }
        public long getPlatformCount() { return platformCount; }
        public long getOtherCount() { return otherCount; }
    }
}
