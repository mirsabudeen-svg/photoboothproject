package com.futad.photobooth.hardware.camera

import android.content.Context
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.view.LifecycleCameraController
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.suspendCancellableCoroutine
import timber.log.Timber
import java.io.File
import javax.inject.Inject
import javax.inject.Singleton
import kotlin.coroutines.resume

@Singleton
class CameraXController @Inject constructor(
    @ApplicationContext private val context: Context,
) : CameraController {
    private var controller: LifecycleCameraController? = null
    private var facing: CameraFacing = CameraFacing.FRONT

    override suspend fun bind(lifecycleOwner: LifecycleOwner, facing: CameraFacing): Result<Unit> = runCatching {
        this.facing = facing
        val camController = LifecycleCameraController(context).apply {
            cameraSelector = if (facing == CameraFacing.FRONT) {
                CameraSelector.DEFAULT_FRONT_CAMERA
            } else {
                CameraSelector.DEFAULT_BACK_CAMERA
            }
            setEnabledUseCases(LifecycleCameraController.IMAGE_CAPTURE)
            bindToLifecycle(lifecycleOwner)
        }
        controller = camController
    }

    override fun getCameraController(): LifecycleCameraController? = controller

    override suspend fun capturePhoto(outputFile: File): Result<File> = suspendCancellableCoroutine { cont ->
        val cam = controller ?: run {
            cont.resume(Result.failure(IllegalStateException("Camera not bound")))
            return@suspendCancellableCoroutine
        }
        val outputOptions = ImageCapture.OutputFileOptions.Builder(outputFile).build()
        cam.takePicture(
            outputOptions,
            ContextCompat.getMainExecutor(context),
            object : ImageCapture.OnImageSavedCallback {
                override fun onImageSaved(output: ImageCapture.OutputFileResults) {
                    cont.resume(Result.success(outputFile))
                }

                override fun onError(exception: ImageCaptureException) {
                    Timber.e(exception, "Capture failed")
                    cont.resume(Result.failure(exception))
                }
            },
        )
    }

    override suspend fun captureBurstFrames(count: Int, outputDir: File): Result<List<File>> = runCatching {
        outputDir.mkdirs()
        val files = mutableListOf<File>()
        repeat(count) { index ->
            val file = File(outputDir, "burst_${System.currentTimeMillis()}_$index.jpg")
            capturePhoto(file).getOrThrow()
            files.add(file)
        }
        files
    }

    override suspend fun unbind() {
        controller?.unbind()
        controller = null
    }
}
