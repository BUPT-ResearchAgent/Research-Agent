package com.example.smartedu.service;

import com.example.smartedu.entity.*;
import com.example.smartedu.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;

@Service
@Transactional
public class MessageService {
    
    @Autowired
    private MessageRepository messageRepository;
    
    @Autowired
    private TeacherRepository teacherRepository;
    
    @Autowired
    private StudentRepository studentRepository;
    
    @Autowired
    private StudentCourseRepository studentCourseRepository;
    
    @Autowired
    private CourseRepository courseRepository;
    
    /**
     * 发送消息
     */
    public Message sendMessage(Long senderId, String senderType, 
                              Long receiverId, String receiverType, 
                              Long courseId, String content) {
        // 验证发送者和接收者的权限
        if (!hasPermissionToChat(senderId, senderType, receiverId, receiverType, courseId)) {
            throw new RuntimeException("您没有权限与该用户聊天");
        }
        
        // 获取发送者和接收者姓名
        String senderName = getUserName(senderId, senderType);
        String receiverName = getUserName(receiverId, receiverType);
        
        if (senderName == null || receiverName == null) {
            throw new RuntimeException("发送者或接收者信息不存在");
        }
        
        // 创建消息
        Message message = new Message(senderId, senderType, senderName,
                                    receiverId, receiverType, receiverName,
                                    courseId, content);
        
        return messageRepository.save(message);
    }
    
    /**
     * 获取两个用户之间的对话记录
     */
    public List<Message> getConversation(Long userId1, String userType1,
                                        Long userId2, String userType2) {
        return messageRepository.findConversation(userId1, userType1, userId2, userType2);
    }
    
    /**
     * 获取用户的所有对话列表
     */
    public List<Map<String, Object>> getUserConversations(Long userId, String userType) {
        List<Message> latestMessages = messageRepository.findUserConversations(userId, userType);
        List<Map<String, Object>> conversations = new ArrayList<>();
        
        for (Message message : latestMessages) {
            Map<String, Object> conversation = new HashMap<>();
            
            // 确定对话伙伴
            if (message.getSenderId().equals(userId) && message.getSenderType().equals(userType)) {
                // 当前用户是发送者，对话伙伴是接收者
                conversation.put("partnerId", message.getReceiverId());
                conversation.put("partnerType", message.getReceiverType());
                conversation.put("partnerName", message.getReceiverName());
            } else {
                // 当前用户是接收者，对话伙伴是发送者
                conversation.put("partnerId", message.getSenderId());
                conversation.put("partnerType", message.getSenderType());
                conversation.put("partnerName", message.getSenderName());
            }
            
            conversation.put("lastMessage", message.getContent());
            conversation.put("lastMessageTime", message.getSentAt());
            conversation.put("courseId", message.getCourseId());
            
            // 获取未读消息数量
            Long partnerId = (Long) conversation.get("partnerId");
            String partnerType = (String) conversation.get("partnerType");
            Long unreadCount = messageRepository.countUnreadMessagesInConversation(
                userId, userType, partnerId, partnerType);
            conversation.put("unreadCount", unreadCount);
            
            conversations.add(conversation);
        }
        
        return conversations;
    }
    
    /**
     * 获取用户未读消息总数
     */
    public Long getUnreadMessageCount(Long userId, String userType) {
        return messageRepository.countUnreadMessages(userId, userType);
    }
    
    /**
     * 标记对话为已读
     */
    public void markConversationAsRead(Long receiverId, String receiverType,
                                      Long senderId, String senderType) {
        messageRepository.markConversationAsRead(receiverId, receiverType, senderId, senderType);
    }
    
    /**
     * 获取课程中可以聊天的用户列表
     */
    public List<Map<String, Object>> getChatableUsers(Long userId, String userType, Long courseId) {
        List<Map<String, Object>> users = new ArrayList<>();
        
        if ("TEACHER".equals(userType)) {
            // 根据User ID获取Teacher ID
            Optional<Teacher> teacherOpt = teacherRepository.findByUserId(userId);
            if (!teacherOpt.isPresent()) {
                return users;
            }
            
            // 教师可以和该课程的所有活跃学生聊天
            List<StudentCourse> studentCourses = studentCourseRepository.findByCourseIdAndStatus(courseId, "active");
            
            for (StudentCourse sc : studentCourses) {
                Student student = sc.getStudent();
                
                if (student.getUser() != null) {
                    Map<String, Object> user = new HashMap<>();
                    user.put("id", student.getUser().getId()); // 使用User ID而不是Student ID
                    user.put("userType", "STUDENT");
                    user.put("name", student.getRealName());
                    user.put("username", student.getUser().getUsername()); // 添加用户名
                    user.put("className", student.getClassName());
                    user.put("studentId", student.getStudentId());
                    users.add(user);
                }
            }
        } else if ("STUDENT".equals(userType)) {
            // 根据User ID获取Student ID
            Optional<Student> studentOpt = studentRepository.findByUserId(userId);
            if (!studentOpt.isPresent()) {
                return users;
            }
            Long studentId = studentOpt.get().getId();
            
            // 学生可以和课程教师以及同课程的其他学生聊天
            
            // 添加课程教师
            Optional<Course> courseOpt = courseRepository.findById(courseId);
            if (courseOpt.isPresent()) {
                Course course = courseOpt.get();
                Teacher teacher = course.getTeacher();
                if (teacher != null && teacher.getUser() != null) {
                    Map<String, Object> user = new HashMap<>();
                    user.put("id", teacher.getUser().getId()); // 使用User ID而不是Teacher ID
                    user.put("userType", "TEACHER");
                    user.put("name", teacher.getRealName());
                    user.put("username", teacher.getUser().getUsername()); // 添加用户名
                    user.put("title", teacher.getTitle());
                    user.put("department", teacher.getDepartment());
                    users.add(user);
                }
            }
            
            // 添加同课程的其他活跃学生
            List<StudentCourse> studentCourses = studentCourseRepository.findByCourseIdAndStatus(courseId, "active");
            for (StudentCourse sc : studentCourses) {
                Student student = sc.getStudent();
                if (!student.getId().equals(studentId) && student.getUser() != null) { // 排除自己
                    Map<String, Object> user = new HashMap<>();
                    user.put("id", student.getUser().getId()); // 使用User ID而不是Student ID
                    user.put("userType", "STUDENT");
                    user.put("name", student.getRealName());
                    user.put("username", student.getUser().getUsername()); // 添加用户名
                    user.put("className", student.getClassName());
                    user.put("studentId", student.getStudentId());
                    users.add(user);
                }
            }
        }
        
        return users;
    }
    
