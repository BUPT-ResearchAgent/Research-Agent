package com.example.smartedu.repository;

import com.example.smartedu.entity.IndustryInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface IndustryInfoRepository extends JpaRepository<IndustryInfo, Long> {
    
    // 根据类型查询激活的信息
    List<IndustryInfo> findByTypeAndIsActiveOrderByPublishedAtDesc(String type, Boolean isActive);
    
    // 根据学科分类查询激活的信息
    List<IndustryInfo> findBySubjectCategoryAndIsActiveOrderByPublishedAtDesc(String subjectCategory, Boolean isActive);
    
    // 根据重要性级别查询激活的信息
    List<IndustryInfo> findByImportanceLevelGreaterThanEqualAndIsActiveOrderByPublishedAtDesc(Integer importanceLevel, Boolean isActive);
    
    // 查询最新的n条信息
    @Query("SELECT i FROM IndustryInfo i WHERE i.isActive = true ORDER BY i.publishedAt DESC")
    List<IndustryInfo> findLatestInfos(@Param("limit") int limit);
    
    // 根据关键词搜索
    @Query("SELECT i FROM IndustryInfo i WHERE i.isActive = true AND " +
           "(i.title LIKE %:keyword% OR i.content LIKE %:keyword% OR i.keywords LIKE %:keyword%) " +
           "ORDER BY i.publishedAt DESC")
    List<IndustryInfo> findByKeywordContaining(@Param("keyword") String keyword);
    
    // 根据时间范围查询
    List<IndustryInfo> findByPublishedAtBetweenAndIsActiveOrderByPublishedAtDesc(
        LocalDateTime startDate, LocalDateTime endDate, Boolean isActive);
    
    // 查询热门信息（按查看次数排序）
    @Query("SELECT i FROM IndustryInfo i WHERE i.isActive = true ORDER BY i.viewCount DESC")
    List<IndustryInfo> findPopularInfos(@Param("limit") int limit);
    
    // 统计各类型信息数量
    @Query("SELECT i.type, COUNT(i) FROM IndustryInfo i WHERE i.isActive = true GROUP BY i.type")
    List<Object[]> countByType();
    
    // 查询指定时间后的信息
    List<IndustryInfo> findByPublishedAtAfterAndIsActiveOrderByPublishedAtDesc(LocalDateTime date, Boolean isActive);
} 