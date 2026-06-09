package com.futad.photobooth.core.domain.usecase

import com.futad.photobooth.core.domain.model.ShareChannel
import com.futad.photobooth.core.domain.model.ShareIntent
import com.futad.photobooth.core.domain.model.ShareStatus
import com.futad.photobooth.core.domain.repository.ShareRepository
import java.util.UUID

class EnqueueShareUseCase(
    private val shareRepository: ShareRepository,
) {
    suspend operator fun invoke(
        captureId: String,
        channel: ShareChannel,
        destination: String? = null,
    ): ShareIntent {
        val share = ShareIntent(
            shareId = UUID.randomUUID().toString(),
            captureId = captureId,
            channel = channel,
            destination = destination,
            status = ShareStatus.PENDING,
            idempotencyKey = UUID.randomUUID().toString(),
            createdAt = System.currentTimeMillis(),
        )
        shareRepository.enqueueShare(share)
        return share
    }
}
