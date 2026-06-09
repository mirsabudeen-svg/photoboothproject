package com.futad.photobooth.feature.ai

import android.content.Context
import android.graphics.Bitmap
import android.graphics.ColorMatrix
import android.graphics.ColorMatrixColorFilter
import android.graphics.Paint
import android.graphics.Canvas
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

enum class FilterPreset(val displayName: String) {
    NONE("Original"),
    GRAYSCALE("Grayscale"),
    SEPIA("Sepia"),
    VINTAGE("Vintage"),
    BEAUTY("Beauty"),
}

@Singleton
class FilterProcessor @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    fun apply(bitmap: Bitmap, preset: FilterPreset): Bitmap {
        if (preset == FilterPreset.NONE) return bitmap
        if (preset == FilterPreset.BEAUTY) return BeautyProcessor.apply(bitmap)
        val output = Bitmap.createBitmap(bitmap.width, bitmap.height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(output)
        val paint = Paint(Paint.ANTI_ALIAS_FLAG)
        paint.colorFilter = ColorMatrixColorFilter(matrixFor(preset))
        canvas.drawBitmap(bitmap, 0f, 0f, paint)
        return output
    }

    private fun matrixFor(preset: FilterPreset): ColorMatrix = when (preset) {
        FilterPreset.GRAYSCALE -> ColorMatrix().apply { setSaturation(0f) }
        FilterPreset.SEPIA -> ColorMatrix(
            floatArrayOf(
                0.393f, 0.769f, 0.189f, 0f, 0f,
                0.349f, 0.686f, 0.168f, 0f, 0f,
                0.272f, 0.534f, 0.131f, 0f, 0f,
                0f, 0f, 0f, 1f, 0f,
            ),
        )
        FilterPreset.VINTAGE -> ColorMatrix().apply { setScale(1.1f, 1.0f, 0.9f, 1f) }
        else -> ColorMatrix()
    }
}

object BeautyProcessor {
    fun apply(source: Bitmap): Bitmap {
        // Lightweight on-device enhancement; TFLite model can replace this path
        val output = Bitmap.createBitmap(source.width, source.height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(output)
        val paint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG)
        canvas.drawBitmap(source, 0f, 0f, paint)
        return output
    }
}

@Singleton
class BackgroundSegmentationProcessor @Inject constructor() {
    fun removeBackground(source: Bitmap): Bitmap {
        // MVP passthrough — quantized segmentation model hooks here
        return source.copy(source.config ?: Bitmap.Config.ARGB_8888, true)
    }
}
