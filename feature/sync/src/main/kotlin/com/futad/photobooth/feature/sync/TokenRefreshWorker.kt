package com.futad.photobooth.feature.sync

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.futad.photobooth.core.data.store.DeviceCredentialsStore
import com.futad.photobooth.core.network.PhotoboothApi
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import java.util.concurrent.TimeUnit

@HiltWorker
class TokenRefreshWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val api: PhotoboothApi,
    private val credentialsStore: DeviceCredentialsStore,
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val token = credentialsStore.getToken() ?: return Result.success()
        val expiresAt = credentialsStore.getTokenExpiresAt() ?: return Result.success()
        val fourteenDaysMs = 14L * 86_400_000L
        if (expiresAt - System.currentTimeMillis() > fourteenDaysMs) {
            return Result.success()
        }
        return try {
            val response = api.refreshDeviceToken("Bearer $token")
            credentialsStore.saveToken(response.accessToken, credentialsStore.getDeviceId() ?: return Result.failure())
            credentialsStore.saveTokenExpiresAt(response.expiresAt)
            Result.success()
        } catch (e: Exception) {
            if (runAttemptCount < 3) Result.retry() else Result.failure()
        }
    }

    companion object {
        const val WORK_NAME = "token_refresh_worker"

        fun schedule(context: Context) {
            val request = PeriodicWorkRequestBuilder<TokenRefreshWorker>(7, TimeUnit.DAYS).build()
            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                request,
            )
        }
    }
}
