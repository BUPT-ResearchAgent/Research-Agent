package com.example.smartedu.repository;

import com.example.smartedu.entity.StudentGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentGroupRepository extends JpaRepository<StudentGroup, Long> {
    
    /**
     * 根据课程ID查找所有分组
     */
    List<StudentGroup> findByCourseIdAndStatus(Long courseId, String status);
    
    /**
     * 根据课程ID查找所有分组（包括非活跃的）
     */
    List<StudentGroup> findByCourseId(Long courseId);
    
    /**
     * 根据教师ID查找所有分组
     */
    List<StudentGroup> findByTeacherIdAndStatus(Long teacherId, String status);
    
    /**
     * 根据课程ID和分组名称查找分组
     */
    StudentGroup findByCourseIdAndGroupName(Long courseId, String groupName);
    
    /**
     * 根据课程ID、分组名称和状态查找分组
     */
    java.util.Optional<StudentGroup> findByCourseIdAndGroupNameAndStatus(Long courseId, String groupName, String status);
    
    /**
     * 统计课程的分组数量
     */
    @Query("SELECT COUNT(sg) FROM StudentGroup sg WHERE sg.courseId = :courseId AND sg.status = :status")
    long countByCourseIdAndStatus(@Param("courseId") Long courseId, @Param("status") String status);
    
    /**
     * 查找有空位的分组
     */
    @Query("SELECT sg FROM StudentGroup sg WHERE sg.courseId = :courseId AND sg.status = :status AND sg.currentSize < sg.maxSize")
    List<StudentGroup> findAvailableGroups(@Param("courseId") Long courseId, @Param("status") String status);
} 