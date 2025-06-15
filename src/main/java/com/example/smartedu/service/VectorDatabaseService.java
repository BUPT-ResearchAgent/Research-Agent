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
    private static final String CHUNK_ID_FIELD = "chunk_id";
    private static final String COURSE_ID_FIELD = "course_id";
    
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
            // 将查询文本向量化
            float[] queryVector = embeddingService.encode(queryText);
            List<List<Float>> vectors = Arrays.asList(floatArrayToList(queryVector));
            
            SearchParam searchParam = SearchParam.newBuilder()
                .withCollectionName(collectionName)
                .withVectorFieldName(VECTOR_FIELD)
                .withVectors(vectors)
                .withTopK(topK)
                .withMetricType(io.milvus.param.MetricType.COSINE)
                .withParams("{\"nprobe\":10}")
                .build();
            
            R<io.milvus.grpc.SearchResults> searchResp = milvusClient.search(searchParam);
            
            if (!searchResp.getStatus().equals(R.Status.Success.getCode())) {
                System.err.println("向量搜索失败: " + searchResp.getMessage());
                return new ArrayList<>();
            }
            
            // 解析搜索结果
            SearchResultsWrapper wrapper = new SearchResultsWrapper(searchResp.getData().getResults());
            List<SearchResult> results = new ArrayList<>();
            
            for (int i = 0; i < wrapper.getIDScore(0).size(); i++) {
                SearchResult result = new SearchResult();
                result.setChunkId((String) wrapper.getFieldData(CHUNK_ID_FIELD, 0).get(i));
                result.setContent((String) wrapper.getFieldData(CONTENT_FIELD, 0).get(i));
                result.setCourseId((Long) wrapper.getFieldData(COURSE_ID_FIELD, 0).get(i));
                result.setScore(wrapper.getIDScore(0).get(i).getScore());
                results.add(result);
            }
            
            return results;
            
        } catch (Exception e) {
            System.err.println("向量搜索异常: " + e.getMessage());
            return new ArrayList<>();
        }
    }
    
    /**
     * 删除单个向量记录
     */
    public boolean deleteVector(Long courseId, String chunkId) {
        String collectionName = getCollectionName(courseId);
        
        try {
            // 构建删除表达式 - 根据chunk_id删除
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
        
        // Getters and Setters
        public String getChunkId() { return chunkId; }
        public void setChunkId(String chunkId) { this.chunkId = chunkId; }
        
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
        
        public Long getCourseId() { return courseId; }
        public void setCourseId(Long courseId) { this.courseId = courseId; }
        
        public float getScore() { return score; }
        public void setScore(float score) { this.score = score; }
    }
} 