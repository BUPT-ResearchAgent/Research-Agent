package com.example.smartedu.repository;

import com.example.smartedu.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    /**
     * 根据用户名查找用户
     */
    Optional<User> findByUsername(String username);
    
    /**
     * 根据用户名和角色查找用户
     */
    Optional<User> findByUsernameAndRole(String username, String role);
    
    /**
     * 检查用户名是否存在
     */
    boolean existsByUsername(String username);
    
    /**
     * 根据角色查找用户
     */
    List<User> findByRole(String role);
    
    /**
     * 根据状态查找用户
     */
    List<User> findByStatus(String status);
    
    /**
     * 根据角色和状态查找用户
     */
    List<User> findByRoleAndStatus(String role, String status);
    
    /**
     * 根据用户名模糊查询
     */
    @Query("SELECT u FROM User u WHERE u.username LIKE %:username%")
    List<User> findByUsernameContaining(@Param("username") String username);
    
    /**
     * 统计用户数量
     */
    @Query("SELECT COUNT(u) FROM User u")
    long countAllUsers();
    
    /**
     * 根据角色统计用户数量
     */
    long countByRole(String role);
    
    /**
     * 根据状态统计用户数量
     */
    long countByStatus(String status);
} 