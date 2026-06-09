package com.futad.photobooth.ui

import android.graphics.BitmapFactory
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.futad.photobooth.core.domain.model.CaptureType
import com.futad.photobooth.core.domain.model.Event
import com.futad.photobooth.core.domain.model.ShareChannel
import com.futad.photobooth.core.domain.repository.CaptureRepository
import com.futad.photobooth.core.domain.repository.EventRepository
import com.futad.photobooth.core.domain.repository.PrintRepository
import com.futad.photobooth.core.domain.usecase.EnqueueShareUseCase
import com.futad.photobooth.core.domain.usecase.SaveCaptureUseCase
import com.futad.photobooth.feature.ai.FilterPreset
import com.futad.photobooth.feature.ai.FilterProcessor
import com.futad.photobooth.feature.capture.CaptureResult
import com.futad.photobooth.feature.overlay.LayoutCompositor
import com.futad.photobooth.feature.printing.PrintQueueManager
import com.futad.photobooth.feature.sharing.IntentSharer
import com.futad.photobooth.feature.sharing.LocalMediaServer
import com.futad.photobooth.feature.sync.SyncScheduler
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.io.File
import javax.inject.Inject

@HiltViewModel
class MainViewModel @Inject constructor(
    private val eventRepository: EventRepository,
    private val captureRepository: CaptureRepository,
    private val printRepository: PrintRepository,
    private val saveCaptureUseCase: SaveCaptureUseCase,
    private val enqueueShareUseCase: EnqueueShareUseCase,
    private val layoutCompositor: LayoutCompositor,
    private val filterProcessor: FilterProcessor,
    private val printQueueManager: PrintQueueManager,
    private val localMediaServer: LocalMediaServer,
    private val intentSharer: IntentSharer,
    private val syncScheduler: SyncScheduler,
) : ViewModel() {

    val activeEvent = eventRepository.observeActiveEvent()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)

    var uploadQueueCount: Int = 0
        private set
    var printQueueCount: Int = 0
        private set

    var lastCompositePath: String? = null
        private set

    init {
        localMediaServer.startServer()
        viewModelScope.launch {
            rehydrateLocalMediaServer()
            refreshQueueCounts()
        }
    }

    suspend fun saveEvent(event: Event) {
        eventRepository.saveEvent(event)
        eventRepository.setActiveEvent(event.eventId)
    }

    suspend fun processCapture(result: CaptureResult): String {
        val event = eventRepository.getActiveEvent() ?: return result.localPath
        val isPhoto = result.captureType == CaptureType.PHOTO || result.captureType == CaptureType.MULTI_SHOT
        val deliverablePath = if (isPhoto) {
            val bitmap = BitmapFactory.decodeFile(result.localPath) ?: return result.localPath
            val filtered = filterProcessor.apply(bitmap, FilterPreset.BEAUTY)
            if (filtered !== bitmap) bitmap.recycle()
            val filteredPath = File(File(result.localPath).parent, "filtered_${System.currentTimeMillis()}.jpg")
            java.io.FileOutputStream(filteredPath).use {
                filtered.compress(android.graphics.Bitmap.CompressFormat.JPEG, 90, it)
            }
            filtered.recycle()
            val compositeFile = File(filteredPath.parentFile, "composite_${System.currentTimeMillis()}.jpg")
            layoutCompositor.compose(listOf(filteredPath.absolutePath), event.config, compositeFile)
            compositeFile.absolutePath
        } else {
            result.localPath
        }

        lastCompositePath = deliverablePath
        val capture = saveCaptureUseCase(
            captureType = result.captureType,
            localMediaPath = result.localPath,
            compositePath = deliverablePath,
            filterApplied = if (isPhoto) FilterPreset.BEAUTY.name else null,
        ) ?: return result.localPath

        localMediaServer.registerMedia(capture.captureId, File(deliverablePath))
        if (isPhoto) {
            printQueueManager.enqueue(
                captureId = capture.captureId,
                eventId = event.eventId,
                bitmapPath = deliverablePath,
            )
        }
        syncScheduler.scheduleUploadNow()
        refreshQueueCounts()
        return capture.captureId
    }

    suspend fun enqueueSmsShare(captureId: String, destination: String?) {
        if (destination.isNullOrBlank()) return
        enqueueShareUseCase(captureId, ShareChannel.SMS, destination)
        syncScheduler.scheduleShareNow()
        refreshQueueCounts()
    }

    fun shareWhatsApp(file: File) = intentSharer.shareWhatsApp(file)
    fun shareEmail(file: File) = intentSharer.shareEmail(file)

    private suspend fun rehydrateLocalMediaServer() {
        val event = eventRepository.getActiveEvent() ?: return
        captureRepository.getCapturesForEvent(event.eventId).forEach { capture ->
            val path = capture.compositePath ?: capture.localMediaPath
            val file = File(path)
            if (file.exists()) localMediaServer.registerMedia(capture.captureId, file)
        }
    }

    private suspend fun refreshQueueCounts() {
        uploadQueueCount = captureRepository.getQueuedCaptures().size
        printQueueCount = printRepository.getQueuedPrintJobs().size
    }
}
