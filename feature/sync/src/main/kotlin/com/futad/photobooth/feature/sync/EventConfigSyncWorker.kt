package com.futad.photobooth.feature.sync

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequest
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkerParameters
import androidx.work.workDataOf
import com.futad.photobooth.core.data.repository.RemoteEventsRepository
import com.futad.photobooth.core.data.store.EventConfigDataStore
import com.futad.photobooth.core.domain.model.Event
import com.futad.photobooth.core.domain.model.WeddingEventConfig
import com.futad.photobooth.core.domain.repository.EventRepository
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import java.util.concurrent.TimeUnit

@HiltWorker
class EventConfigSyncWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val remoteEventsRepository: RemoteEventsRepository,
    private val eventConfigDataStore: EventConfigDataStore,
    private val eventRepository: EventRepository,
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val eventId = inputData.getString(KEY_EVENT_ID) ?: return@withContext Result.failure()
        return@withContext try {
            val remote = remoteEventsRepository.fetchConfig(eventId)
            val localVersion = eventConfigDataStore.getVersion()
            if (remote.serverVersion > localVersion) {
                eventConfigDataStore.save(remote.config.toString(), remote.serverVersion.toInt())
                val weddingConfig = json.decodeFromString<WeddingEventConfig>(remote.config.toString())
                val active = eventRepository.getActiveEvent()
                if (active?.eventId == eventId) {
                    eventRepository.saveEvent(
                        Event(
                            eventId = eventId,
                            eventName = remote.eventName,
                            eventType = remote.eventType,
                            config = weddingConfig,
                            serverVersion = remote.serverVersion,
                            isActive = true,
                            updatedAt = System.currentTimeMillis(),
                        ),
                    )
                }
            }
            Result.success()
        } catch (e: Exception) {
            if (runAttemptCount < 3) Result.retry() else Result.failure()
        }
    }

    companion object {
        const val WORK_NAME = "event_config_sync"
        const val KEY_EVENT_ID = "event_id"
        private val json = Json { ignoreUnknownKeys = true }

        fun oneTimeRequest(eventId: String) =
            OneTimeWorkRequestBuilder<EventConfigSyncWorker>()
                .setInputData(workDataOf(KEY_EVENT_ID to eventId))
                .setConstraints(
                    Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build(),
                )
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
                .build()

        fun periodicRequest(eventId: String): PeriodicWorkRequest =
            PeriodicWorkRequestBuilder<EventConfigSyncWorker>(15, TimeUnit.MINUTES)
                .setInputData(workDataOf(KEY_EVENT_ID to eventId))
                .setConstraints(
                    Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build(),
                )
                .build()
    }
}
