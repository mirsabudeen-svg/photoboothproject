package com.futad.photobooth.feature.sync

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.futad.photobooth.core.database.dao.UploadQueueDao
import com.futad.photobooth.core.domain.model.SyncStatus
import com.futad.photobooth.core.domain.repository.CaptureRepository
import com.futad.photobooth.core.network.PhotoboothApi
import com.futad.photobooth.core.network.dto.CompleteCaptureRequest
import com.futad.photobooth.core.network.dto.CreateCaptureRequest
import com.futad.photobooth.core.data.store.DeviceCredentialsStore
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.asRequestBody
import java.io.File

@HiltWorker
class UploadWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val captureRepository: CaptureRepository,
    private val uploadQueueDao: UploadQueueDao,
    private val api: PhotoboothApi,
    private val credentialsStore: DeviceCredentialsStore,
    private val okHttpClient: OkHttpClient,
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val token = credentialsStore.getToken() ?: return Result.retry()
        val deviceId = credentialsStore.getDeviceId() ?: return Result.retry()
        val auth = "Bearer $token"
        val queued = captureRepository.getQueuedCaptures()
        for (capture in queued) {
            captureRepository.updateSyncStatus(capture.captureId, SyncStatus.UPLOADING)
            val create = api.createCapture(
                auth = auth,
                request = CreateCaptureRequest(
                    eventId = capture.eventId,
                    captureType = capture.captureType.name,
                    idempotencyKey = capture.idempotencyKey,
                    deviceId = deviceId,
                ),
            )
            val file = File(capture.compositePath ?: capture.localMediaPath)
            if (!file.exists()) {
                captureRepository.updateSyncStatus(capture.captureId, SyncStatus.FAILED)
                continue
            }
            val putRequest = Request.Builder()
                .url(create.uploadUrl)
                .put(file.asRequestBody("image/jpeg".toMediaType()))
                .build()
            val putResponse = okHttpClient.newCall(putRequest).execute()
            if (!putResponse.isSuccessful) {
                captureRepository.updateSyncStatus(capture.captureId, SyncStatus.FAILED)
                continue
            }
            api.completeCapture(
                auth = auth,
                captureId = create.captureId,
                request = CompleteCaptureRequest(
                    idempotencyKey = capture.idempotencyKey,
                    objectKey = create.objectKey,
                ),
            )
            captureRepository.updateSyncStatus(capture.captureId, SyncStatus.SYNCED)
        }
        return Result.success()
    }

    companion object {
        const val WORK_NAME = "upload_sync_worker"
    }
}

@HiltWorker
class ShareSyncWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val shareRepository: com.futad.photobooth.core.domain.repository.ShareRepository,
    private val api: PhotoboothApi,
    private val credentialsStore: DeviceCredentialsStore,
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val token = credentialsStore.getToken() ?: return Result.retry()
        val auth = "Bearer $token"
        val pending = shareRepository.getPendingShares()
        for (share in pending) {
            if (share.channel != com.futad.photobooth.core.domain.model.ShareChannel.SMS) continue
            val destination = share.destination ?: continue
            api.createShare(
                auth = auth,
                request = com.futad.photobooth.core.network.dto.CreateShareRequest(
                    captureId = share.captureId,
                    channel = share.channel.name,
                    destination = destination,
                    idempotencyKey = share.idempotencyKey,
                ),
            )
            shareRepository.updateShareStatus(share.shareId, com.futad.photobooth.core.domain.model.ShareStatus.SENT)
        }
        return Result.success()
    }

    companion object {
        const val WORK_NAME = "share_sync_worker"
    }
}
