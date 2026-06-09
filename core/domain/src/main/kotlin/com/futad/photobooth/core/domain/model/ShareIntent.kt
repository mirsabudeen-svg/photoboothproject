package com.futad.photobooth.core.domain.model

data class ShareIntent(
    val shareId: String,
    val captureId: String,
    val channel: ShareChannel,
    val destination: String? = null,
    val status: ShareStatus = ShareStatus.PENDING,
    val idempotencyKey: String,
    val createdAt: Long,
)
