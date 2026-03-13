package com.flowdesk.repository;

import com.flowdesk.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface TicketRepository extends JpaRepository<Ticket, UUID> {

    @Query("""
            SELECT t FROM Ticket t
            LEFT JOIN FETCH t.assignee
            JOIN FETCH t.reporter
            WHERE t.project = :project
              AND (:status IS NULL OR t.status = :status)
              AND (:type IS NULL OR t.type = :type)
              AND (:assigneeId IS NULL OR t.assignee.id = :assigneeId)
            ORDER BY t.position ASC
            """)
    List<Ticket> findBacklog(
            @Param("project") Project project,
            @Param("status") TicketStatus status,
            @Param("type") TicketType type,
            @Param("assigneeId") UUID assigneeId
    );

    List<Ticket> findByProject(Project project);

    @Query("SELECT COALESCE(MAX(t.position), -1) FROM Ticket t WHERE t.project = :project")
    int findMaxPositionByProject(@Param("project") Project project);
}
