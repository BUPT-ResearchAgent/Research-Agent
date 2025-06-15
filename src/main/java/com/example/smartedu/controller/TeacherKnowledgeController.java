package com.example.smartedu.controller;

import com.example.smartedu.dto.ApiResponse;
import com.example.smartedu.entity.Course;
import com.example.smartedu.entity.Teacher;
import com.example.smartedu.entity.KnowledgeDocument;
import com.example.smartedu.entity.Knowledge;
import com.example.smartedu.repository.KnowledgeDocumentRepository;
import com.example.smartedu.repository.KnowledgeRepository;
import com.example.smartedu.repository.CourseRepository;
import com.example.smartedu.service.KnowledgeBaseService;
import com.example.smartedu.service.TeacherManagementService;
import com.example.smartedu.service.VectorDatabaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpSession;
import java.io.File;
import java.io.IOException;
// 移除文件系统相关import，现在使用数据库存储
// import java.nio.file.Files;
// import java.nio.file.Path;
// import java.nio.file.Paths;
import java.util.Optional;
// 不再需要FileSystemResource，现在直接返回byte[]
// import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import java.util.Base64;

@RestController
@RequestMapping("/api/teacher/knowledge")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class TeacherKnowledgeController {

    @Autowired
    private KnowledgeBaseService knowledgeBaseService;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private TeacherManagementService teacherManagementService;

    @Autowired
    private KnowledgeDocumentRepository knowledgeDocumentRepository;

    @Autowired
    private KnowledgeRepository knowledgeRepository;

    // 不再需要UPLOAD_DIR，文件直接存储到数据库

    /**
     * 获取教师的课程列表（用于知识库管理）
     */
    @GetMapping("/courses")
    public ApiResponse<List<Map<String, Object>>> getCourses(HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("未登录，请先登录");
            }

            String role = (String) session.getAttribute("role");
            if (!"teacher".equals(role)) {
                return ApiResponse.error("权限不足");
            }

            // 获取教师信息
            Optional<Teacher> teacherOpt = teacherManagementService.getTeacherByUserId(userId);
            if (!teacherOpt.isPresent()) {
                return ApiResponse.error("教师信息不存在");
            }

            // 获取教师的课程
            List<Course> courses = courseRepository.findByTeacherId(teacherOpt.get().getId());
            
            List<Map<String, Object>> courseList = courses.stream().map(course -> {
                Map<String, Object> courseData = new HashMap<>();
                courseData.put("id", course.getId());
                courseData.put("name", course.getName());
                courseData.put("courseCode", course.getCourseCode());
                courseData.put("description", course.getDescription());
                courseData.put("semester", course.getSemester());
                courseData.put("academicYear", course.getAcademicYear());
                
                // 获取知识库统计信息
                KnowledgeBaseService.KnowledgeStats stats = knowledgeBaseService.getKnowledgeStats(course.getId());
                courseData.put("knowledgeStats", stats);
                
                return courseData;
            }).collect(Collectors.toList());

            return ApiResponse.success(courseList);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("获取课程列表失败：" + e.getMessage());
        }
    }

    /**
     * 上传文档到知识库（无文件存储版本）
     */
    @PostMapping("/upload")
    public ApiResponse<Map<String, Object>> uploadDocument(
            @RequestParam("courseId") Long courseId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "description", required = false) String description,
            HttpSession session) {
        
        try {
            // 验证用户权限
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("未登录，请先登录");
            }

            if (!"teacher".equals(session.getAttribute("role"))) {
                return ApiResponse.error("权限不足");
            }

            // 验证课程权限
            if (!isTeacherCourse(userId, courseId)) {
                return ApiResponse.error("无权限操作此课程");
            }

            if (file.isEmpty()) {
                return ApiResponse.error("请选择要上传的文件");
            }

            String fileName = file.getOriginalFilename();
            if (fileName == null) {
                return ApiResponse.error("文件名不能为空");
            }

            String fileExtension = getFileExtension(fileName);
            if (!isAllowedFileType(fileExtension)) {
                return ApiResponse.error("不支持的文件类型。支持的格式：txt, doc, docx, pdf, html, htm");
            }

            // 将文件内容转换为Base64编码存储到数据库
            String fileContentBase64 = Base64.getEncoder().encodeToString(file.getBytes());
            
            // 创建临时文件用于处理
            File tempFile = File.createTempFile("smartedu_", "." + fileExtension);
            file.transferTo(tempFile);
            
            try {
                // 处理文档并加入知识库
                KnowledgeBaseService.ProcessResult result = knowledgeBaseService.processDocument(
                    courseId, tempFile.getAbsolutePath(), fileName);

                if (!result.isSuccess()) {
                    return ApiResponse.error("文档处理失败：" + result.getMessage());
                }

                // 保存文档信息到数据库（包含文件内容）
                KnowledgeDocument knowledgeDoc = new KnowledgeDocument();
                knowledgeDoc.setCourseId(courseId);
                knowledgeDoc.setOriginalName(fileName);
                knowledgeDoc.setStoredName(fileName); // 不再需要唯一文件名
                knowledgeDoc.setFilePath("database"); // 标记存储在数据库中
                knowledgeDoc.setFileType(fileExtension);
                knowledgeDoc.setFileSize(file.getSize());
                knowledgeDoc.setDescription(description);
                knowledgeDoc.setChunksCount(result.getChunksCount());
                knowledgeDoc.setProcessed(true);
                knowledgeDoc.setUploadedBy(userId);
                knowledgeDoc.setUploadTime(LocalDateTime.now());
                knowledgeDoc.setFileContent(fileContentBase64); // 存储文件内容
                
                knowledgeDocumentRepository.save(knowledgeDoc);
                
                // 返回成功结果
                Map<String, Object> response = new HashMap<>();
                response.put("id", knowledgeDoc.getId());
                response.put("fileName", fileName);
                response.put("chunksCount", result.getChunksCount());
                response.put("uploadTime", LocalDateTime.now());
                response.put("description", description);
                response.put("fileSize", file.getSize());

                return ApiResponse.success("文档上传并处理成功", response);
                
            } finally {
                // 删除临时文件
                tempFile.delete();
            }

        } catch (IOException e) {
            e.printStackTrace();
            return ApiResponse.error("文件处理失败：" + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("处理失败：" + e.getMessage());
        }
    }

    /**
     * 批量上传文档（数据库存储版本）
     */
    @PostMapping("/batch-upload")
    public ApiResponse<Map<String, Object>> batchUploadDocuments(
            @RequestParam("courseId") Long courseId,
            @RequestParam("files") MultipartFile[] files,
            HttpSession session) {
        
        try {
            // 验证用户权限
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("未登录，请先登录");
            }

            if (!"teacher".equals(session.getAttribute("role"))) {
                return ApiResponse.error("权限不足");
            }

            // 验证课程权限
            if (!isTeacherCourse(userId, courseId)) {
                return ApiResponse.error("无权限操作此课程");
            }

            if (files == null || files.length == 0) {
                return ApiResponse.error("请选择要上传的文件");
            }

            List<File> tempFiles = new ArrayList<>();
            List<Map<String, Object>> uploadResults = new ArrayList<>();
            int successCount = 0;
            int failCount = 0;

            try {
                // 逐个处理文件
                for (MultipartFile file : files) {
                    try {
                        if (file.isEmpty()) {
                            continue;
                        }

                        String fileName = file.getOriginalFilename();
                        if (fileName == null) {
                            continue;
                        }

                        String fileExtension = getFileExtension(fileName);
                        if (!isAllowedFileType(fileExtension)) {
                            Map<String, Object> errorResult = new HashMap<>();
                            errorResult.put("fileName", fileName);
                            errorResult.put("success", false);
                            errorResult.put("message", "不支持的文件类型，仅支持：txt, doc, docx, pdf, html, htm");
                            uploadResults.add(errorResult);
                            failCount++;
                            continue;
                        }

                        // 将文件内容转换为Base64编码
                        String fileContentBase64 = Base64.getEncoder().encodeToString(file.getBytes());
                        
                        // 创建临时文件用于处理
                        File tempFile = File.createTempFile("smartedu_batch_", "." + fileExtension);
                        file.transferTo(tempFile);
                        tempFiles.add(tempFile);

                        // 处理文档并加入知识库
                        KnowledgeBaseService.ProcessResult result = knowledgeBaseService.processDocument(
                            courseId, tempFile.getAbsolutePath(), fileName);

                        if (!result.isSuccess()) {
                            Map<String, Object> errorResult = new HashMap<>();
                            errorResult.put("fileName", fileName);
                            errorResult.put("success", false);
                            errorResult.put("message", "文档处理失败：" + result.getMessage());
                            uploadResults.add(errorResult);
                            failCount++;
                            continue;
                        }

                        // 保存文档信息到数据库（包含文件内容）
                        KnowledgeDocument knowledgeDoc = new KnowledgeDocument();
                        knowledgeDoc.setCourseId(courseId);
                        knowledgeDoc.setOriginalName(fileName);
                        knowledgeDoc.setStoredName(fileName);
                        knowledgeDoc.setFilePath("database"); // 标记存储在数据库中
                        knowledgeDoc.setFileType(fileExtension);
                        knowledgeDoc.setFileSize(file.getSize());
                        knowledgeDoc.setChunksCount(result.getChunksCount());
                        knowledgeDoc.setProcessed(true);
                        knowledgeDoc.setUploadedBy(userId);
                        knowledgeDoc.setUploadTime(LocalDateTime.now());
                        knowledgeDoc.setFileContent(fileContentBase64); // 存储文件内容
                        
                        knowledgeDocumentRepository.save(knowledgeDoc);

                        Map<String, Object> successResult = new HashMap<>();
                        successResult.put("fileName", fileName);
                        successResult.put("success", true);
                        successResult.put("chunksCount", result.getChunksCount());
                        successResult.put("fileSize", file.getSize());
                        uploadResults.add(successResult);
                        successCount++;

                    } catch (Exception e) {
                        Map<String, Object> errorResult = new HashMap<>();
                        errorResult.put("fileName", file.getOriginalFilename());
                        errorResult.put("success", false);
                        errorResult.put("message", e.getMessage());
                        uploadResults.add(errorResult);
                        failCount++;
                    }
                }

                Map<String, Object> response = new HashMap<>();
                response.put("uploadResults", uploadResults);
                response.put("successCount", successCount);
                response.put("failCount", failCount);
                response.put("totalCount", files.length);
                response.put("uploadTime", LocalDateTime.now());

                return ApiResponse.success("批量上传完成", response);

            } finally {
                // 清理临时文件
                for (File tempFile : tempFiles) {
                    try {
                        tempFile.delete();
                    } catch (Exception e) {
                        System.err.println("删除临时文件失败: " + tempFile.getAbsolutePath());
                    }
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("批量上传失败：" + e.getMessage());
        }
    }

    /**
     * 测试知识库搜索
     */
    @PostMapping("/test-search")
    public ApiResponse<List<VectorDatabaseService.SearchResult>> testSearch(
            @RequestParam("courseId") Long courseId,
            @RequestParam("query") String query,
            @RequestParam(value = "topK", defaultValue = "5") int topK,
            HttpSession session) {
        
        try {
            // 验证用户权限
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("未登录，请先登录");
            }

            if (!"teacher".equals(session.getAttribute("role"))) {
                return ApiResponse.error("权限不足");
            }

            // 验证课程权限
            if (!isTeacherCourse(userId, courseId)) {
                return ApiResponse.error("无权限操作此课程");
            }

            List<VectorDatabaseService.SearchResult> results = 
                knowledgeBaseService.searchKnowledge(courseId, query, topK);

            return ApiResponse.success("搜索完成", results);

        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("搜索失败：" + e.getMessage());
        }
    }

    /**
     * 获取课程知识库统计信息
     */
    @GetMapping("/{courseId}/stats")
    public ApiResponse<KnowledgeBaseService.KnowledgeStats> getKnowledgeStats(
            @PathVariable Long courseId,
            HttpSession session) {
        
        try {
            // 验证用户权限
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("未登录，请先登录");
            }

            if (!"teacher".equals(session.getAttribute("role"))) {
                return ApiResponse.error("权限不足");
            }

            // 验证课程权限
            if (!isTeacherCourse(userId, courseId)) {
                return ApiResponse.error("无权限操作此课程");
            }

            KnowledgeBaseService.KnowledgeStats stats = knowledgeBaseService.getKnowledgeStats(courseId);
            return ApiResponse.success(stats);

        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("获取统计信息失败：" + e.getMessage());
        }
    }

    /**
     * 删除课程知识库
     */
    @DeleteMapping("/{courseId}")
    public ApiResponse<Void> deleteKnowledgeBase(
            @PathVariable Long courseId,
            HttpSession session) {
        
        try {
            // 验证用户权限
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("未登录，请先登录");
            }

            if (!"teacher".equals(session.getAttribute("role"))) {
                return ApiResponse.error("权限不足");
            }

            // 验证课程权限
            if (!isTeacherCourse(userId, courseId)) {
                return ApiResponse.error("无权限操作此课程");
            }

            boolean success = knowledgeBaseService.deleteCourseKnowledge(courseId);
            if (success) {
                return ApiResponse.<Void>success("知识库删除成功", null);
            } else {
                return ApiResponse.<Void>error("知识库删除失败");
            }

        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("删除失败：" + e.getMessage());
        }
    }

    /**
     * 获取最近上传的文档（限制2个）
     */
    @GetMapping("/recent-documents")
    public ApiResponse<List<Map<String, Object>>> getRecentDocuments(HttpSession session) {
        try {
            // 验证用户权限
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("未登录，请先登录");
            }

            if (!"teacher".equals(session.getAttribute("role"))) {
                return ApiResponse.error("权限不足");
            }

            // 获取教师信息
            Optional<Teacher> teacherOpt = teacherManagementService.getTeacherByUserId(userId);
            if (!teacherOpt.isPresent()) {
                return ApiResponse.error("教师信息不存在");
            }

            // 获取教师的课程
            List<Course> courses = courseRepository.findByTeacherId(teacherOpt.get().getId());
            List<Long> courseIds = courses.stream().map(Course::getId).collect(Collectors.toList());

            if (courseIds.isEmpty()) {
                return ApiResponse.success(new ArrayList<>());
            }

            // 获取最近上传的2个文档
            List<KnowledgeDocument> recentDocs = knowledgeDocumentRepository.findByCourseIdInOrderByUploadTimeDesc(courseIds)
                    .stream()
                    .limit(2)
                    .collect(Collectors.toList());

            List<Map<String, Object>> documentList = recentDocs.stream().map(doc -> {
                Map<String, Object> docInfo = new HashMap<>();
                docInfo.put("id", doc.getId());
                docInfo.put("originalName", doc.getOriginalName());
                docInfo.put("fileType", doc.getFileType());
                docInfo.put("fileSize", doc.getFileSize());
                docInfo.put("description", doc.getDescription());
                docInfo.put("chunksCount", doc.getChunksCount());
                docInfo.put("uploadTime", doc.getUploadTime());
                docInfo.put("processed", doc.getProcessed());
                docInfo.put("courseId", doc.getCourseId());
                
                // 添加课程信息
                courses.stream()
                    .filter(course -> course.getId().equals(doc.getCourseId()))
                    .findFirst()
                    .ifPresent(course -> {
                        docInfo.put("courseName", course.getName());
                        docInfo.put("courseCode", course.getCourseCode());
                        docInfo.put("courseDisplay", course.getName() + " (" + course.getCourseCode() + ")");
                    });
                
                return docInfo;
            }).collect(Collectors.toList());

            return ApiResponse.success(documentList);

        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("获取最近文档失败：" + e.getMessage());
        }
    }

    /**
     * 获取教师所有课程的知识库文档
     */
    @GetMapping("/all-documents")
    public ApiResponse<List<Map<String, Object>>> getAllDocuments(HttpSession session) {
        try {
            // 验证用户权限
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("未登录，请先登录");
            }

            if (!"teacher".equals(session.getAttribute("role"))) {
                return ApiResponse.error("权限不足");
            }

            // 获取教师信息
            Optional<Teacher> teacherOpt = teacherManagementService.getTeacherByUserId(userId);
            if (!teacherOpt.isPresent()) {
                return ApiResponse.error("教师信息不存在");
            }

            // 获取教师的课程
            List<Course> courses = courseRepository.findByTeacherId(teacherOpt.get().getId());
            List<Long> courseIds = courses.stream().map(Course::getId).collect(Collectors.toList());

            if (courseIds.isEmpty()) {
                return ApiResponse.success(new ArrayList<>());
            }

            // 获取所有文档
            List<KnowledgeDocument> allDocs = knowledgeDocumentRepository.findByCourseIdInOrderByUploadTimeDesc(courseIds);

            List<Map<String, Object>> documentList = allDocs.stream().map(doc -> {
                Map<String, Object> docInfo = new HashMap<>();
                docInfo.put("id", doc.getId());
                docInfo.put("originalName", doc.getOriginalName());
                docInfo.put("fileType", doc.getFileType());
                docInfo.put("fileSize", doc.getFileSize());
                docInfo.put("description", doc.getDescription());
                docInfo.put("chunksCount", doc.getChunksCount());
                docInfo.put("uploadTime", doc.getUploadTime());
                docInfo.put("processed", doc.getProcessed());
                docInfo.put("courseId", doc.getCourseId());
                
                // 添加课程信息
                courses.stream()
                    .filter(course -> course.getId().equals(doc.getCourseId()))
                    .findFirst()
                    .ifPresent(course -> {
                        docInfo.put("courseName", course.getName());
                        docInfo.put("courseCode", course.getCourseCode());
                        docInfo.put("courseDisplay", course.getName() + " (" + course.getCourseCode() + ")");
                    });
                
                return docInfo;
            }).collect(Collectors.toList());

            return ApiResponse.success(documentList);

        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("获取所有文档失败：" + e.getMessage());
        }
    }

    /**
     * 获取课程的知识块详情
     */
    @GetMapping("/{courseId}/chunks")
    public ApiResponse<List<Map<String, Object>>> getKnowledgeChunks(
            @PathVariable Long courseId,
            HttpSession session) {
        
        try {
            // 验证用户权限
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("未登录，请先登录");
            }

            if (!"teacher".equals(session.getAttribute("role"))) {
                return ApiResponse.error("权限不足");
            }

            // 验证课程权限
            if (!isTeacherCourse(userId, courseId)) {
                return ApiResponse.error("无权限操作此课程");
            }

            List<Map<String, Object>> chunks = knowledgeBaseService.getKnowledgeChunks(courseId);
            return ApiResponse.success(chunks);

        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("获取知识块失败：" + e.getMessage());
        }
    }

    /**
     * 获取单个知识块的详细信息
     */
    @GetMapping("/chunk/{chunkId}")
    public ApiResponse<Map<String, Object>> getChunkDetail(
            @PathVariable String chunkId,
            HttpSession session) {
        
        try {
            // 验证用户权限
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("未登录，请先登录");
            }

            if (!"teacher".equals(session.getAttribute("role"))) {
                return ApiResponse.error("权限不足");
            }

            Map<String, Object> chunkDetail = knowledgeBaseService.getChunkDetail(chunkId, userId);
            if (chunkDetail == null) {
                return ApiResponse.error("知识块不存在或无权限访问");
            }
            
            return ApiResponse.success(chunkDetail);

        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("获取知识块详情失败：" + e.getMessage());
        }
    }

    /**
     * 调试接口：查看所有知识块的chunkId
     */
    @GetMapping("/debug/chunks")
    public ApiResponse<List<Map<String, Object>>> debugChunks(HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("未登录");
            }

            List<Map<String, Object>> debugInfo = knowledgeBaseService.getDebugChunks(userId);
            return ApiResponse.success(debugInfo);

        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("调试失败：" + e.getMessage());
        }
    }

    /**
     * 更新知识块内容
     */
    @PutMapping("/chunk/{chunkId}")
    public ApiResponse<String> updateChunk(
            @PathVariable String chunkId,
            @RequestBody Map<String, String> request,
            HttpSession session) {
        
        try {
            // 验证用户权限
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("未登录，请先登录");
            }

            if (!"teacher".equals(session.getAttribute("role"))) {
                return ApiResponse.error("权限不足");
            }

            String content = request.get("content");
            if (content == null || content.trim().isEmpty()) {
                return ApiResponse.error("内容不能为空");
            }

            boolean success = knowledgeBaseService.updateChunkContent(chunkId, content);
            if (success) {
                return ApiResponse.success("知识块更新成功");
            } else {
                return ApiResponse.error("知识块更新失败");
            }

        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("更新知识块失败：" + e.getMessage());
        }
    }

    /**
     * 删除知识块
     */
    @DeleteMapping("/chunk/{chunkId}")
    public ApiResponse<String> deleteChunk(
            @PathVariable String chunkId,
            HttpSession session) {
        
        try {
            // 验证用户权限
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("未登录，请先登录");
            }

            if (!"teacher".equals(session.getAttribute("role"))) {
                return ApiResponse.error("权限不足");
            }

            boolean success = knowledgeBaseService.deleteChunk(chunkId);
            if (success) {
                return ApiResponse.success("知识块删除成功");
            } else {
                return ApiResponse.error("知识块删除失败");
            }

        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("删除知识块失败：" + e.getMessage());
        }
    }

    /**
     * 获取课程的知识库文档列表
     */
    @GetMapping("/{courseId}/documents")
    public ApiResponse<List<Map<String, Object>>> getCourseDocuments(
            @PathVariable Long courseId,
            HttpSession session) {
        try {
            // 验证用户权限
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("未登录，请先登录");
            }

            if (!"teacher".equals(session.getAttribute("role"))) {
                return ApiResponse.error("权限不足");
            }

            // 验证课程权限
            if (!isTeacherCourse(userId, courseId)) {
                return ApiResponse.error("无权限操作此课程");
            }

            // 获取知识库文档列表
            List<KnowledgeDocument> documents = knowledgeDocumentRepository.findByCourseIdOrderByUploadTimeDesc(courseId);
            
            List<Map<String, Object>> documentList = documents.stream().map(doc -> {
                Map<String, Object> docInfo = new HashMap<>();
                docInfo.put("id", doc.getId());
                docInfo.put("originalName", doc.getOriginalName());
                docInfo.put("storedName", doc.getStoredName());
                docInfo.put("filePath", doc.getFilePath());
                docInfo.put("fileType", doc.getFileType());
                docInfo.put("fileSize", doc.getFileSize());
                docInfo.put("description", doc.getDescription());
                docInfo.put("chunksCount", doc.getChunksCount());
                docInfo.put("uploadTime", doc.getUploadTime());
                docInfo.put("processed", doc.getProcessed());
                docInfo.put("uploadedBy", doc.getUploadedBy());
                return docInfo;
            }).collect(Collectors.toList());

            return ApiResponse.success("获取文档列表成功", documentList);
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("获取文档列表失败：" + e.getMessage());
        }
    }

    /**
     * 删除知识库文档
     */
    @DeleteMapping("/document/{documentId}")
    public ApiResponse<Void> deleteDocument(
            @PathVariable Long documentId,
            HttpSession session) {
        try {
            // 验证用户权限
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error("未登录，请先登录");
            }

            if (!"teacher".equals(session.getAttribute("role"))) {
                return ApiResponse.error("权限不足");
            }

            // 获取文档信息
            Optional<KnowledgeDocument> docOpt = knowledgeDocumentRepository.findById(documentId);
            if (!docOpt.isPresent()) {
                return ApiResponse.error("文档不存在");
            }

            KnowledgeDocument document = docOpt.get();

            // 验证课程权限
            if (!isTeacherCourse(userId, document.getCourseId())) {
                return ApiResponse.error("无权限操作此文档");
            }

            // 文件现在存储在数据库中，不需要删除物理文件
            System.out.println("文档存储在数据库中，无需删除物理文件: " + document.getOriginalName());

            // 删除向量数据库中的相关数据（删除对应的知识块）
            try {
                // 通过文档名和课程ID查找相关的知识块并删除
                List<Knowledge> relatedKnowledge = knowledgeRepository.findByFileNameAndCourseId(document.getOriginalName(), document.getCourseId());
                for (Knowledge knowledge : relatedKnowledge) {
                    knowledgeBaseService.deleteChunk(knowledge.getChunkId());
                }
            } catch (Exception e) {
                System.err.println("删除向量数据失败: " + e.getMessage());
            }

            // 删除数据库记录
            knowledgeDocumentRepository.delete(document);

            return ApiResponse.success("文档删除成功", (Void) null);
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("删除文档失败：" + e.getMessage());
        }
    }

    /**
     * 教师下载知识库文档（从数据库读取版本）
     */
    @GetMapping("/document/{documentId}/download")
    public ResponseEntity<byte[]> downloadDocument(
            @PathVariable Long documentId,
            HttpSession session) {
        try {
            // 验证用户权限
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.status(401).build();
            }

            if (!"teacher".equals(session.getAttribute("role"))) {
                return ResponseEntity.status(403).build();
            }

            // 获取文档信息
            Optional<KnowledgeDocument> docOpt = knowledgeDocumentRepository.findById(documentId);
            if (!docOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            KnowledgeDocument document = docOpt.get();

            // 验证课程权限
            if (!isTeacherCourse(userId, document.getCourseId())) {
                return ResponseEntity.status(403).build();
            }

            // 检查文件内容是否存在
            if (document.getFileContent() == null || document.getFileContent().isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            // 解码Base64文件内容
            byte[] fileBytes = Base64.getDecoder().decode(document.getFileContent());

            // 对文件名进行编码，支持中文文件名
            String filename = document.getOriginalName();
            String encodedFilename = java.net.URLEncoder.encode(filename, "UTF-8")
                    .replaceAll("\\+", "%20");

            // 设置响应头并返回文件
            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encodedFilename);
            headers.add(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_OCTET_STREAM_VALUE);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(fileBytes);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * 检查系统健康状态
     */
    @GetMapping("/health")
    public ApiResponse<Map<String, Object>> checkHealth() {
        try {
            Map<String, Object> health = new HashMap<>();
            health.put("timestamp", LocalDateTime.now());
            health.put("status", "运行中");
            
            // 这里可以添加更多健康检查
            // health.put("embeddingService", embeddingService.isModelLoaded() ? "正常" : "异常");
            // health.put("vectorDatabase", "正常");
            
            return ApiResponse.success("系统状态正常", health);
        } catch (Exception e) {
            return ApiResponse.error("健康检查失败：" + e.getMessage());
        }
    }

    /**
     * 检查教师是否有权限访问指定课程
     */
    private boolean isTeacherCourse(Long userId, Long courseId) {
        try {
            Optional<Teacher> teacherOpt = teacherManagementService.getTeacherByUserId(userId);
            if (!teacherOpt.isPresent()) {
                return false;
            }

            Optional<Course> courseOpt = courseRepository.findById(courseId);
            if (!courseOpt.isPresent()) {
                return false;
            }

            return courseOpt.get().getTeacherId().equals(teacherOpt.get().getId());
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * 获取文件扩展名
     */
    private String getFileExtension(String fileName) {
        int lastDotIndex = fileName.lastIndexOf('.');
        if (lastDotIndex == -1) {
            return "";
        }
        return fileName.substring(lastDotIndex + 1).toLowerCase();
    }

    /**
     * 检查是否为允许的文件类型
     */
    private boolean isAllowedFileType(String extension) {
        Set<String> allowedTypes = Set.of("txt", "doc", "docx", "pdf", "html", "htm");
        return allowedTypes.contains(extension);
    }
} 