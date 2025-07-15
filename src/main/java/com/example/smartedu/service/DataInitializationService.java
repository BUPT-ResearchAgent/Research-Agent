package com.example.smartedu.service;

import com.example.smartedu.entity.Teacher;
import com.example.smartedu.entity.Student;
import com.example.smartedu.entity.User;
import com.example.smartedu.entity.Course;
import com.example.smartedu.entity.Exam;
import com.example.smartedu.entity.Question;
import com.example.smartedu.entity.StudentCourse;
import com.example.smartedu.entity.KnowledgeDocument;
import com.example.smartedu.entity.Knowledge;
import com.example.smartedu.repository.UserRepository;
import com.example.smartedu.repository.TeacherRepository;
import com.example.smartedu.repository.StudentRepository;
import com.example.smartedu.repository.CourseRepository;
import com.example.smartedu.repository.ExamRepository;
import com.example.smartedu.repository.QuestionRepository;
import com.example.smartedu.repository.StudentCourseRepository;
import com.example.smartedu.repository.KnowledgeDocumentRepository;
import com.example.smartedu.repository.KnowledgeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.UUID;

@Service
public class DataInitializationService implements CommandLineRunner {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private TeacherRepository teacherRepository;
    
    @Autowired
    private StudentRepository studentRepository;
    
    @Autowired
    private CourseRepository courseRepository;
    
    @Autowired
    private ExamRepository examRepository;
    
    @Autowired
    private QuestionRepository questionRepository;
    
    @Autowired
    private StudentCourseRepository studentCourseRepository;
    
    @Autowired
    private KnowledgeDocumentRepository knowledgeDocumentRepository;
    
    @Autowired
    private KnowledgeRepository knowledgeRepository;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private BaseKnowledgeService baseKnowledgeService;
    
    @Override
    public void run(String... args) throws Exception {
        initializeDefaultData();
        initializeBaseKnowledge();
    }
    
