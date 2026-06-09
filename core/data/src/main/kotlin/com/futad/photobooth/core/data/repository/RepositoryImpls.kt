package com.futad.photobooth.core.data.repository

import com.futad.photobooth.core.data.mapper.toDomain
import com.futad.photobooth.core.data.mapper.toEntity
import com.futad.photobooth.core.database.dao.CaptureDao
import com.futad.photobooth.core.database.dao.ConsentDao
import com.futad.photobooth.core.database.dao.EventDao
import com.futad.photobooth.core.database.dao.PrintJobDao
import com.futad.photobooth.core.database.dao.ShareIntentDao
import com.futad.photobooth.core.database.entity.ConsentEntity
import com.futad.photobooth.core.domain.model.Event
import com.futad.photobooth.core.domain.model.PrintJob
import com.futad.photobooth.core.domain.model.ShareIntent
import com.futad.photobooth.core.domain.model.SyncStatus
import com.futad.photobooth.core.domain.repository.CaptureRepository
import com.futad.photobooth.core.domain.repository.ConsentRepository
import com.futad.photobooth.core.domain.repository.EventRepository
import com.futad.photobooth.core.domain.repository.PrintRepository
import com.futad.photobooth.core.domain.repository.ShareRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class EventRepositoryImpl @Inject constructor(
    private val eventDao: EventDao,
) : EventRepository {
    override fun observeActiveEvent(): Flow<Event?> =
        eventDao.observeActiveEvent().map { it?.toDomain() }

    override suspend fun getActiveEvent(): Event? =
        eventDao.getActiveEvent()?.toDomain()

    override suspend fun saveEvent(event: Event) {
        eventDao.insert(event.toEntity())
    }

    override suspend fun setActiveEvent(eventId: String) {
        eventDao.deactivateAll()
        eventDao.activate(eventId)
    }
}

@Singleton
class CaptureRepositoryImpl @Inject constructor(
    private val captureDao: CaptureDao,
) : CaptureRepository {
    override fun observeCapturesForEvent(eventId: String) =
        captureDao.observeForEvent(eventId).map { list -> list.map { it.toDomain() } }

    override suspend fun getCapture(captureId: String) =
        captureDao.getById(captureId)?.toDomain()

    override suspend fun saveCapture(capture: com.futad.photobooth.core.domain.model.Capture) {
        captureDao.insert(capture.toEntity())
    }

    override suspend fun updateSyncStatus(captureId: String, status: SyncStatus) {
        captureDao.updateSyncStatus(captureId, status.name)
    }

    override suspend fun getQueuedCaptures() =
        captureDao.getQueued().map { it.toDomain() }

    override suspend fun getCapturesForEvent(eventId: String) =
        captureDao.getAllForEvent(eventId).map { it.toDomain() }
}

@Singleton
class ShareRepositoryImpl @Inject constructor(
    private val shareIntentDao: ShareIntentDao,
) : ShareRepository {
    override suspend fun enqueueShare(share: ShareIntent) {
        shareIntentDao.insert(share.toEntity())
    }

    override suspend fun getPendingShares() =
        shareIntentDao.getPending().map { it.toDomain() }

    override suspend fun updateShareStatus(shareId: String, status: com.futad.photobooth.core.domain.model.ShareStatus) {
        shareIntentDao.updateStatus(shareId, status.name)
    }
}

@Singleton
class PrintRepositoryImpl @Inject constructor(
    private val printJobDao: PrintJobDao,
) : PrintRepository {
    override suspend fun enqueuePrint(job: PrintJob) {
        printJobDao.insert(job.toEntity())
    }

    override suspend fun getQueuedPrintJobs() =
        printJobDao.getQueued().map { it.toDomain() }

    override suspend fun updatePrintJob(job: PrintJob) {
        printJobDao.update(job.toEntity())
    }
}

@Singleton
class ConsentRepositoryImpl @Inject constructor(
    private val consentDao: ConsentDao,
) : ConsentRepository {
    override suspend fun recordConsent(eventId: String, sessionId: String, accepted: Boolean, timestamp: Long) {
        consentDao.insert(
            ConsentEntity(
                sessionId = sessionId,
                eventId = eventId,
                accepted = accepted,
                timestamp = timestamp,
            ),
        )
    }

    override suspend fun hasConsentForSession(sessionId: String): Boolean =
        consentDao.getBySession(sessionId)?.accepted == true
}
