package com.futad.photobooth.feature.capture

import android.content.Context
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.futad.photobooth.core.domain.model.CaptureType
import com.futad.photobooth.feature.capture.util.BoomerangEncoder
import com.futad.photobooth.feature.capture.util.GifEncoder
import com.futad.photobooth.hardware.camera.CameraController
import com.futad.photobooth.hardware.camera.CameraFacing
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.withContext
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.io.File
import javax.inject.Inject

data class CaptureResult(
    val localPath: String,
    val captureType: CaptureType,
)

@HiltViewModel
class CaptureViewModel @Inject constructor(
    private val cameraController: CameraController,
    @ApplicationContext private val context: Context,
) : ViewModel() {
    private val _uiState = MutableStateFlow(CaptureUiState())
    val uiState: StateFlow<CaptureUiState> = _uiState.asStateFlow()

    fun getCameraController() = cameraController.getCameraController()

    fun bindCamera(lifecycleOwner: LifecycleOwner) {
        viewModelScope.launch {
            cameraController.bind(lifecycleOwner, CameraFacing.FRONT)
            _uiState.value = _uiState.value.copy(phase = CapturePhase.MODE_SELECT)
        }
    }

    fun unbindCamera() {
        viewModelScope.launch { cameraController.unbind() }
    }

    fun selectMode(type: CaptureType) {
        _uiState.value = _uiState.value.copy(selectedMode = type, phase = CapturePhase.READY)
    }

    fun startCountdown() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(phase = CapturePhase.COUNTDOWN)
            for (i in 3 downTo 1) {
                _uiState.value = _uiState.value.copy(countdown = i)
                delay(1000)
            }
            _uiState.value = _uiState.value.copy(countdown = 0)
            capture()
        }
    }

    private suspend fun capture() {
        val mode = _uiState.value.selectedMode ?: CaptureType.PHOTO
        val mediaDir = File(context.filesDir, "captures").apply { mkdirs() }
        val result = runCatching {
            when (mode) {
                CaptureType.PHOTO, CaptureType.MULTI_SHOT -> {
                    val file = File(mediaDir, "photo_${System.currentTimeMillis()}.jpg")
                    cameraController.capturePhoto(file).getOrThrow().absolutePath
                }
                CaptureType.GIF -> {
                    val frames = cameraController.captureBurstFrames(5, File(mediaDir, "gif_frames")).getOrThrow()
                    withContext(Dispatchers.Default) {
                        GifEncoder.encode(frames, File(mediaDir, "anim_${System.currentTimeMillis()}.gif")).absolutePath
                    }
                }
                CaptureType.BOOMERANG -> {
                    val frames = cameraController.captureBurstFrames(8, File(mediaDir, "boomerang_frames")).getOrThrow()
                    withContext(Dispatchers.Default) {
                        BoomerangEncoder.encode(frames, File(mediaDir, "boomerang_${System.currentTimeMillis()}.gif")).absolutePath
                    }
                }
            }
        }
        result.onSuccess { path ->
            _uiState.value = _uiState.value.copy(phase = CapturePhase.PREVIEW, previewPath = path)
        }.onFailure {
            _uiState.value = _uiState.value.copy(
                phase = CapturePhase.READY,
                errorMessage = it.message ?: "Capture failed",
            )
        }
    }

    fun retake() {
        _uiState.value = _uiState.value.copy(
            phase = CapturePhase.READY,
            previewPath = null,
            errorMessage = null,
        )
    }

    fun confirmCapture(onComplete: (CaptureResult) -> Unit) {
        val path = _uiState.value.previewPath ?: return
        val type = _uiState.value.selectedMode ?: CaptureType.PHOTO
        onComplete(CaptureResult(localPath = path, captureType = type))
    }

    data class CaptureUiState(
        val phase: CapturePhase = CapturePhase.INITIALIZING,
        val selectedMode: CaptureType? = null,
        val countdown: Int = 3,
        val previewPath: String? = null,
        val errorMessage: String? = null,
    )

    enum class CapturePhase {
        INITIALIZING,
        MODE_SELECT,
        READY,
        COUNTDOWN,
        PREVIEW,
    }
}
