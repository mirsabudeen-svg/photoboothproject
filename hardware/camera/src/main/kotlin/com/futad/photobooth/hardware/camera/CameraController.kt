package com.futad.photobooth.hardware.camera

import android.graphics.Bitmap
import androidx.camera.view.LifecycleCameraController
import androidx.lifecycle.LifecycleOwner
import java.io.File

enum class CameraFacing {
    FRONT,
    BACK,
}

interface CameraController {
    suspend fun bind(lifecycleOwner: LifecycleOwner, facing: CameraFacing = CameraFacing.FRONT): Result<Unit>
    fun getCameraController(): LifecycleCameraController?
    suspend fun capturePhoto(outputFile: File): Result<File>
    suspend fun captureBurstFrames(count: Int, outputDir: File): Result<List<File>>
    suspend fun unbind()
}
