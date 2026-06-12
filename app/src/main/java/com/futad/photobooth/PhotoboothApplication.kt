package com.futad.photobooth

import android.app.Application
import androidx.hilt.work.HiltWorkerFactory
import androidx.work.Configuration
import com.futad.photobooth.feature.sync.SyncScheduler
import dagger.hilt.android.HiltAndroidApp
import timber.log.Timber
import javax.inject.Inject

@HiltAndroidApp
class PhotoboothApplication : Application(), Configuration.Provider {

    @Inject lateinit var workerFactory: HiltWorkerFactory
    @Inject lateinit var syncScheduler: SyncScheduler
    @Inject lateinit var crashReportingManager: com.futad.photobooth.feature.admin.CrashReportingManager

    override fun onCreate() {
        super.onCreate()
        if (BuildConfig.DEBUG) {
            Timber.plant(Timber.DebugTree())
        }
        Thread.setDefaultUncaughtExceptionHandler { _, throwable ->
            crashReportingManager.logException(throwable)
            throw throwable
        }
        syncScheduler.scheduleUploadSync()
        syncScheduler.scheduleShareSync()
    }

    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder()
            .setWorkerFactory(workerFactory)
            .setMinimumLoggingLevel(
                if (BuildConfig.DEBUG) android.util.Log.DEBUG else android.util.Log.INFO,
            )
            .build()
}
