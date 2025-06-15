package com.example.smartedu.service;

import ai.onnxruntime.OnnxTensor;
import ai.onnxruntime.OrtEnvironment;
import ai.onnxruntime.OrtException;
import ai.onnxruntime.OrtSession;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

@Service
public class EmbeddingService {
    
    @Value("${embedding.model.path:models/bge-small-zh-v1.5}")
    private String modelPath;
    
    private OrtEnvironment ortEnvironment;
    private OrtSession ortSession;
    private Map<String, Integer> vocab;
    private static final int MAX_SEQUENCE_LENGTH = 512;
    private static final int EMBEDDING_DIM = 512; // BGE-small-zh-v1.5的向量维度
    private static final int CLS_TOKEN_ID = 101;
    private static final int SEP_TOKEN_ID = 102;
    private static final int PAD_TOKEN_ID = 0;
    private static final int UNK_TOKEN_ID = 100;
    
    @PostConstruct
    public void initialize() {
        try {
            ortEnvironment = OrtEnvironment.getEnvironment();
            
            // 检查模型文件是否存在
            Path modelFilePath = Paths.get(modelPath, "model.onnx");
            if (!Files.exists(modelFilePath)) {
                throw new RuntimeException("BGE模型文件不存在: " + modelFilePath + 
                    "。请先运行 'python download_model.py' 下载模型文件。");
            }
            
            // 加载ONNX模型
            OrtSession.SessionOptions sessionOptions = new OrtSession.SessionOptions();
            ortSession = ortEnvironment.createSession(modelFilePath.toString(), sessionOptions);
            
            // 加载词汇表
            loadVocab();
            
            System.out.println("BGE-small-zh-v1.5模型加载成功！");
            System.out.println("词汇表大小: " + vocab.size());
            System.out.println("模型输入: " + ortSession.getInputNames());
            System.out.println("模型输出: " + ortSession.getOutputNames());
            
        } catch (Exception e) {
            System.err.println("初始化BGE模型失败: " + e.getMessage());
            throw new RuntimeException("BGE模型初始化失败", e);
        }
    }
    
    @PreDestroy
    public void cleanup() {
        try {
            if (ortSession != null) {
                ortSession.close();
            }
            if (ortEnvironment != null) {
                ortEnvironment.close();
            }
        } catch (Exception e) {
            System.err.println("清理资源时出错: " + e.getMessage());
        }
    }
    
    /**
     * 加载词汇表
     */
    private void loadVocab() throws Exception {
        vocab = new HashMap<>();
        Path vocabPath = Paths.get(modelPath, "vocab.txt");
        
        if (!Files.exists(vocabPath)) {
            System.err.println("词汇表文件不存在，使用基础tokenizer");
            createBasicVocab();
            return;
        }
        
        List<String> lines = Files.readAllLines(vocabPath);
        for (int i = 0; i < lines.size(); i++) {
            String token = lines.get(i).trim();
            if (!token.isEmpty()) {
                vocab.put(token, i);
            }
        }
        
        System.out.println("成功加载词汇表，共 " + vocab.size() + " 个词汇");
    }
    
    /**
     * 创建基础词汇表（如果vocab.txt不存在）
     */
    private void createBasicVocab() {
        vocab = new HashMap<>();
        
        // 添加特殊token
        vocab.put("[PAD]", PAD_TOKEN_ID);
        vocab.put("[UNK]", UNK_TOKEN_ID);
        vocab.put("[CLS]", CLS_TOKEN_ID);
        vocab.put("[SEP]", SEP_TOKEN_ID);
        
        // 添加基础中文字符和常用符号
        int tokenId = 200;
        
        // 中文字符范围
        for (int i = 0x4e00; i <= 0x9fff && tokenId < 20000; i++) {
            char ch = (char) i;
            vocab.put(String.valueOf(ch), tokenId++);
        }
        
        // 英文字符
        for (char c = 'a'; c <= 'z'; c++) {
            vocab.put(String.valueOf(c), tokenId++);
        }
        for (char c = 'A'; c <= 'Z'; c++) {
            vocab.put(String.valueOf(c), tokenId++);
        }
        
        // 数字
        for (char c = '0'; c <= '9'; c++) {
            vocab.put(String.valueOf(c), tokenId++);
        }
        
        // 常用标点符号
        String punctuation = "。！？，、；：\"\"''（）【】《》—…·";
        for (char c : punctuation.toCharArray()) {
            vocab.put(String.valueOf(c), tokenId++);
        }
        
        System.out.println("创建基础词汇表，共 " + vocab.size() + " 个词汇");
    }
    