    /**
     * 验证聊天权限
     */
    private boolean hasPermissionToChat(Long senderId, String senderType, 
                                       Long receiverId, String receiverType, 
                                       Long courseId) {
        // 验证发送者和接收者是否存在
        if (!userExists(senderId, senderType) || !userExists(receiverId, receiverType)) {
            return false;
        }
        
        // 验证课程权限
        if (courseId != null) {
            return hasCoursePermission(senderId, senderType, courseId) && 
                   hasCoursePermission(receiverId, receiverType, courseId);
        }
        
        return true;
    }
    
    /**
     * 验证用户是否存在
     */
    private boolean userExists(Long userId, String userType) {
        if ("TEACHER".equals(userType)) {
            return teacherRepository.findByUserId(userId).isPresent();
        } else if ("STUDENT".equals(userType)) {
            return studentRepository.findByUserId(userId).isPresent();
        }
        return false;
    }
    
    /**
     * 验证用户是否有课程权限
     */
    private boolean hasCoursePermission(Long userId, String userType, Long courseId) {
        if ("TEACHER".equals(userType)) {
            // 根据User ID获取Teacher，然后验证是否是课程的授课教师
            Optional<Teacher> teacherOpt = teacherRepository.findByUserId(userId);
            if (!teacherOpt.isPresent()) return false;
            
            Optional<Course> courseOpt = courseRepository.findById(courseId);
            return courseOpt.isPresent() && 
                   courseOpt.get().getTeacher().getId().equals(teacherOpt.get().getId());
        } else if ("STUDENT".equals(userType)) {
            // 根据User ID获取Student ID，然后验证是否选修了该课程
            Optional<Student> studentOpt = studentRepository.findByUserId(userId);
            if (!studentOpt.isPresent()) return false;
            
            return studentCourseRepository.existsByStudentIdAndCourseId(studentOpt.get().getId(), courseId);
        }
        return false;
    }
    
    /**
     * 获取用户姓名
     */
    private String getUserName(Long userId, String userType) {
        if ("TEACHER".equals(userType)) {
            Optional<Teacher> teacherOpt = teacherRepository.findByUserId(userId);
            return teacherOpt.map(Teacher::getRealName).orElse(null);
        } else if ("STUDENT".equals(userType)) {
            Optional<Student> studentOpt = studentRepository.findByUserId(userId);
            return studentOpt.map(Student::getRealName).orElse(null);
        }
        return null;
    }
    
    /**
     * 获取用户的课程列表（用于确定可以聊天的课程范围）
     */
    public List<Map<String, Object>> getUserCourses(Long userId, String userType) {
        List<Map<String, Object>> courses = new ArrayList<>();
        
        if ("TEACHER".equals(userType)) {
            // 根据User ID获取Teacher
            Optional<Teacher> teacherOpt = teacherRepository.findByUserId(userId);
            if (teacherOpt.isPresent()) {
                List<Course> teacherCourses = courseRepository.findByTeacher(teacherOpt.get());
                for (Course course : teacherCourses) {
                    Map<String, Object> courseInfo = new HashMap<>();
                    courseInfo.put("id", course.getId());
                    courseInfo.put("name", course.getName());
                    courseInfo.put("courseCode", course.getCourseCode());
                    courseInfo.put("semester", course.getSemester());
                    courses.add(courseInfo);
                }
            }
        } else if ("STUDENT".equals(userType)) {
            // 根据User ID获取Student ID
            Optional<Student> studentOpt = studentRepository.findByUserId(userId);
            if (studentOpt.isPresent()) {
                Long studentId = studentOpt.get().getId();
                // 只获取活跃状态的课程
                List<StudentCourse> studentCourses = studentCourseRepository.findByStudentIdAndStatus(studentId, "active");
                for (StudentCourse sc : studentCourses) {
                    Course course = sc.getCourse();
                    Map<String, Object> courseInfo = new HashMap<>();
                    courseInfo.put("id", course.getId());
                    courseInfo.put("name", course.getName());
                    courseInfo.put("courseCode", course.getCourseCode());
                    courseInfo.put("semester", course.getSemester());
                    courseInfo.put("teacherName", course.getTeacher().getRealName());
                    courses.add(courseInfo);
                }
            }
        }
        
        return courses;
    }
} 