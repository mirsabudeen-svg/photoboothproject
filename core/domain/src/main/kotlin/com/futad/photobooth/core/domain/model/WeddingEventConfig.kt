package com.futad.photobooth.core.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class WeddingEventConfig(
    val brideName: String = "",
    val groomName: String = "",
    val themeId: String = "luxury_gold",
    val hashtag: String? = null,
    val logoUrl: String? = null,
    val primaryColor: String = "#FFD700",
    val secondaryColor: String = "#FFFFFF",
    val consentText: String = "I consent to having my photo taken and shared at this event.",
    val templateId: String = "4x6_postcard",
)

@Serializable
data class Event(
    val eventId: String,
    val eventName: String,
    val eventType: String = "WEDDING",
    val config: WeddingEventConfig,
    val serverVersion: Long = 0,
    val isActive: Boolean = true,
    val updatedAt: Long,
)
