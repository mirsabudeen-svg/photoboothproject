package com.futad.photobooth.core.domain.usecase

import com.futad.photobooth.core.domain.model.Capture
import com.futad.photobooth.core.domain.model.CaptureType
import com.futad.photobooth.core.domain.model.SyncStatus
import com.futad.photobooth.core.domain.repository.CaptureRepository
import com.futad.photobooth.core.domain.repository.EventRepository
import java.util.UUID

class SaveCaptureUseCase(
    private val captureRepository: CaptureRepository,
    private val eventRepository: EventRepository,
) {
    suspend operator fun invoke(
        captureType: CaptureType,
        localMediaPath: String,
        compositePath: String? = null,
        filterApplied: String? = null,
    ): Capture? {
        val event = eventRepository.getActiveEvent() ?: return null
        val capture = Capture(
            captureId = UUID.randomUUID().toString(),
            eventId = event.eventId,
            idempotencyKey = UUID.randomUUID().toString(),
            captureType = captureType,
            localMediaPath = localMediaPath,
            compositePath = compositePath,
            filterApplied = filterApplied,
            syncStatus = SyncStatus.QUEUED,
            createdAt = System.currentTimeMillis(),
        )
        captureRepository.saveCapture(capture)
        return capture
    }
}
