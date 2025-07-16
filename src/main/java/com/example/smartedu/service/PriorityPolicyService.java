package com.example.smartedu.service;

import com.example.smartedu.entity.KnowledgeDocument;
import com.example.smartedu.repository.KnowledgeDocumentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Service
public class PriorityPolicyService {
    
    @Autowired
    private KnowledgeDocumentRepository knowledgeDocumentRepository;
    
    @Autowired
    private KnowledgeBaseService knowledgeBaseService;
    
    /**
     * 重点政策文档信息映射
     */
    private static final Map<String, String> PRIORITY_POLICY_FILES = new HashMap<>();
    
    static {
        PRIORITY_POLICY_FILES.put("GBT+36436-2018.pdf", 
            "GB/T 36436-2018 教育管理信息化标准，规范了教育管理系统的信息化建设要求");
        PRIORITY_POLICY_FILES.put("GBT+36437-2018.pdf", 
            "GB/T 36437-2018 智慧校园总体架构标准，规定了智慧校园的系统架构、技术要求和建设规范");
        PRIORITY_POLICY_FILES.put("GBT+45654-2025.pdf", 
            "GB/T 45654-2025 教育信息化评估标准，用于评估教育信息化建设水平的技术标准");
        PRIORITY_POLICY_FILES.put("GBZ+43946-2024.pdf", 
            "GB/Z 43946-2024 教育数字化转型技术指南，指导教育机构进行数字化改革的技术标准");
        PRIORITY_POLICY_FILES.put("GBZ+45261-2025.pdf", 
            "GB/Z 45261-2025 人工智能教育应用技术规范，规定了AI在教育领域应用的技术要求和安全标准");
        PRIORITY_POLICY_FILES.put("GBZ+45262-2025.pdf", 
            "GB/Z 45262-2025 智能教学系统数据安全技术要求，保障教育数据安全的技术标准");
        PRIORITY_POLICY_FILES.put("人工智能教育应用系列标准.pdf", 
            "人工智能教育应用系列标准文件集，包含AI教育应用的全套标准规范和指导原则");
    }
    
    /**
     * 为新课程自动添加重点政策文档
     */
    @Transactional
    public void addPriorityPolicyDocumentsToCourse(Long courseId) {
        try {
            System.out.println("🔄 开始为课程 " + courseId + " 添加重点政策文档...");
            
            String policyDir = "policy_documents/priority";
            Path policyPath = Paths.get(policyDir);
            
            if (!Files.exists(policyPath)) {
                System.out.println("⚠️ 重点政策文档目录不存在: " + policyPath.toAbsolutePath());
                return;
            }
            
            int successCount = 0;
            int totalCount = PRIORITY_POLICY_FILES.size();
            
            for (Map.Entry<String, String> entry : PRIORITY_POLICY_FILES.entrySet()) {
                String fileName = entry.getKey();
                String description = entry.getValue();
                
                try {
                    Path filePath = policyPath.resolve(fileName);
                    
                    if (!Files.exists(filePath)) {
                        System.out.println("⚠️ 文件不存在: " + fileName);
                        continue;
                    }
                    
                    // 检查是否已经存在相同文档
                    if (knowledgeDocumentRepository.existsByCourseIdAndOriginalName(courseId, fileName)) {
                        System.out.println("✅ 文档已存在，跳过: " + fileName);
                        successCount++;
                        continue;
                    }
                    
                    // 读取文件内容
                    byte[] fileBytes = Files.readAllBytes(filePath);
                    String fileContentBase64 = Base64.getEncoder().encodeToString(fileBytes);
                    
                    // 处理文档并加入知识库
                    KnowledgeBaseService.ProcessResult result = knowledgeBaseService.processDocument(
                        courseId, filePath.toString(), fileName);
                    
                    if (!result.isSuccess()) {
                        System.out.println("❌ 文档处理失败: " + fileName + " - " + result.getMessage());
                        continue;
                    }
                    
                    // 保存文档信息到数据库
                    KnowledgeDocument knowledgeDoc = new KnowledgeDocument();
                    knowledgeDoc.setCourseId(courseId);
                    knowledgeDoc.setOriginalName(fileName);
                    knowledgeDoc.setStoredName(fileName);
                    knowledgeDoc.setFilePath("database"); // 标记存储在数据库中
                    knowledgeDoc.setFileType("pdf");
                    knowledgeDoc.setFileSize((long) fileBytes.length);
                    knowledgeDoc.setDescription(description);
                    knowledgeDoc.setChunksCount(result.getChunksCount());
                    knowledgeDoc.setProcessed(true);
                    knowledgeDoc.setUploadedBy(1L); // 系统自动上传
                    knowledgeDoc.setUploadTime(LocalDateTime.now());
                    knowledgeDoc.setFileContent(fileContentBase64);
                    
                    knowledgeDocumentRepository.save(knowledgeDoc);
                    
                    System.out.println("✅ 成功添加重点文档: " + fileName + " (生成 " + result.getChunksCount() + " 个知识块)");
                    successCount++;
                    
                } catch (Exception e) {
                    System.err.println("❌ 处理文档失败: " + fileName + " - " + e.getMessage());
                    e.printStackTrace();
                }
            }
            
            System.out.println("🎉 重点政策文档添加完成: " + successCount + "/" + totalCount + " 个文档成功添加到课程 " + courseId);
            
        } catch (Exception e) {
            System.err.println("❌ 添加重点政策文档失败: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * 检查重点政策文档目录是否存在
     */
    public boolean checkPriorityPolicyDirectory() {
        Path policyPath = Paths.get("policy_documents/priority");
        return Files.exists(policyPath) && Files.isDirectory(policyPath);
    }
    
    /**
     * 获取重点政策文档信息
     */
    public Map<String, String> getPriorityPolicyFiles() {
        return new HashMap<>(PRIORITY_POLICY_FILES);
    }
    
    /**
     * 检查指定文件是否为重点政策文档
     */
    public boolean isPriorityPolicyFile(String fileName) {
        return PRIORITY_POLICY_FILES.containsKey(fileName);
    }
} 