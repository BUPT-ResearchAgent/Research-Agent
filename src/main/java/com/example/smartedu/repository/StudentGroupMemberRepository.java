package com.example.smartedu.repository;

import com.example.smartedu.entity.StudentGroupMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentGroupMemberRepository extends JpaRepository<StudentGroupMember, Long> {
    
    /**
     * 根据分组ID查找所有成员
     */
    List<StudentGroupMember> findByStudentGroupIdAndStatus(Long studentGroupId, String status);
    
    /**
     * 根据学生ID查找所有分组成员记录
     */
    List<StudentGroupMember> findByStudentIdAndStatus(Long studentId, String status);
    
    /**
     * 根据分组ID和学生ID查找成员记录
     */
    Optional<StudentGroupMember> findByStudentGroupIdAndStudentId(Long studentGroupId, Long studentId);
    
    /**
     * 根据课程ID查找所有分组成员
     */
    @Query("SELECT sgm FROM StudentGroupMember sgm JOIN sgm.studentGroup sg WHERE sg.courseId = :courseId AND sgm.status = :status")
    List<StudentGroupMember> findByCourseIdAndStatus(@Param("courseId") Long courseId, @Param("status") String status);
    
    /**
     * 统计分组的成员数量
     */
    long countByStudentGroupIdAndStatus(Long studentGroupId, String status);
    
    /**
     * 检查学生是否已经在该课程的某个分组中
     */
    @Query("SELECT sgm FROM StudentGroupMember sgm JOIN sgm.studentGroup sg WHERE sg.courseId = :courseId AND sgm.studentId = :studentId AND sgm.status = :status")
    Optional<StudentGroupMember> findByStudentIdAndCourseId(@Param("studentId") Long studentId, @Param("courseId") Long courseId, @Param("status") String status);
    
    /**
     * 根据学生ID和课程ID查找分组成员记录列表
     */
    @Query("SELECT sgm FROM StudentGroupMember sgm JOIN sgm.studentGroup sg WHERE sgm.studentId = :studentId AND sg.courseId = :courseId AND sgm.status = :status")
    List<StudentGroupMember> findByStudentIdAndCourseIdAndStatus(@Param("studentId") Long studentId, @Param("courseId") Long courseId, @Param("status") String status);
    
    /**
     * 根据分组ID删除所有成员
     */
    void deleteByStudentGroupId(Long studentGroupId);
} 