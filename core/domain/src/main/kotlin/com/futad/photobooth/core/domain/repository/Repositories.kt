package com.futad.photobooth.core.domain.repository

import com.futad.photobooth.core.domain.model.Capture
import com.futad.photobooth.core.domain.model.Event
import com.futad.photobooth.core.domain.model.SyncStatus
import kotlinx.coroutines.flow.Flow

interface EventRepository {
    fun observeActiveEvent(): Flow<Event?>
    suspend fun getActiveEvent(): Event?
    suspend fun saveEvent(event: Event)
    suspend fun setActiveEvent(eventId: String)
}

interface CaptureRepository {
    fun observeCapturesForEvent(eventId: String): Flow<List<Capture>>
    suspend fun getCapture(captureId: String): Capture?
    suspend fun saveCapture(capture: Capture)
    suspend fun updateSyncStatus(captureId: String, status: SyncStatus)
    suspend fun getQueuedCaptures(): List<Capture>
    suspend fun getCapturesForEvent(eventId: String): List<Capture>
}

interface ShareRepository {
    suspend fun enqueueShare(share: com.futad.photobooth.core.domain.model.ShareIntent)
    suspend fun getPendingShares(): List<com.futad.photobooth.core.domain.model.ShareIntent>
    suspend fun updateShareStatus(shareId: String, status: com.futad.photobooth.core.domain.model.ShareStatus)
}

interface PrintRepository {
    suspend fun enqueuePrint(job: com.futad.photobooth.core.domain.model.PrintJob)
    suspend fun getQueuedPrintJobs(): List<com.futad.photobooth.core.domain.model.PrintJob>
    suspend fun updatePrintJob(job: com.futad.photobooth.core.domain.model.PrintJob)
}

interface ConsentRepository {
    suspend fun recordConsent(eventId: String, sessionId: String, accepted: Boolean, timestamp: Long)
    suspend fun hasConsentForSession(sessionId: String): Boolean
}