    /**
     * 将文本转换为向量
     */
    public float[] encode(String text) {
        try {
            // tokenize文本
            int[] inputIds = tokenize(text);
            int[] attentionMask = createAttentionMask(inputIds);
            int[] tokenTypeIds = createTokenTypeIds(inputIds); // 添加token_type_ids
            
            // 转换为ONNX张量
            long[][] inputIdsArray = {Arrays.stream(inputIds).asLongStream().toArray()};
            long[][] attentionMaskArray = {Arrays.stream(attentionMask).asLongStream().toArray()};
            long[][] tokenTypeIdsArray = {Arrays.stream(tokenTypeIds).asLongStream().toArray()};
            
            Map<String, OnnxTensor> inputs = new HashMap<>();
            inputs.put("input_ids", OnnxTensor.createTensor(ortEnvironment, inputIdsArray));
            inputs.put("attention_mask", OnnxTensor.createTensor(ortEnvironment, attentionMaskArray));
            inputs.put("token_type_ids", OnnxTensor.createTensor(ortEnvironment, tokenTypeIdsArray));
            
            // 运行推理
            try (OrtSession.Result result = ortSession.run(inputs)) {
                // 获取输出 - 通常是 [batch_size, sequence_length, hidden_size]
                float[][][] output = (float[][][]) result.get(0).getValue();
                
                // 对CLS token的embedding进行池化
                float[] embedding = new float[EMBEDDING_DIM];
                System.arraycopy(output[0][0], 0, embedding, 0, Math.min(EMBEDDING_DIM, output[0][0].length));
                
                // L2标准化
                return normalize(embedding);
            } finally {
                // 清理张量
                for (OnnxTensor tensor : inputs.values()) {
                    tensor.close();
                }
            }
            
        } catch (Exception e) {
            System.err.println("文本向量化失败: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("向量化处理失败", e);
        }
    }
    
    /**
     * 批量向量化
     */
    public List<float[]> encodeBatch(List<String> texts) {
        List<float[]> embeddings = new ArrayList<>();
        for (String text : texts) {
            embeddings.add(encode(text));
        }
        return embeddings;
    }
    
    /**
     * tokenize文本
     */
    private int[] tokenize(String text) {
        List<Integer> tokens = new ArrayList<>();
        tokens.add(CLS_TOKEN_ID); // 添加CLS token
        
        // 简单的字符级tokenization
        for (char c : text.toCharArray()) {
            String charStr = String.valueOf(c);
            Integer tokenId = vocab.get(charStr);
            if (tokenId != null) {
                tokens.add(tokenId);
            } else {
                tokens.add(UNK_TOKEN_ID); // 未知字符
            }
            
            // 限制序列长度
            if (tokens.size() >= MAX_SEQUENCE_LENGTH - 1) {
                break;
            }
        }
        
        tokens.add(SEP_TOKEN_ID); // 添加SEP token
        
        // 填充到固定长度
        while (tokens.size() < MAX_SEQUENCE_LENGTH) {
            tokens.add(PAD_TOKEN_ID);
        }
        
        return tokens.stream().mapToInt(Integer::intValue).toArray();
    }
    
    /**
     * 创建attention mask
     */
    private int[] createAttentionMask(int[] inputIds) {
        int[] mask = new int[inputIds.length];
        for (int i = 0; i < inputIds.length; i++) {
            mask[i] = (inputIds[i] != PAD_TOKEN_ID) ? 1 : 0;
        }
        return mask;
    }
    
    /**
     * 创建token type ids (对于单句任务，所有token的type都是0)
     */
    private int[] createTokenTypeIds(int[] inputIds) {
        int[] tokenTypeIds = new int[inputIds.length];
        // 对于单句任务，所有token的type都设置为0
        Arrays.fill(tokenTypeIds, 0);
        return tokenTypeIds;
    }
    
    /**
     * L2标准化
     */
    private float[] normalize(float[] vector) {
        double norm = 0.0;
        for (float v : vector) {
            norm += v * v;
        }
        norm = Math.sqrt(norm);
        
        if (norm > 0) {
            for (int i = 0; i < vector.length; i++) {
                vector[i] = (float) (vector[i] / norm);
            }
        }
        
        return vector;
    }
    
    /**
     * 获取向量维度
     */
    public int getEmbeddingDimension() {
        return EMBEDDING_DIM;
    }
    
    /**
     * 检查模型是否已加载
     */
    public boolean isModelLoaded() {
        return ortSession != null;
    }
} 