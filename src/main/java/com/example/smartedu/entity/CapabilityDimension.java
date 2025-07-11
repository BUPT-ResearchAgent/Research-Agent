package com.example.smartedu.entity;

/**
 * 能力维度枚举 - 人才培养导向的能力分类体系
 * 用于题目标注和学生能力评估
 */
public enum CapabilityDimension {
    
    // 理论掌握能力
    THEORETICAL_MASTERY("理论掌握", "基础知识理解、概念掌握、理论框架认知", "knowledge"),
    
    // 实践应用能力  
    PRACTICAL_APPLICATION("实践应用", "实际操作、问题解决、方案实施", "application"),
    
    // 创新思维能力
    INNOVATIVE_THINKING("创新思维", "发散思维、创造性解决问题、批判性思维", "innovation"),
    
    // 知识迁移能力
    KNOWLEDGE_TRANSFER("知识迁移", "跨领域应用、举一反三、综合运用", "transfer"),
    
    // 自主学习能力
    LEARNING_ABILITY("学习能力", "自主学习、学习策略、持续改进", "learning"),
    
    // 系统思维能力
    SYSTEMATIC_THINKING("系统思维", "整体把握、系统分析、大局观念", "systematic"),
    
    // 思政素养
    IDEOLOGICAL_QUALITY("思政素养", "价值观念、道德判断、社会责任感", "ideology"),
    
    // 沟通协作能力
    COMMUNICATION_COLLABORATION("沟通协作", "表达能力、团队合作、组织协调", "communication"),
    
    // 分析综合能力
    ANALYSIS_SYNTHESIS("分析综合", "逻辑分析、信息整合、判断推理", "analysis"),
    
    // 实验研究能力
    RESEARCH_EXPERIMENT("实验研究", "实验设计、数据分析、研究方法", "research");
    
    private final String displayName;
    private final String description;
    private final String code;
    
    CapabilityDimension(String displayName, String description, String code) {
        this.displayName = displayName;
        this.description = description;
        this.code = code;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    public String getDescription() {
        return description;
    }
    
    public String getCode() {
        return code;
    }
    
    /**
     * 根据代码获取能力维度
     */
    public static CapabilityDimension fromCode(String code) {
        for (CapabilityDimension dimension : values()) {
            if (dimension.getCode().equals(code)) {
                return dimension;
            }
        }
        return null;
    }
    
    /**
     * 获取能力维度的权重建议（用于平衡出题）
     */
    public double getRecommendedWeight() {
        switch (this) {
            case THEORETICAL_MASTERY:
                return 0.20; // 20% - 基础理论
            case PRACTICAL_APPLICATION:
                return 0.25; // 25% - 实践应用
            case INNOVATIVE_THINKING:
                return 0.15; // 15% - 创新思维
            case KNOWLEDGE_TRANSFER:
                return 0.15; // 15% - 知识迁移
            case LEARNING_ABILITY:
                return 0.10; // 10% - 学习能力
            case SYSTEMATIC_THINKING:
                return 0.10; // 10% - 系统思维
            case IDEOLOGICAL_QUALITY:
                return 0.05; // 5% - 思政素养
            default:
                return 0.0;
        }
    }
    
    /**
     * 获取能力等级描述
     */
    public String getLevelDescription(int level) {
        String baseDesc = "";
        switch (this) {
            case THEORETICAL_MASTERY:
                switch (level) {
                    case 1: return "能够记忆基本概念和定义";
                    case 2: return "能够理解理论原理和逻辑关系";
                    case 3: return "能够运用理论分析具体问题";
                    case 4: return "能够构建完整的理论框架";
                    case 5: return "能够创新性发展理论观点";
                }
                break;
            case PRACTICAL_APPLICATION:
                switch (level) {
                    case 1: return "能够完成基本操作步骤";
                    case 2: return "能够独立完成标准实践任务";
                    case 3: return "能够灵活应用解决实际问题";
                    case 4: return "能够优化改进实践方案";
                    case 5: return "能够创新实践方法和工具";
                }
                break;
            case INNOVATIVE_THINKING:
                switch (level) {
                    case 1: return "能够提出简单的改进想法";
                    case 2: return "能够从多角度思考问题";
                    case 3: return "能够提出创新性解决方案";
                    case 4: return "能够突破常规思维模式";
                    case 5: return "能够引领创新思维潮流";
                }
                break;
            case KNOWLEDGE_TRANSFER:
                switch (level) {
                    case 1: return "能够在相似情境中应用知识";
                    case 2: return "能够在相关领域间迁移知识";
                    case 3: return "能够跨领域综合运用知识";
                    case 4: return "能够构建跨学科知识体系";
                    case 5: return "能够创造性整合多领域知识";
                }
                break;
        }
        return "能力等级" + level;
    }
} 