package com.futad.photobooth.core.domain.model

data class Capture(
    val captureId: String,
    val eventId: String,
    val idempotencyKey: String,
    val captureType: CaptureType,
    val localMediaPath: String,
    val compositePath: String? = null,
    val filterApplied: String? = null,
    val syncStatus: SyncStatus = SyncStatus.QUEUED,
    val createdAt: Long,
)
