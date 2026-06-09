package com.futad.photobooth.core.database.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "events")
data class EventEntity(
    @PrimaryKey val eventId: String,
    val eventName: String,
    val eventType: String = "WEDDING",
    val configJson: String,
    val serverVersion: Long = 0,
    val isActive: Boolean = true,
    val updatedAt: Long,
)

@Entity(tableName = "captures")
data class CaptureEntity(
    @PrimaryKey val captureId: String,
    val eventId: String,
    val idempotencyKey: String,
    val captureType: String,
    val localMediaPath: String,
    val compositePath: String?,
    val filterApplied: String?,
    val syncStatus: String,
    val createdAt: Long,
)

@Entity(tableName = "share_intents")
data class ShareIntentEntity(
    @PrimaryKey val shareId: String,
    val captureId: String,
    val channel: String,
    val destination: String?,
    val status: String,
    val idempotencyKey: String,
    val createdAt: Long,
)

@Entity(tableName = "print_jobs")
data class PrintJobEntity(
    @PrimaryKey val jobId: String,
    val captureId: String,
    val eventId: String,
    val printerType: String,
    val layoutTemplate: String,
    val printSize: String,
    val copyCount: Int = 1,
    val status: String,
    val queuedAt: Long,
    val startedAt: Long? = null,
    val completedAt: Long? = null,
    val errorMessage: String? = null,
    val retryCount: Int = 0,
)

@Entity(tableName = "consent_records")
data class ConsentEntity(
    @PrimaryKey val sessionId: String,
    val eventId: String,
    val accepted: Boolean,
    val timestamp: Long,
)

@Entity(tableName = "upload_queue")
data class UploadQueueEntity(
    @PrimaryKey val queueId: String,
    val captureId: String,
    val uploadType: String,
    val filePath: String?,
    val payload: String?,
    val status: String,
    val priority: Int = 0,
    val idempotencyKey: String,
    val createdAt: Long,
    val attemptedAt: Long? = null,
    val completedAt: Long? = null,
    val errorMessage: String? = null,
    val retryCount: Int = 0,
    val nextRetryAt: Long? = null,
)

@Entity(tableName = "analytics")
data class AnalyticsEntity(
    @PrimaryKey val analyticsId: String,
    val eventId: String,
    val deviceId: String,
    val eventType: String,
    val properties: String,
    val timestamp: Long,
    val uploadStatus: String = "PENDING",
)
