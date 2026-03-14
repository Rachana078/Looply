package com.flowdesk.service;

import com.flowdesk.domain.Notification;
import com.flowdesk.domain.User;
import com.flowdesk.dto.NotificationResponse;
import com.flowdesk.repository.NotificationRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messaging;

    public NotificationService(NotificationRepository notificationRepository,
                                SimpMessagingTemplate messaging) {
        this.notificationRepository = notificationRepository;
        this.messaging = messaging;
    }

    /** Create a notification and push it over WebSocket to the recipient. */
    public void notify(User recipient, User actor, String type, String title, String body, String link) {
        if (recipient.getId().equals(actor != null ? actor.getId() : null)) return; // no self-notify

        Notification n = new Notification();
        n.setUser(recipient);
        n.setActor(actor);
        n.setType(type);
        n.setTitle(title);
        n.setBody(body);
        n.setLink(link);
        Notification saved = notificationRepository.save(n);

        messaging.convertAndSend(
            "/topic/users/" + recipient.getId() + "/notifications",
            toResponse(saved)
        );
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> list(UUID userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public long unreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    public void markRead(UUID notificationId, UUID userId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            if (n.getUser().getId().equals(userId)) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        });
    }

    public void markAllRead(UUID userId) {
        notificationRepository.markAllReadByUser(userId);
    }

    private NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(
                n.getId(), n.getType(), n.getTitle(), n.getBody(), n.getLink(), n.isRead(),
                n.getActor() != null ? n.getActor().getUsername() : null,
                n.getCreatedAt()
        );
    }
}
