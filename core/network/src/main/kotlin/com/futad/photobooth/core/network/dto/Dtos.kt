package com.futad.photobooth.core.network.dto

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

@Serializable
data class PairDeviceRequest(
    val pairingCode: String,
    val deviceName: String,
    val deviceModel: String,
)

@Serializable
data class PairDeviceResponse(
    val deviceId: String,
    val accessToken: String,
    val expiresAt: String? = null,
)

@Serializable
data class RefreshTokenResponse(
    val accessToken: String,
    val expiresAt: String,
)

@Serializable
data class EventConfigResponse(
    val eventId: String,
    val eventName: String,
    val eventType: String,
    val config: JsonElement,
    val serverVersion: Long,
)

@Serializable
data class CreateCaptureRequest(
    val eventId: String,
    val captureType: String,
    val idempotencyKey: String,
    val deviceId: String,
    val contentType: String = "image/jpeg",
)

@Serializable
data class CreateCaptureResponse(
    val captureId: String,
    val uploadUrl: String,
    val objectKey: String,
)

@Serializable
data class CompleteCaptureRequest(
    val idempotencyKey: String,
    val objectKey: String,
)

@Serializable
data class CompleteCaptureResponse(
    val captureId: String,
    val status: String,
    val galleryUrl: String? = null,
)

@Serializable
data class CreateShareRequest(
    val captureId: String,
    val channel: String,
    val destination: String?,
    val idempotencyKey: String,
)

@Serializable
data class AnalyticsBatchRequest(
    val deviceId: String,
    val eventId: String,
    val events: List<AnalyticsEventDto>,
)

@Serializable
data class AnalyticsEventDto(
    val eventType: String,
    val properties: Map<String, String>,
    val timestamp: Long,
)
