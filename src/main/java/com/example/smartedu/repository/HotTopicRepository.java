package com.example.smartedu.repository;

import com.example.smartedu.entity.HotTopic;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface HotTopicRepository extends JpaRepository<HotTopic, Long> {
    
    /**
     * 查找活跃的热点，按发布时间倒序
     */
    List<HotTopic> findByIsActiveTrueOrderByPublishTimeDesc();
    
    /**
     * 分页查找活跃的热点，按发布时间倒序
     */
    Page<HotTopic> findByIsActiveTrueOrderByPublishTimeDesc(Pageable pageable);
    
    /**
     * 根据分类查找活跃的热点
     */
    List<HotTopic> findByIsActiveTrueAndCategoryOrderByPublishTimeDesc(String category);
    
    /**
     * 查找最新的N条热点
     */
    @Query("SELECT h FROM HotTopic h WHERE h.isActive = true ORDER BY h.publishTime DESC")
    List<HotTopic> findTopNActiveHotTopics(Pageable pageable);
    
    /**
     * 根据标题搜索热点
     */
    @Query("SELECT h FROM HotTopic h WHERE h.isActive = true AND h.title LIKE %:keyword% ORDER BY h.publishTime DESC")
    List<HotTopic> findByTitleContainingAndIsActiveTrue(@Param("keyword") String keyword);
    
    /**
     * 查找指定时间范围内的热点
     */
    @Query("SELECT h FROM HotTopic h WHERE h.isActive = true AND h.publishTime BETWEEN :startTime AND :endTime ORDER BY h.publishTime DESC")
    List<HotTopic> findByPublishTimeBetweenAndIsActiveTrue(
            @Param("startTime") LocalDateTime startTime, 
            @Param("endTime") LocalDateTime endTime);
    
    /**
     * 查找热门热点（按浏览次数排序）
     */
    @Query("SELECT h FROM HotTopic h WHERE h.isActive = true ORDER BY h.viewCount DESC, h.publishTime DESC")
    List<HotTopic> findPopularHotTopics(Pageable pageable);
    
    /**
     * 根据来源网站查找热点
     */
    List<HotTopic> findByIsActiveTrueAndSourceWebsiteOrderByPublishTimeDesc(String sourceWebsite);
    
    /**
     * 检查URL是否已存在
     */
    boolean existsByUrl(String url);
    
    /**
     * 统计活跃热点总数
     */
    long countByIsActiveTrue();
    
    /**
     * 统计指定分类的热点数量
     */
    long countByIsActiveTrueAndCategory(String category);
}
