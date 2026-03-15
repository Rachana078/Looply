package com.flowdesk.repository;

import com.flowdesk.domain.Ticket;
import com.flowdesk.domain.TicketHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TicketHistoryRepository extends JpaRepository<TicketHistory, UUID> {
    List<TicketHistory> findByTicketOrderByChangedAtDesc(Ticket ticket);
}
