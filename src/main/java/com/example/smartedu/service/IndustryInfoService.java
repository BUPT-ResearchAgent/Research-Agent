package com.example.smartedu.service;

import com.example.smartedu.entity.IndustryInfo;
import com.example.smartedu.repository.IndustryInfoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class IndustryInfoService {
    
    @Autowired
    private IndustryInfoRepository industryInfoRepository;
    
    // 获取所有激活的信息
    public List<IndustryInfo> getAllActiveInfos() {
        return industryInfoRepository.findAll().stream()
                .filter(info -> info.getIsActive())
                .sorted((a, b) -> b.getPublishedAt().compareTo(a.getPublishedAt()))
                .collect(Collectors.toList());
    }
    
    // 根据类型获取信息
    public List<IndustryInfo> getInfosByType(String type) {
        return industryInfoRepository.findByTypeAndIsActiveOrderByPublishedAtDesc(type, true);
    }
    
    // 根据学科分类获取信息
    public List<IndustryInfo> getInfosBySubjectCategory(String subjectCategory) {
        return industryInfoRepository.findBySubjectCategoryAndIsActiveOrderByPublishedAtDesc(subjectCategory, true);
    }
    
    // 获取最新信息
    public List<IndustryInfo> getLatestInfos(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return industryInfoRepository.findAll(pageable).getContent();
    }
    
    // 根据关键词搜索
    public List<IndustryInfo> searchInfosByKeyword(String keyword) {
        return industryInfoRepository.findByKeywordContaining(keyword);
    }
    
    // 获取热门信息
    public List<IndustryInfo> getPopularInfos(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return industryInfoRepository.findAll(pageable).getContent();
    }
    
    // 根据重要性级别获取信息
    public List<IndustryInfo> getInfosByImportanceLevel(Integer level) {
        return industryInfoRepository.findByImportanceLevelGreaterThanEqualAndIsActiveOrderByPublishedAtDesc(level, true);
    }
    
    // 保存信息
    public IndustryInfo saveInfo(IndustryInfo info) {
        info.setUpdatedAt(LocalDateTime.now());
        return industryInfoRepository.save(info);
    }
    
    // 根据ID获取信息
    public Optional<IndustryInfo> getInfoById(Long id) {
        return industryInfoRepository.findById(id);
    }
    
    // 增加查看次数
    public void incrementViewCount(Long id) {
        Optional<IndustryInfo> infoOpt = industryInfoRepository.findById(id);
        if (infoOpt.isPresent()) {
            IndustryInfo info = infoOpt.get();
            info.incrementViewCount();
            industryInfoRepository.save(info);
        }
    }
    
    // 删除信息（软删除）
    public void deactivateInfo(Long id) {
        Optional<IndustryInfo> infoOpt = industryInfoRepository.findById(id);
        if (infoOpt.isPresent()) {
            IndustryInfo info = infoOpt.get();
            info.setIsActive(false);
            info.setUpdatedAt(LocalDateTime.now());
            industryInfoRepository.save(info);
        }
    }
    
    // 爬取和处理外部信息源
    public void crawlAndProcessExternalInfo() {
        // 这里实现信息抓取逻辑
        // 可以从多个源抓取信息：教育部网站、学术期刊、行业报告等
        
        // 示例：创建一些模拟数据
        createSampleData();
    }
    
    // 创建示例数据
    private void createSampleData() {
        try {
            // 检查是否已有数据，避免重复创建
            long existingCount = industryInfoRepository.count();
            if (existingCount >= 10) {
                System.out.println("教学产业信息数据已存在 (" + existingCount + " 条)，跳过创建");
                return;
            }
            
            System.out.println("开始创建教学产业信息示例数据...");
            
            // 清空现有数据，重新创建
            industryInfoRepository.deleteAll();
            
            // 学科热点信息
            IndustryInfo hotTopic1 = new IndustryInfo(
                "人工智能在教育中的应用趋势",
                "人工智能技术在个性化学习、智能评估、自适应教学等方面的最新应用和发展趋势。ChatGPT、Claude等大模型在教育领域的应用正在改变传统的教学方式，为个性化教育提供了新的可能性。",
                "教育部",
                "hot_topic"
            );
            hotTopic1.setSubjectCategory("计算机科学");
            hotTopic1.setImportanceLevel(5);
            hotTopic1.setKeywords("人工智能,教育,个性化学习,智能评估,ChatGPT,大模型");
            hotTopic1.setPublishedAt(LocalDateTime.now().minusDays(1));
            hotTopic1.setSourceUrl("https://education.gov.cn/ai-education-trends");
            hotTopic1.setIsActive(true);
            hotTopic1.setViewCount(0);
            
            IndustryInfo hotTopic2 = new IndustryInfo(
                "元宇宙技术在教育场景的创新应用",
                "虚拟现实、增强现实技术在创建沉浸式学习环境、虚拟实验室、远程协作学习等方面的最新进展。",
                "中国教育技术协会",
                "hot_topic"
            );
            hotTopic2.setSubjectCategory("教育技术");
            hotTopic2.setImportanceLevel(4);
            hotTopic2.setKeywords("元宇宙,虚拟现实,增强现实,沉浸式学习,虚拟实验室");
            hotTopic2.setPublishedAt(LocalDateTime.now().minusDays(2));
            hotTopic2.setSourceUrl("https://ceta.org.cn/metaverse-education");
            hotTopic2.setIsActive(true);
            hotTopic2.setViewCount(0);
            
            IndustryInfo hotTopic3 = new IndustryInfo(
                "区块链技术在教育认证中的应用",
                "区块链技术在学历认证、技能证书、学习记录存储等方面的应用，解决教育证书造假和跨机构认证难题。",
                "高等教育学会",
                "hot_topic"
            );
            hotTopic3.setSubjectCategory("计算机科学");
            hotTopic3.setImportanceLevel(3);
            hotTopic3.setKeywords("区块链,教育认证,学历证书,技能认证,数字凭证");
            hotTopic3.setPublishedAt(LocalDateTime.now().minusDays(3));
            hotTopic3.setSourceUrl("https://hea.org.cn/blockchain-education");
            hotTopic3.setIsActive(true);
            hotTopic3.setViewCount(0);
            
            // 行业趋势信息
            IndustryInfo industryTrend1 = new IndustryInfo(
                "数字化转型推动教育行业变革",
                "数字化技术如何重塑传统教育模式，包括在线学习平台、虚拟现实教学、大数据分析等。2024年教育数字化投入预计增长35%，在线教育市场规模将突破5000亿元。",
                "中国教育学会",
                "industry_trend"
            );
            industryTrend1.setSubjectCategory("教育学");
            industryTrend1.setImportanceLevel(4);
            industryTrend1.setKeywords("数字化转型,在线学习,虚拟现实,大数据,教育投入");
            industryTrend1.setPublishedAt(LocalDateTime.now().minusDays(2));
            industryTrend1.setSourceUrl("https://cse.edu.cn/digital-transformation");
            industryTrend1.setIsActive(true);
            industryTrend1.setViewCount(0);
            
            IndustryInfo industryTrend2 = new IndustryInfo(
                "混合式教学模式成为主流",
                "后疫情时代，线上线下融合的混合式教学模式正在成为高等教育的新常态。超过80%的高校已经实施了混合式教学改革。",
                "高等教育发展研究中心",
                "industry_trend"
            );
            industryTrend2.setSubjectCategory("教育学");
            industryTrend2.setImportanceLevel(5);
            industryTrend2.setKeywords("混合式教学,线上线下,教学改革,高等教育,后疫情");
            industryTrend2.setPublishedAt(LocalDateTime.now().minusDays(4));
            industryTrend2.setSourceUrl("https://herc.org.cn/blended-learning");
            industryTrend2.setIsActive(true);
            industryTrend2.setViewCount(0);
            
            IndustryInfo industryTrend3 = new IndustryInfo(
                "教育数据治理与隐私保护趋势",
                "随着教育数据的大量收集和使用，数据治理、隐私保护、数据安全成为教育行业关注的重点，相关法规和标准正在完善。",
                "教育信息化专委会",
                "industry_trend"
            );
            industryTrend3.setSubjectCategory("教育管理");
            industryTrend3.setImportanceLevel(4);
            industryTrend3.setKeywords("数据治理,隐私保护,数据安全,教育信息化,法规标准");
            industryTrend3.setPublishedAt(LocalDateTime.now().minusDays(5));
            industryTrend3.setSourceUrl("https://edic.org.cn/data-governance");
            industryTrend3.setIsActive(true);
            industryTrend3.setViewCount(0);
            
            // 政策更新信息
            IndustryInfo policyUpdate1 = new IndustryInfo(
                "新版高等教育质量评估标准发布",
                "教育部发布新版高等教育质量评估标准，强调创新能力培养和实践教学质量。新标准将于2024年秋季学期正式实施。",
                "教育部高等教育司",
                "policy_update"
            );
            policyUpdate1.setSubjectCategory("教育政策");
            policyUpdate1.setImportanceLevel(5);
            policyUpdate1.setKeywords("高等教育,质量评估,创新能力,实践教学,新标准");
            policyUpdate1.setPublishedAt(LocalDateTime.now().minusDays(3));
            policyUpdate1.setSourceUrl("https://education.gov.cn/policy/quality-assessment");
            policyUpdate1.setIsActive(true);
            policyUpdate1.setViewCount(0);
            
            IndustryInfo policyUpdate2 = new IndustryInfo(
                "职业教育产教融合新政策出台",
                "国家发展改革委、教育部联合发布《关于深化产教融合的若干意见》，推动职业教育与产业深度融合发展。",
                "国家发展改革委",
                "policy_update"
            );
            policyUpdate2.setSubjectCategory("职业教育");
            policyUpdate2.setImportanceLevel(4);
            policyUpdate2.setKeywords("职业教育,产教融合,政策,产业融合,发展改革");
            policyUpdate2.setPublishedAt(LocalDateTime.now().minusDays(6));
            policyUpdate2.setSourceUrl("https://ndrc.gov.cn/policy/vocational-education");
            policyUpdate2.setIsActive(true);
            policyUpdate2.setViewCount(0);
            
            // 研究报告信息
            IndustryInfo researchReport1 = new IndustryInfo(
                "2024年中国在线教育发展报告",
                "报告显示，2023年中国在线教育市场规模达到4800亿元，同比增长15%。移动学习、AI辅助教学、个性化推荐成为主要发展方向。",
                "中国教育科学研究院",
                "research_report"
            );
            researchReport1.setSubjectCategory("教育研究");
            researchReport1.setImportanceLevel(4);
            researchReport1.setKeywords("在线教育,市场规模,移动学习,AI辅助,个性化推荐");
            researchReport1.setPublishedAt(LocalDateTime.now().minusDays(7));
            researchReport1.setSourceUrl("https://nies.org.cn/online-education-report-2024");
            researchReport1.setIsActive(true);
            researchReport1.setViewCount(0);
            
            IndustryInfo researchReport2 = new IndustryInfo(
                "教师数字素养发展现状调研报告",
                "全国教师数字素养调研显示，85%的教师具备基础数字技能，但在AI工具应用、数据分析等高阶技能方面仍需提升。",
                "华东师范大学",
                "research_report"
            );
            researchReport2.setSubjectCategory("教师发展");
            researchReport2.setImportanceLevel(3);
            researchReport2.setKeywords("教师,数字素养,AI工具,数据分析,技能提升");
            researchReport2.setPublishedAt(LocalDateTime.now().minusDays(8));
            researchReport2.setSourceUrl("https://ecnu.edu.cn/teacher-digital-literacy");
            researchReport2.setIsActive(true);
            researchReport2.setViewCount(0);
            
            // 保存示例数据
            industryInfoRepository.save(hotTopic1);
            industryInfoRepository.save(hotTopic2);
            industryInfoRepository.save(hotTopic3);
            industryInfoRepository.save(industryTrend1);
            industryInfoRepository.save(industryTrend2);
            industryInfoRepository.save(industryTrend3);
            industryInfoRepository.save(policyUpdate1);
            industryInfoRepository.save(policyUpdate2);
            industryInfoRepository.save(researchReport1);
            industryInfoRepository.save(researchReport2);
            
            System.out.println("成功创建10条教学产业信息数据");
            
        } catch (Exception e) {
            System.err.println("创建教学产业信息数据失败: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("创建教学产业信息数据失败", e);
        }
    }
    
    // 获取统计信息
    public List<Object[]> getStatistics() {
        return industryInfoRepository.countByType();
    }
    
    // 获取最近一周的信息
    public List<IndustryInfo> getRecentInfos() {
        LocalDateTime oneWeekAgo = LocalDateTime.now().minusDays(7);
        return industryInfoRepository.findByPublishedAtAfterAndIsActiveOrderByPublishedAtDesc(oneWeekAgo, true);
    }
} 