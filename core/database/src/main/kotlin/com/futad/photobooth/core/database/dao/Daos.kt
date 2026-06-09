package com.futad.photobooth.core.database.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.futad.photobooth.core.database.entity.AnalyticsEntity
import com.futad.photobooth.core.database.entity.CaptureEntity
import com.futad.photobooth.core.database.entity.ConsentEntity
import com.futad.photobooth.core.database.entity.EventEntity
import com.futad.photobooth.core.database.entity.PrintJobEntity
import com.futad.photobooth.core.database.entity.ShareIntentEntity
import com.futad.photobooth.core.database.entity.UploadQueueEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface EventDao {
    @Query("SELECT * FROM events WHERE isActive = 1 LIMIT 1")
    fun observeActiveEvent(): Flow<EventEntity?>

    @Query("SELECT * FROM events WHERE isActive = 1 LIMIT 1")
    suspend fun getActiveEvent(): EventEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(event: EventEntity)

    @Query("UPDATE events SET isActive = 0")
    suspend fun deactivateAll()

    @Query("UPDATE events SET isActive = 1 WHERE eventId = :eventId")
    suspend fun activate(eventId: String)

    @Query("SELECT * FROM events WHERE eventId = :eventId")
    suspend fun getById(eventId: String): EventEntity?
}

@Dao
interface CaptureDao {
    @Query("SELECT * FROM captures WHERE eventId = :eventId ORDER BY createdAt DESC")
    fun observeForEvent(eventId: String): Flow<List<CaptureEntity>>

    @Query("SELECT * FROM captures WHERE captureId = :captureId")
    suspend fun getById(captureId: String): CaptureEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(capture: CaptureEntity)

    @Query("UPDATE captures SET syncStatus = :status WHERE captureId = :captureId")
    suspend fun updateSyncStatus(captureId: String, status: String)

    @Query("SELECT * FROM captures WHERE eventId = :eventId ORDER BY createdAt DESC")
    suspend fun getAllForEvent(eventId: String): List<CaptureEntity>

    @Query("SELECT * FROM captures WHERE syncStatus IN ('QUEUED', 'FAILED') ORDER BY createdAt ASC")
    suspend fun getQueued(): List<CaptureEntity>
}

@Dao
interface ShareIntentDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(share: ShareIntentEntity)

    @Query("SELECT * FROM share_intents WHERE status IN ('PENDING', 'QUEUED', 'FAILED') ORDER BY createdAt ASC")
    suspend fun getPending(): List<ShareIntentEntity>

    @Query("UPDATE share_intents SET status = :status WHERE shareId = :shareId")
    suspend fun updateStatus(shareId: String, status: String)
}

@Dao
interface PrintJobDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(job: PrintJobEntity)

    @Update
    suspend fun update(job: PrintJobEntity)

    @Query("SELECT * FROM print_jobs WHERE status IN ('QUEUED', 'FAILED') AND retryCount < 3 ORDER BY queuedAt ASC")
    suspend fun getQueued(): List<PrintJobEntity>
}

@Dao
interface ConsentDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(consent: ConsentEntity)

    @Query("SELECT * FROM consent_records WHERE sessionId = :sessionId LIMIT 1")
    suspend fun getBySession(sessionId: String): ConsentEntity?
}

@Dao
interface UploadQueueDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(item: UploadQueueEntity)

    @Query("SELECT * FROM upload_queue WHERE status IN ('PENDING', 'FAILED') ORDER BY priority DESC, createdAt ASC")
    suspend fun getPending(): List<UploadQueueEntity>

    @Query("UPDATE upload_queue SET status = :status, attemptedAt = :attemptedAt WHERE queueId = :queueId")
    suspend fun updateStatus(queueId: String, status: String, attemptedAt: Long?)

    @Query("UPDATE upload_queue SET status = 'COMPLETED', completedAt = :completedAt WHERE queueId = :queueId")
    suspend fun markCompleted(queueId: String, completedAt: Long)
}

@Dao
interface AnalyticsDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(entity: AnalyticsEntity)

    @Query("SELECT * FROM analytics WHERE uploadStatus = 'PENDING' ORDER BY timestamp ASC LIMIT 100")
    suspend fun getPending(): List<AnalyticsEntity>

    @Query("UPDATE analytics SET uploadStatus = 'UPLOADED' WHERE analyticsId = :id")
    suspend fun markUploaded(id: String)
}
