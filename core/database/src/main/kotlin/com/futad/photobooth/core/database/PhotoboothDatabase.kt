package com.futad.photobooth.core.database

import androidx.room.Database
import androidx.room.RoomDatabase
import com.futad.photobooth.core.database.dao.AnalyticsDao
import com.futad.photobooth.core.database.dao.CaptureDao
import com.futad.photobooth.core.database.dao.ConsentDao
import com.futad.photobooth.core.database.dao.EventDao
import com.futad.photobooth.core.database.dao.PrintJobDao
import com.futad.photobooth.core.database.dao.ShareIntentDao
import com.futad.photobooth.core.database.dao.UploadQueueDao
import com.futad.photobooth.core.database.entity.AnalyticsEntity
import com.futad.photobooth.core.database.entity.CaptureEntity
import com.futad.photobooth.core.database.entity.ConsentEntity
import com.futad.photobooth.core.database.entity.EventEntity
import com.futad.photobooth.core.database.entity.PrintJobEntity
import com.futad.photobooth.core.database.entity.ShareIntentEntity
import com.futad.photobooth.core.database.entity.UploadQueueEntity

@Database(
    entities = [
        EventEntity::class,
        CaptureEntity::class,
        ShareIntentEntity::class,
        PrintJobEntity::class,
        ConsentEntity::class,
        UploadQueueEntity::class,
        AnalyticsEntity::class,
    ],
    version = 1,
    exportSchema = false,
)
abstract class PhotoboothDatabase : RoomDatabase() {
    abstract fun eventDao(): EventDao
    abstract fun captureDao(): CaptureDao
    abstract fun shareIntentDao(): ShareIntentDao
    abstract fun printJobDao(): PrintJobDao
    abstract fun consentDao(): ConsentDao
    abstract fun uploadQueueDao(): UploadQueueDao
    abstract fun analyticsDao(): AnalyticsDao
}