    private void initializeDefaultData() {
        try {
            // 检查是否已有管理员用户
            if (!userRepository.existsByUsername("admin")) {
                // 创建默认管理员
                User admin = userService.register("admin", "admin123", "admin");
                System.out.println("创建默认管理员账号: admin/admin123");
            }
            
            // 检查是否已有教师用户
            if (!userRepository.existsByUsername("teacher1")) {
                // 创建默认教师
                User teacherUser = userService.register("teacher1", "teacher123", "teacher");
                Teacher teacher = new Teacher(teacherUser, "张教授");
                teacher.setTeacherCode("T001");
                teacher.setDepartment("计算机科学与技术学院");
                teacher.setTitle("教授");
                teacher.setEducation("博士");
                teacher.setSpecialty("人工智能、机器学习");
                teacher.setIntroduction("从事人工智能研究20年，发表论文100余篇");
                teacher.setOfficeLocation("信息楼301");
                teacher.setOfficeHours("周一至周五 9:00-17:00");
                teacherRepository.save(teacher);
                System.out.println("创建默认教师账号: teacher1/teacher123");
            } else {
                // 更新现有教师信息
                java.util.Optional<Teacher> existingTeacherOpt = teacherRepository.findByTeacherCode("T001");
                if (existingTeacherOpt.isPresent()) {
                    Teacher existingTeacher = existingTeacherOpt.get();
                    existingTeacher.setRealName("张教授");
                    existingTeacher.setDepartment("计算机科学与技术学院");
                    existingTeacher.setTitle("教授");
                    existingTeacher.setEducation("博士");
                    existingTeacher.setSpecialty("人工智能、机器学习");
                    existingTeacher.setIntroduction("从事人工智能研究20年，发表论文100余篇");
                    existingTeacher.setOfficeLocation("信息楼301");
                    existingTeacher.setOfficeHours("周一至周五 9:00-17:00");
                    teacherRepository.save(existingTeacher);
                    System.out.println("更新默认教师信息: 张教授");
                }
            }
            
            // 检查是否已有学生用户
            if (!userRepository.existsByUsername("student1")) {
                // 创建默认学生
                User studentUser = userService.register("student1", "student123", "student");
                Student student = new Student(studentUser, "李小明");
                student.setStudentId("2024001");
                student.setClassName("计算机2024-1班");
                student.setMajor("计算机科学与技术");
                student.setGrade("2024级");
                student.setEntranceYear(2024);
                student.setGender("男");
                student.setAddress("北京市海淀区");
                student.setEmergencyContact("李父");
                student.setEmergencyPhone("13800138000");
                studentRepository.save(student);
                System.out.println("创建默认学生账号: student1/student123");
            }
            
            // 创建示例课程
            initializeSampleCourses();
            
            // 创建学生课程关联
            initializeStudentCourseRelations();
            
            // 初始化政策文档
            initializePolicyDocuments();
            
            // 更新题目的知识点标记
            updateQuestionKnowledgePoints();
            
            System.out.println("数据初始化完成");
            
        } catch (Exception e) {
            System.err.println("数据初始化失败: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private void initializeSampleCourses() {
        try {
            // 获取默认教师
            java.util.Optional<Teacher> teacherOpt = teacherRepository.findByTeacherCode("T001");
            if (!teacherOpt.isPresent()) {
                System.out.println("未找到默认教师，跳过课程创建");
                return;
            }
            Teacher teacher = teacherOpt.get();
            
            // 检查是否已有示例课程
            if (!courseRepository.existsByCourseCode("SE-9099")) {
                Course course1 = new Course();
                course1.setName("嵌入式Linux开发实践");
                course1.setCourseCode("SE-9099");
                course1.setDescription("暂无课程描述");
                course1.setCredit(3);
                course1.setHours(48);
                course1.setSemester("2025春");
                course1.setTeacher(teacher);
                course1.setMaxStudents(null); // 无限制
                course1.setCurrentStudents(1);
                courseRepository.save(course1);
                System.out.println("创建示例课程: 嵌入式Linux开发实践");
            }
            
            if (!courseRepository.existsByCourseCode("SE-3093")) {
                Course course2 = new Course();
                course2.setName("编程开发");
                course2.setCourseCode("SE-3093");
                course2.setDescription("编程开发");
                course2.setCredit(5);
                course2.setHours(80);
                course2.setSemester("2025春");
                course2.setTeacher(teacher);
                course2.setMaxStudents(null); // 无限制
                course2.setCurrentStudents(0);
                courseRepository.save(course2);
                System.out.println("创建示例课程: 编程开发");
            }
            
            if (!courseRepository.existsByCourseCode("SE-3125")) {
                Course course3 = new Course();
                course3.setName("物理");
                course3.setCourseCode("SE-3125");
                course3.setDescription("暂无课程描述");
                course3.setCredit(1);
                course3.setHours(16);
                course3.setSemester("2025春");
                course3.setTeacher(teacher);
                course3.setMaxStudents(null); // 无限制
                course3.setCurrentStudents(0);
                courseRepository.save(course3);
                System.out.println("创建示例课程: 物理");
            }
            
            
        } catch (Exception e) {
            System.err.println("创建示例课程失败: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private void initializeStudentCourseRelations() {
        try {
            // 获取默认学生
            java.util.Optional<Student> studentOpt = studentRepository.findByStudentId("2024001");
            if (!studentOpt.isPresent()) {
                System.out.println("未找到默认学生，跳过学生课程关联创建");
                return;
            }
            Student student = studentOpt.get();
            
            // 获取示例课程
            Course course = courseRepository.findByCourseCode("SE-9099");
            if (course == null) {
                System.out.println("未找到示例课程，跳过学生课程关联创建");
                return;
            }
            
            // 检查是否已存在关联
            boolean exists = studentCourseRepository.existsByStudentIdAndCourseIdAndStatus(
                student.getId(), course.getId(), "active");
            
            if (!exists) {
                // 创建学生课程关联
                StudentCourse studentCourse = new StudentCourse(student, course);
                studentCourseRepository.save(studentCourse);
                System.out.println("创建学生课程关联: " + student.getRealName() + " - " + course.getName());
            } else {
                System.out.println("学生课程关联已存在，跳过创建");
            }
            
        } catch (Exception e) {
            System.err.println("创建学生课程关联失败: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private void initializePolicyDocuments() {
        try {
            System.out.println("开始初始化政策文档到所有课程...");
            
            // 获取所有现有课程
            java.util.List<Course> allCourses = courseRepository.findAll();
            if (allCourses.isEmpty()) {
                System.out.println("没有找到任何课程，跳过政策文档初始化");
                return;
            }
            
            // 检查是否已经有政策文档（通过文件名判断）
            boolean hasPolicyDocs = knowledgeDocumentRepository.existsByOriginalNameContaining("教育部关于人工智能教育指导意见");
            
            if (hasPolicyDocs) {
                System.out.println("政策文档已存在，跳过初始化");
                return;
            }
            
            // 为每个课程添加政策文档
            for (Course course : allCourses) {
                System.out.println("为课程 '" + course.getName() + "' 添加政策文档...");
                
                addPolicyDocument(course.getId(), "教育部关于人工智能教育指导意见.txt", 
                    "教育部关于推进人工智能教育发展的指导意见，包含AI教育的总体要求、主要目标和重点任务",
                    getPolicyContent1());
                    
                addPolicyDocument(course.getId(), "国家智慧教育平台建设方案.txt",
                    "国家智慧教育平台建设与应用方案，涵盖平台建设目标、技术保障和应用推广", 
                    getPolicyContent2());
                    
                addPolicyDocument(course.getId(), "习近平总书记关于教育数字化重要讲话.txt",
                    "习近平总书记在全国教育数字化工作会议上的重要讲话，阐述了教育数字化的重大意义和基本要求",
                    getPolicyContent3());
                    
                addPolicyDocument(course.getId(), "新时代教育评价改革总体方案.txt",
                    "中共中央国务院印发的新时代教育评价改革总体方案，破除唯分数、唯升学、唯文凭、唯论文、唯帽子的顽瘴痼疾",
                    getPolicyContent4());
                    
                addPolicyDocument(course.getId(), "数字中国建设整体布局规划.txt",
                    "数字中国建设整体布局规划(2023-2035年)，统筹推进数字中国建设的重要文件",
                    getPolicyContent5());
            }
            
            System.out.println("政策文档已添加到所有 " + allCourses.size() + " 个课程中");
            
        } catch (Exception e) {
            System.err.println("初始化政策文档失败: " + e.getMessage());
            e.printStackTrace();
        }
    }

    
    private void addPolicyDocument(Long courseId, String fileName, String description, String content) {
        try {
            // 创建文档记录
            KnowledgeDocument doc = new KnowledgeDocument();
            doc.setCourseId(courseId);
            doc.setOriginalName(fileName);
            doc.setStoredName(fileName);
            doc.setFilePath("database");
            doc.setFileType("txt");
            doc.setFileSize((long)content.length());
            doc.setDescription(description);
            doc.setProcessed(true);
            doc.setUploadedBy(1L);
            doc.setUploadTime(LocalDateTime.now());
            doc.setFileContent(Base64.getEncoder().encodeToString(content.getBytes("UTF-8")));
            
            KnowledgeDocument savedDoc = knowledgeDocumentRepository.save(doc);
            
            // 创建知识块
            String[] chunks = splitIntoChunks(content, fileName);
            int chunkCount = 0;
            
            for (int i = 0; i < chunks.length; i++) {
                if (chunks[i].trim().length() > 50) { // 只保存有意义的块
                    Knowledge knowledge = new Knowledge();
                    knowledge.setCourseId(courseId);
                    knowledge.setFileName(fileName);
                    knowledge.setFilePath("database");
                    knowledge.setChunkId(UUID.randomUUID().toString());
                    knowledge.setContent(chunks[i].trim());
                    knowledge.setChunkIndex(i + 1);
                    knowledge.setProcessed(true);
                    
                    knowledgeRepository.save(knowledge);
                    chunkCount++;
                }
            }
            
            // 更新文档的chunk数量
            savedDoc.setChunksCount(chunkCount);
            knowledgeDocumentRepository.save(savedDoc);
            
            System.out.println("添加政策文档成功: " + fileName + " (共" + chunkCount + "个知识块)");
            
        } catch (Exception e) {
            System.err.println("添加政策文档失败: " + fileName + " - " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private String[] splitIntoChunks(String content, String fileName) {
        // 简单的文档分块策略
        String[] paragraphs = content.split("\n\n+");
        java.util.List<String> chunks = new java.util.ArrayList<>();
        
        StringBuilder currentChunk = new StringBuilder();
        int chunkSize = 500; // 每块500字符左右
        
        for (String paragraph : paragraphs) {
            if (currentChunk.length() + paragraph.length() > chunkSize && currentChunk.length() > 0) {
                chunks.add(currentChunk.toString());
                currentChunk = new StringBuilder();
            }
            
            if (currentChunk.length() > 0) {
                currentChunk.append("\n\n");
            }
            currentChunk.append(paragraph);
        }
        
        if (currentChunk.length() > 0) {
            chunks.add(currentChunk.toString());
        }
        
        return chunks.toArray(new String[0]);
    }
    
    private String getPolicyContent1() {
        return "教育部关于推进人工智能教育发展的指导意见\n" +
               "教发〔2024〕15号\n\n" +
               "各省、自治区、直辖市教育厅（教委），新疆生产建设兵团教育局，部属各高等学校、部省合建各高等学校：\n\n" +
               "为深入贯彻落实党的二十大精神，推动人工智能与教育深度融合，培养适应新时代发展需要的高素质人才，现就推进人工智能教育发展提出如下指导意见。\n\n" +
               "一、总体要求\n\n" +
               "（一）指导思想\n" +
               "以习近平新时代中国特色社会主义思想为指导，全面贯彻党的教育方针，落实立德树人根本任务，坚持科技强国、教育强国、人才强国一体化发展，推动人工智能技术与教育教学深度融合，构建智能化教育生态体系。\n\n" +
               "（二）基本原则\n" +
               "1. 育人为本，德技并修。始终坚持育人为本，将思想政治教育贯穿人工智能教育全过程，培养学生正确的价值观念和伦理道德。\n\n" +
               "2. 创新驱动，融合发展。以创新为第一动力，推动人工智能技术在教育领域的创新应用，促进教育模式变革和质量提升。\n\n" +
               "3. 因材施教，个性化发展。运用人工智能技术实现个性化教学，满足不同学生的学习需求，促进每个学生的全面发展。\n\n" +
               "4. 开放共享，协同育人。构建开放共享的智能教育平台，促进校企合作、产教融合，形成协同育人格局。\n\n" +
               "二、主要目标\n\n" +
               "到2027年，基本形成涵盖学前教育、基础教育、职业教育、高等教育的人工智能教育体系，智能教育基础设施日趋完善，师资队伍建设明显加强，人才培养质量显著提升。\n\n" +
               "到2030年，建成世界一流的智能教育体系，人工智能核心技术人才培养能力大幅提升，为建设教育强国、科技强国、人才强国提供有力支撑。\n\n" +
               "三、重点任务\n\n" +
               "（一）完善人工智能教育课程体系\n" +
               "1. 设置人工智能通识课程。在高等学校普遍开设人工智能通识课程，提高学生的AI素养和应用能力。\n\n" +
               "2. 建设人工智能专业课程。加强计算机科学与技术、软件工程、数据科学与大数据技术等相关专业建设，优化课程设置。\n\n" +
               "3. 推进跨学科融合教育。鼓励人工智能与医学、法学、经济学、教育学等学科交叉融合，培养复合型人才。";
    }
    
    private String getPolicyContent2() {
        return "国家智慧教育平台建设与应用方案\n" +
               "国办发〔2024〕42号\n\n" +
               "为深入贯彻党的二十大关于推进教育数字化的重大部署，加快建设高质量教育体系，现制定国家智慧教育平台建设与应用方案。\n\n" +
               "一、建设目标\n\n" +
               "构建覆盖全国、互联互通、安全可控的国家智慧教育平台体系，为全民终身学习提供有力支撑。到2025年，基本建成功能完备、资源丰富、服务优质的国家智慧教育公共服务体系。\n\n" +
               "二、主要任务\n\n" +
               "（一）完善平台功能架构\n" +
               "1. 国家智慧教育门户\n" +
               "建设统一的国家智慧教育门户网站，提供一站式教育服务入口，实现各级各类教育资源的统一检索和访问。\n\n" +
               "2. 基础教育资源平台\n" +
               "汇聚优质基础教育资源，覆盖各学段各学科，支持个性化学习和因材施教。包括：\n" +
               "- 数字教材和教学资源\n" +
               "- 名师课堂和专递课堂\n" +
               "- 在线答疑和学业辅导\n" +
               "- 综合素质评价工具\n\n" +
               "3. 职业教育资源平台\n" +
               "建设职业教育优质资源库，促进产教融合，包括：\n" +
               "- 虚拟仿真实训资源\n" +
               "- 技能大赛资源库\n" +
               "- 1+X证书培训资源\n" +
               "- 产业人才需求信息\n\n" +
               "4. 高等教育资源平台\n" +
               "汇聚高等教育优质资源，促进教育公平，包括：\n" +
               "- 一流本科课程资源\n" +
               "- 研究生课程资源\n" +
               "- 创新创业教育资源\n" +
               "- 学术交流平台";
    }
    
    private String getPolicyContent3() {
        return "习近平总书记在全国教育数字化工作会议上的重要讲话\n" +
               "（2024年5月18日）\n\n" +
               "同志们：\n\n" +
               "今天，我们召开全国教育数字化工作会议，主要任务是深入学习贯彻党的二十大精神，全面推进教育数字化转型，加快建设教育强国。\n\n" +
               "一、深刻认识教育数字化的重大意义\n\n" +
               "教育数字化是推动教育高质量发展的重要引擎，是建设教育强国的必然要求。我们要从以下几个方面深刻认识其重大意义：\n\n" +
               "（一）教育数字化是时代发展的必然趋势\n" +
               "当今世界，数字技术日新月异，正在深刻改变人类生产生活方式。教育作为培养人才的重要阵地，必须主动适应时代发展要求，积极拥抱数字技术革命。\n\n" +
               "（二）教育数字化是促进教育公平的有效途径\n" +
               "通过数字技术手段，可以让优质教育资源覆盖更广阔的地区，让偏远地区的孩子也能享受到优质教育，这是促进教育公平的重要举措。\n\n" +
               "（三）教育数字化是提升教育质量的重要抓手\n" +
               "数字技术可以实现个性化教学，因材施教，提高教学效率和质量，为每个学生的全面发展提供更好的条件。\n\n" +
               "二、准确把握教育数字化的基本要求\n\n" +
               "推进教育数字化，要坚持正确的方向和原则：\n\n" +
               "（一）坚持育人为本\n" +
               "无论技术如何发展，教育的根本任务始终是立德树人。我们要始终把培养德智体美劳全面发展的社会主义建设者和接班人作为根本目标。\n\n" +
               "（二）坚持系统推进\n" +
               "教育数字化是一项系统工程，涉及理念更新、模式变革、体系重构。要统筹考虑，整体设计，协调推进。\n\n" +
               "（三）坚持创新驱动\n" +
               "要把创新摆在教育数字化发展的核心位置，推动技术创新与教育创新深度融合，不断探索新模式、新方法。";
    }
    
    private String getPolicyContent4() {
        return "中共中央 国务院印发《深化新时代教育评价改革总体方案》\n\n" +
               "新华社北京10月13日电 近日，中共中央、国务院印发了《深化新时代教育评价改革总体方案》，并发出通知，要求各地区各部门结合实际认真贯彻落实。\n\n" +
               "《深化新时代教育评价改革总体方案》全文如下：\n\n" +
               "教育评价事关教育发展方向，有什么样的评价指挥棒，就有什么样的办学导向。为深入贯彻落实习近平总书记关于教育的重要论述和全国教育大会精神，完善立德树人体制机制，扭转不科学的教育评价导向，坚决克服唯分数、唯升学、唯文凭、唯论文、唯帽子的顽瘴痼疾，提高教育治理能力和水平，加快推进教育现代化、建设教育强国、办好人民满意的教育，现制定如下方案。\n\n" +
               "一、总体要求\n\n" +
               "（一）指导思想\n" +
               "以习近平新时代中国特色社会主义思想为指导，全面贯彻党的十九大和十九届二中、三中、四中全会精神，全面贯彻党的教育方针，坚持社会主义办学方向，落实立德树人根本任务，遵循教育规律，系统推进教育评价改革，发展素质教育，引导全社会树立科学的教育发展观、人才成长观、选人用人观，推动构建服务全民终身学习的教育体系，努力培养担当民族复兴大任的时代新人，培养德智体美劳全面发展的社会主义建设者和接班人。\n\n" +
               "（二）主要原则\n" +
               "——坚持立德树人。牢记为党育人、为国育才使命，充分发挥教育评价的育人导向作用，引导确立科学的育人目标，确保教育正确发展方向。\n\n" +
               "——坚持问题导向。从党中央关心、群众关切、社会关注的问题入手，破立并举，推进教育评价关键领域改革取得实质性突破。\n\n" +
               "——坚持科学有效。改进结果评价，强化过程评价，探索增值评价，健全综合评价，充分利用信息技术，提高教育评价的科学性、专业性、客观性。";
    }
    
    private String getPolicyContent5() {
        return "数字中国建设整体布局规划\n" +
               "（2023-2035年）\n\n" +
               "为贯彻落实党的二十大关于加快建设数字中国的重大部署，统筹推进数字中国建设，特制定本规划。\n\n" +
               "一、发展现状与形势\n\n" +
               "党的十八大以来，在习近平总书记关于网络强国的重要思想指引下，我国数字中国建设取得重要进展和显著成效。\n\n" +
               "（一）发展成效\n" +
               "数字基础设施日益完善。建成全球规模最大的光纤和移动宽带网络，5G商用全面推开，算力基础设施体系初步形成。\n\n" +
               "数字经济规模快速增长。数字经济总量跃居世界第二，成为推动经济高质量发展的新动能。\n\n" +
               "数字政务服务效能显著提升。'一网通办''跨省通办'等改革深入推进，数字政府建设成效明显。\n\n" +
               "数字社会建设稳步推进。智慧城市建设持续深入，数字乡村建设全面启动，数字惠民服务不断扩面。\n\n" +
               "数字生态文明建设取得积极进展。数字技术助力绿色发展，数字化绿色化协同发展格局初步形成。\n\n" +
               "（二）面临形势\n" +
               "当前，全球数字化发展进入快车道，数字技术创新空前活跃，数字经济蓬勃发展，数字社会加快构建，数字政府建设提速，数字文明新形态正在形成。\n\n" +
               "同时也要看到，我国数字中国建设仍存在一些短板和不足：关键核心技术受制于人的局面尚未根本改变，数据要素潜能还没有充分释放，数字鸿沟仍然较大，数字治理体系和治理能力有待提升。\n\n" +
               "二、总体要求\n\n" +
               "（一）指导思想\n" +
               "以习近平新时代中国特色社会主义思想为指导，全面贯彻党的二十大精神，完整、准确、全面贯彻新发展理念，加快构建新发展格局，着力推动高质量发展，统筹发展和安全，强化顶层设计和整体布局，把数字中国建设作为数字时代推进中国式现代化的重要引擎。";
    }
    
    private void updateQuestionKnowledgePoints() {
        try {
            System.out.println("开始更新题目知识点标记...");
            
            // 获取所有题目
            java.util.List<Question> allQuestions = questionRepository.findAll();
            
            // 定义知识点映射
            java.util.Map<String, String> knowledgePointMap = new java.util.HashMap<>();
            
            // 编程相关知识点
            knowledgePointMap.put("变量", "变量与数据类型");
            knowledgePointMap.put("函数", "函数与方法");
            knowledgePointMap.put("循环", "循环结构");
            knowledgePointMap.put("条件", "条件判断");
            knowledgePointMap.put("数组", "数组与集合");
            knowledgePointMap.put("字符串", "字符串处理");
            knowledgePointMap.put("面向对象", "面向对象编程");
            knowledgePointMap.put("继承", "继承与多态");
            knowledgePointMap.put("封装", "封装与抽象");
            knowledgePointMap.put("算法", "算法与数据结构");
            knowledgePointMap.put("排序", "排序算法");
            knowledgePointMap.put("搜索", "搜索算法");
            knowledgePointMap.put("递归", "递归算法");
            knowledgePointMap.put("动态规划", "动态规划");
            knowledgePointMap.put("图论", "图论算法");
            knowledgePointMap.put("树", "树结构");
            knowledgePointMap.put("哈希", "哈希表");
            knowledgePointMap.put("栈", "栈与队列");
            knowledgePointMap.put("队列", "栈与队列");
            knowledgePointMap.put("链表", "链表结构");
            
            // 物理相关知识点
            knowledgePointMap.put("牛顿", "牛顿定律");
            knowledgePointMap.put("力学", "经典力学");
            knowledgePointMap.put("运动", "运动学");
            knowledgePointMap.put("能量", "能量守恒");
            knowledgePointMap.put("动量", "动量守恒");
            knowledgePointMap.put("电学", "电学基础");
            knowledgePointMap.put("磁学", "磁学基础");
            knowledgePointMap.put("光学", "光学基础");
            knowledgePointMap.put("热学", "热学基础");
            knowledgePointMap.put("波动", "波动光学");
            knowledgePointMap.put("量子", "量子力学");
            knowledgePointMap.put("相对论", "相对论");
            knowledgePointMap.put("电磁", "电磁学");
            knowledgePointMap.put("振动", "振动与波");
            knowledgePointMap.put("流体", "流体力学");
            
            // 嵌入式相关知识点
            knowledgePointMap.put("Linux", "Linux系统");
            knowledgePointMap.put("内核", "内核编程");
            knowledgePointMap.put("驱动", "设备驱动");
            knowledgePointMap.put("GPIO", "GPIO控制");
            knowledgePointMap.put("中断", "中断处理");
            knowledgePointMap.put("定时器", "定时器应用");
            knowledgePointMap.put("通信", "通信协议");
            knowledgePointMap.put("串口", "串口通信");
            knowledgePointMap.put("I2C", "I2C通信");
            knowledgePointMap.put("SPI", "SPI通信");
            knowledgePointMap.put("ARM", "ARM架构");
            knowledgePointMap.put("嵌入式", "嵌入式系统");
            knowledgePointMap.put("实时", "实时系统");
            knowledgePointMap.put("硬件", "硬件接口");
            knowledgePointMap.put("传感器", "传感器应用");
            
            int updatedCount = 0;
            
            for (Question question : allQuestions) {
                String currentKnowledgePoint = question.getKnowledgePoint();
                
                // 如果当前知识点为空或者是"通用知识点"，则尝试从题目内容中提取
                if (currentKnowledgePoint == null || currentKnowledgePoint.trim().isEmpty() || 
                    "通用知识点".equals(currentKnowledgePoint)) {
                    
                    String questionContent = question.getContent();
                    String detectedKnowledgePoint = "通用知识点";
                    
                    // 尝试从题目内容中匹配知识点
                    for (java.util.Map.Entry<String, String> entry : knowledgePointMap.entrySet()) {
                        if (questionContent.contains(entry.getKey())) {
                            detectedKnowledgePoint = entry.getValue();
                            break;
                        }
                    }
                    
                    question.setKnowledgePoint(detectedKnowledgePoint);
                    questionRepository.save(question);
                    updatedCount++;
                    
                    System.out.println("更新题目ID " + question.getId() + " 的知识点为: " + detectedKnowledgePoint);
                }
            }
            
            System.out.println("题目知识点更新完成，共更新了 " + updatedCount + " 个题目");
            
        } catch (Exception e) {
            System.err.println("更新题目知识点失败: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * 初始化基础知识库
     */
    private void initializeBaseKnowledge() {
        try {
            System.out.println("开始初始化基础知识库（政策文档）...");
            baseKnowledgeService.initializeBaseKnowledge();
            System.out.println("基础知识库初始化完成");
        } catch (Exception e) {
            System.err.println("初始化基础知识库失败: " + e.getMessage());
            e.printStackTrace();
        }
    }
} 