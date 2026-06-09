package com.futad.photobooth.feature.admin

import android.content.Context
import java.io.File
import java.io.PrintWriter
import java.io.StringWriter
import dagger.hilt.android.qualifiers.ApplicationContext
import java.io.File
import java.io.PrintWriter
import java.io.StringWriter
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CrashReportingManager @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private val crashDir: File
        get() = File(context.filesDir, "crashes").apply { mkdirs() }

    fun logException(throwable: Throwable) {
        val sw = StringWriter()
        throwable.printStackTrace(PrintWriter(sw))
        val file = File(crashDir, "crash_${System.currentTimeMillis()}.txt")
        file.writeText(sw.toString())
    }

    fun pendingCrashReports(): List<File> = crashDir.listFiles()?.toList().orEmpty()

    fun clearReports() {
        crashDir.listFiles()?.forEach { it.delete() }
    }
}

@Singleton
class SessionWatchdog @Inject constructor() {
    private var lastProgressMs: Long = System.currentTimeMillis()

    fun heartbeat() {
        lastProgressMs = System.currentTimeMillis()
    }

    fun isStalled(timeoutMs: Long = 120_000): Boolean =
        System.currentTimeMillis() - lastProgressMs > timeoutMs
}
