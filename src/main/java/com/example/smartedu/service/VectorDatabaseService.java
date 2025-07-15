package com.example.smartedu.service;

import io.milvus.client.MilvusServiceClient;
import io.milvus.grpc.DataType;
import io.milvus.param.R;
import io.milvus.param.RpcStatus;
import io.milvus.param.collection.*;
import io.milvus.param.dml.InsertParam;
import io.milvus.param.dml.SearchParam;
import io.milvus.param.dml.DeleteParam;
import io.milvus.param.index.CreateIndexParam;
import io.milvus.param.index.DropIndexParam;
import io.milvus.response.SearchResultsWrapper;
import io.milvus.grpc.GetCollectionStatisticsResponse;
import io.milvus.common.clientenum.ConsistencyLevelEnum;
import io.milvus.grpc.KeyValuePair;
import io.milvus.param.collection.GetLoadStateParam;
import io.milvus.grpc.FlushResponse;
import io.milvus.param.collection.FlushParam;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class VectorDatabaseService {
    
    @Autowired
    private MilvusServiceClient milvusClient;
    
    @Autowired
    private EmbeddingService embeddingService;
    
    private static final String VECTOR_FIELD = "embedding";
    private static final String ID_FIELD = "id";
    private static final String CONTENT_FIELD = "content";
    private static final String CHUNK_ID_FIELD = "chunkId";
    private static final String COURSE_ID_FIELD = "courseId";
    
    /**
     * 为课程创建向量集合
     */
    public boolean createCollectionForCourse(Long courseId) {
        String collectionName = getCollectionName(courseId);
        
        try {
            // 检查集合是否已存在
            R<Boolean> hasCollectionResp = milvusClient.hasCollection(
                HasCollectionParam.newBuilder()
                    .withCollectionName(collectionName)
                    .build());
            
            if (hasCollectionResp.getData()) {
                System.out.println("课程 " + courseId + " 的向量集合已存在");
                return true;
            }
            
            // 定义字段
            List<FieldType> fieldsSchema = Arrays.asList(
                FieldType.newBuilder()
                    .withPrimaryKey(true)
                    .withAutoID(true)
                    .withDataType(DataType.Int64)
                    .withName(ID_FIELD)
                    .build(),
                
                FieldType.newBuilder()
                    .withDataType(DataType.VarChar)
                    .withName(CHUNK_ID_FIELD)
                    .withMaxLength(200)
                    .build(),
                
                FieldType.newBuilder()
                    .withDataType(DataType.Int64)
                    .withName(COURSE_ID_FIELD)
                    .build(),
                
                FieldType.newBuilder()
                    .withDataType(DataType.VarChar)
                    .withName(CONTENT_FIELD)
                    .withMaxLength(5000)
                    .build(),
                
                FieldType.newBuilder()
                    .withDataType(DataType.FloatVector)
                    .withName(VECTOR_FIELD)
                    .withDimension(embeddingService.getEmbeddingDimension())
                    .build()
            );
            
            // 创建集合
            CreateCollectionParam createCollectionReq = CreateCollectionParam.newBuilder()
                .withCollectionName(collectionName)
                .withDescription("课程 " + courseId + " 的知识库向量集合")
                .withFieldTypes(fieldsSchema)
                .build();
            
            R<RpcStatus> createCollectionResp = milvusClient.createCollection(createCollectionReq);
            if (!createCollectionResp.getStatus().equals(R.Status.Success.getCode())) {
                System.err.println("创建集合失败: " + createCollectionResp.getMessage());
                return false;
            }
            
            // 创建索引
            createIndex(collectionName);
            
            // 加载集合
            loadCollection(collectionName);
            
            System.out.println("成功为课程 " + courseId + " 创建向量集合: " + collectionName);
            return true;
            
        } catch (Exception e) {
            System.err.println("创建向量集合失败: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * 创建向量索引
     */
    private void createIndex(String collectionName) {
        try {
            CreateIndexParam indexParam = CreateIndexParam.newBuilder()
                .withCollectionName(collectionName)
                .withFieldName(VECTOR_FIELD)
                .withIndexType(io.milvus.param.IndexType.IVF_FLAT)
                .withMetricType(io.milvus.param.MetricType.COSINE)
                .withExtraParam("{\"nlist\":1024}")
                .build();
            
            R<RpcStatus> createIndexResp = milvusClient.createIndex(indexParam);
            if (!createIndexResp.getStatus().equals(R.Status.Success.getCode())) {
                System.err.println("创建索引失败: " + createIndexResp.getMessage());
            }
        } catch (Exception e) {
            System.err.println("创建索引异常: " + e.getMessage());
        }
    }
    
    /**
     * 加载集合到内存
     */
    private void loadCollection(String collectionName) {
        try {
            R<RpcStatus> loadResp = milvusClient.loadCollection(
                LoadCollectionParam.newBuilder()
                    .withCollectionName(collectionName)
                    .build());
            
            if (!loadResp.getStatus().equals(R.Status.Success.getCode())) {
                System.err.println("加载集合失败: " + loadResp.getMessage());
            }
        } catch (Exception e) {
            System.err.println("加载集合异常: " + e.getMessage());
        }
    }
    
    /**
     * 插入文档块向量
     */
    public boolean insertDocumentChunks(Long courseId, List<DocumentChunk> chunks) {
        String collectionName = getCollectionName(courseId);
        
        try {
            // 准备数据
            List<String> chunkIds = new ArrayList<>();
            List<Long> courseIds = new ArrayList<>();
            List<String> contents = new ArrayList<>();
            List<List<Float>> vectors = new ArrayList<>();
            
            for (DocumentChunk chunk : chunks) {
                float[] embedding = embeddingService.encode(chunk.getContent());
                
                chunkIds.add(chunk.getChunkId());
                courseIds.add(courseId);
                contents.add(chunk.getContent());
                vectors.add(floatArrayToList(embedding));
            }
            
            // 构建插入参数
            List<InsertParam.Field> fields = Arrays.asList(
                new InsertParam.Field(CHUNK_ID_FIELD, chunkIds),
                new InsertParam.Field(COURSE_ID_FIELD, courseIds),
                new InsertParam.Field(CONTENT_FIELD, contents),
                new InsertParam.Field(VECTOR_FIELD, vectors)
            );
            
            InsertParam insertParam = InsertParam.newBuilder()
                .withCollectionName(collectionName)
                .withFields(fields)
                .build();
            
            R<io.milvus.grpc.MutationResult> insertResp = milvusClient.insert(insertParam);
            
            if (!insertResp.getStatus().equals(R.Status.Success.getCode())) {
                System.err.println("插入向量失败: " + insertResp.getMessage());
                return false;
            }
            
            System.out.println("成功插入 " + chunks.size() + " 个文档块到课程 " + courseId + " 的向量集合");
            return true;
            
        } catch (Exception e) {
            System.err.println("插入向量异常: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * 向量相似性搜索
     */
    public List<SearchResult> search(Long courseId, String queryText, int topK) {
        String collectionName = getCollectionName(courseId);
        
        try {
            // 检查集合是否存在
            R<Boolean> hasCollectionResp = milvusClient.hasCollection(
                HasCollectionParam.newBuilder()
                    .withCollectionName(collectionName)
                    .build());
            
            if (!hasCollectionResp.getData()) {
                System.err.println("向量集合不存在: " + collectionName);
                return new ArrayList<>();
            }
            
            // 确保集合已加载
            loadCollection(collectionName);
            
            // 强制刷新集合以确保新数据可见
            try {
                R<FlushResponse> flushResp = milvusClient.flush(
                    FlushParam.newBuilder()
                        .withCollectionNames(Arrays.asList(collectionName))
                        .build());
                
                if (flushResp.getStatus() == R.Status.Success.getCode()) {
                    System.out.println("集合刷新成功: " + collectionName);
                } else {
                    System.out.println("集合刷新失败: " + flushResp.getMessage());
                }
            } catch (Exception e) {
                System.out.println("集合刷新异常: " + e.getMessage());
            }
            
            // 获取集合统计信息
            try {
                R<GetCollectionStatisticsResponse> statsResp = milvusClient.getCollectionStatistics(
                    GetCollectionStatisticsParam.newBuilder()
                        .withCollectionName(collectionName)
                        .build());
                
                if (statsResp.getStatus() == R.Status.Success.getCode()) {
                    System.out.println("搜索前集合统计信息:");
                    for (KeyValuePair kv : statsResp.getData().getStatsList()) {
                        System.out.println("  " + kv.getKey() + ": " + kv.getValue());
                    }
                }
            } catch (Exception e) {
                System.out.println("获取集合统计信息失败: " + e.getMessage());
            }
            
            // 将查询文本向量化
            System.out.println("开始向量化查询文本: " + queryText.substring(0, Math.min(100, queryText.length())) + "...");
            float[] queryVector = embeddingService.encode(queryText);
            System.out.println("查询向量维度: " + queryVector.length);
            List<List<Float>> vectors = Arrays.asList(floatArrayToList(queryVector));
            
            // 指定要返回的字段
            List<String> outFields = Arrays.asList(CHUNK_ID_FIELD, CONTENT_FIELD, COURSE_ID_FIELD);
            
            SearchParam searchParam = SearchParam.newBuilder()
                .withCollectionName(collectionName)
                .withVectorFieldName(VECTOR_FIELD)
                .withVectors(vectors)
                .withTopK(topK)
                .withMetricType(io.milvus.param.MetricType.COSINE)
                .withParams("{\"nprobe\":32}")
                .withOutFields(outFields)
                .withConsistencyLevel(ConsistencyLevelEnum.STRONG)
                .build();
            
            System.out.println("开始执行向量搜索，topK=" + topK);
            R<io.milvus.grpc.SearchResults> searchResp = milvusClient.search(searchParam);
            
            if (!searchResp.getStatus().equals(R.Status.Success.getCode())) {
                System.err.println("向量搜索失败: " + searchResp.getMessage());
                return new ArrayList<>();
            }
            
            // 解析搜索结果
            SearchResultsWrapper wrapper = new SearchResultsWrapper(searchResp.getData().getResults());
            List<SearchResult> results = new ArrayList<>();
            
            System.out.println("搜索返回的结果数量: " + wrapper.getIDScore(0).size());
            
            if (wrapper.getIDScore(0).size() == 0) {
                System.out.println("未找到匹配的向量结果");
                return new ArrayList<>();
            }
            
            for (int i = 0; i < wrapper.getIDScore(0).size(); i++) {
                SearchResult result = new SearchResult();
                result.setChunkId((String) wrapper.getFieldData(CHUNK_ID_FIELD, 0).get(i));
                result.setContent((String) wrapper.getFieldData(CONTENT_FIELD, 0).get(i));
                result.setCourseId((Long) wrapper.getFieldData(COURSE_ID_FIELD, 0).get(i));
                result.setScore(wrapper.getIDScore(0).get(i).getScore());
                results.add(result);
                
                System.out.println("搜索结果 " + (i+1) + ": 相似度=" + result.getScore() + 
                                 ", 内容长度=" + result.getContent().length());
            }
            
            System.out.println("向量搜索成功，找到 " + results.size() + " 个匹配结果");
            return results;
            
        } catch (Exception e) {
            System.err.println("向量搜索异常: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }
    
    /**
     * 删除单个向量记录
     */
    public boolean deleteVector(Long courseId, String chunkId) {
        String collectionName = getCollectionName(courseId);
        
        try {
            // 构建删除表达式 - 根据chunkId删除
            String expr = CHUNK_ID_FIELD + " == \"" + chunkId + "\"";
            
            DeleteParam deleteParam = DeleteParam.newBuilder()
                .withCollectionName(collectionName)
                .withExpr(expr)
                .build();
            
            R<io.milvus.grpc.MutationResult> deleteResp = milvusClient.delete(deleteParam);
            
            if (!deleteResp.getStatus().equals(R.Status.Success.getCode())) {
                System.err.println("删除向量失败: " + deleteResp.getMessage());
                return false;
            }
            
            System.out.println("成功从向量数据库删除: chunkId=" + chunkId);
            return true;
            
        } catch (Exception e) {
            System.err.println("删除向量异常: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * 更新向量记录（先删除再插入）
     */
    public boolean updateVector(Long courseId, String chunkId, String newContent) {
        try {
            // 1. 先删除旧的向量
            if (!deleteVector(courseId, chunkId)) {
                System.err.println("删除旧向量失败: chunkId=" + chunkId);
                return false;
            }
            
            // 2. 插入新的向量
            DocumentChunk chunk = new DocumentChunk(chunkId, newContent);
            List<DocumentChunk> chunks = Arrays.asList(chunk);
            
            if (!insertDocumentChunks(courseId, chunks)) {
                System.err.println("插入新向量失败: chunkId=" + chunkId);
                return false;
            }
            
            System.out.println("成功更新向量: chunkId=" + chunkId);
            return true;
            
        } catch (Exception e) {
            System.err.println("更新向量异常: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * 删除课程的向量集合
     */
    public boolean dropCollection(Long courseId) {
        String collectionName = getCollectionName(courseId);
        
        try {
            R<RpcStatus> dropResp = milvusClient.dropCollection(
                DropCollectionParam.newBuilder()
                    .withCollectionName(collectionName)
                    .build());
            
            return dropResp.getStatus().equals(R.Status.Success.getCode());
            
        } catch (Exception e) {
            System.err.println("删除向量集合异常: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * 重建向量集合（删除旧集合并创建新集合）
     */
    public boolean rebuildCollectionForCourse(Long courseId) {
        String collectionName = getCollectionName(courseId);
        
        try {
            System.out.println("开始重建课程 " + courseId + " 的向量集合: " + collectionName);
            
            // 1. 检查并删除现有集合
            R<Boolean> hasCollectionResp = milvusClient.hasCollection(
                HasCollectionParam.newBuilder()
                    .withCollectionName(collectionName)
                    .build());
            
            if (hasCollectionResp.getData()) {
                System.out.println("删除现有集合: " + collectionName);
                R<RpcStatus> dropResp = milvusClient.dropCollection(
                    DropCollectionParam.newBuilder()
                        .withCollectionName(collectionName)
                        .build());
                
                if (!dropResp.getStatus().equals(R.Status.Success.getCode())) {
                    System.err.println("删除集合失败: " + dropResp.getMessage());
                    return false;
                }
                System.out.println("成功删除旧集合");
            }
            
            // 2. 创建新集合
            boolean created = createCollectionForCourse(courseId);
            if (created) {
                System.out.println("成功重建向量集合: " + collectionName);
            } else {
                System.err.println("重建向量集合失败: " + collectionName);
            }
            
            return created;
            
        } catch (Exception e) {
            System.err.println("重建向量集合异常: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
    
    /**
     * 同时搜索课程知识库和基础知识库（政策文档作为附加指导）
     */
    public List<SearchResult> searchWithBaseKnowledge(Long courseId, String queryText, int topK) {
        List<SearchResult> allResults = new ArrayList<>();
        
        // 调整搜索策略：课程知识库为主（85%），政策文档为辅助指导（15%）
        int courseTopK = Math.max(1, topK * 85 / 100);  // 课程内容占主导
        int baseKnowledgeTopK = Math.max(1, topK - courseTopK);  // 政策文档作为补充
        
        System.out.println("开始联合搜索 - 课程知识库: " + courseTopK + "个（主要内容）, 政策指导: " + baseKnowledgeTopK + "个（附加考虑）");
        
        try {
            // 1. 首先搜索课程特定知识库（主要内容）
            List<SearchResult> courseResults = search(courseId, queryText, courseTopK);
            System.out.println("课程知识库搜索结果: " + courseResults.size() + " 个");
            
            // 2. 搜索政策文档作为指导补充
            List<SearchResult> policyResults = searchPolicyGuidance(queryText, baseKnowledgeTopK);
            System.out.println("政策指导搜索结果: " + policyResults.size() + " 个");
            
            // 3. 优先添加课程内容，然后添加政策指导
            allResults.addAll(courseResults);
            allResults.addAll(policyResults);
            
            // 按相似度排序，但保持课程内容的优先级
            allResults.sort((a, b) -> {
                // 如果一个是课程内容，一个是政策文档，优先课程内容
                if (a.getCourseId() != 0L && b.getCourseId() == 0L) {
                    return -1;
                } else if (a.getCourseId() == 0L && b.getCourseId() != 0L) {
                    return 1;
                } else {
                    // 同类型的按相似度排序
                    return Float.compare(b.getScore(), a.getScore());
                }
            });
            
            // 限制返回数量
            if (allResults.size() > topK) {
                allResults = allResults.subList(0, topK);
            }
            
            System.out.println("联合搜索完成，总共返回 " + allResults.size() + " 个结果");
            
            // 打印结果来源统计
            long courseCount = allResults.stream().mapToLong(r -> r.getCourseId() != 0L ? 1 : 0).sum();
            long policyCount = allResults.size() - courseCount;
            System.out.println("结果来源分布 - 课程内容: " + courseCount + "个（主要）, 政策指导: " + policyCount + "个（附加）");
            
        } catch (Exception e) {
            System.err.println("联合搜索异常: " + e.getMessage());
            e.printStackTrace();
        }
        
        return allResults;
    }
    
    /**
     * 专门搜索政策指导内容
     */
    public List<SearchResult> searchPolicyGuidance(String queryText, int topK) {
        // 为政策搜索添加特定的查询前缀，聚焦于教育目标和培养方向
        String policyQuery = "教育目标 培养方向 教学理念 " + queryText;
        
        List<SearchResult> policyResults = search(0L, policyQuery, topK);
        
        // 标记这些结果为政策指导
        for (SearchResult result : policyResults) {
            result.setPolicyGuidance(true);
        }
        
        return policyResults;
    }
    
    /**
     * 测试向量数据库连接和集合状态
     */
    public void testConnectionAndCollection(Long courseId) {
        String collectionName = getCollectionName(courseId);
        
        try {
            System.out.println("=== 开始测试向量数据库连接 ===");
            
            // 1. 测试连接
            System.out.println("1. 测试Milvus连接...");
            
            // 2. 检查集合是否存在
            System.out.println("2. 检查集合: " + collectionName);
            R<Boolean> hasCollectionResp = milvusClient.hasCollection(
                HasCollectionParam.newBuilder()
                    .withCollectionName(collectionName)
                    .build());
            
            if (hasCollectionResp.getData()) {
                System.out.println("   集合存在: " + collectionName);
                
                // 3. 获取集合统计信息
                R<GetCollectionStatisticsResponse> statsResp = milvusClient.getCollectionStatistics(
                    GetCollectionStatisticsParam.newBuilder()
                        .withCollectionName(collectionName)
                        .build());
                
                if (statsResp.getStatus() == R.Status.Success.getCode()) {
                    System.out.println("   集合统计信息:");
                    for (KeyValuePair kv : statsResp.getData().getStatsList()) {
                        System.out.println("     " + kv.getKey() + ": " + kv.getValue());
                    }
                } else {
                    System.out.println("   无法获取集合统计信息: " + statsResp.getMessage());
                }
                
            } else {
                System.out.println("   集合不存在: " + collectionName);
                System.out.println("   尝试创建集合...");
                boolean created = createCollectionForCourse(courseId);
                System.out.println("   集合创建结果: " + (created ? "成功" : "失败"));
            }
            
            System.out.println("=== 向量数据库测试完成 ===");
            
        } catch (Exception e) {
            System.err.println("向量数据库测试异常: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private String getCollectionName(Long courseId) {
        return "course_knowledge_" + courseId;
    }
    
    private List<Float> floatArrayToList(float[] array) {
        List<Float> list = new ArrayList<>();
        for (float f : array) {
            list.add(f);
        }
        return list;
    }
    
    // 数据传输对象
    public static class DocumentChunk {
        private String chunkId;
        private String content;
        
        public DocumentChunk(String chunkId, String content) {
            this.chunkId = chunkId;
            this.content = content;
        }
        
        public String getChunkId() { return chunkId; }
        public String getContent() { return content; }
    }
    
    public static class SearchResult {
        private String chunkId;
        private String content;
        private Long courseId;
        private float score;
        private boolean policyGuidance = false; // 是否为政策指导内容
        
        // Getters and Setters
        public String getChunkId() { return chunkId; }
        public void setChunkId(String chunkId) { this.chunkId = chunkId; }
        
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
        
        public Long getCourseId() { return courseId; }
        public void setCourseId(Long courseId) { this.courseId = courseId; }
        
        public float getScore() { return score; }
        public void setScore(float score) { this.score = score; }
        
        public boolean isPolicyGuidance() { return policyGuidance; }
        public void setPolicyGuidance(boolean policyGuidance) { this.policyGuidance = policyGuidance; }
    }
} 