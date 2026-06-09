package com.futad.photobooth.core.data.mapper

import com.futad.photobooth.core.database.entity.CaptureEntity
import com.futad.photobooth.core.database.entity.EventEntity
import com.futad.photobooth.core.database.entity.PrintJobEntity
import com.futad.photobooth.core.database.entity.ShareIntentEntity
import com.futad.photobooth.core.domain.model.Capture
import com.futad.photobooth.core.domain.model.CaptureType
import com.futad.photobooth.core.domain.model.Event
import com.futad.photobooth.core.domain.model.PrintJob
import com.futad.photobooth.core.domain.model.PrintStatus
import com.futad.photobooth.core.domain.model.ShareChannel
import com.futad.photobooth.core.domain.model.ShareIntent
import com.futad.photobooth.core.domain.model.ShareStatus
import com.futad.photobooth.core.domain.model.SyncStatus
import com.futad.photobooth.core.domain.model.WeddingEventConfig
import kotlinx.serialization.json.Json

private val json = Json { ignoreUnknownKeys = true }

fun EventEntity.toDomain(): Event = Event(
    eventId = eventId,
    eventName = eventName,
    eventType = eventType,
    config = json.decodeFromString(WeddingEventConfig.serializer(), configJson),
    serverVersion = serverVersion,
    isActive = isActive,
    updatedAt = updatedAt,
)

fun Event.toEntity(): EventEntity = EventEntity(
    eventId = eventId,
    eventName = eventName,
    eventType = eventType,
    configJson = json.encodeToString(WeddingEventConfig.serializer(), config),
    serverVersion = serverVersion,
    isActive = isActive,
    updatedAt = updatedAt,
)

fun CaptureEntity.toDomain(): Capture = Capture(
    captureId = captureId,
    eventId = eventId,
    idempotencyKey = idempotencyKey,
    captureType = CaptureType.valueOf(captureType),
    localMediaPath = localMediaPath,
    compositePath = compositePath,
    filterApplied = filterApplied,
    syncStatus = SyncStatus.valueOf(syncStatus),
    createdAt = createdAt,
)

fun Capture.toEntity(): CaptureEntity = CaptureEntity(
    captureId = captureId,
    eventId = eventId,
    idempotencyKey = idempotencyKey,
    captureType = captureType.name,
    localMediaPath = localMediaPath,
    compositePath = compositePath,
    filterApplied = filterApplied,
    syncStatus = syncStatus.name,
    createdAt = createdAt,
)

fun ShareIntentEntity.toDomain(): ShareIntent = ShareIntent(
    shareId = shareId,
    captureId = captureId,
    channel = ShareChannel.valueOf(channel),
    destination = destination,
    status = ShareStatus.valueOf(status),
    idempotencyKey = idempotencyKey,
    createdAt = createdAt,
)

fun ShareIntent.toEntity(): ShareIntentEntity = ShareIntentEntity(
    shareId = shareId,
    captureId = captureId,
    channel = channel.name,
    destination = destination,
    status = status.name,
    idempotencyKey = idempotencyKey,
    createdAt = createdAt,
)

fun PrintJobEntity.toDomain(): PrintJob = PrintJob(
    jobId = jobId,
    captureId = captureId,
    eventId = eventId,
    printerType = printerType,
    layoutTemplate = layoutTemplate,
    printSize = printSize,
    copyCount = copyCount,
    status = PrintStatus.valueOf(status),
    queuedAt = queuedAt,
    retryCount = retryCount,
    errorMessage = errorMessage,
)

fun PrintJob.toEntity(): PrintJobEntity = PrintJobEntity(
    jobId = jobId,
    captureId = captureId,
    eventId = eventId,
    printerType = printerType,
    layoutTemplate = layoutTemplate,
    printSize = printSize,
    copyCount = copyCount,
    status = status.name,
    queuedAt = queuedAt,
    retryCount = retryCount,
    errorMessage = errorMessage,
)
